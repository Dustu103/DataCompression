#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include <cmath>
#include "arithmetic.hpp"
#include "../huffman/huffman.hpp"
#include "../../common/metrics.hpp"
#include "../../common/test_framework.hpp"

using namespace compression;

void run_test(const std::string& label, const std::string& input_text) {
    std::cout << "\n=======================================================\n";
    std::cout << "Test: " << label << " (" << input_text.size() << " bytes)\n";
    std::cout << "=======================================================\n";

    std::vector<uint8_t> input(input_text.begin(), input_text.end());
    double entropy = calculate_entropy(input);
    double shannon_bits = entropy * input.size();

    std::cout << std::fixed << std::setprecision(4);
    std::cout << "Shannon Entropy H(X): " << entropy << " bits/symbol (Theoretical minimum: " 
              << std::ceil(shannon_bits / 8.0) << " bytes)\n\n";

    // 1. Canonical Huffman
    Timer t_huff;
    auto huff_compressed = huffman::encode(input.data(), input.size());
    double huff_time = t_huff.elapsed_ms();
    auto huff_decomp = huffman::decode(huff_compressed.data(), huff_compressed.size());
    verify_lossless_roundtrip(input, huff_decomp, "Huffman Roundtrip Verification");

    // 2. Static Arithmetic Coding
    Timer t_stat_enc;
    std::vector<arithmetic::ArithmeticStepLog> logs;
    auto stat_compressed = arithmetic::encode_static(input.data(), input.size(), &logs);
    double stat_enc_time = t_stat_enc.elapsed_ms();

    Timer t_stat_dec;
    auto stat_decomp = arithmetic::decode_static(stat_compressed.data(), stat_compressed.size());
    double stat_dec_time = t_stat_dec.elapsed_ms();
    verify_lossless_roundtrip(input, stat_decomp, "Static Arithmetic Roundtrip Verification");

    // 3. Adaptive Arithmetic Coding
    Timer t_adapt_enc;
    auto adapt_compressed = arithmetic::encode_adaptive(input.data(), input.size());
    double adapt_enc_time = t_adapt_enc.elapsed_ms();

    Timer t_adapt_dec;
    auto adapt_decomp = arithmetic::decode_adaptive(adapt_compressed.data(), adapt_compressed.size());
    double adapt_dec_time = t_adapt_dec.elapsed_ms();
    verify_lossless_roundtrip(input, adapt_decomp, "Adaptive Arithmetic Roundtrip Verification");

    // 4. Comparison Summary Table
    std::cout << "\n" << std::string(75, '-') << "\n";
    std::cout << std::left << std::setw(25) << "Algorithm" 
              << std::setw(15) << "Compressed Size" 
              << std::setw(15) << "Bits / Symbol" 
              << std::setw(12) << "Ratio" 
              << "Enc Time\n";
    std::cout << std::string(75, '-') << "\n";

    auto print_row = [&](const std::string& name, size_t bytes, double time_ms) {
        double bits_per_sym = (static_cast<double>(bytes) * 8.0) / input.size();
        double ratio = static_cast<double>(input.size()) / std::max(1ULL, static_cast<unsigned long long>(bytes));
        std::cout << std::left << std::setw(25) << name 
                  << std::setw(15) << (std::to_string(bytes) + " B")
                  << std::setw(15) << bits_per_sym
                  << std::setw(12) << (std::to_string(ratio).substr(0, 4) + ":1")
                  << time_ms << " ms\n";
    };

    print_row("Raw Input", input.size(), 0.0);
    print_row("Canonical Huffman", huff_compressed.size(), huff_time);
    print_row("Static Arithmetic", stat_compressed.size(), stat_enc_time);
    print_row("Adaptive Arithmetic", adapt_compressed.size(), adapt_enc_time);
    std::cout << std::string(75, '-') << "\n";

    if (entropy < 1.0) {
        std::cout << "[KEY PEDAGOGICAL INSIGHT] Entropy H(X) = " << entropy << " < 1.0 bit/symbol!\n";
        std::cout << "Notice that Canonical Huffman is fundamentally bounded by the 1-bit integer floor.\n";
        std::cout << "Arithmetic Coding breaks this floor by allocating fractional bits per symbol,\n";
        std::cout << "achieving true Shannon entropy density!\n";
    }
}

int main() {
    std::cout << "===============================================================\n";
    std::cout << "ARITHMETIC CODING (STATIC & ADAPTIVE) - BENCHMARK & AUDIT SUITE\n";
    std::cout << "===============================================================\n";

    // 1. Skewed Distribution (95% 'A', 5% 'B') -> The Achilles Heel of Huffman
    std::string skewed;
    for (int i = 0; i < 950; ++i) skewed += 'A';
    for (int i = 0; i < 50; ++i) skewed += 'B';
    run_test("Highly Skewed Biased Distribution (95% A, 5% B)", skewed);

    // 2. Claude Shannon 1948 Famous Paper Text
    std::string shannon_text = 
        "Information theory and data compression algorithms are the foundational pillars of modern computer "
        "science and telecommunications. In 1948, Claude Shannon published 'A Mathematical Theory of Communication', "
        "establishing that the absolute theoretical limit of lossless data compression is determined by entropy H(X). "
        "Arithmetic coding represents the exact realization of this theorem, assigning fractional bits per symbol.";
    run_test("Shannon Historical Text Excerpt", shannon_text);

    // 3. DNA Genomic Sequence (4-symbol alphabet: A, C, G, T)
    std::string dna;
    std::string bases = "AACCGTTTAAACCCGGGTTTAAAAA";
    for (int i = 0; i < 40; ++i) dna += bases;
    run_test("DNA Genomic Nucleotide Sequence", dna);

    // 4. Repeated Run / Extreme Redundancy
    std::string runs(500, 'Z');
    run_test("Monolithic Single Symbol (500 Z's)", runs);

    std::cout << "\nAll Arithmetic Coding tests passed successfully!\n";
    return 0;
}
