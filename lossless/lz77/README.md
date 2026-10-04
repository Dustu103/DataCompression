# LZ77 Sliding Window Compression

An idiomatic, zero-dependency Modern C++20 implementation of the **LZ77 (Lempel-Ziv 1977)** dictionary compression algorithm with full bitstream serialization, round-trip verification, and benchmark instrumentation.

---

## 📖 Theoretical & Historical Foundation

Published in May 1977 by **Abraham Lempel** and **Jacob Ziv** in the seminal IEEE paper:
> *"A Universal Algorithm for Sequential Data Compression"*

LZ77 revolutionized information theory by introducing **dictionary-based compression**. Prior entropy coders (like Huffman and Shannon-Fano) assumed memoryless symbol distributions: each character was encoded independently based solely on its probability. LZ77 recognized that real data contains **temporal correlation and repeating multi-byte phrases** (e.g., words, XML tags, HTML elements, code keywords).

Instead of storing symbols, LZ77 replaces repeating phrases with **backward relative references** into a sliding history buffer.

---

## 🪟 The Sliding Window Architecture

The encoder maintains a contiguous window over the input stream divided into two sections:

```text
 ◄────────────── Sliding Window (e.g. 4096 bytes) ──────────────►
┌──────────────────────────────────────┬────────────────────────┐
│     Search Buffer (History)          │   Lookahead Buffer     │
│       Processed Input History        │  Upcoming Uncoded Data │
└──────────────────────────────────────┴────────────────────────┘
                                       ▲ Cursor Position
```

1. **Search Buffer (History)**:
   - Contains up to $W_s$ (typically 4 KB or 32 KB in DEFLATE) of recently processed bytes.
   - Serves as the dynamic dictionary. No static dictionary table needs to be transmitted!
2. **Lookahead Buffer**:
   - Contains up to $W_l$ (typically 255 bytes) of upcoming characters waiting to be compressed.
3. **Sliding Motion**:
   - The encoder searches the Search Buffer for the longest substring matching the beginning of the Lookahead Buffer.
   - Upon emitting a token, the window slides forward past the matched characters.

---

## 🎯 The LZ77 Token Tuple: $(d, l, c)$

Every output token is a triplet:

$$\text{Token} = (d, l, c)$$

- **$d$ (Distance / Offset)**: How many bytes to step backward from the current cursor into the search buffer ($0$ if no prior match exists).
- **$l$ (Length)**: The number of consecutive matching bytes ($0$ if no prior match exists).
- **$c$ (Next Literal)**: The uncompressed byte immediately following the matched sequence in the lookahead buffer.

### Why include the next literal $c$?
Including $c$ guarantees that the encoder **always advances by at least 1 character**, avoiding infinite loops when no previous match exists ($d=0, l=0, c=\text{'A'}$).

---

## 🔄 Self-Referential & Overlapping Matches (The RLE Superpower)

A profound property of LZ77 is that **match length can exceed distance** ($l > d$):

```text
Input: "XXXXXXXXXX" (10 times 'X')

Step 1: Emit (d=0, l=0, 'X')
        Cursor is at 1. History is "X".
Step 2: Lookahead is "XXXXXXXXX" (9 times 'X').
        At distance d=1, history starts with 'X'.
        Because the decompressor copies byte-by-byte from its own output:
        output[1] = output[0] = 'X'
        output[2] = output[1] = 'X'
        ...
        Emit: (d=1, l=8, 'X')
```

This self-referential property allows LZ77 to naturally perform **Run-Length Encoding (RLE)** as a special case without any extra logic!

---

## 📦 Binary Bitstream Specification

In our C++ implementation, the token stream is packed into a compact binary layout:

```text
[Header - 12 Bytes]
  0..3   : Magic Signature 'LZ77' (0x4C5A3737)
  4..7   : Original Uncompressed File Size (uint32_t, Big-Endian)
  8..11  : Total Token Count (uint32_t, Big-Endian)

[Token Stream Payload - Packed 28 bits per token]
  Distance : 12 bits [0 .. 4095]
  Length   :  8 bits [0 .. 255]
  Literal  :  8 bits [0 .. 255]
```

---

## ⚡ Computational Complexity & Asymmetry

| Phase | Naive Window Search | Hash-Chained Search (DEFLATE / LZ4) |
| :--- | :--- | :--- |
| **Compression Time** | $O(N \cdot W_s \cdot W_l)$ (Quadratic scan) | $O(N)$ amortized using 3-byte hash table |
| **Decompression Time** | **$O(N)$** (`memcpy` relative copy) | **$O(N)$** (`memcpy` relative copy) |
| **Compression Memory** | $O(W_s)$ sliding buffer | $O(W_s + \text{Hash Table Size})$ |
| **Decompression Memory** | $O(W_s)$ cyclic buffer (or 0 extra if in-place) | $O(W_s)$ cyclic buffer |

> **Asymmetry Highlight**: Notice how decompression is orders of magnitude faster and simpler than compression. The decompressor performs zero searches, zero hashing, and zero tree traversal—it simply executes memory copies from relative offsets!

---

## ⚠️ The Negative Expansion Hazard & The LZSS Evolution

Notice what happens on completely unique, non-repeating data (e.g. random bytes or pre-compressed archives):
- Every character produces an LZ77 triplet: $(d=0, l=0, c)$.
- Each triplet takes **28 bits (3.5 bytes)** to store **1 byte** of uncompressed data!
- Result: **$3.5\times$ file explosion (+250% expansion)!**

---

## 🚀 The LZSS (1982) Breakthrough: The 1-Bit Flag Revolution

In 1982, **James Storer** and **Thomas Szymanski** published:
> *"Data Compression via Textual Substitution"* (Journal of the ACM)

