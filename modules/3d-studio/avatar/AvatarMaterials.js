/**
 * Woobi - 3D Studio Avatar Module
 * AvatarMaterials.js - PBR Material Definitions and Dynamic Color Updates
 */

export const AVATAR_PALETTE = {
  skinWarmIvory: 0xF3D5C6,
  hairRichEspresso: 0x1E120A,
  lipSatinRosy: 0xCE6F66,
  blushSoftCoral: 0xDE8B80,
  scleraWhite: 0xFAF8F5,
  irisEspresso: 0x2A190E,
  pupilDeepBlack: 0x0A0604,
  catchlightWhite: 0xFFFFFF,
  lashBlack: 0x1A100A,
  browDarkBrown: 0x24160E,
  earringWarmBrass: 0xD4AF37,
  cropTankIvory: 0xF7F5F0,
  trousersSand: 0xD6C7B2,
  sneakersWhite: 0xFCFCFC,
  sneakersSole: 0xEDE8DF,
  hairTieDark: 0x140E0A
};

export class AvatarMaterials {
  constructor(textures = {}, THREE = window.THREE) {
    this.THREE = THREE;
    this.textures = textures || {};
    this.skinMaterials = [];
    this.hairMaterials = [];
    this.lipMaterials = [];
    this.blushMaterials = [];
    this.nailMaterials = [];
    this.disposables = [];

    this.initMaterials();
  }

