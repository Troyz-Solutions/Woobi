/**
 * Engine Harmony - Generator Subsystem Unit Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  determineGarmentSlot,
  partitionWardrobe,
  buildCandidateOutfits,
  calculateOutfitDiversity,
  selectDiverseOutfits,
  WARDROBE_SLOTS
} from '../generator/index.js';

describe('Engine Harmony - Wardrobe Slot Categorization & Filtering', () => {
  it('1. should accurately partition garments into slots', () => {
    assert.strictEqual(determineGarmentSlot({ category: 'Tops', subCategory: 'Shirt' }), WARDROBE_SLOTS.TOP);
    assert.strictEqual(determineGarmentSlot({ category: 'Bottoms', subCategory: 'Pant' }), WARDROBE_SLOTS.BOTTOM);
    assert.strictEqual(determineGarmentSlot({ category: 'Shoes', subCategory: 'Shoe' }), WARDROBE_SLOTS.SHOES);
    assert.strictEqual(determineGarmentSlot({ category: 'Tops', subCategory: 'Blazer' }), WARDROBE_SLOTS.OUTERWEAR);
    assert.strictEqual(determineGarmentSlot({ category: 'Dresses', name: 'Floral Summer Dress' }), WARDROBE_SLOTS.ONE_PIECE);
  });

  it('2. should filter out dirty items when cleanOnly is enabled', () => {
    const wardrobe = [
      { id: '1', name: 'Clean Top', category: 'Tops', condition: 'clean' },
      { id: '2', name: 'Dirty Top', category: 'Tops', condition: 'dirty' },
      { id: '3', name: 'Clean Pant', category: 'Bottoms', condition: 'clean' },
      { id: '4', name: 'Clean Shoe', category: 'Shoes', condition: 'clean' }
    ];

    const cleanPool = partitionWardrobe(wardrobe, { cleanOnly: true });
    assert.strictEqual(cleanPool.tops.length, 1);
    assert.strictEqual(cleanPool.tops[0].id, '1');

    const allPool = partitionWardrobe(wardrobe, { cleanOnly: false });
    assert.strictEqual(allPool.tops.length, 2);
  });

  it('3. should support anchor item prioritization', () => {
    const wardrobe = [
      { id: 'top_fav', name: 'Favorite Blue Oxford', category: 'Tops' },
      { id: 'top_other', name: 'Other Top', category: 'Tops' },
      { id: 'pant_1', name: 'Chinos', category: 'Bottoms' },
      { id: 'shoe_1', name: 'Loafers', category: 'Shoes' }
    ];

    const pool = partitionWardrobe(wardrobe, { anchorItemId: 'top_fav' });
    assert.ok(pool.anchorItem);
    assert.strictEqual(pool.anchorItem.id, 'top_fav');

    const outfits = buildCandidateOutfits(pool);
    assert.ok(outfits.length > 0);
    // Every candidate must have the anchor item
    outfits.forEach(o => {
      assert.strictEqual(o.top.id, 'top_fav');
    });
  });
});

describe('Engine Harmony - Combinatorial Ensemble Generation & Diversity', () => {
  it('1. should generate complete 3-piece ensembles', () => {
    const pool = {
      tops: [{ id: 't1', name: 'White Shirt' }],
      bottoms: [{ id: 'b1', name: 'Navy Chinos' }],
      shoes: [{ id: 's1', name: 'Brown Shoes' }],
      outerwear: [],
      onePieces: [],
      accessories: [],
      anchorItem: null
    };

    const candidates = buildCandidateOutfits(pool);
    assert.strictEqual(candidates.length, 1);
    assert.strictEqual(candidates[0].type, 'standard');
    assert.strictEqual(candidates[0].items.length, 3);
  });

  it('2. should calculate diversity between outfits correctly', () => {
    const o1 = { items: [{ id: 't1' }, { id: 'b1' }, { id: 's1' }] };
    const o2 = { items: [{ id: 't1' }, { id: 'b1' }, { id: 's1' }] };
    const o3 = { items: [{ id: 't2' }, { id: 'b2' }, { id: 's2' }] };

    assert.strictEqual(calculateOutfitDiversity(o1, o2), 0); // Identical
    assert.strictEqual(calculateOutfitDiversity(o1, o3), 1); // 100% disjoint
  });

  it('3. should select a diverse set of outfits without redundant duplicates', () => {
    const scored = [
      { id: 'o1', score: 95, items: [{ id: 't1' }, { id: 'b1' }, { id: 's1' }] },
      { id: 'o2', score: 94, items: [{ id: 't1' }, { id: 'b1' }, { id: 's2' }] }, // Near duplicate
      { id: 'o3', score: 90, items: [{ id: 't2' }, { id: 'b2' }, { id: 's3' }] }, // High diversity
      { id: 'o4', score: 88, items: [{ id: 't3' }, { id: 'b3' }, { id: 's1' }] }  // High diversity
    ];

    const diverse = selectDiverseOutfits(scored, 3, 0.55);
    assert.strictEqual(diverse.length, 3);
    assert.strictEqual(diverse[0].id, 'o1'); // #1 highest score
    assert.strictEqual(diverse[1].id, 'o3'); // picked o3 over o2 because o2 (0.50) is below 0.55 threshold
  });
});
