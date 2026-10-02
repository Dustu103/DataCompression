# Binary Prefix Trees & Prefix-Free Codes

## 1. The Prefix-Free Property & Instantaneous Decoding

A variable-length binary code is called **prefix-free** (or a **prefix code**) if no valid codeword in the codebook is a prefix of any other codeword.

### Why Prefix-Free Matters
In a standard fixed-length code (e.g. ASCII / UTF-8), every character takes 8 bits. The decoder simply grabs 8 bits at a time.
In variable-length coding, common symbols take fewer bits (e.g., 2 bits) while rare symbols take more (e.g., 10 bits).

If our code is **not** prefix-free:
- Let $A = 0$, $B = 01$, $C = 11$.
- If the receiver sees bits `011...`:
  - Could it be $A$ (`0`) followed by $C$ (`11`)?
  - Or could it be $B$ (`01`) followed by another bit?
- The receiver must wait, buffer forward bits, or backtrack.

In a **prefix-free code**:
- The instant a bit sequence matches a valid symbol, **that symbol is uniquely and unambiguously decoded**. No lookahead or backtracking is ever required. This is called **Instantaneous Decoding**.

---

## 2. Tree Representation: Structural Invariant

Every binary prefix-free code maps directly to a **Binary Tree**:

1. **Leaf Nodes ($\text{degree} = 0$)**: Contain the alphabet symbols ($A, B, C, \dots$).
2. **Internal Nodes ($\text{degree} = 2$)**: Routing decisions. Contain no symbols.
3. **Left Branches**: Represent bit `0`.
4. **Right Branches**: Represent bit `1`.
5. **Codeword**: The sequence of branch decisions from the root to the leaf.

```text
                     ( Root )
                    /        \
                 '0'          '1'
                 /              \
             [ A ]              ( )
           Code: "0"           /   \
                            '0'     '1'
                            /         \
                        [ B ]         ( )
                      Code: "10"     /   \
                                   '0'   '1'
                                   /       \
                               [ C ]       [ D ]
                            Code: "110"  Code: "111"
```

Because symbols exist **strictly at leaf nodes**, no symbol's path can be an extension (prefix) of another.

---

## 3. The Kraft-McMillan Inequality

The fundamental theorem governing prefix-free codes:

$$\mathcal{K} = \sum_{i=1}^{n} 2^{-l_i} \le 1$$

Where $l_i$ is the length of the codeword for symbol $s_i$.

### Three Regimes:
1. **$\mathcal{K} = 1$ (Full Binary Tree)**:
   - Every internal node has exactly 2 children.
   - Zero "wasted" codeword space.
   - This is the goal of optimal entropy coders like Huffman.
2. **$\mathcal{K} < 1$ (Defective / Incomplete Tree)**:
   - There are internal nodes with only 1 child or missing leaves.
   - The code is valid and prefix-free, but sub-optimal (some codewords could be made shorter).
3. **$\mathcal{K} > 1$ (Mathematically Impossible)**:
   - No prefix-free code can exist with these lengths. Codewords would overlap.

---

## 4. Tree Serialization (Pre-Order Traversal)

To send a prefix tree in a compressed file header efficiently:
- We traverse the tree in **pre-order**:
  - Internal node: emit bit `0`.
  - Leaf node: emit bit `1` followed by the 8-bit symbol (`uint8_t`).

For $N$ unique symbols, a full binary tree has:
- $N$ leaf nodes.
- $N - 1$ internal nodes.
- Total nodes = $2N - 1$.
- Total header size = $(2N - 1)$ bits + $8N$ bits $\approx 10N$ bits (only ~320 bytes for a full 256-symbol alphabet!).

---

## 5. Algorithmic Complexity

- **Symbol Lookup / Decode**: $\mathcal{O}(L)$ bit reads, where $L$ is the code length ($L \le \text{tree height}$).
- **Tree Insertion**: $\mathcal{O}(L)$ pointer hops.
- **Tree Memory**: $\mathcal{O}(N)$ nodes where $N$ is alphabet size.
