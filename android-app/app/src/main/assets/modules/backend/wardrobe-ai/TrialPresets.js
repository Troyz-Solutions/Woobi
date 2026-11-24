/**
 * Woobi - AI Digital Wardrobe Engine
 * TrialPresets.js - Multi-Garment Trial Presets for In-App Demonstrations & Testing
 */

export const TRIAL_PRESETS = [
  {
    id: 'trial_klass_kombin',
    title: 'Klass Kombin Atelier',
    subtitle: 'Formal Editorial Flatlay',
    description: 'White structured formal shirt, tailored black pleated trousers, and artisan brown leather dress shoes.',
    badge: 'Formal Classic',
    image: 'assets/placeholder_outfit.jpg',
    garments: [
      {
        id: 'trial_item_shirt_white',
        name: 'White Poplin Dress Shirt',
        category: 'tops',
        subcategory: 'Shirt',
        colour: 'White',
        colourHex: '#FFFFFF',
        pattern: 'Solid',
        style: 'Formal',
        occasion: ['Office', 'Formal', 'Atelier'],
        tapCoordinates: { x: 0.50, y: 0.28 },
        thumbnail: 'assets/navy_shirt.jpg'
      },
      {
        id: 'trial_item_trousers_black',
        name: 'Black Pleated Wool Trousers',
        category: 'bottoms',
        subcategory: 'Trousers',
        colour: 'Black',
        colourHex: '#18181A',
        pattern: 'Solid',
        style: 'Formal',
        occasion: ['Office', 'Formal', 'Evening'],
        tapCoordinates: { x: 0.50, y: 0.62 },
        thumbnail: 'assets/beige_chinos.jpg'
      },
      {
        id: 'trial_item_shoes_brown',
        name: 'Artisan Derby Brown Shoes',
        category: 'shoes',
        subcategory: 'Leather Shoes',
        colour: 'Brown',
        colourHex: '#7C4A28',
        pattern: 'Solid',
        style: 'Formal',
        occasion: ['Office', 'Formal', 'Smart Casual'],
        tapCoordinates: { x: 0.50, y: 0.90 },
        thumbnail: 'assets/white_sneakers.jpg'
      }
    ]
  },
  {
    id: 'trial_minimal_weekend',
    title: 'Minimalist Weekend',
    subtitle: 'Relaxed Tailoring',
    description: 'Olive relaxed overshirt, cropped cream chinos, and crisp low-top leather trainers.',
    badge: 'Smart Casual',
    image: 'assets/placeholder_outfit.jpg',
    garments: [
      {
        id: 'trial_item_overshirt_olive',
        name: 'Olive Linen Overshirt',
        category: 'tops',
        subcategory: 'Overshirt',
        colour: 'Olive',
        colourHex: '#556B2F',
        pattern: 'Solid',
        style: 'Smart Casual',
        occasion: ['Weekend', 'Casual', 'Travel'],
        tapCoordinates: { x: 0.50, y: 0.28 },
        thumbnail: 'assets/olive_kurta.jpg'
      },
      {
        id: 'trial_item_chinos_cream',
        name: 'Beige Relaxed Chinos',
        category: 'bottoms',
        subcategory: 'Chinos',
        colour: 'Beige',
        colourHex: '#E6DCB8',
        pattern: 'Solid',
        style: 'Smart Casual',
        occasion: ['Weekend', 'Casual'],
        tapCoordinates: { x: 0.50, y: 0.62 },
        thumbnail: 'assets/beige_chinos.jpg'
      },
      {
        id: 'trial_item_sneakers_white',
        name: 'Minimalist White Trainers',
        category: 'shoes',
        subcategory: 'Sneakers',
        colour: 'White',
        colourHex: '#FDFDFD',
        pattern: 'Solid',
        style: 'Casual',
        occasion: ['Weekend', 'Casual', 'Everyday'],
        tapCoordinates: { x: 0.50, y: 0.90 },
        thumbnail: 'assets/white_sneakers.jpg'
      }
    ]
  }
];

export default TRIAL_PRESETS;
