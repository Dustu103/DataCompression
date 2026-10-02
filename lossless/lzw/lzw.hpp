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
namespace lzw {

/**
 * @brief Configuration constants for LZW engine.
 */
constexpr uint32_t LZW_MAGIC         = 0x4C5A5731; // "LZW1" in ASCII
constexpr uint16_t INITIAL_DICT_SIZE = 256;        // Standard 8-bit alphabet [0..255]
constexpr uint16_t DEFAULT_MAX_BITS  = 12;         // Default 12-bit codebook limit (4096 entries)
constexpr uint16_t MAX_SUPPORTED_BITS = 16;        // Max 16-bit codebook limit (65536 entries)

/**
 * @brief Detailed stage-by-stage mathematical reduction statistics.
 */
struct LzwStats {
    size_t raw_bytes;
    size_t raw_bits;
    size_t total_codes;
    size_t dict_entries_created;
    size_t final_code_bits;
    size_t compressed_payload_bits;
    size_t header_bits;
    size_t total_compressed_bits;
    size_t total_compressed_bytes;
    double space_savings_percent;
    double compression_ratio;
};

/**
 * @brief Represents a single step in LZW tokenization (useful for interactive pedagogical inspection).
 */
struct LzwStep {
    std::string prefix;        // Matched prefix string P
    uint8_t     next_char;     // Character c triggering mismatch
    uint16_t    emitted_code;  // Code emitted for P
    uint16_t    new_code;      // Code assigned to P + c
    std::string new_entry;     // P + c added to dictionary
};

/**
 * @brief Encodes raw bytes into a sequence of LZW integer codes.
 *
 * Both Encoder and Decoder agree beforehand on an initial dictionary of size 256
 * (codes 0..255 mapped to their single-byte values). No dictionary overhead is transmitted.
 *
 * @param src Pointer to uncompressed input buffer.
 * @param size Size in bytes of input buffer.
 * @param max_bits Maximum bit width for codes (default: 12 bits -> 4096 entries).
 * @return std::vector<uint16_t> Vector of integer codes.
 */
inline std::vector<uint16_t> encode_to_codes(const uint8_t* src, size_t size, 
                                             uint16_t max_bits = DEFAULT_MAX_BITS) {
    std::vector<uint16_t> output_codes;
    if (!src || size == 0) return output_codes;

    const uint32_t max_dict_size = 1U << max_bits;

    // Initialize string -> code lookup table
    // For fast prefix matching, we use a hash map of string to code
    std::unordered_map<std::string, uint16_t> dict;
    dict.reserve(max_dict_size);

    for (uint16_t i = 0; i < INITIAL_DICT_SIZE; ++i) {
        dict[std::string(1, static_cast<char>(static_cast<uint8_t>(i)))] = i;
    }

    uint16_t next_code = INITIAL_DICT_SIZE; // 256
    std::string current_prefix;
    current_prefix.reserve(64);

    for (size_t i = 0; i < size; ++i) {
        char ch = static_cast<char>(src[i]);
        std::string combined = current_prefix + ch;

        if (dict.find(combined) != dict.end()) {
            current_prefix = std::move(combined);
        } else {
            // Emit code for current_prefix
            output_codes.push_back(dict[current_prefix]);

            // Add combined to dictionary if capacity permits
            if (next_code < max_dict_size) {
                dict[combined] = next_code++;
            }

            // Reset prefix to current character
            current_prefix = std::string(1, ch);
        }
    }

    // Flush remaining prefix
    if (!current_prefix.empty()) {
        output_codes.push_back(dict[current_prefix]);
    }

    return output_codes;
}

/**
 * @brief Decodes a sequence of LZW integer codes back into uncompressed raw bytes.
 *
 * Reconstructs the exact same dictionary on the fly without any transmitted codebook table.
 * Correctly handles the famous "KwKwK" / "cScSc" edge case where the decoder encounters
 * a code that hasn't yet been registered in its local dictionary.
 *
 * @param codes Input stream of LZW codes.
 * @param max_bits Maximum bit width for codes.
 * @return std::vector<uint8_t> Reconstructed original bytes.
 */
inline std::vector<uint8_t> decode_from_codes(const std::vector<uint16_t>& codes,
                                              uint16_t max_bits = DEFAULT_MAX_BITS) {
    std::vector<uint8_t> output_bytes;
    if (codes.empty()) return output_bytes;

    const uint32_t max_dict_size = 1U << max_bits;

    // Initialize code -> string lookup table
    std::vector<std::string> dict;
    dict.reserve(max_dict_size);

    for (uint16_t i = 0; i < INITIAL_DICT_SIZE; ++i) {
        dict.push_back(std::string(1, static_cast<char>(static_cast<uint8_t>(i))));
    }

    // Read first code
    uint16_t old_code = codes[0];
    if (old_code >= dict.size()) {
        throw std::runtime_error("Corrupted LZW stream: First code out of initial alphabet range");
    }

    std::string s = dict[old_code];
    for (char c : s) {
        output_bytes.push_back(static_cast<uint8_t>(c));
    }

    // Process subsequent codes
    for (size_t i = 1; i < codes.size(); ++i) {
        uint16_t new_code = codes[i];
        std::string entry;

        if (new_code < dict.size()) {
            entry = dict[new_code];
        } else if (new_code == dict.size()) {
            // THE FAMOUS KwKwK / cScSc SPECIAL CASE:
            // Encoder defined entry and immediately emitted it in the very next step.
            // entry = previous_entry + previous_entry[0]
            entry = s + s[0];
        } else {
            throw std::runtime_error("Corrupted LZW stream: Code index beyond dictionary horizon");
        }

        for (char c : entry) {
            output_bytes.push_back(static_cast<uint8_t>(c));
        }

        // Add s + entry[0] to dictionary if capacity permits
        if (dict.size() < max_dict_size) {
            dict.push_back(s + entry[0]);
        }

        s = std::move(entry);
    }

    return output_bytes;
}

/**
 * @brief Encodes input data into a self-contained LZW binary bitstream.
 *
 * Bitstream Container Format:
 * [0..3]   Magic Bytes: 0x4C5A5731 ("LZW1")
 * [4..7]   Original Uncompressed Size (32-bit big endian uint32_t)
 * [8..11]  Total Code Count (32-bit big endian uint32_t)
 * [12..13] Code Bit-Width (16-bit big endian uint16_t, e.g. 12)
 * [14..N]  Bit-packed codes (each code packed into 'max_bits' bits)
 *
 * @param src Pointer to uncompressed data.
 * @param size Size in bytes.
 * @param code_bits Fixed or maximum bit-width per code (9..16, default: 12).
 * @return std::vector<uint8_t> Bit-packed serialized archive.
 */
inline std::vector<uint8_t> encode(const uint8_t* src, size_t size, uint16_t code_bits = DEFAULT_MAX_BITS) {
    if (!src || size == 0) return {};

    if (code_bits < 9 || code_bits > MAX_SUPPORTED_BITS) {
        throw std::invalid_argument("LZW code_bits must be in range [9..16]");
    }

    auto codes = encode_to_codes(src, size, code_bits);

    std::vector<uint8_t> output;
    output.reserve(14 + (codes.size() * code_bits + 7) / 8);

    // 1. Magic: "LZW1"
    output.push_back(static_cast<uint8_t>((LZW_MAGIC >> 24) & 0xFF));
    output.push_back(static_cast<uint8_t>((LZW_MAGIC >> 16) & 0xFF));
    output.push_back(static_cast<uint8_t>((LZW_MAGIC >> 8) & 0xFF));
    output.push_back(static_cast<uint8_t>(LZW_MAGIC & 0xFF));

    // 2. Original Size (32-bit Big Endian)
    uint32_t orig_sz = static_cast<uint32_t>(size);
    output.push_back(static_cast<uint8_t>((orig_sz >> 24) & 0xFF));
    output.push_back(static_cast<uint8_t>((orig_sz >> 16) & 0xFF));
    output.push_back(static_cast<uint8_t>((orig_sz >> 8) & 0xFF));
    output.push_back(static_cast<uint8_t>(orig_sz & 0xFF));

    // 3. Code Count (32-bit Big Endian)
    uint32_t code_cnt = static_cast<uint32_t>(codes.size());
    output.push_back(static_cast<uint8_t>((code_cnt >> 24) & 0xFF));
    output.push_back(static_cast<uint8_t>((code_cnt >> 16) & 0xFF));
    output.push_back(static_cast<uint8_t>((code_cnt >> 8) & 0xFF));
    output.push_back(static_cast<uint8_t>(code_cnt & 0xFF));

    // 4. Code Bits (16-bit Big Endian)
    output.push_back(static_cast<uint8_t>((code_bits >> 8) & 0xFF));
    output.push_back(static_cast<uint8_t>(code_bits & 0xFF));

    // 5. Bit-pack codes
    BitWriter writer;
    for (uint16_t c : codes) {
        writer.write_bits(c, code_bits);
    }
    writer.flush();

    const auto& packed = writer.data();
    output.insert(output.end(), packed.begin(), packed.end());

    return output;
}

/**
 * @brief Decompresses an LZW binary bitstream back into original data.
 *
 * @param src Pointer to compressed bitstream.
 * @param size Size of compressed bitstream.
 * @return std::vector<uint8_t> Reconstructed original bytes.
 */
inline std::vector<uint8_t> decode(const uint8_t* src, size_t size) {
    if (!src || size < 14) {
        throw std::invalid_argument("LZW bitstream too short to contain valid container header");
    }

    // 1. Verify Magic
    uint32_t magic = (static_cast<uint32_t>(src[0]) << 24) |
                     (static_cast<uint32_t>(src[1]) << 16) |
                     (static_cast<uint32_t>(src[2]) << 8)  |
                     static_cast<uint32_t>(src[3]);
    if (magic != LZW_MAGIC) {
        throw std::runtime_error("Invalid LZW magic: Expected 'LZW1'");
    }

    // 2. Read Original Size
    uint32_t orig_size = (static_cast<uint32_t>(src[4]) << 24) |
                         (static_cast<uint32_t>(src[5]) << 16) |
                         (static_cast<uint32_t>(src[6]) << 8)  |
                         static_cast<uint32_t>(src[7]);

    // 3. Read Code Count
    uint32_t code_count = (static_cast<uint32_t>(src[8]) << 24) |
                          (static_cast<uint32_t>(src[9]) << 16) |
                          (static_cast<uint32_t>(src[10]) << 8) |
                          static_cast<uint32_t>(src[11]);

    // 4. Read Code Bits
    uint16_t code_bits = (static_cast<uint16_t>(src[12]) << 8) |
                          static_cast<uint16_t>(src[13]);

    if (code_bits < 9 || code_bits > MAX_SUPPORTED_BITS) {
        throw std::runtime_error("Invalid LZW code bit-width in header");
    }

    if (code_count == 0) return {};

    // 5. Unpack codes
    BitReader reader(src + 14, size - 14);
    std::vector<uint16_t> codes;
    codes.reserve(code_count);

    for (uint32_t i = 0; i < code_count; ++i) {
        codes.push_back(static_cast<uint16_t>(reader.read_bits(code_bits)));
    }

    // 6. Decode from codes
    auto decompressed = decode_from_codes(codes, code_bits);

    if (decompressed.size() != orig_size) {
        throw std::runtime_error("LZW decompression size mismatch: Expected " + 
                                 std::to_string(orig_size) + " but got " + 
                                 std::to_string(decompressed.size()));
    }

    return decompressed;
}

/**
 * @brief Computes detailed mathematical size reduction metrics for a dataset.
 */
inline LzwStats compute_stats(const uint8_t* src, size_t size, uint16_t code_bits = DEFAULT_MAX_BITS) {
    LzwStats stats{};
    stats.raw_bytes = size;
    stats.raw_bits = size * 8;
    stats.final_code_bits = code_bits;
    stats.header_bits = 14 * 8; // 14-byte container header

    if (size == 0) return stats;

    auto codes = encode_to_codes(src, size, code_bits);
    stats.total_codes = codes.size();
    stats.dict_entries_created = (codes.size() > 0) ? (codes.size() - 1) : 0;
    stats.compressed_payload_bits = codes.size() * code_bits;
    stats.total_compressed_bits = stats.header_bits + stats.compressed_payload_bits;
    stats.total_compressed_bytes = (stats.total_compressed_bits + 7) / 8;

    if (stats.raw_bits > 0) {
        stats.space_savings_percent = 100.0 * (1.0 - static_cast<double>(stats.total_compressed_bits) / stats.raw_bits);
        stats.compression_ratio = static_cast<double>(stats.raw_bits) / stats.total_compressed_bits;
    }

    return stats;
}

} // namespace lzw
} // namespace compression
