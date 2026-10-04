#pragma once

#include <vector>
#include <array>
#include <cstdint>
#include <string>
#include <stdexcept>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <span>

namespace compression::ans {

// =========================================================================
// ASYMMETRIC NUMERAL SYSTEMS (ANS) — rANS VARIANT (C++20)
// =========================================================================
// Invented by Dr. Jarosław Duda in 2006.
// ANS unifies the compression density of Arithmetic Coding (approaching
// true Shannon entropy) with the multi-gigabyte-per-second streaming speed
// of Huffman table lookups. Powers Meta's Zstandard (FSE/tANS) and Apple's LZFSE.
//
// Mathematical Foundation:
// A single integer state x encodes an entire sequence of symbols.
// Given alphabet symbols with probabilities p_s ≈ l_s / M:
//   Encode: x' = C(s, x) = ⌊x / l_s⌋ · M + b_s + (x mod l_s)
//   Decode: s = slot_to_sym[x mod M], x' = l_s · ⌊x / M⌋ + (x mod M - b_s)
//
// Normalization bounds:
//   L = 2^16 = 65,536 (lower bound)
//   M = 2^12 = 4,096  (total cumulative probability scale)
//   b = 2^8  = 256    (byte-level renormalization)
//   Valid state range: x ∈ [L, b·L - 1] = [65536, 16777215]
// =========================================================================

constexpr uint32_t RANS_R       = 12;
constexpr uint32_t RANS_M       = 1u << RANS_R;       // 4096
constexpr uint32_t RANS_MASK    = RANS_M - 1u;        // 0xFFF
constexpr uint32_t RANS_L       = 1u << 16;           // 65536
constexpr uint32_t ALPHABET_SZ  = 256;

struct SymbolEntry {
    uint16_t freq = 0;       // l_s (scaled frequency, ∑ l_s = M)
    uint16_t cum_freq = 0;   // b_s (cumulative frequency)
};

/**
 * @brief Distribution table for rANS with O(1) slot decoding table.
 */
class DistributionTable {
public:
    std::array<SymbolEntry, ALPHABET_SZ> symbols{};
    std::vector<uint8_t> slot_to_symbol; // 4096 entries for O(1) decoding
    uint32_t active_symbol_count = 0;

    DistributionTable() : slot_to_symbol(RANS_M, 0) {}

