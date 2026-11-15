/**
 * Engine Harmony - Scoring Subsystem Unit Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  scoreOutfitEnsemble,
  generateStylistExplanation,
  determineTier,
  rankOutfits,
  SCORING_WEIGHTS,
  HARMONY_TIERS
} from '../scoring/index.js';

describe('Engine Harmony - Multi-Factor Outfit Scoring', () => {
  it('1. should calculate multi-factor scores with exact weight proportionality', () => {
    assert.strictEqual(
      SCORING_WEIGHTS.COLOR +
      SCORING_WEIGHTS.FORMALITY +
      SCORING_WEIGHTS.PATTERN_TEXTURE +
      SCORING_WEIGHTS.OCCASION_SEASON +
      SCORING_WEIGHTS.SILHOUETTE,
      1.0,
      'Weights must sum to exactly 1.0'
    );
  });

  it('2. should award high score to a curated harmonious outfit', () => {
    const outfit = {
      top: { name: 'Crisp White Shirt', color: 'crisp_white', formality: 6, pattern: 'solid', fit: 'fitted' },
      bottom: { name: 'Navy Chinos', color: 'midnight_navy', formality: 6, pattern: 'solid', fit: 'relaxed' },
      shoes: { name: 'Tan Leather Loafers', color: 'tan', formality: 6, pattern: 'solid' }
    };

    const res = scoreOutfitEnsemble(outfit, { occasion: 'smart_casual' });
    assert.ok(res.totalScore >= 90, `Curated smart-casual outfit should score >= 90, got ${res.totalScore}`);
    assert.strictEqual(res.dominantHarmony, 'all_neutral');
    assert.strictEqual(res.isConsistent, true);
    assert.ok(res.subScores.color >= 90);
    assert.ok(res.subScores.formality >= 90);
  });

  it('3. should penalize an outfit with severe color and formality clash', () => {
    const clashingOutfit = {
      top: { name: 'Neon Green Gym Tank', color: 'neon_green', formality: 2, fit: 'oversized' },
      bottom: { name: 'Hot Pink Velvet Tuxedo Pants', color: 'hot_pink', formality: 10, fit: 'oversized' },
      shoes: { name: 'Running Spikes', color: 'electric_lime', formality: 1 }
    };

    const res = scoreOutfitEnsemble(clashingOutfit, { occasion: 'black_tie' });
    assert.ok(res.totalScore < 55, `Clashing outfit should score < 55, got ${res.totalScore}`);
    assert.strictEqual(res.isConsistent, false);
  });

  it('4. should handle empty or invalid outfits gracefully', () => {
    const res = scoreOutfitEnsemble(null);
    assert.strictEqual(res.totalScore, 0);

    const resEmpty = scoreOutfitEnsemble({});
    assert.strictEqual(resEmpty.totalScore, 0);
  });
});

describe('Engine Harmony - Explanations, Tiers & Ranking', () => {
  it('1. should generate actionable stylist rationales', () => {
    const report = {
      totalScore: 92,
      subScores: { color: 95, formality: 92, patternTexture: 90, silhouette: 90, occasionSeason: 90 },
      dominantHarmony: 'all_neutral',
      feedback: ['High tonal synergy']
    };

    const explanation = generateStylistExplanation(report, {});
    assert.ok(explanation.summary.includes('Editorial Excellence'));
    assert.ok(explanation.strengths.length > 0);
  });

  it('2. should map scores to appropriate prestige tiers', () => {
    assert.strictEqual(determineTier(95), HARMONY_TIERS.ELITE);
    assert.strictEqual(determineTier(80), HARMONY_TIERS.HARMONIOUS);
    assert.strictEqual(determineTier(65), HARMONY_TIERS.CASUAL);
    assert.strictEqual(determineTier(45), HARMONY_TIERS.EXPERIMENTAL);
  });

  it('3. should rank candidates in descending order and filter below threshold', () => {
    const candidates = [
      {
        id: 'low',
        top: { name: 'Neon Tank', color: 'neon_green', formality: 2 },
        bottom: { name: 'Tuxedo Pant', color: 'hot_pink', formality: 10 },
        shoes: { name: 'Trainers', color: 'electric_lime', formality: 1 }
      },
      {
        id: 'high',
        top: { name: 'White Shirt', color: 'crisp_white', formality: 6 },
        bottom: { name: 'Navy Chinos', color: 'midnight_navy', formality: 6 },
        shoes: { name: 'Tan Loafers', color: 'tan', formality: 6 }
      }
    ];

    const ranked = rankOutfits(candidates, {}, 60);
    assert.strictEqual(ranked.length, 1, 'Only high-scoring outfit should pass minScoreThreshold of 60');
    assert.strictEqual(ranked[0].id, 'high');
    assert.strictEqual(ranked[0].rank, 1);
    assert.strictEqual(ranked[0].tier, 'Elite');
  });
});

