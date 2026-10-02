#pragma once

#include <vector>
#include <cstdint>
#include <cmath>
#include <array>
#include <iomanip>
#include <sstream>
#include <string>
#include <chrono>

namespace compression {

/**
 * @brief Information-theoretic and statistical compression evaluation metrics.
 */
struct CompressionMetrics {
    size_t original_bytes = 0;
    size_t compressed_bytes = 0;
    double compression_ratio = 1.0;     // original / compressed (e.g. 2.5x)
    double space_saving_percent = 0.0;  // (1 - compressed / original) * 100%
    double bits_per_symbol = 8.0;       // (compressed_bits / original_symbols)
    double shannon_entropy = 0.0;       // Theoretical zero-memory entropy limit (bits/symbol)
    double encode_time_ms = 0.0;
    double decode_time_ms = 0.0;
    double encode_throughput_mb_s = 0.0;
    double decode_throughput_mb_s = 0.0;

    std::string summary() const {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(3);
        oss << "┌──────────────────────────────────────────────┐\n";
        oss << "│            Compression Report                │\n";
        oss << "├──────────────────────────────────────────────┤\n";
        oss << "│ Original Size       : " << std::setw(10) << original_bytes << " bytes       │\n";
        oss << "│ Compressed Size     : " << std::setw(10) << compressed_bytes << " bytes       │\n";
        oss << "│ Compression Ratio   : " << std::setw(10) << compression_ratio << " : 1         │\n";
        oss << "│ Space Savings       : " << std::setw(9) << space_saving_percent << " %           │\n";
        oss << "│ Bits per Symbol     : " << std::setw(10) << bits_per_symbol << " b/sym       │\n";
        oss << "│ Shannon Entropy H(X): " << std::setw(10) << shannon_entropy << " b/sym       │\n";
        oss << "│ Encode Speed        : " << std::setw(10) << encode_throughput_mb_s << " MB/s       │\n";
        oss << "│ Decode Speed        : " << std::setw(10) << decode_throughput_mb_s << " MB/s       │\n";
        oss << "└──────────────────────────────────────────────┘\n";
        return oss.str();
    }
};

/**
 * @brief Computes empirical 0th-order Shannon Entropy:
 * H(X) = - \sum_{i} P(x_i) \log_2 P(x_i)
 */
inline double calculate_entropy(const uint8_t* data, size_t size) {
    if (size == 0) return 0.0;

    std::array<size_t, 256> counts{};
    for (size_t i = 0; i < size; ++i) {
        counts[data[i]]++;
    }

    double entropy = 0.0;
    const double inv_size = 1.0 / static_cast<double>(size);
    for (size_t count : counts) {
        if (count > 0) {
            double p = static_cast<double>(count) * inv_size;
            entropy -= p * std::log2(p);
        }
    }
    return entropy;
}

inline double calculate_entropy(const std::vector<uint8_t>& data) {
    return calculate_entropy(data.data(), data.size());
}

/**
 * @brief Computes standard evaluation metrics given original and compressed sizes.
 */
inline CompressionMetrics compute_metrics(size_t orig_bytes, size_t comp_bytes,
                                          double enc_time_ms = 0.0, double dec_time_ms = 0.0,
                                          double entropy = 0.0) {
    CompressionMetrics m;
    m.original_bytes = orig_bytes;
    m.compressed_bytes = comp_bytes;
    m.compression_ratio = (comp_bytes > 0) ? (static_cast<double>(orig_bytes) / comp_bytes) : 0.0;
    m.space_saving_percent = (orig_bytes > 0) ? (1.0 - static_cast<double>(comp_bytes) / orig_bytes) * 100.0 : 0.0;
    m.bits_per_symbol = (orig_bytes > 0) ? (static_cast<double>(comp_bytes * 8) / orig_bytes) : 0.0;
    m.shannon_entropy = entropy;
    m.encode_time_ms = enc_time_ms;
    m.decode_time_ms = dec_time_ms;

    if (enc_time_ms > 0.0) {
        m.encode_throughput_mb_s = (static_cast<double>(orig_bytes) / (1024.0 * 1024.0)) / (enc_time_ms / 1000.0);
    }
    if (dec_time_ms > 0.0) {
        m.decode_throughput_mb_s = (static_cast<double>(orig_bytes) / (1024.0 * 1024.0)) / (dec_time_ms / 1000.0);
    }

    return m;
}

/**
 * @brief Lossy Distortion Metrics: Mean Squared Error (MSE) & Peak Signal-to-Noise Ratio (PSNR)
 */
struct LossyDistortionMetrics {
    double mse = 0.0;
    double psnr_db = 0.0;
    double max_error = 0.0;

    std::string summary() const {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(3);
        oss << "Distortion Metrics: MSE = " << mse
            << ", Max Error = " << max_error
            << ", PSNR = " << psnr_db << " dB";
        return oss.str();
    }
};

inline LossyDistortionMetrics compute_distortion(const uint8_t* orig, const uint8_t* recon, size_t size, double max_val = 255.0) {
    LossyDistortionMetrics d;
    if (size == 0) return d;

    double sum_sq_err = 0.0;
    for (size_t i = 0; i < size; ++i) {
        double diff = std::abs(static_cast<double>(orig[i]) - static_cast<double>(recon[i]));
        if (diff > d.max_error) d.max_error = diff;
        sum_sq_err += diff * diff;
    }

    d.mse = sum_sq_err / static_cast<double>(size);
    if (d.mse <= 1e-10) {
        d.psnr_db = 999.99; // Effectively lossless / infinity
    } else {
        d.psnr_db = 10.0 * std::log10((max_val * max_val) / d.mse);
    }
    return d;
}

} // namespace compression
