/**
 * Engine Harmony - Color Harmony Rules & Palette Evaluation
 * Pure fashion color science evaluating pairwise and multi-garment chromatic synergy.
 */

import {
  getHueDifference,
  getContrastRatio,
  clamp
} from './ColorSpace.js';
import { resolveColor } from './ColorParser.js';

export const HARMONY_TYPES = {
  ALL_NEUTRAL: 'all_neutral',
  NEUTRAL_ACCENT: 'neutral_accent',
  MONOCHROMATIC: 'monochromatic',
  ANALOGOUS: 'analogous',
  COMPLEMENTARY: 'complementary',
  SPLIT_COMPLEMENTARY: 'split_complementary',
  TRIADIC: 'triadic',
  BALANCED_CONTRAST: 'balanced_contrast',
  CLASHING: 'clashing'
};

/**
 * Evaluates color harmony between two resolved ColorDescriptors.
 * @param {Object} colorA
 * @param {Object} colorB
 * @returns {Object} Harmony report
 */
export function evaluatePairwiseHarmony(colorA, colorB) {
  const c1 = resolveColor(colorA);
  const c2 = resolveColor(colorB);

  const deltaHue = getHueDifference(c1.hsl.h, c2.hsl.h);
  const contrast = getContrastRatio(c1.rgb, c2.rgb);
  const deltaLightness = Math.abs(c1.hsl.l - c2.hsl.l);

  // 1. Both are neutrals (True, warm or cool neutrals)
  if (c1.isNeutral && c2.isNeutral) {
    let score = 95;
    // Boost if good tonal value separation (e.g. crisp white with midnight navy)
    if (deltaLightness >= 25 || contrast >= 2.5) {
      score = 98;
    } else if (c1.neutralType !== c2.neutralType && deltaLightness < 15) {
      // Slight tension between warm beige and cool grey if values are too identical
      score = 88;
    }
    return {
      type: HARMONY_TYPES.ALL_NEUTRAL,
      score,
      deltaHue,
      contrast: Number(contrast.toFixed(2)),
      description: 'Sophisticated all-neutral ensemble with natural tonal synergy'
    };
  }

  // Check if they are complementary hues (145° to 215°)
  const isComplementaryAngle = deltaHue >= 145 && deltaHue <= 215;
  if (isComplementaryAngle && (c1.isMuted || c2.isMuted || c1.isPastel || c2.isPastel || (!c1.isNeutral && !c2.isNeutral))) {
    let score = 88;
    if (c1.isNeon || c2.isNeon) {
      score = 55; // Clashing vibrating contrast
    } else if (c1.isMuted || c2.isMuted || c1.isPastel || c2.isPastel) {
      score = 94; // Softened complementary (e.g., sage green + terracotta or dusty rose)
    }
    return {
      type: HARMONY_TYPES.COMPLEMENTARY,
      score,
      deltaHue,
      contrast: Number(contrast.toFixed(2)),
      description: 'Dynamic complementary statement balancing warm and cool poles'
    };
  }

  // 2. One neutral + one accent
  if (c1.isNeutral || c2.isNeutral) {
    const neutral = c1.isNeutral ? c1 : c2;
    const accent = c1.isNeutral ? c2 : c1;

    let score = 92;
    // Neons get slightly toned down
    if (accent.isNeon) {
      score = 80;
    } else if (accent.isMuted || accent.isPastel) {
      score = 96; // Muted/pastel with neutral is exceptionally chic
    }

    return {
      type: HARMONY_TYPES.NEUTRAL_ACCENT,
      score,
      deltaHue,
      contrast: Number(contrast.toFixed(2)),
      description: `Refined neutral anchor (${neutral.name}) letting the accent (${accent.name}) stand out gracefully`
    };
  }

  // 3. Both are chromatic (non-neutral) colors: Color Wheel Theory
  // A. Monochromatic: same hue family or same color family (e.g. blues)
  if (deltaHue <= 20 || (c1.family === c2.family && deltaHue <= 35)) {
    let score = 88;
    if (deltaLightness >= 15) {
      score = 94; // High depth monochrome (e.g. powder blue + cobalt blue)
    } else {
      score = 80; // Identical tone can look uniform without texture variance
    }
    return {
      type: HARMONY_TYPES.MONOCHROMATIC,
      score,
      deltaHue,
      contrast: Number(contrast.toFixed(2)),
      description: 'Tonal monochromatic harmony with varying depth and saturation'
    };
  }

  // B. Analogous: adjacent hues (20° to 45°)
  if (deltaHue > 20 && deltaHue <= 45) {
    let score = 88;
    if (c1.isNeon && c2.isNeon) score -= 20;
    return {
      type: HARMONY_TYPES.ANALOGOUS,
      score,
      deltaHue,
      contrast: Number(contrast.toFixed(2)),
      description: 'Harmonious analogous combination of neighboring color wheel tones'
    };
  }

  // C. Complementary: opposing hues (155° to 205°)
  if (deltaHue >= 155 && deltaHue <= 205) {
    let score = 85;
    if (c1.isNeon || c2.isNeon) {
      score = 55; // Clashing vibrating contrast
    } else if (c1.isMuted || c2.isMuted || c1.isPastel || c2.isPastel) {
      score = 92; // Softened complementary (e.g., sage green + terracotta or dusty rose)
    }
    return {
      type: HARMONY_TYPES.COMPLEMENTARY,
      score,
      deltaHue,
      contrast: Number(contrast.toFixed(2)),
      description: 'Dynamic complementary statement balancing warm and cool poles'
    };
  }

  // D. Split-Complementary (135°-155° or 205°-225°)
  if ((deltaHue >= 135 && deltaHue < 155) || (deltaHue > 205 && deltaHue <= 225)) {
    let score = 82;
    if (c1.isLoud && c2.isLoud) score -= 12;
    return {
      type: HARMONY_TYPES.SPLIT_COMPLEMENTARY,
      score,
      deltaHue,
      contrast: Number(contrast.toFixed(2)),
      description: 'Vibrant split-complementary harmony with balanced tension'
    };
  }

  // E. Triadic (105°-135°)
  if (deltaHue >= 105 && deltaHue < 135) {
    let score = 78;
    if (c1.isLoud && c2.isLoud) score -= 15;
    return {
      type: HARMONY_TYPES.TRIADIC,
      score,
      deltaHue,
      contrast: Number(contrast.toFixed(2)),
      description: 'Triadic color balance with rhythmic visual energy'
    };
  }

  // F. Intermediate / Arbitrary angle
  let intermediateScore = 65;
  if (c1.isLoud && c2.isLoud) intermediateScore = 45; // Clashing loud tones
  return {
    type: intermediateScore < 60 ? HARMONY_TYPES.CLASHING : HARMONY_TYPES.BALANCED_CONTRAST,
    score: intermediateScore,
    deltaHue,
    contrast: Number(contrast.toFixed(2)),
    description: intermediateScore < 60 ? 'Competing chromatic hues creating visual dissonance' : 'Eclectic chromatic combination'
  };
}

