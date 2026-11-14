/**
 * Engine Harmony - Formality Matcher
 * Maps and scores formality alignment across ensemble garments.
 */

export const FORMALITY_LEVELS = {
  LOUNGEWEAR: { level: 1, label: 'Loungewear / Sleep' },
  ACTIVEWEAR: { level: 2, label: 'Activewear / Athletic' },
  CASUAL: { level: 4, label: 'Casual / Everyday' },
  SMART_CASUAL: { level: 6, label: 'Smart Casual' },
  BUSINESS_CASUAL: { level: 7, label: 'Business Casual' },
  BUSINESS_FORMAL: { level: 8, label: 'Business Formal / Executive' },
  COCKTAIL: { level: 9, label: 'Cocktail / Evening' },
  BLACK_TIE: { level: 10, label: 'Black Tie / Formal Gala' }
};

/**
 * Normalizes any formality representation (string or number) into a standard 1-10 integer score.
 * @param {string|number} input
 * @returns {number} Score from 1 to 10
 */
export function normalizeFormality(input) {
  if (typeof input === 'number') {
    return Math.max(1, Math.min(10, Math.round(input)));
  }
  if (!input || typeof input !== 'string') return 4; // default casual

  const clean = input.trim().toLowerCase().replace(/[\s\-_]+/g, '');
  const MAPPINGS = {
    'lounge': 1,
    'loungewear': 1,
    'sleep': 1,
    'active': 2,
    'activewear': 2,
    'gym': 2,
    'athletic': 2,
    'sport': 2,
    'casual': 4,
    'everyday': 4,
    'streetwear': 4,
    'smartcasual': 6,
    'businesscasual': 7,
    'work': 7,
    'office': 7,
    'business': 8,
    'formal': 8,
    'businessformal': 8,
    'cocktail': 9,
    'evening': 9,
    'party': 9,
    'blacktie': 10,
    'gala': 10
  };

  return MAPPINGS[clean] || 4;
}

/**
 * Evaluates formality coherence across a set of garments.
 * @param {Array<Object>} items Array of garment objects with formality or tags
 * @param {string|number} [targetOccasion=null] Optional target formality for the event
 * @returns {Object} Formality evaluation
 */
export function evaluateFormalityCoherence(items, targetOccasion = null) {
  if (!Array.isArray(items) || items.length === 0) {
    return { score: 50, averageFormality: 4, isConsistent: true, feedback: 'No garments provided' };
  }

  const scores = items.map(item => {
    if (item.formality !== undefined) return normalizeFormality(item.formality);
    if (item.category === 'Shoes' && (item.subCategory === 'Sneaker' || item.name?.toLowerCase().includes('sneaker'))) {
      return 4;
    }
    if (item.subCategory === 'Blazer' || item.name?.toLowerCase().includes('blazer')) {
      return 8;
    }
    return 4;
  });

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const delta = max - min;

  let score = 90;
  const feedback = [];

  // Delta evaluations:
  if (delta <= 1) {
    score = 98;
    feedback.push('Uniform formality profile across all ensemble pieces');
  } else if (delta <= 3) {
    // Intentional smart-casual hybrid (e.g. blazer + clean denim)
    score = 92;
    feedback.push('Balanced contemporary formality: seamless casual and tailored pairing');
  } else if (delta === 4) {
    score = 75;
    feedback.push('Moderate formality divergence; requires confident styling to bridge the gap');
  } else {
    // Delta >= 5: Clashing formality (e.g. gym sweatpants + formal evening blazer)
    score = 40;
    feedback.push('Severe formality clash: mixing extreme casualwear with formal tailoring');
  }

  // Occasion alignment if target specified
  if (targetOccasion !== null && targetOccasion !== undefined) {
    const targetScore = normalizeFormality(targetOccasion);
    const targetDelta = Math.abs(avg - targetScore);
    if (targetDelta <= 1) {
      score += 5;
      feedback.push('Spot-on alignment with the target occasion');
    } else if (targetDelta >= 3) {
      score -= 20;
      feedback.push(`Outfit formality (${avg.toFixed(1)}) diverges from requested occasion requirement (${targetScore})`);
    }
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    averageFormality: Number(avg.toFixed(1)),
    formalityRange: { min, max, delta },
    isConsistent: delta <= 3,
    feedback: feedback.join('; ')
  };
}
