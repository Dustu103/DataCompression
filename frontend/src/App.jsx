import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import { 
  Network, 
  ArrowLeft,
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  StepBack,
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Code2,
  FileText,
  Layers,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Zap,
  Info,
  GitMerge,
  Cpu,
  FileCode,
  Download,
  Eye,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowDown
} from 'lucide-react';

// --- Tree Node Class ---
class TreeNode {
  constructor(symbol = null, weight = 0) {
    this.symbol = symbol;
    this.weight = weight;
    this.left = null;   // '0'
    this.right = null;  // '1'
    this.id = Math.random().toString(36).substring(2, 9);
    this.x = 0;
    this.y = 0;
  }
  isLeaf() { return this.left === null && this.right === null; }
  clone() {
    const n = new TreeNode(this.symbol, this.weight);
    n.id = this.id;
    if (this.left) n.left = this.left.clone();
    if (this.right) n.right = this.right.clone();
    return n;
  }
}

// Preset Real Files for Testing Real Data Matrix
const REAL_FILE_PRESETS = {
  txt: {
    name: 'document.txt',
    type: 'Plain Text (ASCII/UTF-8)',
    content: "Information theory and data compression algorithms are the foundational pillars of modern computer science and telecommunications. In 1948, Claude Shannon published 'A Mathematical Theory of Communication', establishing that the absolute theoretical limit of lossless data compression is determined by entropy H(X). In 1952, David Huffman introduced the optimal prefix-free code tree constructed via a bottom-up priority queue."
  },
  pdf: {
    name: 'document.pdf',
    type: 'Adobe Portable Document Format (PDF)',
    content: "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (Hello Compression) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n290\n%%EOF"
  },
  log: {
    name: 'server_access.log',
    type: 'Web Server Access Log',
    content: "192.168.1.10 - - [02/Oct/2026:10:00:01 +0000] \"GET /index.html HTTP/1.1\" 200 4521 \"-\" \"Mozilla/5.0\"\n192.168.1.12 - - [02/Oct/2026:10:00:02 +0000] \"GET /style.css HTTP/1.1\" 200 1280 \"-\" \"Mozilla/5.0\"\n192.168.1.10 - - [02/Oct/2026:10:00:05 +0000] \"GET /api/v1/metrics HTTP/1.1\" 200 892 \"-\" \"Mozilla/5.0\"\n192.168.1.15 - - [02/Oct/2026:10:00:08 +0000] \"GET /index.html HTTP/1.1\" 200 4521 \"-\" \"Mozilla/5.0\"\n192.168.1.10 - - [02/Oct/2026:10:00:12 +0000] \"POST /api/v1/compress HTTP/1.1\" 200 312 \"-\" \"Mozilla/5.0\""
  }
};

// Preset Texts for LZ77 Sliding Window
const LZ77_PRESETS = {
  cars: {
    name: 'Repetitive Sentences',
    text: 'THE CAR ON THE LEFT PASSED THE CAR ON THE RIGHT AND HIT THE CAR IN THE MIDDLE'
  },
  overlap: {
    name: 'Self-Referential Overlap',
    text: 'ABRACADABRA_ABRACADABRA_ABRACADABRA!'
  },
  rle: {
    name: 'Run-Length Repetition',
    text: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
  },
  code: {
    name: 'C++ Source Code',
    text: 'int counter = 0; while (counter < 10) { counter++; print(counter); }'
  }
};

// Preset Texts for DEFLATE Compound Hybrid Architecture
const DEFLATE_PRESETS = {
  html: {
    name: 'HTML Document (Web Assets)',
    text: '<!DOCTYPE html><html><head><title>DEFLATE Test</title></head><body><div class="card"><div class="title">Hello World</div><div class="card"><div class="title">Nested Card</div></div></div></body></html>'
  },
  sentences: {
    name: 'Repetitive Sentences',
    text: 'THE CAR ON THE LEFT PASSED THE CAR ON THE RIGHT AND HIT THE CAR IN THE MIDDLE OF THE HIGHWAY'
  },
  overlap: {
    name: 'Self-Referential Overlap',
    text: 'ABRACADABRA_ABRACADABRA_ABRACADABRA_ABRACADABRA!'
  },
  rle: {
    name: 'Run-Length Pattern (RLE)',
    text: 'AAAAABBBBBCCCCCDDDDDEEEEEAAAAABBBBBCCCCCDDDDDEEEEEZZZZZZZZZZ'
  }
};

// RFC 1951 Section 3.2.5: Literal/Length Codes (257–285) & Extra Bits Table
const RFC1951_LENGTH_TABLE = [
  { code: 257, minLen: 3, maxLen: 3, extraBits: 0 },
  { code: 258, minLen: 4, maxLen: 4, extraBits: 0 },
  { code: 259, minLen: 5, maxLen: 5, extraBits: 0 },
  { code: 260, minLen: 6, maxLen: 6, extraBits: 0 },
  { code: 261, minLen: 7, maxLen: 7, extraBits: 0 },
  { code: 262, minLen: 8, maxLen: 8, extraBits: 0 },
  { code: 263, minLen: 9, maxLen: 9, extraBits: 0 },
  { code: 264, minLen: 10, maxLen: 10, extraBits: 0 },
  { code: 265, minLen: 11, maxLen: 12, extraBits: 1 },
  { code: 266, minLen: 13, maxLen: 14, extraBits: 1 },
  { code: 267, minLen: 15, maxLen: 16, extraBits: 1 },
  { code: 268, minLen: 17, maxLen: 18, extraBits: 1 },
  { code: 269, minLen: 19, maxLen: 22, extraBits: 2 },
  { code: 270, minLen: 23, maxLen: 26, extraBits: 2 },
  { code: 271, minLen: 27, maxLen: 30, extraBits: 2 },
  { code: 272, minLen: 31, maxLen: 34, extraBits: 2 },
  { code: 273, minLen: 35, maxLen: 42, extraBits: 3 },
  { code: 274, minLen: 43, maxLen: 50, extraBits: 3 },
  { code: 275, minLen: 51, maxLen: 58, extraBits: 3 },
  { code: 276, minLen: 59, maxLen: 66, extraBits: 3 },
  { code: 277, minLen: 67, maxLen: 82, extraBits: 4 },
  { code: 278, minLen: 83, maxLen: 98, extraBits: 4 },
  { code: 279, minLen: 99, maxLen: 114, extraBits: 4 },
  { code: 280, minLen: 115, maxLen: 130, extraBits: 4 },
  { code: 281, minLen: 131, maxLen: 162, extraBits: 5 },
  { code: 282, minLen: 163, maxLen: 194, extraBits: 5 },
  { code: 283, minLen: 195, maxLen: 226, extraBits: 5 },
  { code: 284, minLen: 227, maxLen: 257, extraBits: 5 },
  { code: 285, minLen: 258, maxLen: 258, extraBits: 0 }
];

// RFC 1951 Section 3.2.5: Distance Codes (0–29) & Extra Bits Table
const RFC1951_DISTANCE_TABLE = [
  { code: 0, minDist: 1, maxDist: 1, extraBits: 0 },
  { code: 1, minDist: 2, maxDist: 2, extraBits: 0 },
  { code: 2, minDist: 3, maxDist: 3, extraBits: 0 },
  { code: 3, minDist: 4, maxDist: 4, extraBits: 0 },
  { code: 4, minDist: 5, maxDist: 6, extraBits: 1 },
  { code: 5, minDist: 7, maxDist: 8, extraBits: 1 },
  { code: 6, minDist: 9, maxDist: 12, extraBits: 2 },
  { code: 7, minDist: 13, maxDist: 16, extraBits: 2 },
  { code: 8, minDist: 17, maxDist: 24, extraBits: 3 },
  { code: 9, minDist: 25, maxDist: 32, extraBits: 3 },
  { code: 10, minDist: 33, maxDist: 48, extraBits: 4 },
  { code: 11, minDist: 49, maxDist: 64, extraBits: 4 },
  { code: 12, minDist: 65, maxDist: 96, extraBits: 5 },
  { code: 13, minDist: 97, maxDist: 128, extraBits: 5 },
  { code: 14, minDist: 129, maxDist: 192, extraBits: 6 },
  { code: 15, minDist: 193, maxDist: 256, extraBits: 6 },
  { code: 16, minDist: 257, maxDist: 384, extraBits: 7 },
  { code: 17, minDist: 385, maxDist: 512, extraBits: 7 },
  { code: 18, minDist: 513, maxDist: 768, extraBits: 8 },
  { code: 19, minDist: 769, maxDist: 1024, extraBits: 8 },
  { code: 20, minDist: 1025, maxDist: 1536, extraBits: 9 },
  { code: 21, minDist: 1537, maxDist: 2048, extraBits: 9 },
  { code: 22, minDist: 2049, maxDist: 3072, extraBits: 10 },
  { code: 23, minDist: 3073, maxDist: 4096, extraBits: 10 },
  { code: 24, minDist: 4097, maxDist: 6144, extraBits: 11 },
  { code: 25, minDist: 6145, maxDist: 8192, extraBits: 11 },
  { code: 26, minDist: 8193, maxDist: 12288, extraBits: 12 },
  { code: 27, minDist: 12289, maxDist: 16384, extraBits: 12 },
  { code: 28, minDist: 16385, maxDist: 24576, extraBits: 13 },
  { code: 29, minDist: 24577, maxDist: 32768, extraBits: 13 }
];

const mapLengthToRfc1951 = (len) => {
  const clampLen = Math.min(258, Math.max(3, len));
  const entry = RFC1951_LENGTH_TABLE.find(e => clampLen >= e.minLen && clampLen <= e.maxLen) || RFC1951_LENGTH_TABLE[0];
  const offset = clampLen - entry.minLen;
  const extraBitsBin = entry.extraBits > 0 ? offset.toString(2).padStart(entry.extraBits, '0') : '';
  return {
    actualLength: clampLen,
    code: entry.code,
    rangeStr: entry.minLen === entry.maxLen ? `${entry.minLen}` : `${entry.minLen}–${entry.maxLen}`,
    baseLen: entry.minLen,
    offset,
    extraBitsCount: entry.extraBits,
    extraBitsBin
  };
};

const mapDistanceToRfc1951 = (dist) => {
  const clampDist = Math.min(32768, Math.max(1, dist));
  const entry = RFC1951_DISTANCE_TABLE.find(e => clampDist >= e.minDist && clampDist <= e.maxDist) || RFC1951_DISTANCE_TABLE[0];
  const offset = clampDist - entry.minDist;
  const extraBitsBin = entry.extraBits > 0 ? offset.toString(2).padStart(entry.extraBits, '0') : '';
  return {
    actualDistance: clampDist,
    code: entry.code,
    rangeStr: entry.minDist === entry.maxDist ? `${entry.minDist}` : `${entry.minDist}–${entry.maxDist}`,
    baseDist: entry.minDist,
    offset,
    extraBitsCount: entry.extraBits,
    extraBitsBin
  };
};

// Master Section Hierarchy (5 Architectural Pillars)
const SECTIONS_CONFIG = [
  {
    id: 'redundancy',
    title: '1. Redundancy Removal',
    shortName: 'Redundancy',
    badgeText: 'REDUNDANCY REMOVAL',
    badgeClass: 'redundancy',
    subtitle: 'Deduplication, Run Folding & History Window Referencing',
    desc: 'Identifies and replaces duplicate substrings or repeating byte runs with backward reference pointers or dynamic dictionary codes.'
  },
  {
    id: 'entropy',
    title: '2. Entropy Coding',
    shortName: 'Entropy',
    badgeText: 'ENTROPY CODING',
    badgeClass: 'entropy',
    subtitle: 'Probability Modeling & Mathematical Bound H(X) = -∑ P(x) log₂ P(x)',
    desc: 'Assigns variable-length bit codes or fractional intervals proportional to symbol frequencies to approach the theoretical Shannon limit.'
  },
  {
    id: 'compound',
    title: '3. Modern Lossless',
    shortName: 'Modern Lossless',
    badgeText: 'MODERN COMPOUND LOSSLESS',
    badgeClass: 'compound',
    subtitle: 'Multi-Stage Production Pipelines (Deduplication + Entropy + Context)',
    desc: 'Real-world production engines combining sliding-window deduplication, multi-order context modeling, and high-throughput entropy coders.'
  },
  {
    id: 'transforms',
    title: '4. Image Compression & Transforms',
    shortName: 'Image Transforms',
    badgeText: 'IMAGE COMPRESSION & TRANSFORMS',
    badgeClass: 'transforms',
    subtitle: 'Frequency Spectral Decompositions & Perceptual Quantization',
    desc: 'Transforms spatial pixel grids into frequency spectra, discarding high-frequency coefficients imperceptible to human visual perception.'
  },
  {
    id: 'media',
    title: '5. Modern Image & Video',
    shortName: 'Modern Media',
    badgeText: 'MODERN IMAGE & VIDEO',
    badgeClass: 'media',
    subtitle: 'Intra-Frame Directional Prediction & Inter-Frame Motion Compensation',
    desc: 'Cutting-edge media standards utilizing spatial intra-prediction, temporal motion vectors, and context-adaptive binary arithmetic coding.'
  }
];

// Master Algorithm Registry (21 Algorithms Across 5 Architectural Sections)
const ALGORITHMS_CATALOG = [
  // SECTION 1: REDUNDANCY REMOVAL
  {
    id: 'rle',
    name: 'Run-Length Encoding (RLE) & PackBits',
    section: 'redundancy',
    category: 'lossless',
    type: 'Redundancy Coding',
    status: 'pending',
    formula: '(count, byte) | Flag: [-128..127]',
    ratio: '1.2:1 – 50:1',
    desc: 'Replaces consecutive identical symbols with run tuples. PackBits solves the negative compression expansion hazard using signed flag bytes.',
    pros: ['O(N) single-pass streaming', 'Near-zero memory buffer needed', 'Ideal for masks & fax'],
    flaws: ['Expansion problem on non-repeating data without escape flags', 'Byte-run limit (128)'],
    whenToUse: 'Long runs of identical bytes: binary masks, monochrome bitmaps, Fax G3/G4, audio silences.',
    whenNotToUse: 'High-entropy or non-repeating data (plain text, compiled binaries, encrypted streams).'
  },
  {
    id: 'lz77',
    name: 'LZ77 (Sliding Window)',
    section: 'redundancy',
    category: 'lossless',
    type: 'Sliding Window History',
    status: 'ready',
    formula: 'Tokens: (distance, length, next_char)',
    ratio: '2:1 – 10:1',
    desc: 'Published in 1977 by Lempel & Ziv. Replaces repeating byte sequences with backward distance-length references into history. Foundation of GZIP, PNG, and ZIP.',
    pros: ['Asymmetric blazing fast decompression (memcpy)', 'Zero prior distribution needed'],
    flaws: ['Encoder match search is quadratic without hash chains', 'Limited by window size'],
    whenToUse: 'General-purpose text, code, structured files with repeated strings (ZIP, GZIP, PNG).',
    whenNotToUse: 'Pre-compressed, encrypted, or random binary files where sliding search yields zero matches.'
  },
  {
    id: 'lz78',
    name: 'LZ78 (Explicit Dictionary Tree)',
    section: 'redundancy',
    category: 'lossless',
    type: 'Tree-Structured Dictionary',
    status: 'pending',
    formula: 'Tokens: (dict_index, next_char)',
    ratio: '2:1 – 6:1',
    desc: 'Published in 1978 by Lempel & Ziv. Employs a growing trie dictionary of previously emitted phrases, referencing index pairs with explicit trailing characters.',
    pros: ['No sliding window distance limit', 'Unbounded phrase memory', 'Zero static tree header transmitted'],
    flaws: ['Explicit tree pointer overhead', 'Memory grows rapidly without pruning'],
    whenToUse: 'Historical foundations of dictionary coding and text deduplication analysis.',
    whenNotToUse: 'Modern production pipelines where LZW or LZ77 provide simpler zero-overhead streaming.'
  },
  {
    id: 'lzw',
    name: 'LZW (Lempel-Ziv-Welch) Dictionary',
    section: 'redundancy',
    category: 'lossless',
    type: 'Dynamic Lock-Step Dictionary',
    status: 'ready',
    formula: 'dict[P + c] = next_code++; Output(P)',
    ratio: '2:1 – 5:1',
    desc: 'Published by Terry Welch in 1984. Dynamically synthesizes a prefix dictionary during single-pass encoding. The decoder reconstructs the exact same dictionary in lock-step with zero transmitted dictionary overhead. Powers GIF images, TIFF, and Unix compress.',
    pros: [
      'Zero dictionary overhead transmitted over the wire',
      'Lock-step deterministic decoder dictionary reconstruction',
      'Ultra-fast O(N) streaming array lookups on decompression'
    ],
    flaws: [
      'Requires KwKwK edge-case handling for repeating prefixes',
      'Unbounded dictionary growth requires dictionary reset or freeze logic',
      'Positive file expansion on short non-repeating data (+50% for 12-bit codes)'
    ],
    whenToUse: 'Palette-indexed 2D graphics (GIF), TIFF prepress imaging, legacy Unix compress (.Z), and deterministic embedded targets.',
    whenNotToUse: 'Modern web text transmission where DEFLATE or Zstandard beats LZW by 25–40% in compression ratio.'
  },

  // SECTION 2: ENTROPY CODING
  {
    id: 'prefix-tree',
    name: 'Binary Prefix Tree & Kraft Rule',
    section: 'entropy',
    category: 'lossless',
    type: 'Foundation & Code Trees',
    status: 'ready',
    formula: 'K = ∑ 2^-l_i ≤ 1',
    ratio: '1.5:1 – 4:1',
    desc: 'The mathematical bedrock of entropy coding. Every symbol lives strictly at a leaf node, guaranteeing instantaneous decoding with zero lookahead or delimiters.',
    pros: ['Instantaneous unambiguous decoding', 'Optimal tree representation', 'Zero delimiter bits'],
    flaws: ['Single-bit flip causes cascade error', 'Tree header overhead on short files'],
    whenToUse: 'Instantaneous streaming protocols (UTF-8, protobuf varints) and validating code sets with Kraft inequality.',
    whenNotToUse: 'Large dynamic dictionaries where pointer-based nodes cause cache-miss overhead.'
  },
  {
    id: 'shannon-fano',
    name: 'Shannon-Fano Coding',
    section: 'entropy',
    category: 'lossless',
    type: 'Top-Down Prefix Code',
    status: 'pending',
    formula: 'Top-down Equi-Partitioning',
    ratio: '1.5:1 – 3.5:1',
    desc: 'Devised in 1948 by Claude Shannon and Robert Fano. Recursively partitions sorted symbol frequencies into two roughly equal-weight subsets.',
    pros: ['Clean intuitive recursive top-down logic', 'Historical information-theory milestone'],
    flaws: ['Sub-optimal prefix trees compared to Huffman min-heap', 'Greedy local splits'],
    whenToUse: 'Educational demonstrations of top-down recursive entropy coding logic.',
    whenNotToUse: 'Production compression backends—Huffman is provably superior with equal complexity.'
  },
  {
    id: 'huffman',
    name: 'Canonical Huffman Coding',
    section: 'entropy',
    category: 'lossless',
    type: 'Optimal Prefix Code',
    status: 'ready',
    formula: 'L̄ = ∑ p_i l_i ≥ H(X)',
    ratio: '1.5:1 – 4.5:1',
    desc: 'Published in 1952 by David Huffman. Bottom-up min-heap builds provably optimal prefix trees. Canonical form transmits lengths only, discarding tree pointers.',
    pros: ['Provably optimal prefix code', 'Canonical header transmits lengths only', 'Fast table-driven decoding'],
    flaws: ['1-bit integer quantization barrier (cannot assign fractional bits)', 'Two-pass frequency scan'],
    whenToUse: 'Compound pipelines (DEFLATE / JPEG / PNG after LZ77/DCT) and moderate probabilities (5%–50%).',
    whenNotToUse: 'Skewed data (p > 50% wastes bits; use ANS/Arithmetic) and micro-files (< 500B header bloat).'
  },
  {
    id: 'arithmetic',
    name: 'Arithmetic Coding / Range Coding',
    section: 'entropy',
    category: 'lossless',
    type: 'Fractional Entropy',
    status: 'next',
    formula: '[L, R) ← [L + (R-L)P_low, L + (R-L)P_high)',
    ratio: '1.8:1 – 5:1',
    desc: 'Encodes an entire message into a single high-precision fractional sub-interval [0, 1). Breaks the 1-bit-per-symbol integer floor of Huffman by allocating true fractional bits, achieving true Shannon entropy.',
    pros: ['Achieves true Shannon entropy H(X)', 'Optimal for highly skewed probabilities (p > 0.5) where Huffman wastes 1 bit', 'Supports adaptive online frequency updates'],
    flaws: ['Computationally heavier bit shifts and multiplications', 'Integer register underflow normalization required'],
    whenToUse: 'Highly skewed symbol probabilities (p > 90%) where fractional bits are required (H.264/CABAC, JPEG 2000).',
    whenNotToUse: 'Ultra-high-throughput pipelines where multi-precision math and register normalization limit GB/s speed.'
  },
  {
    id: 'ans',
    name: 'Asymmetric Numeral Systems (ANS / rANS)',
    section: 'entropy',
    category: 'lossless',
    type: 'State-of-the-Art Entropy',
    status: 'pending',
    formula: 'x\' = C(s, x) = ⌊x / l_s⌋ · M + b_s + (x mod l_s)',
    ratio: '2:1 – 5:1',
    desc: 'Created by Jarosław Duda in 2006. Powers modern Zstandard (Meta) and Apple LZFSE. Delivers the exact compression density of Arithmetic coding at the multi-gigabyte-per-second speed of Huffman table lookups.',
    pros: ['State-of-the-art compression speed (GB/s)', 'Exact fractional entropy precision without multiplication', 'Powers modern industry codecs (Zstd, LZFSE)'],
    flaws: ['Reverses symbol order (LIFO stack behavior)', 'Complex state table normalization'],
    whenToUse: 'Modern production pipelines (Zstd, LZFSE) demanding Arithmetic density at Huffman speed.',
    whenNotToUse: 'Ultra-simple microcontrollers where state inversion (LIFO reverse decoding) complicates buffers.'
  },

  // SECTION 3: MODERN LOSSLESS
  {
    id: 'deflate',
    name: 'DEFLATE (LZ77 + Canonical Huffman)',
    section: 'compound',
    category: 'lossless',
    type: 'Compound Hybrid Architecture',
    status: 'ready',
    formula: 'Stream: LZ77 Tokens → Dual Canonical Huffman Trees',
    ratio: '2.5:1 – 12:1',
    desc: 'Created by Phil Katz in 1993 for PKZIP (RFC 1951). The most widely deployed compression format in human history (ZIP, GZIP, PNG, HTTP/1.1, Git zlib). Combines LZ77 pattern deduplication with dual Canonical Huffman entropy coding.',
    pros: ['Eliminates the LZ77 triplet expansion penalty completely', 'Unsurpassed universal compatibility across all operating systems', 'Zero patent royalties'],
    flaws: ['Two-stage processing latency', 'Beaten in compression speed and density by modern Zstandard (Zstd)'],
    whenToUse: 'Universal cross-platform interchange (ZIP, GZIP, PNG, PDF flate, Git packfiles, HTTP web assets).',
    whenNotToUse: 'Ultra-high-throughput in-memory caching requiring gigabytes-per-second memory bandwidth (use LZ4 or Zstd).'
  },
  {
    id: 'brotli',
    name: 'Brotli (Google Web Standard)',
    section: 'compound',
    category: 'lossless',
    type: 'Compound 2nd-Order Context',
    status: 'pending',
    formula: 'WBITS: 10..24 | 120KB Static Web Dictionary',
    ratio: '3:1 – 15:1',
    desc: 'Created by Google (RFC 7932) specifically for web transmission. Combines 2nd-order context modeling, LZ77, Huffman, and a massive 120KB static dictionary of common web substrings.',
    pros: ['15–25% smaller web asset payloads than GZIP', 'Huge 120KB built-in dictionary for HTML/JS/CSS', 'Native browser HTTP content-encoding support'],
    flaws: ['High compression levels (10-11) are CPU intensive', 'Complex specification'],
    whenToUse: 'Serving static web assets (HTML, CSS, JS, SVG, JSON) over HTTPS.',
    whenNotToUse: 'Dynamic real-time compression on high-concurrency servers where CPU cycles are constrained.'
  },
  {
    id: 'zstd',
    name: 'Zstandard (Meta Zstd: tANS + Repcodes)',
    section: 'compound',
    category: 'lossless',
    type: 'Modern High-Throughput Lossless',
    status: 'pending',
    formula: 'FSE (Finite State Entropy) + Repcode History',
    ratio: '3:1 – 15:1 (GB/s Speed)',
    desc: 'Created by Yann Collet at Meta. Replaces Huffman with Finite State Entropy (FSE/tANS) and features ultra-fast repcode matching, scaling from ultra-fast realtime to maximum compression ratios.',
    pros: ['Scales smoothly from ultra-fast (Level 1) to ultra-dense (Level 22)', 'Gigabytes-per-second decompression speed', 'Trained custom dictionary support'],
    flaws: ['More complex codebase than classic zlib', 'Larger memory footprint at high compression levels'],
    whenToUse: 'Real-time database storage (RocksDB, Kafka), Linux kernels, game assets, and modern cloud RPCs.',
    whenNotToUse: 'Legacy microcontrollers with severe memory constraints (< 64KB RAM).'
  },
  {
    id: 'lzma',
    name: 'LZMA / LZMA2 (7-Zip / XZ)',
    section: 'compound',
    category: 'lossless',
    type: 'Markov Chain + Range Coder',
    status: 'pending',
    formula: 'Markov Chain (Bit-Level Contexts) + Range Coder',
    ratio: '4:1 – 20:1',
    desc: 'Created by Igor Pavlov for 7-Zip. Combines a huge sliding dictionary (up to 1GB+) with complex Markov chain state transitions feeding directly into a binary Range Coder.',
    pros: ['Maximum achievable compression ratio for binary installers and OS images', 'Huge sliding window support up to 1GB+'],
    flaws: ['Very slow compression speed and high encoder RAM consumption', 'High decompression latency'],
    whenToUse: 'Software distribution packages, OS installation images (.xz, .7z), and cold archival storage.',
    whenNotToUse: 'Real-time communication, HTTP stream responses, or interactive game loading.'
  },

  // SECTION 4: IMAGE COMPRESSION & TRANSFORMS
  {
    id: 'dct-jpeg',
    name: '8×8 2D DCT (Discrete Cosine Transform)',
    section: 'transforms',
    category: 'lossy',
    type: 'Orthogonal Transform Coding',
    status: 'pending',
    formula: 'F(u,v) = ¼ C(u)C(v) ∑∑ f(x,y) cos(...)',
    ratio: '10:1 – 50:1',
    desc: 'Transforms 8×8 pixel blocks from spatial domain to frequency domain. Packs image energy into low-frequency DC coefficients and allows psychovisual quantizing.',
    pros: ['Massive energy compaction into DC/low-frequency coefficients', 'Tunable quality scale 1-100'],
    flaws: ['Block boundary artifacts at low bitrates', 'Ringing / Gibbs phenomenon around sharp edges'],
    whenToUse: 'Continuous-tone photographic images where high spatial frequencies can be discarded.',
    whenNotToUse: 'Pixel art, high-contrast UI graphics, or text screenshots where 8x8 block blur occurs.'
  },
  {
    id: 'quantization',
    name: 'Uniform & Lloyd-Max Quantization',
    section: 'transforms',
    category: 'lossy',
    type: 'Rate-Distortion Theory',
    status: 'pending',
    formula: 'SQNR ≈ 6.02 · R + 1.76 dB',
    ratio: '2:1 – 8:1',
    desc: 'The fundamental irreversible step in lossy compression. Maps continuous amplitudes to 2^R discrete levels. Lloyd-Max optimizes decision thresholds for non-uniform data.',
    pros: ['Direct mathematical control over Rate-Distortion R(D)', '+6.02 dB SQNR gain per bit'],
    flaws: ['Irreversible quantization distortion / noise', 'Banding and contouring artifacts'],
    whenToUse: 'Continuous sensory signals (PCM audio, camera sensor voltages) where slight loss is tolerable.',
    whenNotToUse: 'Source code, executable binaries, financial records requiring exact lossless inversion.'
  },
  {
    id: 'companding',
    name: 'Logarithmic Companding (μ-Law & A-Law G.711)',
    section: 'transforms',
    category: 'lossy',
    type: 'Perceptual Audio Coding',
    status: 'pending',
    formula: 'y = sgn(x) · ln(1+μ|x|) / ln(1+μ)',
    ratio: '2:1 (16-bit → 8-bit)',
    desc: 'Telephony standard ITU-T G.711. Compresses audio dynamic range non-linearly before quantization, matching human ear logarithmic sensitivity (Weber-Fechner Law).',
    pros: ['Constant signal-to-noise ratio across loud and soft sounds', 'Instant single-table lookup'],
    flaws: ['Introduces harmonic distortion on high-amplitude audio', 'Fixed dynamic range'],
    whenToUse: 'Telephony voice audio (PSTN, G.711) matching human ear logarithmic sensitivity.',
    whenNotToUse: 'High-fidelity multi-channel music or scientific instrumentation requiring linear precision.'
  },
  {
    id: 'jpeg-pipeline',
    name: 'Full JPEG Baseline Pipeline',
    section: 'transforms',
    category: 'lossy',
    type: 'Complete Lossy Image Codec',
    status: 'pending',
    formula: 'RGB→YCbCr 4:2:0 → DCT → Quant → Zig-Zag → Huffman',
    ratio: '10:1 – 40:1',
    desc: 'End-to-end ISO JPEG standard: color subsampling (YCbCr 4:2:0), block-level 8×8 DCT, perceptual quantization matrix, Zig-Zag serialization, and Huffman entropy packing.',
    pros: ['Universal standard supported by 100% of image viewers', 'High photographic compression ratio (15:1 to 30:1) with good fidelity'],
    flaws: ['Severe blocking artifacts at low bitrates', 'Lacks alpha transparency and HDR support'],
    whenToUse: 'Standard photographic web publishing and legacy camera image capture.',
    whenNotToUse: 'Graphics with transparent backgrounds, line drawings, or text overlays.'
  },

  // SECTION 5: MODERN IMAGE & VIDEO
  {
    id: 'png',
    name: 'PNG (Predictive Filter + DEFLATE)',
    section: 'media',
    category: 'lossless',
    type: 'Lossless Raster Standard',
    status: 'pending',
    formula: '5 Row Filters (Sub, Up, Avg, Paeth) → DEFLATE',
    ratio: '2:1 – 10:1',
    desc: 'W3C standard lossless raster format. Applies 5 row-by-row predictive spatial filters (Sub, Up, Average, Paeth) to drastically lower entropy before DEFLATE byte packing.',
    pros: ['100% lossless bit-perfect image reproduction', 'Full 8-bit alpha channel transparency', 'Gamma and color profile correction chunks'],
    flaws: ['Much larger file sizes than modern WebP/AVIF', 'Decompression requires full row filtering passes'],
    whenToUse: 'Screenshots, line drawings, icons, transparent logos, and graphics requiring bit-exact pixel fidelity.',
    whenNotToUse: 'High-resolution photographic imagery where lossless file sizes are prohibitively large.'
  },
  {
    id: 'webp',
    name: 'WebP (VP8 Spatial Prediction / VP8L)',
    section: 'media',
    category: 'both',
    type: 'Modern Web Media Format',
    status: 'pending',
    formula: 'Lossy: VP8 + Arithmetic | Lossless: VP8L Color Transform',
    ratio: '3:1 – 15:1 (26% < PNG)',
    desc: 'Created by Google. Offers 26% better compression than PNG in lossless mode and 25-34% smaller file sizes than JPEG at equivalent SSIM quality.',
    pros: ['Unified format supporting both lossy and lossless modes', 'Alpha channel support even in lossy mode', 'Animated WebP replaces bulky GIFs'],
    flaws: ['Slightly slower encoding than JPEG', 'Not as efficient as newer AVIF at ultra-low bitrates'],
    whenToUse: 'General web imagery serving responsive images to modern browsers.',
    whenNotToUse: 'Legacy image archives or desktop print workflows requiring CMYK.'
  },
  {
    id: 'avif',
    name: 'AVIF (AV1 Still Image File Format)',
    section: 'media',
    category: 'both',
    type: 'Next-Gen Intra Image Codec',
    status: 'pending',
    formula: 'AV1 Intra-Frame + Multi-Symbol rANS Entropy',
    ratio: '5:1 – 30:1 (50% < JPEG)',
    desc: 'Alliance for Open Media (AOM) royalty-free standard. Uses AV1 intra-frame coding, supporting 12-bit HDR, wide color gamut, and rANS entropy coding.',
    pros: ['50% smaller than JPEG at equal visual quality', 'Native 10-bit and 12-bit HDR color support', 'Excellent preservation of fine textures without block artifacts'],
    flaws: ['High CPU encoding complexity', 'Older legacy browser fallbacks required'],
    whenToUse: 'Next-generation web assets, HDR photography, and high-density mobile displays.',
    whenNotToUse: 'Real-time thumbnail generation where encoding latency must be sub-10ms.'
  },
  {
    id: 'video-codecs',
    name: 'Video Codecs: H.264 / HEVC / AV1',
    section: 'media',
    category: 'lossy',
    type: 'Motion-Compensated Video Codec',
    status: 'pending',
    formula: 'I/P/B Frames + Motion Vectors + CABAC / CDF',
    ratio: '50:1 – 300:1',
    desc: 'Exploits temporal correlation between consecutive frames using block-based motion estimation, residual transform, and context-adaptive binary arithmetic coding (CABAC).',
    pros: ['Phenomenal 100:1 to 300:1 compression ratios', 'Hardware-accelerated decoding on virtually every modern GPU/phone'],
    flaws: ['Enormous encoder computational complexity', 'Inter-frame dependencies mean lost frames cause macroblock glitching'],
    whenToUse: 'Streaming video (YouTube, Netflix), real-time video conferencing (WebRTC), and CCTV recording.',
    whenNotToUse: 'Frame-by-frame archival editing where every frame must be independently random-accessible.'
  }
];

