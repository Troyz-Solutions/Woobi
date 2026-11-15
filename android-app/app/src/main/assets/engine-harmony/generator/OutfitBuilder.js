/**
 * Engine Harmony - Combinatorial Ensemble Builder
 */

import { determineGarmentSlot, WARDROBE_SLOTS } from './WardrobeFilter.js';

let outfitIdCounter = 1;

/**
 * Builds candidate outfits from a partitioned wardrobe pool.
 * @param {Object} pool Structured garment pool from partitionWardrobe
 * @param {Object} [options={}] Options including includeLayered, maxCombinations
 * @returns {Array<Object>} List of candidate outfits
 */
export function buildCandidateOutfits(pool, options = {}) {
  const {
    includeLayered = true,
    maxCombinations = 500
  } = options;

  const candidates = [];
  const anchor = pool.anchorItem;
  const anchorSlot = anchor ? determineGarmentSlot(anchor) : null;

  // 1. One-Piece Dress Ensembles
  if (pool.onePieces.length > 0 && (!anchor || anchorSlot === WARDROBE_SLOTS.ONE_PIECE || anchorSlot === WARDROBE_SLOTS.SHOES || anchorSlot === WARDROBE_SLOTS.OUTERWEAR)) {
    const onePieces = anchorSlot === WARDROBE_SLOTS.ONE_PIECE ? [anchor] : pool.onePieces;
    const shoesList = anchorSlot === WARDROBE_SLOTS.SHOES ? [anchor] : pool.shoes;

    for (const dress of onePieces) {
      for (const shoe of shoesList) {
        candidates.push({
          id: `outfit_gen_${outfitIdCounter++}`,
          type: 'one_piece',
          onePiece: dress,
          shoes: shoe,
          outerwear: null,
          accessories: [],
          items: [dress, shoe]
        });

        // Layered dress (Dress + Blazer/Cardigan + Shoe)
        if (includeLayered) {
          const outerList = anchorSlot === WARDROBE_SLOTS.OUTERWEAR ? [anchor] : pool.outerwear;
          for (const layer of outerList) {
            candidates.push({
              id: `outfit_gen_${outfitIdCounter++}`,
              type: 'layered_dress',
              onePiece: dress,
              shoes: shoe,
              outerwear: layer,
              accessories: [],
              items: [dress, layer, shoe]
            });
          }
        }
      }
    }
  }

  // 2. Standard Separates (Top + Bottom + Shoes)
  const tops = anchorSlot === WARDROBE_SLOTS.TOP ? [anchor] : pool.tops;
  const bottoms = anchorSlot === WARDROBE_SLOTS.BOTTOM ? [anchor] : pool.bottoms;
  const shoes = anchorSlot === WARDROBE_SLOTS.SHOES ? [anchor] : pool.shoes;

  // Early exit if required core slots are empty
  if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) {
    return candidates;
  }

  for (const top of tops) {
    for (const bot of bottoms) {
      for (const shoe of shoes) {
        if (candidates.length >= maxCombinations) break;

        // Base 3-piece core look
        candidates.push({
          id: `outfit_gen_${outfitIdCounter++}`,
          type: 'standard',
          top,
          bottom: bot,
          shoes: shoe,
          outerwear: null,
          accessories: [],
          items: [top, bot, shoe]
        });

        // Layered 4-piece look (Top + Layer + Bottom + Shoes)
        if (includeLayered && pool.outerwear.length > 0) {
          const outerwearList = anchorSlot === WARDROBE_SLOTS.OUTERWEAR ? [anchor] : pool.outerwear;
          for (const layer of outerwearList) {
            if (candidates.length >= maxCombinations) break;

            candidates.push({
              id: `outfit_gen_${outfitIdCounter++}`,
              type: 'layered',
              top,
              bottom: bot,
              shoes: shoe,
              outerwear: layer,
              accessories: [],
              items: [top, layer, bot, shoe]
            });
          }
        }
      }
    }
  }

  return candidates;
}