/**
 * Evaluates harmony for an ensemble of multiple colors (e.g. top, bottom, shoes, layer).
 * @param {Array<string|number|Object>} colorInputs
 * @returns {Object} Comprehensive palette harmony assessment
 */
export function evaluatePaletteHarmony(colorInputs) {
  if (!Array.isArray(colorInputs) || colorInputs.length === 0) {
    return {
      score: 50,
      harmonyType: HARMONY_TYPES.BALANCED_CONTRAST,
      accentsCount: 0,
      neutralsCount: 0,
      feedback: ['No colors provided to evaluate']
    };
  }

  const colors = colorInputs.map(resolveColor);

  // If only 1 color
  if (colors.length === 1) {
    return {
      score: 90,
      harmonyType: HARMONY_TYPES.MONOCHROMATIC,
      accentsCount: colors[0].isNeutral ? 0 : 1,
      neutralsCount: colors[0].isNeutral ? 1 : 0,
      feedback: ['Single garment solid foundation']
    };
  }

  // Calculate all pairwise harmonies
  const pairs = [];
  let totalPairScore = 0;
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const pair = evaluatePairwiseHarmony(colors[i], colors[j]);
      pairs.push(pair);
      totalPairScore += pair.score;
    }
  }

  const avgPairScore = totalPairScore / pairs.length;

  // Count neutral anchors vs distinct loud/accent colors
  const neutrals = colors.filter(c => c.isNeutral);
  const accents = colors.filter(c => !c.isNeutral);

  let finalScore = avgPairScore;
  const feedback = [];

  // Fashion Rule: Maximum 3 distinct non-neutral accent colors in one look
  if (accents.length >= 3) {
    finalScore -= 20;
    feedback.push('Too many competing chromatic accents; consider anchoring with neutral staples');
  } else if (accents.length === 0) {
    finalScore += 5; // All neutral palette bonus
    feedback.push('Timeless all-neutral palette with high versatility');
  } else if (accents.length === 1 && neutrals.length >= 1) {
    finalScore += 5; // Ideal neutral-to-accent ratio
    feedback.push('Golden-ratio balance: crisp neutral base with a single focal accent');
  }

  // Check for neon overload
  const neons = colors.filter(c => c.isNeon);
  if (neons.length >= 2) {
    finalScore -= 25;
    feedback.push('Severe clash: multiple neon colors competing for attention');
  }

  // Check temperature balance (mix of warm & cool)
  const temperatures = new Set(colors.map(c => c.temperature));
  if (temperatures.has('warm') && temperatures.has('cool') && neutrals.length >= 1) {
    finalScore += 3;
    feedback.push('Sophisticated temperature interplay balanced by neutral grounding');
  }

  finalScore = clamp(Math.round(finalScore), 0, 100);

  // Determine dominant harmony type
  let dominantType = HARMONY_TYPES.BALANCED_CONTRAST;
  if (neutrals.length === colors.length) {
    dominantType = HARMONY_TYPES.ALL_NEUTRAL;
  } else if (neutrals.length > 0 && accents.length === 1) {
    dominantType = HARMONY_TYPES.NEUTRAL_ACCENT;
  } else if (finalScore < 60) {
    dominantType = HARMONY_TYPES.CLASHING;
  } else {
    dominantType = pairs[0]?.type || HARMONY_TYPES.BALANCED_CONTRAST;
  }

  return {
    score: finalScore,
    harmonyType: dominantType,
    pairs,
    neutralsCount: neutrals.length,
    accentsCount: accents.length,
    feedback
  };
}
