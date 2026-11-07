/**
 * Woobi - 3D Studio Features
 * CustomizationPresets.js - Presets for Skin Tones, Hair Colors, Hair Styles & Proportions
 */

export const SKIN_TONE_PRESETS = [
  { id: 'alabaster', name: 'Warm Alabaster', hex: '#F7E7DC', tone: 'fair' },
  { id: 'porcelain', name: 'Warm Porcelain', hex: '#F3D5C6', tone: 'light' },
  { id: 'golden_beige', name: 'Golden Beige', hex: '#DEB192', tone: 'medium' },
  { id: 'olive', name: 'Warm Olive', hex: '#C69970', tone: 'medium_deep' },
  { id: 'honey', name: 'Rich Honey', hex: '#A26F47', tone: 'deep' },
  { id: 'espresso', name: 'Deep Espresso', hex: '#523420', tone: 'rich' }
];

export const HAIR_COLOR_PRESETS = [
  { id: 'onyx', name: 'Midnight Onyx', hex: '#1E120A' },
  { id: 'espresso', name: 'Dark Espresso', hex: '#2B1A12' },
  { id: 'chestnut', name: 'Rich Chestnut', hex: '#4A2C1D' },
  { id: 'copper', name: 'Warm Copper', hex: '#8B4513' },
  { id: 'honey_blonde', name: 'Honey Golden Blonde', hex: '#C29864' },
  { id: 'platinum', name: 'Nordic Platinum', hex: '#E6DECE' },
  { id: 'silver', name: 'Smoky Silver', hex: '#A8A6A4' }
];

export const HAIR_STYLES = [
  { id: 'bun', name: 'Signature High Bun Updo', icon: 'bun' },
  { id: 'bob', name: 'Blunt French Bob', icon: 'bob' },
  { id: 'pixie', name: 'Tapered Textured Pixie', icon: 'pixie' },
  { id: 'ponytail', name: 'Sleek Mid Ponytail', icon: 'ponytail' }
];

export const BODY_PROPORTIONS = [
  { id: 'slim_fit', name: 'Slim & Fit', scaleX: 0.92, scaleY: 1.02, scaleZ: 0.90 },
  { id: 'regular', name: 'Classic Balanced', scaleX: 1.00, scaleY: 1.00 },
  { id: 'petite', name: 'Petite Slender', scaleX: 0.94, scaleY: 0.94 },
  { id: 'tall', name: 'Tall Runway', scaleX: 0.98, scaleY: 1.06 },
  { id: 'athletic', name: 'Athletic Sculpted', scaleX: 1.05, scaleY: 1.02 },
  { id: 'curvy', name: 'Soft Curvaceous', scaleX: 1.08, scaleY: 1.00 }
];

export const BEARD_STYLES = [
  { id: 'clean', name: 'Clean Shaven', length: 0, density: 0 },
  { id: 'stubble', name: "5 o'Clock Stubble", length: 0.005, density: 0.6 },
  { id: 'short_stubble', name: 'Short Stubble', length: 0.008, density: 0.8 },
  { id: 'short_beard', name: 'Short Boxed Beard', length: 0.016, density: 1.0 },
  { id: 'full_beard', name: 'Full Classic Beard', length: 0.028, density: 1.0 },
  { id: 'goatee', name: 'Sculpted Goatee', length: 0.018, density: 0.9 }
];

export const MOUSTACHE_STYLES = [
  { id: 'none', name: 'None', scaleY: 0 },
  { id: 'natural', name: 'Natural Trim', scaleY: 1.0, width: 1.0 },
  { id: 'chevron', name: 'Classic Chevron', scaleY: 1.4, width: 1.2 },
  { id: 'handlebar', name: 'Curved Handlebar', scaleY: 1.1, width: 1.35, curl: true },
  { id: 'pencil', name: 'Pencil Trim', scaleY: 0.5, width: 0.95 }
];

export const LIP_SHADES = [
  { id: 'satin_rose', name: 'Satin Rosy', hex: '#CE6F66', finish: 'satin' },
  { id: 'rose_gloss', name: 'Rose Petal Gloss', hex: '#C47B78', finish: 'gloss' },
  { id: 'warm_coral', name: 'Warm Coral Nude', hex: '#D98972', finish: 'satin' },
  { id: 'deep_berry', name: 'Deep Berry Velvet', hex: '#96424E', finish: 'matte' },
  { id: 'terracotta_nude', name: 'Terracotta Matte', hex: '#874C3D', finish: 'matte' },
  { id: 'midnight_wine', name: 'Midnight Wine', hex: '#5E2628', finish: 'matte' },
  { id: 'nude_blush', name: 'Bare Nude Blush', hex: '#D6A699', finish: 'gloss' }
];

export const EYEBROW_SHAPES = [
  { id: 'soft_arch', name: 'Soft Natural Arch', thickness: 1.0, arc: 0.16 },
  { id: 'defined_arch', name: 'Defined High Arch', thickness: 1.25, arc: 0.28 },
  { id: 'straight', name: 'Modern Straight Brow', thickness: 1.1, arc: 0.04 },
  { id: 'feathered', name: 'Feathered Editorial', thickness: 1.35, arc: 0.20 },
  { id: 'natural_light', name: 'Soft Feathery Tint', thickness: 0.85, arc: 0.12 }
];

