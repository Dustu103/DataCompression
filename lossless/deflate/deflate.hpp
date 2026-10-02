#pragma once

#include <cstdint>
#include <vector>
#include <string>
#include <stdexcept>
#include <cstring>
#include <algorithm>
#include <unordered_map>
#include <queue>
#include <memory>
#include "../../common/bit_stream.hpp"

namespace compression {
namespace deflate {

/**
 * @brief Represents an intermediate token produced by the LZ77 stage of DEFLATE.
 * In RFC 1951:
 * - is_match = false: 'literal' contains a raw uncompressed byte [0..255].
 * - is_match = true:  'length' [3..258] and 'distance' [1..32768].
 */
struct LzToken {
    bool     is_match;
    uint16_t literal;   // [0..255] or 256 for End-Of-Block (EOB)
    uint16_t length;    // Matched substring length
    uint16_t distance;  // Backward relative distance into search window
};

/**
 * @brief Detailed stage-by-stage mathematical reduction statistics.
 */
struct DeflateStats {
    size_t raw_bytes;
    size_t lz77_tokens_count;
    size_t lz77_literals_count;
    size_t lz77_matches_count;
    size_t lz77_bytes_deduplicated;
    size_t lit_tree_header_bytes;
    size_t dist_tree_header_bytes;
    size_t compressed_payload_bits;
    size_t total_compressed_bytes;
    double space_savings_percent;
    double compression_ratio;
};

// Default sliding window sizes conforming to RFC 1951 principles
constexpr uint16_t DEFLATE_WINDOW_SIZE    = 4096; // 4 KB window (configurable up to 32 KB)
constexpr uint16_t DEFLATE_MAX_LOOKAHEAD  = 258;  // Maximum match length in RFC 1951
constexpr uint16_t DEFLATE_MIN_MATCH      = 3;    // Minimum useful match length
constexpr uint16_t DEFLATE_EOB_SYMBOL     = 256;  // End-Of-Block marker
constexpr uint32_t DEFLATE_MAGIC          = 0x4445464C; // 'DEFL' in ASCII

// -----------------------------------------------------------------------------
// STAGE 1: LZ77 Sliding Window Matcher
// -----------------------------------------------------------------------------
inline std::vector<LzToken> lz77_tokenize(const uint8_t* src, size_t size, 
                                          uint16_t window_size = DEFLATE_WINDOW_SIZE) {
    std::vector<LzToken> tokens;
    if (!src || size == 0) return tokens;

    size_t cursor = 0;

    while (cursor < size) {
        size_t search_start = (cursor > window_size) ? (cursor - window_size) : 0;
        size_t max_lookahead = std::min<size_t>(DEFLATE_MAX_LOOKAHEAD, size - cursor);

        uint16_t best_dist = 0;
        uint16_t best_len = 0;

        if (max_lookahead >= DEFLATE_MIN_MATCH) {
            // Longest-match search with self-referential / overlapping run support
            for (size_t pos = search_start; pos < cursor; ++pos) {
                size_t len = 0;
                while (len < max_lookahead && src[pos + len] == src[cursor + len]) {
                    len++;
                }

                if (len > best_len) {
                    best_len = static_cast<uint16_t>(len);
                    best_dist = static_cast<uint16_t>(cursor - pos);
                    if (best_len == DEFLATE_MAX_LOOKAHEAD) break;
                }
            }
        }

        // RFC 1951 decision rule: Only emit match if length >= 3
        if (best_len >= DEFLATE_MIN_MATCH) {
            tokens.push_back({true, 0, best_len, best_dist});
            cursor += best_len;
        } else {
            tokens.push_back({false, src[cursor], 0, 0});
            cursor += 1;
        }
    }

    // Append End-Of-Block (EOB = 256) marker
    tokens.push_back({false, DEFLATE_EOB_SYMBOL, 0, 0});
    return tokens;
}

// -----------------------------------------------------------------------------
// STAGE 2: Canonical Huffman Tree Builders & Coders
// -----------------------------------------------------------------------------
struct HuffmanNode {
    uint16_t symbol;
    uint32_t freq;
    std::shared_ptr<HuffmanNode> left;
    std::shared_ptr<HuffmanNode> right;

