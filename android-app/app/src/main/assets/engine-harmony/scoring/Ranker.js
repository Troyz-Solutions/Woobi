/**
 * Engine Harmony - Outfit Ranker & Tier Allocator
 */

import { scoreOutfitEnsemble } from './HarmonyScorer.js';
import { generateStylistExplanation } from './ExplanationGenerator.js';

export const HARMONY_TIERS = {
  ELITE: { name: 'Elite', minScore: 90, badge: '✨ Elite Look' },
  HARMONIOUS: { name: 'Harmonious', minScore: 75, badge: '★ Harmonious' },
  CASUAL: { name: 'Casual', minScore: 60, badge: '● Casual Everyday' },
  EXPERIMENTAL: { name: 'Experimental', minScore: 0, badge: '▲ Bold / Experimental' }
};

/**
 * Determines prestige tier for a score.
 * @param {number} score
 * @returns {Object} Tier definition
 */
export function determineTier(score) {
  if (score >= HARMONY_TIERS.ELITE.minScore) return HARMONY_TIERS.ELITE;
  if (score >= HARMONY_TIERS.HARMONIOUS.minScore) return HARMONY_TIERS.HARMONIOUS;
  if (score >= HARMONY_TIERS.CASUAL.minScore) return HARMONY_TIERS.CASUAL;
  return HARMONY_TIERS.EXPERIMENTAL;
}

/**
 * Scores, ranks, and annotates a list of candidate outfits.
 * @param {Array<Object>} candidateOutfits
 * @param {Object} [context={}]
 * @param {number} [minScoreThreshold=60]
 * @returns {Array<Object>} Sorted ranked outfits
 */
export function rankOutfits(candidateOutfits, context = {}, minScoreThreshold = 60) {
  if (!Array.isArray(candidateOutfits) || candidateOutfits.length === 0) {
    return [];
  }

  const scoredList = [];

  for (const outfit of candidateOutfits) {
    const report = scoreOutfitEnsemble(outfit, context);
    if (report.totalScore < minScoreThreshold) continue;

    const explanation = generateStylistExplanation(report, outfit);
    const tier = determineTier(report.totalScore);

    scoredList.push({
      ...outfit,
      score: report.totalScore,
      subScores: report.subScores,
      dominantHarmony: report.dominantHarmony,
      tier: tier.name,
      badge: tier.badge,
      explanation: explanation.summary,
      strengths: explanation.strengths,
      tips: explanation.tips,
      feedback: report.feedback
    });
  }

  // Sort descending by total score
  scoredList.sort((a, b) => b.score - a.score);

  // Assign 1-based ranks
  scoredList.forEach((outfit, idx) => {
    outfit.rank = idx + 1;
  });

  return scoredList;
}

