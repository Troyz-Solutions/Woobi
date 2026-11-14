/**
 * Engine Harmony - Multi-Factor Outfit Harmony Scorer
 * Orchestrates Color, Formality, Pattern, Texture, Silhouette, and Occasion algorithms.
 */

import { evaluatePaletteHarmony, analyzeTonalContrast } from '../color/index.js';
import {
  evaluateFormalityCoherence,
  evaluatePatternCompatibility,
  evaluateTextureSynergy,
  evaluateProportions,
  evaluateSeasonality
} from '../compatibility/index.js';

export const SCORING_WEIGHTS = {
  COLOR: 0.35,
  FORMALITY: 0.25,
  PATTERN_TEXTURE: 0.15,
  OCCASION_SEASON: 0.15,
  SILHOUETTE: 0.10
};

/**
 * Evaluates an entire outfit ensemble across all fashion harmony dimensions.
 * @param {Object} outfit Outfit object containing items array or top/bottom/shoes slots
 * @param {Object} [context={}] Context parameters (occasion, season)
 * @returns {Object} Comprehensive scoring report
 */
export function scoreOutfitEnsemble(outfit, context = {}) {
  if (!outfit) {
    return {
      totalScore: 0,
      subScores: { color: 0, formality: 0, patternTexture: 0, occasionSeason: 0, silhouette: 0 },
      feedback: ['No outfit provided']
    };
  }

  // Extract items array
  const items = Array.isArray(outfit.items) ? outfit.items : [
    outfit.top,
    outfit.outerwear,
    outfit.bottom,
    outfit.onePiece,
    outfit.shoes,
    ...(Array.isArray(outfit.accessories) ? outfit.accessories : [])
  ].filter(Boolean);

  if (items.length === 0) {
    return {
      totalScore: 0,
      subScores: { color: 0, formality: 0, patternTexture: 0, occasionSeason: 0, silhouette: 0 },
      feedback: ['Outfit contains no wearable items']
    };
  }

  const { occasion = null, season = null } = context;

  // 1. Color Harmony Dimension (Weight: 35%)
  const colors = items.map(i => i.color || i.hex || i.name);
  const colorReport = evaluatePaletteHarmony(colors);

  // Check top-bottom tonal contrast if separate pieces exist
  const topItem = outfit.top || items.find(i => i.category === 'Tops' || i.category === 'top');
  const botItem = outfit.bottom || items.find(i => i.category === 'Bottoms' || i.category === 'bottom');

  let colorScore = colorReport.score;
  if (topItem && botItem) {
    const contrastRes = analyzeTonalContrast(
      topItem.color || topItem.hex || topItem.name,
      botItem.color || botItem.hex || botItem.name
    );
    // Blend palette harmony with top-to-bottom contrast
    colorScore = Math.round(0.70 * colorReport.score + 0.30 * contrastRes.score);
  }

  // 2. Formality Dimension (Weight: 25%)
  const formalityReport = evaluateFormalityCoherence(items, occasion);
  const formalityScore = formalityReport.score;

  // 3. Pattern & Texture Dimension (Weight: 15%)
  const patternReport = evaluatePatternCompatibility(items);
  const textureReport = evaluateTextureSynergy(items);
  const patternTextureScore = Math.round(0.60 * patternReport.score + 0.40 * textureReport.score);

  // 4. Occasion & Season Alignment (Weight: 15%)
  const seasonReport = evaluateSeasonality(items, season);
  let occasionSeasonScore = seasonReport.score;
  if (occasion) {
    // Combine formality occasion fit with seasonal weather fit
    occasionSeasonScore = Math.round(0.60 * formalityReport.score + 0.40 * seasonReport.score);
  }

  // 5. Silhouette & Proportions (Weight: 10%)
  let silhouetteScore = 88;
  let silhouetteFeedback = 'Natural proportional balance';
  if (topItem && botItem) {
    const propReport = evaluateProportions(topItem, botItem);
    silhouetteScore = propReport.score;
    silhouetteFeedback = propReport.feedback;
  }

  // Weighted Total Score Calculation
  const weightedSum =
    (colorScore * SCORING_WEIGHTS.COLOR) +
    (formalityScore * SCORING_WEIGHTS.FORMALITY) +
    (patternTextureScore * SCORING_WEIGHTS.PATTERN_TEXTURE) +
    (occasionSeasonScore * SCORING_WEIGHTS.OCCASION_SEASON) +
    (silhouetteScore * SCORING_WEIGHTS.SILHOUETTE);

  const totalScore = Math.max(0, Math.min(100, Math.round(weightedSum)));

  // Consolidate feedback
  const feedback = [];
  if (colorReport.feedback.length > 0) feedback.push(...colorReport.feedback);
  if (formalityReport.feedback) feedback.push(formalityReport.feedback);
  if (patternReport.feedback) feedback.push(patternReport.feedback);
  if (textureReport.feedback) feedback.push(textureReport.feedback);
  if (silhouetteFeedback) feedback.push(silhouetteFeedback);

  return {
    totalScore,
    subScores: {
      color: colorScore,
      formality: formalityScore,
      patternTexture: patternTextureScore,
      occasionSeason: occasionSeasonScore,
      silhouette: silhouetteScore
    },
    dominantHarmony: colorReport.harmonyType,
    isConsistent: formalityReport.isConsistent && patternReport.isHarmonious,
    feedback
  };
}

