# Engine Harmony

> **Independent, Zero-Dependency Fashion Recommendation & Color Harmony Engine for Woobi**

Engine Harmony is a modular, standalone recommendation engine designed to analyze clothing color science, compatibility, silhouette balance, and multi-factor outfit harmony.

It is completely isolated inside `engine-harmony/` and operates with pure ECMAScript (ESM) without any external npm packages or runtime dependencies.

---

## 🌟 Key Capabilities

1. **Color Analysis & Science (`color/`)**
   - High-precision mathematical conversions across **Hex, sRGB, HSL, and CIE L\*a\*b\***.
   - Perceptual color difference calculation using **$\Delta E^*_{ab}$ (CIE76)**.
   - Comprehensive fashion palette dictionary with 50+ curated fashion swatches, synonyms, and neutrality classification (True Neutrals, Warm Earth Neutrals, Cool Slate/Navy Neutrals).
   - Evaluates **6 fundamental fashion harmonies**: Monochromatic, Analogous, Complementary, Split-Complementary, Triadic, and Neutral Anchor + Pop of Accent.
   - Detects optical vibration clashes, competing neons, and calculates WCAG relative contrast ratios.

2. **Style & Clothing Compatibility (`compatibility/`)**
   - **Formality Spectrum (1–10)**: Balances uniform formality with intentional contemporary smart-casual hybrids (e.g. tailored blazer + dark denim) while penalizing jarring mismatches (e.g. tuxedo blazer + gym sweatpants).
   - **Pattern & Print Balance**: Rewards solid staples and single-statement prints while penalizing loud print competition.
   - **Fabric Texture Synergy**: Evaluates tactile depth (e.g. chunky wool knitwear with rugged denim/leather).
   - **Rule of Proportions**: Evaluates volume contrast (e.g. fitted upper silhouette with wide-leg trouser).
   - **Seasonality & Weather**: Verifies climate consistency.

3. **Combinatorial Outfit Generation (`generator/`)**
   - Partitions wardrobe into slots: Tops, Bottoms, Shoes, Outerwear, One-Piece Dresses, and Accessories.
   - Supports **Core 3-Piece Look** (Top + Bottom + Shoes), **Layered Looks** (Top + Layer + Bottom + Shoes), and **One-Piece Looks**.
   - **Anchor Item Mode**: Builds complete outfits anchored around a specific user-selected garment.
   - **Diversity Engine**: Prevents repetitive suggestions using Jaccard distance deduplication.

4. **Multi-Factor Scoring & Explanations (`scoring/`)**
   - Multi-factor weighted score on a **0–100 scale**:
     $$\text{Score} = 0.35 \times \text{Color} + 0.25 \times \text{Formality} + 0.15 \times \text{Pattern/Texture} + 0.15 \times \text{Occasion} + 0.10 \times \text{Proportions}$$
   - Assigns prestige tiers: **Elite (90–100)**, **Harmonious (75–89)**, **Casual (60–74)**, and **Experimental (<60)**.
   - Generates transparent, human-readable stylist explanations detailing *why* an outfit works and providing improvement tips.

---

## 📁 Directory Structure