export const CHEEK_PRESETS = [
  { id: 'soft_coral', name: 'Soft Coral Glow', hex: '#DE8B80', opacity: 0.35 },
  { id: 'sunlit_peach', name: 'Sunlit Desert Peach', hex: '#E29778', opacity: 0.40 },
  { id: 'rose_dune', name: 'Dusty Rose Dune', hex: '#C97781', opacity: 0.38 },
  { id: 'terracotta_warm', name: 'Warm Terracotta', hex: '#B86851', opacity: 0.32 },
  { id: 'highlighter_champagne', name: 'Champagne Glow', hex: '#FDF0DB', opacity: 0.45, isHighlight: true }
];

export const NAIL_SHAPES = [
  { id: 'natural', name: 'Natural Rounded', roundness: 0.9 },
  { id: 'almond', name: 'Sculpted Almond', taper: 0.65 },
  { id: 'square', name: 'Crisp Modern Square', taper: 1.0 },
  { id: 'oval', name: 'Classic Feminine Oval', taper: 0.8 },
  { id: 'stiletto', name: 'Daring Stiletto Point', taper: 0.35 }
];

export const NAIL_LENGTHS = [
  { id: 'short', name: 'Active Short', lengthScale: 1.0 },
  { id: 'medium', name: 'Classic Medium', lengthScale: 1.4 },
  { id: 'long', name: 'Statement Long', lengthScale: 1.8 }
];

export const NAIL_FINISHES = [
  { id: 'gloss', name: 'High Gloss Salon', roughness: 0.10, metalness: 0.05 },
  { id: 'matte', name: 'Velvet Matte', roughness: 0.75, metalness: 0.0 },
  { id: 'chrome', name: 'Mirror Chrome', roughness: 0.15, metalness: 0.90 },
  { id: 'metallic', name: 'Champagne Metallic', roughness: 0.25, metalness: 0.70 },
  { id: 'french', name: 'French Tip Sheer', roughness: 0.18, metalness: 0.05, isFrench: true }
];

export const NAIL_COLORS = [
  { id: 'bare_blush', name: 'Bare Blush Nude', hex: '#E8C5B8' },
  { id: 'ballet_slipper', name: 'Ballet Slipper Pink', hex: '#F0D1D8' },
  { id: 'crimson_silk', name: 'Crimson Silk Red', hex: '#941B26' },
  { id: 'deep_burgundy', name: 'Deep Burgundy Wine', hex: '#4A121A' },
  { id: 'espresso_cream', name: 'Warm Espresso', hex: '#3B2317' },
  { id: 'champagne_gold', name: 'Champagne Shimmer', hex: '#D4AF37' },
  { id: 'midnight_onyx', name: 'Midnight Onyx', hex: '#141416' },
  { id: 'clean_ivory', name: 'Pure Studio Ivory', hex: '#FAF7F2' }
];

export const LOOKBOOK_CATEGORIES = [
  { id: 'daily', name: 'Daily Work & College' },
  { id: 'formal', name: 'Formal & Executive' },
  { id: 'party', name: 'Evening & Celebration' },
  { id: 'casual', name: 'Weekend Casual' },
  { id: 'traditional', name: 'Heritage Traditional' }
];

export const DEFAULT_AVATAR_CONFIG = {
  gender: 'female',
  skinTone: '#F3D5C6',
  hairStyle: 'bun',
  hairColor: '#1E120A',
  proportions: 'regular',
  accessories: {
    earrings: true,
    watch: false,
    necklace: false
  },
  grooming: {
    beardStyle: 'clean',
    beardDensity: 1.0,
    beardLength: 1.0,
    beardColor: 'match',
    moustacheStyle: 'none',
    lipColor: '#CE6F66',
    lipFinish: 'satin',
    lipIntensity: 0.8,
    eyebrowShape: 'soft_arch',
    eyebrowThickness: 1.0,
    blushColor: '#DE8B80',
    blushIntensity: 0.35,
    nailShape: 'natural',
    nailLength: 'short',
    nailFinish: 'gloss',
    nailColor: '#E8C5B8'
  },
  masculineGrooming: {
    beardStyle: 'stubble',
    beardDensity: 0.8,
    beardLength: 1.0,
    beardColor: 'match',
    moustacheStyle: 'none',
    hairStyle: 'crop',
    accessories: { watch: true, earrings: false }
  },
  feminineGrooming: {
    lipColor: '#CE6F66',
    lipFinish: 'satin',
    lipIntensity: 0.8,
    eyebrowShape: 'soft_arch',
    blushColor: '#DE8B80',
    blushIntensity: 0.35,
    hairStyle: 'bun',
    nailShape: 'natural',
    nailLength: 'short',
    nailFinish: 'gloss',
    nailColor: '#E8C5B8',
    accessories: { watch: true, earrings: true }
  },
  neutralGrooming: {
    hairStyle: 'bob',
    eyebrowShape: 'natural_light',
    blushColor: '#DE8B80',
    blushIntensity: 0.20,
    nailShape: 'natural',
    nailLength: 'short',
    nailFinish: 'gloss',
    nailColor: '#E8C5B8',
    accessories: { watch: true, earrings: false }
  }
};
