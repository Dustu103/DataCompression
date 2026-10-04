#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include "lz77.hpp"
#include "../../common/metrics.hpp"
#include "../../common/test_framework.hpp"

using namespace compression;

void run_test(const std::string& label, const std::string& input_text) {
    std::cout << "\n=======================================================\n";
    std::cout << "Test: " << label << " (" << input_text.size() << " bytes)\n";
    std::cout << "=======================================================\n";

    std::vector<uint8_t> input(input_text.begin(), input_text.end());
    double entropy = calculate_entropy(input);

    // -------------------------------------------------------------
    // 1. CLASSIC LZ77 (1977 TRIPLETS: distance, length, next_char)
    // -------------------------------------------------------------
    auto lz77_tokens = lz77::encode_tokens(input.data(), input.size());
    Timer t_lz77_enc;
    auto lz77_compressed = lz77::encode(input.data(), input.size());
    double lz77_enc_ms = t_lz77_enc.elapsed_ms();

    Timer t_lz77_dec;
    auto lz77_decompressed = lz77::decode(lz77_compressed.data(), lz77_compressed.size());
    double lz77_dec_ms = t_lz77_dec.elapsed_ms();

    verify_lossless_roundtrip(input, lz77_decompressed, "Classic LZ77 Roundtrip Verification");

    // -------------------------------------------------------------
    // 2. MODERN LZSS (1982 1-BIT FLAGS: [0, lit] vs [1, dist, len])
    // -------------------------------------------------------------
    auto lzss_tokens = lzss::encode_tokens(input.data(), input.size());
    size_t lzss_lits = 0;
    size_t lzss_matches = 0;
    for (const auto& t : lzss_tokens) {
        if (t.is_match) lzss_matches++; else lzss_lits++;
    }

    Timer t_lzss_enc;
    auto lzss_compressed = lzss::encode(input.data(), input.size());
    double lzss_enc_ms = t_lzss_enc.elapsed_ms();

    Timer t_lzss_dec;
    auto lzss_decompressed = lzss::decode(lzss_compressed.data(), lzss_compressed.size());
    double lzss_dec_ms = t_lzss_dec.elapsed_ms();

    verify_lossless_roundtrip(input, lzss_decompressed, "Modern LZSS Roundtrip Verification");

    // -------------------------------------------------------------
    // 3. COMPARATIVE AUDIT & SAVINGS
    // -------------------------------------------------------------
    std::cout << "\n--- TOKEN BREAKDOWN ---\n";
    std::cout << "Classic LZ77 : " << lz77_tokens.size() << " triplets (28 bits/token fixed)\n";
    std::cout << "Modern LZSS  : " << lzss_tokens.size() << " tokens (" 
              << lzss_lits << " literals @ 9b, " 
              << lzss_matches << " matches @ 21b, MIN_MATCH=" << lzss::MIN_MATCH << ")\n";

    std::cout << "\n--- COMPARATIVE RESULTS ---\n";
    std::cout << std::left << std::setw(20) << "Metric" 
              << std::setw(18) << "Classic LZ77" 
              << std::setw(18) << "Modern LZSS" 
              << "Delta (LZSS vs LZ77)\n";
    std::cout << std::string(68, '-') << "\n";

    std::cout << std::left << std::setw(20) << "Output Size" 
              << std::setw(18) << (std::to_string(lz77_compressed.size()) + " B")
              << std::setw(18) << (std::to_string(lzss_compressed.size()) + " B");

    int delta_bytes = static_cast<int>(lz77_compressed.size()) - static_cast<int>(lzss_compressed.size());
    if (delta_bytes >= 0) {
        double pct_saved = (100.0 * delta_bytes) / lz77_compressed.size();
        std::cout << "LZSS is " << delta_bytes << " B smaller (-" 
                  << std::fixed << std::setprecision(1) << pct_saved << "%)\n";
    } else {
        std::cout << "+" << (-delta_bytes) << " B\n";
    }

    double lz77_ratio = (double)input.size() / lz77_compressed.size();
    double lzss_ratio = (double)input.size() / lzss_compressed.size();
    std::cout << std::left << std::setw(20) << "Ratio" 
              << std::setw(18) << (std::to_string(lz77_ratio).substr(0, 5) + ":1")
              << std::setw(18) << (std::to_string(lzss_ratio).substr(0, 5) + ":1")
              << "\n";

    std::cout << std::left << std::setw(20) << "Bits / Symbol"
              << std::setw(18) << std::to_string((lz77_compressed.size() * 8.0) / input.size()).substr(0, 5)
              << std::setw(18) << std::to_string((lzss_compressed.size() * 8.0) / input.size()).substr(0, 5)
              << "H(X) = " << std::fixed << std::setprecision(2) << entropy << " b/sym\n";

    if (lz77_compressed.size() > input.size() && lzss_compressed.size() <= input.size()) {
        std::cout << "💡 BREAKTHROUGH: Classic LZ77 caused NEGATIVE EXPANSION, but LZSS successfully COMPRESSED the data!\n";
    }
}

int main() {
    print_header("LZ77 (1977) vs LZSS (1982): Comparative Benchmarks & Verification");

    // Test 1: Repetitive English sentences (ideal for sliding window)
    run_test("Repetitive Text Pattern", 
             "THE CAR ON THE LEFT PASSED THE CAR ON THE RIGHT AND HIT THE CAR IN THE MIDDLE. "
             "THE CAR ON THE LEFT WAS RED, THE CAR ON THE RIGHT WAS BLUE.");

    // Test 2: Self-referential RLE-style overlapping repetition
    std::string repeating_pattern = "ABRACADABRA_ABRACADABRA_ABRACADABRA_ABRACADABRA!";
    run_test("Overlapping Substring Matches", repeating_pattern);

    // Test 3: Long repeated run (self-referential match length > distance)
    std::string long_run(250, 'X');
    long_run += "---END---";
    run_test("Long Run-Length Repetition (Self-referential)", long_run);

    // Test 4: Structured C++ code snippet (high repetition of keywords and symbols)
    std::string code_snippet = 
        "#include <iostream>\n"
        "int main() {\n"
        "    std::cout << \"Hello World 1\" << std::endl;\n"
        "    std::cout << \"Hello World 2\" << std::endl;\n"
        "    std::cout << \"Hello World 3\" << std::endl;\n"
        "    return 0;\n"
        "}\n";
    run_test("Structured Code Snippet", code_snippet);

    // Test 5: Negative Compression hazard (Short unique alphabet)
    run_test("Short Non-Repeating Sequence (Expansion Hazard)", "abcdefghijklmnopqrstuvwxyz0123456789");

    return 0;
}
