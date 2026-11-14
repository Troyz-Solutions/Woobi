/**
 * Woobi - 3D Studio Features
 * GarmentCatalog.js - Canonical Garment Definitions, Categories, Layering & Material Attributes
 */

export const GARMENT_CATEGORIES = {
  TOP: 'top',
  BOTTOM: 'bottom',
  SHOES: 'shoes',
  ACCESSORY: 'accessory'
};

export const GARMENT_CATALOG = {
  // --- TOPS ---
  tank: {
    id: 'tank',
    name: 'Crop Tank',
    category: GARMENT_CATEGORIES.TOP,
    color: 0xEDE3D2, // Cream / warm ivory
    roughness: 0.65,
    metalness: 0.05,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.0, y: 1.0, z: 1.0 },
    layer: 1
  },
  cardigan: {
    id: 'cardigan',
    name: 'Cream Cardigan',
    category: GARMENT_CATEGORIES.TOP,
    color: 0xE8DFCE, // Bouclé ribbed knit
    roughness: 0.78,
    metalness: 0.02,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.05, y: 1.02, z: 1.06 },
    layer: 2
  },
  blazer: {
    id: 'blazer',
    name: 'Tailored Blazer',
    category: GARMENT_CATEGORIES.TOP,
    color: 0x9E8F7A, // Taupe camel
    roughness: 0.58,
    metalness: 0.08,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.08, y: 1.05, z: 1.08 },
    layer: 3
  },
  navy_shirt: {
    id: 'navy_shirt',
    name: 'Navy Poplin Shirt',
    category: GARMENT_CATEGORIES.TOP,
    color: 0x243242, // Deep navy
    roughness: 0.45,
    metalness: 0.05,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.04, y: 1.02, z: 1.04 },
    layer: 2
  },
  striped_sweater: {
    id: 'striped_sweater',
    name: 'Striped Breton Knit',
    category: GARMENT_CATEGORIES.TOP,
    color: 0xEFEAE1, // Ecru with subtle navy
    roughness: 0.72,
    metalness: 0.02,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.06, y: 1.03, z: 1.06 },
    layer: 2
  },

  // --- BOTTOMS ---
  taupe_wide: {
    id: 'taupe_wide',
    name: 'Fluid Wide-Leg Trousers',
    category: GARMENT_CATEGORIES.BOTTOM,
    color: 0xB8AC96, // Sand taupe
    roughness: 0.60,
    metalness: 0.05,
    meshTargets: ['AvatarWaistHips', 'AvatarBottom_Left', 'AvatarBottom_Right'],
    layer: 1
  },
  wide_linen: {
    id: 'wide_linen',
    name: 'Wide Linen Trousers',
    category: GARMENT_CATEGORIES.BOTTOM,
    color: 0xD8CBB5, // Light linen oatmeal
    roughness: 0.75,
    metalness: 0.02,
    meshTargets: ['AvatarWaistHips', 'AvatarBottom_Left', 'AvatarBottom_Right'],
    layer: 1
  },
  denim: {
    id: 'denim',
    name: 'Straight Dark Denim',
    category: GARMENT_CATEGORIES.BOTTOM,
    color: 0x2A3645, // Indigo raw denim
    roughness: 0.70,
    metalness: 0.02,
    meshTargets: ['AvatarWaistHips', 'AvatarBottom_Left', 'AvatarBottom_Right'],
    layer: 1
  },

  // --- SHOES ---
  sneakers: {
    id: 'sneakers',
    name: 'White Platform Sneakers',
    category: GARMENT_CATEGORIES.SHOES,
    color: 0xF7F6F2, // Clean chalk white
    roughness: 0.35,
    metalness: 0.05,
    meshTargets: ['AvatarSneaker_Left', 'AvatarSneaker_Right'],
    layer: 1
  },
  loafers: {
    id: 'loafers',
    name: 'Polished Leather Loafers',
    category: GARMENT_CATEGORIES.SHOES,
    color: 0x2B231D, // Rich dark espresso
    roughness: 0.30,
    metalness: 0.12,
    meshTargets: ['AvatarSneaker_Left', 'AvatarSneaker_Right'],
    layer: 1
  },
  sandals: {
    id: 'sandals',
    name: 'Minimal Leather Slides',
    category: GARMENT_CATEGORIES.SHOES,
    color: 0x6E543C, // Tan saddle leather
    roughness: 0.40,
    metalness: 0.08,
    meshTargets: ['AvatarSneaker_Left', 'AvatarSneaker_Right'],
    layer: 1
  },

  // --- COMPLETE ATELIER WARDROBE CATALOG ---
  white_linen_shirt: {
    id: 'white_linen_shirt',
    name: 'White linen shirt',
    category: GARMENT_CATEGORIES.TOP,
    color: 0xF5F2EB,
    roughness: 0.75,
    metalness: 0.01,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.03, y: 1.02, z: 1.03 },
    layer: 2
  },
  cream_kurta: {
    id: 'cream_kurta',
    name: 'Cream kurta',
    category: GARMENT_CATEGORIES.TOP,
    color: 0xEDE3D0,
    roughness: 0.70,
    metalness: 0.01,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.04, y: 1.02, z: 1.04 },
    layer: 2
  },
  maroon_top: {
    id: 'maroon_top',
    name: 'Maroon top',
    category: GARMENT_CATEGORIES.TOP,
    color: 0x6E1D2D,
    roughness: 0.60,
    metalness: 0.02,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.0, y: 1.0, z: 1.0 },
    layer: 1
  },
  tailored_blazer: {
    id: 'tailored_blazer',
    name: 'Tailored blazer',
    category: GARMENT_CATEGORIES.TOP,
    color: 0x2D2E33,
    roughness: 0.50,
    metalness: 0.05,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.08, y: 1.05, z: 1.08 },
    layer: 3
  },
  terracotta_tee: {
    id: 'terracotta_tee',
    name: 'Terracotta tee',
    category: GARMENT_CATEGORIES.TOP,
    color: 0xBF5B3D,
    roughness: 0.65,
    metalness: 0.01,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.02, y: 1.01, z: 1.02 },
    layer: 1
  },
  indigo_kurti: {
    id: 'indigo_kurti',
    name: 'Indigo kurti',
    category: GARMENT_CATEGORIES.TOP,
    color: 0x20355B,
    roughness: 0.65,
    metalness: 0.02,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.03, y: 1.02, z: 1.03 },
    layer: 2
  },
  beige_chinos: {
    id: 'beige_chinos',
    name: 'Beige chinos',
    category: GARMENT_CATEGORIES.BOTTOM,
    color: 0xC2B299,
    roughness: 0.75,
    metalness: 0.02,
    meshTargets: ['AvatarWaistHips', 'AvatarBottom_Left', 'AvatarBottom_Right'],
    layer: 1
  },
  dark_denim: {
    id: 'dark_denim',
    name: 'Dark denim',
    category: GARMENT_CATEGORIES.BOTTOM,
    color: 0x1C2738,
    roughness: 0.70,
    metalness: 0.02,
    meshTargets: ['AvatarWaistHips', 'AvatarBottom_Left', 'AvatarBottom_Right'],
    layer: 1
  },
  dark_skirt: {
    id: 'dark_skirt',
    name: 'Dark skirt',
    category: GARMENT_CATEGORIES.BOTTOM,
    color: 0x1E1E22,
    roughness: 0.60,
    metalness: 0.02,
    meshTargets: ['AvatarWaistHips', 'AvatarBottom_Left', 'AvatarBottom_Right'],
    layer: 1
  },
  cream_palazzo: {
    id: 'cream_palazzo',
    name: 'Cream palazzo',
    category: GARMENT_CATEGORIES.BOTTOM,
    color: 0xF0E9DC,
    roughness: 0.80,
    metalness: 0.01,
    meshTargets: ['AvatarWaistHips', 'AvatarBottom_Left', 'AvatarBottom_Right'],
    layer: 1
  },
  white_sneakers: {
    id: 'white_sneakers',
    name: 'White sneakers',
    category: GARMENT_CATEGORIES.SHOES,
    color: 0xF8F8F8,
    roughness: 0.35,
    metalness: 0.02,
    meshTargets: ['AvatarSneaker_Left', 'AvatarSneaker_Right'],
    layer: 1
  },
  tan_loafers: {
    id: 'tan_loafers',
    name: 'Tan loafers',
    category: GARMENT_CATEGORIES.SHOES,
    color: 0x8C5432,
    roughness: 0.35,
    metalness: 0.08,
    meshTargets: ['AvatarSneaker_Left', 'AvatarSneaker_Right'],
    layer: 1
  },
  black_trainers: {
    id: 'black_trainers',
    name: 'Black trainers',
    category: GARMENT_CATEGORIES.SHOES,
    color: 0x1B1B1C,
    roughness: 0.45,
    metalness: 0.02,
    meshTargets: ['AvatarSneaker_Left', 'AvatarSneaker_Right'],
    layer: 1
  },
  brown_sandals: {
    id: 'brown_sandals',
    name: 'Brown sandals',
    category: GARMENT_CATEGORIES.SHOES,
    color: 0x5E3924,
    roughness: 0.40,
    metalness: 0.05,
    meshTargets: ['AvatarSneaker_Left', 'AvatarSneaker_Right'],
    layer: 1
  },
  leather_watch: {
    id: 'leather_watch',
    name: 'Leather watch',
    category: GARMENT_CATEGORIES.ACCESSORY,
    color: 0x66442A,
    roughness: 0.35,
    metalness: 0.60,
    layer: 1
  }
};

