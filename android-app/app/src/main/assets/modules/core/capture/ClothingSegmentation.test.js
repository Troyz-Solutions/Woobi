/**
 * Woobi - Core Capture Module Tests
 * ClothingSegmentation.test.js
 * 
 * Verifies on-device $0 background removal, exact HD color matching,
 * and 100% native resolution processing.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  colorDistance,
  getLuminance,
  rgbToHex,
  toHexInt,
  sampleBackgroundFromPerimeter,
  extractExactHDColor,
  removeBackgroundOnDevice,
  pruneDisconnectedBackgroundDebris,
  calculateGarmentOrientation,
  neutralizeCreaseShadows,
  detectGarmentCreasesAndAlignment
} from './ClothingSegmentation.js';

describe('ClothingSegmentation Engine ($0 Client-Side On-Device)', () => {
  test('colorDistance correctly calculates perceptual difference', () => {
    // Identical colors -> 0
    assert.strictEqual(colorDistance(100, 100, 100, 100, 100, 100), 0);

    // Subtle difference
    const diffSmall = colorDistance(200, 200, 200, 205, 200, 200);
    assert.ok(diffSmall > 0 && diffSmall < 15);

    // High difference (black vs white)
    const diffMax = colorDistance(0, 0, 0, 255, 255, 255);
    assert.ok(diffMax > 600);
  });

  test('getLuminance and rgbToHex convert accurately', () => {
    assert.strictEqual(rgbToHex(255, 255, 255), '#FFFFFF');
    assert.strictEqual(rgbToHex(0, 0, 0), '#000000');
    assert.strictEqual(rgbToHex(36, 50, 66), '#243242');

    assert.strictEqual(toHexInt('#243242'), 0x243242);
    assert.strictEqual(toHexInt(0x6E1D2D), 0x6E1D2D);

    const whiteLum = Math.round(getLuminance(255, 255, 255));
    const blackLum = Math.round(getLuminance(0, 0, 0));
    assert.strictEqual(whiteLum, 100);
    assert.strictEqual(blackLum, 0);
  });

  test('Perimeter background sampling accurately identifies floor/bed color', () => {
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);

    // Fill with light cream background (R: 245, G: 240, B: 235)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 245;
      data[i * 4 + 1] = 240;
      data[i * 4 + 2] = 235;
      data[i * 4 + 3] = 255;
    }

    const imgData = { data, width, height };
    const bg = sampleBackgroundFromPerimeter(imgData, width, height, 0.05);

    assert.strictEqual(Math.round(bg.r), 245);
    assert.strictEqual(Math.round(bg.g), 240);
    assert.strictEqual(Math.round(bg.b), 235);
    assert.ok(bg.variance <= 15);
  });

  test('Exact HD Color Extraction accurately extracts dominant fabric color', () => {
    const width = 50;
    const height = 50;
    const data = new Uint8ClampedArray(width * height * 4);

    // Deep Forest Green Garment (#1E5838 -> R:30, G:88, B:56)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 30;
      data[i * 4 + 1] = 88;
      data[i * 4 + 2] = 56;
      data[i * 4 + 3] = 255;
    }

    const imgData = { data, width, height };
    const hd = extractExactHDColor(imgData);

    assert.strictEqual(hd.rgb.r, 30);
    assert.strictEqual(hd.rgb.g, 88);
    assert.strictEqual(hd.rgb.b, 56);
    assert.strictEqual(hd.hex, '#1E5838');
    assert.strictEqual(hd.intHex, 0x1E5838);
    assert.ok(hd.luminance > 20 && hd.luminance < 45);
    assert.strictEqual(hd.primary.hex, '#1E5838');
    assert.strictEqual(hd.isMultiColor, false);
  });

  test('extractExactHDColor accurately extracts full multi-color palette (primary, secondary, accent)', () => {
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);

    // 70% Navy Blue (#1B2A4A -> R:27, G:42, B:74)
    for (let i = 0; i < 7000; i++) {
      data[i * 4] = 27;
      data[i * 4 + 1] = 42;
      data[i * 4 + 2] = 74;
      data[i * 4 + 3] = 255;
    }

    // 30% Crisp Crimson Red stripe (#C82828 -> R:200, G:40, B:40)
    for (let i = 7000; i < 10000; i++) {
      data[i * 4] = 200;
      data[i * 4 + 1] = 40;
      data[i * 4 + 2] = 40;
      data[i * 4 + 3] = 255;
    }

    const imgData = { data, width, height };
    const hd = extractExactHDColor(imgData);

    assert.strictEqual(hd.primary.hex, '#1B2A4A');
    assert.ok(hd.secondary !== null);
    assert.strictEqual(hd.secondary.hex, '#C82828');
    assert.strictEqual(hd.isMultiColor, true);
    assert.strictEqual(hd.palette.length, 2);
  });

  test('removeBackgroundOnDevice removes background and retains garment', () => {
    const width = 60;
    const height = 60;
    const data = new Uint8ClampedArray(width * height * 4);

    // Background: White sheet (255, 255, 255)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 255;
      data[i * 4 + 1] = 255;
      data[i * 4 + 2] = 255;
      data[i * 4 + 3] = 255;
    }

    // Center Garment (box from x: 15-45, y: 15-45) Navy Blue (25, 45, 80)
    for (let y = 15; y < 45; y++) {
      for (let x = 15; x < 45; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 25;
        data[idx + 1] = 45;
        data[idx + 2] = 80;
        data[idx + 3] = 255;
      }
    }

    const imgData = { data, width, height };
    const res = removeBackgroundOnDevice(imgData);

    // Top-left corner (0, 0) should be transparent (alpha = 0)
    assert.strictEqual(res.segmentedData[3], 0);

    // Center garment pixel (30, 30) should be opaque (alpha = 255)
    const centerPx = (30 * width + 30) * 4;
    assert.strictEqual(res.segmentedData[centerPx + 3], 255);
    assert.strictEqual(res.segmentedData[centerPx], 25);
    assert.strictEqual(res.segmentedData[centerPx + 1], 45);
    assert.strictEqual(res.segmentedData[centerPx + 2], 80);

    // HD Color extraction matches the navy garment
    assert.strictEqual(res.hdColor.hex, '#192D50');
    assert.strictEqual(res.hdColor.rgb.r, 25);
    assert.strictEqual(res.hdColor.rgb.g, 45);
    assert.strictEqual(res.hdColor.rgb.b, 80);
  });

  test('Preserves 100% native resolution', () => {
    const width = 1920;
    const height = 1080;
    const data = new Uint8ClampedArray(width * height * 4);
    data.fill(200);

    const imgData = { data, width, height };
    const res = removeBackgroundOnDevice(imgData);

    assert.strictEqual(res.width, 1920);
    assert.strictEqual(res.height, 1080);
    assert.strictEqual(res.segmentedData.length, 1920 * 1080 * 4);
  });

  test('pruneDisconnectedBackgroundDebris isolates garment and removes isolated clutter', () => {
    const width = 50;
    const height = 50;
    const mask = new Uint8Array(width * height);

    // Large garment mass in center (30x30 = 900 pixels)
    for (let y = 10; y < 40; y++) {
      for (let x = 10; x < 40; x++) {
        mask[y * width + x] = 255;
      }
    }

    // Small stray debris/hanger on top-right (3x3 = 9 pixels)
    for (let y = 1; y < 4; y++) {
      for (let x = 40; x < 43; x++) {
        mask[y * width + x] = 255;
      }
    }

    // Small stray clutter on bottom-left (4x4 = 16 pixels)
    for (let y = 44; y < 48; y++) {
      for (let x = 2; x < 6; x++) {
        mask[y * width + x] = 255;
      }
    }

    assert.strictEqual(mask[2 * width + 41], 255);
    assert.strictEqual(mask[45 * width + 3], 255);

    pruneDisconnectedBackgroundDebris(mask, width, height);

    // Garment remains
    assert.strictEqual(mask[25 * width + 25], 255);

    // Stray debris & clutter are completely pruned to 0
    assert.strictEqual(mask[2 * width + 41], 0);
    assert.strictEqual(mask[45 * width + 3], 0);
  });

  test('neutralizeCreaseShadows lifts deep fold crease shadows without altering dye color', () => {
    const width = 20;
    const height = 20;
    const data = new Uint8ClampedArray(width * height * 4);
    const mask = new Uint8Array(width * height);
    mask.fill(255);

    // Base garment color: olive fabric (R: 120, G: 140, B: 80)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 120;
      data[i * 4 + 1] = 140;
      data[i * 4 + 2] = 80;
      data[i * 4 + 3] = 255;
    }

    // Harsh fold crease shadow along column x=10 (Luminance drops to ~30%)
    for (let y = 0; y < height; y++) {
      const idx = (y * width + 10) * 4;
      data[idx] = 40;
      data[idx + 1] = 48;
      data[idx + 2] = 28;
    }

    const creasePixelBefore = (5 * width + 10) * 4;
    assert.strictEqual(data[creasePixelBefore], 40);

    const res = neutralizeCreaseShadows({ width, height, data }, mask, { intensity: 0.85 });

    assert.ok(res.creasesCorrected > 0);
    // Crease shadow is lifted back significantly closer to base color 120
    assert.ok(data[creasePixelBefore] > 70);
  });

  test('detectGarmentCreasesAndAlignment calculates flatness score and provides guidance', () => {
    const width = 60;
    const height = 60;
    const data = new Uint8ClampedArray(width * height * 4);
    const mask = new Uint8Array(width * height);

    // 1. Perfectly flat centered garment
    for (let y = 10; y < 50; y++) {
      for (let x = 15; x < 45; x++) {
        const idx = y * width + x;
        mask[idx] = 255;
        data[idx * 4] = 100;
        data[idx * 4 + 1] = 120;
        data[idx * 4 + 2] = 150;
        data[idx * 4 + 3] = 255;
      }
    }

    const flatResult = detectGarmentCreasesAndAlignment({ width, height, data }, mask);
    assert.ok(flatResult.flatnessScore >= 80);
    assert.strictEqual(flatResult.isFlat, true);
    assert.strictEqual(flatResult.status, 'ready');
    assert.ok(flatResult.feedback.includes('flat & aligned'));

    // 2. Add heavy jagged creases
    for (let y = 12; y < 48; y++) {
      for (let x = 16; x < 44; x += 3) {
        const idx = y * width + x;
        data[idx * 4] = 20;
        data[idx * 4 + 1] = 20;
        data[idx * 4 + 2] = 20;
      }
    }

    const wrinkledResult = detectGarmentCreasesAndAlignment({ width, height, data }, mask);
    assert.ok(wrinkledResult.flatnessScore < 80);
    assert.strictEqual(wrinkledResult.isFlat, false);
    assert.ok(wrinkledResult.feedback.includes('Smooth') || wrinkledResult.feedback.includes('Folds'));
  });
});

