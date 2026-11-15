/**
 * Engine Harmony - End-to-End Orchestrator Integration Tests
 * Tests realistic wardrobe processing, outfit generation, scoring, and slot swapping.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { EngineHarmony, EngineHarmonyContract } from '../index.js';

// Representative realistic Woobi wardrobe collection
const MOCK_WOOBI_WARDROBE = [
  { id: 'w1', name: 'Navy Poplin Shirt', category: 'Tops', subCategory: 'Shirt', color: 'midnight_navy', formality: 6, pattern: 'solid', fit: 'fitted', condition: 'clean' },
  { id: 'w2', name: 'Beige Chinos', category: 'Bottoms', subCategory: 'Pant', color: 'champagne_beige', formality: 6, pattern: 'solid', fit: 'relaxed', condition: 'clean' },
  { id: 'w3', name: 'White Leather Sneakers', category: 'Shoes', subCategory: 'Shoe', color: 'crisp_white', formality: 5, pattern: 'solid', condition: 'clean' },
  { id: 'w4', name: 'Tailored Camel Blazer', category: 'Tops', subCategory: 'Blazer', color: 'camel', formality: 8, pattern: 'solid', fit: 'slim', condition: 'clean' },
  { id: 'w5', name: 'Charcoal Wool Trousers', category: 'Bottoms', subCategory: 'Pant', color: 'charcoal', formality: 8, pattern: 'solid', fit: 'slim', condition: 'clean' },
  { id: 'w6', name: 'Tan Leather Loafers', category: 'Shoes', subCategory: 'Shoe', color: 'tan', formality: 7, pattern: 'solid', condition: 'clean' },
  { id: 'w7', name: 'Striped Cotton Tee', category: 'Tops', subCategory: 'Shirt', color: 'royal_blue', formality: 4, pattern: 'striped', fit: 'regular', condition: 'clean' },
  { id: 'w8', name: 'Dark Indigo Denim', category: 'Bottoms', subCategory: 'Pant', color: 'dark_indigo', formality: 5, pattern: 'solid', fit: 'slim', condition: 'dirty' }, // In laundry
  { id: 'w9', name: 'Olive Green Kurta', category: 'Tops', subCategory: 'Kurta', color: 'olive_green', formality: 6, pattern: 'solid', fit: 'relaxed', condition: 'clean' }
];

describe('Engine Harmony - End-to-End API & Integration', () => {
  it('1. should satisfy public EngineHarmonyContract interface', () => {
    assert.strictEqual(EngineHarmonyContract.name, 'EngineHarmony');
    const engine = new EngineHarmony();
    EngineHarmonyContract.methods.forEach(method => {
      assert.strictEqual(typeof engine[method], 'function', `EngineHarmony must implement ${method}`);
    });
  });

  it('2. should generate ranked recommendations from a wardrobe', () => {
    const engine = new EngineHarmony({ minScoreThreshold: 60 });
    const recommendations = engine.recommendOutfits(MOCK_WOOBI_WARDROBE, {
      occasion: 'smart_casual',
      limit: 3
    });

    assert.ok(recommendations.length > 0, 'Must return recommendations');
    assert.ok(recommendations.length <= 3, 'Must respect limit constraint');

    // #1 recommendation must be ranked 1 with high score
    assert.strictEqual(recommendations[0].rank, 1);
    assert.ok(recommendations[0].score >= 80);
    assert.ok(recommendations[0].explanation);
    assert.ok(recommendations[0].tier);

    // Verify dirty item w8 was omitted by cleanOnly filter
    recommendations.forEach(rec => {
      const hasDirty = (rec.items || []).some(i => i.id === 'w8');
      assert.strictEqual(hasDirty, false, 'Dirty items must be excluded');
    });
  });

  it('3. should support outfit completion for a single anchor garment', () => {
    const engine = new EngineHarmony();
    const partial = {
      top: MOCK_WOOBI_WARDROBE.find(i => i.id === 'w1') // Navy Poplin Shirt
    };

    const completedOutfits = engine.completeOutfit(partial, MOCK_WOOBI_WARDROBE, { limit: 2 });
    assert.ok(completedOutfits.length > 0);
    completedOutfits.forEach(outfit => {
      assert.strictEqual(outfit.top.id, 'w1', 'All completions must include the chosen top');
      assert.ok(outfit.bottom, 'Must provide bottom');
      assert.ok(outfit.shoes, 'Must provide shoes');
    });
  });

  it('4. should find and rank alternative items for a slot', () => {
    const engine = new EngineHarmony();
    const baseOutfit = {
      top: MOCK_WOOBI_WARDROBE.find(i => i.id === 'w1'),
      bottom: MOCK_WOOBI_WARDROBE.find(i => i.id === 'w2'),
      shoes: MOCK_WOOBI_WARDROBE.find(i => i.id === 'w3')
    };

    const shoeAlternatives = engine.findAlternativeItems(baseOutfit, 'shoes', MOCK_WOOBI_WARDROBE);
    assert.ok(shoeAlternatives.length > 0);
    // Best alternative shoes should be tan loafers (w6)
    assert.ok(shoeAlternatives.some(alt => alt.item.id === 'w6'));
    assert.ok(shoeAlternatives[0].score > 0);
  });

  it('5. should provide standalone color harmony analysis', () => {
    const engine = new EngineHarmony();
    const result = engine.analyzeColorHarmony(['#101D2C', '#F5EAE0', '#FFFFFF']);

    assert.ok(result.score >= 90);
    assert.strictEqual(result.hasClash, false);
    assert.strictEqual(result.harmonyType, 'all_neutral');
  });
});

