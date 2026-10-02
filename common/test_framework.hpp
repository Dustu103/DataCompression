#pragma once

#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <cassert>
#include <functional>
#include "metrics.hpp"

namespace compression {

class Timer {
public:
    Timer() : start_(std::chrono::high_resolution_clock::now()) {}
    void reset() { start_ = std::chrono::high_resolution_clock::now(); }
    double elapsed_ms() const {
        auto now = std::chrono::high_resolution_clock::now();
        return std::chrono::duration<double, std::milli>(now - start_).count();
    }
private:
    std::chrono::time_point<std::chrono::high_resolution_clock> start_;
};

inline void print_header(const std::string& title) {
    std::cout << "\n=======================================================\n";
    std::cout << "  " << title << "\n";
    std::cout << "=======================================================\n";
}

inline void print_success(const std::string& msg) {
    std::cout << "[PASS] " << msg << "\n";
}

inline void print_failure(const std::string& msg) {
    std::cerr << "[FAIL] " << msg << "\n";
}

/**
 * @brief Verifies that decoded output matches original byte-for-byte.
 */
inline bool verify_lossless_roundtrip(const std::vector<uint8_t>& original,
                                      const std::vector<uint8_t>& decoded,
                                      const std::string& test_name = "Round-Trip Verification") {
    if (original.size() != decoded.size()) {
        print_failure(test_name + ": Size mismatch! Original: " +
                      std::to_string(original.size()) + " vs Decoded: " +
                      std::to_string(decoded.size()));
        return false;
    }
    for (size_t i = 0; i < original.size(); ++i) {
        if (original[i] != decoded[i]) {
            print_failure(test_name + ": Byte mismatch at index " + std::to_string(i) +
                          "! Expected 0x" + std::to_string(static_cast<int>(original[i])) +
                          ", got 0x" + std::to_string(static_cast<int>(decoded[i])));
            return false;
        }
    }
    print_success(test_name + " [100% Identical byte-for-byte (" + std::to_string(original.size()) + " bytes)]");
    return true;
}

} // namespace compression
