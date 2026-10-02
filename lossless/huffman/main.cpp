#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include "huffman.hpp"
#include "../../common/metrics.hpp"
#include "../../common/test_framework.hpp"

using namespace compression;

void run_test(const std::string& label, const std::string& input_text) {
    std::cout << "\n=======================================================\n";
    std::cout << "Test: " << label << " (" << input_text.size() << " bytes)\n";
    std::cout << "=======================================================\n";

    std::vector<uint8_t> input(input_text.begin(), input_text.end());
    double entropy = calculate_entropy(input);

    Timer t_enc;
    auto compressed = huffman::encode(input.data(), input.size());
    double enc_ms = t_enc.elapsed_ms();

    Timer t_dec;
    auto decompressed = huffman::decode(compressed.data(), compressed.size());
    double dec_ms = t_dec.elapsed_ms();

    verify_lossless_roundtrip(input, decompressed, "Canonical Huffman Roundtrip");
    auto metrics = compute_metrics(input.size(), compressed.size(), enc_ms, dec_ms, entropy);
    std::cout << metrics.summary() << "\n";

    double redundancy = metrics.bits_per_symbol - entropy;
    std::cout << "Theoretical Redundancy: " << redundancy << " bits/symbol (Shannon Excess)\n";
}

int main() {
    print_header("Canonical Huffman Coding: Verification & Shannon Limit Benchmark");

    // Test 1: Classic Huffman text
    run_test("Standard English Text", 
             "A_DEAD_DAD_CEDED_A_BAD_BABE_A_BEADED_ABACUS");

    // Test 2: Highly skewed / geometric distribution (A=50%, B=25%, C=12.5%, D=12.5%)
    std::string biased = "";
    for (int i = 0; i < 500; ++i) biased += 'A';
    for (int i = 0; i < 250; ++i) biased += 'B';
    for (int i = 0; i < 125; ++i) biased += 'C';
    for (int i = 0; i < 125; ++i) biased += 'D';
    run_test("Geometric Distribution (A:50%, B:25%, C:12.5%, D:12.5%)", biased);

    // Test 3: Edge Case - Single repeated symbol
    std::string single_sym(200, 'Z');
    run_test("Edge Case: Single Repeated Character", single_sym);

    return 0;
}
