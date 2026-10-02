# LZW (Lempel-Ziv-Welch) Dictionary Compression

An idiomatic, zero-dependency Modern C++20 implementation of the **LZW (Lempel-Ziv-Welch)** dynamic dictionary compression algorithm featuring bit-packed container serialization, lock-step dictionary reconstruction, complete $KwKwK$ edge-case handling, and benchmark instrumentation.

---

## 📖 Theoretical & Historical Foundation

Published in June 1984 by **Terry Welch** in the seminal IEEE Computer paper:
> *"A Technique for High-Performance Data Compression"*

LZW is an elegant adaptation of the earlier **LZ78** algorithm developed by **Abraham Lempel** and **Jacob Ziv** in 1978. While LZ77 uses an explicit sliding search window with $(distance, length, literal)$ offset triplets, LZW adopts an **adaptive dictionary state machine**:
1. It parses the incoming byte stream into previously unseen character combinations.
2. It represents multi-byte phrases with compact, fixed- or variable-width integer codes.
3. Most critically, **the dictionary is never transmitted in the bitstream**. Both the encoder and decoder initialize their state to an agreed-upon base alphabet (e.g., standard 8-bit bytes $[0\dots 255]$), and the decoder dynamically reconstructs the exact same dictionary in perfect lock-step.

LZW became one of the most widely deployed algorithms in computer history, powering:
- **GIF (Graphics Interchange Format)** (1987) for palette-indexed images.
- **TIFF (Tagged Image File Format)** for high-resolution prepress imaging.
- **Unix `compress` (`.Z`)** command-line utility.
- **Adobe PDF** (`/LZWDecode` stream filter).

---

## ⚙️ Core Mechanics: Dynamic Dictionary Synthesis Without Transmission

### The Initial Pre-Agreed Alphabet
Before a single bit is emitted, both encoder and decoder initialize their dictionary with codes $[0\dots 255]$:

| Code ID | Value / Phrase |
| :---: | :--- |
| `0` | Byte `0x00` |
| `...` | `...` |
| `65` | ASCII `'A'` (`0x41`) |
| `66` | ASCII `'B'` (`0x42`) |
| `67` | ASCII `'C'` (`0x43`) |
| `...` | `...` |
| `255` | Byte `0xFF` |
| **`256`** | *First dynamically assignable code* |

---

## 🔍 Detailed Mechanical Walkthrough: `ABCABCABC`

Let us trace the byte sequence `[A, B, C, A, B, C, A, B, C]` ($9\text{ bytes} = 72\text{ bits}$).

### 1. Encoder State Machine

```
Input: A B C A B C A B C
Initial Dictionary: [0..255] = single bytes. Next Available Code = 256.
Prefix P = ""
```

| Step | Read Char $c$ | Combined String $P + c$ | In Dict? | Action Taken | Emitted Code | Added to Dictionary | New Prefix $P$ |
| :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: |
| **1** | `'A'` (65) | `"A"` | **Yes** (65) | Accumulate into prefix | — | — | `"A"` |
| **2** | `'B'` (66) | `"AB"` | **No** | Emit code for $P$; Register $P+c$ | **`65`** (`'A'`) | `256` $\to$ `"AB"` | `'B'` |
| **3** | `'C'` (67) | `"BC"` | **No** | Emit code for $P$; Register $P+c$ | **`66`** (`'B'`) | `257` $\to$ `"BC"` | `'C'` |
| **4** | `'A'` (65) | `"CA"` | **No** | Emit code for $P$; Register $P+c$ | **`67`** (`'C'`) | `258` $\to$ `"CA"` | `'A'` |
| **5** | `'B'` (66) | `"AB"` | **Yes** (256) | Accumulate into prefix | — | — | `"AB"` |
| **6** | `'C'` (67) | `"ABC"` | **No** | Emit code for $P$; Register $P+c$ | **`256`** (`"AB"`) | `259` $\to$ `"ABC"` | `'C'` |
| **7** | `'A'` (65) | `"CA"` | **Yes** (258) | Accumulate into prefix | — | — | `"CA"` |
| **8** | `'B'` (66) | `"CAB"` | **No** | Emit code for $P$; Register $P+c$ | **`258`** (`"CA"`) | `260` $\to$ `"CAB"` | `'B'` |
| **9** | `'C'` (67) | `"BC"` | **Yes** (257) | Accumulate into prefix | — | — | `"BC"` |
| **End** | — | — | — | Flush final prefix $P$ | **`257`** (`"BC"`) | — | — |

**Final Encoded Output Stream:**
$$\mathbf{[65, 66, 67, 256, 258, 257]}$$
- Total codes emitted: **6 codes** (representing 9 original bytes).
- At 9 bits per code: $6 \times 9 = 54\text{ bits}$ vs. $72\text{ raw bits}$ ($25.0\%$ reduction on raw payload).

---

### 2. Decoder State Machine (Zero Dictionary Received!)

The decoder receives solely the integer sequence `[65, 66, 67, 256, 258, 257]`.

```
Initial Dictionary: [0..255] = single bytes. Next Available Code = 256.
```

1. **Receives `65`**:
   - Lookup `dict[65] = "A"`.
   - Output: `"A"`.
   - Set $previous = \text{"A"}$.

