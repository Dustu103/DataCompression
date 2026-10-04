#pragma once

#include <vector>
#include <array>
#include <cstdint>
#include <string>
#include <stdexcept>
#include <algorithm>
#include <numeric>
#include <cmath>
#include "../../common/bit_stream.hpp"

namespace compression::arithmetic {

// =========================================================================
// CONSTANTS FOR 32-BIT INTEGER ARITHMETIC CODING (Witten-Neal-Cleary Model)
// =========================================================================
// We use 32-bit precision registers [0, Top].
// Total cumulative frequency count is bounded by MaxTotal to guarantee
// (Range * High) fits cleanly in 64-bit integer without overflow.
constexpr uint32_t TOP_VALUE      = 0xFFFFFFFFu;
constexpr uint32_t HALF           = 0x80000000u;
constexpr uint32_t FIRST_QUARTER  = 0x40000000u;
constexpr uint32_t THIRD_QUARTER  = 0xC0000000u;

// Total frequency is kept <= 2^14 (16384) so that:
// (TOP_VALUE / MaxTotal) >= 2^18, preventing underflow collapse.
constexpr uint32_t MAX_TOTAL_FREQ = 16384u;

// 256 byte symbols + 1 End-Of-Stream (EOS) sentinel symbol = 257 symbols
constexpr uint16_t EOS_SYMBOL     = 256;
constexpr size_t   ALPHABET_SIZE  = 257;

/**
 * @brief Probability model that tracks cumulative frequency distributions
 * for symbols 0..255 and EOS symbol 256.
 */
class FrequencyTable {
public:
    std::array<uint32_t, ALPHABET_SIZE> freqs{};
    std::array<uint32_t, ALPHABET_SIZE + 1> cum_freqs{};
    uint32_t total = 0;

    FrequencyTable() {
        // Initialize with Laplace smoothing (each symbol has count 1)
        freqs.fill(1);
        update_cumulative();
    }

    void set_frequencies(const uint64_t* raw_counts, size_t num_symbols) {
        freqs.fill(0);
        uint64_t raw_total = 0;
        for (size_t i = 0; i < num_symbols && i < 256; ++i) {
            raw_total += raw_counts[i];
        }

        // Always reserve 1 count for EOS
        if (raw_total == 0) {
            freqs.fill(1);
            update_cumulative();
            return;
        }

        // Scale raw frequencies down into [1, MAX_TOTAL_FREQ - 257]
        uint32_t target_sum = MAX_TOTAL_FREQ - 257;
        for (size_t i = 0; i < 256; ++i) {
            if (raw_counts[i] > 0) {
                uint32_t scaled = static_cast<uint32_t>(
                    (static_cast<double>(raw_counts[i]) / raw_total) * target_sum
                );
                freqs[i] = std::max(1u, scaled);
            }
        }
        freqs[EOS_SYMBOL] = 1; // EOS always has 1
        update_cumulative();

        // Enforce exact cap
        while (total > MAX_TOTAL_FREQ) {
            rescale_down();
        }
    }

    void increment(uint16_t symbol) {
        if (symbol >= ALPHABET_SIZE) return;
        freqs[symbol]++;
        total++;

        // If total exceeds threshold, halve frequencies to prevent overflow and weight recent history
        if (total >= MAX_TOTAL_FREQ) {
            rescale_down();
        } else {
            // Update cumulative counts from symbol onwards
            for (size_t i = symbol + 1; i <= ALPHABET_SIZE; ++i) {
                cum_freqs[i]++;
            }
        }
    }

    void rescale_down() {
        total = 0;
        for (size_t i = 0; i < ALPHABET_SIZE; ++i) {
            freqs[i] = (freqs[i] + 1) / 2;
            if (freqs[i] == 0) freqs[i] = 1;
            total += freqs[i];
        }
        update_cumulative();
    }

