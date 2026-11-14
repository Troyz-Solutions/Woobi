/**
 * Sérén Studio — Astra 3D Luxury Wardrobe Material & Styling Pipeline
 * Ensures 100% visual consistency between:
 * - wardrobe-preview.html
 * - studio-assets.html (Step 1 & Full Studio Scene)
 * - studio3d.js (Live Virtual Dressing Room in index.html)
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['three'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('three'));
  } else {
    root.AstraWardrobeStyling = factory(root.THREE);
  }
}(typeof self !== 'undefined' ? self : this, function(THREE) {
  'use strict';

  // Cached shared textures
  let cachedWoodTex = null;
  let cachedWoodBumpTex = null;
  let cachedStripedTex = null;

  function createWoodTexture() {
    if (cachedWoodTex) return cachedWoodTex;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base European natural oak gradient (Warm Mediterranean Luxury Honey Oak: #A87B4C)
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.00, '#A87B4C');
    grad.addColorStop(0.25, '#9A6D3E');
    grad.addColorStop(0.50, '#B68854');
    grad.addColorStop(0.75, '#8C6033');
    grad.addColorStop(1.00, '#A87B4C');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Natural European oak vertical growth rings, grain pores and fiber striations
    for (let i = 0; i < 520; i++) {
      const x = Math.random() * 1024;
      const alpha = 0.08 + Math.random() * 0.14;
      ctx.strokeStyle = Math.random() > 0.40 
        ? `rgba(60, 38, 16, ${alpha})` 
        : `rgba(190, 150, 110, ${alpha * 0.75})`;
      ctx.lineWidth = 0.6 + Math.random() * 2.4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(
        x + (Math.random() - 0.5) * 18, 340,
        x + (Math.random() - 0.5) * 18, 680,
        x + (Math.random() - 0.5) * 10, 1024
      );
      ctx.stroke();
    }

    // Realistic medullary ray flecks & oak pores
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i+1] = Math.min(255, Math.max(0, d[i+1] + noise * 0.82));
      d[i+2] = Math.min(255, Math.max(0, d[i+2] + noise * 0.62));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 3.5);
    cachedWoodTex = tex;
    return tex;
  }

  function createWoodBumpTexture() {
    if (cachedWoodBumpTex) return cachedWoodBumpTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 512;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(215, 215, 215, 0.12)' : 'rgba(45, 45, 45, 0.12)';
      ctx.lineWidth = 0.5 + Math.random() * 2.0;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 6, 512);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    cachedWoodBumpTex = tex;
    return tex;
  }

  function createStripedShirtTexture() {
    if (cachedStripedTex) return cachedStripedTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F8F7F4';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#2B394A'; // Navy stripes
    for (let y = 14; y < 512; y += 28) {
      ctx.fillRect(0, y, 512, 5);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    cachedStripedTex = tex;
    return tex;
  }

  function createMaterials() {
    const woodTex = createWoodTexture();
    const woodBumpTex = createWoodBumpTexture();
    const stripedTex = createStripedShirtTexture();

    return {
      oakFrame: new THREE.MeshStandardMaterial({
        map: woodTex,
        bumpMap: woodBumpTex,
        bumpScale: 0.006,
        color: 0xA27443, // Natural European honey oak with rich organic grain (#A27443)
        roughness: 0.46,
        metalness: 0.02
      }),
      oakBackboard: new THREE.MeshStandardMaterial({
        map: woodTex,
        bumpMap: woodBumpTex,
        bumpScale: 0.005,
        color: 0x946536, // Deeper honey oak backboard
        roughness: 0.52,
        metalness: 0.02
      }),
      oakDrawers: new THREE.MeshStandardMaterial({
        map: woodTex,
        bumpMap: woodBumpTex,
        bumpScale: 0.006,
        color: 0xA27443, // European oak drawer faces
        roughness: 0.44,
        metalness: 0.02
      }),
      brass: new THREE.MeshStandardMaterial({
        color: 0x74583D, // Antique bronze (#74583D)
        roughness: 0.35,
        metalness: 0.75
      }),
      hangerWood: new THREE.MeshStandardMaterial({
        color: 0xA87B4C, // European honey oak hanger wood
        roughness: 0.48,
        metalness: 0.02
      }),
      boxLinen: new THREE.MeshStandardMaterial({
        color: 0xF3EFE8, // Off-white linen
        roughness: 0.68,
        metalness: 0.01
      }),
      foliage: new THREE.MeshStandardMaterial({
        color: 0x547A36, // Olive leaf green
        roughness: 0.35,
        metalness: 0.02
      }),
      vineWood: new THREE.MeshStandardMaterial({
        color: 0x5C442A,
        roughness: 0.65,
        metalness: 0.01
      }),
      creamLeather: new THREE.MeshStandardMaterial({
        color: 0xEEE6DA,
        roughness: 0.46,
        metalness: 0.02
      }),
      whiteLeatherSneaker: new THREE.MeshStandardMaterial({
        color: 0xF8F7F4,
        roughness: 0.36,
        metalness: 0.02
      }),
      shoeSole: new THREE.MeshStandardMaterial({
        color: 0xDCC7B0, // Caramel/taupe gum sole
        roughness: 0.62,
        metalness: 0.02
      }),
      taupeSuede: new THREE.MeshStandardMaterial({
        color: 0xC2B29E,
        roughness: 0.68,
        metalness: 0.02
      }),
      leatherLoaferSole: new THREE.MeshStandardMaterial({
        color: 0xB5824C,
        roughness: 0.45,
        metalness: 0.02
      }),
      ledGlow: new THREE.MeshStandardMaterial({
        color: 0xFFF2DE,
        emissive: 0xFFF2DE,
        emissiveIntensity: 0.60,
        roughness: 0.30
      }),
      whitePoplin: new THREE.MeshStandardMaterial({ color: 0xF7F5F0, roughness: 0.65 }),
      creamSilk: new THREE.MeshStandardMaterial({ color: 0xEFE5D0, roughness: 0.38 }),
      beigeJacket: new THREE.MeshStandardMaterial({ color: 0xC4AE90, roughness: 0.70 }),
      charcoalWool: new THREE.MeshStandardMaterial({ color: 0x2E2E32, roughness: 0.75 }),
      ivoryKnit: new THREE.MeshStandardMaterial({ color: 0xEDE6D8, roughness: 0.72 }),
      neutralTrousers: new THREE.MeshStandardMaterial({ color: 0xA89C8A, roughness: 0.68 }),
      stripedShirt: new THREE.MeshStandardMaterial({ map: stripedTex, roughness: 0.60 }),
      ceramicWhite: new THREE.MeshStandardMaterial({ color: 0xF7F6F3, roughness: 0.25 }),
      soil: new THREE.MeshStandardMaterial({ color: 0x382A1E, roughness: 0.85 }),
      foldedGrey: new THREE.MeshStandardMaterial({ color: 0x6E6D69, roughness: 0.75 }),
      foldedOatmeal: new THREE.MeshStandardMaterial({ color: 0xD4C9B8, roughness: 0.72 }),
      foldedIvory: new THREE.MeshStandardMaterial({ color: 0xF4F0E6, roughness: 0.70 })
    };
  }

  /**
   * Traverse model meshes and apply the luxury Beige aesthetic palette:
   * Warm champagne beige tones, subtle cream accents, natural matte finishes,
   * enhanced fabric weave relief, and warm shelf illumination.
   */
  function applyMaterials(model) {
    if (!model) return;

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;

        const mat = child.material;

        // Enhance texture with warm champagne beige tone (#F5EAE0)
        if (mat.color && typeof mat.color.setHex === 'function') {
          mat.color.setHex(0xF5EAE0);
        }

        // Natural matte finish - eliminates artificial glossiness
        mat.roughness = 0.80;
        mat.metalness = 0.04;

        // Enhanced normal scale for realistic fabric folds and wood texture
        if (mat.normalMap && mat.normalScale && typeof mat.normalScale.set === 'function') {
          mat.normalScale.set(1.25, 1.25);
        }

        mat.needsUpdate = true;
      }
    });

    // Attach soft warm internal shelf illumination
    addShelfLights(model);
  }

  function addShelfLights(model) {
    if (!model || typeof THREE === 'undefined') return [];
    if (model.userData && model.userData.hasShelfLights) return [];
    model.userData = model.userData || {};
    model.userData.hasShelfLights = true;

    const lights = [];
    if (typeof THREE.PointLight === 'undefined') return lights;

    // Calibrated local coordinates for the new 3D wardrobe:
    // Front opening is +X, width is Z (-0.24 to +0.24), height is Y (-0.49 to +0.49)
    // 1. Top Accessories Shelf Light
    const topLight = new THREE.PointLight(0xFFE8D0, 0.45, 1.2);
    topLight.position.set(0.04, 0.35, 0);
    model.add(topLight);
    lights.push(topLight);

    // 2. Middle Garment Rail Light
    const midLight = new THREE.PointLight(0xFFE2C4, 0.40, 1.2);
    midLight.position.set(0.04, 0.02, 0);
    model.add(midLight);
    lights.push(midLight);

    // 3. Lower Footwear & Trousers Light
    const botLight = new THREE.PointLight(0xFFDFBD, 0.35, 1.0);
    botLight.position.set(0.04, -0.34, 0);
    model.add(botLight);
    lights.push(botLight);

    return lights;
  }

  return {
    applyMaterials: applyMaterials,
    createMaterials: createMaterials,
    createWoodTexture: createWoodTexture,
    addShelfLights: addShelfLights
  };
}));

