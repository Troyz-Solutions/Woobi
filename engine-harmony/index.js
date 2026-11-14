/**
 * Engine Harmony - Independent Fashion Recommendation & Color Harmony Engine
 * Pure ECMAScript with zero external dependencies.
 *
 * @author Troyz Solutions / Woobi Monorepo
 * @version 1.0.0
 */

import {
  resolveColor,
  evaluatePairwiseHarmony,
  evaluatePaletteHarmony,
  analyzeTonalContrast,
  detectColorClashes,
  HARMONY_TYPES
} from './color/index.js';

import {
  evaluateFormalityCoherence,
  evaluatePatternCompatibility,
  evaluateTextureSynergy,
  evaluateProportions,
  evaluateSeasonality
} from './compatibility/index.js';

import {
  partitionWardrobe,
  buildCandidateOutfits,
  selectDiverseOutfits,
  determineGarmentSlot,
  WARDROBE_SLOTS
} from './generator/index.js';

import {
  scoreOutfitEnsemble,
  generateStylistExplanation,
  determineTier,
  rankOutfits,
  HARMONY_TIERS
} from './scoring/index.js';

import { EngineHarmonyContract } from './types/HarmonyContracts.js';

export class EngineHarmony {
  /**
   * Initializes Engine Harmony instance.
   * @param {Object} [options={}] Configuration options
   */
  constructor(options = {}) {
    this.options = Object.assign({
      minScoreThreshold: 60,
      defaultOccasion: 'casual',
      defaultSeason: null,
      includeLayered: true,
      maxCombinations: 400,
      diversityThreshold: 0.50
    }, options);
  }

  /**
   * Generates a ranked, diverse list of outfit recommendations from a wardrobe array.
   * @param {Array<Object>} wardrobe List of wardrobe items
   * @param {Object} [context={}] Context constraints (occasion, season, anchorItemId, limit, cleanOnly)
   * @returns {Array<Object>} Ranked, scored outfits with stylist explanations
   */
  recommendOutfits(wardrobe, context = {}) {
    if (!Array.isArray(wardrobe) || wardrobe.length === 0) {
      return [];
    }

    const effectiveContext = Object.assign({
      occasion: this.options.defaultOccasion,
      season: this.options.defaultSeason,
      cleanOnly: true,
      limit: 5,
      includeLayered: this.options.includeLayered,
      anchorItemId: null
    }, context);

    // 1. Partition and filter wardrobe
    const pool = partitionWardrobe(wardrobe, {
      cleanOnly: effectiveContext.cleanOnly,
      season: effectiveContext.season,
      anchorItemId: effectiveContext.anchorItemId
    });

    // 2. Generate candidate ensembles
    const candidates = buildCandidateOutfits(pool, {
      includeLayered: effectiveContext.includeLayered,
      maxCombinations: this.options.maxCombinations
    });

    if (candidates.length === 0) {
      return [];
    }

    // 3. Multi-factor score and rank candidates
    const ranked = rankOutfits(
      candidates,
      { occasion: effectiveContext.occasion, season: effectiveContext.season },
      this.options.minScoreThreshold
    );

    if (ranked.length === 0) {
      return [];
    }

    // 4. Select diverse subset
    const diverse = selectDiverseOutfits(
      ranked,
      effectiveContext.limit,
      this.options.diversityThreshold
    );

    // Re-index ranks for final selection
    return diverse.map((outfit, index) => ({
      ...outfit,
      rank: index + 1
    }));
  }

  /**
   * Evaluates and scores a single complete or partial outfit.
   * @param {Object} outfit Outfit object (top, bottom, shoes, etc.)
   * @param {Object} [context={}] Occasion, season
   * @returns {Object} Full scoring report with tier and explanation
   */
  scoreOutfit(outfit, context = {}) {
    const report = scoreOutfitEnsemble(outfit, context);
    const explanation = generateStylistExplanation(report, outfit);
    const tier = determineTier(report.totalScore);

    return {
      score: report.totalScore,
      subScores: report.subScores,
      dominantHarmony: report.dominantHarmony,
      tier: tier.name,
      badge: tier.badge,
      explanation: explanation.summary,
      strengths: explanation.strengths,
      tips: explanation.tips,
      feedback: report.feedback
    };
  }