export const DEFAULT_OUTFIT = {
  top: 'tank',
  bottom: 'taupe_wide',
  shoes: 'sneakers'
};

export function getGarmentRecord(garmentId) {
  if (!garmentId) return null;
  const raw = String(garmentId).trim();
  const normalizedId = raw === 'wide_linen' ? 'taupe_wide' : raw;
  if (GARMENT_CATALOG[normalizedId]) return GARMENT_CATALOG[normalizedId];

  const lower = normalizedId.toLowerCase().replace(/[\s-]+/g, '_');
  if (lower === 'wide_linen') return GARMENT_CATALOG['taupe_wide'];
  if (GARMENT_CATALOG[lower]) return GARMENT_CATALOG[lower];

  const ALIAS_MAP = {
    'wide_linen': 'taupe_wide',
    'item_1': 'navy_shirt',
    'item_2': 'beige_chinos',
    'item_3': 'cream_kurta',
    'item_4': 'white_sneakers',
    'item_5': 'maroon_top',
    'item_6': 'dark_skirt',
    'item_7': 'white_linen_shirt',
    'item_8': 'dark_denim',
    'item_9': 'tan_loafers',
    'item_10': 'leather_watch',
    'item_11': 'black_trainers',
    'item_12': 'brown_sandals',
    'item_13': 'cream_palazzo',
    'item_14': 'indigo_kurti',
    'item_15': 'terracotta_tee',
    'item_16': 'tailored_blazer'
  };

  const resolvedKey = ALIAS_MAP[lower] || ALIAS_MAP[raw];
  return (resolvedKey && GARMENT_CATALOG[resolvedKey]) || null;
}
