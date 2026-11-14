/**
 * Woobi - 3D Studio Features
 * RecommendationEngine.js - Algorithmic Outfit Scoring, Occasion Matching & Curated Styling
 */

import {
  OCCASIONS,
  STYLE_AESTHETICS,
  RecommendationsContract
} from './RecommendationsContract.js';
import {
  CURATED_LOOKS,
  GARMENT_METRICS,
  COLOR_HARMONY_PAIRS
} from './RecommendationPresets.js';
import { GARMENT_CATALOG, getGarmentRecord } from '../virtual-try-on/index.js';

export class RecommendationEngine {
  constructor(options = {}) {
    this.options = Object.assign({
      curatedLooks: [...CURATED_LOOKS],
      minScoreThreshold: 60
    }, options);
  }

  getOccasions() {
    return Object.values(OCCASIONS);
  }

  getCuratedLooks(occasionFilter = null) {
    if (!occasionFilter) {
      return [...this.options.curatedLooks];
    }
    return this.options.curatedLooks.filter(l => l.occasion === occasionFilter);
  }

  scoreOutfit(outfit) {
    if (!outfit) {
      return { score: 0, feedback: 'No outfit provided' };
    }

    const topId = outfit.top;
    const bottomId = outfit.bottom;
    const shoesId = outfit.shoes;

    const topMeta = topId ? GARMENT_METRICS[topId] : null;
    const bottomMeta = bottomId ? GARMENT_METRICS[bottomId] : null;
    const shoesMeta = shoesId ? GARMENT_METRICS[shoesId] : null;

    let baseScore = 50;
    const positiveFactors = [];
    const negativeFactors = [];

    // Completeness check
    let itemCount = 0;
    if (topId) itemCount++;
    if (bottomId) itemCount++;
    if (shoesId) itemCount++;

    if (itemCount === 3) {
      baseScore += 20;
      positiveFactors.push('Full ensemble complete (top, bottom, footwear)');
    } else if (itemCount === 2) {
      baseScore += 5;
      negativeFactors.push('Outfit is missing an item slot');
    } else {
      baseScore -= 20;
      negativeFactors.push('Outfit is incomplete');
    }

    // Color & Tone Harmony
    if (topMeta && bottomMeta) {
      const allowedTones = COLOR_HARMONY_PAIRS[topMeta.tone] || [];
      if (allowedTones.includes(bottomMeta.tone)) {
        baseScore += 15;
        positiveFactors.push('High tonal synergy between top and bottom');
      } else {
        baseScore -= 10;
        negativeFactors.push('Subtle tone clash between top and bottom');
      }
    }

    // Formality Consistency Check
    if (topMeta && bottomMeta) {
      const deltaFormality = Math.abs(topMeta.formality - bottomMeta.formality);
      if (deltaFormality <= 3) {
        baseScore += 10;
        positiveFactors.push('Consistent formality spectrum');
      } else {
        baseScore -= 15;
        negativeFactors.push('Formality clash (e.g. formal tailoring paired with casual piece)');
      }
    }

    // Footwear Formality Check
    if (shoesMeta && bottomMeta) {
      const deltaShoes = Math.abs(shoesMeta.formality - bottomMeta.formality);
      if (deltaShoes <= 4) {
        baseScore += 5;
      } else {
        baseScore -= 10;
        negativeFactors.push('Footwear formality diverges from trousers');
      }
    }

    const finalScore = Math.max(10, Math.min(100, baseScore));

    return {
      score: finalScore,
      rating: finalScore >= 85 ? 'Exceptional' : (finalScore >= 70 ? 'Harmonious' : 'Experimental'),
      positiveFactors,
      negativeFactors
    };
  }

  getRecommendations(currentOutfit = {}, options = {}) {
    const occasion = options.occasion || null;
    const limit = options.limit || 3;

    // Filter curated looks by occasion if provided
    let candidates = this.options.curatedLooks;
    if (occasion) {
      candidates = candidates.filter(l => l.occasion === occasion);
    }

    // Score candidates against user's current outfit preference
    const results = candidates.map((look) => {
      const similarity = this.calculateOutfitSimilarity(currentOutfit, look.outfit);
      const scoreData = this.scoreOutfit(look.outfit);
      return {
        ...look,
        overallScore: scoreData.score,
        matchConfidence: Math.round((look.harmonyScore * 0.7) + (similarity * 30)),
        analysis: scoreData
      };
    });

    results.sort((a, b) => b.matchConfidence - a.matchConfidence);
    return results.slice(0, limit);
  }

