/**
 * Engine Harmony - Contrast & Clash Analyzer
 * Evaluates tonal contrast ratios, value separation, and chromatic vibration/clashes.
 */

import {
  getContrastRatio,
  getRelativeLuminance,
  getHueDifference,
  clamp
} from './ColorSpace.js';
import { resolveColor } from './ColorParser.js';

/**
 * Analyzes contrast dynamics between two garments (e.g. top and bottom).
 * @param {Object} itemColorA
 * @param {Object} itemColorB
 * @returns {Object} Contrast analysis
 */
export function analyzeTonalContrast(itemColorA, itemColorB) {
  const c1 = resolveColor(itemColorA);
  const c2 = resolveColor(itemColorB);

  const ratio = getContrastRatio(c1.rgb, c2.rgb);
  const lum1 = getRelativeLuminance(c1.rgb.r, c1.rgb.g, c1.rgb.b);
  const lum2 = getRelativeLuminance(c2.rgb.r, c2.rgb.g, c2.rgb.b);
  const deltaLum = Math.abs(lum1 - lum2);

  let styleIntent = 'medium_contrast';
  let score = 85;
  let feedback = '';

  if (ratio >= 4.5) {
    styleIntent = 'high_contrast';
    score = 92;
    feedback = 'Crisp, bold visual definition between garments';
  } else if (ratio >= 2.0 && ratio < 4.5) {
    styleIntent = 'medium_contrast';
    score = 90;
    feedback = 'Harmonious, well-balanced value contrast';
  } else {
    // Low contrast
    if (c1.isNeutral && c2.isNeutral) {
      styleIntent = 'tonal_monochrome';
      score = 88;
      feedback = 'Subtle, understated quiet-luxury tonal layering';
    } else {
      styleIntent = 'low_contrast_muddy';
      score = 65;
      feedback = 'Low contrast between non-neutral pieces may cause visual muddiness';
    }
  }

  // Check for optical vibration clash (two highly saturated opposite hues with similar lightness)
  const isVibrating = !c1.isNeutral && !c2.isNeutral &&
    c1.hsl.s > 65 && c2.hsl.s > 65 &&
    Math.abs(c1.hsl.l - c2.hsl.l) < 15 &&
    getHueDifference(c1.hsl.h, c2.hsl.h) >= 120;

  if (isVibrating) {
    score -= 30;
    feedback = 'Optical vibration clash: saturated opposing hues without value separation create visual strain';
  }

  return {
    ratio: Number(ratio.toFixed(2)),
    deltaLuminance: Number(deltaLum.toFixed(3)),
    styleIntent,
    score: clamp(score, 0, 100),
    isVibrating,
    feedback
  };
}

/**
 * Checks whether an ensemble of colors suffers from critical color clashes.
 * @param {Array} colors
 * @returns {{hasClash: boolean, clashes: Array<string>}}
 */
export function detectColorClashes(colors) {
  if (!Array.isArray(colors) || colors.length < 2) {
    return { hasClash: false, clashes: [] };
  }

  const descriptors = colors.map(resolveColor);
  const clashes = [];

  for (let i = 0; i < descriptors.length; i++) {
    for (let j = i + 1; j < descriptors.length; j++) {
      const c1 = descriptors[i];
      const c2 = descriptors[j];

      // 1. Double Neon clash
      if (c1.isNeon && c2.isNeon) {
        clashes.push(`Competing neon clash between ${c1.name} and ${c2.name}`);
      }

      // 2. Optical vibration (saturated complements with identical lightness)
      const deltaHue = getHueDifference(c1.hsl.h, c2.hsl.h);
      if (!c1.isNeutral && !c2.isNeutral) {
        if (c1.hsl.s > 65 && c2.hsl.s > 65 && Math.abs(c1.hsl.l - c2.hsl.l) < 15 && deltaHue >= 140 && deltaHue <= 220) {
          clashes.push(`Chromatic vibration clash between saturated ${c1.name} and ${c2.name}`);
        }
      }
    }
  }

  return {
    hasClash: clashes.length > 0,
    clashes
  };
}

