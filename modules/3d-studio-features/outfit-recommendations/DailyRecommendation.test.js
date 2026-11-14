/**
 * Woobi - 3D Studio Features
 * DailyRecommendation.test.js - Unit & Integration Test Suite for Daily AI Outfit Recommendations
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RecommendationsContract } from './RecommendationsContract.js';
import {
  RecommendationEngine,
  createRecommendationEngine
} from './RecommendationEngine.js';

// Sample realistic user wardrobe items mirroring app.js WARDROBE_ITEMS
const MOCK_USER_WARDROBE = [
  { id: 'item_1', name: 'Navy shirt', category: 'Tops', subCategory: 'Shirt', photo: 'assets/navy_shirt.jpg', condition: 'clean', fit: 'perfect' },
  { id: 'item_2', name: 'Beige chinos', category: 'Bottoms', subCategory: 'Pant', photo: 'assets/beige_chinos.jpg', condition: 'clean', fit: 'perfect' },
  { id: 'item_3', name: 'Cream kurta', category: 'Tops', subCategory: 'Kurta', photo: 'assets/olive_kurta.jpg', condition: 'clean', fit: 'perfect' },
  { id: 'item_4', name: 'White sneakers', category: 'Shoes', subCategory: 'Shoe', photo: 'assets/white_sneakers.jpg', condition: 'clean', fit: 'perfect' },
  { id: 'item_5', name: 'Maroon top', category: 'Tops', subCategory: 'Top', photo: 'assets/maroon_top.jpg', condition: 'clean', fit: 'tight' },
  { id: 'item_6', name: 'Dark skirt', category: 'Bottoms', subCategory: 'Skirt', photo: 'assets/dark_skirt.jpg', condition: 'clean', fit: 'perfect' },
  { id: 'item_7', name: 'White linen shirt', category: 'Tops', subCategory: 'Shirt', photo: 'assets/white_linen_shirt.jpg', condition: 'clean', fit: 'loose' },
  { id: 'item_8', name: 'Dark denim', category: 'Bottoms', subCategory: 'Pant', photo: 'assets/dark_denim.jpg', condition: 'dirty', fit: 'perfect' },
  { id: 'item_9', name: 'Tan loafers', category: 'Shoes', subCategory: 'Shoe', photo: 'assets/tan_loafers.jpg', condition: 'clean', fit: 'perfect' },
  { id: 'item_10', name: 'Leather watch', category: 'Accessories', subCategory: 'Accessory', photo: 'assets/leather_watch.jpg', condition: 'clean', fit: 'perfect' },
  { id: 'item_16', name: 'Tailored blazer', category: 'Tops', subCategory: 'Blazer', photo: 'assets/smart_blazer.jpg', condition: 'clean', fit: 'perfect' }
];

describe('Daily AI Outfit Recommendation - Contract & Methods', () => {
  it('1. should declare generateDailyRecommendation in contract', () => {
    assert.ok(RecommendationsContract.methods.includes('generateDailyRecommendation'));
    assert.ok(RecommendationsContract.methods.includes('getRecommendationHistory'));
    assert.ok(RecommendationsContract.methods.includes('recordRecommendation'));
  });

  it('2. should instantiate RecommendationEngine with new recommendation methods', () => {
    const engine = createRecommendationEngine();
    assert.strictEqual(typeof engine.generateDailyRecommendation, 'function');
    assert.strictEqual(typeof engine.getRecommendationHistory, 'function');
    assert.strictEqual(typeof engine.recordRecommendation, 'function');
  });
});

describe('Daily AI Outfit Recommendation - Dynamic Wardrobe Generation', () => {
  it('3. should generate a recommendation using only existing wardrobe items', () => {
    const engine = createRecommendationEngine();
    const rec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-14' });

    assert.strictEqual(rec.isAvailable, true);
    assert.ok(rec.top, 'Recommendation must contain topwear');
    assert.ok(rec.bottom, 'Recommendation must contain bottomwear');

    // Must be an item actually owned by the user
    const topExists = MOCK_USER_WARDROBE.some(i => i.id === rec.top.id);
    const bottomExists = MOCK_USER_WARDROBE.some(i => i.id === rec.bottom.id);
    assert.strictEqual(topExists, true, 'Top must be from user wardrobe');
    assert.strictEqual(bottomExists, true, 'Bottom must be from user wardrobe');
  });

  it('4. should identify and recommend footwear and accessories when available', () => {
    const engine = createRecommendationEngine();
    const rec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-14' });

    assert.ok(rec.shoes, 'Footwear recommendation should be selected when present in wardrobe');
    assert.ok(rec.accessory, 'Accessory recommendation should be selected when present in wardrobe');
    assert.ok(MOCK_USER_WARDROBE.some(i => i.id === rec.shoes.id));
    assert.ok(MOCK_USER_WARDROBE.some(i => i.id === rec.accessory.id));
  });

  it('5. should prioritize clean clothes over dirty/laundry clothes', () => {
    const engine = createRecommendationEngine();
    const rec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-14' });

    // Item_8 is dark denim marked as 'dirty'
    assert.notStrictEqual(rec.bottom.id, 'item_8', 'Should not select item marked in laundry when clean options exist');
    assert.strictEqual(rec.top.condition, 'clean');
    assert.strictEqual(rec.bottom.condition, 'clean');
  });
});

describe('Daily AI Outfit Recommendation - Aesthetic Harmony & Date Variation', () => {
  it('6. should calculate synergy harmony score with rating', () => {
    const engine = createRecommendationEngine();
    const rec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-14' });

    assert.ok(typeof rec.harmonyScore === 'number');
    assert.ok(rec.harmonyScore >= 70 && rec.harmonyScore <= 100);
    assert.ok(['Exceptional', 'Harmonious'].includes(rec.rating));
  });

  it('7. should provide a personalized stylist explanation citing the chosen pieces', () => {
    const engine = createRecommendationEngine();
    const rec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-14' });

    assert.ok(typeof rec.explanation === 'string');
    assert.ok(rec.explanation.includes(rec.top.name), 'Explanation must mention the top garment name');
    assert.ok(rec.explanation.includes(rec.bottom.name), 'Explanation must mention the bottom garment name');
  });

  it('8. should generate deterministic combinations for identical dates', () => {
    const engine = createRecommendationEngine();
    const rec1 = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-16' });
    const rec2 = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-16' });

    assert.strictEqual(rec1.top.id, rec2.top.id);
    assert.strictEqual(rec1.bottom.id, rec2.bottom.id);
    assert.strictEqual(rec1.title, rec2.title);
  });

  it('9. should generate different themed combinations across different days of the week', () => {
    const engine = createRecommendationEngine();
    // Monday (Nov 16, 2026) vs Saturday (Nov 21, 2026)
    const mondayRec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-16' });
    const saturdayRec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-21' });

    assert.notStrictEqual(mondayRec.dayName, saturdayRec.dayName);
    assert.notStrictEqual(mondayRec.title, saturdayRec.title);
  });

  it('10. should avoid repeating recently recommended combinations when history is present', () => {
    const engine = createRecommendationEngine();
    // Generate recommendation for day 1
    const firstRec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-14' });

    // Pass the first recommendation as recently used history for day 2
    const history = [{ id: firstRec.id, top: firstRec.top, bottom: firstRec.bottom }];
    const secondRec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, {
      dateStr: '2026-11-15',
      history
    });

    const isIdentical = (secondRec.top.id === firstRec.top.id) && (secondRec.bottom.id === firstRec.bottom.id);
    assert.strictEqual(isIdentical, false, 'Recommendation engine should diversify combos rather than repeating');
  });
});

describe('Daily AI Outfit Recommendation - 3D Mannequin Mapping & Resilience', () => {
  it('11. should correctly map recommended wardrobe items to 3D studio categories', () => {
    const engine = createRecommendationEngine();
    const rec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-14' });

    assert.ok(rec.mannequinOutfit, 'Recommendation must include mannequinOutfit mapping');
    assert.ok(rec.mannequinOutfit.top, 'mannequinOutfit must specify top ID');
    assert.ok(rec.mannequinOutfit.bottom, 'mannequinOutfit must specify bottom ID');
    assert.ok(rec.mannequinOutfit.shoes, 'mannequinOutfit must specify shoes ID');

    // Valid 3D catalog IDs
    const validTops = ['cardigan', 'blazer', 'navy_shirt', 'striped_sweater', 'tank'];
    const validBottoms = ['taupe_wide', 'wide_linen', 'denim'];
    const validShoes = ['sneakers', 'loafers', 'sandals'];

    assert.ok(validTops.includes(rec.mannequinOutfit.top));
    assert.ok(validBottoms.includes(rec.mannequinOutfit.bottom));
    assert.ok(validShoes.includes(rec.mannequinOutfit.shoes));
  });

  it('12. should map tailored blazer to 3D mannequin blazer model', () => {
    const engine = createRecommendationEngine();
    const blazerOnlyWardrobe = [
      { id: 'b_1', name: 'Tailored blazer', category: 'Tops', condition: 'clean' },
      { id: 'p_1', name: 'Beige chinos', category: 'Bottoms', condition: 'clean' },
      { id: 's_1', name: 'Tan loafers', category: 'Shoes', condition: 'clean' }
    ];
    const rec = engine.generateDailyRecommendation(blazerOnlyWardrobe, { dateStr: '2026-11-16' });

    assert.strictEqual(rec.mannequinOutfit.top, 'blazer');
    assert.strictEqual(rec.mannequinOutfit.bottom, 'taupe_wide');
    assert.strictEqual(rec.mannequinOutfit.shoes, 'loafers');
  });

  it('13. should handle empty wardrobe gracefully without throwing errors', () => {
    const engine = createRecommendationEngine();
    const result = engine.generateDailyRecommendation([], { dateStr: '2026-11-14' });

    assert.strictEqual(result.isAvailable, false);
    assert.strictEqual(result.reason, 'empty_wardrobe');
    assert.ok(result.message.length > 0);
  });

  it('14. should handle wardrobe lacking bottoms gracefully', () => {
    const engine = createRecommendationEngine();
    const topsOnly = [{ id: 't_1', name: 'White shirt', category: 'Tops', condition: 'clean' }];
    const result = engine.generateDailyRecommendation(topsOnly, { dateStr: '2026-11-14' });

    assert.strictEqual(result.isAvailable, false);
    assert.strictEqual(result.reason, 'incomplete_capsule');
  });

  it('15. should record and retrieve recommendation history', () => {
    const engine = createRecommendationEngine();
    const rec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-14' });

    assert.strictEqual(engine.getRecommendationHistory().length, 0);
    engine.recordRecommendation(rec);
    const history = engine.getRecommendationHistory();
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].id, rec.id);
  });

  it('16. should never contain the symbol ✦ in recommendation titles, rationale, or descriptions', () => {
    const engine = createRecommendationEngine();
    const rec = engine.generateDailyRecommendation(MOCK_USER_WARDROBE, { dateStr: '2026-11-14' });

    assert.strictEqual(rec.title.includes('✦'), false);
    assert.strictEqual(rec.explanation.includes('✦'), false);
  });

  it('17. should generate harmonious non-clashing aesthetic rationale when kurta and chinos are combined', () => {
    const engine = createRecommendationEngine();
    const kurtaChinos = [
      { id: 'k_1', name: 'Cream kurta', category: 'Tops', condition: 'clean' },
      { id: 'c_1', name: 'Beige chinos', category: 'Bottoms', condition: 'clean' },
      { id: 's_1', name: 'White sneakers', category: 'Shoes', condition: 'clean' }
    ];
    const rec = engine.generateDailyRecommendation(kurtaChinos, { dateStr: '2026-11-14' });

    assert.ok(rec.explanation.includes('Cream kurta'));
    assert.ok(rec.explanation.includes('Beige chinos'));
    // Must NOT say "smart denim" when chinos are selected
    assert.strictEqual(rec.explanation.includes('denim'), false, 'Should not mention denim when wearing chinos');
  });
});