// Valid routable views in the unified application
const VALID_VIEWS = new Set(['matrix', 'prefix-tree', 'huffman', 'lz77', 'deflate', 'lzw']);

// Universal URL & Route Resolver (supports #/algo, #algo, /algo, and browser history)
function resolveRoute() {
  if (typeof window === 'undefined') return 'matrix';

  // 1. Check window.location.hash (e.g., #/deflate or #deflate)
  if (window.location.hash) {
    const cleanHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (VALID_VIEWS.has(cleanHash)) {
      return cleanHash;
    }
  }

  // 2. Check window.location.pathname for direct Vercel path rewrites (e.g., /deflate)
  if (window.location.pathname) {
    const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '').trim().toLowerCase();
    if (VALID_VIEWS.has(cleanPath)) {
      return cleanPath;
    }
  }

  // 3. Fallback default to the data matrix
  return 'matrix';
}

// =========================================================================
// LZW (LEMPEL-ZIV-WELCH) CONSTANTS & SIMULATION ENGINE
// =========================================================================
const LZW_PRESETS = {
  user_abc: {
    name: 'User Repetition (ABCABCABC)',
    text: 'ABCABCABC',
    desc: 'Clean 9-byte sequence demonstrating lock-step dictionary synchronization.'
  },
  classic_welch: {
    name: 'Terry Welch Classic (1984)',
    text: 'TOBEORNOTTOBEORTOBEORNOT#',
    desc: 'The landmark test phrase from Terry Welch’s original 1984 IEEE paper.'
  },
  kwkwk_edge: {
    name: 'KwKwK Edge Case (ABABABA)',
    text: 'ABABABA',
    desc: 'The famous unseen code edge case where new_code == dict.size().'
  },
  repeating_run: {
    name: 'Cascading Run (AAAA...BBBB...)',
    text: 'AAAAAAAAAAAAAAAABBBBBBBBBBBBBBBB',
    desc: 'Rapidly compounding dictionary entries illustrating exponential phrase growth.'
  },
  html_markup: {
    name: 'Structured HTML Markup',
    text: '<div><span>CompressLab</span><span>CompressLab</span></div>',
    desc: 'Real-world repeated XML/HTML tags and class names.'
  }
};

/**
 * Pure JavaScript simulation of the LZW Encoder & Decoder Engine.
 * Accurately tracks step-by-step state for both encoder and decoder side-by-side.
 */