  /**
   * Completes a partial outfit using available wardrobe garments.
   * e.g. User chose a Top, engine suggests compatible Bottoms and Shoes.
   * @param {Object} partialOutfit { top, bottom, shoes, outerwear }
   * @param {Array<Object>} wardrobe Available garments
   * @param {Object} [context={}] Context
   * @returns {Array<Object>} Top completed outfits
   */
  completeOutfit(partialOutfit, wardrobe, context = {}) {
    if (!partialOutfit || !Array.isArray(wardrobe) || wardrobe.length === 0) {
      return [];
    }

    // Find any anchor piece in partial outfit
    const anchor = partialOutfit.top || partialOutfit.bottom || partialOutfit.onePiece || partialOutfit.shoes;
    const anchorId = anchor ? anchor.id : null;

    const mergedContext = Object.assign({}, context, {
      anchorItemId: anchorId,
      limit: context.limit || 3
    });

    return this.recommendOutfits(wardrobe, mergedContext);
  }

  /**
   * Evaluates alternative garments for a specific slot in an outfit.
   * Useful for "Swap an Item" interactions.
   * @param {Object} baseOutfit The current outfit
   * @param {'top'|'bottom'|'shoes'|'outerwear'} slotToReplace The slot to substitute
   * @param {Array<Object>} wardrobe Available wardrobe garments
   * @param {Object} [context={}] Context
   * @returns {Array<Object>} Alternative items ranked by resulting outfit score
   */
  findAlternativeItems(baseOutfit, slotToReplace, wardrobe, context = {}) {
    if (!baseOutfit || !slotToReplace || !Array.isArray(wardrobe)) return [];

    const targetSlot = slotToReplace.toLowerCase();
    const candidateItems = wardrobe.filter(item => {
      const s = determineGarmentSlot(item);
      const isCurrent = baseOutfit[slotToReplace]?.id === item.id;
      const isDirty = item.condition === 'dirty' || item.inLaundry === true;
      return s === targetSlot && !isCurrent && !isDirty;
    });

    const alternatives = [];
    for (const alt of candidateItems) {
      const testOutfit = Object.assign({}, baseOutfit, {
        [slotToReplace]: alt,
        items: (baseOutfit.items || [])
          .filter(i => i.id !== baseOutfit[slotToReplace]?.id)
          .concat([alt])
      });

      const scoreResult = this.scoreOutfit(testOutfit, context);
      alternatives.push({
        item: alt,
        score: scoreResult.score,
        tier: scoreResult.tier,
        badge: scoreResult.badge,
        explanation: scoreResult.explanation
      });
    }

    alternatives.sort((a, b) => b.score - a.score);
    return alternatives;
  }

  /**
   * Performs standalone color analysis on a set of color inputs.
   * @param {Array<string|number|Object>} colors
   * @returns {Object} Color harmony report
   */
  analyzeColorHarmony(colors) {
    const paletteReport = evaluatePaletteHarmony(colors);
    const clashCheck = detectColorClashes(colors);

    return {
      score: paletteReport.score,
      harmonyType: paletteReport.harmonyType,
      neutralsCount: paletteReport.neutralsCount,
      accentsCount: paletteReport.accentsCount,
      hasClash: clashCheck.hasClash,
      clashes: clashCheck.clashes,
      feedback: paletteReport.feedback
    };
  }
}

// Named Subsystem Re-exports for advanced direct usage
export {
  resolveColor,
  evaluatePairwiseHarmony,
  evaluatePaletteHarmony,
  analyzeTonalContrast,
  detectColorClashes,
  HARMONY_TYPES,
  evaluateFormalityCoherence,
  evaluatePatternCompatibility,
  evaluateTextureSynergy,
  evaluateProportions,
  evaluateSeasonality,
  partitionWardrobe,
  buildCandidateOutfits,
  selectDiverseOutfits,
  determineGarmentSlot,
  WARDROBE_SLOTS,
  scoreOutfitEnsemble,
  generateStylistExplanation,
  determineTier,
  rankOutfits,
  HARMONY_TIERS,
  EngineHarmonyContract
};

export default EngineHarmony;

