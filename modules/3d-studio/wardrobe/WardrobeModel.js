/**
 * Woobi 3D Studio - Wardrobe Model
 * Encapsulates the natural honey-oak wardrobe furniture, Astra GLB model loader,
 * shelves, hanging garment rails, accessories, point lights, and hit boxes.
 */

import { WardrobeMaterials } from './WardrobeMaterials.js';
import { WardrobeAssets } from './WardrobeAssets.js';
import { WardrobeAnimations } from './WardrobeAnimations.js';

export const WARDROBE_CONFIG = {
  scale: 2.40 / 3.00,
  width: 2.20 * (2.40 / 3.00),
  height: 3.00 * (2.40 / 3.00),
  depth: 0.65 * (2.40 / 3.00),
  position: { x: -1.65, y: 0, z: -3.50 },
  rotationY: 0.35
};

export class WardrobeModel {
  constructor(options = {}) {
    this.config = Object.assign({}, WARDROBE_CONFIG, options);
    this.group = null;
    this.disposables = [];
    this.interactiveObjects = [];
    this.animations = new WardrobeAnimations();
    this.isGLBLoaded = false;
  }

  /**
   * Builds the wardrobe hierarchy and mounts it to the scene.
   */
  build(scene, textures = {}, THREEInstance = (typeof window !== 'undefined' ? window.THREE : null)) {
    const THREE = THREEInstance;
    if (!THREE || !scene) {
      throw new Error('[WardrobeModel] THREE or scene missing during wardrobe build.');
    }

    this.group = new THREE.Group();
    this.group.name = 'woobi_wardrobe_root';
    this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
    this.group.rotation.y = this.config.rotationY;

    const { width, height, depth, scale } = this.config;

    // 1. Raycastable hit box for touch / click interaction
    const hitGeo = new THREE.BoxGeometry(width + 0.2, height, depth + 0.3);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitGeo, hitMat);
    hitBox.position.set(0, height / 2, 0);
    hitBox.userData = { interactiveType: 'wardrobe', name: 'Built-in Oak Wardrobe' };
    this.group.add(hitBox);
    this.interactiveObjects.push(hitBox);
    this.disposables.push(hitGeo, hitMat);

    // 2. Procedural Built-In Natural Oak Wardrobe
    const proceduralGroup = new THREE.Group();
    proceduralGroup.name = 'procedural_wardrobe';

    const oakMat = WardrobeMaterials.createOakMaterial(THREE, textures.oak, textures.oakBump);
    const brassMat = WardrobeMaterials.createBrassMaterial(THREE);
    const ledMat = WardrobeMaterials.createLedMaterial(THREE);
    this.disposables.push(oakMat, brassMat, ledMat);

    // Outer Frame
    const topCapGeo = new THREE.BoxGeometry(width, 0.040, depth);
    const topCap = new THREE.Mesh(topCapGeo, oakMat);
    topCap.position.set(0, height - 0.020, 0);
    topCap.castShadow = true;
    proceduralGroup.add(topCap);
    this.disposables.push(topCapGeo);