They identified the exact root cause of LZ77's expansion problem: **forcing a 3-tuple $(d, l, c)$ on every emission**.

### 1. The 1-Bit Flag Architecture
Instead of fixed triplets, LZSS prefixes every token with a **1-bit flag**:
- **Flag `0` $\to$ Literal Byte**: Emits `[0, literal]` (1 flag bit + 8 data bits = **9 bits total**).
- **Flag `1` $\to$ Match Pair**: Emits `[1, distance, length]` (1 flag bit + 12 distance bits + 8 length bits = **21 bits total**). No trailing literal forced!

### 2. The $MIN\_MATCH \ge 3$ Profitability Proof
Why does LZSS reject 1-byte and 2-byte matches?
- Storing $1$ byte as a literal costs: $1 \times 9 = \mathbf{9\text{ bits}}$.
- Storing $1$ byte as a match pair costs: $\mathbf{21\text{ bits}}$ (Net **penalty of 12 bits**!).
- Storing $2$ bytes as literals costs: $2 \times 9 = \mathbf{18\text{ bits}}$.
- Storing $2$ bytes as a match pair costs: $\mathbf{21\text{ bits}}$ (Net **penalty of 3 bits**!).
- Storing $3$ bytes as literals costs: $3 \times 9 = \mathbf{27\text{ bits}}$.
- Storing $3$ bytes as a match pair costs: $\mathbf{21\text{ bits}}$ (Net **savings of 6 bits**!).

$$\text{Profitability Condition: } \text{length} \ge 3$$

If the best match in the window is $< 3$ bytes, LZSS emits a 9-bit literal flag instead of wasting 21 bits on an unviable match.

---

## 📊 Head-to-Head Benchmark: Classic LZ77 vs. Modern LZSS

Results obtained directly from `lossless/lz77/main.cpp` using Modern C++20:

| Test Case | Uncompressed | Classic LZ77 (1977) | Modern LZSS (1982) | LZSS vs LZ77 Savings |
| :--- | :--- | :--- | :--- | :--- |
| **Repetitive English Text** | 138 B | 152 B *(Expansion!)* | **99 B** *(1.39:1 Ratio)* | **-34.9% (53 bytes saved)** |
| **Overlapping Substrings** | 48 B | 37 B (1.30:1) | **28 B** (1.71:1) | **-24.3% (9 bytes saved)** |
| **Long Run-Length Repetition** | 259 B | 33 B (7.85:1) | **26 B** (9.96:1) | **-21.2% (7 bytes saved)** |
| **Structured C++ Code** | 190 B | 201 B *(Expansion!)* | **119 B** *(1.60:1 Ratio)* | **-40.8% (82 bytes saved)** |
| **Non-Repeating Expansion Hazard** | 36 B | 138 B *(3.83× Explosion)* | **53 B** *(61.6% Smaller)* | **-61.6% (85 bytes saved)** |

> **Key Takeaway**: Classic LZ77 caused negative expansion on 3 out of 5 tests. **LZSS completely eliminated the expansion hazard** and achieved real compression across text and code without any entropy stage!

## 🏗️ Production Architecture Guide: When to Use It vs. When NOT to Use It

### ✅ When to Use LZ77

1. **Repetitive Text, Markup & Source Code (First-Stage Preprocessor):**
   - Ideal for JSON, XML, HTML, CSV, logs, and programming code where long strings (`"timestamp"`, `</div>`, `class `, `public void`) appear repeatedly.
2. **Compound Hybrid Pipelines (DEFLATE / GZIP / PNG / ZIP):**
   - LZ77 is universally used as the **frontend pattern deduplicator**, converting repeating phrases into distance-length tokens, which are then passed to **Huffman Coding** or **tANS** to compress the token frequencies.
3. **Asymmetric "Compress Once, Decompress Everywhere" Pipelines:**
   - Game asset distribution, web server static asset serving (pre-gzipped assets), and operating system package managers. Encoding can spend CPU time finding optimal matches because decoding requires only blazing-fast `memcpy` operations.
4. **Firmware & Microcontrollers with Tight Decompression RAM:**
   - Decompressing an LZ77 stream requires only a tiny ring buffer of size $W_s$ (e.g., 2 KB to 32 KB) and no dynamic memory allocation.

---

### ❌ When NOT to Use LZ77 (and What to Use Instead)

1. **Standalone Raw Triplet Storage (Without Entropy Backend or LZSS Flags):**
   - Storing fixed 28-bit $(d, l, c)$ tokens uncompressed results in severe file expansion on non-repeating bytes.
   - *Use Instead:* **LZSS** (flagged literals) or **DEFLATE** (LZ77 + Canonical Huffman).
2. **Encrypted, Random, or Pre-Compressed Files (ZIP, JPEG, MP4, encrypted archives):**
   - The sliding search window will find zero matches of length $\ge 3$, resulting in catastrophic file expansion and wasted CPU search cycles.
   - *Use Instead:* Store raw bytes without compression (`STORE` mode in ZIP).
3. **Continuous Analog Signals (Photographs, Audio, Video):**
   - Images and audio consist of smooth gradient fluctuations and noise where identical multi-byte substring matches almost never occur.
   - *Use Instead:* Transform coding like **DCT (JPEG)** or **Wavelets (JPEG 2000)**.
4. **Huge Repeated Phrases Outside the Window Horizon ($> 64\text{ KB}$):**
   - If a duplicate 500-byte block appears 2 MB apart, a standard 32 KB sliding window cannot "see" it and fails to compress.
   - *Use Instead:* Long-range matching dictionary engines (**Zstandard Long Distance Matching `--long`**, **Brotli**, or **LZMA/7-Zip** with 64 MB–1 GB dictionaries).
