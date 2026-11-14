/**
 * Engine Harmony - Contracts, Types & Interface Specifications
 */

/**
 * @typedef {Object} Garment
 * @property {string} id Unique identifier
 * @property {string} name Descriptive garment name
 * @property {string} category 'Tops' | 'Bottoms' | 'Shoes' | 'Accessories' | 'Dresses'
 * @property {string} [subCategory] e.g. 'Shirt', 'Pant', 'Blazer', 'Sneaker'
 * @property {string|number} [color] Hex string or preset color name
 * @property {string} [pattern] 'solid' | 'striped' | 'plaid' | 'floral' | 'textured'
 * @property {string} [material] 'cotton' | 'linen' | 'wool' | 'denim' | 'silk' | 'leather'
 * @property {number|string} [formality] 1-10 or 'casual' | 'smart_casual' | 'formal'
 * @property {string} [fit] 'fitted' | 'slim' | 'regular' | 'relaxed' | 'oversized' | 'wide'
 * @property {string} [condition] 'clean' | 'dirty'
 * @property {Array<string>|string} [season] 'spring' | 'summer' | 'autumn' | 'winter' | 'all_season'
 */

/**
 * @typedef {Object} Outfit
 * @property {string} id
 * @property {string} type 'standard' | 'layered' | 'one_piece'
 * @property {Garment} [top]
 * @property {Garment} [bottom]
 * @property {Garment} [shoes]
 * @property {Garment} [outerwear]
 * @property {Garment} [onePiece]
 * @property {Array<Garment>} [accessories]
 * @property {Array<Garment>} items
 */

/**
 * @typedef {Object} RecommendationContext
 * @property {string} [occasion] 'casual' | 'smart_casual' | 'business' | 'formal'
 * @property {string} [season] 'spring' | 'summer' | 'autumn' | 'winter'
 * @property {string} [anchorItemId] Garment ID to anchor the outfit around
 * @property {number} [limit=5] Max recommendations to return
 * @property {boolean} [cleanOnly=true] Whether to filter out dirty items
 * @property {boolean} [includeLayered=true]
 */

export const EngineHarmonyContract = {
  name: 'EngineHarmony',
  version: '1.0.0',
  methods: [
    'recommendOutfits',
    'scoreOutfit',
    'completeOutfit',
    'findAlternativeItems',
    'analyzeColorHarmony'
  ]
};