    void update_cumulative() {
        cum_freqs[0] = 0;
        for (size_t i = 0; i < ALPHABET_SIZE; ++i) {
            cum_freqs[i + 1] = cum_freqs[i] + freqs[i];
        }
        total = cum_freqs[ALPHABET_SIZE];
    }

    // Returns [low, high) cumulative frequency boundaries for a symbol
    std::pair<uint32_t, uint32_t> get_range(uint16_t symbol) const {
        if (symbol >= ALPHABET_SIZE) return {0, 0};
        return {cum_freqs[symbol], cum_freqs[symbol + 1]};
    }

    // Look up symbol given a scaled count value
    uint16_t find_symbol(uint32_t count) const {
        for (size_t i = 0; i < ALPHABET_SIZE; ++i) {
            if (count < cum_freqs[i + 1]) {
                return static_cast<uint16_t>(i);
            }
        }
        return EOS_SYMBOL;
    }
};

/**
 * @brief Step audit log for pedagogical visualization and debugging
 */
struct ArithmeticStepLog {
    size_t step_index = 0;
    uint16_t symbol = 0;
    bool is_eos = false;
    uint32_t low_before = 0;
    uint32_t high_before = 0;
    uint32_t sym_low = 0;
    uint32_t sym_high = 0;
    uint32_t total_freq = 0;
    uint32_t low_after = 0;
    uint32_t high_after = 0;
    uint32_t underflow_bits_added = 0;
    std::string emitted_bits;
    double probability = 0.0;
    double theoretical_bits = 0.0;
};

// =========================================================================
// STATIC ARITHMETIC ENCODER
// =========================================================================
inline std::vector<uint8_t> encode_static(const uint8_t* data, size_t size, std::vector<ArithmeticStepLog>* step_logs = nullptr) {
    if (size == 0) return {};

    // 1. Gather raw counts
    std::array<uint64_t, 256> raw_counts{};
    for (size_t i = 0; i < size; ++i) raw_counts[data[i]]++;

    FrequencyTable table;
    table.set_frequencies(raw_counts.data(), 256);

    BitWriter writer;

    // Header:
    // Magic: 0x41524954 ("ARIT") (4 bytes)
    writer.write_byte(0x41);
    writer.write_byte(0x52);
    writer.write_byte(0x49);
    writer.write_byte(0x54);

    // Mode: 0 = Static, 1 = Adaptive (1 byte)
    writer.write_byte(0);

    // Original uncompressed size (4 bytes, 32-bit big endian)
    writer.write_bits(static_cast<uint32_t>(size), 32);

    // Write frequency table (compact active symbol table)
    // First count how many active symbols exist
    uint16_t active_count = 0;
    for (size_t i = 0; i < 256; ++i) {
        if (table.freqs[i] > 0) active_count++;
    }
    writer.write_bits(active_count, 16);

    for (size_t i = 0; i < 256; ++i) {
        if (table.freqs[i] > 0) {
            writer.write_byte(static_cast<uint8_t>(i));
            writer.write_bits(table.freqs[i], 16);
        }
    }

    // 2. Arithmetic Coding State
    uint32_t low = 0;
    uint32_t high = TOP_VALUE;
    uint32_t underflow_bits = 0;

    auto emit_bit_with_underflow = [&](uint8_t bit, std::string* logged_bits = nullptr) {
        writer.write_bit(bit);
        if (logged_bits) logged_bits->push_back(bit ? '1' : '0');

        uint8_t opp = bit ^ 1u;
        while (underflow_bits > 0) {
            writer.write_bit(opp);
            if (logged_bits) logged_bits->push_back(opp ? '1' : '0');
            underflow_bits--;
        }
    };

    auto encode_symbol = [&](uint16_t symbol, size_t step_idx) {
        const auto [sym_low, sym_high] = table.get_range(symbol);
        const uint64_t range = static_cast<uint64_t>(high - low) + 1ULL;

        const uint32_t low_before = low;
        const uint32_t high_before = high;
        const uint32_t underflow_before = underflow_bits;

        high = low + static_cast<uint32_t>((range * sym_high) / table.total) - 1u;
        low  = low + static_cast<uint32_t>((range * sym_low)  / table.total);

        std::string emitted_bits;

        // Renormalization loop (E1, E2, E3)
        while (true) {
            if (high < HALF) {
                // E1 Renormalization: leading bit is 0
                emit_bit_with_underflow(0, &emitted_bits);
                low <<= 1;
                high = (high << 1) | 1u;
            } else if (low >= HALF) {
                // E2 Renormalization: leading bit is 1
                emit_bit_with_underflow(1, &emitted_bits);
                low = (low - HALF) << 1;
                high = ((high - HALF) << 1) | 1u;
            } else if (low >= FIRST_QUARTER && high < THIRD_QUARTER) {
                // E3 Renormalization (Underflow): interval straddles the midpoint
                underflow_bits++;
                low = (low - FIRST_QUARTER) << 1;
                high = ((high - FIRST_QUARTER) << 1) | 1u;
            } else {
                break;
            }
        }

        if (step_logs) {
            double prob = static_cast<double>(sym_high - sym_low) / table.total;
            step_logs->push_back({
                step_idx,
                symbol,
                symbol == EOS_SYMBOL,
                low_before,
                high_before,
                sym_low,
                sym_high,
                table.total,
                low,
                high,
                underflow_bits - underflow_before,
                emitted_bits,
                prob,
                -std::log2(std::max(1e-9, prob))
            });
        }
    };

    // Encode all data symbols
    for (size_t i = 0; i < size; ++i) {
        encode_symbol(data[i], i);
    }

    // Encode EOS symbol
    encode_symbol(EOS_SYMBOL, size);

    // Flush remaining state
    underflow_bits++;
    if (low < FIRST_QUARTER) {
        emit_bit_with_underflow(0);
    } else {
        emit_bit_with_underflow(1);
    }

    writer.flush();
    return writer.data();
}

// =========================================================================
// STATIC ARITHMETIC DECODER
// =========================================================================
inline std::vector<uint8_t> decode_static(const uint8_t* compressed_data, size_t compressed_size) {
    if (compressed_size < 9) {
        throw std::runtime_error("Arithmetic stream too small for header");
    }

    BitReader reader(compressed_data, compressed_size);

    // 1. Verify Magic: "ARIT"
    uint8_t m0 = reader.read_byte();
    uint8_t m1 = reader.read_byte();
    uint8_t m2 = reader.read_byte();
    uint8_t m3 = reader.read_byte();
    if (m0 != 0x41 || m1 != 0x52 || m2 != 0x49 || m3 != 0x54) {
        throw std::runtime_error("Invalid Arithmetic magic signature");
    }

    uint8_t mode = reader.read_byte();
    if (mode != 0) {
        throw std::runtime_error("Unsupported Arithmetic mode in decode_static");
    }

    uint32_t original_size = reader.read_bits(32);
    if (original_size == 0) return {};

    uint16_t active_count = static_cast<uint16_t>(reader.read_bits(16));
    FrequencyTable table;
    table.freqs.fill(0);
    for (uint16_t i = 0; i < active_count; ++i) {
        uint8_t sym = reader.read_byte();
        uint16_t freq = static_cast<uint16_t>(reader.read_bits(16));
        table.freqs[sym] = freq;
    }
    table.freqs[EOS_SYMBOL] = 1;
    table.update_cumulative();

    // Initialize 32-bit decoder state
    uint32_t low = 0;
    uint32_t high = TOP_VALUE;
    uint32_t value = 0;

    // Pre-load initial 32 bits from bitstream
    for (int i = 0; i < 32; ++i) {
        value = (value << 1) | (reader.has_more_bits() ? reader.read_bit() : 0);
    }

    std::vector<uint8_t> output;
    output.reserve(original_size);

    while (output.size() < original_size) {
        const uint64_t range = static_cast<uint64_t>(high - low) + 1ULL;
        // Scaled count corresponding to value inside current interval
        const uint64_t scaled = (static_cast<uint64_t>(value - low) + 1ULL) * table.total - 1ULL;
        const uint32_t count = static_cast<uint32_t>(scaled / range);

        const uint16_t symbol = table.find_symbol(count);
        if (symbol == EOS_SYMBOL) break;

        output.push_back(static_cast<uint8_t>(symbol));

        const auto [sym_low, sym_high] = table.get_range(symbol);
        high = low + static_cast<uint32_t>((range * sym_high) / table.total) - 1u;
        low  = low + static_cast<uint32_t>((range * sym_low)  / table.total);

        // Renormalization loop
        while (true) {
            if (high < HALF) {
                // E1: shift left
                low <<= 1;
                high = (high << 1) | 1u;
                value = (value << 1) | (reader.has_more_bits() ? reader.read_bit() : 0);
            } else if (low >= HALF) {
                // E2: shift left
                low = (low - HALF) << 1;
                high = ((high - HALF) << 1) | 1u;
                value = ((value - HALF) << 1) | (reader.has_more_bits() ? reader.read_bit() : 0);
            } else if (low >= FIRST_QUARTER && high < THIRD_QUARTER) {
                // E3 Underflow: shift left
                low = (low - FIRST_QUARTER) << 1;
                high = ((high - FIRST_QUARTER) << 1) | 1u;
                value = ((value - FIRST_QUARTER) << 1) | (reader.has_more_bits() ? reader.read_bit() : 0);
            } else {
                break;
            }
        }
    }

    return output;
}

// =========================================================================
// ADAPTIVE ARITHMETIC ENCODER (Single-Pass Online Learning, Zero Header)
// =========================================================================
inline std::vector<uint8_t> encode_adaptive(const uint8_t* data, size_t size) {
    if (size == 0) return {};

    FrequencyTable table; // Starts with uniform distribution (Laplace smoothing)

    BitWriter writer;

    // Header:
    // Magic: 0x41524954 ("ARIT") (4 bytes)
    writer.write_byte(0x41);
    writer.write_byte(0x52);
    writer.write_byte(0x49);
    writer.write_byte(0x54);

    // Mode: 1 = Adaptive (1 byte)
    writer.write_byte(1);

    // Original uncompressed size (4 bytes)
    writer.write_bits(static_cast<uint32_t>(size), 32);

    uint32_t low = 0;
    uint32_t high = TOP_VALUE;
    uint32_t underflow_bits = 0;

    auto emit_bit_with_underflow = [&](uint8_t bit) {
        writer.write_bit(bit);
        uint8_t opp = bit ^ 1u;
        while (underflow_bits > 0) {
            writer.write_bit(opp);
            underflow_bits--;
        }
    };

    auto encode_symbol = [&](uint16_t symbol) {
        const auto [sym_low, sym_high] = table.get_range(symbol);
        const uint64_t range = static_cast<uint64_t>(high - low) + 1ULL;

        high = low + static_cast<uint32_t>((range * sym_high) / table.total) - 1u;
        low  = low + static_cast<uint32_t>((range * sym_low)  / table.total);

        while (true) {
            if (high < HALF) {
                emit_bit_with_underflow(0);
                low <<= 1;
                high = (high << 1) | 1u;
            } else if (low >= HALF) {
                emit_bit_with_underflow(1);
                low = (low - HALF) << 1;
                high = ((high - HALF) << 1) | 1u;
            } else if (low >= FIRST_QUARTER && high < THIRD_QUARTER) {
                underflow_bits++;
                low = (low - FIRST_QUARTER) << 1;
                high = ((high - FIRST_QUARTER) << 1) | 1u;
            } else {
                break;
            }
        }

        // Dynamically increment frequency in model for online adaptation
        table.increment(symbol);
    };

    for (size_t i = 0; i < size; ++i) {
        encode_symbol(data[i]);
    }
    encode_symbol(EOS_SYMBOL);

    underflow_bits++;
    if (low < FIRST_QUARTER) {
        emit_bit_with_underflow(0);
    } else {
        emit_bit_with_underflow(1);
    }

    writer.flush();
    return writer.data();
}

// =========================================================================
// ADAPTIVE ARITHMETIC DECODER
// =========================================================================
inline std::vector<uint8_t> decode_adaptive(const uint8_t* compressed_data, size_t compressed_size) {
    if (compressed_size < 9) {
        throw std::runtime_error("Arithmetic stream too small for header");
    }

    BitReader reader(compressed_data, compressed_size);

    uint8_t m0 = reader.read_byte();
    uint8_t m1 = reader.read_byte();
    uint8_t m2 = reader.read_byte();
    uint8_t m3 = reader.read_byte();
    if (m0 != 0x41 || m1 != 0x52 || m2 != 0x49 || m3 != 0x54) {
        throw std::runtime_error("Invalid Arithmetic magic signature");
    }

    uint8_t mode = reader.read_byte();
    if (mode != 1) {
        throw std::runtime_error("Unsupported Arithmetic mode in decode_adaptive");
    }

    uint32_t original_size = reader.read_bits(32);
    if (original_size == 0) return {};

    FrequencyTable table; // Exact same initial uniform state

    uint32_t low = 0;
    uint32_t high = TOP_VALUE;
    uint32_t value = 0;

    for (int i = 0; i < 32; ++i) {
        value = (value << 1) | (reader.has_more_bits() ? reader.read_bit() : 0);
    }

    std::vector<uint8_t> output;
    output.reserve(original_size);

    while (output.size() < original_size) {
        const uint64_t range = static_cast<uint64_t>(high - low) + 1ULL;
        const uint64_t scaled = (static_cast<uint64_t>(value - low) + 1ULL) * table.total - 1ULL;
        const uint32_t count = static_cast<uint32_t>(scaled / range);

        const uint16_t symbol = table.find_symbol(count);
        if (symbol == EOS_SYMBOL) break;

        output.push_back(static_cast<uint8_t>(symbol));

        const auto [sym_low, sym_high] = table.get_range(symbol);
        high = low + static_cast<uint32_t>((range * sym_high) / table.total) - 1u;
        low  = low + static_cast<uint32_t>((range * sym_low)  / table.total);

        while (true) {
            if (high < HALF) {
                low <<= 1;
                high = (high << 1) | 1u;
                value = (value << 1) | (reader.has_more_bits() ? reader.read_bit() : 0);
            } else if (low >= HALF) {
                low = (low - HALF) << 1;
                high = ((high - HALF) << 1) | 1u;
                value = ((value - HALF) << 1) | (reader.has_more_bits() ? reader.read_bit() : 0);
            } else if (low >= FIRST_QUARTER && high < THIRD_QUARTER) {
                low = (low - FIRST_QUARTER) << 1;
                high = ((high - FIRST_QUARTER) << 1) | 1u;
                value = ((value - FIRST_QUARTER) << 1) | (reader.has_more_bits() ? reader.read_bit() : 0);
            } else {
                break;
            }
        }

        // Lock-step dynamic frequency update
        table.increment(symbol);
    }

    return output;
}

// Unified generic interface
inline std::vector<uint8_t> encode(const uint8_t* data, size_t size, bool adaptive = false) {
    return adaptive ? encode_adaptive(data, size) : encode_static(data, size);
}

inline std::vector<uint8_t> decode(const uint8_t* data, size_t size) {
    if (size < 5) throw std::runtime_error("Payload too short");
    uint8_t mode = data[4];
    return (mode == 1) ? decode_adaptive(data, size) : decode_static(data, size);
}

} // namespace compression::arithmetic
