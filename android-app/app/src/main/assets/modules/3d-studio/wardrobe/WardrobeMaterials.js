/**
 * Woobi 3D Studio - Wardrobe Materials
 * Standardized PBR material configurations for the natural honey-oak wardrobe,
 * warm brass hardware, 3000K LED lighting, luxury storage, garments, and accessories.
 */

export class WardrobeMaterials {
  static createOakMaterial(THREE, woodTexture = null, bumpTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: woodTexture || null,
      bumpMap: bumpTexture || null,
      bumpScale: 0.006,
      color: 0xA27443, // Natural European honey oak with rich grain depth (#A27443)
      roughness: 0.48,
      metalness: 0.02
    });
  }

  static createBrassMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0x74583D, // Antique bronze (#74583D)
      metalness: 0.75,
      roughness: 0.35
    });
  }

  static createLedMaterial(THREE) {
    return new THREE.MeshBasicMaterial({
      color: 0xFFF2D0 // Warm 3000K recessed glow
    });
  }

  static createBoxMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xFAF7F2,
      roughness: 0.60
    });
  }

  static createPlantMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0x3E5E36,
      roughness: 0.55
    });
  }

  static createPotMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0x3A3632,
      roughness: 0.50
    });
  }

  static createBagMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xFDFBF7,
      roughness: 0.40,
      metalness: 0.02
    });
  }

  static createKnitMaterial(THREE, isCream = true) {
    return new THREE.MeshStandardMaterial({
      color: isCream ? 0xF3EFE6 : 0x8C8984,
      roughness: 0.85
    });
  }

  /**
   * Applies the elegant Beige Aesthetic to the 3D wardrobe model:
   * Warm champagne beige tones, natural matte finishes, enhanced normal depth,
   * and soft internal shelf illumination.
   */
  static applyBeigeAesthetic(model, THREE) {
    if (!model) return;

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;

        const mat = child.material;
        if (mat.color && typeof mat.color.setHex === 'function') {
          mat.color.setHex(0xF5EAE0); // Warm champagne beige
        }
        mat.roughness = 0.80; // Natural matte finish
        mat.metalness = 0.04; // Gentle sheen without excessive glossiness

        if (mat.normalMap && mat.normalScale && typeof mat.normalScale.set === 'function') {
          mat.normalScale.set(1.25, 1.25);
        }
        mat.needsUpdate = true;
      }
    });

    // Add calibrated warm internal illumination
    if (typeof THREE !== 'undefined' && typeof THREE.PointLight !== 'undefined') {
      if (!model.userData.hasShelfLights) {
        model.userData.hasShelfLights = true;

        const topLight = new THREE.PointLight(0xFFE8D0, 0.45, 1.2);
        topLight.position.set(0.04, 0.35, 0);
        model.add(topLight);

        const midLight = new THREE.PointLight(0xFFE2C4, 0.40, 1.2);
        midLight.position.set(0.04, 0.02, 0);
        model.add(midLight);

        const botLight = new THREE.PointLight(0xFFDFBD, 0.35, 1.0);
        botLight.position.set(0.04, -0.34, 0);
        model.add(botLight);
      }
    }
  }
}

export default WardrobeMaterials;