  initMaterials() {
    const THREE = this.THREE;
    if (!THREE) return;

    // Primary Warm Radiant Ivory Skin Material
    this.skinMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.skinWarmIvory,
      roughness: 0.38,
      metalness: 0.02
    });
    this.skinMaterials.push(this.skinMat);
    this.disposables.push(this.skinMat);

    // Rich Espresso Brown Hair Material
    this.hairMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.hairRichEspresso,
      roughness: 0.28,
      metalness: 0.04
    });
    this.hairMaterials.push(this.hairMat);
    this.disposables.push(this.hairMat);

    // Satin Rosy Lip Material
    this.lipMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.lipSatinRosy,
      roughness: 0.24,
      metalness: 0.02
    });
    this.lipMaterials.push(this.lipMat);
    this.disposables.push(this.lipMat);

    // Soft Blushing Cheek Material
    this.blushMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.blushSoftCoral,
      roughness: 0.55,
      transparent: true,
      opacity: 0.35
    });
    this.blushMaterials.push(this.blushMat);
    this.disposables.push(this.blushMat);

    // Facial Hair Material (Beard & Moustache) - registered with hairMaterials for sync
    this.beardMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.hairRichEspresso,
      roughness: 0.45,
      metalness: 0.02
    });
    this.hairMaterials.push(this.beardMat);
    this.disposables.push(this.beardMat);

    // Fingernail Material with dynamic finish & color
    this.nailMat = new THREE.MeshStandardMaterial({
      color: 0xE8C5B8,
      roughness: 0.15,
      metalness: 0.05
    });
    this.nailMaterials.push(this.nailMat);
    this.disposables.push(this.nailMat);

    // Eye Anatomy Materials
    this.scleraMat = new THREE.MeshBasicMaterial({ color: AVATAR_PALETTE.scleraWhite });
    this.irisMat = new THREE.MeshStandardMaterial({ color: AVATAR_PALETTE.irisEspresso, roughness: 0.22 });
    this.pupilMat = new THREE.MeshBasicMaterial({ color: AVATAR_PALETTE.pupilDeepBlack });
    this.glintMat = new THREE.MeshBasicMaterial({ color: AVATAR_PALETTE.catchlightWhite });
    this.lashMat = new THREE.MeshBasicMaterial({ color: AVATAR_PALETTE.lashBlack });
    this.browMat = new THREE.MeshBasicMaterial({ color: AVATAR_PALETTE.browDarkBrown });
    this.hairMaterials.push(this.browMat);
    this.disposables.push(this.scleraMat, this.irisMat, this.pupilMat, this.glintMat, this.lashMat, this.browMat);

    // Gold Hoop Earring Material
    this.hoopMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.earringWarmBrass,
      metalness: 0.90,
      roughness: 0.20
    });
    this.disposables.push(this.hoopMat);

    // Wearable Crop Tank Top Material with Tactile Ribbed Depth
    this.tankMat = new THREE.MeshStandardMaterial({
      map: this.textures.ribbedKnit || null,
      bumpMap: this.textures.ribbedKnit || null,
      bumpScale: 0.0035,
      color: AVATAR_PALETTE.cropTankIvory,
      roughness: 0.65,
      metalness: 0.02
    });
    this.disposables.push(this.tankMat);

    // Fluid Tailored Sand Trousers Material with Tactile Linen Weave Depth
    this.trouserMat = new THREE.MeshStandardMaterial({
      map: this.textures.linenWeave || null,
      bumpMap: this.textures.linenWeave || null,
      bumpScale: 0.0030,
      color: AVATAR_PALETTE.trousersSand,
      roughness: 0.76,
      metalness: 0.01
    });
    this.disposables.push(this.trouserMat);

    // Chunky Platform Sneakers Materials (Crisp White Leather Upper + Textured Rubber Sole)
    this.sneakerMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.sneakersWhite,
      roughness: 0.28,
      metalness: 0.02
    });
    this.soleMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.sneakersSole,
      roughness: 0.58,
      metalness: 0.00
    });
    this.disposables.push(this.sneakerMat, this.soleMat);

    // Hair Tie Wrap Material
    this.hairTieMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.hairTieDark
    });
    this.disposables.push(this.hairTieMat);
  }

  updateSkinTone(hex) {
    if (!hex || !this.THREE) return;
    const col = new this.THREE.Color(hex);
    this.skinMaterials.forEach((mat) => {
      if (mat && mat.color) {
        mat.color.copy(col);
        mat.needsUpdate = true;
      }
    });
  }

  updateHairColor(hex) {
    if (!hex || !this.THREE) return;
    const col = new this.THREE.Color(hex);
    this.hairMaterials.forEach((mat) => {
      if (mat && mat.color) {
        mat.color.copy(col);
        mat.needsUpdate = true;
      }
    });
  }

  updateLipstick(hex, finish = 'satin') {
    if (!this.THREE || !hex) return;
    const col = new this.THREE.Color(hex);
    this.lipMaterials.forEach((mat) => {
      if (!mat) return;
      if (mat.color) mat.color.copy(col);
      switch (finish) {
        case 'matte':
          mat.roughness = 0.65;
          mat.metalness = 0.0;
          break;
        case 'gloss':
          mat.roughness = 0.12;
          mat.metalness = 0.05;
          break;
        case 'metallic':
          mat.roughness = 0.28;
          mat.metalness = 0.45;
          break;
        case 'satin':
        default:
          mat.roughness = 0.24;
          mat.metalness = 0.02;
          break;
      }
      mat.needsUpdate = true;
    });
  }

  updateBlush(hex, opacity = 0.35) {
    if (!this.THREE) return;
    const col = hex ? new this.THREE.Color(hex) : null;
    const op = (typeof opacity === 'number') ? Math.max(0, Math.min(1, opacity)) : 0.35;
    this.blushMaterials.forEach((mat) => {
      if (!mat) return;
      if (col && mat.color) mat.color.copy(col);
      mat.transparent = true;
      mat.opacity = op;
      mat.needsUpdate = true;
    });
  }

  updateNailFinish(hex, finish = 'gloss') {
    if (!this.THREE) return;
    const col = hex ? new this.THREE.Color(hex) : null;
    this.nailMaterials.forEach((mat) => {
      if (!mat) return;
      if (col && mat.color) mat.color.copy(col);
      switch (finish) {
        case 'matte':
          mat.roughness = 0.75;
          mat.metalness = 0.0;
          break;
        case 'chrome':
          mat.roughness = 0.08;
          mat.metalness = 0.90;
          break;
        case 'metallic':
          mat.roughness = 0.22;
          mat.metalness = 0.65;
          break;
        case 'glitter':
          mat.roughness = 0.32;
          mat.metalness = 0.40;
          break;
        case 'gloss':
        default:
          mat.roughness = 0.15;
          mat.metalness = 0.05;
          break;
      }
      mat.needsUpdate = true;
    });
  }

  registerSkinMaterial(mat) {
    if (mat && !this.skinMaterials.includes(mat)) {
      this.skinMaterials.push(mat);
    }
  }

  registerHairMaterial(mat) {
    if (mat && !this.hairMaterials.includes(mat)) {
      this.hairMaterials.push(mat);
    }
  }

  registerLipMaterial(mat) {
    if (mat && !this.lipMaterials.includes(mat)) {
      this.lipMaterials.push(mat);
    }
  }

  registerBlushMaterial(mat) {
    if (mat && !this.blushMaterials.includes(mat)) {
      this.blushMaterials.push(mat);
    }
  }

  registerNailMaterial(mat) {
    if (mat && !this.nailMaterials.includes(mat)) {
      this.nailMaterials.push(mat);
    }
  }

  dispose() {
    this.disposables.forEach((mat) => {
      if (mat && typeof mat.dispose === 'function') {
        mat.dispose();
      }
    });
    this.disposables = [];
    this.skinMaterials = [];
    this.hairMaterials = [];
    this.lipMaterials = [];
    this.blushMaterials = [];
    this.nailMaterials = [];
  }
}
