/**
 * Engine Harmony - Fabric Texture, Material Weight & Surface Finish Matcher
 */

export const TEXTURE_CATEGORIES = {
  SMOOTH: 'smooth',       // poplin, silk, satin, fine cotton
  STRUCTURED: 'structured', // tailoring wool, heavy twill, gabardine
  HEAVY_RUGGED: 'rugged',   // denim, leather, suede, canvas
  TACTILE: 'tactile',     // linen, corduroy, waffle knit
  COZY_KNIT: 'knit'       // cashmere, chunky cable knit, mohair
};

/**
 * Normalizes fabric or material string into texture category.
 * @param {Object|string} garment
 * @returns {string}
 */
export function normalizeTexture(garment) {
  if (!garment) return TEXTURE_CATEGORIES.SMOOTH;
  const raw = typeof garment === 'string' ? garment : (garment.material || garment.texture || garment.fabric || '');
  const clean = raw.trim().toLowerCase().replace(/[\s\-_]+/g, '');

  if (clean.includes('denim') || clean.includes('jean') || clean.includes('leather') || clean.includes('suede')) {
    return TEXTURE_CATEGORIES.HEAVY_RUGGED;
  }
  if (clean.includes('knit') || clean.includes('wool') || clean.includes('cashmere') || clean.includes('sweater')) {
    return TEXTURE_CATEGORIES.COZY_KNIT;
  }
  if (clean.includes('linen') || clean.includes('corduroy') || clean.includes('waffle')) {
    return TEXTURE_CATEGORIES.TACTILE;
  }
  if (clean.includes('blazer') || clean.includes('suit') || clean.includes('twill') || clean.includes('chino')) {
    return TEXTURE_CATEGORIES.STRUCTURED;
  }
  return TEXTURE_CATEGORIES.SMOOTH;
}

/**
 * Evaluates textural contrast and tactile synergy.
 * @param {Array<Object>} items
 * @returns {Object}
 */
export function evaluateTextureSynergy(items) {
  if (!Array.isArray(items) || items.length < 2) {
    return { score: 90, feedback: 'Single or baseline texture foundation' };
  }

  const textures = items.map(normalizeTexture);
  const uniqueTextures = new Set(textures);

  let score = 90;
  const feedback = [];

  // Great fashion styling contrasts smooth with textured or heavy with knit
  if (uniqueTextures.has(TEXTURE_CATEGORIES.COZY_KNIT) && uniqueTextures.has(TEXTURE_CATEGORIES.HEAVY_RUGGED)) {
    score = 96;
    feedback.push('Rich textural depth: tactile knitwear paired with rugged leather/denim');
  } else if (uniqueTextures.has(TEXTURE_CATEGORIES.TACTILE) && uniqueTextures.has(TEXTURE_CATEGORIES.SMOOTH)) {
    score = 94;
    feedback.push('Breezy organic contrast: relaxed breathable linen paired with smooth cotton');
  } else if (uniqueTextures.has(TEXTURE_CATEGORIES.STRUCTURED) && uniqueTextures.has(TEXTURE_CATEGORIES.HEAVY_RUGGED)) {
    score = 92;
    feedback.push('High-low tailoring: sharp structured jacket paired with authentic denim');
  } else if (uniqueTextures.size === 1) {
    score = 85;
    feedback.push('Uniform material finish across ensemble');
  } else {
    score = 88;
    feedback.push('Complementary fabric weights');
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    uniqueTexturesCount: uniqueTextures.size,
    feedback: feedback.join('; ')
  };
}

