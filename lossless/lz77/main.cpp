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

    // 1. Inspect Token Stream
    auto tokens = lz77::encode_tokens(input.data(), input.size());
    std::cout << "Generated LZ77 Tokens: " << tokens.size() << " triplets\n";
    std::cout << "Sample First 8 Tokens (Distance, Length, Next):\n";
    for (size_t i = 0; i < std::min<size_t>(8, tokens.size()); ++i) {
        char ch = (tokens[i].next_literal >= 32 && tokens[i].next_literal <= 126) ? 
                   static_cast<char>(tokens[i].next_literal) : '.';
        std::cout << "  [" << i << "] (d=" << tokens[i].distance 
                  << ", l=" << tokens[i].length 
                  << ", '" << ch << "')\n";
    }

    // 2. Encode to binary bitstream
    Timer t_enc;
    auto compressed = lz77::encode(input.data(), input.size());
    double enc_ms = t_enc.elapsed_ms();

    // 3. Decode from binary bitstream
    Timer t_dec;
    auto decompressed = lz77::decode(compressed.data(), compressed.size());
    double dec_ms = t_dec.elapsed_ms();

    // 4. Verify roundtrip integrity
    verify_lossless_roundtrip(input, decompressed, "LZ77 Roundtrip Verification");

    // 5. Output metrics
    auto metrics = compute_metrics(input.size(), compressed.size(), enc_ms, dec_ms, entropy);
    std::cout << metrics.summary() << "\n";

    if (compressed.size() > input.size()) {
        std::cout << "⚠ Note: Negative compression occurred! (Expansion factor: " 
                  << std::fixed << std::setprecision(2) << (double)compressed.size() / input.size() 
                  << "x) due to lack of repeated substrings.\n";
    } else {
        std::cout << "✓ Space Saved: " 
                  << (100.0 * (input.size() - compressed.size()) / input.size()) << "%\n";
    }
}

int main() {
    print_header("LZ77 Sliding Window Compression: Verification & Benchmarks");

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
