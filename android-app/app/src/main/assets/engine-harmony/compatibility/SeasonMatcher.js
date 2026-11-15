/**
 * Engine Harmony - Season & Weather Alignment Matcher
 */

export const SEASONS = {
  SPRING: 'spring',
  SUMMER: 'summer',
  AUTUMN: 'autumn',
  WINTER: 'winter',
  ALL_SEASON: 'all_season'
};

/**
 * Normalizes season tags from a garment.
 * @param {Object} garment
 * @returns {Array<string>}
 */
export function normalizeSeasons(garment) {
  if (!garment) return [SEASONS.ALL_SEASON];
  if (Array.isArray(garment.season)) return garment.season.map(s => s.toLowerCase());
  if (typeof garment.season === 'string') return [garment.season.toLowerCase()];

  const name = (garment.name || '').toLowerCase();
  const mat = (garment.material || '').toLowerCase();

  if (name.includes('linen') || mat.includes('linen') || name.includes('sandals') || name.includes('tank')) {
    return [SEASONS.SUMMER, SEASONS.SPRING];
  }
  if (name.includes('wool') || mat.includes('wool') || name.includes('coat') || name.includes('boots')) {
    return [SEASONS.AUTUMN, SEASONS.WINTER];
  }

  return [SEASONS.ALL_SEASON];
}

/**
 * Evaluates seasonal consistency among garments.
 * @param {Array<Object>} items
 * @param {string} [targetSeason=null]
 * @returns {Object}
 */
export function evaluateSeasonality(items, targetSeason = null) {
  if (!Array.isArray(items) || items.length === 0) {
    return { score: 90, isConsistent: true, feedback: 'Neutral season baseline' };
  }

  const allSeasons = items.map(normalizeSeasons);

  // Check pairwise intersection
  let score = 92;
  const feedback = [];

  let hasHeavyWinter = false;
  let hasBreezySummer = false;

  for (const item of items) {
    const seasons = normalizeSeasons(item);
    if (seasons.includes(SEASONS.WINTER) && !seasons.includes(SEASONS.SUMMER)) hasHeavyWinter = true;
    if (seasons.includes(SEASONS.SUMMER) && !seasons.includes(SEASONS.WINTER)) hasBreezySummer = true;
  }

  if (hasHeavyWinter && hasBreezySummer) {
    score = 45;
    feedback.push('Seasonal clash: combining heavy winter outerwear with lightweight summer resortwear');
  } else {
    feedback.push('Cohesive seasonal climate alignment');
  }

  if (targetSeason) {
    const target = targetSeason.toLowerCase();
    const matchesTarget = items.filter(i => {
      const s = normalizeSeasons(i);
      return s.includes(target) || s.includes(SEASONS.ALL_SEASON);
    });
    if (matchesTarget.length === items.length) {
      score += 5;
      feedback.push(`100% matched to target season (${targetSeason})`);
    } else {
      score -= 10;
      feedback.push(`Some garments are not optimal for ${targetSeason}`);
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    isConsistent: score >= 70,
    feedback: feedback.join('; ')
  };
}

