// =============================================================================
// SHANNON-FANO CODING  (C++20)
// =============================================================================
//
//  Historically devised by Claude Shannon (1948, "A Mathematical Theory of
//  Communication") and independently by Robert Fano (MIT Research Lab, 1949).
//  Shannon-Fano is a top-down recursive prefix code.
//
//  ALGORITHM (Encode):
//  1. Count symbol frequencies.
//  2. Sort symbols by descending frequency.
//  3. Recursively split the sorted list into two halves with roughly equal
//     cumulative weight, assigning '0' to the left group and '1' to the right.
//  4. Repeat until each group is a single symbol → leaf node.
//
//  CRITICAL FLAW vs HUFFMAN:
//  Huffman builds optimal (min-average-length) trees bottom-up with a min-heap.
//  Shannon-Fano's greedy top-down split can produce sub-optimal code lengths
//  that violate the Huffman bound for certain frequency distributions.
//
//  USAGE:
//    auto [encoded, table] = compression::shannon_fano::encode("hello world");
//    auto decoded          = compression::shannon_fano::decode(encoded, table);
//
// =============================================================================
#pragma once

#include <algorithm>
#include <cassert>
#include <cstdint>
#include <map>
#include <span>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

namespace compression::shannon_fano {

// ---------------------------------------------------------------------------
// Public data structures
// ---------------------------------------------------------------------------

/// One entry in the Shannon-Fano code table.
struct CodeEntry {
    uint8_t     symbol{};
    uint32_t    frequency{};
    std::string bits{};       ///< Variable-length binary string, e.g. "010"
    double      probability{};
    double      expected_bits{}; ///< -log2(p) — Shannon optimal
};

/// Describes one recursive split step (for the visualizer).
struct SplitStep {
    int         depth{};
    int         group_start{};  ///< index into sorted symbol list
    int         group_end{};
    int         split_at{};     ///< last index of left sub-group
    double      left_weight{};
    double      right_weight{};
    std::string description{};
};

/// Full result returned by encode().
struct EncodeResult {
    std::vector<uint8_t>   packed_bytes;   ///< bit-packed output bytes
    std::vector<CodeEntry> table;          ///< Shannon-Fano code table
    std::vector<SplitStep> splits;         ///< Ordered recursive split trace
    double                 entropy{};      ///< Shannon H(X) in bits/symbol
    double                 avg_code_len{}; ///< Achieved average code length
    double                 huffman_bound{}; ///< Best possible (Huffman lower bound)
    size_t                 original_bytes{};
    size_t                 encoded_bits{};
    size_t                 encoded_bytes{}; ///< ceil(bits / 8) + 1 byte padding header
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
namespace detail {

using SymbolList = std::vector<CodeEntry*>;

/// Compute the Shannon entropy H(X) = -sum p_i * log2(p_i).
inline double entropy(const std::vector<CodeEntry>& table, size_t total) {
    double h = 0.0;
    for (const auto& e : table) {
        if (e.frequency == 0) continue;
        double p = static_cast<double>(e.frequency) / total;
        h -= p * std::log2(p);
    }
    return h;
}

/// Recursively split [start, end) by finding the partition point that
/// minimises |left_sum - right_sum|, then recurse both halves.
inline void split(SymbolList& syms, int start, int end, int depth,
                  std::vector<SplitStep>& steps) {
    if (end - start <= 1) return; // Leaf node — nothing to split

    // Compute total weight of this group
    double total = 0.0;
    for (int i = start; i < end; ++i) total += syms[i]->frequency;

    // Find the best split point (greedy equi-partition)
    double acc   = 0.0;
    double best  = std::numeric_limits<double>::max();
    int    split_idx = start; // last index of LEFT group

    for (int i = start; i < end - 1; ++i) {
        acc += syms[i]->frequency;
        double diff = std::abs((total - acc) - acc); // |right - left|
        if (diff < best) {
            best      = diff;
            split_idx = i;
        }
    }

    // Compute weights for logging
    double left_w = 0.0;
    for (int i = start; i <= split_idx; ++i) left_w += syms[i]->frequency;
    double right_w = total - left_w;

    // Build human-readable description
    std::ostringstream desc;
    desc << "Depth " << depth << ": split [";
    for (int i = start; i <= split_idx; ++i) {
        if (i > start) desc << ',';
        desc << (char)syms[i]->symbol;
    }
    desc << "] (w=" << (int)left_w << ") vs [";
    for (int i = split_idx + 1; i < end; ++i) {
        if (i > split_idx + 1) desc << ',';
        desc << (char)syms[i]->symbol;
    }
    desc << "] (w=" << (int)right_w << ')';

    steps.push_back(SplitStep{
        .depth       = depth,
        .group_start = start,
        .group_end   = end,
        .split_at    = split_idx,
        .left_weight = left_w,
        .right_weight= right_w,
        .description = desc.str()
    });

    // Assign '0' to left group, '1' to right group
    for (int i = start; i <= split_idx; ++i) syms[i]->bits += '0';
    for (int i = split_idx + 1; i < end; ++i) syms[i]->bits += '1';

    // Recurse
    split(syms, start,       split_idx + 1, depth + 1, steps);
    split(syms, split_idx + 1, end,          depth + 1, steps);
}

} // namespace detail

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Encode a string / byte sequence using Shannon-Fano coding.
[[nodiscard]] inline EncodeResult encode(std::string_view input) {
    if (input.empty()) return {};

    // 1. Count frequencies
    std::unordered_map<uint8_t, uint32_t> freq;
    for (uint8_t b : input) ++freq[b];

    // 2. Build initial table, sort descending by frequency
    std::vector<CodeEntry> table;
    table.reserve(freq.size());
    for (auto& [sym, cnt] : freq) {
        double p = static_cast<double>(cnt) / input.size();
        table.push_back(CodeEntry{
            .symbol       = sym,
            .frequency    = cnt,
            .probability  = p,
            .expected_bits= (p > 0 ? -std::log2(p) : 0.0)
        });
    }
    std::ranges::sort(table, {}, [](const CodeEntry& e){ return -static_cast<int>(e.frequency); });

    // 3. Recursive Shannon-Fano split
    std::vector<SplitStep> splits;
    detail::SymbolList ptrs;
    ptrs.reserve(table.size());
    for (auto& e : table) ptrs.push_back(&e);

    detail::split(ptrs, 0, static_cast<int>(ptrs.size()), 0, splits);

    // 4. Build lookup map (symbol → bits)
    std::unordered_map<uint8_t, const std::string*> code_map;
    for (const auto& e : table) code_map[e.symbol] = &e.bits;

    // 5. Bit-pack the message
    std::vector<uint8_t> packed;
    uint8_t buf  = 0;
    int     bits = 0;
    size_t  total_bits = 0;

    for (uint8_t b : input) {
        const std::string& code = *code_map.at(b);
        for (char c : code) {
            buf = static_cast<uint8_t>((buf << 1) | (c == '1' ? 1 : 0));
            ++bits;
            ++total_bits;
            if (bits == 8) { packed.push_back(buf); buf = 0; bits = 0; }
        }
    }
    // Flush remaining bits (pad with zeros)
    if (bits > 0) {
        buf = static_cast<uint8_t>(buf << (8 - bits));
        packed.push_back(buf);
    }
    // Prepend padding count byte (how many tail bits are padding)
    uint8_t pad = (bits == 0) ? 0 : (8 - bits);
    packed.insert(packed.begin(), pad);

    // 6. Compute statistics
    double entropy_h = detail::entropy(table, input.size());

    double avg_len = 0.0;
    for (const auto& e : table)
        avg_len += e.probability * e.bits.size();

    // Huffman theoretical lower bound = H(X) (achievable by Huffman)
    // Shannon-Fano may exceed this
    double huffman_bound = entropy_h;

    return EncodeResult{
        .packed_bytes   = std::move(packed),
        .table          = std::move(table),
        .splits         = std::move(splits),
        .entropy        = entropy_h,
        .avg_code_len   = avg_len,
        .huffman_bound  = huffman_bound,
        .original_bytes = input.size(),
        .encoded_bits   = total_bits,
        .encoded_bytes  = packed.size()
    };
}

/// Decode using the code table produced by encode().
[[nodiscard]] inline std::string decode(const std::vector<uint8_t>& packed,
                                        const std::vector<CodeEntry>& table) {
    if (packed.empty() || table.empty()) return {};

    // Reconstruct reverse-lookup trie (prefix → symbol)
    std::unordered_map<std::string, uint8_t> rev;
    for (const auto& e : table) rev[e.bits] = e.symbol;

    uint8_t pad = packed[0];

    std::string result;
    std::string current;

    for (size_t byte_idx = 1; byte_idx < packed.size(); ++byte_idx) {
        uint8_t byte = packed[byte_idx];
        int     stop = (byte_idx == packed.size() - 1) ? (8 - pad) : 8;
        for (int bit = 7; bit >= (8 - stop); --bit) {
            current += ((byte >> bit) & 1) ? '1' : '0';
            auto it = rev.find(current);
            if (it != rev.end()) {
                result += static_cast<char>(it->second);
                current.clear();
            }
        }
    }

    return result;
}

} // namespace compression::shannon_fano
