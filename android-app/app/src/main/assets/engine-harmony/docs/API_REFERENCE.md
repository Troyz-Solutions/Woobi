# Engine Harmony — Public API Reference

The `EngineHarmony` class is the primary entry point for all algorithmic styling and outfit generation workflows. It can be imported directly in any ESM environment (Node.js $\ge 18$ or modern browser `<script type="module">`).

```javascript
import { EngineHarmony } from './engine-harmony/index.js';
const engine = new EngineHarmony();
```

---

## 1. Class: `EngineHarmony`

### Constructor
```javascript
new EngineHarmony(options)
```
- **`options`** *(Object, optional)*:
  - `weights` *(Object, optional)*: Custom scoring weights summing to $1.0$.
    - `color`: Number (default: `0.35`)
    - `formality`: Number (default: `0.25`)
    - `patternTexture`: Number (default: `0.15`)
    - `occasion`: Number (default: `0.15`)
    - `silhouette`: Number (default: `0.10`)
  - `minScoreThreshold` *(Number, optional)*: Minimum total score for an outfit to be recommended. Default: `60`.
  - `diversityThreshold` *(Number, optional)*: Minimum Jaccard distance between generated outfits. Default: `0.55`.

---

### Method: `recommendOutfits(wardrobe, options)`

Generates a ranked list of styled outfits from an array of wardrobe items.

#### Parameters
- **`wardrobe`** *(Array&lt;GarmentItem&gt;, required)*: Array of wardrobe item objects.
- **`options`** *(Object, optional)*:
  - `occasion` *(string, optional)*: Target occasion (e.g. `'casual'`, `'smart_casual'`, `'business'`, `'formal'`). Default: `'smart_casual'`.
  - `season` *(string, optional)*: Target season (`'spring'`, `'summer'`, `'fall'`, `'winter'`, `'all_season'`). Default: `'all_season'`.
  - `anchors` *(Array&lt;GarmentItem&gt;, optional)*: Array of user-locked garments that must appear in every generated outfit.
  - `maxOutfits` *(number, optional)*: Maximum number of outfits to return. Default: `10`.
  - `includeOuterwear` *(boolean, optional)*: Whether to synthesize 4-piece layered looks. Default: `true`.
  - `allowOnePiece` *(boolean, optional)*: Whether to synthesize dress/jumpsuit looks. Default: `true`.
  - `diversityThreshold` *(number, optional)*: Override Jaccard distance threshold. Default: `0.55`.

#### Return Value
Returns an `Array<OutfitRecommendation>` sorted in descending order of `overallScore`.

```typescript
interface OutfitRecommendation {
  id: string;                         // Unique ID, e.g. "outfit-1731584000000-0"
  items: GarmentItem[];               // Array of garments in this ensemble
  overallScore: number;               // Scaled 0 to 100
  tier: "Elite" | "Harmonious" | "Casual" | "Experimental";
  breakdown: {
    colorScore: number;               // 0 to 100
    formalityScore: number;           // 0 to 100
    patternScore: number;             // 0 to 100
    textureScore: number;             // 0 to 100
    occasionScore: number;            // 0 to 100
    silhouetteScore: number;          // 0 to 100
    harmonyType: string;              // e.g. "Neutral + Accent", "Monochromatic", "Analogous"
    hasClash: boolean;                // true if severe clash detected
    contrastRatio: number;            // WCAG contrast between dominant items
  };
  explanation: {
    title: string;                    // Short headline, e.g. "Refined Neutral Ensemble"
    summary: string;                  // Stylist narrative explanation
    stylingTips: string[];            // Actionable advice for the user
  };
}
```

#### Example
```javascript
const wardrobe = [
  { id: 't1', name: 'White Linen Shirt', slot: 'top', color: '#FFFFFF', formality: 'smart_casual' },
  { id: 'b1', name: 'Navy Chinos', slot: 'bottom', color: '#000080', formality: 'smart_casual' },
  { id: 's1', name: 'Tan Suede Loafers', slot: 'shoes', color: '#D2B48C', formality: 'smart_casual' }
];

const recommendations = engine.recommendOutfits(wardrobe, {
  occasion: 'smart_casual',
  maxOutfits: 5
});

console.log(recommendations[0].overallScore); // e.g. 94
console.log(recommendations[0].explanation.title);
```

---

### Method: `scoreOutfit(items, options)`

Evaluates and scores a specific, user-assembled outfit without performing combinatorial generation.

#### Parameters
- **`items`** *(Array&lt;GarmentItem&gt;, required)*: Array of items that form the outfit.
- **`options`** *(Object, optional)*:
  - `occasion` *(string, optional)*: Target occasion (default: `'smart_casual'`).
  - `season` *(string, optional)*: Target season (default: `'all_season'`).

