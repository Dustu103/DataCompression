# Arithmetic Coding & Range Coding

Arithmetic coding is a foundational entropy coding technique that represents an entire sequence of symbols as a single fractional sub-interval $[L, R) \subset [0, 1)$. Unlike Huffman coding, which is strictly constrained to assign an integer number of bits ($\ge 1$ bit) to each symbol, Arithmetic Coding achieves true **fractional-bit assignments**, approaching Claude Shannon's theoretical entropy limit $H(X)$ even when symbol probabilities are heavily skewed ($P(s) > 0.5$).

---

## 1. Why Huffman Coding Fails on Skewed Data

Claude Shannon's source coding theorem states that the theoretical minimum code length for a symbol $s$ with probability $P(s)$ is:

$$I(s) = -\log_2 P(s) \text{ bits}$$

When a symbol occurs with high probability (e.g. $P(s) = 0.95$ in sparse matrices, monochrome binary masks, run-lengths, or video motion residual flags):
- **Shannon ideal:** $I(s) = -\log_2(0.95) \approx 0.074 \text{ bits}$
- **Huffman requirement:** Because Huffman builds a prefix binary tree where every symbol must live at a leaf with integer depth, the minimum code length is **1 bit** (`0` or `1`).

$$\text{Overhead} = \frac{1.0 - 0.074}{0.074} \approx 1250\% \text{ wasted space!}$$

Huffman is fundamentally trapped by the **integer bit floor**: it cannot compress data to less than 1.0 bit per symbol regardless of how redundant the data is.

**Arithmetic coding completely eliminates this floor.**

---

## 2. Mathematical Principle: Interval Subdivision

Arithmetic coding maintains an interval $[L, R)$, initially $[0.0, 1.0)$. Each symbol $s \in \Sigma$ is assigned a cumulative probability sub-interval:

$$[\text{low}(s), \text{high}(s)) = \left[ \sum_{i < s} P(i), \sum_{i \le s} P(i) \right)$$

For each incoming symbol $s$:
1. Compute the current interval width:
   $$\text{Range} = R - L$$
2. Narrow the interval to the symbol's allocated fraction:
   $$R_{\text{new}} = L + \text{Range} \times \text{high}(s)$$
   $$L_{\text{new}} = L + \text{Range} \times \text{low}(s)$$

As $N$ symbols are processed, the width of the final interval becomes:

$$\text{Width} = \prod_{i=1}^N P(s_i)$$

The number of bits required to uniquely distinguish a point inside this interval is:

$$B = \lceil -\log_2(\text{Width}) \rceil = \sum_{i=1}^N -\log_2 P(s_i) = N \cdot H(X)$$

This matches Shannon entropy with at most 2 bits of termination overhead for the entire message.

---

## 3. Finite-Precision Integer Arithmetic & Underflow (E3 Hazard)

Naive floating-point numbers run out of precision after ~53 bits (IEEE 754 double). Real-world implementations (Witten-Neal-Cleary 1987) use fixed 32-bit integer registers:

- $Top = 2^{32} - 1 = \text{0xFFFFFFFF}$
- $Half = 2^{31} = \text{0x80000000}$
- $First\_Quarter = 2^{30} = \text{0x40000000}$
- $Third\_Quarter = 3 \times 2^{30} = \text{0xC0000000}$

### The Renormalization Cases:
1. **E1 (Left half, $[0, Half)$):**
   - High bit of both $L$ and $R$ is `0`.
   - Emit `0` and any queued underflow bits (`1`s).
   - Shift $L$ and $R$ left by 1 bit.
2. **E2 (Right half, $[Half, Top)$):**
   - High bit of both $L$ and $R$ is `1`.
   - Emit `1` and any queued underflow bits (`0`s).
   - Shift $L$ and $R$ left by 1 bit.
3. **E3 (Underflow Hazard, $[First\_Quarter, Third\_Quarter)$):**
   - $L \ge First\_Quarter$ and $R < Third\_Quarter$.
   - The leading bits differ ($L$ starts with `01...`, $R$ starts with `10...`), so no bit can be emitted yet.
   - However, the interval width is collapsing around the midpoint $Half$, threatening register precision collapse!
   - **Solution:** Increment `underflow_bits`, peel off the second bit by subtracting $First\_Quarter$, and shift left. Once the interval resolves to either half, all queued underflow bits are flushed as opposite polarity bits!

---

## 4. Benchmark Results

From `lossless/arithmetic/main.cpp` (compiled with `-std=c++20 -O3`):

| Test Dataset | Input Size | Shannon Entropy $H(X)$ | Huffman | Static Arithmetic | Adaptive Arithmetic |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **95% Biased ('A'=95%, 'B'=5%)** | 1,000 B | **0.2864 bits/sym** | 134 B (1.07 b/sym) | **55 B (0.44 b/sym)** | 160 B (1.28 b/sym) |
| **Shannon 1948 Excerpt** | 421 B | **4.3797 bits/sym** | 315 B (5.98 b/sym) | **361 B (6.85 b/sym)** | 310 B (5.89 b/sym) |
| **DNA Genomic Nucleotides** | 1,000 B | **1.9103 bits/sym** | 258 B (2.06 b/sym) | **264 B (2.11 b/sym)** | 362 B (2.89 b/sym) |
| **Single Monolithic Run ('Z' x 500)** | 500 B | **0.0000 bits/sym** | 70 B (1.12 b/sym) | **16 B (0.25 b/sym)** | 97 B (1.55 b/sym) |

### Key Takeaways:
1. **On skewed data ($P > 0.5$), Arithmetic coding beats Huffman by 2.4x to 4x.**
2. **On general uniform English text**, Huffman is comparable or slightly smaller on short inputs because Static Arithmetic transmits a frequency table header.
3. **On streaming applications**, Adaptive Arithmetic requires **zero header bytes** because both encoder and decoder update their frequency counts dynamically in lock-step.
4. **Modern standard adoption:** Context-Adaptive Binary Arithmetic Coding (**CABAC**) is the core entropy engine of H.264/AVC, H.265/HEVC, and JPEG 2000.