    HuffmanNode(uint16_t s, uint32_t f) : symbol(s), freq(f), left(nullptr), right(nullptr) {}
};

struct NodeCompare {
    bool operator()(const std::shared_ptr<HuffmanNode>& a, const std::shared_ptr<HuffmanNode>& b) {
        return a->freq > b->freq;
    }
};

inline void extract_lengths(const std::shared_ptr<HuffmanNode>& node, uint8_t depth, 
                            std::unordered_map<uint16_t, uint8_t>& lengths) {
    if (!node) return;
    if (!node->left && !node->right) {
        lengths[node->symbol] = (depth == 0) ? 1 : depth;
        return;
    }
    extract_lengths(node->left, depth + 1, lengths);
    extract_lengths(node->right, depth + 1, lengths);
}

/**
 * @brief Computes Canonical Huffman Codes from symbol frequencies.
 */
inline std::pair<std::unordered_map<uint16_t, uint8_t>, std::unordered_map<uint16_t, std::string>>
build_canonical_codebook(const std::unordered_map<uint16_t, uint32_t>& freq_map) {
    std::unordered_map<uint16_t, uint8_t> lengths;
    std::unordered_map<uint16_t, std::string> canonical_codes;

    if (freq_map.empty()) return {lengths, canonical_codes};

    // Priority Queue to build optimal prefix tree
    std::priority_queue<std::shared_ptr<HuffmanNode>, 
                        std::vector<std::shared_ptr<HuffmanNode>>, 
                        NodeCompare> pq;

    for (const auto& kv : freq_map) {
        pq.push(std::make_shared<HuffmanNode>(kv.first, kv.second));
    }

    if (pq.size() == 1) {
        lengths[pq.top()->symbol] = 1;
    } else {
        while (pq.size() > 1) {
            auto left = pq.top(); pq.pop();
            auto right = pq.top(); pq.pop();

            auto parent = std::make_shared<HuffmanNode>(0, left->freq + right->freq);
            parent->left = left;
            parent->right = right;
            pq.push(parent);
        }
        extract_lengths(pq.top(), 0, lengths);
    }

    // Group symbols by length, sort lexicographically, and assign canonical integer codes
    std::unordered_map<uint8_t, std::vector<uint16_t>> groups;
    for (const auto& kv : lengths) {
        groups[kv.second].push_back(kv.first);
    }

    uint32_t current_code = 0;
    for (uint8_t len = 1; len <= 32; ++len) {
        auto it = groups.find(len);
        if (it != groups.end()) {
            std::sort(it->second.begin(), it->second.end());
            for (uint16_t sym : it->second) {
                // Convert integer code to binary bitstring of exact length 'len'
                std::string bitstr = "";
                for (int b = len - 1; b >= 0; --b) {
                    bitstr += ((current_code >> b) & 1) ? '1' : '0';
                }
                canonical_codes[sym] = bitstr;
                current_code++;
            }
        }
        current_code <<= 1;
    }

    return {lengths, canonical_codes};
}

// -----------------------------------------------------------------------------
// DEFLATE Bitstream Serialization & Roundtrip Engine
// -----------------------------------------------------------------------------

/**
 * @brief Compresses uncompressed data using DEFLATE (LZ77 + Dual Canonical Huffman).
 */
inline std::vector<uint8_t> encode(const uint8_t* src, size_t size, 
                                   DeflateStats* stats_out = nullptr,
                                   uint16_t window_size = DEFLATE_WINDOW_SIZE) {
    if (!src || size == 0) return {};

    // 1. Stage 1: LZ77 Tokenization
    auto tokens = lz77_tokenize(src, size, window_size);

    // 2. Tally frequencies for Dual Huffman Trees
    std::unordered_map<uint16_t, uint32_t> lit_len_freq;
    std::unordered_map<uint16_t, uint32_t> dist_freq;

    size_t matches_count = 0;
    size_t literals_count = 0;
    size_t chars_dedup = 0;

    for (const auto& tok : tokens) {
        if (!tok.is_match) {
            lit_len_freq[tok.literal]++;
            if (tok.literal != DEFLATE_EOB_SYMBOL) literals_count++;
        } else {
            // In RFC 1951, match length is encoded in the Literal/Length tree (symbols 257..285)
            // For zero-external-dependency clarity, length is stored as symbol 257 + length
            uint16_t len_sym = 257 + (tok.length - DEFLATE_MIN_MATCH);
            lit_len_freq[len_sym]++;
            dist_freq[tok.distance]++;
            matches_count++;
            chars_dedup += tok.length;
        }
    }

    // 3. Stage 2: Build Canonical Huffman Codebooks
    auto lit_cb = build_canonical_codebook(lit_len_freq);
    auto lit_lengths = std::move(lit_cb.first);
    auto lit_codes = std::move(lit_cb.second);

    auto dist_cb = build_canonical_codebook(dist_freq);
    auto dist_lengths = std::move(dist_cb.first);
    auto dist_codes = std::move(dist_cb.second);

    // 4. Assemble Bitstream
    // Header (12 Bytes):
    // [0..3]: Magic 0x4445464C ('DEFL')
    // [4..7]: Original uncompressed size (uint32_t Big-Endian)
    // [8..9]: Unique symbols in Lit/Len tree (uint16_t)
    // [10..11]: Unique symbols in Dist tree (uint16_t)
    std::vector<uint8_t> header;
    header.push_back((DEFLATE_MAGIC >> 24) & 0xFF);
    header.push_back((DEFLATE_MAGIC >> 16) & 0xFF);
    header.push_back((DEFLATE_MAGIC >> 8) & 0xFF);
    header.push_back(DEFLATE_MAGIC & 0xFF);

    uint32_t orig_sz = static_cast<uint32_t>(size);
    header.push_back((orig_sz >> 24) & 0xFF);
    header.push_back((orig_sz >> 16) & 0xFF);
    header.push_back((orig_sz >> 8) & 0xFF);
    header.push_back(orig_sz & 0xFF);

    uint16_t num_lit_syms = static_cast<uint16_t>(lit_lengths.size());
    header.push_back((num_lit_syms >> 8) & 0xFF);
    header.push_back(num_lit_syms & 0xFF);

    uint16_t num_dist_syms = static_cast<uint16_t>(dist_lengths.size());
    header.push_back((num_dist_syms >> 8) & 0xFF);
    header.push_back(num_dist_syms & 0xFF);

    BitWriter writer;

    // Transmit Canonical Lengths: Lit/Len Tree
    for (const auto& kv : lit_lengths) {
        writer.write_bits(kv.first, 10); // Symbol (0..1023)
        writer.write_bits(kv.second, 5); // Code length (1..32)
    }

    // Transmit Canonical Lengths: Distance Tree
    for (const auto& kv : dist_lengths) {
        writer.write_bits(kv.first, 16); // Distance (1..65535)
        writer.write_bits(kv.second, 5); // Code length (1..32)
    }

    // Transmit Payload (Huffman Encoded Tokens)
    for (const auto& tok : tokens) {
        if (!tok.is_match) {
            const std::string& code = lit_codes[tok.literal];
            for (char b : code) writer.write_bit(b == '1' ? 1 : 0);
        } else {
            uint16_t len_sym = 257 + (tok.length - DEFLATE_MIN_MATCH);
            const std::string& len_code = lit_codes[len_sym];
            for (char b : len_code) writer.write_bit(b == '1' ? 1 : 0);

            const std::string& dist_code = dist_codes[tok.distance];
            for (char b : dist_code) writer.write_bit(b == '1' ? 1 : 0);
        }
    }

    writer.flush();
    const auto& payload_bytes = writer.data();

    std::vector<uint8_t> output;
    output.reserve(header.size() + payload_bytes.size());
    output.insert(output.end(), header.begin(), header.end());
    output.insert(output.end(), payload_bytes.begin(), payload_bytes.end());

    // Record reduction statistics if requested
    if (stats_out) {
        stats_out->raw_bytes = size;
        stats_out->lz77_tokens_count = tokens.size();
        stats_out->lz77_literals_count = literals_count;
        stats_out->lz77_matches_count = matches_count;
        stats_out->lz77_bytes_deduplicated = chars_dedup;
        stats_out->lit_tree_header_bytes = (num_lit_syms * 15 + 7) / 8;
        stats_out->dist_tree_header_bytes = (num_dist_syms * 21 + 7) / 8;
        stats_out->compressed_payload_bits = writer.total_bits_written();
        stats_out->total_compressed_bytes = output.size();
        stats_out->space_savings_percent = (((double)(long long)size - (double)(long long)output.size()) / (double)size) * 100.0;
        stats_out->compression_ratio = (double)size / std::max<size_t>(1, output.size());
    }

    return output;
}

/**
 * @brief Decompresses a DEFLATE bitstream back to original bytes.
 */
inline std::vector<uint8_t> decode(const uint8_t* src, size_t size) {
    if (!src || size < 12) {
        throw std::invalid_argument("DEFLATE bitstream too short for valid 12-byte header");
    }

    // 1. Verify Magic Header
    uint32_t magic = (static_cast<uint32_t>(src[0]) << 24) |
                     (static_cast<uint32_t>(src[1]) << 16) |
                     (static_cast<uint32_t>(src[2]) << 8)  |
                     static_cast<uint32_t>(src[3]);
    if (magic != DEFLATE_MAGIC) {
        throw std::runtime_error("Invalid DEFLATE magic signature");
    }

    // 2. Read Original Size
    uint32_t orig_size = (static_cast<uint32_t>(src[4]) << 24) |
                         (static_cast<uint32_t>(src[5]) << 16) |
                         (static_cast<uint32_t>(src[6]) << 8)  |
                         static_cast<uint32_t>(src[7]);

    uint16_t num_lit_syms = (static_cast<uint16_t>(src[8]) << 8) | static_cast<uint16_t>(src[9]);
    uint16_t num_dist_syms = (static_cast<uint16_t>(src[10]) << 8) | static_cast<uint16_t>(src[11]);

    BitReader reader(src + 12, size - 12);

    // 3. Read Lit/Len Code Lengths
    std::unordered_map<uint16_t, uint8_t> lit_lengths;
    for (uint16_t i = 0; i < num_lit_syms; ++i) {
        uint16_t sym = static_cast<uint16_t>(reader.read_bits(10));
        uint8_t len = static_cast<uint8_t>(reader.read_bits(5));
        lit_lengths[sym] = len;
    }

    // 4. Read Distance Code Lengths
    std::unordered_map<uint16_t, uint8_t> dist_lengths;
    for (uint16_t i = 0; i < num_dist_syms; ++i) {
        uint16_t sym = static_cast<uint16_t>(reader.read_bits(16));
        uint8_t len = static_cast<uint8_t>(reader.read_bits(5));
        dist_lengths[sym] = len;
    }

    // 5. Reconstruct Canonical Decode Maps (code string -> symbol)
    auto rebuild_decode_map = [](const std::unordered_map<uint16_t, uint8_t>& lengths) {
        std::unordered_map<uint8_t, std::vector<uint16_t>> groups;
        for (const auto& kv : lengths) groups[kv.second].push_back(kv.first);

        std::unordered_map<std::string, uint16_t> decode_map;
        uint32_t current_code = 0;
        for (uint8_t len = 1; len <= 32; ++len) {
            auto it = groups.find(len);
            if (it != groups.end()) {
                std::sort(it->second.begin(), it->second.end());
                for (uint16_t sym : it->second) {
                    std::string bitstr = "";
                    for (int b = len - 1; b >= 0; --b) {
                        bitstr += ((current_code >> b) & 1) ? '1' : '0';
                    }
                    decode_map[bitstr] = sym;
                    current_code++;
                }
            }
            current_code <<= 1;
        }
        return decode_map;
    };

    auto lit_decode_map = rebuild_decode_map(lit_lengths);
    auto dist_decode_map = rebuild_decode_map(dist_lengths);

    // 6. Decode Payload Stream
    std::vector<uint8_t> decompressed;
    decompressed.reserve(orig_size);

    std::string cur_bits = "";

    while (reader.has_more_bits() && decompressed.size() < orig_size) {
        cur_bits += (reader.read_bit() ? '1' : '0');

        auto lit_it = lit_decode_map.find(cur_bits);
        if (lit_it != lit_decode_map.end()) {
            uint16_t sym = lit_it->second;
            cur_bits.clear();

            if (sym == DEFLATE_EOB_SYMBOL) {
                break; // End Of Block
            } else if (sym < 256) {
                // Literal Byte
                decompressed.push_back(static_cast<uint8_t>(sym));
            } else {
                // Match: Length code
                uint16_t match_len = (sym - 257) + DEFLATE_MIN_MATCH;

                // Decode Distance Symbol
                std::string dist_bits = "";
                uint16_t match_dist = 0;
                while (reader.has_more_bits()) {
                    dist_bits += (reader.read_bit() ? '1' : '0');
                    auto dist_it = dist_decode_map.find(dist_bits);
                    if (dist_it != dist_decode_map.end()) {
                        match_dist = dist_it->second;
                        dist_bits.clear();
                        break;
                    }
                }

                if (match_dist == 0 || match_dist > decompressed.size()) {
                    throw std::runtime_error("Corrupted DEFLATE distance reference");
                }

                size_t copy_start = decompressed.size() - match_dist;
                for (size_t i = 0; i < match_len; ++i) {
                    decompressed.push_back(decompressed[copy_start + i]);
                }
            }
        }
    }

    if (decompressed.size() != orig_size) {
        throw std::runtime_error("DEFLATE decompression size mismatch: Expected " + 
                                 std::to_string(orig_size) + " but got " + 
                                 std::to_string(decompressed.size()));
    }

    return decompressed;
}

} // namespace deflate
} // namespace compression
