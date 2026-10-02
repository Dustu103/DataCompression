#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include "lzw.hpp"
#include "../../common/metrics.hpp"
#include "../../common/test_framework.hpp"

using namespace compression;

void run_test(const std::string& label, const std::string& input_text, uint16_t code_bits = 12) {
    std::cout << "\n=======================================================\n";
    std::cout << "Test: " << label << " (" << input_text.size() << " bytes, " << code_bits << "-bit codes)\n";
    std::cout << "=======================================================\n";

    std::vector<uint8_t> input(input_text.begin(), input_text.end());
    double entropy = calculate_entropy(input);

    // 1. Inspect Code Stream & Intermediate Dictionary Construction
    auto codes = lzw::encode_to_codes(input.data(), input.size(), code_bits);
    std::cout << "Generated LZW Codes: " << codes.size() << " codes (from " << input.size() << " input bytes)\n";
    std::cout << "Code Sequence (First 16 max): [";
    for (size_t i = 0; i < std::min<size_t>(16, codes.size()); ++i) {
        std::cout << codes[i] << (i + 1 < std::min<size_t>(16, codes.size()) ? ", " : "");
    }
    if (codes.size() > 16) std::cout << ", ...";
    std::cout << "]\n";

    // 2. Encode to binary bitstream
    Timer t_enc;
    auto compressed = lzw::encode(input.data(), input.size(), code_bits);
    double enc_ms = t_enc.elapsed_ms();

    // 3. Decode from binary bitstream
    Timer t_dec;
    auto decompressed = lzw::decode(compressed.data(), compressed.size());
    double dec_ms = t_dec.elapsed_ms();

    // 4. Verify roundtrip integrity
    verify_lossless_roundtrip(input, decompressed, "LZW Roundtrip Verification");

    // 5. Output metrics
    auto metrics = compute_metrics(input.size(), compressed.size(), enc_ms, dec_ms, entropy);
    std::cout << metrics.summary() << "\n";

    auto stats = lzw::compute_stats(input.data(), input.size(), code_bits);
    std::cout << "--- Mathematical Size Reduction Breakdown ---\n";
    std::cout << "Raw Bits: " << stats.raw_bits << " bits (" << stats.raw_bytes << " B)\n";
    std::cout << "Compressed Payload: " << stats.compressed_payload_bits << " bits (" << stats.total_codes << " codes * " << code_bits << " bits)\n";
    std::cout << "Container Header: " << stats.header_bits << " bits (14 Bytes)\n";
    std::cout << "Total Archive: " << stats.total_compressed_bits << " bits (" << stats.total_compressed_bytes << " B)\n";
    std::cout << "Net Savings: " << (static_cast<int64_t>(stats.raw_bits) - static_cast<int64_t>(stats.total_compressed_bits)) << " bits (" 
              << std::fixed << std::setprecision(2) << stats.space_savings_percent << "%)\n";
}

int main() {
    print_header("LZW (Lempel-Ziv-Welch) Compression: Modern C++20 Verification & Benchmarks");

    // Test 1: Classic Terry Welch 1984 Paper Example
    run_test("Terry Welch Classic Sequence", "TOBEORNOTTOBEORTOBEORNOT#", 12);

    // Test 2: User's Byte-Oriented Example (ABCABCABC)
    run_test("User Byte-Oriented Repetition (ABCABCABC)", "ABCABCABC", 12);

    // Test 3: The Famous KwKwK / cScSc Edge Case
    // Pattern where next code is received by decoder before being registered in dictionary
    run_test("The KwKwK Decoder Edge Case (ABABABA)", "ABABABA", 12);

    // Test 4: Extreme Repeating Character Run (triggers repeated KwKwK cascading entries)
    std::string repeating_run(128, 'A');
    repeating_run += "BBBBBBBBBBBBBBBB";
    run_test("Cascading Repeating Character Run", repeating_run, 12);

    // Test 5: Structured HTML / Web Document
    std::string html_doc = 
        "<!DOCTYPE html><html><head><title>LZW Test</title></head>"
        "<body><div><span>Hello World</span><span>Hello World</span></div></body></html>";
    run_test("Structured HTML Document", html_doc, 12);

    // Test 6: Short Non-Repeating String (Expansion Hazard)
    run_test("Non-Repeating Sequence (Expansion Hazard)", "abcdefghijklmnopqrstuvwxyz0123456789", 12);

    return 0;
}