function runLzwSimulation(inputText, maxBits = 12) {
  const maxDictSize = 1 << maxBits;
  if (!inputText || inputText.length === 0) {
    return {
      rawBytes: 0,
      rawBits: 0,
      emittedCodes: [],
      encoderSteps: [],
      decoderSteps: [],
      finalEncoderDict: {},
      finalDecoderDict: [],
      decodedStr: '',
      stats: {
        rawBytes: 0,
        rawBits: 0,
        codeBits: maxBits,
        totalCodes: 0,
        dictEntriesCreated: 0,
        compressedPayloadBits: 0,
        headerBits: 112,
        totalCompressedBits: 112,
        totalCompressedBytes: 14,
        spaceSavingsPercent: '0.0',
        compressionRatio: '1.00'
      }
    };
  }

  // 1. Initial 256 byte dictionary
  const encoderDict = {};
  for (let i = 0; i < 256; i++) {
    encoderDict[String.fromCharCode(i)] = i;
  }
  let nextEncoderCode = 256;
  const emittedCodes = [];
  const encoderSteps = [];

  let p = '';
  for (let i = 0; i < inputText.length; i++) {
    const c = inputText[i];
    const combined = p + c;
    if (encoderDict[combined] !== undefined) {
      p = combined;
      encoderSteps.push({
        type: 'match',
        charIdx: i,
        char: c,
        prefix: p,
        emittedCode: null,
        addedEntry: null,
        newCode: null,
        description: `Character '${c}' matches extended prefix "${p}" in dictionary.`
      });
    } else {
      const code = encoderDict[p];
      emittedCodes.push(code);
      let added = null;
      let newCode = null;
      if (nextEncoderCode < maxDictSize) {
        encoderDict[combined] = nextEncoderCode;
        added = combined;
        newCode = nextEncoderCode;
        nextEncoderCode++;
      }
      encoderSteps.push({
        type: 'emit',
        charIdx: i,
        char: c,
        prefix: p,
        emittedCode: code,
        addedEntry: added,
        newCode: newCode,
        description: `Mismatch on "${combined}". Emitted code ${code} for prefix "${p}". Registered dictionary entry [${newCode}: "${combined}"]. Reset prefix to '${c}'.`
      });
      p = c;
    }
  }
  if (p.length > 0) {
    const code = encoderDict[p];
    emittedCodes.push(code);
    encoderSteps.push({
      type: 'flush',
      charIdx: inputText.length,
      char: '',
      prefix: p,
      emittedCode: code,
      addedEntry: null,
      newCode: null,
      description: `End of stream reached. Flushed final prefix "${p}" as code ${code}.`
    });
  }

  // 2. Decoder state simulation (Zero dictionary transmitted over the wire!)
  const decoderSteps = [];
  const decoderDict = [];
  for (let i = 0; i < 256; i++) {
    decoderDict.push(String.fromCharCode(i));
  }

  let decodedStr = '';
  if (emittedCodes.length > 0) {
    const oldCode = emittedCodes[0];
    let s = decoderDict[oldCode] !== undefined ? decoderDict[oldCode] : '?';
    decodedStr += s;
    decoderSteps.push({
      stepIdx: 0,
      receivedCode: oldCode,
      stringEmitted: s,
      addedEntry: null,
      newCode: null,
      isKwKwK: false,
      reconstructedBuffer: decodedStr,
      description: `Received first code ${oldCode} -> lookup in initial dictionary gives "${s}". Emitted "${s}".`
    });

    for (let i = 1; i < emittedCodes.length; i++) {
      const newCode = emittedCodes[i];
      let entry = '';
      let isKwKwK = false;

      if (newCode < decoderDict.length) {
        entry = decoderDict[newCode];
      } else if (newCode === decoderDict.length) {
        // THE FAMOUS KwKwK / cScSc SPECIAL CASE:
        // Encoder registered entry and immediately emitted it in the very next step.
        isKwKwK = true;
        entry = s + s[0];
      } else {
        entry = s + s[0]; // fallback safety
      }

      decodedStr += entry;
      const newEntry = s + entry[0];
      let assignedCode = null;
      if (decoderDict.length < maxDictSize) {
        assignedCode = decoderDict.length;
        decoderDict.push(newEntry);
      }

      decoderSteps.push({
        stepIdx: i,
        receivedCode: newCode,
        stringEmitted: entry,
        addedEntry: newEntry,
        newCode: assignedCode,
        isKwKwK: isKwKwK,
        reconstructedBuffer: decodedStr,
        description: isKwKwK
          ? `⚡ KwKwK Special Case! Code ${newCode} was not in dictionary yet! Encoder just registered and emitted it. Decoder computes: previous "${s}" + first("${s}") = "${entry}". Emitted "${entry}". Added [${assignedCode}: "${newEntry}"] to dictionary!`
          : `Received code ${newCode} -> lookup gives "${entry}". Emitted "${entry}". Formed new dictionary entry: previous "${s}" + first("${entry}") = "${newEntry}" -> [${assignedCode}: "${newEntry}"].`
      });

      s = entry;
    }
  }

  // 3. Mathematical reduction arithmetic
  const rawBytes = inputText.length;
  const rawBits = rawBytes * 8;
  const codeBits = maxBits;
  const totalCodes = emittedCodes.length;
  const compressedPayloadBits = totalCodes * codeBits;
  const headerBits = 14 * 8; // 14-byte container header
  const totalCompressedBits = headerBits + compressedPayloadBits;
  const totalCompressedBytes = Math.ceil(totalCompressedBits / 8);
  const spaceSavingsPercent = rawBits > 0 ? (((rawBits - totalCompressedBits) / rawBits) * 100).toFixed(1) : '0.0';
  const compressionRatio = totalCompressedBits > 0 ? (rawBits / totalCompressedBits).toFixed(2) : '1.00';

  return {
    rawBytes,
    rawBits,
    emittedCodes,
    encoderSteps,
    decoderSteps,
    finalEncoderDict: encoderDict,
    finalDecoderDict: decoderDict,
    decodedStr,
    stats: {
      rawBytes,
      rawBits,
      codeBits,
      totalCodes,
      dictEntriesCreated: Math.max(0, nextEncoderCode - 256),
      compressedPayloadBits,
      headerBits,
      totalCompressedBits,
      totalCompressedBytes,
      spaceSavingsPercent,
      compressionRatio
    }
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState(() => resolveRoute());
  const [filterCategory, setFilterCategory] = useState('all');

  // Real File Preset Selection: 'txt', 'pdf', 'log', 'custom'
  const [selectedFileType, setSelectedFileType] = useState('txt');
  const [inputText, setInputText] = useState(REAL_FILE_PRESETS.txt.content);
  
  // Tree & Bitstream State
  const [treeRoot, setTreeRoot] = useState(null);
  const [codeLengths, setCodeLengths] = useState({});
  const [canonicalCodes, setCanonicalCodes] = useState({});
  const [bitstream, setBitstream] = useState('');
  const [walkerIndex, setWalkerIndex] = useState(0);
  const [walkerNodeId, setWalkerNodeId] = useState(null);
  const [decodedOutput, setDecodedOutput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  // ----------------------------------------------------
  // MULTI-PHASE INTERACTIVE ANIMATOR STATE
  // ----------------------------------------------------
  const [animPhase, setAnimPhase] = useState('freq'); // 'freq' | 'tree' | 'codes'
  const [studioInput, setStudioInput] = useState('ABRACADABRA');
  const [freqStepIdx, setFreqStepIdx] = useState(0);
  const [currentAnimStepIdx, setCurrentAnimStepIdx] = useState(0);
  const [isAutoBuilding, setIsAutoBuilding] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isAutoBuildingRef = useRef(false);
  const activeSpeechTimeoutRef = useRef(null);
  const autoBuildTimerRef = useRef(null);

  // ----------------------------------------------------
  // LZ77 SLIDING WINDOW STATE
  // ----------------------------------------------------
  const [lzPresetKey, setLzPresetKey] = useState('cars');
  const [lzInput, setLzInput] = useState(LZ77_PRESETS.cars.text);
  const [lzWindowSize, setLzWindowSize] = useState(32);
  const [lzLookaheadSize, setLzLookaheadSize] = useState(16);
  const [lzStepIdx, setLzStepIdx] = useState(0);
  const [lzAnimPhase, setLzAnimPhase] = useState('scanner'); // 'scanner' | 'recon' | 'matrix'
  const [lzIsAutoBuilding, setLzIsAutoBuilding] = useState(false);
  const [lzVoiceEnabled, setLzVoiceEnabled] = useState(true);
  const lzIsAutoBuildingRef = useRef(false);
  const lzSpeechTimeoutRef = useRef(null);

  // ----------------------------------------------------
  // DEFLATE COMPOUND HYBRID ARCHITECTURE STATE
  // ----------------------------------------------------
  const [deflatePresetKey, setDeflatePresetKey] = useState('html');
  const [deflateInput, setDeflateInput] = useState(DEFLATE_PRESETS.html.text);
  const [deflateWindowSize, setDeflateWindowSize] = useState(64);
  const [deflateStepIdx, setDeflateStepIdx] = useState(0);
  const [deflateAnimPhase, setDeflateAnimPhase] = useState('pipeline'); // 'pipeline' | 'exploder' | 'trees' | 'matrix'
  const [deflateIsAutoBuilding, setDeflateIsAutoBuilding] = useState(false);
  const [deflateVoiceEnabled, setDeflateVoiceEnabled] = useState(true);
  const deflateIsAutoBuildingRef = useRef(false);
  const deflateSpeechTimeoutRef = useRef(null);

  // Phase 2: Length & Distance Symbol & Extra-Bits Exploder Lab State
  const [exploderLength, setExploderLength] = useState(9);
  const [exploderDistance, setExploderDistance] = useState(35);

  // ----------------------------------------------------
  // LZW (LEMPEL-ZIV-WELCH) DYNAMIC DICTIONARY STATE
  // ----------------------------------------------------
  const [lzwPresetKey, setLzwPresetKey] = useState('user_abc');
  const [lzwInput, setLzwInput] = useState(LZW_PRESETS.user_abc.text);
  const [lzwMaxBits, setLzwMaxBits] = useState(12);
  const [lzwStepIdx, setLzwStepIdx] = useState(0);
  const [lzwAnimPhase, setLzwAnimPhase] = useState('sync'); // 'sync' | 'kwkwk' | 'bitpacking' | 'matrix'
  const [lzwIsAutoBuilding, setLzwIsAutoBuilding] = useState(false);
  const [lzwVoiceEnabled, setLzwVoiceEnabled] = useState(true);
  const lzwIsAutoBuildingRef = useRef(false);
  const lzwSpeechTimeoutRef = useRef(null);

  const lzwData = useMemo(() => runLzwSimulation(lzwInput, lzwMaxBits), [lzwInput, lzwMaxBits]);

  // Hovered byte info for interactive matrix inspection
  const [hoveredByteInfo, setHoveredByteInfo] = useState(null);

  const playTimerRef = useRef(null);
  const walkerCurrentNodeRef = useRef(null);

  // Universal route synchronizer (handles hashchange, popstate, browser back/forward)
  useEffect(() => {
    const handleRouteChange = () => {
      const target = resolveRoute();
      setCurrentView(target);

      // Cancel any ongoing voice synthesis when switching routes
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // Stop all background auto-builders across all studios
      isAutoBuildingRef.current = false;
      setIsAutoBuilding(false);
      lzIsAutoBuildingRef.current = false;
      setLzIsAutoBuilding(false);
      deflateIsAutoBuildingRef.current = false;
      setDeflateIsAutoBuilding(false);
      lzwIsAutoBuildingRef.current = false;
      setLzwIsAutoBuilding(false);

      if (activeSpeechTimeoutRef.current) {
        clearTimeout(activeSpeechTimeoutRef.current);
        activeSpeechTimeoutRef.current = null;
      }
      if (lzSpeechTimeoutRef.current) {
        clearTimeout(lzSpeechTimeoutRef.current);
        lzSpeechTimeoutRef.current = null;
      }
      if (deflateSpeechTimeoutRef.current) {
        clearTimeout(deflateSpeechTimeoutRef.current);
        deflateSpeechTimeoutRef.current = null;
      }
      if (lzwSpeechTimeoutRef.current) {
        clearTimeout(lzwSpeechTimeoutRef.current);
        lzwSpeechTimeoutRef.current = null;
      }
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    // Initial check to ensure canonical hash if path or hash is used
    const current = resolveRoute();
    if (current !== 'matrix' && !window.location.hash.includes(current)) {
      window.location.hash = `#${current}`;
    }

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const navigateTo = (viewId) => {
    const target = VALID_VIEWS.has(viewId) ? viewId : 'matrix';

    // 1. Immediately cancel active speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // 2. Stop all active auto-builders and speech safety timeouts
    isAutoBuildingRef.current = false;
    setIsAutoBuilding(false);
    lzIsAutoBuildingRef.current = false;
    setLzIsAutoBuilding(false);
    deflateIsAutoBuildingRef.current = false;
    setDeflateIsAutoBuilding(false);
    lzwIsAutoBuildingRef.current = false;
    setLzwIsAutoBuilding(false);

    if (activeSpeechTimeoutRef.current) {
      clearTimeout(activeSpeechTimeoutRef.current);
      activeSpeechTimeoutRef.current = null;
    }
    if (lzSpeechTimeoutRef.current) {
      clearTimeout(lzSpeechTimeoutRef.current);
      lzSpeechTimeoutRef.current = null;
    }
    if (deflateSpeechTimeoutRef.current) {
      clearTimeout(deflateSpeechTimeoutRef.current);
      deflateSpeechTimeoutRef.current = null;
    }
    if (lzwSpeechTimeoutRef.current) {
      clearTimeout(lzwSpeechTimeoutRef.current);
      lzwSpeechTimeoutRef.current = null;
    }

    // 3. Update URL hash
    window.location.hash = target === 'matrix' ? '#matrix' : `#${target}`;
    setCurrentView(target);

    // 4. Smoothly scroll to the top of the newly mounted studio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch file preset
  const handleSelectFilePreset = (presetKey) => {
    setSelectedFileType(presetKey);
    if (presetKey !== 'custom') {
      setInputText(REAL_FILE_PRESETS[presetKey].content);
    }
  };

  // ----------------------------------------------------
  // Voice Speech Function (Web Speech API) with onend Callback
  // ----------------------------------------------------
  const speakWithCallback = (text, onFinish) => {
    if (activeSpeechTimeoutRef.current) {
      clearTimeout(activeSpeechTimeoutRef.current);
      activeSpeechTimeoutRef.current = null;
    }

    if (!voiceEnabled || !('speechSynthesis' in window)) {
      if (isAutoBuildingRef.current && onFinish) {
        activeSpeechTimeoutRef.current = setTimeout(onFinish, 1800);
      }
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Natural crisp tempo
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Samantha')));
      if (engVoice) utterance.voice = engVoice;

      let hasCompleted = false;
      const completeHandler = () => {
        if (hasCompleted) return;
        hasCompleted = true;
        setIsSpeaking(false);
        if (isAutoBuildingRef.current && onFinish) {
          // Crisp 350ms natural pause after speech completes before advancing to next step
          activeSpeechTimeoutRef.current = setTimeout(() => {
            activeSpeechTimeoutRef.current = null;
            onFinish();
          }, 350);
        }
      };

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = completeHandler;
      utterance.onerror = completeHandler;

      // Fallback safety timeout if speech synthesis stalls
      const maxSafety = Math.max(3000, text.length * 75);
      activeSpeechTimeoutRef.current = setTimeout(completeHandler, maxSafety);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      setIsSpeaking(false);
      if (isAutoBuildingRef.current && onFinish) {
        activeSpeechTimeoutRef.current = setTimeout(onFinish, 1800);
      }
    }
  };

  // ----------------------------------------------------
  // Full Document Huffman Calculation (for Real Data Matrix)
  // ----------------------------------------------------
  useEffect(() => {
    if (!inputText || inputText.length === 0) {
      setTreeRoot(null);
      setCodeLengths({});
      setCanonicalCodes({});
      setBitstream('');
      return;
    }

    const freq = {};
    for (let c of inputText) freq[c] = (freq[c] || 0) + 1;

    let pq = Object.entries(freq).map(([sym, count]) => new TreeNode(sym, count));
    pq.sort((a, b) => a.weight - b.weight || (a.symbol || '').localeCompare(b.symbol || ''));

    while (pq.length > 1) {
      pq.sort((a, b) => a.weight - b.weight || (a.symbol || '').localeCompare(b.symbol || ''));
      const leftNode = pq[0];
      const rightNode = pq[1];
      const parentNode = new TreeNode(null, leftNode.weight + rightNode.weight);
      parentNode.left = leftNode;
      parentNode.right = rightNode;
      pq = [parentNode, ...pq.slice(2)];
    }

    const finalRoot = pq[0] || null;

    const lengths = {};
    function extractLengths(node, depth = 0) {
      if (!node) return;
      if (node.isLeaf()) {
        lengths[node.symbol] = depth === 0 ? 1 : depth;
        return;
      }
      extractLengths(node.left, depth + 1);
      extractLengths(node.right, depth + 1);
    }
    if (finalRoot) extractLengths(finalRoot);

    const groups = {};
    Object.keys(lengths).forEach(sym => {
      const l = lengths[sym];
      if (!groups[l]) groups[l] = [];
      groups[l].push(sym);
    });

    const canonical = {};
    let currentCode = 0;
    for (let len = 1; len <= 32; ++len) {
      if (groups[len]) {
        groups[len].sort();
        groups[len].forEach(sym => {
          canonical[sym] = currentCode.toString(2).padStart(len, '0');
          currentCode++;
        });
      }
      currentCode <<= 1;
    }

    let bits = '';
    for (let c of inputText) bits += canonical[c] || '';

    setTreeRoot(finalRoot);
    setCodeLengths(lengths);
    setCanonicalCodes(canonical);
    setBitstream(bits);
    setWalkerIndex(0);
    setWalkerNodeId(finalRoot ? finalRoot.id : null);
    walkerCurrentNodeRef.current = finalRoot;
    setDecodedOutput('');
  }, [inputText]);

  // ----------------------------------------------------
  // PHASE 1: Frequency Table Scanner Step Generation
  // ----------------------------------------------------
  const freqSteps = useMemo(() => {
    if (!studioInput || studioInput.length === 0) return [];
    const steps = [];
    const chars = studioInput.split('');

    const talliesSoFar = {};
    chars.forEach((c, i) => {
      talliesSoFar[c] = (talliesSoFar[c] || 0) + 1;
      const currentCount = talliesSoFar[c];
      const scannedSoFar = i + 1;
      const pct = Math.round((currentCount / scannedSoFar) * 100);

      const title = i === 0 
        ? `Scan [0]: Starting Stream with '${c === ' ' ? '␣' : c}'` 
        : `Scan [${i}]: Symbol '${c === ' ' ? '␣' : c}'`;
      const narrative = i === 0
        ? `Beginning stream scan at index 0. Read symbol '${c === ' ' ? 'SPACE' : c}'. Initial occurrence tallied in frequency table.`
        : `Position ${i}: Read symbol '${c === ' ' ? 'SPACE' : c}'. Gathering into frequency table. Tally is now ${currentCount} (${pct}% of stream).`;
      const voiceScript = i === 0
        ? `We begin scanning the input stream. At index 0, we read symbol ${c === ' ' ? 'space' : c}, recording its initial frequency count of 1.`
        : `Position ${i}: Read symbol ${c === ' ' ? 'space' : c}. Frequency count is now ${currentCount}.`;

      steps.push({
        stepNumber: i + 1,
        stepType: 'scan',
        activeCharIdx: i,
        activeChar: c,
        scannedCount: scannedSoFar,
        tallies: { ...talliesSoFar },
        justUpdatedSym: c,
        title,
        narrative,
        voiceScript
      });
    });

    const uniqueCount = Object.keys(talliesSoFar).length;
    steps.push({
      stepNumber: chars.length + 1,
      stepType: 'complete',
      activeCharIdx: chars.length,
      activeChar: null,
      scannedCount: chars.length,
      tallies: { ...talliesSoFar },
      justUpdatedSym: null,
      title: 'Phase 1 Complete: Frequency Table Assembled',
      narrative: `All ${chars.length} characters gathered into frequency table! Identified ${uniqueCount} unique symbols. Next, convert each symbol to a leaf node and sort into the min-priority queue.`,
      voiceScript: `Scanning complete! Gathered all ${chars.length} characters into the frequency table with ${uniqueCount} distinct symbols. We now convert these into leaf nodes sorted into our min-priority queue.`
    });

    return steps;
  }, [studioInput]);

  // ----------------------------------------------------
  // PHASE 2: Tree Construction Merge Step Generation
  // ----------------------------------------------------
  const { treeSteps, studioTreeRoot, studioCanonicalCodes, studioBitstream } = useMemo(() => {
    if (!studioInput || studioInput.length === 0) {
      return { treeSteps: [], studioTreeRoot: null, studioCanonicalCodes: {}, studioBitstream: '' };
    }

    const freq = {};
    for (let c of studioInput) freq[c] = (freq[c] || 0) + 1;

    let initialQueue = Object.entries(freq).map(([sym, count]) => new TreeNode(sym, count));
    initialQueue.sort((a, b) => a.weight - b.weight || (a.symbol || '').localeCompare(b.symbol || ''));

    const steps = [];

    // Step 0: Priority Queue Loaded
    steps.push({
      stepNumber: 0,
      title: "Phase 2 · Step 0: Min-Priority Queue Loaded",
      narrative: `Min-priority queue loaded with ${initialQueue.length} leaf nodes, sorted from lowest frequency to highest.`,
      voiceScript: `Priority queue loaded with ${initialQueue.length} leaf nodes, sorted in ascending order by frequency.`,
      queue: initialQueue.map(n => n.clone()),
      mergingIds: [],
      extractedLeft: null,
      extractedRight: null
    });

    let currentQueue = initialQueue.map(n => n.clone());
    let stepCount = 1;

    while (currentQueue.length > 1) {
      currentQueue.sort((a, b) => a.weight - b.weight || (a.symbol || '').localeCompare(b.symbol || ''));
      
      const leftNode = currentQueue[0];
      const rightNode = currentQueue[1];

      const parentNode = new TreeNode(null, leftNode.weight + rightNode.weight);
      parentNode.left = leftNode;
      parentNode.right = rightNode;

      const leftName = leftNode.isLeaf() ? `'${leftNode.symbol === ' ' ? '␣' : leftNode.symbol}'` : `Subtree`;
      const rightName = rightNode.isLeaf() ? `'${rightNode.symbol === ' ' ? '␣' : rightNode.symbol}'` : `Subtree`;

      const narrative = `Greedy Merge #${stepCount}: Extracted lowest weight node ${leftName} (wt ${leftNode.weight}) and ${rightName} (wt ${rightNode.weight}). Merged into parent node of weight ${parentNode.weight}. Left branch gets bit 0, right branch gets bit 1.`;
      const voiceScript = `Step ${stepCount}: Extracting lowest node ${leftNode.isLeaf() ? (leftNode.symbol === ' ' ? 'space' : leftNode.symbol) : 'subtree'} with weight ${leftNode.weight}, and node ${rightNode.isLeaf() ? (rightNode.symbol === ' ' ? 'space' : rightNode.symbol) : 'subtree'} with weight ${rightNode.weight}. Merging them into parent node of weight ${parentNode.weight}.`;

      currentQueue = [parentNode, ...currentQueue.slice(2)];
      currentQueue.sort((a, b) => a.weight - b.weight);

      steps.push({
        stepNumber: stepCount,
        title: `Step ${stepCount}: Merge (${leftName} + ${rightName}) → Parent (wt ${parentNode.weight})`,
        narrative,
        voiceScript,
        queue: currentQueue.map(n => n.clone()),
        mergingIds: [leftNode.id, rightNode.id, parentNode.id],
        extractedLeft: leftNode.clone(),
        extractedRight: rightNode.clone()
      });

      stepCount++;
    }

    const finalRoot = currentQueue[0] || null;
    if (finalRoot) {
      steps.push({
        stepNumber: stepCount,
        title: "Phase 2 Complete: Provably Optimal Prefix Tree Assembled",
        narrative: `Optimal prefix tree construction complete! Exactly one root node remains with total weight ${finalRoot.weight}.`,
        voiceScript: `Tree construction complete! Exactly one root node remains with total weight ${finalRoot.weight}. The optimal prefix tree is now fully assembled.`,
        queue: [finalRoot.clone()],
        mergingIds: [finalRoot.id],
        extractedLeft: null,
        extractedRight: null
      });
    }

    // Extract Canonical Codes for studio
    const lengths = {};
    function extractLengths(node, depth = 0) {
      if (!node) return;
      if (node.isLeaf()) {
        lengths[node.symbol] = depth === 0 ? 1 : depth;
        return;
      }
      extractLengths(node.left, depth + 1);
      extractLengths(node.right, depth + 1);
    }
    if (finalRoot) extractLengths(finalRoot);

    const groups = {};
    Object.keys(lengths).forEach(sym => {
      const l = lengths[sym];
      if (!groups[l]) groups[l] = [];
      groups[l].push(sym);
    });

    const canonical = {};
    let currentCode = 0;
    for (let len = 1; len <= 32; ++len) {
      if (groups[len]) {
        groups[len].sort();
        groups[len].forEach(sym => {
          canonical[sym] = currentCode.toString(2).padStart(len, '0');
          currentCode++;
        });
      }
      currentCode <<= 1;
    }

    let bits = '';
    for (let c of studioInput) bits += canonical[c] || '';

    return {
      treeSteps: steps,
      studioTreeRoot: finalRoot,
      studioCanonicalCodes: canonical,
      studioBitstream: bits
    };
  }, [studioInput]);

  // Keep animSteps synced with treeSteps
  const animSteps = treeSteps;

  // ----------------------------------------------------
  // LZ77 SLIDING WINDOW MATCH STEP GENERATOR WITH STEP REDUCTION MATH
  // ----------------------------------------------------
  const lzSteps = useMemo(() => {
    if (!lzInput || lzInput.length === 0) return [];
    const steps = [];
    const size = lzInput.length;
    let cursor = 0;
    let cumulativeTokens = [];
    let reconstructed = '';

    while (cursor < size) {
      const searchStart = Math.max(0, cursor - lzWindowSize);
      const searchEnd = cursor - 1;
      const maxLookahead = Math.min(lzLookaheadSize, size - cursor);
      const matchableLimit = (cursor + maxLookahead < size) ? maxLookahead : (size - cursor - 1);

      let bestDistance = 0;
      let bestLength = 0;
      let bestMatchPos = -1;

      if (matchableLimit > 0) {
        for (let pos = searchStart; pos < cursor; ++pos) {
          let len = 0;
          while (len < matchableLimit && lzInput[pos + len] === lzInput[cursor + len]) {
            len++;
          }
          if (len > bestLength) {
            bestLength = len;
            bestDistance = cursor - pos;
            bestMatchPos = pos;
          }
        }
      }

      const nextChar = lzInput[cursor + bestLength];
      const token = {
        distance: bestDistance,
        length: bestLength,
        nextChar: nextChar,
        stepNumber: steps.length + 1
      };

      // Step-by-step mathematical size reduction calculation
      const rawCharsCovered = bestLength + 1;
      const rawBitsThisStep = rawCharsCovered * 8;
      const tokenBitsThisStep = 28; // 12b distance + 8b length + 8b literal byte
      const deltaBitsThisStep = rawBitsThisStep - tokenBitsThisStep;
      const deltaPercentThisStep = Math.round((deltaBitsThisStep / rawBitsThisStep) * 100);

      // Reconstructed output buffer so far
      if (bestLength > 0) {
        const copyStart = reconstructed.length - bestDistance;
        for (let i = 0; i < bestLength; ++i) {
          reconstructed += reconstructed[copyStart + i];
        }
      }
      reconstructed += nextChar;

      const currentTokens = [...cumulativeTokens, token];
      cumulativeTokens = currentTokens;

      const nextCharDisplay = nextChar === ' ' ? '␣ (space)' : `'${nextChar}'`;
      const nextCharSpoken = nextChar === ' ' ? 'space' : nextChar;

      let narrative = '';
      let voiceScript = '';

      if (bestLength > 0) {
        const matchedSub = lzInput.substring(bestMatchPos, bestMatchPos + bestLength);
        narrative = `Found match "${matchedSub}" (${bestLength} chars) at backward distance ${bestDistance}! Emitting token (d=${bestDistance}, l=${bestLength}, ${nextCharDisplay}). Calculation: ${rawBitsThisStep} raw bits (original) → 28 token bits (compressed), saving ${deltaBitsThisStep} bits (${deltaPercentThisStep}% size reduction on this phrase).`;
        voiceScript = `Found matching phrase "${matchedSub}" of length ${bestLength} at distance ${bestDistance}. Emitting token with distance ${bestDistance}, length ${bestLength}, character ${nextCharSpoken}. This reduces ${rawBitsThisStep} raw bits down to 28 compressed bits, saving ${deltaBitsThisStep} bits.`;
      } else {
        narrative = `No prior match in search buffer for '${nextCharDisplay}'. Emitting literal token (d=0, l=0, ${nextCharDisplay}). Calculation: 8 raw bits (original) → 28 token bits (compressed), expanding by 20 bits (+250%) due to uncompressed triplet format.`;
        voiceScript = `At cursor position ${cursor}, no match exists in history. Emitting literal token with distance zero, length zero, and character ${nextCharSpoken}.`;
      }

      steps.push({
        stepIndex: steps.length,
        cursor,
        searchStart,
        searchEnd,
        lookaheadStart: cursor,
        lookaheadEnd: cursor + bestLength,
        bestDistance,
        bestLength,
        bestMatchPos,
        nextChar,
        token,
        rawBitsThisStep,
        tokenBitsThisStep,
        deltaBitsThisStep,
        deltaPercentThisStep,
        narrative,
        voiceScript,
        tokensSoFar: currentTokens,
        reconstructedSoFar: reconstructed
      });

      cursor += (bestLength + 1);
    }
    return steps;
  }, [lzInput, lzWindowSize, lzLookaheadSize]);

  // Synchronized LZ77 voice & auto-advancer
  const handleLzStepChange = (newIdx) => {
    if (newIdx < 0 || newIdx >= lzSteps.length) return;
    setLzStepIdx(newIdx);
    if (lzVoiceEnabled && lzSteps[newIdx]) {
      speakWithCallback(lzSteps[newIdx].voiceScript, () => {
        if (lzIsAutoBuildingRef.current) {
          if (newIdx < lzSteps.length - 1) {
            handleLzStepChange(newIdx + 1);
          } else {
            setLzIsAutoBuilding(false);
            lzIsAutoBuildingRef.current = false;
          }
        }
      });
    }
  };

  const handleToggleLzAutoBuild = () => {
    if (lzIsAutoBuilding) {
      setLzIsAutoBuilding(false);
      lzIsAutoBuildingRef.current = false;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (lzSpeechTimeoutRef.current) clearTimeout(lzSpeechTimeoutRef.current);
    } else {
      setLzIsAutoBuilding(true);
      lzIsAutoBuildingRef.current = true;
      const startIdx = lzStepIdx >= lzSteps.length - 1 ? 0 : lzStepIdx;
      setLzStepIdx(startIdx);
      if (lzSteps[startIdx]) {
        speakWithCallback(lzSteps[startIdx].voiceScript, () => {
          if (lzIsAutoBuildingRef.current) {
            if (startIdx < lzSteps.length - 1) {
              handleLzStepChange(startIdx + 1);
            } else {
              setLzIsAutoBuilding(false);
              lzIsAutoBuildingRef.current = false;
            }
          }
        });
      }
    }
  };

  // ----------------------------------------------------
  // DEFLATE COMPOUND PIPELINE ENGINE & MATHEMATICAL REDUCTION AUDITOR
  // ----------------------------------------------------
  const deflateData = useMemo(() => {
    if (!deflateInput || deflateInput.length === 0) {
      return {
        steps: [],
        tokens: [],
        litLengths: {},
        litCodes: {},
        distLengths: {},
        distCodes: {},
        stats: null
      };
    }

    const str = deflateInput;
    const size = str.length;
    let cursor = 0;
    const rawTokens = [];

    // Stage 1: LZ77 Sliding Window Matcher
    while (cursor < size) {
      const searchStart = Math.max(0, cursor - deflateWindowSize);
      const maxLookahead = Math.min(258, size - cursor);

      let bestDist = 0;
      let bestLen = 0;

      if (maxLookahead >= 3) {
        for (let pos = searchStart; pos < cursor; ++pos) {
          let len = 0;
          while (len < maxLookahead && str[pos + len] === str[cursor + len]) {
            len++;
          }
          if (len > bestLen) {
            bestLen = len;
            bestDist = cursor - pos;
            if (bestLen === 258) break;
          }
        }
      }

      if (bestLen >= 3) {
        rawTokens.push({
          isMatch: true,
          cursor,
          searchStart,
          searchEnd: cursor - 1,
          length: bestLen,
          distance: bestDist,
          matchedText: str.substring(cursor, cursor + bestLen),
          matchPos: cursor - bestDist
        });
        cursor += bestLen;
      } else {
        rawTokens.push({
          isMatch: false,
          cursor,
          char: str[cursor],
          symbol: str.charCodeAt(cursor)
        });
        cursor += 1;
      }
    }

    // Append End-Of-Block (EOB = 256)
    rawTokens.push({
      isMatch: false,
      cursor: size,
      char: 'EOB',
      symbol: 256,
      isEob: true
    });

    // Stage 2: Tally Symbol Frequencies for Dual Huffman Trees
    const litLenFreq = {};
    const distFreq = {};

    let matchesCount = 0;
    let literalsCount = 0;
    let bytesDeduplicated = 0;

    for (const tok of rawTokens) {
      if (!tok.isMatch) {
        litLenFreq[tok.symbol] = (litLenFreq[tok.symbol] || 0) + 1;
        if (!tok.isEob) literalsCount++;
      } else {
        const lenMap = mapLengthToRfc1951(tok.length);
        const distMap = mapDistanceToRfc1951(tok.distance);
        litLenFreq[lenMap.code] = (litLenFreq[lenMap.code] || 0) + 1;
        distFreq[distMap.code] = (distFreq[distMap.code] || 0) + 1;
        matchesCount++;
        bytesDeduplicated += tok.length;
      }
    }

    // Helper: Build Canonical Huffman Codes from Frequency Map
    function buildCanonicalCodebook(freqMap) {
      const lengths = {};
      const codes = {};
      const entries = Object.entries(freqMap).map(([sym, count]) => ({ sym: Number(sym), weight: Number(count) }));
      if (entries.length === 0) return { lengths, codes };
      if (entries.length === 1) {
        lengths[entries[0].sym] = 1;
        codes[entries[0].sym] = '0';
        return { lengths, codes };
      }

      let pq = entries.map(e => ({ sym: e.sym, weight: e.weight, left: null, right: null }));
      pq.sort((a, b) => a.weight - b.weight || a.sym - b.sym);

      while (pq.length > 1) {
        pq.sort((a, b) => a.weight - b.weight || (a.sym !== null && b.sym !== null ? a.sym - b.sym : 0));
        const left = pq[0];
        const right = pq[1];
        const parent = { sym: null, weight: left.weight + right.weight, left, right };
        pq = [parent, ...pq.slice(2)];
      }

      const root = pq[0];
      function getDepths(node, depth = 0) {
        if (!node) return;
        if (node.sym !== null) {
          lengths[node.sym] = depth === 0 ? 1 : depth;
          return;
        }
        getDepths(node.left, depth + 1);
        getDepths(node.right, depth + 1);
      }
      getDepths(root, 0);

      const groups = {};
      for (const s in lengths) {
        const l = lengths[s];
        if (!groups[l]) groups[l] = [];
        groups[l].push(Number(s));
      }

      let code = 0;
      for (let l = 1; l <= 32; ++l) {
        if (groups[l]) {
          groups[l].sort((a, b) => a - b);
          for (const s of groups[l]) {
            codes[s] = code.toString(2).padStart(l, '0');
            code++;
          }
        }
        code <<= 1;
      }
      return { lengths, codes };
    }

    const litCb = buildCanonicalCodebook(litLenFreq);
    const distCb = buildCanonicalCodebook(distFreq);

    // Build Step-by-Step Visualization Array with Exact Arithmetic
    const steps = [];
    let reconstructed = '';
    let cumulativeTokens = [];
    let runningPayloadBits = 0;

    for (let i = 0; i < rawTokens.length; ++i) {
      const tok = rawTokens[i];
      let rawBitsThisStep = 0;
      let deflateBitsThisStep = 0;
      let narrative = '';
      let voiceScript = '';
      let lenMap = null;
      let distMap = null;
      let lenHuffCode = '';
      let distHuffCode = '';
      let litHuffCode = '';

      if (tok.isEob) {
        rawBitsThisStep = 0;
        litHuffCode = litCb.codes[256] || '0';
        deflateBitsThisStep = litHuffCode.length;
        narrative = `Block Complete! Emitted RFC 1951 End-Of-Block marker (Symbol 256) encoded as Canonical Huffman bitstring '${litHuffCode}' (${deflateBitsThisStep} bits).`;
        voiceScript = `Compression block complete. Emitted End of Block symbol two hundred fifty six with Huffman code ${litHuffCode}.`;
      } else if (tok.isMatch) {
        lenMap = mapLengthToRfc1951(tok.length);
        distMap = mapDistanceToRfc1951(tok.distance);

        lenHuffCode = litCb.codes[lenMap.code] || '0';
        distHuffCode = distCb.codes[distMap.code] || '0';

        rawBitsThisStep = tok.length * 8;
        deflateBitsThisStep = lenHuffCode.length + lenMap.extraBitsCount + distHuffCode.length + distMap.extraBitsCount;

        const copyStart = reconstructed.length - tok.distance;
        for (let k = 0; k < tok.length; ++k) {
          reconstructed += reconstructed[copyStart + k];
        }

        const deltaBits = rawBitsThisStep - deflateBitsThisStep;
        const deltaPct = Math.round((deltaBits / rawBitsThisStep) * 100);

        narrative = `Found ${tok.length}-byte match "${tok.matchedText}" at backward distance ${tok.distance}! RFC 1951 maps Length ${tok.length} → Symbol ${lenMap.code} (${lenHuffCode}, ${lenHuffCode.length}b) + ${lenMap.extraBitsCount} extra bit '${lenMap.extraBitsBin}', and Distance ${tok.distance} → Symbol ${distMap.code} (${distHuffCode}, ${distHuffCode.length}b) + ${distMap.extraBitsCount} extra bits '${distMap.extraBitsBin}'. Arithmetic: ${rawBitsThisStep} raw bits → ${deflateBitsThisStep} DEFLATE bits (Saved ${deltaBits} bits, -${deltaPct}%).`;
        voiceScript = `Found matching phrase "${tok.matchedText}" of length ${tok.length} at backward distance ${tok.distance}. In DEFLATE, length ${tok.length} maps to Length Symbol ${lenMap.code} with ${lenMap.extraBitsCount} extra bits, and distance ${tok.distance} maps to Distance Symbol ${distMap.code} with ${distMap.extraBitsCount} extra bits. This reduces ${rawBitsThisStep} raw bits down to ${deflateBitsThisStep} compressed bits, saving ${deltaBits} bits.`;
      } else {
        const chDisplay = tok.char === ' ' ? '␣ (space)' : `'${tok.char}'`;
        const chSpoken = tok.char === ' ' ? 'space' : tok.char;
        litHuffCode = litCb.codes[tok.symbol] || '0';

        rawBitsThisStep = 8;
        deflateBitsThisStep = litHuffCode.length;
        reconstructed += tok.char;

        const deltaBits = rawBitsThisStep - deflateBitsThisStep;
        const deltaPct = Math.round((deltaBits / rawBitsThisStep) * 100);

        narrative = `No match ≥ 3 in window for ${chDisplay}. Emitted Literal Symbol ${tok.symbol} (ASCII '${tok.char}') coded as Canonical Huffman bitstring '${litHuffCode}' (${deflateBitsThisStep} bits vs 8 raw bits, saving ${deltaBits} bits, -${deltaPct}%). Notice DEFLATE does NOT suffer from the 28-bit raw LZ77 triplet expansion penalty!`;
        voiceScript = `At cursor ${tok.cursor}, no phrase match exists. Emitting literal ${chSpoken}. Canonical Huffman encodes it in ${deflateBitsThisStep} bits instead of eight raw bits.`;
      }

      runningPayloadBits += deflateBitsThisStep;
      cumulativeTokens = [...cumulativeTokens, tok];

      steps.push({
        stepIdx: i,
        tok,
        isMatch: tok.isMatch,
        isEob: tok.isEob,
        cursor: tok.cursor,
        matchedText: tok.matchedText,
        bestLength: tok.length || 0,
        bestDistance: tok.distance || 0,
        char: tok.char,
        symbol: tok.symbol,
        lenMap,
        distMap,
        lenHuffCode,
        distHuffCode,
        litHuffCode,
        rawBitsThisStep,
        deflateBitsThisStep,
        deltaBitsThisStep: rawBitsThisStep - deflateBitsThisStep,
        deltaPercentThisStep: rawBitsThisStep > 0 ? Math.round(((rawBitsThisStep - deflateBitsThisStep) / rawBitsThisStep) * 100) : 0,
        runningPayloadBits,
        reconstructedSoFar: reconstructed,
        tokensSoFar: cumulativeTokens,
        narrative,
        voiceScript
      });
    }

    // Full Document Mathematical Statistics
    const rawBytes = size;
    const rawBits = size * 8;
    const headerBits = 96; // 12-byte container header
    const litTreeBits = Object.keys(litCb.lengths).length * 8;
    const distTreeBits = Object.keys(distCb.lengths).length * 8;
    const totalCompressedBits = headerBits + litTreeBits + distTreeBits + runningPayloadBits;
    const totalCompressedBytes = Math.ceil(totalCompressedBits / 8);
    const spaceSavingsPercent = Math.max(0, Math.round(((rawBits - totalCompressedBits) / rawBits) * 100));
    const compressionRatio = (rawBytes / Math.max(1, totalCompressedBytes)).toFixed(2);

    // Raw LZ77 Comparison (28-bit fixed triplets)
    const rawLzTokenCount = rawTokens.length - 1; // minus EOB
    const rawLzBits = rawLzTokenCount * 28 + 96;
    const rawLzBytes = Math.ceil(rawLzBits / 8);

    // Pure Huffman Comparison
    let pureHuffPayloadBits = 0;
    const pureCharFreq = {};
    for (const c of str) pureCharFreq[c.charCodeAt(0)] = (pureCharFreq[c.charCodeAt(0)] || 0) + 1;
    const pureHuffCb = buildCanonicalCodebook(pureCharFreq);
    for (const c of str) pureHuffPayloadBits += (pureHuffCb.codes[c.charCodeAt(0)] || '0').length;
    const pureHuffBytes = Math.ceil((96 + Object.keys(pureHuffCb.lengths).length * 8 + pureHuffPayloadBits) / 8);

    const stats = {
      rawBytes,
      rawBits,
      matchesCount,
      literalsCount,
      bytesDeduplicated,
      headerBits,
      litTreeBits,
      distTreeBits,
      runningPayloadBits,
      totalCompressedBits,
      totalCompressedBytes,
      spaceSavingsPercent,
      compressionRatio,
      rawLzBytes,
      rawLzBits,
      pureHuffBytes,
      pureHuffPayloadBits
    };

    return {
      steps,
      tokens: rawTokens,
      litLengths: litCb.lengths,
      litCodes: litCb.codes,
      distLengths: distCb.lengths,
      distCodes: distCb.codes,
      stats
    };
  }, [deflateInput, deflateWindowSize]);

  // Synchronized DEFLATE Voice & Step Navigation
  const handleDeflateStepChange = (newIdx) => {
    if (!deflateData.steps || newIdx < 0 || newIdx >= deflateData.steps.length) return;
    setDeflateStepIdx(newIdx);
    if (deflateVoiceEnabled && deflateData.steps[newIdx]) {
      speakWithCallback(deflateData.steps[newIdx].voiceScript, () => {
        if (deflateIsAutoBuildingRef.current) {
          if (newIdx < deflateData.steps.length - 1) {
            handleDeflateStepChange(newIdx + 1);
          } else {
            setDeflateIsAutoBuilding(false);
            deflateIsAutoBuildingRef.current = false;
          }
        }
      });
    }
  };

  const handleToggleDeflateAutoBuild = () => {
    if (deflateIsAutoBuilding) {
      setDeflateIsAutoBuilding(false);
      deflateIsAutoBuildingRef.current = false;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (deflateSpeechTimeoutRef.current) clearTimeout(deflateSpeechTimeoutRef.current);
    } else {
      setDeflateIsAutoBuilding(true);
      deflateIsAutoBuildingRef.current = true;
      const startIdx = deflateStepIdx >= deflateData.steps.length - 1 ? 0 : deflateStepIdx;
      setDeflateStepIdx(startIdx);
      if (deflateData.steps[startIdx]) {
        speakWithCallback(deflateData.steps[startIdx].voiceScript, () => {
          if (deflateIsAutoBuildingRef.current) {
            if (startIdx < deflateData.steps.length - 1) {
              handleDeflateStepChange(startIdx + 1);
            } else {
              setDeflateIsAutoBuilding(false);
              deflateIsAutoBuildingRef.current = false;
            }
          }
        });
      }
    }
  };

  const handleLzwStepChange = (newIdx) => {
    if (!lzwData.decoderSteps || newIdx < 0 || newIdx >= lzwData.decoderSteps.length) return;
    setLzwStepIdx(newIdx);
    if (lzwVoiceEnabled && lzwData.decoderSteps[newIdx]) {
      speakWithCallback(lzwData.decoderSteps[newIdx].description, () => {
        if (lzwIsAutoBuildingRef.current) {
          if (newIdx < lzwData.decoderSteps.length - 1) {
            handleLzwStepChange(newIdx + 1);
          } else {
            setLzwIsAutoBuilding(false);
            lzwIsAutoBuildingRef.current = false;
          }
        }
      });
    }
  };

  const handleToggleLzwAutoBuild = () => {
    if (lzwIsAutoBuilding) {
      setLzwIsAutoBuilding(false);
      lzwIsAutoBuildingRef.current = false;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (lzwSpeechTimeoutRef.current) clearTimeout(lzwSpeechTimeoutRef.current);
    } else {
      setLzwIsAutoBuilding(true);
      lzwIsAutoBuildingRef.current = true;
      const startIdx = lzwStepIdx >= lzwData.decoderSteps.length - 1 ? 0 : lzwStepIdx;
      setLzwStepIdx(startIdx);
      if (lzwData.decoderSteps[startIdx]) {
        speakWithCallback(lzwData.decoderSteps[startIdx].description, () => {
          if (lzwIsAutoBuildingRef.current) {
            if (startIdx < lzwData.decoderSteps.length - 1) {
              handleLzwStepChange(startIdx + 1);
            } else {
              setLzwIsAutoBuilding(false);
              lzwIsAutoBuildingRef.current = false;
            }
          }
        });
      }
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (activeSpeechTimeoutRef.current) clearTimeout(activeSpeechTimeoutRef.current);
      if (lzSpeechTimeoutRef.current) clearTimeout(lzSpeechTimeoutRef.current);
      if (deflateSpeechTimeoutRef.current) clearTimeout(deflateSpeechTimeoutRef.current);
      if (lzwSpeechTimeoutRef.current) clearTimeout(lzwSpeechTimeoutRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // ----------------------------------------------------
  // Synchronized Auto-Build & Navigation Engine
  // ----------------------------------------------------
  const stopAutoBuild = () => {
    isAutoBuildingRef.current = false;
    setIsAutoBuilding(false);
    if (activeSpeechTimeoutRef.current) {
      clearTimeout(activeSpeechTimeoutRef.current);
      activeSpeechTimeoutRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const runAutoBuildStep = (phase, idx) => {
    if (!isAutoBuildingRef.current) return;

    if (phase === 'freq') {
      if (idx >= freqSteps.length) {
        // Transition from Phase 1 to Phase 2!
        setAnimPhase('tree');
        setCurrentAnimStepIdx(0);
        runAutoBuildStep('tree', 0);
        return;
      }
      setFreqStepIdx(idx);
      const step = freqSteps[idx];
      if (step) {
        speakWithCallback(step.voiceScript, () => {
          if (!isAutoBuildingRef.current) return;
          if (idx < freqSteps.length - 1) {
            runAutoBuildStep('freq', idx + 1);
          } else {
            // Finished freq steps, transition to tree!
            setAnimPhase('tree');
            setCurrentAnimStepIdx(0);
            runAutoBuildStep('tree', 0);
          }
        });
      }
    } else if (phase === 'tree') {
      if (idx >= treeSteps.length) {
        stopAutoBuild();
        return;
      }
      setCurrentAnimStepIdx(idx);
      const step = treeSteps[idx];
      if (step) {
        speakWithCallback(step.voiceScript, () => {
          if (!isAutoBuildingRef.current) return;
          if (idx < treeSteps.length - 1) {
            runAutoBuildStep('tree', idx + 1);
          } else {
            stopAutoBuild();
          }
        });
      }
    }
  };

  const handleToggleAutoBuild = () => {
    if (isAutoBuilding) {
      stopAutoBuild();
    } else {
      isAutoBuildingRef.current = true;
      setIsAutoBuilding(true);
      if (animPhase === 'freq') {
        runAutoBuildStep('freq', freqStepIdx);
      } else if (animPhase === 'tree') {
        runAutoBuildStep('tree', currentAnimStepIdx);
      }
    }
  };

  const handleNextAnimStep = () => {
    stopAutoBuild();
    if (animPhase === 'freq') {
      const next = Math.min(freqSteps.length - 1, freqStepIdx + 1);
      setFreqStepIdx(next);
      if (freqSteps[next]) speakWithCallback(freqSteps[next].voiceScript);
    } else if (animPhase === 'tree') {
      const next = Math.min(treeSteps.length - 1, currentAnimStepIdx + 1);
      setCurrentAnimStepIdx(next);
      if (treeSteps[next]) speakWithCallback(treeSteps[next].voiceScript);
    }
  };

  const handlePrevAnimStep = () => {
    stopAutoBuild();
    if (animPhase === 'freq') {
      const prev = Math.max(0, freqStepIdx - 1);
      setFreqStepIdx(prev);
      if (freqSteps[prev]) speakWithCallback(freqSteps[prev].voiceScript);
    } else if (animPhase === 'tree') {
      const prev = Math.max(0, currentAnimStepIdx - 1);
      setCurrentAnimStepIdx(prev);
      if (treeSteps[prev]) speakWithCallback(treeSteps[prev].voiceScript);
    }
  };

  const handleResetAnim = () => {
    stopAutoBuild();
    if (animPhase === 'freq') {
      setFreqStepIdx(0);
      if (freqSteps[0]) speakWithCallback(freqSteps[0].voiceScript);
    } else if (animPhase === 'tree') {
      setCurrentAnimStepIdx(0);
      if (treeSteps[0]) speakWithCallback(treeSteps[0].voiceScript);
    }
  };

  const handleSwitchPhase = (targetPhase) => {
    stopAutoBuild();
    setAnimPhase(targetPhase);
    if (targetPhase === 'freq') {
      if (freqSteps[freqStepIdx]) speakWithCallback(freqSteps[freqStepIdx].voiceScript);
    } else if (targetPhase === 'tree') {
      if (treeSteps[currentAnimStepIdx]) speakWithCallback(treeSteps[currentAnimStepIdx].voiceScript);
    }
  };

  // Current active step objects
  const currentFreqStep = freqSteps[freqStepIdx] || freqSteps[0] || null;
  const currentStepObj = treeSteps[currentAnimStepIdx] || treeSteps[0] || null;

  // ----------------------------------------------------
  // REAL DATA MATRIX: Raw File Bytes & Compressed Binary File Bytes
  // ----------------------------------------------------
  const { rawBytesArray, compressedBytesArray, compressedByteBreakdown } = useMemo(() => {
    if (!inputText) return { rawBytesArray: [], compressedBytesArray: [], compressedByteBreakdown: [] };

    const raw = [];
    for (let i = 0; i < inputText.length; ++i) {
      raw.push(inputText.charCodeAt(i) & 0xFF);
    }

    const compBytes = [];
    const breakdown = [];

    // Magic: 'HUFF'
    compBytes.push(0x48, 0x55, 0x46, 0x46);
    breakdown.push('magic', 'magic', 'magic', 'magic');

    // 32-bit Original Uncompressed Size
    const origSize = raw.length;
    compBytes.push((origSize >> 24) & 0xFF, (origSize >> 16) & 0xFF, (origSize >> 8) & 0xFF, origSize & 0xFF);
    breakdown.push('header', 'header', 'header', 'header');

    // Symbol counts and lengths
    const activeSymbols = Object.keys(canonicalCodes);
    compBytes.push((activeSymbols.length - 1) & 0xFF);
    breakdown.push('header');

    activeSymbols.forEach(sym => {
      compBytes.push(sym.charCodeAt(0) & 0xFF);
      compBytes.push(canonicalCodes[sym].length & 0xFF);
      breakdown.push('header', 'header');
    });

    // Pack bitstream
    let bitBuffer = 0;
    let bitCount = 0;

    for (let i = 0; i < bitstream.length; ++i) {
      const bit = bitstream[i] === '1' ? 1 : 0;
      bitBuffer = (bitBuffer << 1) | bit;
      bitCount++;

      if (bitCount === 8) {
        compBytes.push(bitBuffer & 0xFF);
        breakdown.push('payload');
        bitBuffer = 0;
        bitCount = 0;
      }
    }

    if (bitCount > 0) {
      bitBuffer <<= (8 - bitCount);
      compBytes.push(bitBuffer & 0xFF);
      breakdown.push('padding');
    }

    return { rawBytesArray: raw, compressedBytesArray: compBytes, compressedByteBreakdown: breakdown };
  }, [inputText, canonicalCodes, bitstream]);

  // ----------------------------------------------------
  // Metrics Calculation
  // ----------------------------------------------------
  const metrics = useMemo(() => {
    if (!inputText || !canonicalCodes) {
      return {
        rawBytes: 0, rawBits: 0, entropy: 0,
        compressedBytes: 0, compressedBits: 0,
        compressionRatio: 1, spaceSavings: 0,
        avgLength: 0, redundancy: 0, kraftSum: 0
      };
    }

    const rawBytes = rawBytesArray.length;
    const rawBits = rawBytes * 8;

    const freq = {};
    for (let c of inputText) freq[c] = (freq[c] || 0) + 1;

    let H = 0;
    Object.values(freq).forEach(cnt => {
      const p = cnt / rawBytes;
      H -= p * Math.log2(p);
    });

    let payloadBits = 0;
    let kSum = 0;
    Object.entries(canonicalCodes).forEach(([sym, code]) => {
      payloadBits += (freq[sym] || 0) * code.length;
      kSum += Math.pow(2, -code.length);
    });

    const compBytes = compressedBytesArray.length;
    const compBits = compBytes * 8;

    const ratio = compBytes > 0 ? (rawBytes / compBytes) : 1;
    const savings = rawBytes > 0 ? ((1 - (compBytes / rawBytes)) * 100) : 0;
    const avgLen = rawBytes > 0 ? (payloadBits / rawBytes) : 0;
    const red = Math.max(0, avgLen - H);

    return {
      rawBytes, rawBits, entropy: H,
      compressedBytes: compBytes, compressedBits: compBits,
      compressionRatio: ratio, spaceSavings: savings,
      avgLength: avgLen, redundancy: red, kraftSum: kSum
    };
  }, [inputText, canonicalCodes, rawBytesArray, compressedBytesArray]);

  // ----------------------------------------------------
  // Bitstream Walker Handler
  // ----------------------------------------------------
  const stepBitstream = () => {
    if (!treeRoot || walkerIndex >= bitstream.length) {
      setIsPlaying(false);
      clearInterval(playTimerRef.current);
      return;
    }

    const bit = bitstream[walkerIndex];
    let nextNode = walkerCurrentNodeRef.current;

    if (!nextNode) nextNode = treeRoot;
    nextNode = (bit === '0') ? nextNode.left : nextNode.right;

    setWalkerIndex(prev => prev + 1);

    if (nextNode && nextNode.isLeaf()) {
      setDecodedOutput(prev => prev + nextNode.symbol);
      walkerCurrentNodeRef.current = treeRoot;
      setWalkerNodeId(treeRoot.id);
    } else if (nextNode) {
      walkerCurrentNodeRef.current = nextNode;
      setWalkerNodeId(nextNode.id);
    }
  };

  const handleResetWalker = () => {
    setIsPlaying(false);
    clearInterval(playTimerRef.current);
    setWalkerIndex(0);
    setDecodedOutput('');
    walkerCurrentNodeRef.current = treeRoot;
    setWalkerNodeId(treeRoot ? treeRoot.id : null);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      clearInterval(playTimerRef.current);
    } else {
      setIsPlaying(true);
      playTimerRef.current = setInterval(stepBitstream, 350);
    }
  };

  useEffect(() => {
    return () => clearInterval(playTimerRef.current);
  }, []);

  // ----------------------------------------------------
  // SVG Forest Layout for Animated Tree Construction (Phase 2)
  // ----------------------------------------------------
  const { forestLines, forestNodes } = useMemo(() => {
    if (!currentStepObj || !currentStepObj.queue || currentStepObj.queue.length === 0) {
      return { forestLines: [], forestNodes: [] };
    }

    const lines = [];
    const nodes = [];
    const queue = currentStepObj.queue;

    let totalLeaves = 0;
    function countLeaves(n) {
      if (!n) return 0;
      if (n.isLeaf()) return 1;
      return countLeaves(n.left) + countLeaves(n.right);
    }
    queue.forEach(root => { totalLeaves += Math.max(1, countLeaves(root)); });

    const availableWidth = 700;
    const leafSpacing = Math.max(45, Math.min(85, availableWidth / (totalLeaves + 1)));

    let currentX = 50;

    queue.forEach(root => {
      const rootCopy = root.clone();
      let nextX = { val: currentX };

      function layout(n, depth = 0) {
        if (!n) return;
        if (n.left) layout(n.left, depth + 1);
        n.y = 55 + depth * 70;
        if (n.isLeaf()) {
          n.x = nextX.val;
          nextX.val += leafSpacing;
        } else {
          if (n.left && n.right) {
            n.x = (n.left.x + n.right.x) / 2;
          } else if (n.left) {
            n.x = n.left.x + 30;
          } else if (n.right) {
            n.x = n.right.x - 30;
          } else {
            n.x = nextX.val;
            nextX.val += leafSpacing;
          }
        }
        if (n.right) layout(n.right, depth + 1);
      }

      layout(rootCopy, 0);
      currentX = nextX.val + 24;

      function collect(n) {
        if (!n) return;
        const isNewBranch = currentStepObj.mergingIds.includes(n.id);
        if (n.left) {
          lines.push({
            x1: n.x, y1: n.y,
            x2: n.left.x, y2: n.left.y,
            label: '0', color: '#4facfe',
            id: `${n.id}-l`,
            isNew: isNewBranch
          });
          collect(n.left);
        }
        if (n.right) {
          lines.push({
            x1: n.x, y1: n.y,
            x2: n.right.x, y2: n.right.y,
            label: '1', color: '#a855f7',
            id: `${n.id}-r`,
            isNew: isNewBranch
          });
          collect(n.right);
        }
        nodes.push({
          ...n,
          isNew: isNewBranch && !n.isLeaf(),
          isJustMerged: currentStepObj.mergingIds.includes(n.id)
        });
      }

      collect(rootCopy);
    });

    return { forestLines: lines, forestNodes: nodes };
  }, [currentStepObj]);

  function chunkBytes(bytes) {
    const rows = [];
    for (let i = 0; i < bytes.length; i += 16) {
      rows.push({
        offset: i.toString(16).padStart(4, '0').toUpperCase(),
        bytes: bytes.slice(i, i + 16),
        startIndex: i
      });
    }
    return rows;
  }

  const activeSections = useMemo(() => {
    if (filterCategory === 'all') return SECTIONS_CONFIG;
    return SECTIONS_CONFIG.filter(s => s.id === filterCategory);
  }, [filterCategory]);

  return (
    <div>
      {/* Persistent Single-Page Top Navigation Bar */}
      <header className="app-topbar">
        <div className="topbar-brand" onClick={() => navigateTo('matrix')}>
          <div className="topbar-icon">
            <Network size={22} />
          </div>
          <div>
            <h1 className="topbar-title">CompressLab</h1>
            <span className="topbar-subtitle">Unified Single-Page Algorithm Studio</span>
          </div>
        </div>

        {/* Global Clean Redirect */}
        <div className="topbar-actions">
          {currentView !== 'matrix' ? (
            <button className="studio-breadcrumb" onClick={() => navigateTo('matrix')} style={{ margin: 0 }}>
              <ArrowLeft size={16} /> All Algorithms Matrix
            </button>
          ) : (
            <div className="filter-pills">
              <button 
                className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
                onClick={() => setFilterCategory('all')}>
                All ({ALGORITHMS_CATALOG.length})
              </button>
              {SECTIONS_CONFIG.map(sec => {
                const count = ALGORITHMS_CATALOG.filter(a => a.section === sec.id).length;
                return (
                  <button 
                    key={sec.id}
                    className={`filter-btn ${filterCategory === sec.id ? 'active' : ''}`}
                    onClick={() => setFilterCategory(sec.id)}>
                    {sec.shortName} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          VIEW 1: FRONT PAGE DATA MATRIX CARDS (5 ARCHITECTURAL TIERS)
          ========================================================================= */}
      {currentView === 'matrix' && (
        <div className="matrix-dashboard">
          <div className="matrix-hero">
            <h2 className="matrix-hero-title">
              Compression Algorithms <span>Architectural Landscape & Practice Lab</span>
            </h2>
            <p className="matrix-hero-desc">
              Master the full data compression continuum across 5 foundational layers: from basic redundancy pruning 
              to fractional entropy, modern compound pipelines, perceptual frequency transforms, and next-gen video codecs.
              Click any active studio to enter its interactive workspace.
            </p>
          </div>

          <div className="matrix-grid-container">
            {activeSections.map((sec, secIdx) => {
              const secAlgos = ALGORITHMS_CATALOG.filter(a => a.section === sec.id);
              if (secAlgos.length === 0) return null;
              const readyCount = secAlgos.filter(a => a.status === 'ready').length;

              return (
                <div key={sec.id} className="section-block" style={{ marginTop: secIdx > 0 && filterCategory === 'all' ? '52px' : '0' }}>
                  <div className="section-heading-wrap">
                    <div className="section-heading-top">
                      <div className="section-heading-title">
                        <span className={`section-heading-badge ${sec.badgeClass}`}>{sec.badgeText}</span>
                        <span>{sec.title}</span>
                      </div>
                      <span className="section-algo-count">
                        {readyCount} Active Studio{readyCount !== 1 ? 's' : ''} • {secAlgos.length} Architectures
                      </span>
                    </div>
                    <p className="section-heading-desc">
                      <strong style={{ color: 'var(--text-primary)' }}>{sec.subtitle}:</strong> {sec.desc}
                    </p>
                  </div>

                  <div className="cards-grid">
                    {secAlgos.map(algo => (
                      <div 
                        key={algo.id} 
                        className={`algo-card ${algo.status === 'ready' ? 'active-lab' : ''} ${algo.status === 'next' ? 'next-in-line' : ''}`}>
                        <div className="card-top">
                          <div className="card-badges-row">
                            <span className="algo-type-tag">{algo.type}</span>
                            <span className={`status-chip ${algo.status}`}>
                              {algo.status === 'ready' ? '● Active Studio' : algo.status === 'next' ? '⚡ Next Up' : 'Awaiting Order'}
                            </span>
                          </div>
                          <h3 className="card-title">{algo.name}</h3>
                          <p className="card-desc">{algo.desc}</p>
                          
                          <div className="card-formula-box">
                            <code>{algo.formula}</code>
                          </div>

                          <div className="card-pros-flaws">
                            <div className="pf-row pro">
                              <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span><strong>Pros:</strong> {algo.pros[0]}</span>
                            </div>
                            <div className="pf-row flaw">
                              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span><strong>Flaws:</strong> {algo.flaws[0]}</span>
                            </div>
                          </div>

                          <div className="card-decision-preview">
                            <div className="decision-pill use">
                              <CheckCircle2 size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span><strong>Use for:</strong> {algo.whenToUse}</span>
                            </div>
                            <div className="decision-pill avoid">
                              <XCircle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span><strong>Avoid if:</strong> {algo.whenNotToUse}</span>
                            </div>
                          </div>
                        </div>

                        <div className="card-footer">
                          <div>
                            <div className="ratio-label">Typical Ratio</div>
                            <div className="ratio-val">{algo.ratio}</div>
                          </div>
                          {algo.status === 'ready' ? (
                            <button 
                              className="btn-open-lab" 
                              onClick={() => navigateTo(algo.id)}>
                              Launch Lab <ArrowRight size={14} />
                            </button>
                          ) : algo.status === 'next' ? (
                            <button 
                              className="btn-next" 
                              title="Next algorithm queued in our roadmap">
                              <Zap size={14} /> Next Up
                            </button>
                          ) : (
                            <button className="btn-pending" title="Will be built strictly when you instruct next">
                              Pending Order
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: DEDICATED ALGORITHM STUDIO WITH REAL FILE DATA MATRIX & ANIMATOR
          ========================================================================= */}
      {(currentView === 'huffman' || currentView === 'prefix-tree') && (
        <div className="studio-container">
          <div className="studio-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  className="studio-breadcrumb" 
                  onClick={() => navigateTo('matrix')} 
                  style={{ margin: 0, padding: '4px 10px', fontSize: '0.78rem' }}>
                  <ArrowLeft size={14} /> All Algorithms
                </button>
                <span className="section-heading-badge lossless">
                  {currentView === 'huffman' ? 'ALGORITHM #2: OPTIMAL PREFIX CODE' : 'ALGORITHM #1: FOUNDATION'}
                </span>
              </div>
              <h2 className="matrix-hero-title" style={{ marginTop: '8px', fontSize: '2rem' }}>
                {currentView === 'huffman' ? (
                  <>Canonical Huffman: <span>Animated Tree Builder & Real Data Matrix</span></>
                ) : (
                  <>Binary Prefix Tree: <span>Animated Tree Builder & Real Data Matrix</span></>
                )}
              </h2>
            </div>
            <div className="cxx-badge">
              <span className="cxx-icon">C++20</span>
              <span>{currentView === 'huffman' ? 'lossless/huffman/' : 'lossless/prefix_tree/'}</span>
            </div>
          </div>

          {/* =========================================================================
              MULTI-PHASE INTERACTIVE STUDIO: FREQUENCY SCANNER & ANIMATED TREE
              ========================================================================= */}
          <div className="tree-animator-card">
            {/* Phase Navigation Tabs */}
            <div className="anim-phase-nav">
              <button 
                className={`phase-tab-btn ${animPhase === 'freq' ? 'active' : ''}`}
                onClick={() => handleSwitchPhase('freq')}>
                <Sparkles size={16} /> Phase 1: Symbol Gathering & Frequency Table
              </button>
              <button 
                className={`phase-tab-btn ${animPhase === 'tree' ? 'active' : ''}`}
                onClick={() => handleSwitchPhase('tree')}>
                <GitMerge size={16} /> Phase 2: Animated Tree Construction
              </button>
              <button 
                className={`phase-tab-btn ${animPhase === 'codes' ? 'active' : ''}`}
                onClick={() => handleSwitchPhase('codes')}>
                <FileCode size={16} /> Phase 3: Canonical Codebook & Bitstream
              </button>
            </div>

            {/* Input String Selector Bar */}
            <div className="demo-input-bar">
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Input String to Animate:
              </span>
              <input 
                type="text" 
                value={studioInput} 
                onChange={(e) => {
                  stopAutoBuild();
                  const val = e.target.value;
                  setStudioInput(val);
                  setFreqStepIdx(0);
                  setCurrentAnimStepIdx(0);
                }}
                style={{ 
                  width: '200px', 
                  padding: '6px 12px', 
                  background: 'rgba(0,0,0,0.5)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '6px', 
                  color: '#fff', 
                  fontFamily: 'var(--font-mono)', 
                  fontWeight: 700 
                }} 
              />
              <div className="demo-preset-pills">
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Presets:</span>
                {['ABRACADABRA', 'HUFFMAN', 'BANANA', 'MISSISSIPPI'].map((preset) => (
                  <button 
                    key={preset}
                    className={`preset-chip-btn ${studioInput === preset ? 'active' : ''}`}
                    onClick={() => {
                      stopAutoBuild();
                      setStudioInput(preset);
                      setFreqStepIdx(0);
                      setCurrentAnimStepIdx(0);
                    }}>
                    {preset}
                  </button>
                ))}
                <button 
                  className="preset-chip-btn"
                  title="Use first 24 characters of current document"
                  onClick={() => {
                    stopAutoBuild();
                    const snippet = inputText.slice(0, 24).replace(/\r?\n|\r/g, ' ');
                    setStudioInput(snippet);
                    setFreqStepIdx(0);
                    setCurrentAnimStepIdx(0);
                  }}>
                  Active File Snippet
                </button>
              </div>
            </div>

            {/* Animator Top Controls */}
            <div className="animator-topbar">
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {animPhase === 'freq' ? (
                    <><Sparkles size={18} color="var(--accent-cyan)" /> Step-by-Step Symbol Gathering & Frequency Table</>
                  ) : animPhase === 'tree' ? (
                    <><GitMerge size={18} color="var(--accent-cyan)" /> Animated Min-Heap Tree Construction (Forest Merge)</>
                  ) : (
                    <><FileCode size={18} color="var(--accent-cyan)" /> Canonical Prefix Codebook & Real Bitstream</>
                  )}
                </h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {animPhase === 'freq' 
                    ? 'Watch the scanner read each character, mark it, and gather it into the frequency tally with synchronized voice!'
                    : animPhase === 'tree'
                    ? 'Watch the priority queue extract the 2 lowest weight nodes and animate branch lines into a new parent!'
                    : 'Traverse the provably optimal prefix tree to generate canonical codewords and stream bits.'}
                </span>
              </div>

              <div className="animator-controls-group">
                {/* Voice Narration Toggle */}
                <button 
                  className={`voice-toggle-btn ${voiceEnabled ? 'active' : ''}`}
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    if (!next && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                  }}>
                  {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>Voice Narration: {voiceEnabled ? 'ON' : 'MUTED'}</span>
                  {isSpeaking && (
                    <div className="speech-wave">
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                    </div>
                  )}
                </button>

                {/* Step Navigation Controls */}
                <button className="btn btn-secondary btn-sm" onClick={handleResetAnim} title="Restart to Step 0">
                  <RotateCcw size={14} /> Reset
                </button>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={handlePrevAnimStep} 
                  disabled={animPhase === 'freq' ? freqStepIdx <= 0 : currentAnimStepIdx <= 0} 
                  title="Previous Step">
                  <StepBack size={14} /> Prev
                </button>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleNextAnimStep} 
                  disabled={animPhase === 'freq' ? freqStepIdx >= freqSteps.length - 1 : currentAnimStepIdx >= treeSteps.length - 1} 
                  title="Next Step">
                  <StepForward size={14} /> Step
                </button>
                <button className="btn btn-accent btn-sm" onClick={handleToggleAutoBuild}>
                  {isAutoBuilding ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Auto-Build (Synced Audio)</>}
                </button>
              </div>
            </div>

            {/* Narrative Explanation Banner */}
            <div className="narrative-box">
              <span className="narrative-step-badge">
                {animPhase === 'freq' ? (
                  currentFreqStep?.stepType === 'init' ? 'START' : (currentFreqStep?.stepType === 'complete' ? 'COMPLETE' : `CHAR ${currentFreqStep?.activeCharIdx + 1}/${studioInput.length}`)
                ) : animPhase === 'tree' ? (
                  currentStepObj?.stepNumber === 0 ? 'START' : (currentStepObj?.stepNumber === treeSteps.length - 1 ? 'COMPLETE' : `MERGE ${currentStepObj?.stepNumber}/${treeSteps.length - 2}`)
                ) : (
                  'CODEBOOK'
                )}
              </span>
              <div className="narrative-text">
                <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '4px' }}>
                  {animPhase === 'freq' ? currentFreqStep?.title : (animPhase === 'tree' ? currentStepObj?.title : 'Canonical Codebook Assigned')}
                </strong>
                <span>
                  {animPhase === 'freq' ? currentFreqStep?.narrative : (animPhase === 'tree' ? currentStepObj?.narrative : 'Each leaf node receives an unambiguous variable-length bit prefix code.')}
                </span>
              </div>
            </div>

            {/* PHASE 1: CHARACTER GATHERING & FREQUENCY TABLE SCANNER */}
            {animPhase === 'freq' && (
              <div>
                {/* Scanner Ribbon Tape */}
                <div className="scanner-tape-wrapper">
                  <div className="scanner-tape-header">
                    <h5>
                      <Sparkles size={16} color="var(--accent-cyan)" /> Input Stream Tape (Position 0 to {studioInput.length - 1}):
                    </h5>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                      {currentFreqStep?.scannedCount || 0} of {studioInput.length} symbols gathered
                    </span>
                  </div>
                  <div className="scanner-tape">
                    {studioInput.split('').map((ch, idx) => {
                      const isScanned = idx < (currentFreqStep?.activeCharIdx ?? -1);
                      const isScanning = idx === (currentFreqStep?.activeCharIdx ?? -1);
                      return (
                        <div 
                          key={idx} 
                          className={`scanner-cell ${isScanning ? 'active-scanning' : (isScanned ? 'scanned' : 'pending')}`}>
                          <span className="cell-idx">#{idx}</span>
                          {isScanning && (
                            <>
                              <div className="scanner-cursor-arrow">
                                <ArrowDown size={14} color="var(--accent-cyan)" />
                                <span>SCAN</span>
                              </div>
                              <div className="scanner-drop-token">
                                {ch === ' ' ? '␣' : ch}
                              </div>
                            </>
                          )}
                          <span className="cell-char">{ch === ' ' ? '␣' : ch}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Frequency Distribution Cards */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h5 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    Frequency Distribution Table ({Object.keys(currentFreqStep?.tallies || {}).length} unique characters gathered):
                  </h5>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Occurrences tallied dynamically
                  </span>
                </div>
                <div className="freq-gather-grid">
                  {Object.entries(freqSteps[freqSteps.length - 1]?.tallies || {}).map(([sym, maxCount]) => {
                    const count = currentFreqStep?.tallies[sym] || 0;
                    const isJustUpdated = currentFreqStep?.justUpdatedSym === sym;
                    const maxLen = Math.max(1, studioInput.length);
                    const pct = Math.round((count / maxLen) * 100);
                    return (
                      <div 
                        key={sym} 
                        className={`freq-symbol-card ${isJustUpdated ? 'just-updated' : ''} ${count === 0 ? 'empty-card' : ''}`}>
                        {isJustUpdated && <span className="freq-plus-one">+1</span>}
                        <span className="freq-card-sym">'{sym === ' ' ? '␣' : sym}'</span>
                        <div className="freq-card-tally">
                          <span>wt:</span> <strong>{count}</strong>
                        </div>
                        <div className="freq-card-meter">
                          <div className="freq-card-meter-fill" style={{ width: `${(count / maxCount) * 100}%` }}></div>
                        </div>
                        <span className="freq-card-pct">{pct}% of stream</span>
                      </div>
                    );
                  })}
                </div>

                {/* Completion CTA */}
                {currentFreqStep?.stepType === 'complete' && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        stopAutoBuild();
                        setAnimPhase('tree');
                        setCurrentAnimStepIdx(0);
                        if (treeSteps[0]) speakWithCallback(treeSteps[0].voiceScript);
                      }}>
                      Proceed to Phase 2: Build Tree from Min-Priority Queue <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PHASE 2: ANIMATED TREE CONSTRUCTION */}
            {animPhase === 'tree' && currentStepObj && (
              <div>
                {/* Active Priority Queue Strip */}
                <div className="pq-section">
                  <div className="pq-header">
                    <h5>Active Min-Priority Queue (Sorted by Weight ascending):</h5>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {currentStepObj.queue.length} Nodes in Queue
                    </span>
                  </div>
                  <div className="pq-queue-scroll">
                    {currentStepObj.queue.map((node, i) => {
                      const isLeft = (currentStepObj.stepNumber > 0 && i === 0 && currentStepObj.stepNumber < treeSteps.length - 1);
                      const isRight = (currentStepObj.stepNumber > 0 && i === 1 && currentStepObj.stepNumber < treeSteps.length - 1);
                      return (
                        <div 
                          key={node.id} 
                          className={`pq-chip ${isLeft ? 'merging-left' : (isRight ? 'merging-right' : '')}`}>
                          <span className="pq-chip-sym">{node.isLeaf() ? `'${node.symbol === ' ' ? '␣' : node.symbol}'` : 'Branch'}</span>
                          <span className="pq-chip-wt">wt: {node.weight}</span>
                          {isLeft && <small style={{ color: 'var(--accent-blue)', fontSize: '0.65rem' }}>MIN 1 (0)</small>}
                          {isRight && <small style={{ color: 'var(--accent-violet)', fontSize: '0.65rem' }}>MIN 2 (1)</small>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Animated SVG Tree Viewport */}
                <div className="svg-container" style={{ height: '380px' }}>
                  {forestLines.length > 0 || forestNodes.length > 0 ? (
                    <svg width="100%" height="380" viewBox="0 0 760 380">
                      {forestLines.map((l) => (
                        <g key={`${currentAnimStepIdx}-${l.id}`}>
                          <line 
                            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} 
                            stroke={l.color} 
                            strokeWidth={l.isNew ? "3" : "2"} 
                            opacity={l.isNew ? "1" : "0.75"} 
                            className={l.isNew ? "svg-branch-line" : ""}
                          />
                          <text 
                            x={(l.x1 + l.x2) / 2 + (l.x2 < l.x1 ? -12 : 12)} 
                            y={(l.y1 + l.y2) / 2} 
                            fill={l.color} 
                            fontSize="13" 
                            fontFamily="Fira Code" 
                            fontWeight="700" 
                            textAnchor="middle"
                            className={l.isNew ? "svg-text-fade" : ""}>
                            {l.label}
                          </text>
                        </g>
                      ))}
                      {forestNodes.map((node) => (
                        <g key={`${currentAnimStepIdx}-${node.id}`} className={`tree-node-group ${node.isNew ? 'svg-node-spawn' : ''}`}>
                          <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r={node.isLeaf() ? 22 : 19} 
                            fill={node.isLeaf() ? 'rgba(16, 185, 129, 0.25)' : 'rgba(79, 172, 254, 0.25)'}
                            stroke={node.isJustMerged ? 'var(--accent-cyan)' : (node.isLeaf() ? 'var(--accent-emerald)' : 'var(--accent-blue)')}
                            strokeWidth={node.isJustMerged ? 3.5 : 2}
                            style={{ filter: node.isJustMerged ? 'drop-shadow(0 0 12px var(--accent-cyan))' : 'none' }}
                          />
                          <text 
                            x={node.x} 
                            y={node.y + (node.isLeaf() ? -2 : 4)} 
                            fill="#fff" 
                            fontSize={node.isLeaf() ? 14 : 11} 
                            fontFamily="Outfit" 
                            fontWeight="700" 
                            textAnchor="middle">
                            {node.isLeaf() ? (node.symbol === ' ' ? '␣' : node.symbol) : node.weight}
                          </text>
                          {node.isLeaf() && (
                            <text 
                              x={node.x} 
                              y={node.y + 13} 
                              fill="var(--accent-emerald)" 
                              fontSize="10" 
                              fontFamily="Fira Code" 
                              textAnchor="middle">
                              wt:{node.weight}
                            </text>
                          )}
                        </g>
                      ))}
                    </svg>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Loading tree animation...
                    </div>
                  )}
                </div>

                {/* Completion CTA */}
                {currentStepObj.stepNumber === treeSteps.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                    <button 
                      className="btn btn-accent"
                      onClick={() => {
                        stopAutoBuild();
                        setAnimPhase('codes');
                      }}>
                      View Canonical Codes & Bitstream <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PHASE 3: CANONICAL CODES & BITSTREAM */}
            {animPhase === 'codes' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
                  {/* Canonical Codes Table */}
                  <div className="card" style={{ background: 'rgba(0,0,0,0.4)', padding: '16px' }}>
                    <h5 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                      Extracted Canonical Prefix Codes:
                    </h5>
                    <div className="table-container" style={{ maxHeight: '240px' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Symbol</th>
                            <th>Length</th>
                            <th>Codeword</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(studioCanonicalCodes).map(([sym, code]) => (
                            <tr key={sym}>
                              <td><code className="math-code">'{sym === ' ' ? '␣' : sym}'</code></td>
                              <td>{code.length} bits</td>
                              <td><strong style={{ color: 'var(--accent-cyan)' }}>{code}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Compressed Bitstream Output */}
                  <div className="card" style={{ background: 'rgba(0,0,0,0.4)', padding: '16px' }}>
                    <h5 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                      Encoded Output Bitstream ({studioBitstream.length} bits):
                    </h5>
                    <div className="bit-tape" style={{ minHeight: '60px', maxHeight: '180px', overflowY: 'auto' }}>
                      {studioBitstream.split('').map((bit, idx) => (
                        <span key={idx} className="bit-chip">
                          {bit}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Original: {studioInput.length * 8} bits | Compressed: {studioBitstream.length} bits | Space Saved: {studioInput.length > 0 ? ((1 - studioBitstream.length / (studioInput.length * 8)) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', gap: '12px' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      stopAutoBuild();
                      setAnimPhase('freq');
                      setFreqStepIdx(0);
                    }}>
                    <RotateCcw size={14} /> Restart from Phase 1
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      stopAutoBuild();
                      setAnimPhase('tree');
                      setCurrentAnimStepIdx(0);
                    }}>
                    <GitMerge size={14} /> Review Tree Construction
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Framing Standard Card */}
          <div style={{ background: 'rgba(79, 172, 254, 0.06)', border: '1px solid rgba(79, 172, 254, 0.2)', padding: '10px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
            <Info size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Storage Framing Standard:</strong> The file header stores the 32-bit original size (<code className="math-code">{metrics.rawBytes} bytes</code>). The decoder hard-stops after reading exactly {metrics.rawBytes} symbols, completely bypassing trailing bit padding.
            </span>
          </div>

          {/* ================= Real File Format Switcher ================= */}
          <div className="real-matrix-wrapper">
            <div className="matrix-view-tabs">
              <button 
                className={`matrix-tab-btn ${selectedFileType === 'txt' ? 'active' : ''}`}
                onClick={() => handleSelectFilePreset('txt')}>
                <FileText size={16} /> document.txt (Text File)
              </button>
              <button 
                className={`matrix-tab-btn ${selectedFileType === 'pdf' ? 'active' : ''}`}
                onClick={() => handleSelectFilePreset('pdf')}>
                <FileCode size={16} color="var(--accent-rose)" /> document.pdf (Adobe PDF Stream)
              </button>
              <button 
                className={`matrix-tab-btn ${selectedFileType === 'log' ? 'active' : ''}`}
                onClick={() => handleSelectFilePreset('log')}>
                <Cpu size={16} color="var(--accent-amber)" /> server_access.log (Web Server Log)
              </button>
              <button 
                className={`matrix-tab-btn ${selectedFileType === 'custom' ? 'active' : ''}`}
                onClick={() => setSelectedFileType('custom')}>
                <Code2 size={16} /> Custom Editable Buffer
              </button>
            </div>

            {/* Custom Input Editor if selected */}
            {selectedFileType === 'custom' && (
              <div className="controls-panel" style={{ marginBottom: '16px' }}>
                <div className="input-group" style={{ width: '100%' }}>
                  <label>Edit Raw Buffer Content:</label>
                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)}
                    style={{ width: '100%', maxWidth: 'none' }}
                  />
                </div>
              </div>
            )}

            {/* =========================================================================
                THE REAL DATA MATRIX: SIDE-BY-SIDE 16-BYTE HEX & BYTE MEMORY DUMP
                ========================================================================= */}
            <div className="real-matrix-grid">
              {/* MATRIX 1: BEFORE COMPRESSION */}
              <div className="matrix-file-card before">
                <div className="matrix-file-header">
                  <div className="file-identity">
                    <span className={`file-tag ${selectedFileType}`}>{selectedFileType}</span>
                    <span className="matrix-file-name">
                      {selectedFileType === 'custom' ? 'input_buffer.raw' : REAL_FILE_PRESETS[selectedFileType].name}
                    </span>
                  </div>
                  <span className="matrix-file-size">
                    {metrics.rawBytes} Bytes ({metrics.rawBits} bits)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Raw Uncompressed Byte Matrix</span>
                  <span>Entropy H: <strong style={{ color: 'var(--accent-amber)' }}>{metrics.entropy.toFixed(3)} b/s</strong></span>
                </div>

                {/* 16-Byte Hex Dump Table */}
                <table className="hex-dump-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Offset</th>
                      <th>00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</th>
                      <th style={{ width: '120px' }}>ASCII Glyph</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunkBytes(rawBytesArray).map((row) => (
                      <tr key={row.offset}>
                        <td className="hex-offset">0x{row.offset}</td>
                        <td className="hex-bytes">
                          {row.bytes.map((byteVal, colIdx) => (
                            <span 
                              key={colIdx} 
                              className="hex-byte-val"
                              onMouseEnter={() => setHoveredByteInfo({
                                type: 'Raw Byte',
                                offset: row.startIndex + colIdx,
                                hex: byteVal.toString(16).padStart(2, '0').toUpperCase(),
                                char: (byteVal >= 32 && byteVal <= 126) ? String.fromCharCode(byteVal) : '.',
                                bin: byteVal.toString(2).padStart(8, '0'),
                                code: canonicalCodes[String.fromCharCode(byteVal)] || 'N/A'
                              })}
                              onMouseLeave={() => setHoveredByteInfo(null)}>
                              {byteVal.toString(16).padStart(2, '0').toUpperCase()}
                            </span>
                          ))}
                        </td>
                        <td className="hex-ascii">
                          {row.bytes.map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MATRIX 2: AFTER COMPRESSION (BINARY FILE FORMAT) */}
              <div className="matrix-file-card after">
                <div className="matrix-file-header">
                  <div className="file-identity">
                    <span className="file-tag bin">HUFF</span>
                    <span className="matrix-file-name">
                      {selectedFileType === 'custom' ? 'compressed.huff' : REAL_FILE_PRESETS[selectedFileType].name.replace(/\.[^/.]+$/, "") + ".huff"}
                    </span>
                  </div>
                  <span className="matrix-file-size" style={{ color: 'var(--accent-emerald)' }}>
                    {metrics.compressedBytes} Bytes ({metrics.compressedBits} bits)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Compressed Binary Byte Matrix</span>
                  <span>Ratio: <strong style={{ color: 'var(--accent-emerald)' }}>{metrics.compressionRatio.toFixed(2)}:1 ({metrics.spaceSavings.toFixed(1)}% savings)</strong></span>
                </div>

                {/* 16-Byte Hex Dump Table */}
                <table className="hex-dump-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Offset</th>
                      <th>00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F</th>
                      <th style={{ width: '120px' }}>Binary Layout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunkBytes(compressedBytesArray).map((row) => (
                      <tr key={row.offset}>
                        <td className="hex-offset">0x{row.offset}</td>
                        <td className="hex-bytes">
                          {row.bytes.map((byteVal, colIdx) => {
                            const globalIdx = row.startIndex + colIdx;
                            const category = compressedByteBreakdown[globalIdx] || 'payload';
                            return (
                              <span 
                                key={colIdx} 
                                className={`hex-byte-val ${category}`}
                                onMouseEnter={() => setHoveredByteInfo({
                                  type: `Compressed Byte (${category.toUpperCase()})`,
                                  offset: globalIdx,
                                  hex: byteVal.toString(16).padStart(2, '0').toUpperCase(),
                                  bin: byteVal.toString(2).padStart(8, '0'),
                                  desc: category === 'magic' ? 'Magic File Signature (HUFF)' : (category === 'header' ? 'File Header / Code Lengths' : 'Packed Bitstream Payload')
                                })}
                                onMouseLeave={() => setHoveredByteInfo(null)}>
                                {byteVal.toString(16).padStart(2, '0').toUpperCase()}
                              </span>
                            );
                          })}
                        </td>
                        <td className="hex-ascii" style={{ color: 'var(--accent-emerald)' }}>
                          {row.bytes.map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Matrix Byte Legend */}
                <div className="matrix-legend">
                  <div className="matrix-legend-item">
                    <span className="matrix-legend-dot" style={{ background: 'rgba(168, 85, 247, 0.6)' }}></span>
                    <span>Magic "HUFF" (4B)</span>
                  </div>
                  <div className="matrix-legend-item">
                    <span className="matrix-legend-dot" style={{ background: 'rgba(245, 158, 11, 0.6)' }}></span>
                    <span>Header / Lengths Table</span>
                  </div>
                  <div className="matrix-legend-item">
                    <span className="matrix-legend-dot" style={{ background: 'rgba(16, 185, 129, 0.6)' }}></span>
                    <span>Bitstream Payload</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Hovered Byte Inspector Bar */}
            {hoveredByteInfo && (
              <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-cyan)', padding: '10px 16px', borderRadius: '8px', display: 'flex', gap: '20px', alignItems: 'center', fontFamily: 'Fira Code', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}><Eye size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }}/> {hoveredByteInfo.type}</div>
                <div>Offset: <strong style={{ color: '#fff' }}>0x{hoveredByteInfo.offset.toString(16).toUpperCase()}</strong> ({hoveredByteInfo.offset})</div>
                <div>Hex: <strong style={{ color: 'var(--accent-amber)' }}>0x{hoveredByteInfo.hex}</strong></div>
                <div>Binary: <strong style={{ color: 'var(--accent-emerald)' }}>{hoveredByteInfo.bin}</strong></div>
                {hoveredByteInfo.char && <div>Glyph: <strong style={{ color: '#fff' }}>'{hoveredByteInfo.char}'</strong></div>}
                {hoveredByteInfo.code && <div>Huffman Codeword: <strong style={{ color: 'var(--accent-cyan)' }}>{hoveredByteInfo.code}</strong></div>}
                {hoveredByteInfo.desc && <div>Role: <strong style={{ color: 'var(--accent-violet)' }}>{hoveredByteInfo.desc}</strong></div>}
              </div>
            )}
          </div>

          {/* Efficiency & Redundancy Bar */}
          <div className="card kraft-card">
            <div className="card-header">
              <h4>Shannon Source Coding Bound & Space Efficiency</h4>
              <span className="kraft-status-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                Compression Ratio: {metrics.compressionRatio.toFixed(2)}:1 ({metrics.spaceSavings.toFixed(1)}% File Size Reduction)
              </span>
            </div>
            <div className="kraft-meter-container">
              <div className="kraft-meter-bar">
                <div className="kraft-meter-fill" style={{ 
                  width: `${Math.min(100, (metrics.entropy / (metrics.avgLength || 1)) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-emerald))'
                }}></div>
              </div>
              <div className="kraft-meter-ticks">
                <span>Entropy H(X): {metrics.entropy.toFixed(3)} b/s</span>
                <span className="tick-optimal">Theoretical Redundancy: +{metrics.redundancy.toFixed(3)} b/s (Shannon Excess)</span>
                <span>Kraft Sum K: {metrics.kraftSum.toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* Canonical Codebook & Walker Side Panel */}
          <div className="workspace-grid">
            <div className="card">
              <div className="card-header">
                <h4>Canonical Codebook Table (Lexicographically Ordered)</h4>
              </div>
              <div className="table-container" style={{ maxHeight: '300px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sym</th>
                      <th>Freq</th>
                      <th>Length</th>
                      <th>Canonical Bit Code</th>
                      <th>Hex</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(canonicalCodes)
                      .sort((a, b) => a[1].length - b[1].length || a[0].localeCompare(b[0]))
                      .slice(0, 15)
                      .map(([sym, code]) => {
                        const count = inputText.split('').filter(c => c === sym).length;
                        const hex = parseInt(code, 2).toString(16).toUpperCase();
                        const displaySym = sym === '\n' ? '\\n' : (sym === ' ' ? '␣' : sym);
                        return (
                          <tr key={sym}>
                            <td><strong>'{displaySym}'</strong></td>
                            <td>{count}</td>
                            <td>{code.length}</td>
                            <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{code}</td>
                            <td style={{ color: 'var(--text-muted)' }}>0x{hex}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Instantaneous Bitstream Walker */}
            <div className="card">
              <div className="card-header">
                <h4>Instantaneous Bitstream Walker</h4>
                <div className="walker-actions">
                  <button className="btn btn-secondary btn-sm" onClick={handleResetWalker}><RotateCcw size={14}/> Reset</button>
                  <button className="btn btn-primary btn-sm" onClick={stepBitstream}><StepForward size={14}/> Step 1 Bit</button>
                  <button className="btn btn-accent btn-sm" onClick={handleTogglePlay}>
                    {isPlaying ? <><Pause size={14}/> Pause</> : <><Play size={14}/> Play</>}
                  </button>
                </div>
              </div>
              <div className="bit-tape">
                {bitstream.slice(0, 120).split('').map((bit, idx) => (
                  <span 
                    key={idx} 
                    className={`bit-chip ${idx < walkerIndex ? 'consumed' : ''} ${idx === walkerIndex ? 'active' : ''}`}>
                    {bit}
                  </span>
                ))}
                {bitstream.length > 120 && <span style={{ color: 'var(--text-muted)' }}>... (+{bitstream.length - 120} bits)</span>}
              </div>
              <div className="decoded-tape">
                <span className="tape-label">Decoded Stream:</span>
                <span className="tape-text">{decodedOutput.slice(-30)}</span>
              </div>
            </div>
          </div>

          {/* ==================== MATHEMATICAL SIZE REDUCTION BREAKDOWN (BEFORE vs. AFTER) ==================== */}
          {(() => {
            const rawBytes = inputText.length;
            const rawBits = rawBytes * 8;
            const uniqueSymbolsCount = Object.keys(codeLengths).length;
            const headerBytes = Math.min(64, uniqueSymbolsCount * 2);
            const compBitstreamBits = bitstream.length;
            const totalCompBits = headerBytes * 8 + compBitstreamBits;
            const totalCompBytes = headerBytes + Math.ceil(compBitstreamBits / 8);
            const deltaBits = rawBits - totalCompBits;
            const savingsPercent = rawBits > 0 ? ((deltaBits / rawBits) * 100).toFixed(1) : 0;
            const ratio = totalCompBytes > 0 ? (rawBytes / totalCompBytes).toFixed(2) : '1.00';
            const avgBitsPerSym = rawBytes > 0 ? (compBitstreamBits / rawBytes).toFixed(2) : 0;

            return (
              <div className="size-reduction-calculator-card">
                <div className="calc-header">
                  <div className="calc-title">
                    <TrendingDown size={22} color="var(--accent-cyan)" />
                    <span>Mathematical Size Reduction Breakdown: Before vs. After Compression</span>
                  </div>
                  <span className="algo-type-tag" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                    Exact Bit-Level Equation
                  </span>
                </div>

                {/* Main Equation Banner */}
                <div className="math-equation-banner">
                  <div className="math-eq-item">
                    <span className="math-eq-label">Before Compression</span>
                    <span className="math-eq-val before">{rawBits} bits</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({rawBytes} Bytes @ 8b/char)</span>
                  </div>

                  <span className="math-operator">→</span>

                  <div className="math-eq-item">
                    <span className="math-eq-label">After Compression</span>
                    <span className="math-eq-val after">{totalCompBits} bits</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({totalCompBytes} Bytes total)</span>
                  </div>

                  <span className="math-operator">=</span>

                  <div className="math-eq-item">
                    <span className="math-eq-label">Exact Reduction (Delta)</span>
                    <span className="math-eq-val delta" style={{ color: deltaBits >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)' }}>
                      {deltaBits >= 0 ? `-${deltaBits} bits` : `+${Math.abs(deltaBits)} bits`}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({savingsPercent}% size reduction)
                    </span>
                  </div>

                  <span className="math-operator">|</span>

                  <div className="math-eq-item">
                    <span className="math-eq-label">Compression Factor</span>
                    <span className="math-eq-val ratio">{ratio} : 1</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>density multiplier</span>
                  </div>
                </div>

                {/* 3-Column Detailed Mathematical Audit */}
                <div className="reduction-three-col-grid">
                  {/* Column 1: Before */}
                  <div className="reduction-col-card before">
                    <div className="reduction-col-title">
                      <FileText size={18} />
                      <span>1. What Existed Before (Raw)</span>
                    </div>
                    <ul className="reduction-detail-list">
                      <li>
                        <span>Uncompressed Symbols:</span>
                        <strong>{rawBytes} chars</strong>
                      </li>
                      <li>
                        <span>Fixed Character Width:</span>
                        <strong>8 bits / symbol</strong>
                      </li>
                      <li>
                        <span>Raw Bitstream Formula:</span>
                        <strong>N × 8 = {rawBits} bits</strong>
                      </li>
                      <li>
                        <span>Shannon Entropy Bound:</span>
                        <strong>{calculateEntropy(inputText).toFixed(3)} bits / symbol</strong>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: Reduction Mechanism */}
                  <div className="reduction-col-card mechanism">
                    <div className="reduction-col-title">
                      <Zap size={18} />
                      <span>2. How It Reduced Size</span>
                    </div>
                    <ul className="reduction-detail-list">
                      <li>
                        <span>Variable Code Assignment:</span>
                        <strong>Frequent chars → 1-3 bits</strong>
                      </li>
                      <li>
                        <span>Average Compressed Width:</span>
                        <strong>{avgBitsPerSym} bits / symbol</strong>
                      </li>
                      <li>
                        <span>Bit Savings on Payload:</span>
                        <strong>{rawBits - compBitstreamBits} bits saved</strong>
                      </li>
                      <li>
                        <span>Header Transmit Cost:</span>
                        <strong>+{headerBytes * 8} bits (lengths)</strong>
                      </li>
                    </ul>
                  </div>

                  {/* Column 3: After */}
                  <div className="reduction-col-card after">
                    <div className="reduction-col-title">
                      <CheckCircle2 size={18} />
                      <span>3. What Replaces It (After)</span>
                    </div>
                    <ul className="reduction-detail-list">
                      <li>
                        <span>Canonical Header Size:</span>
                        <strong>{headerBytes} Bytes ({headerBytes * 8} bits)</strong>
                      </li>
                      <li>
                        <span>Packed Prefix Bitstream:</span>
                        <strong>{compBitstreamBits} bits</strong>
                      </li>
                      <li>
                        <span>Total Transmitted File:</span>
                        <strong>{totalCompBytes} Bytes ({totalCompBits} bits)</strong>
                      </li>
                      <li>
                        <span>Net Space Reduction:</span>
                        <strong style={{ color: deltaBits >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {savingsPercent}%
                        </strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==================== PROS, FLAWS & GOTCHAS DEEP ANALYSIS ==================== */}
          <div className="pros-flaws-deep-grid">
            <div className="pf-deep-card pros">
              <h4><ShieldCheck size={20} /> Architectural Strengths & Pros of Huffman</h4>
              <ul className="pf-deep-list">
                <li>
                  <span><strong>Provable Optimality:</strong> Huffman proved that bottom-up greedy merging guarantees the absolute minimum expected length L̄ for any symbol-by-symbol prefix code.</span>
                </li>
                <li>
                  <span><strong>Canonical Representation:</strong> Eliminates tree pointers entirely! Standard systems (DEFLATE, GZIP, PNG, JPEG) transmit only the list of code lengths, requiring ~320 bytes total.</span>
                </li>
                <li>
                  <span><strong>Blazing Fast Table-Driven Decoding:</strong> Because canonical codes of the same length are consecutive integers, decoders use flat direct lookup arrays instead of slow pointer chasing.</span>
                </li>
                <li>
                  <span><strong>Universal Industry Standard:</strong> Serves as the primary entropy backend in DEFLATE (ZIP, GZIP), JPEG, MP3, and Brotli.</span>
                </li>
              </ul>
            </div>

            <div className="pf-deep-card flaws">
              <h4><AlertTriangle size={20} /> Engineering Flaws, Gotchas & Limitations</h4>
              <ul className="pf-deep-list">
                <li>
                  <span><strong>The 1-Bit Integer Quantization Barrier:</strong> Every symbol must be assigned an integer number of bits (≥ 1). If a symbol occurs 95% of the time, its ideal information content is 0.074 bits, but Huffman must give it 1 full bit (+92% redundancy waste!).</span>
                </li>
                <li>
                  <span><strong>Two-Pass Requirement:</strong> Must scan the input stream once to build frequency counts and again to encode bits. In streaming network pipelines, this requires chunking or fixed pre-defined tables.</span>
                </li>
                <li>
                  <span><strong>Single-Bit Propagation Catastrophe:</strong> Like all variable-length codes, a single bit flip corrupts symbol boundaries, scrambling all subsequent data in the block.</span>
                </li>
                <li>
                  <span><strong>Beaten by Arithmetic Coding & ANS:</strong> For highly skewed probability distributions, modern algorithms like rANS (used in Zstandard) compress significantly tighter than Huffman.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ==================== ARCHITECTURAL DECISION GUIDE: WHEN TO USE vs. WHEN NOT TO USE ==================== */}
          <div className="decision-guide-card">
            <div className="decision-guide-header">
              <div className="decision-guide-title">
                <Zap size={22} color="var(--accent-cyan)" />
                <span>Production Architecture Guide: When to Use vs. When NOT to Use</span>
              </div>
              <span className="algo-type-tag" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.3)' }}>
                {currentView === 'huffman' ? 'Canonical Huffman Matrix' : 'Binary Prefix Tree Matrix'}
              </span>
            </div>

            <div className="decision-guide-grid">
              {/* When to Use Column */}
              <div className="decision-col when-to-use">
                <div className="decision-col-header">
                  <CheckCircle2 size={20} />
                  <span>When to Use This Algorithm</span>
                </div>
                <ul className="decision-items-list">
                  {currentView === 'huffman' ? (
                    <>
                      <li className="decision-item">
                        <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                        <div>
                          <strong>Compound Multi-Stage Pipelines:</strong> Ideal as the final entropy stage in DEFLATE (ZIP, GZIP), PNG, and JPEG after LZ77 or DCT has concentrated probability into symbols.
                        </div>
                      </li>
                      <li className="decision-item">
                        <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                        <div>
                          <strong>Moderate Probability Distributions (5% to 50%):</strong> Excels when symbol probabilities are dispersed across an alphabet and no single symbol dominates over 50% of the stream.
                        </div>
                      </li>
                      <li className="decision-item">
                        <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                        <div>
                          <strong>Embedded Systems & Low-RAM Decompression:</strong> Canonical Huffman table decoding requires only a few hundred bytes of RAM and fast direct array indexing without floating-point math.
                        </div>
                      </li>
                      <li className="decision-item">
                        <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                        <div>
                          <strong>100% Open, Royalty-Free Standards:</strong> Free from arithmetic coding patent entanglements; supported natively in virtually every programming language runtime.
                        </div>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="decision-item">
                        <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                        <div>
                          <strong>Streaming Delimiter-Free Tokenization:</strong> Essential when designing streaming protocols (like UTF-8 byte sequences or Protobuf varints) requiring instant prefix parsing without lookahead.
                        </div>
                      </li>
                      <li className="decision-item">
                        <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                        <div>
                          <strong>Codebook Validation via Kraft Inequality:</strong> Proves whether any proposed set of codeword lengths can be uniquely and instantaneously decoded before writing transmission logic.
                        </div>
                      </li>
                      <li className="decision-item">
                        <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                        <div>
                          <strong>Deterministic O(L) Decoding Latency:</strong> Guarantees bit-by-bit tree descent bounded strictly by maximum code length L, independent of corpus size.
                        </div>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* When NOT to Use Column */}
              <div className="decision-col when-not-to-use">
                <div className="decision-col-header">
                  <XCircle size={20} />
                  <span>When NOT to Use It & Alternatives</span>
                </div>
                <ul className="decision-items-list">
                  {currentView === 'huffman' ? (
                    <>
                      <li className="decision-item">
                        <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                        <div>
                          <strong>Highly Skewed Data (p &gt; 50% or p → 99%):</strong> 
                          The 1-bit integer quantization barrier forces at least 1 full bit per symbol. A 95% frequent symbol needs only 0.074 bits of entropy—Huffman wastes 13× excess bandwidth!
                          <div style={{ marginTop: '4px' }}>
                            <span className="badge-alt">Use Instead:</span> <strong>tANS / rANS</strong> (Zstandard) or <strong>Arithmetic Coding / CABAC</strong> for fractional-bit coding.
                          </div>
                        </div>
                      </li>
                      <li className="decision-item">
                        <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                        <div>
                          <strong>Micro-Payloads and Small Files (&lt; 500 Bytes):</strong>
                          Transmitting the canonical code length header (~30–320 bytes) exceeds the bit savings, causing negative compression (expansion).
                          <div style={{ marginTop: '4px' }}>
                            <span className="badge-alt">Use Instead:</span> Static pre-agreed codebooks, fixed Huffman tables (Brotli static dictionary), or raw storage.
                          </div>
                        </div>
                      </li>
                      <li className="decision-item">
                        <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                        <div>
                          <strong>High-Throughput Multi-Gigabyte In-Memory Engines:</strong>
                          Bitwise variable-length serial packing causes CPU branch stalls, limiting single-core throughput to ~300 MB/s.
                          <div style={{ marginTop: '4px' }}>
                            <span className="badge-alt">Use Instead:</span> <strong>Snappy</strong>, <strong>LZ4</strong>, or <strong>Zstd</strong> for multiple GB/s throughput.
                          </div>
                        </div>
                      </li>
                      <li className="decision-item">
                        <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                        <div>
                          <strong>Data with Long Repeating Strings or Patterns:</strong>
                          Huffman encodes memoryless single symbols; it cannot recognize multi-byte repetitions like <code>SELECT * FROM</code>.
                          <div style={{ marginTop: '4px' }}>
                            <span className="badge-alt">Use Instead:</span> Always precede Huffman with <strong>LZ77</strong> dictionary sliding window or <strong>BWT</strong>.
                          </div>
                        </div>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="decision-item">
                        <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                        <div>
                          <strong>Large In-Memory Pointer Trees in Production:</strong>
                          Allocating heap nodes with left/right pointers causes high pointer bloat (16–32 bytes per node) and devastating CPU cache misses during tree traversal.
                          <div style={{ marginTop: '4px' }}>
                            <span className="badge-alt">Use Instead:</span> <strong>Canonical Huffman lookup tables</strong> (flat array indices with zero heap pointers).
                          </div>
                        </div>
                      </li>
                      <li className="decision-item">
                        <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                        <div>
                          <strong>Continuous / Analog Signals (Audio, Video, Photos):</strong>
                          Prefix trees cannot compress smooth continuous waveforms without prior frequency transformation and quantization.
                          <div style={{ marginTop: '4px' }}>
                            <span className="badge-alt">Use Instead:</span> <strong>DCT (JPEG/MP3)</strong>, <strong>DWT (JPEG 2000)</strong>, or <strong>ADPCM</strong>.
                          </div>
                        </div>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: DEDICATED LZ77 SLIDING WINDOW STUDIO WITH REAL DATA MATRIX & ANIMATOR
          ========================================================================= */}
      {currentView === 'lz77' && (
        <div className="studio-container">
          <div className="studio-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  className="studio-breadcrumb" 
                  onClick={() => navigateTo('matrix')} 
                  style={{ margin: 0, padding: '4px 10px', fontSize: '0.78rem' }}>
                  <ArrowLeft size={14} /> All Algorithms
                </button>
                <span className="section-heading-badge lossless">
                  ALGORITHM #7: SLIDING WINDOW DICTIONARY
                </span>
              </div>
              <h2 className="matrix-hero-title" style={{ marginTop: '8px', fontSize: '2rem' }}>
                LZ77 (Lempel-Ziv 1977): <span>Animated Sliding Window & Real Data Matrix</span>
              </h2>
            </div>
            <div className="cxx-badge">
              <span className="cxx-icon">C++20</span>
              <span>lossless/lz77/lz77.hpp</span>
            </div>
          </div>

          <div className="tree-animator-card">
            {/* Phase Navigation Tabs */}
            <div className="anim-phase-nav">
              <button 
                className={`phase-tab-btn ${lzAnimPhase === 'scanner' ? 'active' : ''}`}
                onClick={() => setLzAnimPhase('scanner')}>
                <Sparkles size={16} /> Phase 1: Sliding Window Match Scanner
              </button>
              <button 
                className={`phase-tab-btn ${lzAnimPhase === 'recon' ? 'active' : ''}`}
                onClick={() => setLzAnimPhase('recon')}>
                <GitMerge size={16} /> Phase 2: Token Stream & Reconstruction
              </button>
              <button 
                className={`phase-tab-btn ${lzAnimPhase === 'matrix' ? 'active' : ''}`}
                onClick={() => setLzAnimPhase('matrix')}>
                <FileCode size={16} /> Phase 3: Real File Data Matrix (Hex / ASCII / 28-Bit)
              </button>
            </div>

            {/* Presets & Window Parameters Bar */}
            <div className="anim-controls-bar" style={{ flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Presets:</span>
                {Object.entries(LZ77_PRESETS).map(([key, item]) => (
                  <button
                    key={key}
                    className={`chip-btn ${lzPresetKey === key ? 'active' : ''}`}
                    style={lzPresetKey === key ? { background: 'rgba(0, 242, 254, 0.2)', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' } : {}}
                    onClick={() => {
                      setLzPresetKey(key);
                      setLzInput(item.text);
                      setLzStepIdx(0);
                      setLzIsAutoBuilding(false);
                      lzIsAutoBuildingRef.current = false;
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                    }}>
                    {item.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>History Window:</span>
                  <select 
                    value={lzWindowSize} 
                    onChange={e => { setLzWindowSize(Number(e.target.value)); setLzStepIdx(0); }}
                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem' }}>
                    <option value={16}>16 Bytes</option>
                    <option value={32}>32 Bytes</option>
                    <option value={64}>64 Bytes</option>
                    <option value={128}>128 Bytes</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Lookahead:</span>
                  <select 
                    value={lzLookaheadSize} 
                    onChange={e => { setLzLookaheadSize(Number(e.target.value)); setLzStepIdx(0); }}
                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem' }}>
                    <option value={8}>8 Bytes</option>
                    <option value={16}>16 Bytes</option>
                    <option value={32}>32 Bytes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Input Field */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Input Stream:</span>
              <input 
                type="text"
                value={lzInput}
                onChange={e => {
                  setLzPresetKey('custom');
                  setLzInput(e.target.value);
                  setLzStepIdx(0);
                  setLzIsAutoBuilding(false);
                  lzIsAutoBuildingRef.current = false;
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px 12px', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}
              />
            </div>

            {/* Playback Controls & Voice Toolbar */}
            <div className="anim-controls-bar" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className={`btn ${lzIsAutoBuilding ? 'btn-secondary' : 'btn-accent'}`}
                  onClick={handleToggleLzAutoBuild}>
                  {lzIsAutoBuilding ? <Pause size={14} /> : <Play size={14} />}
                  {lzIsAutoBuilding ? 'Pause Auto-Scanner' : 'Auto-Scan with Voice'}
                </button>
                <button 
                  className="btn btn-secondary"
                  disabled={lzStepIdx === 0}
                  onClick={() => handleLzStepChange(lzStepIdx - 1)}>
                  <StepBack size={14} /> Step Back
                </button>
                <button 
                  className="btn btn-primary"
                  disabled={lzStepIdx >= lzSteps.length - 1}
                  onClick={() => handleLzStepChange(lzStepIdx + 1)}>
                  Step Forward <StepForward size={14} />
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setLzStepIdx(0);
                    setLzIsAutoBuilding(false);
                    lzIsAutoBuildingRef.current = false;
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                  }}>
                  <RotateCcw size={14} /> Reset
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  className={`voice-toggle-chip ${lzVoiceEnabled ? 'active' : ''}`}
                  onClick={() => setLzVoiceEnabled(!lzVoiceEnabled)}>
                  {lzVoiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  <span>{lzVoiceEnabled ? 'Voice Narration ON' : 'Voice Narration OFF'}</span>
                </button>
                <span className="step-counter-tag">
                  Token {lzStepIdx + 1} of {lzSteps.length || 1}
                </span>
              </div>
            </div>

            {/* Step Narrative Banner with Step Mathematical Reduction Pill */}
            {lzSteps[lzStepIdx] && (
              <div className="step-narrative-banner" style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div className="step-narrative-title">
                    <Sparkles size={16} color="var(--accent-cyan)" />
                    <span>Step {lzStepIdx + 1}: Longest Match & Step Reduction Calculation</span>
                  </div>
                  <div className="step-reduction-pill">
                    <span className="pill-before">{lzSteps[lzStepIdx].rawBitsThisStep}b raw</span>
                    <span>→</span>
                    <span className="pill-after">28b token</span>
                    <span>=</span>
                    <span className="pill-saved" style={{ color: lzSteps[lzStepIdx].deltaBitsThisStep >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)' }}>
                      {lzSteps[lzStepIdx].deltaBitsThisStep >= 0 ? `-${lzSteps[lzStepIdx].deltaBitsThisStep}b (${lzSteps[lzStepIdx].deltaPercentThisStep}%)` : `+${Math.abs(lzSteps[lzStepIdx].deltaBitsThisStep)}b expanded`}
                    </span>
                  </div>
                </div>
                <p className="step-narrative-text">
                  {lzSteps[lzStepIdx].narrative}
                </p>
              </div>
            )}

            {/* -------------------- PHASE 1: SLIDING WINDOW MATCH SCANNER -------------------- */}
            {lzAnimPhase === 'scanner' && (
              <div className="lz-studio-wrapper" style={{ marginTop: '20px' }}>
                {/* Visual Legend */}
                <div className="lz-legend-row">
                  <div className="lz-legend-chip">
                    <div className="lz-color-box history"></div>
                    <span>Search History Window (d offset zone)</span>
                  </div>
                  <div className="lz-legend-chip">
                    <div className="lz-color-box lookahead"></div>
                    <span>Lookahead Window</span>
                  </div>
                  <div className="lz-legend-chip">
                    <div className="lz-color-box match-source"></div>
                    <span>Matched In History</span>
                  </div>
                  <div className="lz-legend-chip">
                    <div className="lz-color-box match-target"></div>
                    <span>Matched Target</span>
                  </div>
                  <div className="lz-legend-chip">
                    <div className="lz-color-box next-literal"></div>
                    <span>Next Literal (c)</span>
                  </div>
                </div>

                {/* Sliding Tape */}
                <div className="lz-tape-card">
                  <div className="lz-tape-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Eye size={16} color="var(--accent-cyan)" />
                      <strong style={{ fontSize: '0.95rem' }}>Sliding Character Tape & Buffers</strong>
                    </div>
                    {lzSteps[lzStepIdx] && (
                      <div className="lz-window-metrics">
                        <span className="lz-window-metric-tag" style={{ color: 'var(--accent-cyan)' }}>
                          History: [{lzSteps[lzStepIdx].searchStart}..{lzSteps[lzStepIdx].searchEnd >= 0 ? lzSteps[lzStepIdx].searchEnd : 0}]
                        </span>
                        <span className="lz-window-metric-tag" style={{ color: '#c084fc' }}>
                          Cursor: {lzSteps[lzStepIdx].cursor}
                        </span>
                        <span className="lz-window-metric-tag" style={{ color: 'var(--accent-emerald)' }}>
                          Match Len: {lzSteps[lzStepIdx].bestLength}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Match Connection Bridge */}
                  {lzSteps[lzStepIdx] && (
                    lzSteps[lzStepIdx].bestLength > 0 ? (
                      <div className="lz-match-arrow-banner">
                        <div className="match-tag-src">
                          <span>HISTORY MATCH:</span>
                          <code>"{lzInput.substring(lzSteps[lzStepIdx].bestMatchPos, lzSteps[lzStepIdx].bestMatchPos + lzSteps[lzStepIdx].bestLength)}"</code>
                          <span className="pos-badge">indices [{lzSteps[lzStepIdx].bestMatchPos}..{lzSteps[lzStepIdx].bestMatchPos + lzSteps[lzStepIdx].bestLength - 1}]</span>
                        </div>
                        <div className="match-arrow-center">
                          <span className="arrow-dist-badge">◄ Step Back {lzSteps[lzStepIdx].bestDistance} Bytes into History ◄</span>
                        </div>
                        <div className="match-tag-tgt">
                          <span>LOOKAHEAD TARGET:</span>
                          <code>"{lzInput.substring(lzSteps[lzStepIdx].cursor, lzSteps[lzStepIdx].cursor + lzSteps[lzStepIdx].bestLength)}"</code>
                          <span className="pos-badge">indices [{lzSteps[lzStepIdx].cursor}..{lzSteps[lzStepIdx].cursor + lzSteps[lzStepIdx].bestLength - 1}]</span>
                        </div>
                      </div>
                    ) : (
                      <div className="lz-no-match-banner">
                        <Info size={16} color="var(--accent-rose)" />
                        <span>
                          <strong>Literal Token:</strong> Zero matching substring found in the {Math.max(0, lzSteps[lzStepIdx].searchEnd - lzSteps[lzStepIdx].searchStart + 1)}-byte history buffer. Emitting literal character <code>'{lzSteps[lzStepIdx].nextChar === ' ' ? '␣' : lzSteps[lzStepIdx].nextChar}'</code> with backward distance <code>d=0</code>, length <code>l=0</code>.
                        </span>
                      </div>
                    )
                  )}

                  <div className="lz-tape-scroll">
                    {lzInput.split('').map((ch, idx) => {
                      const curStep = lzSteps[lzStepIdx];
                      if (!curStep) return null;

                      const isCursor = idx === curStep.cursor;
                      const inHistory = idx >= curStep.searchStart && idx <= curStep.searchEnd;
                      const inLookahead = idx >= curStep.cursor && idx < curStep.cursor + lzLookaheadSize;
                      
                      const isMatchSource = curStep.bestLength > 0 && 
                                            idx >= curStep.bestMatchPos && 
                                            idx < curStep.bestMatchPos + curStep.bestLength;
                      
                      const isMatchTarget = curStep.bestLength > 0 && 
                                            idx >= curStep.cursor && 
                                            idx < curStep.cursor + curStep.bestLength;
                      
                      const isNextLiteral = idx === curStep.cursor + curStep.bestLength;

                      let cellClass = "lz-cell";
                      if (inHistory) cellClass += " in-history";
                      if (inLookahead) cellClass += " in-lookahead";
                      if (isMatchSource) cellClass += " in-match-src";
                      if (isMatchTarget) cellClass += " in-match-tgt";
                      if (isNextLiteral) cellClass += " in-next-literal";

                      return (
                        <div key={idx} className={cellClass}>
                          {isCursor && <span className="lz-cursor-indicator">CURSOR</span>}
                          <span className="lz-cell-char">{ch === ' ' ? '␣' : ch}</span>
                          <span className="lz-cell-idx">{idx}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Emitted Token Card & History Grid */}
                {lzSteps[lzStepIdx] && (
                  <div className="lz-token-live-card">
                    <div className="lz-triplet-display">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} color="var(--accent-cyan)" />
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
                          Emitted LZ77 Token Triplet: (distance, length, next_char)
                        </h4>
                      </div>

                      <div className="lz-triplet-hero">
                        <div className="lz-pill distance">
                          <span className="lz-pill-label">Distance (d)</span>
                          <span className="lz-pill-val">{lzSteps[lzStepIdx].bestDistance}</span>
                          <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>backward offset</span>
                        </div>

                        <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>,</span>

                        <div className="lz-pill length">
                          <span className="lz-pill-label">Length (l)</span>
                          <span className="lz-pill-val">{lzSteps[lzStepIdx].bestLength}</span>
                          <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>matched bytes</span>
                        </div>

                        <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>,</span>

                        <div className="lz-pill next-lit">
                          <span className="lz-pill-label">Literal (c)</span>
                          <span className="lz-pill-val">
                            {lzSteps[lzStepIdx].nextChar === ' ' ? '␣' : `'${lzSteps[lzStepIdx].nextChar}'`}
                          </span>
                          <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>next uncompressed byte</span>
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {lzSteps[lzStepIdx].bestLength > 0 ? (
                          <>
                            Decoder will copy <strong>{lzSteps[lzStepIdx].bestLength} bytes</strong> starting <strong>{lzSteps[lzStepIdx].bestDistance} positions back</strong> from output end, then append literal byte <strong>'{lzSteps[lzStepIdx].nextChar === ' ' ? 'space' : lzSteps[lzStepIdx].nextChar}'</strong>.
                          </>
                        ) : (
                          <>
                            Zero prior match found. Distance and length are 0. Decoder simply appends literal <strong>'{lzSteps[lzStepIdx].nextChar === ' ' ? 'space' : lzSteps[lzStepIdx].nextChar}'</strong>.
                          </>
                        )}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          Cumulative Token Stream ({lzSteps[lzStepIdx].tokensSoFar.length} emitted)
                        </span>
                      </div>
                      <div className="lz-token-stream-grid">
                        {lzSteps[lzStepIdx].tokensSoFar.map((t, idx) => (
                          <div 
                            key={idx} 
                            className={`lz-token-chip ${idx === lzSteps[lzStepIdx].tokensSoFar.length - 1 ? 'active-latest' : ''}`}>
                            <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>#{idx + 1}</span>
                            <span>(</span>
                            <span className="tok-d">d={t.distance}</span>
                            <span>,</span>
                            <span className="tok-l">l={t.length}</span>
                            <span>,</span>
                            <span className="tok-c">'{t.nextChar === ' ' ? '␣' : t.nextChar}'</span>
                            <span>)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 Tricky Concepts Demystified */}
                <div className="lz-tricky-card">
                  <div className="lz-tricky-title">
                    <Zap size={20} color="var(--accent-cyan)" />
                    <span>The 3 Tricky Concepts of LZ77 Demystified</span>
                  </div>

                  <div className="lz-tricky-grid">
                    <div className="lz-tricky-col">
                      <h5>1. Why Relative Distance, Not Absolute Index?</h5>
                      <p>
                        If we stored absolute file positions (e.g. index <code>1,489,200</code>), the distance field would grow without bound, requiring 32 to 64 bits per token!
                      </p>
                      <div className="code-diagram">
                        distance = cursor - match_pos<br />
                        Bounded by window W_s (4096B) → requires only 12 bits!
                      </div>
                      <p>
                        During decoding, the receiver computes: <code>copy_pos = output.length - distance</code>.
                      </p>
                    </div>

                    <div className="lz-tricky-col">
                      <h5>2. The Self-Referential Trick (Length &gt; Distance)</h5>
                      <p>
                        How can match length be <code>100</code> when backward distance is only <code>1</code>?
                      </p>
                      <div className="code-diagram">
                        Input: "ZZZZZZZZZZ" (10 times 'Z')<br />
                        Step 1: Emit (d=0, l=0, 'Z')<br />
                        Step 2: Emit (d=1, l=9, 'Z')
                      </div>
                      <p>
                        Because the decompressor copies <strong>byte-by-byte</strong>! When it writes byte #1, that byte is instantly available to be copied for byte #2, which is copied for byte #3. This turns LZ77 into a Run-Length Coder!
                      </p>
                    </div>

                    <div className="lz-tricky-col">
                      <h5>3. Why DEFLATE & LZSS Were Invented</h5>
                      <p>
                        In classic LZ77, an uncompressed literal character costs <strong>28 bits</strong> (12b distance + 8b length + 8b char) to store an <strong>8-bit</strong> character!
                      </p>
                      <div className="code-diagram">
                        8 bits raw → 28 bits token (+250% expansion!)
                      </div>
                      <p>
                        <strong>LZSS</strong> solved this by adding a 1-bit flag (literal vs match), and <strong>DEFLATE</strong> compresses the tokens with Canonical Huffman codes!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- PHASE 2: TOKEN STREAM & RECONSTRUCTION -------------------- */}
            {lzAnimPhase === 'recon' && lzSteps[lzStepIdx] && (
              <div className="lz-studio-wrapper" style={{ marginTop: '20px' }}>
                <div className="lz-reconstructed-banner">
                  <div className="recon-title">
                    <CheckCircle2 size={18} />
                    <span>Live Asymmetric Decompressor Reconstruction (Zero Search, Direct Relative Copy)</span>
                  </div>
                  <div className="lz-reconstructed-text">
                    {lzSteps[lzStepIdx].reconstructedSoFar || '(empty)'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Reconstructed <strong>{lzSteps[lzStepIdx].reconstructedSoFar.length}</strong> of <strong>{lzInput.length}</strong> bytes ({Math.round((lzSteps[lzStepIdx].reconstructedSoFar.length / lzInput.length) * 100)}% complete)
                  </div>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '14px', fontSize: '1.05rem' }}>
                    Decompressor Step-by-Step Execution Log
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                    {lzSteps[lzStepIdx].tokensSoFar.map((t, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px 14px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
                        <span style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>Token #{idx + 1}</span>
                        <span style={{ color: 'var(--accent-cyan)' }}>d={t.distance}</span>
                        <span style={{ color: 'var(--accent-emerald)' }}>l={t.length}</span>
                        <span style={{ color: 'var(--accent-rose)' }}>c='{t.nextChar === ' ' ? '␣' : t.nextChar}'</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          → {t.length > 0 ? `Copied ${t.length} bytes from backward offset ${t.distance} + appended '${t.nextChar === ' ' ? '␣' : t.nextChar}'` : `Appended literal '${t.nextChar === ' ' ? '␣' : t.nextChar}'`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- PHASE 3: REAL FILE DATA MATRIX -------------------- */}
            {lzAnimPhase === 'matrix' && (
              <div className="lz-studio-wrapper" style={{ marginTop: '20px' }}>
                {/* Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div className="metric-box">
                    <span className="metric-val">{lzInput.length} B</span>
                    <span className="metric-lbl">Raw Uncompressed File</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-val" style={{ color: 'var(--accent-cyan)' }}>
                      {12 + Math.ceil((lzSteps.length * 28) / 8)} B
                    </span>
                    <span className="metric-lbl">LZ77 Binary Stream (Header + Tokens)</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-val" style={{ color: lzInput.length > (12 + Math.ceil((lzSteps.length * 28) / 8)) ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {(lzInput.length / Math.max(1, 12 + Math.ceil((lzSteps.length * 28) / 8))).toFixed(2)} : 1
                    </span>
                    <span className="metric-lbl">Compression Ratio</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-val" style={{ color: 'var(--accent-violet)' }}>
                      {lzSteps.length}
                    </span>
                    <span className="metric-lbl">Emitted (d,l,c) Triplets</span>
                  </div>
                </div>

                {/* Hex / ASCII Matrix Comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="matrix-pane">
                    <div className="matrix-pane-header">
                      <span>ORIGINAL UNCOMPRESSED BYTES (ASCII & HEX)</span>
                      <span className="matrix-size-tag">{lzInput.length} Bytes</span>
                    </div>
                    <div className="hex-ascii-grid-scroll" style={{ maxHeight: '260px' }}>
                      <table className="matrix-hex-table">
                        <thead>
                          <tr>
                            <th>Offset</th>
                            <th>Hex Value</th>
                            <th>ASCII Symbol</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lzInput.split('').map((c, i) => (
                            <tr key={i}>
                              <td className="cell-offset">0x{i.toString(16).padStart(4, '0')}</td>
                              <td className="cell-hex">0x{c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}</td>
                              <td className="cell-ascii">{c === ' ' ? '␣' : c}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="matrix-pane">
                    <div className="matrix-pane-header">
                      <span>SERIALIZED LZ77 BITSTREAM (12B HEADER + 28b TOKENS)</span>
                      <span className="matrix-size-tag" style={{ color: 'var(--accent-cyan)' }}>
                        {12 + Math.ceil((lzSteps.length * 28) / 8)} Bytes
                      </span>
                    </div>
                    <div className="hex-ascii-grid-scroll" style={{ maxHeight: '260px' }}>
                      <div style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                        <div style={{ color: 'var(--accent-violet)', fontWeight: 700, marginBottom: '6px' }}>
                          [Header - 12 Bytes]
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          • Magic (4B): 0x4C5A3737 ('LZ77')<br />
                          • Original Size (4B): {lzInput.length} bytes (0x{lzInput.length.toString(16).padStart(8, '0')})<br />
                          • Token Count (4B): {lzSteps.length} tokens (0x{lzSteps.length.toString(16).padStart(8, '0')})
                        </div>
                        <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginTop: '12px', marginBottom: '6px' }}>
                          [Token Payload - 28 bits per token: 12b d | 8b l | 8b c]
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {lzSteps.map((s, idx) => (
                            <div key={idx} style={{ color: 'var(--text-muted)' }}>
                              #{idx + 1}: d={s.token.distance} (0b{s.token.distance.toString(2).padStart(12, '0')}) | l={s.token.length} (0b{s.token.length.toString(2).padStart(8, '0')}) | c='{s.token.nextChar === ' ' ? '␣' : s.token.nextChar}' (0x{s.token.nextChar.charCodeAt(0).toString(16).padStart(2, '0')})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ==================== MATHEMATICAL SIZE REDUCTION BREAKDOWN (BEFORE vs. AFTER) ==================== */}
          {(() => {
            const rawBytes = lzInput.length;
            const rawBits = rawBytes * 8;
            const headerBytes = 12;
            const tokenBits = lzSteps.length * 28;
            const totalCompBits = headerBytes * 8 + tokenBits;
            const totalCompBytes = headerBytes + Math.ceil(tokenBits / 8);
            const deltaBits = rawBits - totalCompBits;
            const savingsPercent = rawBits > 0 ? ((deltaBits / rawBits) * 100).toFixed(1) : 0;
            const ratio = totalCompBytes > 0 ? (rawBytes / totalCompBytes).toFixed(2) : '1.00';
            const matchesCount = lzSteps.filter(s => s.bestLength > 0).length;
            const literalsCount = lzSteps.filter(s => s.bestLength === 0).length;
            const charsSaved = lzSteps.reduce((acc, s) => acc + s.bestLength, 0);

            return (
              <div className="size-reduction-calculator-card">
                <div className="calc-header">
                  <div className="calc-title">
                    <TrendingDown size={22} color="var(--accent-cyan)" />
                    <span>Mathematical Size Reduction Breakdown: Before vs. After Compression</span>
                  </div>
                  <span className="algo-type-tag" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.4)' }}>
                    Exact Bit-Level Equation
                  </span>
                </div>

                {/* Main Equation Banner */}
                <div className="math-equation-banner">
                  <div className="math-eq-item">
                    <span className="math-eq-label">Before Compression</span>
                    <span className="math-eq-val before">{rawBits} bits</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({rawBytes} Bytes @ 8b/char)</span>
                  </div>

                  <span className="math-operator">→</span>

                  <div className="math-eq-item">
                    <span className="math-eq-label">After Compression</span>
                    <span className="math-eq-val after">{totalCompBits} bits</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({totalCompBytes} Bytes total)</span>
                  </div>

                  <span className="math-operator">=</span>

                  <div className="math-eq-item">
                    <span className="math-eq-label">Exact Reduction (Delta)</span>
                    <span className="math-eq-val delta" style={{ color: deltaBits >= 0 ? 'var(--accent-cyan)' : 'var(--accent-rose)' }}>
                      {deltaBits >= 0 ? `-${deltaBits} bits` : `+${Math.abs(deltaBits)} bits`}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({savingsPercent}% size reduction)
                    </span>
                  </div>

                  <span className="math-operator">|</span>

                  <div className="math-eq-item">
                    <span className="math-eq-label">Compression Factor</span>
                    <span className="math-eq-val ratio">{ratio} : 1</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>density multiplier</span>
                  </div>
                </div>

                {/* 3-Column Detailed Mathematical Audit */}
                <div className="reduction-three-col-grid">
                  {/* Column 1: Before */}
                  <div className="reduction-col-card before">
                    <div className="reduction-col-title">
                      <FileText size={18} />
                      <span>1. What Existed Before (Raw)</span>
                    </div>
                    <ul className="reduction-detail-list">
                      <li>
                        <span>Uncompressed Symbols:</span>
                        <strong>{rawBytes} chars</strong>
                      </li>
                      <li>
                        <span>Fixed Character Width:</span>
                        <strong>8 bits / symbol</strong>
                      </li>
                      <li>
                        <span>Raw Bitstream Formula:</span>
                        <strong>N × 8 = {rawBits} bits</strong>
                      </li>
                      <li>
                        <span>Substrings Waiting in Lookahead:</span>
                        <strong>{lzSteps.length} match segments</strong>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: Reduction Mechanism */}
                  <div className="reduction-col-card mechanism">
                    <div className="reduction-col-title">
                      <Zap size={18} />
                      <span>2. How It Reduced Size</span>
                    </div>
                    <ul className="reduction-detail-list">
                      <li>
                        <span>Matches Found in History:</span>
                        <strong>{matchesCount} phrases</strong>
                      </li>
                      <li>
                        <span>Repeated Bytes Deduplicated:</span>
                        <strong>{charsSaved} bytes</strong>
                      </li>
                      <li>
                        <span>Uncompressed Literals:</span>
                        <strong>{literalsCount} tokens (d=0, l=0)</strong>
                      </li>
                      <li>
                        <span>Header Transmit Cost:</span>
                        <strong>+96 bits (12-byte header)</strong>
                      </li>
                    </ul>
                  </div>

                  {/* Column 3: After */}
                  <div className="reduction-col-card after">
                    <div className="reduction-col-title">
                      <CheckCircle2 size={18} />
                      <span>3. What Replaces It (After)</span>
                    </div>
                    <ul className="reduction-detail-list">
                      <li>
                        <span>Binary Header Size:</span>
                        <strong>12 Bytes (96 bits)</strong>
                      </li>
                      <li>
                        <span>Packed 28-bit Token Stream:</span>
                        <strong>{lzSteps.length} × 28 = {tokenBits} bits</strong>
                      </li>
                      <li>
                        <span>Total Transmitted File:</span>
                        <strong>{totalCompBytes} Bytes ({totalCompBits} bits)</strong>
                      </li>
                      <li>
                        <span>Net Space Reduction:</span>
                        <strong style={{ color: deltaBits >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {savingsPercent}%
                        </strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==================== PROS, FLAWS & GOTCHAS DEEP ANALYSIS ==================== */}
          <div className="pros-flaws-deep-grid">
            <div className="pf-deep-card pros">
              <h4><ShieldCheck size={20} /> Architectural Strengths & Pros of LZ77</h4>
              <ul className="pf-deep-list">
                <li>
                  <span><strong>Asymmetric Blazing-Fast Decompression:</strong> The receiver requires zero search, zero hashing, and zero tree traversal. Decompression is pure direct memory copying (<code>memcpy</code>) at multi-gigabyte/sec speeds.</span>
                </li>
                <li>
                  <span><strong>Zero Prior Distribution Required:</strong> Unlike Huffman or Arithmetic coding, LZ77 adapts dynamically on-the-fly to local context without needing a prior frequency scan pass.</span>
                </li>
                <li>
                  <span><strong>Run-Length Overlap Superpower:</strong> When match length exceeds distance ($l &gt; d$), LZ77 naturally compresses repeating runs (e.g. 500 identical characters) into a single 28-bit token ($d=1, l=499, c$).</span>
                </li>
                <li>
                  <span><strong>Universal Industry Foundation:</strong> Serves as the primary deduplication stage in DEFLATE (ZIP, GZIP), PNG, LZ4, Snappy, and Zstandard.</span>
                </li>
              </ul>
            </div>

            <div className="pf-deep-card flaws">
              <h4><AlertTriangle size={20} /> Engineering Flaws, Gotchas & Limitations</h4>
              <ul className="pf-deep-list">
                <li>
                  <span><strong>Quadratic Search Overhead Without Hash Chains:</strong> A naive sliding search requires $O(N \cdot W_s \cdot W_l)$ string comparisons. Production encoders must maintain 3-byte hash tables to achieve linear $O(N)$ encoding time.</span>
                </li>
                <li>
                  <span><strong>The Severe Negative Expansion Hazard:</strong> On non-repeating data (random bytes, pre-compressed files), each literal character requires 28 bits (3.5 bytes) to store 1 byte—causing a devastating 3.5× file explosion!</span>
                </li>
                <li>
                  <span><strong>Window Horizon Blindness:</strong> A standard 32 KB or 4 KB sliding window cannot detect identical duplicate phrases located outside the window horizon (e.g., 64 KB apart).</span>
                </li>
                <li>
                  <span><strong>Requires Flagged Literals (LZSS) or Entropy Coding (DEFLATE):</strong> Raw (d, l, c) triplets are too bloated; production formats must use 1-bit flags or Huffman coding on the token stream.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ==================== ARCHITECTURAL DECISION GUIDE: WHEN TO USE vs. WHEN NOT TO USE ==================== */}
          <div className="decision-guide-card">
            <div className="decision-guide-header">
              <div className="decision-guide-title">
                <Zap size={22} color="var(--accent-cyan)" />
                <span>Production Architecture Guide: When to Use vs. When NOT to Use</span>
              </div>
              <span className="algo-type-tag" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.3)' }}>
                LZ77 Sliding Window Matrix
              </span>
            </div>

            <div className="decision-guide-grid">
              {/* When to Use Column */}
              <div className="decision-col when-to-use">
                <div className="decision-col-header">
                  <CheckCircle2 size={20} />
                  <span>When to Use This Algorithm</span>
                </div>
                <ul className="decision-items-list">
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Multi-Byte Repeated Phrases & Structured Text:</strong> Ideal for JSON, XML, HTML, CSV, server logs, and source code where long repetitive substrings appear frequently.
                    </div>
                  </li>
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Compound Multi-Stage Pipelines (DEFLATE / GZIP / PNG / ZIP):</strong> Universally used as the first-stage dictionary deduplicator to convert repeated phrases into distance/length symbols before Huffman or ANS encoding.
                    </div>
                  </li>
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Asymmetric "Compress Once, Decompress Everywhere" Workloads:</strong> Game asset packaging, static web assets, and package managers where encode CPU time is expendable to guarantee lightning-fast client decompressions.
                    </div>
                  </li>
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Embedded Targets with Strict Decompression RAM Limits:</strong> Decompression needs only a small circular buffer equal to the window size (e.g., 2 KB to 32 KB) and zero dynamic memory allocations.
                    </div>
                  </li>
                </ul>
              </div>

              {/* When NOT to Use Column */}
              <div className="decision-col when-not-to-use">
                <div className="decision-col-header">
                  <XCircle size={20} />
                  <span>When NOT to Use It & Alternatives</span>
                </div>
                <ul className="decision-items-list">
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Uncompressed Raw Triplet Storage:</strong> Storing fixed 28-bit $(d, l, c)$ tokens without entropy coding causes severe negative file expansion on non-repeating data.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> <strong>LZSS</strong> (1-bit literal/match flag) or <strong>DEFLATE</strong> (Huffman-coded tokens).
                      </div>
                    </div>
                  </li>
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Encrypted, Random, or Pre-Compressed Files (ZIP, JPEG, MP4):</strong> Zero substring matches will be found, wasting CPU cycles and expanding the file by up to 3.5×.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> Store raw bytes without compression (<code>STORE</code> mode).
                      </div>
                    </div>
                  </li>
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Continuous Analog Signals (Photographs, Audio, Video):</strong> Smooth continuous signals contain sensor noise and slight gradient variations where identical multi-byte substring matches almost never exist.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> Transform coding like <strong>DCT (JPEG)</strong> or <strong>DWT (JPEG 2000)</strong>.
                      </div>
                    </div>
                  </li>
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Long-Distance Matches Separated Beyond the Sliding Horizon (&gt; 32 KB):</strong> If duplicate multi-kilobyte files or assets repeat megabytes apart, a 32 KB window cannot see them.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> <strong>Zstandard Long Distance Matching (--long)</strong>, <strong>Brotli</strong>, or <strong>LZMA / 7-Zip</strong>.
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: DEDICATED DEFLATE COMPOUND STUDIO (LZ77 + DUAL CANONICAL HUFFMAN)
          ========================================================================= */}
      {currentView === 'deflate' && (
        <div className="studio-container">
          <div className="studio-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  className="studio-breadcrumb" 
                  onClick={() => navigateTo('matrix')} 
                  style={{ margin: 0, padding: '4px 10px', fontSize: '0.78rem' }}>
                  <ArrowLeft size={14} /> All Algorithms
                </button>
                <span className="section-heading-badge lossless">
                  ALGORITHM #8: COMPOUND HYBRID ARCHITECTURE (RFC 1951)
                </span>
              </div>
              <h2 className="matrix-hero-title" style={{ marginTop: '8px', fontSize: '2rem' }}>
                DEFLATE: <span>LZ77 Deduplication + Dual Canonical Huffman Coding</span>
              </h2>
            </div>
            <div className="cxx-badge">
              <span className="cxx-icon">C++20</span>
              <span>lossless/deflate/deflate.hpp</span>
            </div>
          </div>

          <div className="tree-animator-card">
            {/* Phase Navigation Tabs */}
            <div className="anim-phase-nav">
              <button 
                className={`phase-tab-btn ${deflateAnimPhase === 'pipeline' ? 'active' : ''}`}
                onClick={() => setDeflateAnimPhase('pipeline')}>
                <Sparkles size={16} /> Phase 1: Compound Pipeline Animator (LZ77 → Huffman)
              </button>
              <button 
                className={`phase-tab-btn ${deflateAnimPhase === 'exploder' ? 'active' : ''}`}
                onClick={() => setDeflateAnimPhase('exploder')}>
                <Layers size={16} /> Phase 2: Length & Distance Symbol & Extra-Bits Exploder
              </button>
              <button 
                className={`phase-tab-btn ${deflateAnimPhase === 'trees' ? 'active' : ''}`}
                onClick={() => setDeflateAnimPhase('trees')}>
                <Network size={16} /> Phase 3: Dual Canonical Huffman Trees
              </button>
              <button 
                className={`phase-tab-btn ${deflateAnimPhase === 'matrix' ? 'active' : ''}`}
                onClick={() => setDeflateAnimPhase('matrix')}>
                <FileCode size={16} /> Phase 4: Real Document Data Matrix & Bitstream Audit
              </button>
            </div>

            {/* Presets & Parameters Bar */}
            <div className="anim-controls-bar" style={{ flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Presets:</span>
                {Object.entries(DEFLATE_PRESETS).map(([key, item]) => (
                  <button
                    key={key}
                    className={`chip-btn ${deflatePresetKey === key ? 'active' : ''}`}
                    style={deflatePresetKey === key ? { background: 'rgba(0, 242, 254, 0.2)', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' } : {}}
                    onClick={() => {
                      setDeflatePresetKey(key);
                      setDeflateInput(item.text);
                      setDeflateStepIdx(0);
                      setDeflateIsAutoBuilding(false);
                      deflateIsAutoBuildingRef.current = false;
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                    }}>
                    {item.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Sliding Window:</span>
                  <select 
                    value={deflateWindowSize} 
                    onChange={e => { setDeflateWindowSize(Number(e.target.value)); setDeflateStepIdx(0); }}
                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem' }}>
                    <option value={32}>32 Bytes (Pedagogical)</option>
                    <option value={64}>64 Bytes (Compact)</option>
                    <option value={128}>128 Bytes (Standard)</option>
                    <option value={256}>256 Bytes (Deep)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Input Bar */}
            <div style={{ margin: '14px 0' }}>
              <input
                type="text"
                value={deflateInput}
                onChange={e => {
                  setDeflateInput(e.target.value);
                  setDeflatePresetKey('custom');
                  setDeflateStepIdx(0);
                  setDeflateIsAutoBuilding(false);
                  deflateIsAutoBuildingRef.current = false;
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                placeholder="Type or paste custom text to watch DEFLATE tokenize and Huffman-code live..."
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.88rem', fontFamily: 'monospace' }}
              />
            </div>

            {/* -----------------------------------------------------------------
                PHASE 1: COMPOUND PIPELINE ANIMATOR
                ----------------------------------------------------------------- */}
            {deflateAnimPhase === 'pipeline' && (
              <div>
                {/* Audio Narrator Bar */}
                <div className="narrator-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                        Step-by-Step Voice & Pipeline Narrator (Step {deflateStepIdx + 1} of {Math.max(1, deflateData.steps.length)})
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: '2px', maxWidth: '850px' }}>
                        {deflateData.steps[deflateStepIdx]?.narrative || "Loading pipeline..."}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className="nav-step-btn"
                      onClick={() => handleDeflateStepChange(deflateStepIdx - 1)}
                      disabled={deflateStepIdx === 0}
                      title="Step Backward">
                      <StepBack size={16} />
                    </button>
                    <button 
                      className="nav-step-btn play-btn"
                      onClick={handleToggleDeflateAutoBuild}
                      style={{ background: deflateIsAutoBuilding ? 'rgba(255, 71, 87, 0.2)' : 'rgba(0, 242, 254, 0.2)', borderColor: deflateIsAutoBuilding ? 'var(--accent-rose)' : 'var(--accent-cyan)', color: deflateIsAutoBuilding ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}
                      title={deflateIsAutoBuilding ? "Pause Audio Auto-Advancement" : "Play Synchronized Audio Auto-Advancement"}>
                      {deflateIsAutoBuilding ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button 
                      className="nav-step-btn"
                      onClick={() => handleDeflateStepChange(deflateStepIdx + 1)}
                      disabled={deflateStepIdx >= deflateData.steps.length - 1}
                      title="Step Forward">
                      <StepForward size={16} />
                    </button>
                    <button 
                      className="nav-step-btn"
                      onClick={() => handleDeflateStepChange(0)}
                      title="Reset to Start">
                      <RotateCcw size={16} />
                    </button>
                    <button 
                      className="nav-step-btn"
                      onClick={() => {
                        setDeflateVoiceEnabled(!deflateVoiceEnabled);
                        if (window.speechSynthesis) window.speechSynthesis.cancel();
                      }}
                      title={deflateVoiceEnabled ? "Mute Voice Narration" : "Unmute Voice Narration"}
                      style={deflateVoiceEnabled ? { color: 'var(--accent-emerald)' } : { color: 'var(--text-muted)' }}>
                      {deflateVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                  </div>
                </div>

                {/* Sliding Window Visualization Tape */}
                <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '10px', height: '10px', background: 'rgba(0, 242, 254, 0.3)', border: '1px solid var(--accent-cyan)', borderRadius: '2px' }}></span>
                        Search Buffer (History Window)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '10px', height: '10px', background: 'rgba(255, 170, 0, 0.4)', border: '1px solid var(--accent-amber)', borderRadius: '2px' }}></span>
                        Active Match / Cursor Lookahead
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '10px', height: '10px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--border-subtle)', borderRadius: '2px' }}></span>
                        Unprocessed Stream
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Cursor Position: <strong style={{ color: '#fff' }}>{deflateData.steps[deflateStepIdx]?.cursor ?? 0}</strong> / {deflateInput.length}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '10px', background: '#070b14', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '60px' }}>
                    {deflateInput.split('').map((ch, idx) => {
                      const curStep = deflateData.steps[deflateStepIdx];
                      const cursor = curStep?.cursor ?? 0;
                      const isMatch = curStep?.isMatch ?? false;
                      const matchLen = curStep?.bestLength ?? 0;
                      const searchStart = Math.max(0, cursor - deflateWindowSize);

                      let bg = 'rgba(255, 255, 255, 0.03)';
                      let border = '1px solid rgba(255, 255, 255, 0.08)';
                      let color = 'var(--text-muted)';
                      let isCursor = (idx === cursor);

                      if (idx >= searchStart && idx < cursor) {
                        bg = 'rgba(0, 242, 254, 0.12)';
                        border = '1px solid rgba(0, 242, 254, 0.4)';
                        color = 'var(--accent-cyan)';
                      } else if (isMatch && idx >= cursor && idx < cursor + matchLen) {
                        bg = 'rgba(255, 170, 0, 0.25)';
                        border = '1px solid var(--accent-amber)';
                        color = '#fff';
                      } else if (!isMatch && idx === cursor) {
                        bg = 'rgba(16, 185, 129, 0.25)';
                        border = '1px solid var(--accent-emerald)';
                        color = '#fff';
                      }

                      return (
                        <div
                          key={idx}
                          style={{
                            minWidth: '24px',
                            height: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: bg,
                            border: border,
                            borderRadius: '3px',
                            color: color,
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            fontWeight: isCursor || (isMatch && idx >= cursor && idx < cursor + matchLen) ? 700 : 400,
                            position: 'relative'
                          }}>
                          {ch === ' ' ? '␣' : ch}
                          <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>{idx}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Token Inspection & Reduction Arithmetic Card */}
                {deflateData.steps[deflateStepIdx] && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    {/* Token Anatomy Box */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                      <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
                        Stage 1: LZ77 Intermediate Token
                      </div>
                      {deflateData.steps[deflateStepIdx].isEob ? (
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                            End-Of-Block Marker (EOB)
                          </div>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Designates block termination. Mapped to Literal/Length tree symbol <strong>256</strong>.
                          </p>
                        </div>
                      ) : deflateData.steps[deflateStepIdx].isMatch ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="status-chip ready" style={{ fontSize: '0.72rem' }}>PHRASE MATCH</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                              "{deflateData.steps[deflateStepIdx].matchedText}"
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Match Length</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                                {deflateData.steps[deflateStepIdx].bestLength} Bytes
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                RFC 1951 Symbol: <strong>{deflateData.steps[deflateStepIdx].lenMap?.code}</strong>
                              </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Backward Distance</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                                {deflateData.steps[deflateStepIdx].bestDistance} Bytes
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                RFC 1951 Symbol: <strong>{deflateData.steps[deflateStepIdx].distMap?.code}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="status-chip ready" style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>LITERAL BYTE</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
                              '{deflateData.steps[deflateStepIdx].char === ' ' ? '␣ (space)' : deflateData.steps[deflateStepIdx].char}'
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              (ASCII {deflateData.steps[deflateStepIdx].symbol})
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            No prior match ≥ 3 found in search buffer. Coded directly into the Literal/Length tree as symbol {deflateData.steps[deflateStepIdx].symbol}.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Stage 2 Huffman Coding & Extra Bits Box */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                      <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
                        Stage 2: Canonical Huffman + Extra Bits
                      </div>
                      {deflateData.steps[deflateStepIdx].isMatch ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0, 242, 254, 0.05)', borderRadius: '4px' }}>
                            <span>Length Symbol {deflateData.steps[deflateStepIdx].lenMap?.code}:</span>
                            <code>{deflateData.steps[deflateStepIdx].lenHuffCode} ({deflateData.steps[deflateStepIdx].lenHuffCode.length} bits)</code>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0, 242, 254, 0.05)', borderRadius: '4px' }}>
                            <span>Length Extra Bits ({deflateData.steps[deflateStepIdx].lenMap?.extraBitsCount}b):</span>
                            <code>{deflateData.steps[deflateStepIdx].lenMap?.extraBitsCount > 0 ? deflateData.steps[deflateStepIdx].lenMap?.extraBitsBin : '(none)'}</code>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '4px' }}>
                            <span>Distance Symbol {deflateData.steps[deflateStepIdx].distMap?.code}:</span>
                            <code>{deflateData.steps[deflateStepIdx].distHuffCode} ({deflateData.steps[deflateStepIdx].distHuffCode.length} bits)</code>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '4px' }}>
                            <span>Distance Extra Bits ({deflateData.steps[deflateStepIdx].distMap?.extraBitsCount}b):</span>
                            <code>{deflateData.steps[deflateStepIdx].distMap?.extraBitsCount > 0 ? deflateData.steps[deflateStepIdx].distMap?.extraBitsBin : '(none)'}</code>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>Canonical Huffman Bitstring:</span>
                            <code style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                              {deflateData.steps[deflateStepIdx].litHuffCode}
                            </code>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <span>Transmitted Length:</span>
                            <span>{deflateData.steps[deflateStepIdx].litHuffCode.length} bits (vs 8 raw bits)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step Mathematical Size Reduction Calculation */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                      <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
                        Step Size Reduction Arithmetic (Before vs After)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255, 71, 87, 0.08)', borderRadius: '4px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--accent-rose)' }}>Before (Raw Bytes):</span>
                        <strong style={{ fontFamily: 'monospace' }}>{deflateData.steps[deflateStepIdx].rawBitsThisStep} bits</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '4px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)' }}>After (DEFLATE Bits):</span>
                        <strong style={{ fontFamily: 'monospace' }}>{deflateData.steps[deflateStepIdx].deflateBitsThisStep} bits</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(0, 242, 254, 0.08)', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>Net Savings on Step:</span>
                        <strong style={{ fontFamily: 'monospace', color: deflateData.steps[deflateStepIdx].deltaBitsThisStep >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {deflateData.steps[deflateStepIdx].deltaBitsThisStep >= 0 ? `-${deflateData.steps[deflateStepIdx].deltaBitsThisStep} bits (${deflateData.steps[deflateStepIdx].deltaPercentThisStep}%)` : `+${Math.abs(deflateData.steps[deflateStepIdx].deltaBitsThisStep)} bits`}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Decompressor Live Reconstruction Tape */}
                <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 600 }}>
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                      <span>Decompressor Output Reconstruction Buffer:</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>
                      Reconstructed {deflateData.steps[deflateStepIdx]?.reconstructedSoFar?.length ?? 0} / {deflateInput.length} bytes (100% Lossless Roundtrip)
                    </span>
                  </div>
                  <div style={{ padding: '10px 14px', background: '#050810', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--accent-emerald)', wordBreak: 'break-all', minHeight: '42px' }}>
                    {deflateData.steps[deflateStepIdx]?.reconstructedSoFar || '(empty buffer)'}
                  </div>
                </div>
              </div>
            )}

            {/* -----------------------------------------------------------------
                PHASE 2: LENGTH & DISTANCE SYMBOL & EXTRA-BITS EXPLODER (USER'S CORE CONCEPT)
                ----------------------------------------------------------------- */}
            {deflateAnimPhase === 'exploder' && (
              <div>
                {/* Educational Banner Explaining the Distinction */}
                <div style={{ background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)', padding: '18px 22px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Layers size={22} color="var(--accent-cyan)" />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
                      Understanding Length & Distance Symbols vs Extra Bits (RFC 1951)
                    </h3>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    A length symbol is <strong>NOT the binary representation of the length itself</strong>. It is a <strong>compact category ID</strong> assigned to a bracket range of possible lengths. <strong>Extra bits</strong> then specify the exact offset inside that bracket. Finally, that category ID is encoded with a variable-length Canonical Huffman code, while the extra bits are appended verbatim as raw binary!
                  </p>
                </div>

                {/* Interactive Controls for Length & Distance Exploration */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  {/* Length Interactive Controller */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        Interactive Match Length [3 .. 258]
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: '#fff', background: 'rgba(0, 242, 254, 0.15)', padding: '2px 10px', borderRadius: '4px', border: '1px solid var(--accent-cyan)' }}>
                        Length = {exploderLength}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min={3}
                      max={258}
                      value={exploderLength}
                      onChange={e => setExploderLength(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-cyan)', marginBottom: '12px' }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[3, 4, 9, 10, 11, 12, 19, 27, 45, 100, 258].map(l => (
                        <button
                          key={l}
                          onClick={() => setExploderLength(l)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            background: exploderLength === l ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.06)',
                            color: exploderLength === l ? '#000' : '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}>
                          Len {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Distance Interactive Controller */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        Interactive Backward Distance [1 .. 32768]
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: '#fff', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 10px', borderRadius: '4px', border: '1px solid var(--accent-emerald)' }}>
                        Distance = {exploderDistance}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min={1}
                      max={32768}
                      value={exploderDistance}
                      onChange={e => setExploderDistance(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-emerald)', marginBottom: '12px' }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[1, 2, 4, 5, 8, 9, 35, 65, 500, 4096, 32768].map(d => (
                        <button
                          key={d}
                          onClick={() => setExploderDistance(d)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            background: exploderDistance === d ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.06)',
                            color: exploderDistance === d ? '#000' : '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}>
                          Dist {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Visual 4-Tier Cascade Transformation Diagram */}
                {(() => {
                  const lenInfo = mapLengthToRfc1951(exploderLength);
                  const distInfo = mapDistanceToRfc1951(exploderDistance);
                  const lenHuff = deflateData.litCodes[lenInfo.code] || '101';
                  const distHuff = deflateData.distCodes[distInfo.code] || '010';

                  const totalLenBits = lenHuff.length + lenInfo.extraBitsCount;
                  const totalDistBits = distHuff.length + distInfo.extraBitsCount;
                  const totalDeflateBits = totalLenBits + totalDistBits;
                  const naiveFixedBits = 8 + 16; // 8 bits length + 16 bits distance

                  return (
                    <div style={{ background: '#080d1a', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '24px', marginBottom: '24px' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff' }}>
                        The 4-Tier Transformation Cascade for Length = {exploderLength} & Distance = {exploderDistance}
                      </h4>

                      {/* Transformation Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', position: 'relative' }}>
                        {/* Tier 1: Raw Value */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '14px' }}>
                          <span className="status-chip ready" style={{ fontSize: '0.68rem', marginBottom: '8px' }}>TIER 1: RAW LZ77 MATCH</span>
                          <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                            L = {exploderLength}, D = {exploderDistance}
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                            Extracted directly by the sliding window substring search engine.
                          </p>
                        </div>

                        {/* Tier 2: Category Symbol */}
                        <div style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: '6px', padding: '14px' }}>
                          <span className="status-chip ready" style={{ fontSize: '0.68rem', background: 'rgba(0, 242, 254, 0.2)', color: 'var(--accent-cyan)', marginBottom: '8px' }}>TIER 2: RFC 1951 CATEGORY SYMBOLS</span>
                          <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '6px' }}>
                            Length Range: <strong style={{ color: 'var(--accent-cyan)' }}>[{lenInfo.rangeStr}]</strong> → <strong>Symbol {lenInfo.code}</strong>
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '4px' }}>
                            Distance Range: <strong style={{ color: 'var(--accent-emerald)' }}>[{distInfo.rangeStr}]</strong> → <strong>Symbol {distInfo.code}</strong>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                            Symbols assign a single compact ID to an entire bracket of lengths / distances.
                          </p>
                        </div>

                        {/* Tier 3: Canonical Huffman Code */}
                        <div style={{ background: 'rgba(138, 43, 226, 0.05)', border: '1px solid rgba(138, 43, 226, 0.3)', borderRadius: '6px', padding: '14px' }}>
                          <span className="status-chip ready" style={{ fontSize: '0.68rem', background: 'rgba(138, 43, 226, 0.2)', color: 'var(--accent-purple)', marginBottom: '8px' }}>TIER 3: CANONICAL HUFFMAN CODES</span>
                          <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '6px' }}>
                            Code for Sym {lenInfo.code}: <code style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{lenHuff}</code> ({lenHuff.length} bits)
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '4px' }}>
                            Code for Sym {distInfo.code}: <code style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{distHuff}</code> ({distHuff.length} bits)
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                            Frequently occurring brackets receive shorter prefix codes (e.g. 2-5 bits).
                          </p>
                        </div>

                        {/* Tier 4: Extra Bits Specification */}
                        <div style={{ background: 'rgba(255, 170, 0, 0.05)', border: '1px solid rgba(255, 170, 0, 0.3)', borderRadius: '6px', padding: '14px' }}>
                          <span className="status-chip ready" style={{ fontSize: '0.68rem', background: 'rgba(255, 170, 0, 0.2)', color: 'var(--accent-amber)', marginBottom: '8px' }}>TIER 4: EXTRA BITS SPECIFICATION</span>
                          <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '6px' }}>
                            Len Offset: {exploderLength} - {lenInfo.baseLen} = {lenInfo.offset} → <code style={{ color: 'var(--accent-amber)' }}>{lenInfo.extraBitsCount > 0 ? lenInfo.extraBitsBin : '(0b extra)'}</code>
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '4px' }}>
                            Dist Offset: {exploderDistance} - {distInfo.baseDist} = {distInfo.offset} → <code style={{ color: 'var(--accent-amber)' }}>{distInfo.extraBitsCount > 0 ? distInfo.extraBitsBin : '(0b extra)'}</code>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                            Appended as raw uncompressed bits to pinpoint the exact value inside the bracket!
                          </p>
                        </div>
                      </div>

                      {/* Final Transmitted Bitstream Layout */}
                      <div style={{ marginTop: '20px', padding: '16px', background: '#03050a', borderRadius: '6px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                          Final Transmitted Bitstream Layout in DEFLATE Stream:
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontFamily: 'monospace', fontSize: '1.05rem' }}>
                          <div style={{ padding: '6px 12px', background: 'rgba(0, 242, 254, 0.15)', border: '1px solid var(--accent-cyan)', borderRadius: '4px', color: 'var(--accent-cyan)' }}>
                            [ Huffman Code: {lenHuff} ]
                            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Len Sym {lenInfo.code} ({lenHuff.length}b)</div>
                          </div>
                          {lenInfo.extraBitsCount > 0 && (
                            <div style={{ padding: '6px 12px', background: 'rgba(255, 170, 0, 0.15)', border: '1px solid var(--accent-amber)', borderRadius: '4px', color: 'var(--accent-amber)' }}>
                              [ Extra: {lenInfo.extraBitsBin} ]
                              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Len Offset ({lenInfo.extraBitsCount}b)</div>
                            </div>
                          )}
                          <span style={{ color: 'var(--text-muted)' }}>+</span>
                          <div style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', borderRadius: '4px', color: 'var(--accent-emerald)' }}>
                            [ Huffman Code: {distHuff} ]
                            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Dist Sym {distInfo.code} ({distHuff.length}b)</div>
                          </div>
                          {distInfo.extraBitsCount > 0 && (
                            <div style={{ padding: '6px 12px', background: 'rgba(255, 170, 0, 0.15)', border: '1px solid var(--accent-amber)', borderRadius: '4px', color: 'var(--accent-amber)' }}>
                              [ Extra: {distInfo.extraBitsBin} ]
                              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Dist Offset ({distInfo.extraBitsCount}b)</div>
                            </div>
                          )}
                        </div>

                        {/* Comparative Arithmetic: Fixed vs DEFLATE */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Naive Fixed Allocation: </span>
                            <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>{naiveFixedBits} bits</span> (8b Length + 16b Distance)
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>DEFLATE Symbol + Extra Bits: </span>
                            <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{totalDeflateBits} bits total</span>
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-cyan)', background: 'rgba(0, 242, 254, 0.1)', padding: '4px 10px', borderRadius: '4px' }}>
                            Net Savings: {naiveFixedBits - totalDeflateBits} bits saved ({Math.round(((naiveFixedBits - totalDeflateBits) / naiveFixedBits) * 100)}% reduction on token metadata!)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Side-by-Side Reference Tables with Glowing Active Bracket Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                  {/* Length Codes Table */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: 'var(--accent-cyan)' }}>
                      RFC 1951 Length Codes Table (Symbols 257–285)
                    </h5>
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                            <th style={{ padding: '4px 6px' }}>Code</th>
                            <th style={{ padding: '4px 6px' }}>Extra Bits</th>
                            <th style={{ padding: '4px 6px' }}>Lengths</th>
                          </tr>
                        </thead>
                        <tbody>
                          {RFC1951_LENGTH_TABLE.map(row => {
                            const isSelected = exploderLength >= row.minLen && exploderLength <= row.maxLen;
                            return (
                              <tr 
                                key={row.code}
                                style={{
                                  background: isSelected ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                                  fontWeight: isSelected ? 700 : 400,
                                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                                }}>
                                <td style={{ padding: '4px 6px' }}>{row.code}</td>
                                <td style={{ padding: '4px 6px' }}>{row.extraBits}</td>
                                <td style={{ padding: '4px 6px' }}>{row.minLen === row.maxLen ? row.minLen : `${row.minLen}–${row.maxLen}`}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Distance Codes Table */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: 'var(--accent-emerald)' }}>
                      RFC 1951 Distance Codes Table (Symbols 0–29)
                    </h5>
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                            <th style={{ padding: '4px 6px' }}>Code</th>
                            <th style={{ padding: '4px 6px' }}>Extra Bits</th>
                            <th style={{ padding: '4px 6px' }}>Distances</th>
                          </tr>
                        </thead>
                        <tbody>
                          {RFC1951_DISTANCE_TABLE.map(row => {
                            const isSelected = exploderDistance >= row.minDist && exploderDistance <= row.maxDist;
                            return (
                              <tr 
                                key={row.code}
                                style={{
                                  background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                  fontWeight: isSelected ? 700 : 400,
                                  color: isSelected ? 'var(--accent-emerald)' : 'var(--text-secondary)'
                                }}>
                                <td style={{ padding: '4px 6px' }}>{row.code}</td>
                                <td style={{ padding: '4px 6px' }}>{row.extraBits}</td>
                                <td style={{ padding: '4px 6px' }}>{row.minDist === row.maxDist ? row.minDist : `${row.minDist}–${row.maxDist}`}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -----------------------------------------------------------------
                PHASE 3: DUAL CANONICAL HUFFMAN TREES
                ----------------------------------------------------------------- */}
            {deflateAnimPhase === 'trees' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                  {/* Tree 1: Literal / Length Codebook */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                          Tree 1: Literal & Length Alphabet (0–285)
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Literals [0..255] + EOB [256] + Length Codes [257..285]
                        </span>
                      </div>
                      <span className="status-chip ready" style={{ fontSize: '0.7rem' }}>
                        {Object.keys(deflateData.litLengths).length} Active Codes
                      </span>
                    </div>

                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                            <th style={{ padding: '6px' }}>Sym</th>
                            <th style={{ padding: '6px' }}>Meaning</th>
                            <th style={{ padding: '6px' }}>Code Length</th>
                            <th style={{ padding: '6px' }}>Canonical Code</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(deflateData.litLengths).map(symStr => {
                            const sym = Number(symStr);
                            let meaning = `'${String.fromCharCode(sym)}' (ASCII ${sym})`;
                            if (sym === 256) meaning = 'End-Of-Block (EOB)';
                            else if (sym > 256) meaning = `Length Code (Sym ${sym})`;
                            else if (sym === 32) meaning = 'Space (0x20)';

                            return (
                              <tr key={sym} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '6px', color: 'var(--accent-cyan)' }}>{sym}</td>
                                <td style={{ padding: '6px', color: 'var(--text-secondary)' }}>{meaning}</td>
                                <td style={{ padding: '6px', color: '#fff' }}>{deflateData.litLengths[sym]} bits</td>
                                <td style={{ padding: '6px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                                  {deflateData.litCodes[sym]}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tree 2: Distance Codebook */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-emerald)' }}>
                          Tree 2: Distance Alphabet (0–29)
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Backward Distance Bracket Codes [1..32768]
                        </span>
                      </div>
                      <span className="status-chip ready" style={{ fontSize: '0.7rem' }}>
                        {Object.keys(deflateData.distLengths).length} Active Codes
                      </span>
                    </div>

                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      {Object.keys(deflateData.distLengths).length === 0 ? (
                        <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No sliding window match pairs present in this text sample. Distance tree is empty.
                        </div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                              <th style={{ padding: '6px' }}>Code</th>
                              <th style={{ padding: '6px' }}>Distance Range</th>
                              <th style={{ padding: '6px' }}>Code Length</th>
                              <th style={{ padding: '6px' }}>Canonical Code</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(deflateData.distLengths).map(codeStr => {
                              const code = Number(codeStr);
                              const entry = RFC1951_DISTANCE_TABLE.find(e => e.code === code);
                              const rangeStr = entry ? (entry.minDist === entry.maxDist ? `${entry.minDist}` : `${entry.minDist}–${entry.maxDist}`) : 'unknown';

                              return (
                                <tr key={code} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '6px', color: 'var(--accent-emerald)' }}>{code}</td>
                                  <td style={{ padding: '6px', color: 'var(--text-secondary)' }}>{rangeStr} ({entry?.extraBits || 0}b extra)</td>
                                  <td style={{ padding: '6px', color: '#fff' }}>{deflateData.distLengths[code]} bits</td>
                                  <td style={{ padding: '6px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                    {deflateData.distCodes[code]}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -----------------------------------------------------------------
                PHASE 4: REAL DOCUMENT DATA MATRIX & BITSTREAM AUDIT
                ----------------------------------------------------------------- */}
            {deflateAnimPhase === 'matrix' && deflateData.stats && (
              <div>
                {/* 4-Way Comparative Table (Why DEFLATE Wins) */}
                <div style={{ background: '#090e1c', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '20px', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', color: '#fff' }}>
                    4-Way Compression Paradigm Comparison (Same Input Document)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>1. Uncompressed Original</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: '4px 0' }}>
                        {deflateData.stats.rawBytes} Bytes
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {deflateData.stats.rawBits} raw bits (8b per character)
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255, 71, 87, 0.05)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255, 71, 87, 0.2)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--accent-rose)' }}>2. Raw LZ77 (28-Bit Triplets)</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-rose)', margin: '4px 0' }}>
                        {deflateData.stats.rawLzBytes} Bytes
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {deflateData.stats.rawLzBits} bits (Expands literals by +250%)
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255, 170, 0, 0.05)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255, 170, 0, 0.2)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--accent-amber)' }}>3. Pure Canonical Huffman</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-amber)', margin: '4px 0' }}>
                        {deflateData.stats.pureHuffBytes} Bytes
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        Cannot deduplicate multi-byte phrases
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0, 242, 254, 0.08)', padding: '14px', borderRadius: '6px', border: '1px solid var(--accent-cyan)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>4. DEFLATE (LZ77 + Huffman)</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)', margin: '4px 0' }}>
                        {deflateData.stats.totalCompressedBytes} Bytes
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                        {deflateData.stats.spaceSavingsPercent}% Savings ({deflateData.stats.compressionRatio}:1 Ratio)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Master Step-by-Step Mathematical Calculation Audit */}
                <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '20px', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#fff' }}>
                    Full Document Mathematical Size Reduction Breakdown (Before vs After)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '0.84rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Stage 1 Deduplication Metrics</div>
                      <div>Input Size: <strong>{deflateData.stats.rawBytes} bytes</strong></div>
                      <div>Literals: <strong>{deflateData.stats.literalsCount}</strong> (unmatched bytes)</div>
                      <div>Matches: <strong>{deflateData.stats.matchesCount}</strong> phrases</div>
                      <div>Deduplicated Chars: <strong>{deflateData.stats.bytesDeduplicated} bytes</strong></div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Bitstream Overhead Partitioning</div>
                      <div>Container Header: <strong>{deflateData.stats.headerBits} bits</strong> (12 Bytes)</div>
                      <div>Lit/Len Codebook Header: <strong>{deflateData.stats.litTreeBits} bits</strong></div>
                      <div>Dist Codebook Header: <strong>{deflateData.stats.distTreeBits} bits</strong></div>
                      <div>Payload Tokens: <strong>{deflateData.stats.runningPayloadBits} bits</strong></div>
                    </div>

                    <div style={{ background: 'rgba(0, 242, 254, 0.05)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                      <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px' }}>Final Net Arithmetic</div>
                      <div>Original Size: <strong>{deflateData.stats.rawBits} bits</strong></div>
                      <div>Final Size: <strong>{deflateData.stats.totalCompressedBits} bits</strong> ({deflateData.stats.totalCompressedBytes} B)</div>
                      <div>Net Bits Eliminated: <strong>{deflateData.stats.rawBits - deflateData.stats.totalCompressedBits} bits</strong></div>
                      <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginTop: '4px' }}>
                        Space Savings: {deflateData.stats.spaceSavingsPercent}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              PRODUCTION ARCHITECTURE GUIDE: WHEN TO USE IT VS WHEN NOT TO USE IT
              ========================================================================= */}
          <div className="decision-guide-card">
            <div className="decision-guide-header">
              <div className="decision-guide-title">
                <Zap size={22} color="var(--accent-cyan)" />
                <span>Production Architecture Guide: When to Use vs. When NOT to Use</span>
              </div>
              <span className="algo-type-tag" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.3)' }}>
                RFC 1951 DEFLATE Architecture
              </span>
            </div>

            <div className="decision-guide-grid">
              {/* When to Use Column */}
              <div className="decision-col when-to-use">
                <div className="decision-col-header">
                  <CheckCircle2 size={20} />
                  <span>When to Use DEFLATE (RFC 1951)</span>
                </div>
                <ul className="decision-items-list">
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Universal Cross-Platform Interchange:</strong> The gold standard format supported natively by every operating system, microcontroller, browser, and language runtime on Earth (ZIP archives, GZIP streams, PNG images, and PDF <code>/FlateDecode</code> streams).
                    </div>
                  </li>
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>HTTP Web Asset Delivery (GZIP / Deflate):</strong> Serving HTML, CSS, JavaScript, and SVG assets over HTTP/1.1 and HTTP/2 where legacy client support is mandatory.
                    </div>
                  </li>
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Git Source Control Repositories (zlib loose objects):</strong> Git stores all commits, trees, and blobs using zlib DEFLATE compression due to its stability, zero licensing risk, and deterministic reconstruction.
                    </div>
                  </li>
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Zero Patent / Royalty Liability:</strong> Developed deliberately by Phil Katz in 1993 with no proprietary patents, ensuring complete legal safety for enterprise software.
                    </div>
                  </li>
                </ul>
              </div>

              {/* When NOT to Use Column */}
              <div className="decision-col when-not-to-use">
                <div className="decision-col-header">
                  <XCircle size={20} />
                  <span>When NOT to Use It & Alternatives</span>
                </div>
                <ul className="decision-items-list">
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Ultra-High Throughput Real-Time Memory Pipelines (&gt; 1 GB/s):</strong> DEFLATE decompression typically peaks around 300–450 MB/s per core, making it a severe bottleneck for in-memory databases, IPC channels, and network RPCs.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> <strong>LZ4</strong> (3.5 GB/s decompression) or <strong>Snappy</strong>.
                      </div>
                    </div>
                  </li>
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Modern Systems Where Modern Codecs are Permitted:</strong> Modern codecs beat DEFLATE on both compression density and decompression speed simultaneously.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> <strong>Zstandard (Zstd)</strong> (15–25% higher ratio and 3× faster decompression) or <strong>Brotli</strong> (for web text assets).
                      </div>
                    </div>
                  </li>
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Micro-Payloads (&lt; 100 Bytes):</strong> The overhead of the 12-byte container header plus the dynamic Canonical Huffman codebook lengths causes positive file expansion.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> Store raw bytes (<code>STORE</code> mode) or use <strong>Zstandard Pre-Trained Dictionaries</strong>.
                      </div>
                    </div>
                  </li>
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Massive Files with Long-Distance Repetitions (&gt; 32 KB Horizon):</strong> RFC 1951 restricts the sliding window horizon to 32 KB. Duplicate assets separated by megabytes cannot be referenced.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> <strong>Zstandard Long Distance Matching (--long)</strong>, <strong>Brotli</strong>, or <strong>LZMA / 7-Zip</strong>.
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: DEDICATED LZW (LEMPEL-ZIV-WELCH) DYNAMIC DICTIONARY & DECODER STUDIO
          ========================================================================= */}
      {currentView === 'lzw' && (
        <div className="studio-container">
          <div className="studio-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  className="studio-breadcrumb" 
                  onClick={() => navigateTo('matrix')} 
                  style={{ margin: 0, padding: '4px 10px', fontSize: '0.78rem' }}>
                  <ArrowLeft size={14} /> All Algorithms
                </button>
                <span className="status-chip ready" style={{ fontSize: '0.75rem' }}>
                  Algorithm #9: Dynamic Dictionary (Welch 1984)
                </span>
                <span className="cxx-icon" style={{ fontSize: '0.75rem' }}>
                  C++20
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  lossless/lzw/lzw.hpp
                </span>
              </div>
              <h2 className="studio-title" style={{ marginTop: '10px' }}>
                LZW: <span style={{ color: 'var(--accent-cyan)' }}>Dynamic Dictionary & Lock-Step Decoder Engine</span>
              </h2>
              <p className="studio-subtitle">
                Visualizing Terry Welch's landmark 1984 algorithm: single-pass dynamic prefix dictionary synthesis where the decoder mirrors the encoder's dictionary state with <strong>zero transmitted codebook metadata</strong>.
              </p>
            </div>
          </div>

          {/* Navigation & Phase Tabs Bar */}
          <div className="phase-tabs-bar" style={{ marginBottom: '20px' }}>
            <button 
              className={`phase-tab-btn ${lzwAnimPhase === 'sync' ? 'active' : ''}`}
              onClick={() => setLzwAnimPhase('sync')}>
              <Layers size={16} /> Phase 1: Dual-Stream Synchronized State Machine (Encoder & Decoder Lock-Step)
            </button>
            <button 
              className={`phase-tab-btn ${lzwAnimPhase === 'kwkwk' ? 'active' : ''}`}
              onClick={() => setLzwAnimPhase('kwkwk')}>
              <AlertTriangle size={16} /> Phase 2: The KwKwK (Unseen Code) Special Case Lab
            </button>
            <button 
              className={`phase-tab-btn ${lzwAnimPhase === 'bitpacking' ? 'active' : ''}`}
              onClick={() => setLzwAnimPhase('bitpacking')}>
              <Cpu size={16} /> Phase 3: Code Width & Variable Bit Packing Lab
            </button>
            <button 
              className={`phase-tab-btn ${lzwAnimPhase === 'matrix' ? 'active' : ''}`}
              onClick={() => setLzwAnimPhase('matrix')}>
              <FileCode size={16} /> Phase 4: Real Document Data Matrix & Bitstream Audit
            </button>
          </div>

          {/* Presets & Parameters Bar */}
          <div className="anim-controls-bar" style={{ flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Presets:</span>
              {Object.entries(LZW_PRESETS).map(([key, item]) => (
                <button
                  key={key}
                  className={`chip-btn ${lzwPresetKey === key ? 'active' : ''}`}
                  style={lzwPresetKey === key ? { background: 'rgba(0, 242, 254, 0.2)', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' } : {}}
                  onClick={() => {
                    setLzwPresetKey(key);
                    setLzwInput(item.text);
                    setLzwStepIdx(0);
                    setLzwIsAutoBuilding(false);
                    lzwIsAutoBuildingRef.current = false;
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                  }}>
                  {item.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Max Code Width:</span>
                <select 
                  value={lzwMaxBits} 
                  onChange={e => { setLzwMaxBits(Number(e.target.value)); setLzwStepIdx(0); }}
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem' }}>
                  <option value={9}>9 Bits (512 entries)</option>
                  <option value={10}>10 Bits (1,024 entries)</option>
                  <option value={12}>12 Bits (4,096 entries, Standard)</option>
                  <option value={16}>16 Bits (65,536 entries)</option>
                </select>
              </div>
            </div>
          </div>

          {/* =========================================================================
              PHASE 1: DUAL-STREAM SYNCHRONIZED STATE MACHINE (ENCODER & DECODER LOCK-STEP)
              ========================================================================= */}
          {lzwAnimPhase === 'sync' && (
            <div className="tree-animator-card">
              {/* Animation Playback Controls Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    className="step-nav-btn"
                    disabled={lzwStepIdx <= 0}
                    onClick={() => handleLzwStepChange(lzwStepIdx - 1)}
                    title="Step Backward">
                    <StepBack size={16} />
                  </button>

                  <button 
                    className="step-nav-btn play-btn"
                    onClick={handleToggleLzwAutoBuild}
                    style={{ background: lzwIsAutoBuilding ? 'rgba(255, 71, 87, 0.2)' : 'rgba(0, 242, 254, 0.2)', borderColor: lzwIsAutoBuilding ? 'var(--accent-rose)' : 'var(--accent-cyan)', color: lzwIsAutoBuilding ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}
                    title={lzwIsAutoBuilding ? "Pause Auto-Advancement" : "Play Synchronized Audio Auto-Advancement"}>
                    {lzwIsAutoBuilding ? <Pause size={16} /> : <Play size={16} />}
                  </button>

                  <button 
                    className="step-nav-btn"
                    disabled={lzwStepIdx >= lzwData.decoderSteps.length - 1}
                    onClick={() => handleLzwStepChange(lzwStepIdx + 1)}
                    title="Step Forward">
                    <StepForward size={16} />
                  </button>

                  <button 
                    className="step-nav-btn"
                    onClick={() => {
                      setLzwStepIdx(0);
                      setLzwIsAutoBuilding(false);
                      lzwIsAutoBuildingRef.current = false;
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    title="Reset to Beginning">
                    <RotateCcw size={16} />
                  </button>

                  <button
                    className={`step-nav-btn ${lzwVoiceEnabled ? 'active' : ''}`}
                    onClick={() => {
                      const next = !lzwVoiceEnabled;
                      setLzwVoiceEnabled(next);
                      if (!next && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    title={lzwVoiceEnabled ? "Mute Voice Narration" : "Enable Voice Narration"}>
                    {lzwVoiceEnabled ? <Volume2 size={16} color="var(--accent-cyan)" /> : <VolumeX size={16} />}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Step <strong>{lzwStepIdx + 1}</strong> of <strong>{lzwData.decoderSteps.length}</strong>
                  </span>
                  <span className="status-chip ready" style={{ fontSize: '0.72rem' }}>
                    <ShieldCheck size={12} /> 100% Lock-Step Sync
                  </span>
                </div>
              </div>

              {/* Step Narrator Callout Box */}
              {lzwData.decoderSteps[lzwStepIdx] && (
                <div style={{ background: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px' }}>
                    <Info size={16} />
                    <span>Synchronized Decoder Execution</span>
                    {lzwData.decoderSteps[lzwStepIdx].isKwKwK && (
                      <span className="status-chip" style={{ background: 'rgba(255, 170, 0, 0.2)', color: 'var(--accent-amber)', borderColor: 'var(--accent-amber)', fontSize: '0.68rem' }}>
                        ⚡ KwKwK Edge Case Triggered!
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                    {lzwData.decoderSteps[lzwStepIdx].description}
                  </div>
                </div>
              )}

              {/* Dual-Stream Side-by-Side Visualization Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 140px minmax(0, 1fr)', gap: '18px', alignItems: 'stretch' }}>
                {/* 1. ENCODER ENGINE COLUMN */}
                <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Code2 size={16} /> Encoder Engine
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Input: {lzwInput.length} B</span>
                  </div>

                  {/* Input Character Tape */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Input Character Tape:</div>
                    <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {lzwInput.split('').map((ch, idx) => {
                        const isProcessed = idx <= lzwStepIdx;
                        const isCurrent = idx === lzwStepIdx;
                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              minWidth: '28px', 
                              height: '32px', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              borderRadius: '3px',
                              background: isCurrent ? 'rgba(0, 242, 254, 0.25)' : isProcessed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                              border: isCurrent ? '1px solid var(--accent-cyan)' : isProcessed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                              color: isCurrent ? 'var(--accent-cyan)' : isProcessed ? '#fff' : 'var(--text-muted)',
                              fontFamily: 'monospace',
                              fontWeight: isCurrent ? 800 : 500,
                              fontSize: '0.85rem'
                            }}>
                            {ch}
                            <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>{idx}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Encoder Dictionary Snapshot */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dynamic Dictionary:</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                        256 Initial + {lzwData.stats.dictEntriesCreated} Added
                      </span>
                    </div>

                    <div style={{ maxHeight: '220px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', textAlign: 'left' }}>
                            <th style={{ padding: '4px 8px' }}>Code</th>
                            <th style={{ padding: '4px 8px' }}>Phrase</th>
                            <th style={{ padding: '4px 8px' }}>Origin</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                            <td style={{ padding: '4px 8px' }}>0..255</td>
                            <td style={{ padding: '4px 8px' }}>Single Bytes (0x00..0xFF)</td>
                            <td style={{ padding: '4px 8px' }}>Pre-Agreed Base</td>
                          </tr>
                          {lzwData.decoderSteps.slice(1, lzwStepIdx + 1).map((s, idx) => {
                            if (!s.newCode) return null;
                            const isLatest = idx === lzwStepIdx - 1;
                            return (
                              <tr 
                                key={s.newCode} 
                                style={{ 
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  background: isLatest ? 'rgba(0, 242, 254, 0.15)' : 'transparent'
                                }}>
                                <td style={{ padding: '4px 8px', color: 'var(--accent-cyan)', fontWeight: 700 }}>{s.newCode}</td>
                                <td style={{ padding: '4px 8px', color: '#fff', fontWeight: 600 }}>"{s.addedEntry}"</td>
                                <td style={{ padding: '4px 8px', color: 'var(--accent-emerald)', fontSize: '0.7rem' }}>Dynamic Prefix</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 2. THE SERIAL TRANSMISSION CHANNEL */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 15, 29, 0.8)', border: '1px dashed rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)', padding: '12px 8px', textAlign: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    TRANSMISSION CHANNEL
                  </div>
                  <ArrowRight size={20} color="var(--accent-cyan)" />

                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Emitted Codes:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                      {lzwData.emittedCodes.map((code, idx) => {
                        const isCurrent = idx === lzwStepIdx;
                        const isPast = idx < lzwStepIdx;
                        return (
                          <div 
                            key={idx}
                            style={{ 
                              padding: '4px 6px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              background: isCurrent ? 'rgba(0, 242, 254, 0.3)' : isPast ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                              color: isCurrent ? 'var(--accent-cyan)' : isPast ? 'var(--accent-emerald)' : 'var(--text-muted)',
                              border: isCurrent ? '1px solid var(--accent-cyan)' : '1px solid transparent'
                            }}>
                            #{idx}: <strong>{code}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 'auto' }}>
                    🔒 Zero dictionary tables sent! Only codes cross the channel.
                  </div>
                </div>

                {/* 3. DECODER ENGINE COLUMN */}
                <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Cpu size={16} /> Decoder Engine
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Reconstructed: {lzwData.decoderSteps[lzwStepIdx]?.reconstructedBuffer?.length || 0} B
                    </span>
                  </div>

                  {/* Reconstructed Output Buffer */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Reconstructed Output Buffer:</div>
                    <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)', fontFamily: 'monospace', fontSize: '0.9rem', color: '#fff', letterSpacing: '0.05em' }}>
                      {lzwData.decoderSteps[lzwStepIdx]?.reconstructedBuffer || ''}
                      <span style={{ display: 'inline-block', width: '8px', height: '14px', background: 'var(--accent-emerald)', marginLeft: '4px', animation: 'pulse 1s infinite' }} />
                    </div>
                  </div>

                  {/* Decoder Reconstructed Dictionary */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reconstructed Dictionary:</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>
                        Lock-Step Mirror: {256 + Math.max(0, lzwStepIdx)} Entries
                      </span>
                    </div>

                    <div style={{ maxHeight: '220px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', textAlign: 'left' }}>
                            <th style={{ padding: '4px 8px' }}>Code</th>
                            <th style={{ padding: '4px 8px' }}>Phrase</th>
                            <th style={{ padding: '4px 8px' }}>Derived From</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                            <td style={{ padding: '4px 8px' }}>0..255</td>
                            <td style={{ padding: '4px 8px' }}>Single Bytes (0x00..0xFF)</td>
                            <td style={{ padding: '4px 8px' }}>Pre-Agreed Base</td>
                          </tr>
                          {lzwData.decoderSteps.slice(1, lzwStepIdx + 1).map((s, idx) => {
                            if (!s.newCode) return null;
                            const isLatest = idx === lzwStepIdx - 1;
                            return (
                              <tr 
                                key={s.newCode} 
                                style={{ 
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  background: isLatest ? 'rgba(16, 185, 129, 0.15)' : 'transparent'
                                }}>
                                <td style={{ padding: '4px 8px', color: 'var(--accent-emerald)', fontWeight: 700 }}>{s.newCode}</td>
                                <td style={{ padding: '4px 8px', color: '#fff', fontWeight: 600 }}>"{s.addedEntry}"</td>
                                <td style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>previous + first(current)</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PHASE 2: THE KWKWK (UNSEEN CODE) SPECIAL CASE LAB
              ========================================================================= */}
          {lzwAnimPhase === 'kwkwk' && (
            <div className="tree-animator-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <AlertTriangle size={24} color="var(--accent-amber)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
                    The Famous <span style={{ color: 'var(--accent-amber)' }}>KwKwK / cScSc</span> Decoder Edge Case
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Why the decoder receives a code that does not exist in its dictionary, and the mathematical rule that guarantees perfect recovery.
                  </span>
                </div>
              </div>

              {/* Theoretical Explanation Box */}
              <div style={{ background: 'rgba(255, 170, 0, 0.06)', border: '1px solid rgba(255, 170, 0, 0.3)', borderRadius: 'var(--radius-sm)', padding: '18px', marginBottom: '22px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--accent-amber)' }}>
                  1. When Does This Occur?
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                  This phenomenon occurs whenever the input sequence contains repeating substrings of the form <strong>cScSc</strong> (where <code>c</code> is a single character and <code>S</code> is a string, e.g. <code>ABABABA</code> or <code>AAAAAAA</code>).
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '0.84rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '6px' }}>What the Encoder Did:</div>
                    <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <li>Encoder creates a brand new dictionary entry for <code>P + c</code> with code <code>K</code>.</li>
                      <li>In the <em>very next character</em>, the input matches this brand new entry <code>K</code>!</li>
                      <li>The encoder flushes or emits code <code>K</code> immediately.</li>
                    </ol>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: 'var(--accent-rose)', fontWeight: 700, marginBottom: '6px' }}>What the Decoder Sees:</div>
                    <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <li>Decoder receives code <code>K</code>.</li>
                      <li>Decoder checks dictionary: <code>K</code> has not been added yet!</li>
                      <li><code>newCode == decoderDict.length</code> (exactly 1 beyond dictionary horizon).</li>
                    </ol>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '6px' }}>The Mathematical Resolution:</div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Because the entry was formed in the immediate previous step and extended by 1 char:
                      <div style={{ fontFamily: 'monospace', color: '#fff', background: 'rgba(16, 185, 129, 0.2)', padding: '6px 8px', borderRadius: '4px', margin: '6px 0', fontWeight: 700 }}>
                        entry = previous + first(previous)
                      </div>
                      For <code>ABABABA</code>: <code>"AB" + "A" = "ABA"</code>!
                    </div>
                  </div>
                </div>
              </div>

              {/* Concrete Step-by-Step KwKwK Proof */}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#fff' }}>
                  Interactive Trace of KwKwK on Pattern "ABABABA":
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px' }}>Step 1: Code 65 ('A')</div>
                    <div>Output: <strong>"A"</strong></div>
                    <div>Set: <code>previous = "A"</code></div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px' }}>Step 2: Code 66 ('B')</div>
                    <div>Output: <strong>"B"</strong></div>
                    <div>Added: <code>dict[256] = "AB"</code></div>
                    <div>Set: <code>previous = "B"</code></div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px' }}>Step 3: Code 256 ("AB")</div>
                    <div>Output: <strong>"AB"</strong></div>
                    <div>Added: <code>dict[257] = "BA"</code></div>
                    <div>Set: <code>previous = "AB"</code></div>
                  </div>

                  <div style={{ background: 'rgba(255, 170, 0, 0.1)', padding: '12px', borderRadius: '4px', border: '1px solid var(--accent-amber)', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--accent-amber)', fontWeight: 700, marginBottom: '4px' }}>Step 4: Code 258 (UNSEEN!)</div>
                    <div>Code 258 not in dict!</div>
                    <div style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                      Formula: "AB" + 'A' = "ABA"
                    </div>
                    <div>Output: <strong>"ABA"</strong>! Total: "ABABABA"</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PHASE 3: CODE WIDTH & VARIABLE BIT PACKING LAB
              ========================================================================= */}
          {lzwAnimPhase === 'bitpacking' && (
            <div className="tree-animator-card">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#fff' }}>
                Code Bit-Width Capacity & Continuous Bitstream Packing
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                How variable integer codes are serialized into a binary container without byte boundary waste.
              </p>

              {/* Bit Width Horizons Table */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>9-Bit Codes</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>512 Entries</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Range: [0..511]. Codes 256..511 for 256 phrases.</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>10-Bit Codes</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>1,024 Entries</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Range: [0..1023]. Codes 256..1023 for 768 phrases.</div>
                </div>

                <div style={{ background: 'rgba(0, 242, 254, 0.08)', border: '1px solid var(--accent-cyan)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>12-Bit Codes (Standard)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>4,096 Entries</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Standard GIF / TIFF limit. 3,840 dynamic multi-byte phrases.</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>16-Bit Codes</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>65,536 Entries</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Maximum supported dictionary depth for deep text archives.</div>
                </div>
              </div>

              {/* Bitstream Packing Illustration */}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>
                  Bit-Packing Mechanism (12-Bit Packing Demonstration):
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  Two 12-bit integer codes fit exactly into 3 continuous 8-bit bytes ($2 \times 12 = 24\text{ bits} = 3\text{ bytes}$):
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ minWidth: '120px', color: 'var(--accent-cyan)' }}>Code #0 (12b):</span>
                    <span style={{ padding: '4px 8px', background: 'rgba(0, 242, 254, 0.15)', borderRadius: '4px', color: '#fff' }}>
                      [ b11 b10 b9 b8 b7 b6 b5 b4 b3 b2 b1 b0 ]
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ minWidth: '120px', color: 'var(--accent-emerald)' }}>Code #1 (12b):</span>
                    <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '4px', color: '#fff' }}>
                      [ c11 c10 c9 c8 c7 c6 c5 c4 c3 c2 c1 c0 ]
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ minWidth: '120px', color: 'var(--accent-amber)' }}>Packed Bytes (3B):</span>
                    <span style={{ padding: '4px 8px', background: 'rgba(255, 170, 0, 0.15)', borderRadius: '4px', color: '#fff' }}>
                      Byte 0: [b7..b0] │ Byte 1: [c3..c0 b11..b8] │ Byte 2: [c11..c4]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PHASE 4: REAL DOCUMENT BENCHMARK & MATHEMATICAL SIZE REDUCTION AUDIT
              ========================================================================= */}
          {lzwAnimPhase === 'matrix' && (
            <div className="tree-animator-card">
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.25rem', color: '#fff' }}>
                Mathematical Size Reduction Breakdown (Before vs. After Arithmetic)
              </h3>

              {/* 4-Way Comparison Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>1. Uncompressed Original</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
                    {lzwData.stats.rawBytes} Bytes
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lzwData.stats.rawBits} raw bits (8b per char)</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>2. LZW 9-Bit Fixed Codes</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0' }}>
                    {Math.ceil((lzwData.stats.totalCodes * 9) / 8)} Bytes
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lzwData.stats.totalCodes * 9} payload bits</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>3. LZW 12-Bit Fixed Codes</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0' }}>
                    {Math.ceil((lzwData.stats.totalCodes * 12) / 8)} Bytes
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lzwData.stats.totalCodes * 12} payload bits</div>
                </div>

                <div style={{ background: 'rgba(0, 242, 254, 0.08)', border: '1px solid var(--accent-cyan)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>4. LZW1 Binary Archive</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', margin: '4px 0' }}>
                    {lzwData.stats.totalCompressedBytes} Bytes
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lzwData.stats.totalCompressedBits} bits (includes 14B container)</div>
                </div>
              </div>

              {/* Exact Reduction Breakdown Audit */}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '18px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#fff' }}>
                  Net Metric Calculation & Compression Summary:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '0.84rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Input & Dictionary Synthesis</div>
                    <div>Input Length: <strong>{lzwData.stats.rawBytes} bytes</strong> ({lzwData.stats.rawBits} bits)</div>
                    <div>Total Codes Emitted: <strong>{lzwData.stats.totalCodes} codes</strong></div>
                    <div>Phrases Synthesized: <strong>{lzwData.stats.dictEntriesCreated} multi-byte entries</strong></div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Overhead & Bit Allocation</div>
                    <div>Container Header: <strong>{lzwData.stats.headerBits} bits</strong> (14 Bytes)</div>
                    <div>Code Payload: <strong>{lzwData.stats.compressedPayloadBits} bits</strong> ({lzwData.stats.totalCodes} × {lzwData.stats.codeBits}b)</div>
                    <div>Dictionary Overhead Sent: <strong style={{ color: 'var(--accent-emerald)' }}>0 bits (Lock-step synthesized!)</strong></div>
                  </div>

                  <div style={{ background: 'rgba(0, 242, 254, 0.05)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px' }}>Final Net Arithmetic</div>
                    <div>Total Bits: <strong>{lzwData.stats.totalCompressedBits} bits</strong> ({lzwData.stats.totalCompressedBytes} B)</div>
                    <div>Compression Ratio: <strong>{lzwData.stats.compressionRatio} : 1</strong></div>
                    <div style={{ color: Number(lzwData.stats.spaceSavingsPercent) >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700, marginTop: '4px' }}>
                      Space Savings: {lzwData.stats.spaceSavingsPercent}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PRODUCTION ARCHITECTURE GUIDE: WHEN TO USE IT VS WHEN NOT TO USE IT
              ========================================================================= */}
          <div className="decision-guide-card">
            <div className="decision-guide-header">
              <div className="decision-guide-title">
                <Zap size={22} color="var(--accent-cyan)" />
                <span>Production Architecture Guide: When to Use vs. When NOT to Use</span>
              </div>
              <span className="algo-type-tag" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.3)' }}>
                LZW Dictionary Architecture
              </span>
            </div>

            <div className="decision-guide-grid">
              {/* When to Use Column */}
              <div className="decision-col when-to-use">
                <div className="decision-col-header">
                  <CheckCircle2 size={20} />
                  <span>When to Use LZW</span>
                </div>
                <ul className="decision-items-list">
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Palette-Indexed Graphics (GIF87a / GIF89a):</strong> The universal standard codec for 256-color palette animations and graphics with repeated color index runs.
                    </div>
                  </li>
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Deterministic Legacy Embedded Systems:</strong> Decompression requires zero dynamic memory allocations, zero tree balancing, and simple array index lookups ($O(N)$ streaming throughput).
                    </div>
                  </li>
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Prepress & Publishing Formats (TIFF / PostScript / PDF):</strong> TIFF image streams and PDF <code>/LZWDecode</code> filters where compatibility with historical publishing pipelines is mandatory.
                    </div>
                  </li>
                  <li className="decision-item">
                    <CheckCircle2 size={16} className="item-icon" color="var(--accent-emerald)" />
                    <div>
                      <strong>Zero Patent Liability Today:</strong> The original Unisys LZW patents expired worldwide in 2003/2004, making LZW completely royalty-free and legally safe for modern codebases.
                    </div>
                  </li>
                </ul>
              </div>

              {/* When NOT to Use Column */}
              <div className="decision-col when-not-to-use">
                <div className="decision-col-header">
                  <XCircle size={20} />
                  <span>When NOT to Use It & Alternatives</span>
                </div>
                <ul className="decision-items-list">
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Modern General-Purpose Text Compression:</strong> LZW was superseded by DEFLATE (1993) and Zstandard (2015), which achieve 25–40% higher compression ratios and faster decompression.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> <strong>DEFLATE</strong> (GZIP) or <strong>Zstandard (Zstd)</strong>.
                      </div>
                    </div>
                  </li>
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Short Non-Repeating Sequences (Expansion Hazard):</strong> Emitting 12-bit integer codes for 8-bit non-repeating characters causes a severe $+50\%$ positive file expansion.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> Store raw bytes (<code>STORE</code> mode).
                      </div>
                    </div>
                  </li>
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Continuous Analog Waveforms (Audio, Video, Photographs):</strong> Smooth continuous signals contain sensor noise with zero repeated multi-byte phrases.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> Transform coding like <strong>DCT (JPEG)</strong> or <strong>FLAC</strong>.
                      </div>
                    </div>
                  </li>
                  <li className="decision-item">
                    <XCircle size={16} className="item-icon" color="var(--accent-rose)" />
                    <div>
                      <strong>Unbounded Memory Streams Without Dictionary Flushes:</strong> Without periodic dictionary flushes (Clear Codes), the dictionary freezes once 4096 entries are reached.
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge-alt">Use Instead:</span> <strong>LZSS</strong> or <strong>LZ4</strong>.
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