#### Return Value
Returns a scored `OutfitRecommendation` object with `overallScore`, `tier`, `breakdown`, and `explanation`.

#### Example
```javascript
const result = engine.scoreOutfit([topItem, bottomItem, shoesItem], {
  occasion: 'business'
});

if (result.breakdown.hasClash) {
  console.warn("Clash detected:", result.explanation.summary);
}
```

---

### Method: `completeOutfit(wardrobe, partialItems, options)`

Takes one or more pre-selected items (e.g. a favorite blazer or pair of trousers) and searches the wardrobe to find the best complementary pieces to complete the outfit.

#### Parameters
- **`wardrobe`** *(Array&lt;GarmentItem&gt;, required)*: Available wardrobe pool.
- **`partialItems`** *(Array&lt;GarmentItem&gt;, required)*: 1 or more anchor items.
- **`options`** *(Object, optional)*: Same options as `recommendOutfits`.

#### Return Value
Returns an `Array<OutfitRecommendation>` where every outfit contains all `partialItems`.

---

### Method: `findAlternativeItems(wardrobe, outfit, targetSlot, options)`

Given an existing outfit and a slot (e.g. `'shoes'` or `'outerwear'`), finds alternative items from the wardrobe that can seamlessly replace the current item in that slot while preserving or improving outfit harmony.

#### Parameters
- **`wardrobe`** *(Array&lt;GarmentItem&gt;, required)*: Available wardrobe pool.
- **`outfit`** *(OutfitRecommendation | Array&lt;GarmentItem&gt;, required)*: The reference outfit.
- **`targetSlot`** *(string, required)*: Slot to substitute (`'top'`, `'bottom'`, `'shoes'`, `'outerwear'`).
- **`options`** *(Object, optional)*: Same scoring options as `scoreOutfit`.

#### Return Value
Returns an `Array<{ item: GarmentItem, outfit: OutfitRecommendation, deltaScore: number }>` sorted by score descending.

---

### Method: `analyzeColorHarmony(items)`

Standalone utility to analyze only the chromatic harmony of a set of items or hex colors.

#### Parameters
- **`items`** *(Array&lt;GarmentItem | string&gt;, required)*: Array of garment items or color strings (hex/name).

#### Return Value
```javascript
{
  score: 92,
  harmonyType: "Neutral + Accent",
  contrastRatio: 7.4,
  palette: [
    { hex: "#FFFFFF", name: "White", neutrality: "true_neutral" },
    { hex: "#1A2B4C", name: "Navy", neutrality: "cool_neutral" },
    { hex: "#B85D19", name: "Rust", neutrality: "accent" }
  ],
  hasClash: false,
  clashes: []
}
```

---

## 2. Garment Data Model Contract

Items passed to `EngineHarmony` follow this flexible schema. Unspecified properties are safely defaulted or inferred.

```typescript
interface GarmentItem {
  id: string | number;               // Unique identifier
  name: string;                      // Display name (e.g. "Slim Oxford Shirt")
  slot?: "top" | "bottom" | "shoes" | "outerwear" | "one_piece" | "accessory";
  category?: string;                 // e.g. "shirt", "jeans", "boots"
  color?: string;                    // Hex (e.g. "#1A2B3C") or name ("Navy")
  colors?: string[];                 // Secondary colors if patterned
  pattern?: "solid" | "striped" | "plaid" | "floral" | "textured" | "graphic" | string;
  material?: "cotton" | "linen" | "wool" | "denim" | "silk" | "leather" | string;
  formality?: "casual" | "smart_casual" | "business" | "formal" | number; // 1-10 or string
  fit?: "slim" | "fitted" | "regular" | "relaxed" | "oversized";
  season?: "spring" | "summer" | "fall" | "winter" | "all_season";
  condition?: "clean" | "dirty" | "in_wash";
}
```

---

## 3. Direct Subsystem Imports

For advanced use cases or low-level color analysis, all subsystems can be imported individually:

```javascript
// Color Science
import {
  ColorSpace,
  ColorParser,
  ColorHarmony,
  ContrastAnalyzer
} from './engine-harmony/color/index.js';

// Style Compatibility
import {
  FormalityMatcher,
  PatternMatcher,
  TextureMatcher,
  SilhouetteMatcher,
  SeasonMatcher
} from './engine-harmony/compatibility/index.js';

// Outfit Generation
import {
  WardrobeFilter,
  OutfitBuilder,
  DiversityEngine
} from './engine-harmony/generator/index.js';

// Scoring & Ranking
import {
  HarmonyScorer,
  ExplanationGenerator,
  Ranker
} from './engine-harmony/scoring/index.js';
```

