#pragma once

#include <cstdint>
#include <vector>
#include <string>
#include <stdexcept>
#include <cstring>
#include <algorithm>
#include <unordered_map>
#include "../../common/bit_stream.hpp"

namespace compression {
namespace lz77 {

/**
 * @brief Represents an LZ77 token (Distance, Length, Next Literal).
 *
 * Classic LZ77 (1977 paper by Ziv & Lempel):
 * - distance: How many bytes to step back into the search buffer (0 if no match).
 * - length: Number of bytes matched in the search buffer (0 if no match).
 * - next_literal: The uncompressed byte immediately following the match.
 */
struct Token {
    uint16_t distance;   // Backward distance into search buffer [0..window_size]
    uint16_t length;     // Matched sequence length [0..lookahead_size]
    uint8_t  next_literal; // Next uncompressed character

    bool operator==(const Token& other) const {
        return distance == other.distance && length == other.length && next_literal == other.next_literal;
    }
};

/**
 * @brief Default buffer parameters for LZ77 sliding window.
 */
constexpr uint16_t DEFAULT_SEARCH_WINDOW    = 4096; // 4 KB search history (12 bits)
constexpr uint16_t DEFAULT_LOOKAHEAD_WINDOW = 255;  // 255 B lookahead (8 bits)
constexpr uint32_t LZ77_MAGIC               = 0x4C5A3737; // "LZ77" in ASCII

/**
 * @brief Encodes raw bytes into a vector of LZ77 tokens.
 *
 * Implements sliding window longest-match search with support for
 * self-referential / overlapping runs (e.g., RLE behavior where match length > distance).
 *
 * @param src Pointer to uncompressed input buffer.
 * @param size Size in bytes of input buffer.
 * @param search_window_size Size of the sliding search history buffer.
 * @param lookahead_window_size Size of the lookahead buffer.
 * @return std::vector<Token> Stream of LZ77 triplets.
 */
inline std::vector<Token> encode_tokens(const uint8_t* src, size_t size, 
                                        uint16_t search_window_size = DEFAULT_SEARCH_WINDOW,
                                        uint16_t lookahead_window_size = DEFAULT_LOOKAHEAD_WINDOW) {
    std::vector<Token> tokens;
    if (!src || size == 0) return tokens;

    size_t cursor = 0;

    // Fast 3-byte hash table for speeding up match candidate searches in large windows
    std::unordered_map<uint32_t, std::vector<size_t>> hash_table;

    while (cursor < size) {
        size_t search_start = (cursor > search_window_size) ? (cursor - search_window_size) : 0;
        size_t max_lookahead = std::min<size_t>(lookahead_window_size, size - cursor);

        uint16_t best_distance = 0;
        uint16_t best_length = 0;

        // Search for the longest match in the search buffer
        // Note: Lookahead characters are at [cursor .. cursor + max_lookahead - 1]
        // An LZ77 match must leave at least 1 character for next_literal unless at the very end
        size_t matchable_limit = (cursor + max_lookahead < size) ? max_lookahead : (size - cursor - 1);

        if (matchable_limit > 0) {
            // Find longest match starting at any pos in [search_start .. cursor - 1]
            for (size_t pos = search_start; pos < cursor; ++pos) {
                size_t len = 0;
                // Support overlapping/repeating runs: compare src[pos + len] with src[cursor + len]
                while (len < matchable_limit && src[pos + len] == src[cursor + len]) {
                    len++;
                }

                if (len > best_length) {
                    best_length = static_cast<uint16_t>(len);
                    best_distance = static_cast<uint16_t>(cursor - pos);
                }
            }
        }

        // The literal character following the match
        uint8_t next_char = src[cursor + best_length];

        tokens.push_back({best_distance, best_length, next_char});

        // Advance cursor past the matched bytes PLUS the next literal character
        cursor += (best_length + 1);
    }

    return tokens;
}

/**
 * @brief Reconstructs original data from LZ77 tokens.
 *
 * Decompression is asymmetric and blazing fast O(N), resolving backward
 * relative pointers by copying from the reconstructed output buffer.
 *
 * @param tokens Stream of (distance, length, next_literal) tokens.
 * @return std::vector<uint8_t> Exact byte-for-byte reconstructed original data.
 */
inline std::vector<uint8_t> decode_tokens(const std::vector<Token>& tokens) {
    std::vector<uint8_t> decompressed;

    for (const auto& token : tokens) {
        if (token.length > 0) {
            if (token.distance == 0 || token.distance > decompressed.size()) {
                throw std::runtime_error("Corrupted LZ77 token: Invalid backward distance " + 
                                         std::to_string(token.distance));
            }

            size_t start_copy_pos = decompressed.size() - token.distance;
            for (size_t i = 0; i < token.length; ++i) {
                // Copy byte-by-byte to handle overlapping / self-referential runs
                uint8_t copied_byte = decompressed[start_copy_pos + i];
                decompressed.push_back(copied_byte);
            }
        }

        // Append the literal character
        decompressed.push_back(token.next_literal);
    }

    return decompressed;
}

/**
 * @brief Serializes LZ77 tokens into a compact binary format with header.
 *
 * Binary Bitstream Layout:
 * [Header - 12 Bytes]
 *   - 0..3:   Magic (0x4C5A3737 -> "LZ77") [4 Bytes]
 *   - 4..7:   Original uncompressed size [4 Bytes]
 *   - 8..11:  Token count [4 Bytes]
 * [Token Stream - Packed 28 bits per token]
 *   - Distance: 12 bits [0..4095]
 *   - Length:    8 bits [0..255]
 *   - Next char: 8 bits [0..255]
 *
 * @param src Pointer to uncompressed input buffer.
 * @param size Size in bytes of input buffer.
 * @return std::vector<uint8_t> Complete serialized binary stream.
 */
inline std::vector<uint8_t> encode(const uint8_t* src, size_t size,
                                   uint16_t search_window_size = DEFAULT_SEARCH_WINDOW,
                                   uint16_t lookahead_window_size = DEFAULT_LOOKAHEAD_WINDOW) {
    if (!src || size == 0) return {};

    auto tokens = encode_tokens(src, size, search_window_size, lookahead_window_size);

    std::vector<uint8_t> output;
    output.reserve(12 + (tokens.size() * 28 + 7) / 8);

    // 1. Magic
    output.push_back(static_cast<uint8_t>((LZ77_MAGIC >> 24) & 0xFF));
    output.push_back(static_cast<uint8_t>((LZ77_MAGIC >> 16) & 0xFF));
    output.push_back(static_cast<uint8_t>((LZ77_MAGIC >> 8) & 0xFF));
    output.push_back(static_cast<uint8_t>(LZ77_MAGIC & 0xFF));

    // 2. Original Size (32-bit big endian)
    uint32_t orig_sz = static_cast<uint32_t>(size);
    output.push_back(static_cast<uint8_t>((orig_sz >> 24) & 0xFF));
    output.push_back(static_cast<uint8_t>((orig_sz >> 16) & 0xFF));
    output.push_back(static_cast<uint8_t>((orig_sz >> 8) & 0xFF));
    output.push_back(static_cast<uint8_t>(orig_sz & 0xFF));

    // 3. Token Count (32-bit big endian)
    uint32_t tok_cnt = static_cast<uint32_t>(tokens.size());
    output.push_back(static_cast<uint8_t>((tok_cnt >> 24) & 0xFF));
    output.push_back(static_cast<uint8_t>((tok_cnt >> 16) & 0xFF));
    output.push_back(static_cast<uint8_t>((tok_cnt >> 8) & 0xFF));
    output.push_back(static_cast<uint8_t>(tok_cnt & 0xFF));

    // 4. Bit-pack tokens using BitWriter
    BitWriter writer;
    for (const auto& tok : tokens) {
        writer.write_bits(tok.distance, 12);     // 12 bits for distance
        writer.write_bits(tok.length, 8);        // 8 bits for length
        writer.write_bits(tok.next_literal, 8);  // 8 bits for literal byte
    }
    writer.flush();

    const auto& packed_bytes = writer.data();
    output.insert(output.end(), packed_bytes.begin(), packed_bytes.end());

    return output;
}

/**
 * @brief Decompresses an LZ77 binary bitstream back into original data.
 *
 * @param src Pointer to compressed bitstream.
 * @param size Size of compressed bitstream.
 * @return std::vector<uint8_t> Reconstructed original bytes.
 */
inline std::vector<uint8_t> decode(const uint8_t* src, size_t size) {
    if (!src || size < 12) {
        throw std::invalid_argument("LZ77 bitstream too short to contain valid header");
    }

    // 1. Verify Magic
    uint32_t magic = (static_cast<uint32_t>(src[0]) << 24) |
                     (static_cast<uint32_t>(src[1]) << 16) |
                     (static_cast<uint32_t>(src[2]) << 8)  |
                     static_cast<uint32_t>(src[3]);
    if (magic != LZ77_MAGIC) {
        throw std::runtime_error("Invalid LZ77 magic header: Expected 'LZ77'");
    }

    // 2. Read Original Size
    uint32_t orig_size = (static_cast<uint32_t>(src[4]) << 24) |
                         (static_cast<uint32_t>(src[5]) << 16) |
                         (static_cast<uint32_t>(src[6]) << 8)  |
                         static_cast<uint32_t>(src[7]);

    // 3. Read Token Count
    uint32_t token_count = (static_cast<uint32_t>(src[8]) << 24) |
                           (static_cast<uint32_t>(src[9]) << 16) |
                           (static_cast<uint32_t>(src[10]) << 8) |
                           static_cast<uint32_t>(src[11]);

    if (token_count == 0) return {};

    // 4. Bit-unpack tokens
    BitReader reader(src + 12, size - 12);
    std::vector<Token> tokens;
    tokens.reserve(token_count);

    for (uint32_t i = 0; i < token_count; ++i) {
        uint16_t dist = static_cast<uint16_t>(reader.read_bits(12));
        uint16_t len  = static_cast<uint16_t>(reader.read_bits(8));
        uint8_t  lit  = static_cast<uint8_t>(reader.read_bits(8));
        tokens.push_back({dist, len, lit});
    }

    auto decompressed = decode_tokens(tokens);

    if (decompressed.size() != orig_size) {
        throw std::runtime_error("LZ77 decompression size mismatch: Expected " + 
                                 std::to_string(orig_size) + " but got " + 
                                 std::to_string(decompressed.size()));
    }

    return decompressed;
}

} // namespace lz77
} // namespace compression