  calculateOutfitSimilarity(outfitA, outfitB) {
    if (!outfitA || !outfitB) return 0;
    let matches = 0;
    let total = 0;

    ['top', 'bottom', 'shoes'].forEach((slot) => {
      if (outfitA[slot] && outfitB[slot]) {
        total++;
        if (outfitA[slot] === outfitB[slot]) matches++;
      }
    });

    return total > 0 ? (matches / total) : 0;
  }

  completeOutfit(partialOutfit = {}) {
    const missing = [];
    if (!partialOutfit.top) missing.push('top');
    if (!partialOutfit.bottom) missing.push('bottom');
    if (!partialOutfit.shoes) missing.push('shoes');

    if (missing.length === 0) {
      return {
        isComplete: true,
        outfit: { ...partialOutfit },
        score: this.scoreOutfit(partialOutfit)
      };
    }

    // Find closest matching curated look
    let bestLook = null;
    let highestSim = -1;

    for (const look of this.options.curatedLooks) {
      const sim = this.calculateOutfitSimilarity(partialOutfit, look.outfit);
      if (sim > highestSim) {
        highestSim = sim;
        bestLook = look;
      }
    }

    if (!bestLook) {
      bestLook = this.options.curatedLooks[0];
    }

    const completed = { ...partialOutfit };
    missing.forEach((slot) => {
      completed[slot] = bestLook.outfit[slot];
    });

    return {
      isComplete: false,
      missingSlots: missing,
      completedOutfit: completed,
      suggestedLook: bestLook,
      score: this.scoreOutfit(completed)
    };
  }

  getMatchingGarments(garmentId) {
    const record = getGarmentRecord(garmentId);
    if (!record) return [];

    const matches = [];
    for (const look of this.options.curatedLooks) {
      const isPresent = Object.values(look.outfit).includes(record.id);
      if (isPresent) {
        Object.entries(look.outfit).forEach(([category, id]) => {
          if (id !== record.id) {
            const matchRec = getGarmentRecord(id);
            if (matchRec && !matches.some(m => m.id === matchRec.id)) {
              matches.push({
                ...matchRec,
                recommendedWithLook: look.name
              });
            }
          }
        });
      }
    }

    return matches;
  }

