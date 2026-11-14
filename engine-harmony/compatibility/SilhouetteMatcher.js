/**
 * Engine Harmony - Silhouette & Proportion Balance Matcher
 */

export const SILHOUETTES = {
  FITTED: 'fitted',
  SLIM: 'slim',
  REGULAR: 'regular',
  RELAXED: 'relaxed',
  OVERSIZED: 'oversized',
  WIDE: 'wide'
};

export function normalizeSilhouette(garment) {
  if (!garment) return SILHOUETTES.REGULAR;
  const raw = (garment.silhouette || garment.fit || garment.cut || '').toLowerCase();
  if (raw.includes('tight') || raw.includes('fitted') || raw.includes('skinny')) return SILHOUETTES.FITTED;
  if (raw.includes('slim')) return SILHOUETTES.SLIM;
  if (raw.includes('loose') || raw.includes('wide') || raw.includes('palazzo') || raw.includes('flare')) return SILHOUETTES.WIDE;
  if (raw.includes('oversize') || raw.includes('baggy')) return SILHOUETTES.OVERSIZED;
  if (raw.includes('relax')) return SILHOUETTES.RELAXED;
  return SILHOUETTES.REGULAR;
}

/**
 * Evaluates the Rule of Proportions between Top and Bottom.
 * @param {Object} topItem
 * @param {Object} bottomItem
 * @returns {Object}
 */
export function evaluateProportions(topItem, bottomItem) {
  if (!topItem || !bottomItem) {
    return { score: 85, feedback: 'Proportional balance intact' };
  }

  const topSil = normalizeSilhouette(topItem);
  const botSil = normalizeSilhouette(bottomItem);

  let score = 90;
  let feedback = 'Balanced silhouette';

  // The golden styling rule: Fitted top + Relaxed/Wide bottom OR Oversized top + Slim/Fitted bottom
  if ((topSil === SILHOUETTES.FITTED || topSil === SILHOUETTES.SLIM) &&
      (botSil === SILHOUETTES.WIDE || botSil === SILHOUETTES.RELAXED)) {
    score = 98;
    feedback = 'Flawless proportion balance: fitted upper body accentuating fluid, wide-leg lower drape';
  } else if ((topSil === SILHOUETTES.OVERSIZED || topSil === SILHOUETTES.RELAXED) &&
             (botSil === SILHOUETTES.FITTED || botSil === SILHOUETTES.SLIM)) {
    score = 96;
    feedback = 'Intentional volume contrast: relaxed slouchy upper silhouette anchored by tapered, slim bottoms';
  } else if (topSil === SILHOUETTES.REGULAR && botSil === SILHOUETTES.REGULAR) {
    score = 92;
    feedback = 'Clean, classic proportional symmetry';
  } else if ((topSil === SILHOUETTES.OVERSIZED || topSil === SILHOUETTES.WIDE) &&
             (botSil === SILHOUETTES.OVERSIZED || botSil === SILHOUETTES.WIDE)) {
    score = 75;
    feedback = 'Double oversized volume: relaxed modern streetwear feel, though lacks defined waist structure';
  } else {
    score = 88;
    feedback = 'Harmonious silhouette pairing';
  }

  return {
    score,
    topSilhouette: topSil,
    bottomSilhouette: botSil,
    feedback
  };
}