    /**
     * @brief Normalizes raw counts so ∑ l_s = M, guaranteeing every present
     * symbol receives at least l_s >= 1 count.
     */
    void build_from_counts(const uint64_t* raw_counts, size_t num_symbols) {
        uint64_t raw_total = 0;
        active_symbol_count = 0;

        for (size_t i = 0; i < num_symbols && i < ALPHABET_SZ; ++i) {
            if (raw_counts[i] > 0) {
                raw_total += raw_counts[i];
                active_symbol_count++;
            }
        }

        if (raw_total == 0) {
            // Default uniform over 256 symbols: 4096 / 256 = 16 each
            for (size_t i = 0; i < ALPHABET_SZ; ++i) {
                symbols[i].freq = static_cast<uint16_t>(RANS_M / ALPHABET_SZ);
                symbols[i].cum_freq = static_cast<uint16_t>(i * (RANS_M / ALPHABET_SZ));
            }
            active_symbol_count = ALPHABET_SZ;
            build_slot_map();
            return;
        }

        // Proportional allocation with minimum 1 guarantee
        uint32_t allocated = 0;
        for (size_t i = 0; i < ALPHABET_SZ; ++i) {
            if (i < num_symbols && raw_counts[i] > 0) {
                // Ensure at least 1 slot
                uint32_t f = static_cast<uint32_t>((raw_counts[i] * (RANS_M - active_symbol_count)) / raw_total) + 1;
                symbols[i].freq = static_cast<uint16_t>(f);
                allocated += f;
            } else {
                symbols[i].freq = 0;
            }
        }

        // Adjust rounding discrepancies to match exact total RANS_M
        while (allocated != RANS_M) {
            if (allocated < RANS_M) {
                // Find symbol with maximum frequency and bump it
                size_t best = 0;
                for (size_t i = 0; i < ALPHABET_SZ; ++i) {
                    if (symbols[i].freq > symbols[best].freq) best = i;
                }
                symbols[best].freq++;
                allocated++;
            } else {
                // Find symbol with highest freq > 1 and decrement it
                size_t best = 0;
                for (size_t i = 0; i < ALPHABET_SZ; ++i) {
                    if (symbols[i].freq > 1 && symbols[i].freq > symbols[best].freq) best = i;
                }
                symbols[best].freq--;
                allocated--;
            }
        }

        // Compute cumulative frequencies
        uint16_t cum = 0;
        for (size_t i = 0; i < ALPHABET_SZ; ++i) {
            symbols[i].cum_freq = cum;
            cum += symbols[i].freq;
        }

        build_slot_map();
    }

private:
    void build_slot_map() {
        slot_to_symbol.assign(RANS_M, 0);
        for (size_t sym = 0; sym < ALPHABET_SZ; ++sym) {
            const auto& entry = symbols[sym];
            for (uint16_t j = 0; j < entry.freq; ++j) {
                slot_to_symbol[entry.cum_freq + j] = static_cast<uint8_t>(sym);
            }
        }
    }
};

/**
 * @brief Detailed step audit for educational visualization & logging.
 */
struct StepAudit {
    size_t step_index = 0;
    uint8_t symbol = 0;
    uint32_t state_before = 0;
    uint32_t state_after = 0;
    uint32_t bytes_emitted = 0;
    std::string narrative;
};

/**
 * @brief Compresses data using 32-bit rANS (reverse-order encoding).
 *
 * NOTE on LIFO order:
 * Asymmetric Numeral Systems functions as a Last-In, First-Out (LIFO) stack.
 * In order for the decoder to extract symbols in forward sequence [0, 1, 2, ... N-1],
 * the encoder MUST process input symbols in REVERSE sequence [N-1, N-2, ... 0].
 */
inline std::vector<uint8_t> encode(std::span<const uint8_t> data, std::vector<StepAudit>* audit_log = nullptr) {
    if (data.empty()) return {};

    // 1. Compute raw symbol frequencies
    uint64_t counts[ALPHABET_SZ] = {0};
    for (uint8_t byte : data) {
        counts[byte]++;
    }

    // 2. Build normalized distribution table
    DistributionTable table;
    table.build_from_counts(counts, ALPHABET_SZ);

    // 3. Prepare byte-stream buffer (streaming emits lower bytes)
    std::vector<uint8_t> stream;
    stream.reserve(data.size() * 2);

    // Initial state set to L
    uint32_t x = RANS_L;

    // Precalculate max_x thresholds for each symbol:
    // max_x = ((RANS_L >> RANS_R) << 8) * freq = (16 << 8) * freq = 4096 * freq
    std::array<uint32_t, ALPHABET_SZ> max_x{};
    for (size_t s = 0; s < ALPHABET_SZ; ++s) {
        max_x[s] = ((RANS_L >> RANS_R) << 8) * table.symbols[s].freq;
    }

    // 4. Encode symbols in REVERSE order (LIFO duality)
    for (size_t i = data.size(); i > 0; --i) {
        const uint8_t s = data[i - 1];
        const uint32_t freq = table.symbols[s].freq;
        const uint32_t cum = table.symbols[s].cum_freq;
        const uint32_t state_before = x;
        uint32_t emitted_count = 0;

        // Renormalization: emit lower bytes to prevent state overflow
        while (x >= max_x[s]) {
            stream.push_back(static_cast<uint8_t>(x & 0xFF));
            x >>= 8;
            emitted_count++;
        }

        // rANS State transition: C(s, x) = ⌊x / l_s⌋ · M + b_s + (x mod l_s)
        x = (x / freq) * RANS_M + cum + (x % freq);

        if (audit_log) {
            audit_log->push_back({
                .step_index = data.size() - i,
                .symbol = s,
                .state_before = state_before,
                .state_after = x,
                .bytes_emitted = emitted_count,
                .narrative = "Symbol '" + std::string(1, static_cast<char>(s)) + 
                             "' mapped to state " + std::to_string(x)
            });
        }
    }

    // 5. Emit final 4-byte state x (little-endian)
    stream.push_back(static_cast<uint8_t>(x & 0xFF));
    stream.push_back(static_cast<uint8_t>((x >> 8) & 0xFF));
    stream.push_back(static_cast<uint8_t>((x >> 16) & 0xFF));
    stream.push_back(static_cast<uint8_t>((x >> 24) & 0xFF));

    // 6. Serialize output package:
    // [4B original_size][1B active_sym_count][Header entries: (1B sym, 2B freq)...][Payload stream]
    std::vector<uint8_t> output;
    uint32_t orig_sz = static_cast<uint32_t>(data.size());
    output.push_back(static_cast<uint8_t>(orig_sz & 0xFF));
    output.push_back(static_cast<uint8_t>((orig_sz >> 8) & 0xFF));
    output.push_back(static_cast<uint8_t>((orig_sz >> 16) & 0xFF));
    output.push_back(static_cast<uint8_t>((orig_sz >> 24) & 0xFF));

    // Emit active symbol count
    output.push_back(static_cast<uint8_t>(table.active_symbol_count));
    for (size_t s = 0; s < ALPHABET_SZ; ++s) {
        if (table.symbols[s].freq > 0) {
            output.push_back(static_cast<uint8_t>(s));
            output.push_back(static_cast<uint8_t>(table.symbols[s].freq & 0xFF));
            output.push_back(static_cast<uint8_t>((table.symbols[s].freq >> 8) & 0xFF));
        }
    }

    // Append payload stream
    output.insert(output.end(), stream.begin(), stream.end());
    return output;
}

/**
 * @brief Decompresses rANS bitstream back to original bytes.
 */
inline std::vector<uint8_t> decode(std::span<const uint8_t> compressed) {
    if (compressed.size() < 5) {
        throw std::runtime_error("Compressed buffer too short");
    }

    // 1. Read original size
    uint32_t orig_size = static_cast<uint32_t>(compressed[0]) |
                        (static_cast<uint32_t>(compressed[1]) << 8) |
                        (static_cast<uint32_t>(compressed[2]) << 16) |
                        (static_cast<uint32_t>(compressed[3]) << 24);

    if (orig_size == 0) return {};

    // 2. Read distribution table
    size_t cursor = 4;
    uint8_t active_count = compressed[cursor++];
    size_t num_entries = (active_count == 0) ? 256 : active_count;

    DistributionTable table;
    table.active_symbol_count = static_cast<uint32_t>(num_entries);

    for (size_t i = 0; i < num_entries; ++i) {
        if (cursor + 3 > compressed.size()) throw std::runtime_error("Truncated header");
        uint8_t sym = compressed[cursor++];
        uint16_t freq = static_cast<uint16_t>(compressed[cursor]) |
                       (static_cast<uint16_t>(compressed[cursor + 1]) << 8);
        cursor += 2;
        table.symbols[sym].freq = freq;
    }

    // Compute cumulative frequencies & slot table
    uint16_t cum = 0;
    for (size_t s = 0; s < ALPHABET_SZ; ++s) {
        table.symbols[s].cum_freq = cum;
        cum += table.symbols[s].freq;
    }
    table.slot_to_symbol.assign(RANS_M, 0);
    for (size_t sym = 0; sym < ALPHABET_SZ; ++sym) {
        const auto& entry = table.symbols[sym];
        for (uint16_t j = 0; j < entry.freq; ++j) {
            table.slot_to_symbol[entry.cum_freq + j] = static_cast<uint8_t>(sym);
        }
    }

    // 3. Read stream from the back
    // The final 4 bytes of stream is the initial decoder state x!
    if (cursor + 4 > compressed.size()) throw std::runtime_error("Stream missing final state");

    // The stream runs from cursor to compressed.size() - 4.
    // The final state was appended at the very end of stream.
    size_t stream_end = compressed.size() - 4;
    uint32_t x = static_cast<uint32_t>(compressed[stream_end]) |
                (static_cast<uint32_t>(compressed[stream_end + 1]) << 8) |
                (static_cast<uint32_t>(compressed[stream_end + 2]) << 16) |
                (static_cast<uint32_t>(compressed[stream_end + 3]) << 24);

    // Reading stream in reverse of encoder's emit order
    // Encoder emitted bytes with push_back; decoder consumes them in reverse (LIFO stack)
    size_t stream_pos = stream_end;

    std::vector<uint8_t> output;
    output.reserve(orig_size);

    for (size_t i = 0; i < orig_size; ++i) {
        // Find slot & symbol
        uint32_t slot = x & RANS_MASK;
        uint8_t s = table.slot_to_symbol[slot];
        output.push_back(s);

        // State update: x' = l_s · ⌊x / M⌋ + (slot - b_s)
        const auto& entry = table.symbols[s];
        x = entry.freq * (x >> RANS_R) + (slot - entry.cum_freq);

        // Renormalization: pull bytes while x < RANS_L
        while (x < RANS_L && stream_pos > cursor) {
            x = (x << 8) | compressed[--stream_pos];
        }
    }

    return output;
}

} // namespace compression::ans
