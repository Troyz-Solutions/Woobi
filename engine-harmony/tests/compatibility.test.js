/**
 * Engine Harmony - Compatibility Subsystem Unit Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  normalizeFormality,
  evaluateFormalityCoherence,
  normalizePattern,
  evaluatePatternCompatibility,
  normalizeTexture,
  evaluateTextureSynergy,
  normalizeSilhouette,
  evaluateProportions,
  normalizeSeasons,
  evaluateSeasonality
} from '../compatibility/index.js';

describe('Engine Harmony - Formality Matcher', () => {
  it('1. should normalize string labels and numbers to 1-10 range', () => {
    assert.strictEqual(normalizeFormality('casual'), 4);
    assert.strictEqual(normalizeFormality('smart_casual'), 6);
    assert.strictEqual(normalizeFormality('business_formal'), 8);
    assert.strictEqual(normalizeFormality('black_tie'), 10);
    assert.strictEqual(normalizeFormality(8), 8);
    assert.strictEqual(normalizeFormality(15), 10);
  });

  it('2. should reward consistent and smart-casual hybrid formalities', () => {
    const items = [
      { name: 'Poplin Shirt', formality: 6 },
      { name: 'Chinos', formality: 6 },
      { name: 'Loafers', formality: 6 }
    ];
    const res = evaluateFormalityCoherence(items);
    assert.ok(res.score >= 95);
    assert.strictEqual(res.isConsistent, true);

    // Smart-casual hybrid (Blazer formality 8 + Denim formality 5)
    const hybrid = [
      { name: 'Tailored Blazer', formality: 8 },
      { name: 'Dark Denim', formality: 5 },
      { name: 'Leather Loafers', formality: 6 }
    ];
    const hybridRes = evaluateFormalityCoherence(hybrid);
    assert.ok(hybridRes.score >= 90);
    assert.strictEqual(hybridRes.isConsistent, true);
  });

  it('3. should heavily penalize extreme formality clashes', () => {
    const clashing = [
      { name: 'Tuxedo Blazer', formality: 10 },
      { name: 'Gym Sweatpants', formality: 2 }
    ];
    const res = evaluateFormalityCoherence(clashing);
    assert.ok(res.score < 50, 'Extreme formality clash must score below 50');
    assert.strictEqual(res.isConsistent, false);
  });
});

describe('Engine Harmony - Pattern & Print Matcher', () => {
  it('1. should correctly normalize pattern strings', () => {
    assert.strictEqual(normalizePattern({ pattern: 'Striped' }), 'striped');
    assert.strictEqual(normalizePattern({ print: 'Micro Floral' }), 'floral');
    assert.strictEqual(normalizePattern({ name: 'Cable Knit Sweater' }), 'textured');
    assert.strictEqual(normalizePattern({}), 'solid');
  });

  it('2. should reward solid-on-solid and solid-on-pattern combinations', () => {
    const solidEnsemble = [
      { name: 'White Tee', pattern: 'solid' },
      { name: 'Beige Chinos', pattern: 'solid' }
    ];
    const resSolid = evaluatePatternCompatibility(solidEnsemble);
    assert.ok(resSolid.score >= 95);

    const patternEnsemble = [
      { name: 'Striped Poplin Shirt', pattern: 'striped' },
      { name: 'Navy Trousers', pattern: 'solid' },
      { name: 'White Sneakers', pattern: 'solid' }
    ];
    const resPattern = evaluatePatternCompatibility(patternEnsemble);
    assert.ok(resPattern.score >= 95);
  });

  it('3. should penalize competing loud prints', () => {
    const clashingPrints = [
      { name: 'Bold Striped Shirt', pattern: 'striped' },
      { name: 'Tropical Floral Pants', pattern: 'floral' }
    ];
    const res = evaluatePatternCompatibility(clashingPrints);
    assert.ok(res.score <= 55, 'Competing non-geometric prints must receive severe penalty');
    assert.strictEqual(res.isHarmonious, false);
  });
});

describe('Engine Harmony - Texture, Silhouette & Seasonality', () => {
  it('1. should evaluate texture synergy between knitwear and rugged denim', () => {
    const items = [
      { name: 'Chunky Wool Sweater', material: 'knit' },
      { name: 'Raw Denim Jeans', material: 'denim' }
    ];
    const res = evaluateTextureSynergy(items);
    assert.ok(res.score >= 92);
  });

  it('2. should evaluate rule of proportions for silhouettes', () => {
    const fittedTop = { name: 'Fitted Tank', fit: 'fitted' };
    const wideBottom = { name: 'Wide Palazzo Pants', fit: 'wide' };
    const res = evaluateProportions(fittedTop, wideBottom);
    assert.ok(res.score >= 95);

    const oversizedTop = { name: 'Slouchy Hoodie', fit: 'oversized' };
    const slimBottom = { name: 'Slim Chinos', fit: 'slim' };
    const res2 = evaluateProportions(oversizedTop, slimBottom);
    assert.ok(res2.score >= 95);
  });

  it('3. should penalize seasonal clashes like winter coats with summer linen', () => {
    const clash = [
      { name: 'Heavy Down Winter Coat', season: 'winter' },
      { name: 'Breezy Linen Beach Shorts', season: 'summer' }
    ];
    const res = evaluateSeasonality(clash);
    assert.ok(res.score < 60);
    assert.strictEqual(res.isConsistent, false);
  });
});

