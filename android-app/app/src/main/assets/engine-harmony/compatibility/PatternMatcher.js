/**
 * Engine Harmony - Pattern & Print Compatibility Matcher
 * Evaluates pattern density, scale, and print clashing across garments.
 */

export const PATTERN_TYPES = {
  SOLID: 'solid',
  TEXTURED: 'textured',
  STRIPED: 'striped',
  PLAID: 'plaid',
  CHECK: 'check',
  FLORAL: 'floral',
  POLKA_DOT: 'polka_dot',
  HOUNDSTOOTH: 'houndstooth',
  GRAPHIC: 'graphic',
  ABSTRACT: 'abstract'
};

/**
 * Normalizes pattern input from a garment.
 * @param {Object|string} garment
 * @returns {string}
 */
export function normalizePattern(garment) {
  if (!garment) return PATTERN_TYPES.SOLID;
  const raw = typeof garment === 'string' ? garment : (garment.pattern || garment.print || garment.name || garment.material || '');
  const clean = raw.trim().toLowerCase().replace(/[\s\-_]+/g, '');

  if (clean.includes('stripe')) return PATTERN_TYPES.STRIPED;
  if (clean.includes('plaid') || clean.includes('tartan')) return PATTERN_TYPES.PLAID;
  if (clean.includes('check') || clean.includes('gingham')) return PATTERN_TYPES.CHECK;
  if (clean.includes('floral') || clean.includes('flower')) return PATTERN_TYPES.FLORAL;
  if (clean.includes('dot')) return PATTERN_TYPES.POLKA_DOT;
  if (clean.includes('houndstooth')) return PATTERN_TYPES.HOUNDSTOOTH;
  if (clean.includes('graphic') || clean.includes('logo')) return PATTERN_TYPES.GRAPHIC;
  if (clean.includes('texture') || clean.includes('waffle') || clean.includes('ribbed') || clean.includes('knit')) return PATTERN_TYPES.TEXTURED;

  return PATTERN_TYPES.SOLID;
}

/**
 * Evaluates pattern harmony for an ensemble of garments.
 * @param {Array<Object>} items
 * @returns {Object} Pattern compatibility score and feedback
 */
export function evaluatePatternCompatibility(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { score: 90, isHarmonious: true, feedback: 'No garments provided' };
  }

  const patterns = items.map(normalizePattern);
  const nonSolidPatterns = patterns.filter(p => p !== PATTERN_TYPES.SOLID && p !== PATTERN_TYPES.TEXTURED);
  const texturedPatterns = patterns.filter(p => p === PATTERN_TYPES.TEXTURED);

  let score = 92;
  const feedback = [];

  // Case 1: All solid pieces (classic clean minimal look)
  if (nonSolidPatterns.length === 0) {
    if (texturedPatterns.length > 0) {
      score = 98; // Subtle texture contrast on solid base is high fashion
      feedback.push('Refined tactile interest through subtle fabric texture against clean solid staples');
    } else {
      score = 95;
      feedback.push('Timeless, clean solid-color foundation without pattern competition');
    }
  }
  // Case 2: One statement pattern anchored by solids
  else if (nonSolidPatterns.length === 1) {
    score = 98;
    feedback.push(`Balanced focal statement: solitary ${nonSolidPatterns[0]} piece anchored by solid companion garments`);
  }
  // Case 3: Two patterns
  else if (nonSolidPatterns.length === 2) {
    const [p1, p2] = nonSolidPatterns;
    // Harmonious mixed prints (e.g. geometric stripes + subtle check/houndstooth)
    if ((p1 === PATTERN_TYPES.STRIPED && p2 === PATTERN_TYPES.HOUNDSTOOTH) ||
        (p1 === PATTERN_TYPES.HOUNDSTOOTH && p2 === PATTERN_TYPES.STRIPED)) {
      score = 85;
      feedback.push('Advanced sartorial print mix: micro-geometric houndstooth paired with linear stripes');
    } else if (p1 === p2) {
      // Co-ord matching set
      score = 88;
      feedback.push(`Matching co-ord ${p1} ensemble`);
    } else {
      // Clashing loud prints (e.g. large floral + bold stripes)
      score = 50;
      feedback.push(`Pattern clash: competing visual rhythms between ${p1} and ${p2}`);
    }
  }
  // Case 4: 3 or more non-solid patterns
  else {
    score = 35;
    feedback.push('Severe visual chaos: multiple competing patterns overload the outfit');
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    isHarmonious: score >= 75,
    patternCount: nonSolidPatterns.length,
    feedback: feedback.join('; ')
  };
}