2. **Receives `66`**:
   - Lookup `dict[66] = "B"`.
   - Output: `"B"` (Decoded buffer: `"AB"`).
   - Add new entry: $previous + \text{first}(current) = \text{"A"} + \text{"B"} = \text{"AB"}$ $\to$ **`dict[256] = "AB"`**.
   - Set $previous = \text{"B"}$.

3. **Receives `67`**:
   - Lookup `dict[67] = "C"`.
   - Output: `"C"` (Decoded buffer: `"ABC"`).
   - Add new entry: $previous + \text{first}(current) = \text{"B"} + \text{"C"} = \text{"BC"}$ $\to$ **`dict[257] = "BC"`**.
   - Set $previous = \text{"C"}$.

4. **Receives `256`**:
   - Lookup `dict[256] = "AB"`.
   - Output: `"AB"` (Decoded buffer: `"ABCAB"`).
   - Add new entry: $previous + \text{first}(current) = \text{"C"} + \text{"A"} = \text{"CA"}$ $\to$ **`dict[258] = "CA"`**.
   - Set $previous = \text{"AB"}$.

5. **Receives `258`**:
   - Lookup `dict[258] = "CA"`.
   - Output: `"CA"` (Decoded buffer: `"ABCABCA"`).
   - Add new entry: $previous + \text{first}(current) = \text{"AB"} + \text{"C"} = \text{"ABC"}$ $\to$ **`dict[259] = "ABC"`**.
   - Set $previous = \text{"CA"}$.

6. **Receives `257`**:
   - Lookup `dict[257] = "BC"`.
   - Output: `"BC"` (Decoded buffer: `"ABCABCABC"`).
   - Add new entry: $previous + \text{first}(current) = \text{"CA"} + \text{"B"} = \text{"CAB"}$ $\to$ **`dict[260] = "CAB"`**.
   - Set $previous = \text{"BC"}$.

**Result:** The reconstructed buffer is **`ABCABCABC`** — 100% byte-exact roundtrip, with zero dictionary metadata transmitted across the wire!

---

## ⚡ The Famous $KwKwK$ / $cScSc$ Decoder Edge Case

### The Problem
Consider input `ABABABA`:
1. Encoder emits `65` (`'A'`), adds `256 = "AB"`.
2. Encoder emits `66` (`'B'`), adds `257 = "BA"`.
3. Encoder reads `"ABA"` $\implies$ emits `256` (`"AB"`), adds `258 = "ABA"`.
4. Encoder immediately reads `"ABA"` again! `"ABA"` is now in the dictionary with code `258`.
5. Encoder finishes and emits **`258`**.

When the decoder reaches code `258`:
- The decoder's dictionary only contains entries up to `257`.
- **Code `258` is not in the decoder's dictionary yet!**

### The Mathematical Resolution
Because the encoder only adds an entry when a prefix is extended by one character, the unknown entry MUST be formed by:
$$\text{Unknown Entry} = \text{Previous Entry} + \text{First Char of Previous Entry}$$
$$\text{Entry} = \text{"AB"} + \text{"A"} = \mathbf{\text{"ABA"}}$$

When the decoder encounters $new\_code == dict.size()$:
```cpp
if (new_code < dict.size()) {
    entry = dict[new_code];
} else if (new_code == dict.size()) {
    // KwKwK Special Case
    entry = s + s[0];
}
```
This single elegant mathematical condition guarantees 100% deterministic decoding across all repetitive patterns.

---

## 📦 Binary Bitstream Container Specification (`LZW1`)

```
+---------------+---------------------+--------------------+--------------------+-----------------------+
| Magic (4B)    | Orig Size (4B, BE)  | Code Count (4B, BE)| Code Bits (2B, BE) | Bit-Packed Codes (N B)|
| 0x4C5A5731    | uint32_t (Original) | uint32_t (# Codes) | uint16_t (e.g. 12) | Compressed bitstream  |
+---------------+---------------------+--------------------+--------------------+-----------------------+
```

---

## 🏗️ Production Architecture Guide: When to Use It vs. When NOT to Use It

### ✅ When to Use LZW

1. **Palette-Indexed 2D Graphics (GIF Format):**
   - The native compression standard for GIF87a and GIF89a image files with 256-color palettes.
2. **Deterministic Legacy Embedded Hardware:**
   - Requires zero complex tree balancing, zero floating-point math, and minimal memory ($O(N)$ simple array lookup during decompression).
3. **Structured Formats with Repeated Multi-Byte Phrases:**
   - PostScript, TIFF image prepress streams, and legacy Unix `.Z` files.

---

### ❌ When NOT to Use LZW (and What to Use Instead)

1. **Modern High-Density Production Pipelines:**
   - LZW was superseded by **DEFLATE** (LZ77 + Canonical Huffman) which eliminates LZW's codebook growth penalties, and **Zstandard (Zstd)** which achieves 25–40% higher compression ratios.
   - *Use Instead:* **DEFLATE** or **Zstandard**.
2. **Memory-Constrained Decompressors with Unbounded Streams:**
   - Unless a `CLEAR_CODE` dictionary flush is implemented, LZW dictionaries grow until codebook bit limits are exhausted.
   - *Use Instead:* **LZ4** or **LZSS**.
3. **Short Non-Repeating Sequences (Expansion Hazard):**
   - Emitting 12-bit codes for 8-bit non-repeating characters causes a severe $+50\%$ file expansion penalty.
   - *Use Instead:* Store raw bytes (`STORE` mode).
