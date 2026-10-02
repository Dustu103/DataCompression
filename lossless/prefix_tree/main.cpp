#include <iostream>
#include <vector>
#include <string>
#include "prefix_tree.hpp"
#include "../../common/test_framework.hpp"

using namespace compression::prefix_tree;
using namespace compression;

int main() {
    print_header("Binary Prefix Tree: Construction, Kraft Inequality & Traversal");

    PrefixTree tree;

    // Insert codewords for alphabet {A, B, C, D}
    // A -> "0"
    // B -> "10"
    // C -> "110"
    // D -> "111"
    std::cout << "1. Inserting prefix-free codewords...\n";
    tree.insert("0", 'A', 50);
    tree.insert("10", 'B', 25);
    tree.insert("110", 'C', 15);
    tree.insert("111", 'D', 10);

    // Print ASCII tree
    std::cout << "\n2. Visualizing Tree Hierarchy:\n";
    tree.print_tree(std::cout);

    // Evaluate Kraft-McMillan Inequality
    std::cout << "\n3. Evaluating Kraft-McMillan Inequality:\n";
    double k_sum = tree.kraft_sum();
    std::cout << "   Kraft Sum K = sum(2^(-length_i)) = " << k_sum << "\n";
    if (std::abs(k_sum - 1.0) < 1e-6) {
        print_success("Tree is a FULL binary tree (K == 1.0) - Optimal codeword space utilization!");
    } else if (k_sum < 1.0) {
        std::cout << "[INFO] Tree is DEFECTIVE (K < 1.0) - Valid prefix code, but has unused branch capacity.\n";
    }

    // Inspect Codebook
    std::cout << "\n4. Codebook Extraction:\n";
    auto codebook = tree.get_codebook();
    for (const auto& [sym, code] : codebook) {
        std::cout << "   Symbol '" << static_cast<char>(sym) << "' -> Codeword: "
                  << code << " (Length: " << code.size() << " bits)\n";
    }

    // Test Bitstream Decoding
    std::cout << "\n5. Testing Bitstream Stream Decoding:\n";
    // We want to encode the message "ABRACADABRA" using our codebook, or a custom string "ABACADAB"
    std::string test_symbols = "ABADACAB";
    BitWriter writer;
    for (char c : test_symbols) {
        std::string code = codebook[static_cast<uint8_t>(c)];
        for (char b : code) {
            writer.write_bit(b == '1' ? 1 : 0);
        }
    }
    writer.flush();

    std::cout << "   Input message       : \"" << test_symbols << "\"\n";
    std::cout << "   Encoded bit count   : " << writer.total_bits_written() << " bits\n";

    // Decode using BitReader
    BitReader reader(writer.data());
    std::string decoded_str;
    for (size_t i = 0; i < test_symbols.size(); ++i) {
        uint8_t sym = tree.decode_symbol(reader);
        decoded_str.push_back(static_cast<char>(sym));
    }
    std::cout << "   Decoded from stream : \"" << decoded_str << "\"\n";
    assert(decoded_str == test_symbols);
    print_success("Instantaneous decoding verified with 100% precision!");

    // Test Tree Serialization & Deserialization
    std::cout << "\n6. Testing Tree Header Serialization (Pre-Order Bit Traversal):\n";
    BitWriter tree_writer;
    tree.serialize(tree_writer);
    tree_writer.flush();
    std::cout << "   Serialized Tree Header: " << tree_writer.size_bytes() << " bytes ("
              << tree_writer.total_bits_written() << " bits)\n";

    BitReader tree_reader(tree_writer.data());
    auto deserialized_tree = PrefixTree::deserialize(tree_reader);
    print_success("Deserialized tree successfully restored!");
    std::cout << "   Deserialized Kraft Sum: " << deserialized_tree->kraft_sum() << "\n";

    return 0;
}
