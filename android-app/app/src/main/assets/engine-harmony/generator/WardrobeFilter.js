/**
 * Engine Harmony - Wardrobe Slot Categorizer & Constraint Filter
 */

export const WARDROBE_SLOTS = {
  TOP: 'top',
  BOTTOM: 'bottom',
  SHOES: 'shoes',
  OUTERWEAR: 'outerwear',
  ONE_PIECE: 'one_piece',
  ACCESSORY: 'accessory'
};

/**
 * Normalizes garment category into a canonical slot.
 * @param {Object} item
 * @returns {string} One of WARDROBE_SLOTS
 */
export function determineGarmentSlot(item) {
  if (!item) return WARDROBE_SLOTS.TOP;
  const cat = (item.category || '').toLowerCase();
  const sub = (item.subCategory || '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  // One-piece dresses / jumpsuits
  if (cat.includes('dress') || sub.includes('dress') || name.includes('dress') ||
      cat.includes('jumpsuit') || sub.includes('jumpsuit')) {
    return WARDROBE_SLOTS.ONE_PIECE;
  }

  // Outerwear & Layering
  if (sub.includes('blazer') || sub.includes('jacket') || sub.includes('cardigan') || sub.includes('coat') ||
      name.includes('blazer') || name.includes('jacket') || name.includes('cardigan') || name.includes('coat')) {
    return WARDROBE_SLOTS.OUTERWEAR;
  }

  // Tops
  if (cat === 'tops' || cat === 'top' || sub.includes('shirt') || sub.includes('top') || sub.includes('kurta') ||
      sub.includes('kurti') || sub.includes('tee') || name.includes('shirt') || name.includes('tee') || name.includes('top')) {
    return WARDROBE_SLOTS.TOP;
  }

  // Bottoms
  if (cat === 'bottoms' || cat === 'bottom' || sub.includes('pant') || sub.includes('chinos') || sub.includes('jean') ||
      sub.includes('skirt') || sub.includes('trouser') || sub.includes('palazzo') || sub.includes('short') ||
      name.includes('chinos') || name.includes('denim') || name.includes('skirt') || name.includes('palazzo')) {
    return WARDROBE_SLOTS.BOTTOM;
  }

  // Shoes / Footwear
  if (cat === 'shoes' || cat === 'shoe' || cat === 'footwear' || sub.includes('shoe') || sub.includes('sneaker') ||
      sub.includes('loafer') || sub.includes('boot') || sub.includes('sandal') || name.includes('sneaker') ||
      name.includes('loafer') || name.includes('sandal') || name.includes('trainer')) {
    return WARDROBE_SLOTS.SHOES;
  }

  // Accessories
  if (cat === 'accessories' || cat === 'accessory' || sub.includes('watch') || sub.includes('bag') ||
      sub.includes('belt') || name.includes('watch') || name.includes('bag') || name.includes('belt')) {
    return WARDROBE_SLOTS.ACCESSORY;
  }

  return WARDROBE_SLOTS.TOP;
}

/**
 * Partitions a collection of wardrobe garments into structured slots.
 * @param {Array<Object>} wardrobe
 * @param {Object} [constraints={}]
 * @returns {Object} Structured pool of garments grouped by slot
 */
export function partitionWardrobe(wardrobe, constraints = {}) {
  const {
    cleanOnly = true,
    season = null,
    anchorItemId = null
  } = constraints;

  const pool = {
    tops: [],
    bottoms: [],
    shoes: [],
    outerwear: [],
    onePieces: [],
    accessories: [],
    anchorItem: null
  };

  if (!Array.isArray(wardrobe)) return pool;

  for (const item of wardrobe) {
    if (!item || typeof item !== 'object') continue;

    // Check anchor item
    if (anchorItemId && item.id === anchorItemId) {
      pool.anchorItem = item;
    }

    // Laundry / Condition check
    if (cleanOnly) {
      const isDirty = item.condition === 'dirty' || item.inLaundry === true || item.status === 'in_laundry';
      if (isDirty) continue;
    }

    // Seasonality check if specified
    if (season && Array.isArray(item.season) && item.season.length > 0) {
      const match = item.season.some(s => s.toLowerCase() === season.toLowerCase() || s.toLowerCase() === 'all_season');
      if (!match) continue;
    }

    const slot = determineGarmentSlot(item);
    switch (slot) {
      case WARDROBE_SLOTS.TOP:
        pool.tops.push(item);
        break;
      case WARDROBE_SLOTS.BOTTOM:
        pool.bottoms.push(item);
        break;
      case WARDROBE_SLOTS.SHOES:
        pool.shoes.push(item);
        break;
      case WARDROBE_SLOTS.OUTERWEAR:
        pool.outerwear.push(item);
        break;
      case WARDROBE_SLOTS.ONE_PIECE:
        pool.onePieces.push(item);
        break;
      case WARDROBE_SLOTS.ACCESSORY:
        pool.accessories.push(item);
        break;
      default:
        pool.tops.push(item);
    }
  }

  return pool;
}

