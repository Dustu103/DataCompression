#pragma once

#include <vector>
#include <array>
#include <queue>
#include <memory>
#include <algorithm>
#include <cstdint>
#include <stdexcept>
#include <string>
#include "../../common/bit_stream.hpp"

namespace compression::huffman {

struct HuffmanNode {
    uint8_t symbol = 0;
    uint64_t freq = 0;
    std::unique_ptr<HuffmanNode> left;
    std::unique_ptr<HuffmanNode> right;

    bool is_leaf() const { return !left && !right; }
};

struct CompareNode {
    bool operator()(const std::unique_ptr<HuffmanNode>& a, const std::unique_ptr<HuffmanNode>& b) const {
        if (a->freq != b->freq) {
            return a->freq > b->freq; // Min-heap: lowest frequency first
        }
        // Deterministic tie-breaker
        return a->symbol > b->symbol;
    }
};

// Traverse tree to extract code lengths
inline void extract_lengths(const HuffmanNode* node, uint8_t depth, std::array<uint8_t, 256>& lengths) {
    if (!node) return;
    if (node->is_leaf()) {
        lengths[node->symbol] = (depth == 0) ? 1 : depth;
        return;
    }
    extract_lengths(node->left.get(), depth + 1, lengths);
    extract_lengths(node->right.get(), depth + 1, lengths);
}

// Generate Canonical Huffman codes strictly from code lengths
inline void generate_canonical_codes(const std::array<uint8_t, 256>& lengths,
                                     std::array<uint32_t, 256>& codes) {
    std::fill(codes.begin(), codes.end(), 0);

    // Group symbols by length
    std::array<std::vector<uint8_t>, 33> length_groups;
    for (int sym = 0; sym < 256; ++sym) {
        if (lengths[sym] > 0) {
            if (lengths[sym] > 32) throw std::runtime_error("Huffman code length exceeds 32 bits");
            length_groups[lengths[sym]].push_back(static_cast<uint8_t>(sym));
        }
    }

    uint32_t current_code = 0;
    for (uint8_t len = 1; len <= 32; ++len) {
        auto& group = length_groups[len];
        std::sort(group.begin(), group.end()); // Lexicographical ordering

        for (uint8_t sym : group) {
            codes[sym] = current_code++;
        }
        current_code <<= 1;
    }
}

/**
 * @brief Canonical Huffman Encoder.
 * Writes a compact header (original size + active symbol code lengths),
 * followed by the canonical bitstream payload.
 */
inline std::vector<uint8_t> encode(const uint8_t* data, size_t size) {
    if (size == 0) return {};

    // 1. Calculate frequency distribution
    std::array<uint64_t, 256> counts{};
    for (size_t i = 0; i < size; ++i) counts[data[i]]++;

    // 2. Build Min-Heap
    std::priority_queue<std::unique_ptr<HuffmanNode>,
                        std::vector<std::unique_ptr<HuffmanNode>>,
                        CompareNode> pq;

    for (int i = 0; i < 256; ++i) {
        if (counts[i] > 0) {
            auto node = std::make_unique<HuffmanNode>();
            node->symbol = static_cast<uint8_t>(i);
            node->freq = counts[i];
            pq.push(std::move(node));
        }
    }

    // Edge case: single unique symbol throughout data
    if (pq.size() == 1) {
        auto only = std::move(const_cast<std::unique_ptr<HuffmanNode>&>(pq.top()));
        pq.pop();
        auto parent = std::make_unique<HuffmanNode>();
        parent->freq = only->freq;
        parent->left = std::move(only);
        pq.push(std::move(parent));
    }

    // 3. Iterative greedy merge
    while (pq.size() > 1) {
        auto n1 = std::move(const_cast<std::unique_ptr<HuffmanNode>&>(pq.top())); pq.pop();
        auto n2 = std::move(const_cast<std::unique_ptr<HuffmanNode>&>(pq.top())); pq.pop();

        auto parent = std::make_unique<HuffmanNode>();
        parent->freq = n1->freq + n2->freq;
        parent->left = std::move(n1);
        parent->right = std::move(n2);
        pq.push(std::move(parent));
    }

    auto root = std::move(const_cast<std::unique_ptr<HuffmanNode>&>(pq.top()));

    // 4. Extract code lengths and generate Canonical Huffman codes
    std::array<uint8_t, 256> lengths{};
    extract_lengths(root.get(), 0, lengths);

    std::array<uint32_t, 256> canonical_codes{};
    generate_canonical_codes(lengths, canonical_codes);

    // 5. Serialize into BitWriter
    BitWriter writer;

    // Header: Uncompressed size (uint32_t)
    writer.write_bits(static_cast<uint32_t>(size), 32);

    // Count how many symbols are active
    uint16_t active_count = 0;
    for (int i = 0; i < 256; ++i) {
        if (lengths[i] > 0) active_count++;
    }

    // Active symbol count: encoded as count - 1 in 8 bits (0 means 1 symbol, 255 means 256 symbols)
    writer.write_byte(static_cast<uint8_t>(active_count - 1));

    // Store (symbol, length) pairs
    for (int i = 0; i < 256; ++i) {
        if (lengths[i] > 0) {
            writer.write_byte(static_cast<uint8_t>(i));
            writer.write_byte(lengths[i]);
        }
    }

    // Bitstream Payload
    for (size_t i = 0; i < size; ++i) {
        uint8_t sym = data[i];
        writer.write_bits(canonical_codes[sym], lengths[sym]);
    }

    writer.flush();
    return writer.data();
}

/**
 * @brief Canonical Huffman Decoder.
 * Rebuilds canonical codes from stored lengths and decodes instantaneous bitstream.
 */
inline std::vector<uint8_t> decode(const uint8_t* compressed, size_t comp_size) {
    if (comp_size == 0) return {};

    BitReader reader(compressed, comp_size);

    uint32_t orig_size = reader.read_bits(32);
    if (orig_size == 0) return {};

    uint8_t active_count_byte = reader.read_byte();
    size_t active_count = static_cast<size_t>(active_count_byte) + 1;

    std::array<uint8_t, 256> lengths{};
    for (size_t k = 0; k < active_count; ++k) {
        uint8_t sym = reader.read_byte();
        uint8_t len = reader.read_byte();
        lengths[sym] = len;
    }

    // Reconstruct Canonical codes
    std::array<uint32_t, 256> canonical_codes{};
    generate_canonical_codes(lengths, canonical_codes);

    // Build binary decode tree from canonical code table
    struct DecodeNode {
        uint8_t symbol = 0;
        bool is_leaf = false;
        std::unique_ptr<DecodeNode> left;
        std::unique_ptr<DecodeNode> right;
    };

    auto root = std::make_unique<DecodeNode>();

    for (int sym = 0; sym < 256; ++sym) {
        if (lengths[sym] > 0) {
            uint8_t len = lengths[sym];
            uint32_t code = canonical_codes[sym];
            DecodeNode* curr = root.get();

            for (int bit_idx = len - 1; bit_idx >= 0; --bit_idx) {
                uint8_t bit = (code >> bit_idx) & 1;
                if (bit == 0) {
                    if (!curr->left) curr->left = std::make_unique<DecodeNode>();
                    curr = curr->left.get();
                } else {
                    if (!curr->right) curr->right = std::make_unique<DecodeNode>();
                    curr = curr->right.get();
                }
            }
            curr->is_leaf = true;
            curr->symbol = static_cast<uint8_t>(sym);
        }
    }

    // Decode bit-by-bit
    std::vector<uint8_t> output;
    output.reserve(orig_size);

    for (size_t i = 0; i < orig_size; ++i) {
        DecodeNode* curr = root.get();
        while (!curr->is_leaf) {
            uint8_t bit = reader.read_bit();
            curr = (bit == 0) ? curr->left.get() : curr->right.get();
            if (!curr) {
                throw std::runtime_error("Canonical Huffman decode: Bit sequence walked into invalid branch.");
            }
        }
        output.push_back(curr->symbol);
    }

    return output;
}

} // namespace compression::huffman