    const sideGeo = new THREE.BoxGeometry(0.040, height, depth);
    const leftSide = new THREE.Mesh(sideGeo, oakMat);
    leftSide.position.set(-width / 2 + 0.020, height / 2, 0);
    leftSide.castShadow = true;
    proceduralGroup.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeo, oakMat);
    rightSide.position.set(width / 2 - 0.020, height / 2, 0);
    rightSide.castShadow = true;
    proceduralGroup.add(rightSide);
    this.disposables.push(sideGeo);

    const backGeo = new THREE.BoxGeometry(width - 0.08, height - 0.04, 0.02);
    const backBoard = new THREE.Mesh(backGeo, oakMat);
    backBoard.position.set(0, height / 2, -depth / 2 + 0.01);
    backBoard.receiveShadow = true;
    proceduralGroup.add(backBoard);
    this.disposables.push(backGeo);

    const plinthGeo = new THREE.BoxGeometry(width, 0.12, depth - 0.04);
    const plinth = new THREE.Mesh(plinthGeo, oakMat);
    plinth.position.set(0, 0.06, 0.02);
    proceduralGroup.add(plinth);
    this.disposables.push(plinthGeo);

    // Shelves with integrated warm LED glow strips
    // Balanced 3-tier layout: Bottom footwear shelf (0.12), Footwear separator (0.60), Upper shelf (2.22)
    const shelfYPositions = [0.12, 0.60, 2.22];
    const shelfGeo = new THREE.BoxGeometry(width - 0.08, 0.030, depth - 0.02);
    this.disposables.push(shelfGeo);

    shelfYPositions.forEach((shY) => {
      const shelf = new THREE.Mesh(shelfGeo, oakMat);
      shelf.position.set(0, shY, 0);
      shelf.receiveShadow = true;
      shelf.castShadow = true;
      proceduralGroup.add(shelf);

      if (shY > 0.12) {
        const ledStripGeo = new THREE.BoxGeometry(width - 0.09, 0.010, 0.032);
        const ledStrip = new THREE.Mesh(ledStripGeo, ledMat);
        ledStrip.position.set(0, shY - 0.020, 0.08);
        proceduralGroup.add(ledStrip);
        this.disposables.push(ledStripGeo);
      }
    });

    // Internal shelf warm point lights
    if (typeof THREE.PointLight !== 'undefined') {
      const shelfLight1 = new THREE.PointLight(0xFFA834, 1.15, 2.8);
      shelfLight1.position.set(0, 2.15, 0.14);
      proceduralGroup.add(shelfLight1);

      const shelfLight2 = new THREE.PointLight(0xFFA834, 0.90, 2.2);
      shelfLight2.position.set(0, 1.35, 0.14);
      proceduralGroup.add(shelfLight2);

      const shelfLight3 = new THREE.PointLight(0xFFA834, 0.80, 1.8);
      shelfLight3.position.set(0, 0.55, 0.14);
      proceduralGroup.add(shelfLight3);
    }

    // Top Shelf Luxury White Box with Brass Pull
    const boxMat = WardrobeMaterials.createBoxMaterial(THREE);
    const boxGeo = new THREE.BoxGeometry(0.32, 0.18, 0.36);
    const topBox = new THREE.Mesh(boxGeo, boxMat);
    topBox.position.set(-0.25, 2.33, 0);
    topBox.castShadow = true;
    proceduralGroup.add(topBox);
    this.disposables.push(boxMat, boxGeo);

    // 1. Upper clothing rail with neatly hung shirts (positioned slightly upwards, balanced)
    const railY = 2.16;
    const railGeo = new THREE.CylinderGeometry(0.011, 0.011, width - 0.08, 16);
    const rail = new THREE.Mesh(railGeo, brassMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, railY, 0);
    rail.castShadow = true;
    proceduralGroup.add(rail);
    this.disposables.push(railGeo);

    // Hanging shirts on upper rail (Linked with Wardrobe Items & Interactive Drag)
    const shirtData = [
      { id: 'item_1', name: 'Navy Shirt', color: 0x22354A, photo: 'assets/navy_shirt.jpg', category: 'Tops', modelId: 'navy_shirt', type: 'top' },
      { id: 'item_7', name: 'White Linen Shirt', color: 0xF5F0E6, photo: 'assets/white_linen_shirt.jpg', category: 'Tops', modelId: 'wide_linen', type: 'top' },
      { id: 'item_3', name: 'Cream Kurta', color: 0xEDE2CE, photo: 'assets/olive_kurta.jpg', category: 'Tops', modelId: 'cardigan', type: 'top' },
      { id: 'item_16', name: 'Tailored Blazer', color: 0x8C7456, photo: 'assets/smart_blazer.jpg', category: 'Tops', modelId: 'blazer', type: 'top' },
      { id: 'item_5', name: 'Maroon Top', color: 0x6E1D24, photo: 'assets/maroon_top.jpg', category: 'Tops', modelId: 'tank', type: 'top' }
    ];

    const shirtOffsets = [-0.32, -0.16, 0.00, 0.16, 0.32];
    shirtData.forEach((sd, idx) => {
      const sx = shirtOffsets[idx];
      const hanger = new THREE.Group();
      hanger.position.set(sx, railY, 0);

      const hBarGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.28, 12);
      const hBar = new THREE.Mesh(hBarGeo, oakMat);
      hBar.rotation.z = Math.PI / 2;
      hBar.position.y = -0.04;
      hanger.add(hBar);

      const hookGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.035, 8);
      const hook = new THREE.Mesh(hookGeo, brassMat);
      hook.position.y = -0.015;
      hanger.add(hook);

      const shirtGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.46, 16);
      const shirtMat = new THREE.MeshStandardMaterial({
        color: sd.color,
        roughness: 0.65,
        metalness: 0.03
      });

      const shirtMesh = new THREE.Mesh(shirtGeo, shirtMat);
      shirtMesh.position.y = -0.28;
      shirtMesh.castShadow = true;
      hanger.add(shirtMesh);

      hanger.userData = {
        interactiveType: 'wardrobe_garment',
        garmentId: sd.id,
        garmentName: sd.name,
        garmentCategory: sd.category,
        modelId: sd.modelId,
        engineCategory: sd.type,
        photo: sd.photo,
        color: sd.color
      };

      proceduralGroup.add(hanger);
      this.interactiveObjects.push(hanger);
      this.disposables.push(hBarGeo, hookGeo, shirtGeo, shirtMat);
    });

    // 2. Horizontal hanging rod directly below shirts section & vertically hanging trousers
    const trouserRailY = 1.38;
    const trRailGeo = new THREE.CylinderGeometry(0.010, 0.010, width - 0.08, 16);
    const trRail = new THREE.Mesh(trRailGeo, brassMat);
    trRail.rotation.z = Math.PI / 2;
    trRail.position.set(0, trouserRailY, 0);
    trRail.castShadow = true;
    proceduralGroup.add(trRail);
    this.disposables.push(trRailGeo);

    // Hanging trousers on lower rail (Linked with Wardrobe Items & Interactive Drag)
    const trouserData = [
      { id: 'item_2', name: 'Beige Chinos', color: 0xD4B896, photo: 'assets/beige_chinos.jpg', category: 'Bottoms', modelId: 'taupe_wide', type: 'bottom', len: 0.44 },
      { id: 'item_8', name: 'Dark Denim', color: 0x1E2A3A, photo: 'assets/dark_denim.jpg', category: 'Bottoms', modelId: 'dark_denim', type: 'bottom', len: 0.48 },
      { id: 'item_6', name: 'Dark Skirt', color: 0x2A2B30, photo: 'assets/dark_skirt.jpg', category: 'Bottoms', modelId: 'dark_skirt', type: 'bottom', len: 0.42 },
      { id: 'item_13', name: 'Cream Palazzo', color: 0xF2ECE2, photo: 'assets/cream_palazzo.jpg', category: 'Bottoms', modelId: 'taupe_wide', type: 'bottom', len: 0.46 }
    ];

    const trouserOffsets = [-0.27, -0.09, 0.09, 0.27];
    trouserData.forEach((td, idx) => {
      const tx = trouserOffsets[idx];
      const trHanger = new THREE.Group();
      trHanger.position.set(tx, trouserRailY, 0);

      const clipBarGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.22, 10);
      const clipBar = new THREE.Mesh(clipBarGeo, oakMat);
      clipBar.rotation.z = Math.PI / 2;
      clipBar.position.y = -0.03;
      trHanger.add(clipBar);

      const legGeo = new THREE.BoxGeometry(0.13, td.len, 0.06);
      const trMat = new THREE.MeshStandardMaterial({
        color: td.color,
        roughness: 0.72,
        metalness: 0.02
      });

      const trMesh = new THREE.Mesh(legGeo, trMat);
      trMesh.position.set(0, -0.05 - td.len / 2, 0);
      trMesh.castShadow = true;
      trHanger.add(trMesh);

      trHanger.userData = {
        interactiveType: 'wardrobe_garment',
        garmentId: td.id,
        garmentName: td.name,
        garmentCategory: td.category,
        modelId: td.modelId,
        engineCategory: td.type,
        photo: td.photo,
        color: td.color
      };

      proceduralGroup.add(trHanger);
      this.interactiveObjects.push(trHanger);
      this.disposables.push(clipBarGeo, legGeo, trMat);
    });

    // 3. Dedicated Footwear Area below trousers (shoes, sneakers, and sandals)
    const shoeMatWhite = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.40 });
    const shoeMatSandal = new THREE.MeshStandardMaterial({ color: 0xC49E6C, roughness: 0.45, metalness: 0.02 });
    const shoeMatLoafer = new THREE.MeshStandardMaterial({ color: 0xF2ECE2, roughness: 0.38 });
    this.disposables.push(shoeMatWhite, shoeMatSandal, shoeMatLoafer);

    const footItems = [
      { x: -0.28, mat: shoeMatWhite,  type: 'sneaker' },
      { x: -0.09, mat: shoeMatSandal, type: 'sandal' },
      { x: 0.09,  mat: shoeMatSandal, type: 'sandal' },
      { x: 0.28,  mat: shoeMatLoafer, type: 'loafer' }
    ];

    footItems.forEach((fi) => {
      const sGeo = new THREE.BoxGeometry(0.10, 0.024, 0.16);
      const shoeMesh = new THREE.Mesh(sGeo, fi.mat);
      shoeMesh.position.set(fi.x, 0.14, 0.02);
      shoeMesh.castShadow = true;
      proceduralGroup.add(shoeMesh);
      this.disposables.push(sGeo);
    });

    this.group.add(proceduralGroup);

    // 3. Attempt to load authentic Astra 3D GLB wardrobe
    WardrobeAssets.loadAstraWardrobe(
      THREE,
      scale,
      (model) => {
        this.group.add(model);
        this.isGLBLoaded = true;
        proceduralGroup.visible = false;
      },
      () => {
        // Procedural group remains visible as primary representation
        this.isGLBLoaded = false;
      }
    );

    scene.add(this.group);
    return this.group;
  }

  openDoors() {
    this.animations.open();
  }

  closeDoors() {
    this.animations.close();
  }

  toggleDoors() {
    this.animations.toggle();
  }

  getWardrobeState() {
    return {
      isGLBLoaded: this.isGLBLoaded,
      ...this.animations.getState()
    };
  }

  dispose(scene) {
    if (this.group && scene) {
      scene.remove(this.group);
    }
    this.disposables.forEach(d => {
      if (d && typeof d.dispose === 'function') {
        d.dispose();
      }
    });
    this.disposables = [];
    this.interactiveObjects = [];
    this.group = null;
  }
}

export default WardrobeModel;
