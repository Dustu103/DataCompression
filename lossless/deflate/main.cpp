#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include "deflate.hpp"
#include "../../common/metrics.hpp"
#include "../../common/test_framework.hpp"

using namespace compression;

void run_test(const std::string& label, const std::string& input_text) {
    std::cout << "\n=======================================================\n";
    std::cout << "Test: " << label << " (" << input_text.size() << " bytes)\n";
    std::cout << "=======================================================\n";

    std::vector<uint8_t> input(input_text.begin(), input_text.end());
    double entropy = calculate_entropy(input);

    deflate::DeflateStats stats;

    Timer t_enc;
    auto compressed = deflate::encode(input.data(), input.size(), &stats);
    double enc_ms = t_enc.elapsed_ms();

    Timer t_dec;
    auto decompressed = deflate::decode(compressed.data(), compressed.size());
    double dec_ms = t_dec.elapsed_ms();

    // 1. Verify 100% Roundtrip Bit-Exact Invertibility
    verify_lossless_roundtrip(input, decompressed, "DEFLATE Roundtrip Verification");

    // 2. Output Mathematical Size Reduction Breakdown
    std::cout << "\n--- [Stage-by-Stage Mathematical Size Reduction Breakdown] ---\n";
    std::cout << "1. BEFORE COMPRESSION (Raw Input):\n";
    std::cout << "   • Total Raw Bytes    : " << stats.raw_bytes << " bytes\n";
    std::cout << "   • Total Raw Bits     : " << stats.raw_bytes * 8 << " bits (@ 8 bits/symbol)\n";
    std::cout << "   • Shannon Entropy    : " << std::fixed << std::setprecision(3) << entropy << " bits/symbol\n";

    std::cout << "\n2. STAGE 1: LZ77 DEDUPLICATION (Pattern Matching):\n";
    std::cout << "   • Intermediate Tokens: " << stats.lz77_tokens_count << " (Literals + Matches + EOB)\n";
    std::cout << "   • Repeated Phrases   : " << stats.lz77_matches_count << " matches found\n";
    std::cout << "   • Bytes Deduplicated : " << stats.lz77_bytes_deduplicated << " redundant bytes replaced\n";
    std::cout << "   • Unmatched Literals : " << stats.lz77_literals_count << " bytes passed to Huffman\n";

    std::cout << "\n3. STAGE 2: CANONICAL HUFFMAN (Entropy Coding):\n";
    std::cout << "   • Lit/Len Tree Header: " << stats.lit_tree_header_bytes << " bytes\n";
    std::cout << "   • Dist Tree Header   : " << stats.dist_tree_header_bytes << " bytes\n";
    std::cout << "   • Huffman Payload    : " << stats.compressed_payload_bits << " bits\n";

    std::cout << "\n4. AFTER COMPRESSION (Total Output File):\n";
    std::cout << "   • Final Size         : " << stats.total_compressed_bytes << " bytes (" 
              << stats.total_compressed_bytes * 8 << " bits)\n";
    long long delta_bits = (long long)(stats.raw_bytes * 8) - (long long)(stats.total_compressed_bytes * 8);
    std::cout << "   • Net Delta Bits     : " << (delta_bits >= 0 ? "-" : "+") << std::abs(delta_bits) 
              << " bits (" << std::fixed << std::setprecision(2) << stats.space_savings_percent << "% size reduction)\n";
    std::cout << "   • Compression Ratio  : " << std::fixed << std::setprecision(2) << stats.compression_ratio << " : 1\n";
}

int main() {
    print_header("DEFLATE Compound Architecture: LZ77 + Dual Canonical Huffman Coding");

    // Test 1: Repetitive English text
    run_test("Repetitive Text Pattern", 
             "THE CAR ON THE LEFT PASSED THE CAR ON THE RIGHT AND HIT THE CAR IN THE MIDDLE. "
             "THE CAR ON THE LEFT WAS RED, THE CAR ON THE RIGHT WAS BLUE.");

    // Test 2: Structured source code (HTML / C++)
    std::string html_doc = 
        "<!DOCTYPE html><html><head><title>Compression</title></head>"
        "<body><div class=\"container\"><div class=\"row\"><p>Hello World</p></div>"
        "<div class=\"row\"><p>Hello World</p></div></div></body></html>";
    run_test("Structured HTML Document", html_doc);

    // Test 3: Self-referential RLE repeating runs
    std::string repeating_runs(250, 'A');
    repeating_runs += "---SECTION_BREAK---";
    for (int i = 0; i < 200; ++i) repeating_runs += 'B';
    run_test("Long Run-Length Repetitions", repeating_runs);

    // Test 4: Mixed text with unique words
    std::string mixed = "Knowledge is power. Power tends to corrupt, and absolute power corrupts absolutely. "
                        "Unique characters: 1234567890!@#$%^&*()_+";
    run_test("Mixed Repetition & Literals", mixed);

    return 0;
}
