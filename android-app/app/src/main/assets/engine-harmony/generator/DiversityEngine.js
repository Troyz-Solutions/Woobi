/**
 * Engine Harmony - Diversity & Deduplication Engine
 * Ensures top recommendation lists feature stylistic variety rather than repetitive swaps.
 */

/**
 * Computes overlap Jaccard distance between two outfit item ID sets.
 * @param {Object} outfitA
 * @param {Object} outfitB
 * @returns {number} Value between 0.0 (identical) and 1.0 (completely distinct)
 */
export function calculateOutfitDiversity(outfitA, outfitB) {
  const idsA = new Set((outfitA.items || []).map(i => i.id));
  const idsB = new Set((outfitB.items || []).map(i => i.id));

  let intersection = 0;
  for (const id of idsA) {
    if (idsB.has(id)) intersection++;
  }

  const union = new Set([...idsA, ...idsB]).size;
  if (union === 0) return 0;

  const jaccardSimilarity = intersection / union;
  return 1 - jaccardSimilarity;
}

/**
 * Selects a diverse subset of top outfits from a scored candidate list.
 * @param {Array<Object>} scoredOutfits Outfits sorted by score descending
 * @param {number} [limit=5] Maximum outfits to return
 * @param {number} [minDiversityThreshold=0.35] Minimum required difference between returned looks
 * @returns {Array<Object>} Diverse subset of top outfits
 */
export function selectDiverseOutfits(scoredOutfits, limit = 5, minDiversityThreshold = 0.55) {
  if (!Array.isArray(scoredOutfits) || scoredOutfits.length === 0) return [];
  if (scoredOutfits.length <= limit) return [...scoredOutfits];

  const selected = [scoredOutfits[0]]; // Always take the #1 highest-scoring outfit

  for (let i = 1; i < scoredOutfits.length; i++) {
    if (selected.length >= limit) break;
    const candidate = scoredOutfits[i];

    // Check diversity against all already chosen outfits
    const isDiverseEnough = selected.every(chosen => {
      const div = calculateOutfitDiversity(candidate, chosen);
      return div >= minDiversityThreshold;
    });

    if (isDiverseEnough) {
      selected.push(candidate);
    }
  }

  // If strict diversity left us below limit, backfill with next best remaining outfits
  if (selected.length < limit) {
    for (const remaining of scoredOutfits) {
      if (selected.length >= limit) break;
      if (!selected.some(s => s.id === remaining.id)) {
        selected.push(remaining);
      }
    }
  }

  return selected;
}
