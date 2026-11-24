/**
 * Woobi - AI Digital Wardrobe Engine
 * OutfitRecommendationHeuristic.js - Algorithmic Outfit Scoring & Pairing
 * 
 * Implements the Blueprint Formula:
 * Score = 0.35 * C + 0.30 * S + 0.20 * O + 0.15 * P
 * C = Colour Compatibility (0 - 100)
 * S = Style Compatibility (0 - 100)
 * O = Occasion Compatibility (0 - 100)
 * P = Personal Preference (0 - 100)
 */

export class OutfitRecommendationHeuristic {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Calculate Colour Compatibility Score (C)
   * Universal neutral anchors: White, Black, Grey, Navy, Denim go with almost anything (90-100).
   * Classic harmonies: White + Black = 98, Navy + Brown = 94, Olive + Beige = 92.
   */
  calculateColourCompatibility(topColor = '', bottomColor = '', shoesColor = '') {
    const t = (topColor || '').toLowerCase().trim();
    const b = (bottomColor || '').toLowerCase().trim();
    const s = (shoesColor || '').toLowerCase().trim();

    const neutrals = ['white', 'black', 'grey', 'gray', 'navy', 'beige', 'cream', 'denim', 'charcoal', 'brown', 'tan', 'cognac'];
    const isTopNeutral = neutrals.some(n => t.includes(n));
    const isBottomNeutral = neutrals.some(n => b.includes(n));
    const isShoesNeutral = neutrals.some(n => s.includes(n));

    // Dual neutral + classic harmony
    if (isTopNeutral && isBottomNeutral && isShoesNeutral) {
      if ((t.includes('white') && b.includes('black') && s.includes('brown')) ||
          (t.includes('navy') && b.includes('beige') && s.includes('white')) ||
          (t.includes('white') && b.includes('navy') && s.includes('brown'))) {
        return 98; // Landmark high-fashion combination
      }
      return 92;
    }

    if (isTopNeutral && isBottomNeutral) return 86;
    if (isTopNeutral || isBottomNeutral) return 78;

    // Direct color clashes
    if (t === b && !isTopNeutral) return 60; // Monochromatic non-neutral can be loud
    return 70;
  }

  /**
   * Calculate Style Compatibility Score (S)
   * Formal + Formal = 95, Smart Casual + Smart Casual = 94, Casual + Casual = 92.
   * Clashing styles (e.g. Formal blazer with gym running pants) = 35.
   */
  calculateStyleCompatibility(topStyle = 'casual', bottomStyle = 'casual', shoesStyle = 'casual') {
    const ts = (topStyle || 'casual').toLowerCase();
    const bs = (bottomStyle || 'casual').toLowerCase();
    const ss = (shoesStyle || 'casual').toLowerCase();

    if (ts === bs && bs === ss) return 95;

    // Smart-casual bridges formal and casual
    const isSmartCasual = (s) => s.includes('smart') || s.includes('business casual');
    if ((ts.includes('formal') && bs.includes('formal')) && isSmartCasual(ss)) return 90;
    if (isSmartCasual(ts) && isSmartCasual(bs)) return 92;
    if (ts.includes('casual') && bs.includes('casual')) return 90;

    // Mild mismatch
    if (ts.includes('formal') && bs.includes('casual')) return 55;
    if (ts.includes('sport') && bs.includes('formal')) return 30;

    return 75;
  }

  /**
   * Calculate Occasion Compatibility Score (O)
   */
  calculateOccasionCompatibility(requestedOccasion = 'office', itemOccasions = []) {
    if (!requestedOccasion) return 85;
    const req = requestedOccasion.toLowerCase();

    if (itemOccasions.length === 0) return 80;

    let matchCount = 0;
    for (const occList of itemOccasions) {
      const list = Array.isArray(occList) ? occList : [occList];
      if (list.some(o => typeof o === 'string' && o.toLowerCase().includes(req))) {
        matchCount++;
      }
    }

    const ratio = matchCount / itemOccasions.length;
    return Math.round(50 + (ratio * 50));
  }

  /**
   * Score an Outfit using the Blueprint Formula:
   * Score = 0.35 * C + 0.30 * S + 0.20 * O + 0.15 * P
   */
  scoreOutfit({ top, bottom, shoes, occasion = 'office', preferenceScore = 80 }) {
    const C = this.calculateColourCompatibility(top?.colour, bottom?.colour, shoes?.colour);
    const S = this.calculateStyleCompatibility(top?.style, bottom?.style, shoes?.style);
    const O = this.calculateOccasionCompatibility(occasion, [top?.occasion, bottom?.occasion, shoes?.occasion].filter(Boolean));
    const P = Math.min(100, Math.max(0, preferenceScore));

    const finalScore = (0.35 * C) + (0.30 * S) + (0.20 * O) + (0.15 * P);
    const rounded = Math.round(finalScore * 10) / 10;

    return {
      score: rounded,
      breakdown: {
        colourCompatibility: C,
        styleCompatibility: S,
        occasionCompatibility: O,
        personalPreference: P
      },
      explanation: this.generateExplanation(rounded, top, bottom, shoes)
    };
  }

  generateExplanation(score, top, bottom, shoes) {
    if (score >= 90) {
      return `Exceptional balance. The clean contrast between ${top?.name || 'top'} and ${bottom?.name || 'trousers'} anchored by ${shoes?.name || 'shoes'} creates a refined, intentional palette.`;
    }
    if (score >= 75) {
      return `Solid everyday combination. Proportions and tones align naturally for a versatile smart aesthetic.`;
    }
    return `Experimental pairing. Consider anchoring with a neutral bottom or switching footwear for balanced contrast.`;
  }
}

export default OutfitRecommendationHeuristic;
