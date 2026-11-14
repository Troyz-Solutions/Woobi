/**
 * Engine Harmony - Color Subsystem Unit Tests
 * Tests color parsing, conversions, harmonies, contrast, and clash detection.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  normalizeHex,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToLab,
  deltaE76,
  getHueDifference,
  getContrastRatio,
  getColorTemperature,
  resolveColor,
  findPresetByName,
  analyzeNeutrality,
  evaluatePairwiseHarmony,
  evaluatePaletteHarmony,
  analyzeTonalContrast,
  detectColorClashes,
  HARMONY_TYPES
} from '../color/index.js';

describe('Engine Harmony - Color Science & Mathematics', () => {
  it('1. should normalize 3-char and 6-char hex strings with or without hash', () => {
    assert.strictEqual(normalizeHex('#FFF'), 'FFFFFF');
    assert.strictEqual(normalizeHex('abc'), 'AABBCC');
    assert.strictEqual(normalizeHex('#f5eae0'), 'F5EAE0');
    assert.strictEqual(normalizeHex(0x101D2C), '101D2C');
    assert.strictEqual(normalizeHex('invalid'), '808080');
  });

  it('2. should accurately convert Hex to sRGB and back', () => {
    const rgb = hexToRgb('#101D2C');
    assert.strictEqual(rgb.r, 16);
    assert.strictEqual(rgb.g, 29);
    assert.strictEqual(rgb.b, 44);

    const hex = rgbToHex(16, 29, 44);
    assert.strictEqual(hex, '#101D2C');
  });

  it('3. should convert sRGB to HSL and back with minimal rounding deviation', () => {
    const hsl = rgbToHsl(255, 0, 0); // Pure Red
    assert.strictEqual(hsl.h, 0);
    assert.strictEqual(hsl.s, 100);
    assert.strictEqual(hsl.l, 50);

    const rgbBack = hslToRgb(0, 100, 50);
    assert.strictEqual(rgbBack.r, 255);
    assert.strictEqual(rgbBack.g, 0);
    assert.strictEqual(rgbBack.b, 0);
  });

  it('4. should compute CIELAB and Delta E perceptual distance', () => {
    const whiteLab = rgbToLab(255, 255, 255);
    const blackLab = rgbToLab(0, 0, 0);
    const dist = deltaE76(whiteLab, blackLab);
    assert.ok(dist > 90, 'Black and white should have extreme Delta E distance');

    const nearBeige1 = rgbToLab(245, 245, 220); // Beige
    const nearBeige2 = rgbToLab(245, 234, 224); // Champagne beige
    const nearDist = deltaE76(nearBeige1, nearBeige2);
    assert.ok(nearDist < 15, 'Similar beiges should have low Delta E');
  });

  it('5. should compute shortest angular difference on the 360-degree color wheel', () => {
    assert.strictEqual(getHueDifference(10, 30), 20);
    assert.strictEqual(getHueDifference(10, 350), 20);
    assert.strictEqual(getHueDifference(0, 180), 180);
    assert.strictEqual(getHueDifference(45, 225), 180);
  });

  it('6. should calculate contrast ratio between colors correctly', () => {
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    const contrast = getContrastRatio(white, black);
    assert.ok(contrast > 20, 'White on black contrast should be ~21:1');

    const same = getContrastRatio(white, white);
    assert.strictEqual(Number(same.toFixed(1)), 1.0);
  });

  it('7. should accurately classify color temperature', () => {
    assert.strictEqual(getColorTemperature(0, 100, 50), 'warm'); // Red
    assert.strictEqual(getColorTemperature(210, 80, 50), 'cool'); // Blue
    assert.strictEqual(getColorTemperature(40, 5, 50), 'neutral'); // Desaturated grey
  });
});

describe('Engine Harmony - Color Parser & Neutrality Analysis', () => {
  it('1. should resolve preset fashion colors by name and synonyms', () => {
    const navy = resolveColor('navy');
    assert.strictEqual(navy.name, 'Midnight Navy');
    assert.strictEqual(navy.family, 'blue');
    assert.strictEqual(navy.isNeutral, true);

    const beige = resolveColor('champagne_beige');
    assert.strictEqual(beige.hex, '#F5EAE0');
    assert.strictEqual(beige.temperature, 'warm');
  });

  it('2. should resolve arbitrary hex codes into complete ColorDescriptors', () => {
    const desc = resolveColor('#E2725B');
    assert.strictEqual(desc.hex, '#E2725B');
    assert.ok(desc.rgb);
    assert.ok(desc.hsl);
    assert.ok(desc.lab);
    assert.strictEqual(desc.family, 'red');
  });

  it('3. should identify true neutrals, warm neutrals, and cool neutrals', () => {
    const black = analyzeNeutrality(0, 0, 5);
    assert.strictEqual(black.isNeutral, true);
    assert.strictEqual(black.type, 'true_neutral');

    const sand = analyzeNeutrality(40, 30, 60); // Warm earth
    assert.strictEqual(sand.isNeutral, true);
    assert.strictEqual(sand.type, 'warm_neutral');

    const slate = analyzeNeutrality(215, 20, 45); // Slate / navy
    assert.strictEqual(slate.isNeutral, true);
    assert.strictEqual(slate.type, 'cool_neutral');
  });
});

describe('Engine Harmony - Color Harmony Rules & Clash Detection', () => {
  it('1. should identify All-Neutral combinations as top-tier harmony', () => {
    const res = evaluatePairwiseHarmony('pure_white', 'midnight_navy');
    assert.strictEqual(res.type, HARMONY_TYPES.ALL_NEUTRAL);
    assert.ok(res.score >= 95);
  });

  it('2. should identify Neutral + Accent combinations', () => {
    const res = evaluatePairwiseHarmony('charcoal', 'burgundy');
    assert.strictEqual(res.type, HARMONY_TYPES.NEUTRAL_ACCENT);
    assert.ok(res.score >= 90);
  });

  it('3. should identify Monochromatic combinations', () => {
    const res = evaluatePairwiseHarmony('sky_blue', 'royal_blue');
    assert.strictEqual(res.type, HARMONY_TYPES.MONOCHROMATIC);
    assert.ok(res.score >= 85);
  });

  it('4. should identify Analogous combinations', () => {
    const res = evaluatePairwiseHarmony('mustard_yellow', 'burnt_orange');
    assert.strictEqual(res.type, HARMONY_TYPES.ANALOGOUS);
    assert.ok(res.score >= 80);
  });

  it('5. should identify Softened Complementary combinations', () => {
    const res = evaluatePairwiseHarmony('powder_blue', 'peach');
    assert.strictEqual(res.type, HARMONY_TYPES.COMPLEMENTARY);
    assert.ok(res.score >= 85);
  });

  it('6. should evaluate a multi-item palette and penalize accent overload', () => {
    // 3 distinct clashing accents without neutral anchor
    const badPalette = evaluatePaletteHarmony(['royal_blue', 'crimson', 'forest_green']);
    // 1 neutral + 1 accent + 1 neutral
    const goodPalette = evaluatePaletteHarmony(['crisp_white', 'midnight_navy', 'camel']);

    assert.ok(goodPalette.score > badPalette.score, 'Grounded neutral palette must score higher than accent overload');
    assert.strictEqual(goodPalette.harmonyType, HARMONY_TYPES.ALL_NEUTRAL);
  });

  it('7. should detect optical vibration clashes and competing neons', () => {
    const clashCheck = detectColorClashes(['neon_green', 'hot_pink']);
    assert.strictEqual(clashCheck.hasClash, true);
    assert.ok(clashCheck.clashes.length > 0);

    const safeCheck = detectColorClashes(['crisp_white', 'beige', 'midnight_navy']);
    assert.strictEqual(safeCheck.hasClash, false);
  });

  it('8. should analyze tonal contrast ratios', () => {
    const contrast = analyzeTonalContrast('pure_white', 'jet_black');
    assert.strictEqual(contrast.styleIntent, 'high_contrast');
    assert.ok(contrast.ratio > 15);
  });
});