```text
engine-harmony/
├── README.md                           # Overview & Quick Start
├── run-tests.js                        # Master test runner
├── index.js                            # Primary EngineHarmony class & exports
├── docs/
│   ├── ARCHITECTURE.md                 # Mathematical models & fashion theory
│   ├── API_REFERENCE.md                # Full method signatures & contracts
│   └── INTEGRATION_GUIDE.md            # Step-by-step developer integration guide
├── color/
│   ├── ColorSpace.js                   # sRGB, HSL, CIE L*a*b*, Delta-E, Contrast
│   ├── ColorParser.js                  # Palette dictionary, hex/name resolution, neutrality
│   ├── ColorHarmony.js                 # 6 harmony models & multi-item palette evaluation
│   ├── ContrastAnalyzer.js             # Tonal contrast & vibration clash detection
│   └── index.js                        # Subsystem barrel exporter
├── compatibility/
│   ├── FormalityMatcher.js             # 1-10 formality spectrum & hybrid styling
│   ├── PatternMatcher.js               # Pattern density & print clash detection
│   ├── TextureMatcher.js               # Fabric weight & textural synergy
│   ├── SilhouetteMatcher.js            # Proportional balance (fitted vs wide)
│   ├── SeasonMatcher.js                # Climate & seasonal consistency
│   └── index.js                        # Subsystem barrel exporter
├── generator/
│   ├── WardrobeFilter.js               # Category slotting & laundry filtering
│   ├── OutfitBuilder.js                # Combinatorial ensemble generator
│   ├── DiversityEngine.js              # Jaccard distance diversity filter
│   └── index.js                        # Subsystem barrel exporter
├── scoring/
│   ├── HarmonyScorer.js                # Weighted scoring model (0-100)
│   ├── ExplanationGenerator.js         # Stylist rationales & advice
│   ├── Ranker.js                       # Tier assignment & ranking
│   └── index.js                        # Subsystem barrel exporter
├── types/
│   └── HarmonyContracts.js             # JSDoc contracts & interfaces
└── tests/
    ├── color.test.js                   # Color science & harmony tests (18 tests)
    ├── compatibility.test.js           # Formality, pattern, texture tests (9 tests)
    ├── generator.test.js               # Wardrobe filter & diversity tests (6 tests)
    ├── scoring.test.js                 # Scoring weights & tier tests (7 tests)
    └── engine-harmony.test.js          # Full E2E integration tests (5 tests)
```

---

## 🚀 Quick Start

### 1. Import and Initialize

```javascript
import { EngineHarmony } from './engine-harmony/index.js';

const engine = new EngineHarmony({
  minScoreThreshold: 65,
  defaultOccasion: 'casual'
});
```

### 2. Generate Recommendations from a Wardrobe

```javascript
const wardrobe = [
  { id: '1', name: 'Navy Poplin Shirt', category: 'Tops', color: 'midnight_navy', formality: 6 },
  { id: '2', name: 'Beige Chinos', category: 'Bottoms', color: 'champagne_beige', formality: 6 },
  { id: '3', name: 'White Leather Sneakers', category: 'Shoes', color: 'crisp_white', formality: 5 },
  { id: '4', name: 'Tailored Blazer', category: 'Tops', subCategory: 'Blazer', color: 'camel', formality: 8 }
];

const recommendations = engine.recommendOutfits(wardrobe, {
  occasion: 'smart_casual',
  limit: 3
});

console.log(recommendations[0]);
// Output:
// {
//   rank: 1,
//   score: 93,
//   tier: 'Elite',
//   badge: '✨ Elite Look',
//   explanation: 'Editorial Excellence: A flawlessly harmonized outfit...',
//   items: [ ... ],
//   subScores: { color: 95, formality: 92, patternTexture: 92, ... }
// }
```

### 3. Score a Custom User Outfit

```javascript
const scoreResult = engine.scoreOutfit({
  top: wardrobe[0],
  bottom: wardrobe[1],
  shoes: wardrobe[2]
}, { occasion: 'smart_casual' });

console.log(`Score: ${scoreResult.score}/100 [${scoreResult.tier}]`);
```

### 4. Complete a Partial Outfit (Anchor Mode)

```javascript
// User picked a shirt, find matching bottoms and shoes
const completed = engine.completeOutfit({ top: wardrobe[0] }, wardrobe);
```

### 5. Standalone Color Harmony Analysis

```javascript
const colorReport = engine.analyzeColorHarmony(['#101D2C', '#F5EAE0', '#FFFFFF']);
console.log(colorReport.harmonyType); // 'all_neutral'
console.log(colorReport.score);       // 98
```

---

## 🧪 Running Independent Tests

Run the dedicated test suite:

```bash
node engine-harmony/run-tests.js
```

Or run individual test modules using Node's native test runner:

```bash
node --test engine-harmony/tests/color.test.js
node --test engine-harmony/tests/compatibility.test.js
node --test engine-harmony/tests/generator.test.js
node --test engine-harmony/tests/scoring.test.js
node --test engine-harmony/tests/engine-harmony.test.js
```