  /**
   * Generates a dynamic AI outfit recommendation for a given date using only the user's wardrobe items.
   * Considers color harmony, formality spectrum, day-of-week theme, and history repetition avoidance.
   *
   * @param {Array<Object>} wardrobeItems - The user's wardrobe items.
   * @param {Object} options - Options including dateStr ('YYYY-MM-DD'), history, occasion, and forceRefresh.
   * @returns {Object} Complete recommendation result with selected garments, stylist explanation, and 3D mannequin mapping.
   */
  generateDailyRecommendation(wardrobeItems = [], options = {}) {
    if (!Array.isArray(wardrobeItems) || wardrobeItems.length === 0) {
      return {
        isAvailable: false,
        reason: 'empty_wardrobe',
        message: 'Add items to your wardrobe to receive your personalized daily AI outfit recommendation.'
      };
    }

    const dateStr = options.dateStr || new Date().toISOString().slice(0, 10);
    const dateObj = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = isNaN(dateObj.getDay()) ? new Date().getDay() : dateObj.getDay();

    const DAY_THEMES = [
      { day: 'Sunday', title: 'Effortless Minimalist Comfort', vibe: 'Relaxed & Breathable', targetFormality: 4 },
      { day: 'Monday', title: 'Modern Structured Executive', vibe: 'Sharp & Tailored', targetFormality: 8 },
      { day: 'Tuesday', title: 'Clean Everyday Smart-Casual', vibe: 'Effortless & Balanced', targetFormality: 6 },
      { day: 'Wednesday', title: 'Refined Contemporary Chic', vibe: 'Tonal & Sophisticated', targetFormality: 6 },
      { day: 'Thursday', title: 'Modern Monochrome & Warm Tones', vibe: 'Polished Capsule', targetFormality: 7 },
      { day: 'Friday', title: 'Relaxed Friday Tailoring', vibe: 'Smart Denim & Ease', targetFormality: 5 },
      { day: 'Saturday', title: 'Urban Leisure & Weekend Street', vibe: 'Casual & Dynamic', targetFormality: 3 }
    ];

    const currentTheme = DAY_THEMES[dayOfWeek] || DAY_THEMES[1];

    // Categorize wardrobe items
    const isTopItem = (item) => {
      const cat = (item.category || '').toLowerCase();
      const sub = (item.subCategory || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      return cat === 'tops' || ['shirt', 'top', 'kurta', 'kurti', 'tee', 't-shirt', 'blazer', 'sweater', 'cardigan', 'tank', 'hoodie', 'jacket'].some(k => name.includes(k) || sub.includes(k));
    };

    const isBottomItem = (item) => {
      const cat = (item.category || '').toLowerCase();
      const sub = (item.subCategory || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      return cat === 'bottoms' || ['pant', 'pants', 'chinos', 'bottom', 'denim', 'jeans', 'skirt', 'palazzo', 'shorts', 'trouser', 'trousers'].some(k => name.includes(k) || sub.includes(k));
    };

    const isShoeItem = (item) => {
      const cat = (item.category || '').toLowerCase();
      const sub = (item.subCategory || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      return cat === 'shoes' || cat === 'footwear' || ['shoe', 'sneaker', 'loafer', 'trainer', 'sandal', 'boot', 'heel', 'slide', 'footwear'].some(k => name.includes(k) || sub.includes(k));
    };

    const isAccessoryItem = (item) => {
      const cat = (item.category || '').toLowerCase();
      const sub = (item.subCategory || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      return cat === 'accessories' || ['accessory', 'watch', 'belt', 'bag', 'sunglasses', 'jewelry', 'scarf', 'chain'].some(k => name.includes(k) || sub.includes(k));
    };

    const inferTone = (item) => {
      const name = ((item.name || '') + ' ' + (item.subCategory || '')).toLowerCase();
      if (['navy', 'blue', 'indigo'].some(k => name.includes(k))) return 'cool_dark';
      if (['beige', 'cream', 'tan', 'khaki', 'sand', 'taupe', 'camel'].some(k => name.includes(k))) return 'warm_neutral';
      if (['white', 'ivory', 'chalk', 'ecru'].some(k => name.includes(k))) return 'light_neutral';
      if (['black', 'charcoal', 'dark', 'espresso'].some(k => name.includes(k))) return 'dark_neutral';
      if (['maroon', 'terracotta', 'red', 'burgundy', 'olive', 'green'].some(k => name.includes(k))) return 'contrast';
      return 'neutral';
    };

    const inferFormality = (item) => {
      const name = ((item.name || '') + ' ' + (item.subCategory || '')).toLowerCase();
      if (['blazer', 'suit', 'tailored'].some(k => name.includes(k))) return 8;
      if (['oxford', 'poplin', 'linen', 'trousers', 'loafers'].some(k => name.includes(k))) return 7;
      if (['kurta', 'kurti', 'shirt', 'chinos'].some(k => name.includes(k))) return 6;
      if (['cardigan', 'sweater', 'knit'].some(k => name.includes(k))) return 5;
      if (['denim', 'jeans', 'skirt', 'palazzo'].some(k => name.includes(k))) return 4;
      if (['tee', 't-shirt', 'tank', 'sneakers', 'trainers'].some(k => name.includes(k))) return 3;
      if (['sandals', 'slides'].some(k => name.includes(k))) return 2;
      return 5;
    };

    // Filter available clean items first; fallback to all if insufficient
    let tops = wardrobeItems.filter(i => isTopItem(i) && i.condition !== 'dirty');
    if (tops.length === 0) tops = wardrobeItems.filter(isTopItem);

    let bottoms = wardrobeItems.filter(i => isBottomItem(i) && i.condition !== 'dirty');
    if (bottoms.length === 0) bottoms = wardrobeItems.filter(isBottomItem);

    let shoes = wardrobeItems.filter(i => isShoeItem(i) && i.condition !== 'dirty');
    if (shoes.length === 0) shoes = wardrobeItems.filter(isShoeItem);

    const accessories = wardrobeItems.filter(isAccessoryItem);

    if (tops.length === 0 || bottoms.length === 0) {
      return {
        isAvailable: false,
        reason: 'incomplete_capsule',
        message: 'Your wardrobe needs at least one top and one bottom to generate a complete recommendation.'
      };
    }

    // Hash function for date determinism
    const stringHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const dateSeed = stringHash(dateStr);
    const historyList = Array.isArray(options.history) ? options.history : (this.recommendationHistory || []);

    // Generate candidate combinations
    const candidates = [];
    tops.forEach(top => {
      bottoms.forEach(bottom => {
        // Pick best matching footwear for this top+bottom pair
        let bestShoe = null;
        let bestShoeScore = -1;

        shoes.forEach(shoe => {
          let shoeScore = 50;
          const topTone = inferTone(top);
          const botTone = inferTone(bottom);
          const shoeTone = inferTone(shoe);
          const botFormality = inferFormality(bottom);
          const shoeFormality = inferFormality(shoe);

          if (Math.abs(botFormality - shoeFormality) <= 3) shoeScore += 15;
          if (shoeTone === 'light_neutral' || shoeTone === 'dark_neutral' || shoeTone === botTone) shoeScore += 10;
          if (shoeScore > bestShoeScore) {
            bestShoeScore = shoeScore;
            bestShoe = shoe;
          }
        });

        // Pick matching accessory
        const matchingAccessory = accessories.length > 0
          ? accessories[(dateSeed + stringHash(top.id)) % accessories.length]
          : null;

        // Base combo scoring
        let score = 60;
        const topTone = inferTone(top);
        const botTone = inferTone(bottom);
        const topFormality = inferFormality(top);
        const botFormality = inferFormality(bottom);

        // Color tone synergy check
        const allowedTones = COLOR_HARMONY_PAIRS[topTone] || ['warm_neutral', 'cool_dark', 'light_neutral', 'dark_neutral'];
        if (allowedTones.includes(botTone) || topTone === botTone) {
          score += 15;
        } else {
          score -= 5;
        }

        // Formality balance
        const deltaForm = Math.abs(topFormality - botFormality);
        if (deltaForm <= 2) score += 12;
        else if (deltaForm <= 4) score += 5;
        else score -= 10;

        // Day Theme Affinity
        const avgForm = (topFormality + botFormality) / 2;
        const targetDiff = Math.abs(avgForm - currentTheme.targetFormality);
        score += Math.max(0, 10 - (targetDiff * 2));

        // Clean status bonus
        if (top.condition === 'clean' && bottom.condition === 'clean') score += 8;

        // History repetition check: penalize if recommended in recent history
        const comboSignature = `${top.id}_${bottom.id}`;
        const wasRecentlyUsed = historyList.slice(-7).some(h => {
          if (!h) return false;
          const hTop = h.top?.id || h.top;
          const hBot = h.bottom?.id || h.bottom;
          return `${hTop}_${hBot}` === comboSignature;
        });

        if (wasRecentlyUsed) {
          score -= 30; // Strongly prioritize unseen or less frequent combinations
        }

        // Deterministic variation factor for day variety
        const pairSeed = stringHash(`${dateStr}_${top.id}_${bottom.id}`) % 10;
        score += pairSeed;

        candidates.push({
          top,
          bottom,
          shoes: bestShoe,
          accessory: matchingAccessory,
          score: Math.min(99, Math.max(70, score)),
          comboSignature
        });
      });
    });

    candidates.sort((a, b) => b.score - a.score);
    const chosen = candidates[0];

    // Build 3D Mannequin category mappings
    const mapToMannequinTop = (item) => {
      const name = ((item.name || '') + ' ' + (item.subCategory || '')).toLowerCase();
      if (item.modelId) return item.modelId;
      if (['blazer', 'suit'].some(k => name.includes(k))) return 'blazer';
      if (['cardigan', 'knit'].some(k => name.includes(k))) return 'cardigan';
      if (['striped', 'sweater', 'breton'].some(k => name.includes(k))) return 'striped_sweater';
      if (['tank', 'crop'].some(k => name.includes(k))) return 'tank';
      if (['navy', 'shirt', 'oxford', 'poplin', 'linen', 'kurta', 'kurti', 'top', 'tee'].some(k => name.includes(k))) return 'navy_shirt';
      return 'navy_shirt';
    };

    const mapToMannequinBottom = (item) => {
      const name = ((item.name || '') + ' ' + (item.subCategory || '')).toLowerCase();
      if (item.modelId) return item.modelId;
      if (['denim', 'jeans', 'skirt', 'dark'].some(k => name.includes(k))) return 'denim';
      if (['linen', 'palazzo'].some(k => name.includes(k))) return 'wide_linen';
      if (['taupe', 'chinos', 'trouser', 'pant', 'beige'].some(k => name.includes(k))) return 'taupe_wide';
      return 'taupe_wide';
    };

    const mapToMannequinShoes = (item) => {
      if (!item) return 'sneakers';
      const name = ((item.name || '') + ' ' + (item.subCategory || '')).toLowerCase();
      if (item.modelId) return item.modelId;
      if (['loafer', 'dress', 'formal', 'leather'].some(k => name.includes(k))) return 'loafers';
      if (['sandal', 'slide', 'open'].some(k => name.includes(k))) return 'sandals';
      if (['sneaker', 'trainer', 'runner', 'sport'].some(k => name.includes(k))) return 'sneakers';
      return 'sneakers';
    };

    // Format human-friendly date string
    const optionsDate = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    const formattedDate = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-US', optionsDate)
      : dateStr;

    // Stylist rationale explanation
    const topName = chosen.top.name || 'top';
    const bottomName = chosen.bottom.name || 'bottom';
    const shoeName = chosen.shoes ? chosen.shoes.name : 'footwear';
    const accessoryText = chosen.accessory ? ` and accented with your ${chosen.accessory.name}` : '';

    const lowerBot = bottomName.toLowerCase();
    const lowerTop = topName.toLowerCase();

    let aesthetic = 'clean everyday';
    if (lowerBot.includes('denim') || lowerBot.includes('jean')) {
      aesthetic = 'smart denim & ease';
    } else if (lowerTop.includes('blazer') || lowerBot.includes('trouser')) {
      aesthetic = 'structured modern tailoring';
    } else if (lowerTop.includes('kurta') || lowerTop.includes('kurti')) {
      aesthetic = 'refined heritage smart-casual';
    } else if (lowerBot.includes('chino') || lowerTop.includes('shirt')) {
      aesthetic = 'refined smart-casual';
    } else if (lowerBot.includes('skirt')) {
      aesthetic = 'fluid chic & balanced';
    } else if (lowerTop.includes('sweater') || lowerTop.includes('cardigan')) {
      aesthetic = 'cozy minimalist';
    }

    const explanation = `Paired your ${topName} with the ${bottomName} for a ${aesthetic} aesthetic. Harmonized tonal contrast highlights clean tailoring, grounded with ${shoeName}${accessoryText}. Selected exclusively from your active wardrobe.`;

    const recommendation = {
      isAvailable: true,
      id: `rec_${dateStr}_${chosen.comboSignature}`,
      date: dateStr,
      dayName: currentTheme.day,
      formattedDate,
      title: currentTheme.title,
      vibe: currentTheme.vibe,
      explanation,
      harmonyScore: chosen.score,
      rating: chosen.score >= 90 ? 'Exceptional' : 'Harmonious',
      top: chosen.top,
      bottom: chosen.bottom,
      shoes: chosen.shoes,
      accessory: chosen.accessory,
      mannequinOutfit: {
        top: mapToMannequinTop(chosen.top),
        bottom: mapToMannequinBottom(chosen.bottom),
        shoes: mapToMannequinShoes(chosen.shoes)
      }
    };

    return recommendation;
  }

  getRecommendationHistory() {
    if (!this.recommendationHistory) {
      this.recommendationHistory = [];
    }
    return [...this.recommendationHistory];
  }

  recordRecommendation(rec) {
    if (!this.recommendationHistory) {
      this.recommendationHistory = [];
    }
    if (rec && rec.id) {
      this.recommendationHistory.push(rec);
      if (this.recommendationHistory.length > 30) {
        this.recommendationHistory.shift();
      }
    }
    return this.recommendationHistory;
  }
}

export function createRecommendationEngine(options = {}) {
  return new RecommendationEngine(options);
}
