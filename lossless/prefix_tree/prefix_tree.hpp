#pragma once

#include <iostream>
#include <vector>
#include <string>
#include <memory>
#include <unordered_map>
#include <cmath>
#include <stdexcept>
#include <iomanip>
#include "../../common/bit_stream.hpp"

namespace compression::prefix_tree {

struct Node {
    bool is_leaf = false;
    uint8_t symbol = 0;
    uint64_t weight = 0;
    std::unique_ptr<Node> left;   // bit '0'
    std::unique_ptr<Node> right;  // bit '1'

    Node() = default;
    explicit Node(uint8_t sym, uint64_t wt = 0)
        : is_leaf(true), symbol(sym), weight(wt) {}
};

class PrefixTree {
public:
    PrefixTree() : root_(std::make_unique<Node>()) {}

    /**
     * @brief Inserts a symbol with a specific binary code string (e.g. "010").
     * Validates that no prefix conflict exists (i.e. path doesn't pass through an existing leaf,
     * and new node doesn't become a parent of an existing leaf).
     */
    void insert(const std::string& bit_code, uint8_t symbol, uint64_t weight = 0) {
        if (bit_code.empty()) {
            throw std::invalid_argument("Cannot insert an empty bit code as a codeword.");
        }

        Node* curr = root_.get();
        for (size_t i = 0; i < bit_code.size(); ++i) {
            char bit = bit_code[i];
            if (curr->is_leaf) {
                throw std::logic_error("Prefix conflict: Tried to branch from existing leaf symbol " +
                                       std::to_string(static_cast<int>(curr->symbol)));
            }

            if (bit == '0') {
                if (!curr->left) curr->left = std::make_unique<Node>();
                curr = curr->left.get();
            } else if (bit == '1') {
                if (!curr->right) curr->right = std::make_unique<Node>();
                curr = curr->right.get();
            } else {
                throw std::invalid_argument("Bit code contains invalid character: " + std::string(1, bit));
            }
        }

        if (curr->is_leaf || curr->left || curr->right) {
            throw std::logic_error("Prefix conflict: Node is already occupied or has child branches.");
        }

        curr->is_leaf = true;
        curr->symbol = symbol;
        curr->weight = weight;
    }

    /**
     * @brief Traverses tree and extracts the codebook map: symbol -> bit string.
     */
    std::unordered_map<uint8_t, std::string> get_codebook() const {
        std::unordered_map<uint8_t, std::string> codebook;
        std::string current_path;
        traverse_codebook(root_.get(), current_path, codebook);
        return codebook;
    }

    /**
     * @brief Computes Kraft-McMillan sum: K = \sum 2^{-length_i}.
     * Returns true if K <= 1.0 (Prefix-free valid).
     */
    double kraft_sum() const {
        auto codebook = get_codebook();
        double sum = 0.0;
        for (const auto& [sym, code] : codebook) {
            sum += std::pow(2.0, -static_cast<double>(code.size()));
        }
        return sum;
    }

    /**
     * @brief Checks if the tree is a Full Binary Tree (every internal node has 2 children).
     */
    bool is_full_binary_tree() const {
        return check_full(root_.get());
    }

    /**
     * @brief Decodes a single symbol by walking the tree bit-by-bit from a BitReader.
     */
    uint8_t decode_symbol(BitReader& reader) const {
        const Node* curr = root_.get();
        if (curr->is_leaf) return curr->symbol; // Single-node tree

        while (!curr->is_leaf) {
            uint8_t bit = reader.read_bit();
            curr = (bit == 0) ? curr->left.get() : curr->right.get();
            if (!curr) {
                throw std::runtime_error("PrefixTree decode: Bit sequence walked into null branch.");
            }
        }
        return curr->symbol;
    }

    /**
     * @brief Serializes the tree topology using pre-order traversal:
     * - Internal node: bit '0'
     * - Leaf node: bit '1' followed by 8-bit symbol
     */
    void serialize(BitWriter& writer) const {
        serialize_node(root_.get(), writer);
    }

    /**
     * @brief Deserializes a tree serialized with pre-order bit traversal.
     */
    static std::unique_ptr<PrefixTree> deserialize(BitReader& reader) {
        auto tree = std::make_unique<PrefixTree>();
        tree->root_ = deserialize_node(reader);
        return tree;
    }

    /**
     * @brief Prints ASCII representation of the tree structure.
     */
    void print_tree(std::ostream& os = std::cout) const {
        os << "Prefix Tree Structure:\n";
        print_node(root_.get(), "", false, os, "ROOT");
    }

    const Node* root() const { return root_.get(); }

private:
    std::unique_ptr<Node> root_;

    void traverse_codebook(const Node* node, std::string& path,
                           std::unordered_map<uint8_t, std::string>& codebook) const {
        if (!node) return;
        if (node->is_leaf) {
            codebook[node->symbol] = path.empty() ? "0" : path;
            return;
        }

        path.push_back('0');
        traverse_codebook(node->left.get(), path, codebook);
        path.pop_back();

        path.push_back('1');
        traverse_codebook(node->right.get(), path, codebook);
        path.pop_back();
    }

    bool check_full(const Node* node) const {
        if (!node) return true;
        if (node->is_leaf) return true;
        if (!node->left || !node->right) return false;
        return check_full(node->left.get()) && check_full(node->right.get());
    }

    void serialize_node(const Node* node, BitWriter& writer) const {
        if (!node) return;
        if (node->is_leaf) {
            writer.write_bit(1);
            writer.write_byte(node->symbol);
        } else {
            writer.write_bit(0);
            serialize_node(node->left.get(), writer);
            serialize_node(node->right.get(), writer);
        }
    }

    static std::unique_ptr<Node> deserialize_node(BitReader& reader) {
        uint8_t bit = reader.read_bit();
        if (bit == 1) {
            uint8_t sym = reader.read_byte();
            return std::make_unique<Node>(sym);
        } else {
            auto internal = std::make_unique<Node>();
            internal->is_leaf = false;
            internal->left = deserialize_node(reader);
            internal->right = deserialize_node(reader);
            return internal;
        }
    }

    void print_node(const Node* node, const std::string& prefix, bool is_tail,
                    std::ostream& os, const std::string& branch_label) const {
        if (!node) return;

        os << prefix << (is_tail ? "└── " : "├── ") << "(" << branch_label << ") ";
        if (node->is_leaf) {
            char c = (node->symbol >= 32 && node->symbol <= 126) ? static_cast<char>(node->symbol) : '.';
            os << "[LEAF: '" << c << "' (0x" << std::hex << static_cast<int>(node->symbol) << std::dec << ")]";
            if (node->weight > 0) os << " wt=" << node->weight;
            os << "\n";
        } else {
            os << "[BRANCH]\n";
        }

        std::string next_prefix = prefix + (is_tail ? "    " : "│   ");
        if (node->left && node->right) {
            print_node(node->left.get(), next_prefix, false, os, "0: Left");
            print_node(node->right.get(), next_prefix, true, os, "1: Right");
        } else if (node->left) {
            print_node(node->left.get(), next_prefix, true, os, "0: Left");
        } else if (node->right) {
            print_node(node->right.get(), next_prefix, true, os, "1: Right");
        }
    }
};

} // namespace compression::prefix_tree
