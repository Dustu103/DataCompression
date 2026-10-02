# Canonical Huffman Coding

## 1. Algorithmic Overview & Mathematical Proof

Published by **David A. Huffman** in 1952 (*"A Method for the Construction of Minimum-Redundancy Codes"*), Huffman coding is a greedy algorithm that constructs a provably optimal prefix-free code for a known probability distribution of discrete symbols.

### The Source Coding Optimality Theorem
Let an alphabet $\mathcal{A} = \{s_1, s_2, \dots, s_m\}$ have known symbol probabilities $p_1, p_2, \dots, p_m$.
The expected average codeword length $\bar{L}$ of a prefix code with lengths $l_1, l_2, \dots, l_m$ is:

$$\bar{L} = \sum_{i=1}^{m} p_i l_i$$

Huffman's algorithm produces codeword lengths $\{l_i^*\}$ satisfying:

$$H(X) \le \bar{L}^* < H(X) + 1$$

Where $H(X) = -\sum p_i \log_2(p_i)$ is the **Shannon Entropy**.
No other uniquely decodable prefix-free code can achieve a smaller expected codeword length than Huffman coding for symbol-by-symbol encoding:

$$\bar{L}_{\text{Huffman}} \le \bar{L}_{\text{Prefix-Code}} \quad \forall \text{ Prefix Codes}$$

---

## 2. Tree Construction Mechanics (Bottom-Up Min-Heap)

Unlike Shannon-Fano (which greedily partitions top-down), Huffman builds the tree **bottom-up**:

1. **Calculate Frequencies**: Count the occurrences $f_i$ of each distinct byte in the input stream.
2. **Initialize Min-Heap**: Insert a single-node leaf tree for each symbol into a min-priority queue keyed by frequency $f_i$.
3. **Iterative Greedy Merging**:
   - While the min-heap contains more than 1 node:
     1. Extract node $T_1$ with lowest frequency $f_1$.
     2. Extract node $T_2$ with second-lowest frequency $f_2$.
     3. Create an internal parent node $P$ with frequency $f_P = f_1 + f_2$, left child $T_1$, right child $T_2$.
     4. Insert $P$ back into the min-heap.
4. **Final Root**: The single remaining node in the heap is the root of the optimal prefix tree.
5. **Path Assignment**: Assign bit `0` to left edges and bit `1` to right edges.

---

## 3. Canonical Huffman Codes (The Production Standard)

In production standards (including **DEFLATE, GZIP, ZIP, PNG, JPEG, MP3**), standard pointer-based Huffman trees are **never transmitted** because storing tree pointers and topologies consumes excessive header space.

Instead, production systems use **Canonical Huffman Codes**.

### The Canonical Invariants:
1. **Length Monotonicity**: All codes of length $L_1$ are numerically smaller than all codes of length $L_2$ if $L_1 < L_2$.
2. **Alphabetical Ordering**: Codewords of the same length are assigned in **lexicographical (numerical) order** according to their alphabet symbol value.
3. **Numerical Base Shift**: If the code of the last symbol with length $L_1$ is $C$, the first code of length $L_2 > L_1$ is:
   $$\text{FirstCode}_{L_2} = (C + 1) \ll (L_2 - L_1)$$

### Why This is Revolutionary:
The encoder and decoder only need to store and transmit **the code length (in bits) of each symbol**!
- No tree topologies or pointers.
- For a full 256-byte alphabet, code lengths take only 256 bytes (which can be further compressed with RLE to ~30–50 bytes).

---

## 4. Worked Step-by-Step Example

Consider message: `"A_DEAD_DAD_CEDED_A_BAD_BABE_A_BEADED_ABACUS"`

### Symbol Frequencies:
- `'D'`: 10
- `'_'`: 8
- `'A'`: 8
- `'E'`: 6
- `'B'`: 6
- `'C'`: 2
- `'U'`: 1
- `'S'`: 1

### Min-Heap Merge Sequence:
1. Merge `'U'` (1) + `'S'` (1) $\implies N_1$ (2)
2. Merge `'C'` (2) + $N_1$ (2) $\implies N_2$ (4)
3. Merge `'E'` (6) + `'B'` (6) $\implies N_3$ (12)
4. Merge $N_2$ (4) + `'A'` (8) $\implies N_4$ (12)
5. Merge `'_'` (8) + `'D'` (10) $\implies N_5$ (18)
6. Merge $N_3$ (12) + $N_4$ (12) $\implies N_6$ (24)
7. Merge $N_5$ (18) + $N_6$ (24) $\implies \text{Root}$ (42)

### Canonical Code Table:
| Symbol | Length $l_i$ | Canonical Bit Code | Hex |
| :---: | :---: | :---: | :---: |
| `'D'` | 2 | `00` | `0x0` |
| `'_'` | 2 | `01` | `0x1` |
| `'A'` | 2 | `10` | `0x2` |
| `'B'` | 3 | `110` | `0x6` |
| `'E'` | 3 | `111` | `0x7` |
| `'C'` | 4 | `1100` | `0xC` |
| `'S'` | 5 | `11010` | `0x1A` |
| `'U'` | 5 | `11011` | `0x1B` |

---

## 5. Architectural Tradeoffs & Gotchas

### 🟢 Pros & Strengths
- **Provably Optimal**: Guarantees the absolute minimum expected code length for discrete symbol-by-symbol prefix codes.
- **Fast Table-Driven Decoding**: In canonical form, decoders use flat lookup tables instead of navigating pointer nodes in memory.
- **Deterministic**: Given identical symbol frequencies and tie-breaking rules, the canonical codebook is $100\%$ identical across all platforms and architectures.

### 🔴 Flaws, Gotchas & Limitations
- **The 1-Bit Integer Barrier**: Huffman must assign an integer number of bits ($\ge 1$) to every symbol. If symbol `'E'` occurs with probability $p = 0.95$, its ideal information content is $-\log_2(0.95) \approx 0.074$ bits. Huffman is forced to assign 1 full bit, causing a massive $+92\%$ redundancy penalty! (Arithmetic coding and ANS solve this).
- **Two-Pass Requirement**: Standard Huffman requires scanning the entire input stream once to compute frequencies, and a second time to encode bits.
- **Small File Overhead**: On files $< 300$ bytes, the code length header can exceed the bitstream savings.
