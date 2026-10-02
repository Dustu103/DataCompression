# Compression Mastery: Algorithms, Theory & Implementation in C++

Welcome to the comprehensive repository for learning, implementing, and mastering **Data Compression Algorithms from First Principles in Modern C++ (C++17/C++20)**.

Every algorithm in this repository is implemented with **zero external dependencies**, featuring:
1. **Mathematical & Information-Theoretic Foundations** (Shannon entropy, Kraft inequality, rate-distortion theory).
2. **Clean, Idiomatic C++ Source Code** with full round-trip verification (`decode(encode(X)) == X`).
3. **Comprehensive `README.md`** for each algorithm containing step-by-step visual walkthroughs, bitstream specifications, complexity bounds, and benchmark analysis.
4. **Interactive CLI / Test Harness** to inspect bitstreams, compression ratios, and throughput.

---

## 🏛️ Repository Architecture

```text
Compression/
├── README.md                      # Master roadmap, theory guide & index
├── common/                        # Core reusable C++ utilities
│   ├── bit_stream.hpp             # Bit-level Writer & Reader (MSB/LSB modes)
│   ├── byte_stream.hpp            # Efficient buffered byte I/O
│   ├── metrics.hpp                # Compression ratio, entropy, throughput
│   └── test_framework.hpp         # Round-trip verification & test fixtures
├── lossless/                      # Lossless Compression Algorithms
│   ├── 01_run_length/             # RLE (Basic, PackBits, Bit-level)
│   ├── 02_shannon_fano/           # Shannon-Fano Coding
│   ├── 03_huffman/                # Canonical & Adaptive Huffman Coding
│   ├── 04_golomb_rice/            # Golomb & Rice Coding
│   ├── 05_arithmetic/             # Integer Range / Arithmetic Coding
│   ├── 06_ans/                    # Asymmetric Numeral Systems (rANS / tANS)
│   ├── 07_lz77/                   # LZ77 Sliding Window Compression
│   ├── 08_lz78_lzw/               # LZ78 and LZW Trie Dictionary
│   ├── 09_lzss/                   # LZSS (Token-optimized LZ77)
│   ├── 10_deflate/                # Complete DEFLATE (LZSS + Huffman)
│   ├── 11_bwt_mtf/                # Burrows-Wheeler Transform + Move-To-Front
│   └── 12_delta_diff/             # Delta / Differencing Preconditioning
└── lossy/                         # Lossy Compression Algorithms
    ├── 01_quantization/           # Uniform & Lloyd-Max Scalar Quantization
    ├── 02_vector_quantization/    # Linde-Buzo-Gray (LBG) Vector Quantization
    ├── 03_companding_audio/       # A-Law & μ-Law Audio Companding
    ├── 04_dpcm_adpcm/             # Differential & Adaptive DPCM (Audio/Signals)
    ├── 05_dct_jpeg/               # 8x8 DCT, Quantization & ZigZag (Mini-JPEG)
    ├── 06_wavelet_haar/           # 1D/2D Discrete Wavelet Transform (Haar)
    └── 07_motion_estimation/      # Block Matching & Residual Video Coding
```

---

## 🧭 Why C++ for Compression?

Data compression sits at the boundary of **discrete mathematics** and **hardware architecture**:
- **Bit-Level Precision**: Compression algorithms write individual bits (3-bit symbols, variable-length codes). C++ provides direct, zero-overhead bit manipulation without VM or interpreter overhead.
- **Hardware & Cache Locality**: Suffix arrays, sliding window buffers, and LZ hash tables are memory-bound. C++ gives explicit control over cache lines, memory alignment, and allocations.
- **True Algorithmic Benchmarks**: Throughput is measured in GB/s or cycles/byte. C++ allows genuine performance profiling rather than profiling language runtime overhead.
- **Industry Standard**: Real-world engines—**Zstandard (Meta)**, **LZ4**, **Brotli (Google)**, **bzip2**, **libjpeg-turbo**, and **FLAC**—are all written in C/C++.

---

## 📊 High-Level Classification: Lossless vs. Lossy

| Dimension | Lossless Compression | Lossy Compression |
| :--- | :--- | :--- |
| **Data Integrity** | $X = \text{Decode}(\text{Encode}(X))$ exactly (0% distortion) | $\hat{X} \approx X$ (controlled distortion allowed) |
| **Theoretical Bound** | Shannon's Source Coding Theorem: $\bar{L} \ge H(X)$ | Rate-Distortion Theory: $R(D) = \min_{p(\hat{x}\vert x)} I(X; \hat{X})$ |
| **Typical Target Data** | Executables, Source code, Text, Databases, Medical images | Photographs, Streaming video, Voice, Music |
| **Typical Compression Ratio** | $1.5:1$ to $4:1$ | $10:1$ to $100:1+$ |
| **Core Mechanisms** | Statistical frequency, Entropy coding, Dictionary deduplication, Invertible transforms | Frequency transforms (DCT, Wavelet), Psychoacoustic/Visual modeling, Quantization |

---

## 📈 Learning Path & Roadmap

1. **Foundations (`common/`)**: BitWriter, BitReader, Entropy calculation.
2. **Entropy Coding**: From Huffman $\to$ Arithmetic Coding $\to$ Modern Asymmetric Numeral Systems (ANS).
3. **Dictionary & Window Coding**: LZ77 $\to$ LZW $\to$ LZSS $\to$ DEFLATE.
4. **Reversible Transforms**: Burrows-Wheeler Transform (BWT) + Move-to-Front (MTF).
5. **Lossy Fundamentals**: Scalar & Vector Quantization $\to$ Audio Companding ($\mu$-law).
6. **Transform Coding**: 2D DCT (JPEG pipeline) and DWT Wavelets.
