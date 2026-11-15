/**
 * Engine Harmony - Color Parser & Fashion Palette Dictionary
 * Resolves Hex codes, CSS strings, numbers, and fashion color names into rich ColorDescriptors.
 */

import {
  normalizeHex,
  hexToRgb,
  rgbToHsl,
  rgbToLab,
  getColorTemperature,
  clamp
} from './ColorSpace.js';

/**
 * Curated fashion industry color reference dictionary.
 */
export const FASHION_PALETTE = {
  // --- Whites & Creams ---
  'pure_white': { name: 'Pure White', hex: '#FFFFFF', family: 'white', category: 'neutral', neutralType: 'true_neutral' },
  'crisp_white': { name: 'Crisp White', hex: '#F8F9FA', family: 'white', category: 'neutral', neutralType: 'true_neutral' },
  'off_white': { name: 'Off-White', hex: '#FAF9F6', family: 'white', category: 'neutral', neutralType: 'warm_neutral' },
  'cream': { name: 'Cream', hex: '#FFFDD0', family: 'white', category: 'neutral', neutralType: 'warm_neutral' },
  'ivory': { name: 'Ivory', hex: '#FFFFF0', family: 'white', category: 'neutral', neutralType: 'warm_neutral' },
  'linen': { name: 'Linen', hex: '#FAF0E6', family: 'white', category: 'neutral', neutralType: 'warm_neutral' },

  // --- Greys & Blacks ---
  'heather_grey': { name: 'Heather Grey', hex: '#B0B7BD', family: 'grey', category: 'neutral', neutralType: 'cool_neutral' },
  'light_grey': { name: 'Light Grey', hex: '#D3D3D3', family: 'grey', category: 'neutral', neutralType: 'cool_neutral' },
  'slate_grey': { name: 'Slate Grey', hex: '#708090', family: 'grey', category: 'neutral', neutralType: 'cool_neutral' },
  'charcoal': { name: 'Charcoal', hex: '#36454F', family: 'grey', category: 'neutral', neutralType: 'cool_neutral' },
  'jet_black': { name: 'Jet Black', hex: '#0A0A0A', family: 'black', category: 'neutral', neutralType: 'true_neutral' },
  'soft_black': { name: 'Soft Black', hex: '#1C1C1C', family: 'black', category: 'neutral', neutralType: 'true_neutral' },

  // --- Earth Tones, Tans & Browns ---
  'beige': { name: 'Beige', hex: '#F5F5DC', family: 'brown', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'champagne_beige': { name: 'Champagne Beige', hex: '#F5EAE0', family: 'brown', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'sand': { name: 'Sand', hex: '#C2B280', family: 'brown', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'khaki': { name: 'Khaki', hex: '#C3B091', family: 'brown', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'camel': { name: 'Camel', hex: '#C19A6B', family: 'brown', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'tan': { name: 'Tan', hex: '#D2B48C', family: 'brown', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'taupe': { name: 'Taupe', hex: '#87756B', family: 'brown', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'cognac': { name: 'Cognac', hex: '#9E4714', family: 'brown', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'espresso': { name: 'Espresso Brown', hex: '#362B28', family: 'brown', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'chocolate': { name: 'Chocolate Brown', hex: '#4A2C11', family: 'brown', category: 'earth_neutral', neutralType: 'warm_neutral' },

  // --- Blues & Navies ---
  'midnight_navy': { name: 'Midnight Navy', hex: '#101D2C', family: 'blue', category: 'cool_neutral', neutralType: 'cool_neutral' },
  'navy_blue': { name: 'Navy Blue', hex: '#001F3F', family: 'blue', category: 'cool_neutral', neutralType: 'cool_neutral' },
  'dark_indigo': { name: 'Dark Indigo', hex: '#1A243B', family: 'blue', category: 'cool_neutral', neutralType: 'cool_neutral' },
  'classic_denim': { name: 'Classic Denim', hex: '#2B4C7E', family: 'blue', category: 'cool', neutralType: null },
  'sky_blue': { name: 'Sky Blue', hex: '#87CEEB', family: 'blue', category: 'pastel', neutralType: null },
  'powder_blue': { name: 'Powder Blue', hex: '#B0E0E6', family: 'blue', category: 'pastel', neutralType: null },
  'baby_blue': { name: 'Baby Blue', hex: '#89CFF0', family: 'blue', category: 'pastel', neutralType: null },
  'royal_blue': { name: 'Royal Blue', hex: '#4169E1', family: 'blue', category: 'accent', neutralType: null },
  'teal': { name: 'Teal', hex: '#008080', family: 'blue', category: 'accent', neutralType: null },

  // --- Greens ---
  'olive_green': { name: 'Olive Green', hex: '#556B2F', family: 'green', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'army_green': { name: 'Army Green', hex: '#4B5320', family: 'green', category: 'earth_neutral', neutralType: 'warm_neutral' },
  'sage_green': { name: 'Sage Green', hex: '#9CAF88', family: 'green', category: 'muted', neutralType: 'warm_neutral' },
  'forest_green': { name: 'Forest Green', hex: '#228B22', family: 'green', category: 'accent', neutralType: null },
  'dark_emerald': { name: 'Dark Emerald', hex: '#046307', family: 'green', category: 'accent', neutralType: null },
  'mint_green': { name: 'Mint Green', hex: '#98FF98', family: 'green', category: 'pastel', neutralType: null },

  // --- Reds, Pinks & Earth Warm ---
  'burgundy': { name: 'Burgundy', hex: '#800020', family: 'red', category: 'accent', neutralType: 'warm_neutral' },
  'wine': { name: 'Wine', hex: '#722F37', family: 'red', category: 'accent', neutralType: 'warm_neutral' },
  'maroon': { name: 'Maroon', hex: '#800000', family: 'red', category: 'accent', neutralType: null },
  'crimson': { name: 'Crimson', hex: '#DC143C', family: 'red', category: 'accent', neutralType: null },
  'terracotta': { name: 'Terracotta', hex: '#E2725B', family: 'red', category: 'warm', neutralType: null },
  'rust': { name: 'Rust', hex: '#B7410E', family: 'red', category: 'warm', neutralType: null },
  'blush_pink': { name: 'Blush Pink', hex: '#FFD1DC', family: 'pink', category: 'pastel', neutralType: null },
  'dusty_rose': { name: 'Dusty Rose', hex: '#DCAE96', family: 'pink', category: 'muted', neutralType: 'warm_neutral' },

  // --- Yellows & Oranges ---
  'mustard_yellow': { name: 'Mustard Yellow', hex: '#FFDB58', family: 'yellow', category: 'warm', neutralType: null },
  'ochre': { name: 'Ochre', hex: '#CC7722', family: 'yellow', category: 'warm', neutralType: null },
  'burnt_orange': { name: 'Burnt Orange', hex: '#CC5500', family: 'orange', category: 'warm', neutralType: null },
  'peach': { name: 'Peach', hex: '#FFE5B4', family: 'orange', category: 'pastel', neutralType: null },

  // --- Purples ---
  'lavender': { name: 'Lavender', hex: '#E6E6FA', family: 'purple', category: 'pastel', neutralType: null },
  'plum': { name: 'Plum', hex: '#673147', family: 'purple', category: 'accent', neutralType: null },
  'lilac': { name: 'Lilac', hex: '#C8A2C8', family: 'purple', category: 'pastel', neutralType: null },

  // --- High Vibrancy Statement Neons (Used for clash & high-contrast testing) ---
  'neon_green': { name: 'Neon Green', hex: '#39FF14', family: 'green', category: 'neon', neutralType: null },
  'hot_pink': { name: 'Hot Pink', hex: '#FF1493', family: 'pink', category: 'neon', neutralType: null },
  'electric_lime': { name: 'Electric Lime', hex: '#CCFF00', family: 'green', category: 'neon', neutralType: null },
  'blaze_orange': { name: 'Blaze Orange', hex: '#FF6600', family: 'orange', category: 'neon', neutralType: null }
};

/**
 * Searches the preset palette by name, key, or common synonym.
 * @param {string} query
 * @returns {Object|null}
 */
export function findPresetByName(query) {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase().replace(/[\s\-_]+/g, '');

  for (const [key, preset] of Object.entries(FASHION_PALETTE)) {
    const cleanKey = key.replace(/[\s\-_]+/g, '');
    const cleanName = preset.name.toLowerCase().replace(/[\s\-_]+/g, '');
    if (clean === cleanKey || clean === cleanName) {
      return preset;
    }
  }

  // Common fashion synonyms
  const SYNONYMS = {
    'black': 'jet_black',
    'white': 'crisp_white',
    'navy': 'midnight_navy',
    'grey': 'heather_grey',
    'gray': 'heather_grey',
    'blue': 'classic_denim',
    'brown': 'chocolate',
    'red': 'crimson',
    'green': 'olive_green',
    'pink': 'blush_pink',
    'yellow': 'mustard_yellow',
    'orange': 'burnt_orange',
    'purple': 'plum'
  };

  const synonymKey = SYNONYMS[clean];
  if (synonymKey && FASHION_PALETTE[synonymKey]) {
    return FASHION_PALETTE[synonymKey];
  }

  return null;
}

/**
 * Resolves neutrality characteristics based on HSL values.
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {{isNeutral: boolean, type: string|null}}
 */
export function analyzeNeutrality(h, s, l) {
  // 1. True neutrals: Very low saturation or extreme lightness
  if (s <= 10 || l <= 12 || l >= 92) {
    return { isNeutral: true, type: 'true_neutral' };
  }

  // 2. Warm neutrals: Low-to-moderate saturation in yellow-orange-brown range (25° - 55°)
  if (h >= 25 && h <= 55 && s <= 45 && l >= 20 && l <= 88) {
    return { isNeutral: true, type: 'warm_neutral' };
  }

  // 3. Cool neutrals: Low-to-moderate saturation in deep navy / slate range (200° - 235°)
  if (h >= 200 && h <= 235 && s <= 45 && l >= 10 && l <= 70) {
    return { isNeutral: true, type: 'cool_neutral' };
  }

  // 4. Muted Olive / Sage neutral
  if (h >= 65 && h <= 105 && s <= 35 && l >= 20 && l <= 65) {
    return { isNeutral: true, type: 'warm_neutral' };
  }

  return { isNeutral: false, type: null };
}

/**
 * Normalizes any color representation into a unified ColorDescriptor.
 * @param {string|number|Object} input Hex string, color name, numeric literal, or object
 * @param {string} [fallback='crisp_white']
 * @returns {Object} ColorDescriptor
 */
export function resolveColor(input, fallback = 'crisp_white') {
  if (!input) {
    const fb = FASHION_PALETTE[fallback] || FASHION_PALETTE.crisp_white;
    return buildDescriptorFromPreset(fb);
  }

  // 1. If already a fully resolved ColorDescriptor
  if (typeof input === 'object' && input.hex && input.rgb && input.hsl && input.lab) {
    return input;
  }

  // 2. Numeric Hex representation (e.g., 0x243242)
  if (typeof input === 'number') {
    return buildDescriptorFromHex(input);
  }

  // 3. Object with hex property
  if (typeof input === 'object' && input.hex) {
    return buildDescriptorFromHex(input.hex, input.name || null);
  }

  // 4. String input (Hex code or preset name)
  if (typeof input === 'string') {
    const trimmed = input.trim();

    // Check if it's a Hex code (#F5EAE0, F5EAE0, #FFF)
    if (trimmed.startsWith('#') || /^[0-9A-Fa-f]{6}$/.test(trimmed) || /^[0-9A-Fa-f]{3}$/.test(trimmed)) {
      return buildDescriptorFromHex(trimmed);
    }

    // Check fashion preset by name or synonym
    const preset = findPresetByName(trimmed);
    if (preset) {
      return buildDescriptorFromPreset(preset);
    }

    // Fallback: try treating as raw hex after stripping non-hex characters
    const stripped = trimmed.replace(/[^0-9A-Fa-f]/g, '');
    if (stripped.length === 6 || stripped.length === 3) {
      return buildDescriptorFromHex(stripped, trimmed);
    }
  }

  // Default fallback
  const fallbackPreset = FASHION_PALETTE[fallback] || FASHION_PALETTE.crisp_white;
  return buildDescriptorFromPreset(fallbackPreset);
}

function buildDescriptorFromPreset(preset) {
  const hex = normalizeHex(preset.hex);
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
  const neutrality = analyzeNeutrality(hsl.h, hsl.s, hsl.l);
  let temp = getColorTemperature(hsl.h, hsl.s, hsl.l);
  if (preset.neutralType === 'warm_neutral' || neutrality.type === 'warm_neutral') {
    temp = 'warm';
  } else if (preset.neutralType === 'cool_neutral' || neutrality.type === 'cool_neutral') {
    temp = 'cool';
  }

  const isNeon = preset.category === 'neon';
  const isLoud = isNeon || (hsl.s >= 85 && hsl.l >= 35 && hsl.l <= 65 && !neutrality.isNeutral);
  const isPastel = hsl.s >= 15 && hsl.s <= 65 && hsl.l >= 75;
  const isMuted = hsl.s <= 45 && hsl.l >= 20 && hsl.l <= 75;

  return {
    name: preset.name,
    hex: `#${hex}`,
    rgb,
    hsl,
    lab,
    family: preset.family,
    category: preset.category,
    isNeutral: neutrality.isNeutral || preset.category === 'neutral' || preset.category === 'earth_neutral' || preset.category === 'cool_neutral',
    neutralType: preset.neutralType || neutrality.type,
    temperature: temp,
    isNeon,
    isLoud,
    isPastel,
    isMuted,
    brightness: Math.round(hsl.l)
  };
}

function buildDescriptorFromHex(hexInput, customName = null) {
  const clean = normalizeHex(hexInput);
  const rgb = hexToRgb(clean);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
  const neutrality = analyzeNeutrality(hsl.h, hsl.s, hsl.l);
  let temp = getColorTemperature(hsl.h, hsl.s, hsl.l);
  if (neutrality.type === 'warm_neutral') {
    temp = 'warm';
  } else if (neutrality.type === 'cool_neutral') {
    temp = 'cool';
  }

  const isNeon = hsl.s >= 95 && hsl.l >= 45 && hsl.l <= 65 && (hsl.h >= 60 && hsl.h <= 150);
  const isLoud = isNeon || (hsl.s >= 85 && hsl.l >= 35 && hsl.l <= 65 && !neutrality.isNeutral);
  const isPastel = hsl.s >= 15 && hsl.s <= 65 && hsl.l >= 75;
  const isMuted = hsl.s <= 45 && hsl.l >= 20 && hsl.l <= 75;

  let family = 'custom';
  if (neutrality.isNeutral) {
    family = hsl.l <= 15 ? 'black' : hsl.l >= 85 ? 'white' : neutrality.type === 'warm_neutral' ? 'brown' : 'grey';
  } else if (hsl.h < 20 || hsl.h >= 345) family = 'red';
  else if (hsl.h < 45) family = 'orange';
  else if (hsl.h < 70) family = 'yellow';
  else if (hsl.h < 165) family = 'green';
  else if (hsl.h < 260) family = 'blue';
  else if (hsl.h < 315) family = 'purple';
  else family = 'pink';

  return {
    name: customName || `#${clean}`,
    hex: `#${clean}`,
    rgb,
    hsl,
    lab,
    family,
    category: isNeon ? 'neon' : neutrality.isNeutral ? 'neutral' : isPastel ? 'pastel' : 'accent',
    isNeutral: neutrality.isNeutral,
    neutralType: neutrality.type,
    temperature: temp,
    isNeon,
    isLoud,
    isPastel,
    isMuted,
    brightness: Math.round(hsl.l)
  };
}
