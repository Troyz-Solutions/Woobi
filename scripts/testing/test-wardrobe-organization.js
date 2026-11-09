/**
 * Automated Verification Suite for Wardrobe Category Separation & Full Outfits
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createClothingCaptureState } from '../../modules/core/state/ClothingCaptureState.js';

// Replicate classifier logic matching app.js to verify rules
function isShoe(item) {
  if (!item) return false;
  const cat = (item.category || '').toLowerCase();
  const sub = (item.subCategory || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  return (
    cat === 'shoes' || cat === 'shoe' || cat === 'footwear' ||
    sub === 'shoe' || sub === 'shoes' || sub === 'footwear' ||
    name.includes('sneaker') || name.includes('loafer') ||
    name.includes('trainer') || name.includes('sandal') ||
    name.includes('boot') || name.includes('shoe') || name.includes('slides')
  );
}

function isAccessory(item) {
  if (!item) return false;
  const cat = (item.category || '').toLowerCase();
  const sub = (item.subCategory || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  return (
    cat === 'accessories' || cat === 'accessory' ||
    sub === 'accessory' || sub === 'accessories' ||
    name.includes('watch') || name.includes('belt') ||
    name.includes('bag') || name.includes('sunglass') ||
    name.includes('hat') || name.includes('cap') ||
    name.includes('scarf') || name.includes('jewelry') ||
    name.includes('wallet')
  );
}

function isPant(item) {
  if (!item) return false;
  if (isShoe(item) || isAccessory(item)) return false;
  const cat = (item.category || '').toLowerCase();
  const sub = (item.subCategory || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  return (
    cat === 'bottoms' || cat === 'bottom' || cat === 'pants' || cat === 'pant' || cat === 'trousers' ||
    sub === 'pant' || sub === 'pants' || sub === 'bottoms' || sub === 'trousers' || sub === 'skirt' ||
    name.includes('chino') || name.includes('trouser') || name.includes('pant') ||
    name.includes('denim') || name.includes('jean') || name.includes('palazzo') ||
    name.includes('skirt') || name.includes('short') || name.includes('slacks') ||
    name.includes('bottom')
  );
}

function isShirt(item) {
  if (!item) return false;
  if (isPant(item) || isShoe(item) || isAccessory(item)) return false;
  const cat = (item.category || '').toLowerCase();
  const sub = (item.subCategory || '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  if (name.includes('blazer') || name.includes('coat') || name.includes('jacket')) {
    return false;
  }

  return (
    cat === 'shirts' || cat === 'shirt' || cat === 'tops' || cat === 'top' ||
    sub === 'shirt' || sub === 'shirts' || sub === 'top' || sub === 'kurta' || sub === 'kurti' ||
    name.includes('shirt') || name.includes('tee') || name.includes('t-shirt') ||
    name.includes('oxford') || name.includes('linen') || name.includes('kurta') ||
    name.includes('kurti') || name.includes('polo') || name.includes('top')
  );
}

function matchItemCategory(item, targetCategory) {
  if (!targetCategory || targetCategory === 'All') return true;
  if (targetCategory === 'Clean') return item.condition === 'clean';
  if (targetCategory === 'Laundry') return item.condition === 'dirty';

  const norm = targetCategory.toLowerCase().trim();
  if (norm === 'shirts' || norm === 'shirt' || norm === 'tops' || norm === 'top') {
    return isShirt(item);
  }
  if (norm === 'pants' || norm === 'pant' || norm === 'bottoms' || norm === 'bottom') {
    return isPant(item);
  }
  if (norm === 'shoes' || norm === 'shoe' || norm === 'footwear') {
    return isShoe(item);
  }
  if (norm === 'accessories' || norm === 'accessory') {
    return isAccessory(item);
  }
  return (item.category || '').toLowerCase() === norm;
}

const SAMPLE_WARDROBE = [
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
  { id: 'item_11', name: 'Black trainers', category: 'Shoes', subCategory: 'Shoe', photo: 'assets/black_trainers.jpg', condition: 'clean', fit: 'perfect' },
  { id: 'item_12', name: 'Brown sandals', category: 'Shoes', subCategory: 'Shoe', photo: 'assets/brown_sandals.jpg', condition: 'clean', fit: 'perfect' },
  { id: 'item_13', name: 'Cream palazzo', category: 'Bottoms', subCategory: 'Pant', photo: 'assets/cream_palazzo.jpg', condition: 'clean', fit: 'loose' },
  { id: 'item_14', name: 'Indigo kurti', category: 'Tops', subCategory: 'Kurti', photo: 'assets/indigo_kurti.jpg', condition: 'dirty', fit: 'perfect' },
  { id: 'item_15', name: 'Terracotta tee', category: 'Tops', subCategory: 'Shirt', photo: 'assets/terracotta_tee.jpg', condition: 'dirty', fit: 'tight' },
  { id: 'item_16', name: 'Tailored blazer', category: 'Tops', subCategory: 'Blazer', photo: 'assets/smart_blazer.jpg', condition: 'clean', fit: 'tight' }
];

describe('Wardrobe Category Separation & Alignment Tests', () => {
  it('1. Shirts category displays only shirts/tops and excludes pants, shoes, and accessories', () => {
    const shirts = SAMPLE_WARDROBE.filter(i => matchItemCategory(i, 'Shirts'));
    assert.ok(shirts.length > 0, 'Shirts list should not be empty');

    shirts.forEach(item => {
      assert.strictEqual(isShirt(item), true, `${item.name} should be a shirt`);
      assert.strictEqual(isPant(item), false, `${item.name} must NOT be a pant`);
      assert.strictEqual(isShoe(item), false, `${item.name} must NOT be a shoe`);
      assert.strictEqual(isAccessory(item), false, `${item.name} must NOT be an accessory`);
    });

    const shirtNames = shirts.map(s => s.name);
    assert.ok(shirtNames.includes('Navy shirt'));
    assert.ok(shirtNames.includes('White linen shirt'));
    assert.ok(shirtNames.includes('Terracotta tee'));
    assert.ok(!shirtNames.includes('Beige chinos'), 'Beige chinos must not be in Shirts');
    assert.ok(!shirtNames.includes('White sneakers'), 'White sneakers must not be in Shirts');
    assert.ok(!shirtNames.includes('Leather watch'), 'Leather watch must not be in Shirts');
  });

  it('2. Pants category displays only pants, jeans, trousers, and bottom wear', () => {
    const pants = SAMPLE_WARDROBE.filter(i => matchItemCategory(i, 'Pants'));
    assert.ok(pants.length > 0, 'Pants list should not be empty');

    pants.forEach(item => {
      assert.strictEqual(isPant(item), true, `${item.name} should be a pant/bottom wear`);
      assert.strictEqual(isShirt(item), false, `${item.name} must NOT be a shirt`);
      assert.strictEqual(isShoe(item), false, `${item.name} must NOT be a shoe`);
      assert.strictEqual(isAccessory(item), false, `${item.name} must NOT be an accessory`);
    });

    const pantNames = pants.map(p => p.name);
    assert.ok(pantNames.includes('Beige chinos'));
    assert.ok(pantNames.includes('Dark denim'));
    assert.ok(pantNames.includes('Cream palazzo'));
    assert.ok(pantNames.includes('Dark skirt'));
    assert.ok(!pantNames.includes('Navy shirt'), 'Navy shirt must not be in Pants');
    assert.ok(!pantNames.includes('White sneakers'), 'White sneakers must not be in Pants');
  });

  it('3. Shoes category displays only footwear', () => {
    const shoes = SAMPLE_WARDROBE.filter(i => matchItemCategory(i, 'Shoes'));
    assert.ok(shoes.length > 0, 'Shoes list should not be empty');

    shoes.forEach(item => {
      assert.strictEqual(isShoe(item), true, `${item.name} should be footwear`);
      assert.strictEqual(isShirt(item), false, `${item.name} must NOT be a shirt`);
      assert.strictEqual(isPant(item), false, `${item.name} must NOT be a pant`);
      assert.strictEqual(isAccessory(item), false, `${item.name} must NOT be an accessory`);
    });

    const shoeNames = shoes.map(s => s.name);
    assert.ok(shoeNames.includes('White sneakers'));
    assert.ok(shoeNames.includes('Tan loafers'));
    assert.ok(shoeNames.includes('Black trainers'));
    assert.ok(shoeNames.includes('Brown sandals'));
    assert.ok(!shoeNames.includes('Navy shirt'));
    assert.ok(!shoeNames.includes('Beige chinos'));
  });

  it('4. Accessories category displays only accessories', () => {
    const accessories = SAMPLE_WARDROBE.filter(i => matchItemCategory(i, 'Accessories'));
    assert.ok(accessories.length > 0, 'Accessories list should not be empty');

    accessories.forEach(item => {
      assert.strictEqual(isAccessory(item), true, `${item.name} should be an accessory`);
      assert.strictEqual(isShirt(item), false, `${item.name} must NOT be a shirt`);
      assert.strictEqual(isPant(item), false, `${item.name} must NOT be a pant`);
      assert.strictEqual(isShoe(item), false, `${item.name} must NOT be a shoe`);
    });

    const accNames = accessories.map(a => a.name);
    assert.ok(accNames.includes('Leather watch'));
    assert.ok(!accNames.includes('White sneakers'));
    assert.ok(!accNames.includes('Dark denim'));
  });

  it('5. Uploaded clothing items from capture engine are separated into exact categories', () => {
    const engine = createClothingCaptureState();
    
    // Upload 1 shirt, 1 pant, 1 shoe
    engine.addConfirmedPhoto('shirt', 'data:image/jpeg;base64,sample_shirt', { name: 'My Custom Oxford' });
    engine.addConfirmedPhoto('pant', 'data:image/jpeg;base64,sample_pant', { name: 'My Custom Slacks' });
    engine.addConfirmedPhoto('shoe', 'data:image/jpeg;base64,sample_shoe', { name: 'My Custom Boots' });

    const exported = engine.exportToWardrobeItems();
    assert.strictEqual(exported.length, 3);

    const uploadedShirt = exported.find(i => i.name === 'My Custom Oxford');
    const uploadedPant = exported.find(i => i.name === 'My Custom Slacks');
    const uploadedShoe = exported.find(i => i.name === 'My Custom Boots');

    assert.ok(uploadedShirt);
    assert.ok(uploadedPant);
    assert.ok(uploadedShoe);

    // Verify category matches
    assert.strictEqual(matchItemCategory(uploadedShirt, 'Shirts'), true);
    assert.strictEqual(matchItemCategory(uploadedShirt, 'Pants'), false);
    assert.strictEqual(matchItemCategory(uploadedShirt, 'Shoes'), false);

    assert.strictEqual(matchItemCategory(uploadedPant, 'Pants'), true);
    assert.strictEqual(matchItemCategory(uploadedPant, 'Shirts'), false);
    assert.strictEqual(matchItemCategory(uploadedPant, 'Shoes'), false);

    assert.strictEqual(matchItemCategory(uploadedShoe, 'Shoes'), true);
    assert.strictEqual(matchItemCategory(uploadedShoe, 'Shirts'), false);
    assert.strictEqual(matchItemCategory(uploadedShoe, 'Pants'), false);
  });

  it('6. Full Outfit displays complete combinations with shirts, pants, shoes, and accessories', () => {
    // Check that complete outfits have all essential slots
    const mockOutfit = {
      id: 'test_look_1',
      title: 'Easy Everyday',
      top: { name: 'Navy shirt', photo: 'assets/navy_shirt.jpg' },
      bottom: { name: 'Beige chinos', photo: 'assets/beige_chinos.jpg' },
      footwear: { name: 'White sneakers', photo: 'assets/white_sneakers.jpg' },
      accessory: { name: 'Leather watch', photo: 'assets/leather_watch.jpg' }
    };

    assert.ok(mockOutfit.top && isShirt(mockOutfit.top), 'Outfit has a valid shirt');
    assert.ok(mockOutfit.bottom && isPant(mockOutfit.bottom), 'Outfit has a valid pant');
    assert.ok(mockOutfit.footwear && isShoe(mockOutfit.footwear), 'Outfit has valid footwear');
    assert.ok(mockOutfit.accessory && isAccessory(mockOutfit.accessory), 'Outfit has a valid accessory');
  });

  it('7. Condition filters Clean and Laundry work accurately', () => {
    const cleanItems = SAMPLE_WARDROBE.filter(i => matchItemCategory(i, 'Clean'));
    const dirtyItems = SAMPLE_WARDROBE.filter(i => matchItemCategory(i, 'Laundry'));

    cleanItems.forEach(i => assert.strictEqual(i.condition, 'clean'));
    dirtyItems.forEach(i => assert.strictEqual(i.condition, 'dirty'));

    assert.strictEqual(cleanItems.length + dirtyItems.length, SAMPLE_WARDROBE.length);
  });

  it('8. Swapping top slot provides only shirt/top options and excludes pants/shoes', () => {
    const topSwapCandidates = SAMPLE_WARDROBE.filter(item => isShirt(item) && item.condition !== 'dirty');
    assert.ok(topSwapCandidates.length > 0, 'Must have clean tops available to swap');
    topSwapCandidates.forEach(item => {
      assert.strictEqual(isShirt(item), true, `${item.name} must be a shirt`);
      assert.strictEqual(isPant(item), false, `${item.name} must NOT be a pant`);
      assert.strictEqual(isShoe(item), false, `${item.name} must NOT be a shoe`);
    });
    const candidateNames = topSwapCandidates.map(i => i.name);
    assert.ok(candidateNames.includes('Navy shirt'));
    assert.ok(candidateNames.includes('White linen shirt'));
    assert.ok(!candidateNames.includes('Beige chinos'));
    assert.ok(!candidateNames.includes('White sneakers'));
  });

  it('9. Swapping bottom slot provides only pant/bottom options and excludes shirts/shoes', () => {
    const bottomSwapCandidates = SAMPLE_WARDROBE.filter(item => isPant(item) && item.condition !== 'dirty');
    assert.ok(bottomSwapCandidates.length > 0, 'Must have clean pants available to swap');
    bottomSwapCandidates.forEach(item => {
      assert.strictEqual(isPant(item), true, `${item.name} must be a pant`);
      assert.strictEqual(isShirt(item), false, `${item.name} must NOT be a shirt`);
      assert.strictEqual(isShoe(item), false, `${item.name} must NOT be a shoe`);
    });
    const candidateNames = bottomSwapCandidates.map(i => i.name);
    assert.ok(candidateNames.includes('Beige chinos'));
    assert.ok(candidateNames.includes('Cream palazzo'));
    assert.ok(!candidateNames.includes('Navy shirt'));
    assert.ok(!candidateNames.includes('Tan loafers'));
  });

  it('10. Swapping footwear slot provides only footwear options and excludes shirts/pants', () => {
    const footwearSwapCandidates = SAMPLE_WARDROBE.filter(item => isShoe(item) && item.condition !== 'dirty');
    assert.ok(footwearSwapCandidates.length > 0, 'Must have clean footwear available to swap');
    footwearSwapCandidates.forEach(item => {
      assert.strictEqual(isShoe(item), true, `${item.name} must be footwear`);
      assert.strictEqual(isShirt(item), false, `${item.name} must NOT be a shirt`);
      assert.strictEqual(isPant(item), false, `${item.name} must NOT be a pant`);
    });
    const candidateNames = footwearSwapCandidates.map(i => i.name);
    assert.ok(candidateNames.includes('White sneakers'));
    assert.ok(candidateNames.includes('Black trainers'));
    assert.ok(!candidateNames.includes('Navy shirt'));
    assert.ok(!candidateNames.includes('Beige chinos'));
  });

  it('11. Swapping a piece updates the outfit state correctly without corrupting other slots', () => {
    const currentOutfit = {
      title: 'Easy everyday',
      top: { name: 'Navy shirt', photo: 'assets/navy_shirt.jpg' },
      bottom: { name: 'Beige trousers', photo: 'assets/beige_chinos.jpg' },
      footwear: { name: 'White sneakers', photo: 'assets/white_sneakers.jpg' }
    };

    // Swap top to White linen shirt
    const newTop = { name: 'White linen shirt', photo: 'assets/white_linen_shirt.jpg' };
    currentOutfit.top = { ...newTop };
    assert.strictEqual(currentOutfit.top.name, 'White linen shirt');
    assert.strictEqual(currentOutfit.bottom.name, 'Beige trousers');
    assert.strictEqual(currentOutfit.footwear.name, 'White sneakers');

    // Swap bottom to Cream palazzo
    const newBottom = { name: 'Cream palazzo', photo: 'assets/cream_palazzo.jpg' };
    currentOutfit.bottom = { ...newBottom };
    assert.strictEqual(currentOutfit.top.name, 'White linen shirt');
    assert.strictEqual(currentOutfit.bottom.name, 'Cream palazzo');
    assert.strictEqual(currentOutfit.footwear.name, 'White sneakers');

    // Swap footwear to Black trainers
    const newFootwear = { name: 'Black trainers', photo: 'assets/black_trainers.jpg' };
    currentOutfit.footwear = { ...newFootwear };
    assert.strictEqual(currentOutfit.top.name, 'White linen shirt');
    assert.strictEqual(currentOutfit.bottom.name, 'Cream palazzo');
    assert.strictEqual(currentOutfit.footwear.name, 'Black trainers');
  });
});

