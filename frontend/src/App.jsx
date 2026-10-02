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

// Master Algorithm Registry
const ALGORITHMS_CATALOG = [
  {
    id: 'prefix-tree',
    name: 'Binary Prefix Tree & Kraft Rule',
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
    id: 'huffman',
    name: 'Canonical Huffman Coding',
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
    id: 'rle',
    name: 'Run-Length Encoding (RLE) & PackBits',
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
    id: 'shannon-fano',
    name: 'Shannon-Fano Coding',
    category: 'lossless',
    type: 'Entropy Coding',
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
    id: 'arithmetic',
    name: 'Arithmetic / Integer Range Coding',
    category: 'lossless',
    type: 'Fractional Entropy',
    status: 'pending',
    formula: '[L, R) ← [L + (R-L)P_low, L + (R-L)P_high)',
    ratio: '1.8:1 – 5:1',
    desc: 'Encodes an entire message into a single fractional number in [0, 1). Breaks the 1-bit-per-symbol barrier of Huffman by assigning true fractional bits.',
    pros: ['Achieves true Shannon entropy H(X)', 'Optimal for highly skewed probabilities (p > 0.5)'],
    flaws: ['Computationally heavy bit-shifts & multiplications', 'Integer register underflow'],
    whenToUse: 'Highly skewed symbol probabilities (p > 90%) where fractional bits are required (H.264/CABAC).',
    whenNotToUse: 'High-throughput pipelines where multi-precision math and register normalization limit GB/s speed.'
  },
  {
    id: 'ans',
    name: 'Asymmetric Numeral Systems (ANS / rANS)',
    category: 'lossless',
    type: 'State-of-the-Art Entropy',
    status: 'pending',
    formula: 'x\' = C(s, x) = ⌊x / l_s⌋ · M + b_s + (x mod l_s)',
    ratio: '2:1 – 5:1',
    desc: 'Created by Jarosław Duda in 2006. Powers modern Zstandard (Meta) and Apple LZFSE. Delivers the compression density of Arithmetic coding at the speed of Huffman.',
    pros: ['State-of-the-art compression speed (GB/s)', 'Exact fractional entropy precision'],
    flaws: ['Reverses symbol order (LIFO stack behavior)', 'Complex state table normalization'],
    whenToUse: 'Modern production pipelines (Zstd, LZFSE) demanding Arithmetic density at Huffman speed.',
    whenNotToUse: 'Ultra-simple microcontrollers where state inversion (LIFO reverse decoding) complicates buffers.'
  },
  {
    id: 'lz77',
    name: 'LZ77 (Sliding Window)',
    category: 'lossless',
    type: 'Dictionary Coding',
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
    id: 'lz78-lzw',
    name: 'LZ78 & LZW (Trie Dictionary)',
    category: 'lossless',
    type: 'Dynamic Dictionary',
    status: 'pending',
    formula: 'Output: Dictionary Index [0..4095]',
    ratio: '2:1 – 6:1',
    desc: 'Maintains an explicit prefix trie dictionary built dynamically during encoding. Used historically in GIF images and Unix compress.',
    pros: ['Fast single-pass dynamic dictionary learning', 'No lookahead window needed'],
    flaws: ['Dictionary memory explosion requires freeze/flush logic', 'Patent dispute legacy'],
    whenToUse: 'Single-pass dynamic dictionary streams without lookahead window limits (GIF, Unix compress).',
    whenNotToUse: 'Massive datasets without dictionary flush logic where memory explodes beyond 4096 entries.'
  },
  {
    id: 'bwt-mtf',
    name: 'Burrows-Wheeler Transform (BWT) & MTF',
    category: 'lossless',
    type: 'Reversible Transform',
    status: 'pending',
    formula: 'L = BWT(S) via Sorted Cyclic Shifts',
    ratio: '2.5:1 – 8:1',
    desc: 'Invertible permutation that groups identical characters together without destroying information. Followed by Move-To-Front (MTF) to create run-length clusters (bzip2).',
    pros: ['Incredible clustering for text and source code', 'Reversible without transmitting rotations'],
    flaws: ['Block-based memory requirement', 'Slow sorting without Suffix Array (SA-IS)'],
    whenToUse: 'Large blocks of text, source code, or genome data with repeated context patterns (bzip2).',
    whenNotToUse: 'Low-latency streaming or small buffers (< 64KB) where sorting cyclic shifts adds high latency.'
  },
  // Lossy Section
  {
    id: 'quantization',
    name: 'Uniform & Lloyd-Max Scalar Quantization',
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
    id: 'dct-jpeg',
    name: '8×8 2D DCT & JPEG Quantization Matrix',
    category: 'lossy',
    type: 'Transform Coding',
    status: 'pending',
    formula: 'F(u,v) = ¼ C(u)C(v) ∑∑ f(x,y) cos(...)',
    ratio: '10:1 – 50:1',
    desc: 'Transforms 8×8 pixel blocks from spatial domain to frequency domain. Discards unnoticeable high spatial frequencies along the Zig-Zag scan path.',
    pros: ['Massive energy compaction into DC/low-frequency coefficients', 'Tunable quality scale 1-100'],
    flaws: ['Block boundary artifacts at low bitrates', 'Ringing / Gibbs phenomenon around sharp edges'],
    whenToUse: 'Continuous-tone photographic images where high spatial frequencies can be discarded.',
    whenNotToUse: 'Pixel art, high-contrast UI graphics, or text screenshots where 8x8 block blur occurs.'
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'matrix';
  });
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

  // Hovered byte info for interactive matrix inspection
  const [hoveredByteInfo, setHoveredByteInfo] = useState(null);

  const playTimerRef = useRef(null);
  const walkerCurrentNodeRef = useRef(null);

  // Sync hash routing on popstate / hashchange
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentView(hash || 'matrix');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (viewId) => {
    window.location.hash = viewId;
    setCurrentView(viewId);
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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (activeSpeechTimeoutRef.current) clearTimeout(activeSpeechTimeoutRef.current);
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

  const filteredAlgos = useMemo(() => {
    if (filterCategory === 'all') return ALGORITHMS_CATALOG;
    return ALGORITHMS_CATALOG.filter(a => a.category === filterCategory);
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
                All (12)
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'lossless' ? 'active' : ''}`}
                onClick={() => setFilterCategory('lossless')}>
                Lossless (9)
              </button>
              <button 
                className={`filter-btn ${filterCategory === 'lossy' ? 'active' : ''}`}
                onClick={() => setFilterCategory('lossy')}>
                Lossy (3)
              </button>
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          VIEW 1: FRONT PAGE DATA MATRIX CARDS
          ========================================================================= */}
      {currentView === 'matrix' && (
        <div className="matrix-dashboard">
          <div className="matrix-hero">
            <h2 className="matrix-hero-title">
              Compression Algorithms <span>Data Matrix & Practice Lab</span>
            </h2>
            <p className="matrix-hero-desc">
              Master every compression algorithm from mathematical theory to real binary file bytes.
              Click any active card below to immediately enter its dedicated studio, or switch algorithms 
              seamlessly without reloading the page.
            </p>
          </div>

          <div className="matrix-grid-container">
            {/* Lossless Section */}
            {(filterCategory === 'all' || filterCategory === 'lossless') && (
              <>
                <div className="section-heading">
                  <span className="section-heading-badge lossless">LOSSLESS COMPRESSION</span>
                  <span>Exact Bit-Level Invertibility (0% Distortion)</span>
                </div>
                <div className="cards-grid">
                  {filteredAlgos.filter(a => a.category === 'lossless').map(algo => (
                    <div 
                      key={algo.id} 
                      className={`algo-card ${algo.status === 'ready' ? 'active-lab' : ''}`}>
                      <div className="card-top">
                        <div className="card-badges-row">
                          <span className="algo-type-tag">{algo.type}</span>
                          <span className={`status-chip ${algo.status}`}>
                            {algo.status === 'ready' ? '● Active Studio' : 'Awaiting Your Order'}
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
                        ) : (
                          <button className="btn-pending" title="Will be built strictly when you instruct next">
                            Pending Order
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Lossy Section */}
            {(filterCategory === 'all' || filterCategory === 'lossy') && (
              <>
                <div className="section-heading" style={{ marginTop: '50px' }}>
                  <span className="section-heading-badge lossy">LOSSY COMPRESSION</span>
                  <span>Rate-Distortion & Controlled Perceptual Transformation</span>
                </div>
                <div className="cards-grid">
                  {filteredAlgos.filter(a => a.category === 'lossy').map(algo => (
                    <div 
                      key={algo.id} 
                      className={`algo-card ${algo.status === 'ready' ? 'active-lab' : ''}`}>
                      <div className="card-top">
                        <div className="card-badges-row">
                          <span className="algo-type-tag">{algo.type}</span>
                          <span className={`status-chip ${algo.status}`}>
                            {algo.status === 'ready' ? '● Active Studio' : 'Awaiting Your Order'}
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
                        ) : (
                          <button className="btn-pending" title="Will be built strictly when you instruct next">
                            Pending Order
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
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
              <span className="section-heading-badge lossless">
                {currentView === 'huffman' ? 'ALGORITHM #2: OPTIMAL PREFIX CODE' : 'ALGORITHM #1: FOUNDATION'}
              </span>
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
              <span className="section-heading-badge lossless">
                ALGORITHM #7: SLIDING WINDOW DICTIONARY
              </span>
              <h2 className="matrix-hero-title" style={{ marginTop: '8px', fontSize: '2rem' }}>
                LZ77 (Lempel-Ziv 1977): <span>Animated Sliding Window & Real Data Matrix</span>
              </h2>
            </div>
            <div className="cxx-badge">
              <span className="cxx-icon">C++17</span>
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
    </div>
  );
}
