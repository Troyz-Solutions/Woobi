/**
 * Woobi 3D Studio - Vanity Materials
 * Material definitions for the Calacatta Gold marble tabletop, champagne-brass framing,
 * mirror glass surface, 360° LED halo ring, perfume glass, and bouclé upholstery.
 */

export class VanityMaterials {
  static createMarbleMaterial(THREE, marbleTexture = null, bumpTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: marbleTexture || null,
      bumpMap: bumpTexture || null,
      bumpScale: 0.003,
      roughness: 0.18,
      metalness: 0.04,
      color: 0xFAF7F2 // Luminous Italian Calacatta Gold polished marble
    });
  }

  static createLegsMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xD8BD8A, // Architectural champagne satin brushed brass
      metalness: 0.88,
      roughness: 0.22
    });
  }

  static createBrassMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xD8BE8C, // Luxurious French champagne satin brass
      metalness: 0.90,
      roughness: 0.18
    });
  }

  static createPolishedGoldMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xE2C48E, // High-specular Parisian brushed gold
      metalness: 0.92,
      roughness: 0.14
    });
  }

  static createLedGlowMaterial(THREE) {
    return new THREE.MeshBasicMaterial({
      color: 0xFFECD4 // 3000K warm diffused continuous LED radiance
    });
  }

  static createMirrorMaterial(THREE, reflectionTexture = null) {
    if (reflectionTexture) {
      if (typeof THREE.MeshBasicMaterial !== 'undefined') {
        return new THREE.MeshBasicMaterial({
          map: reflectionTexture,
          toneMapped: false
        });
      }
      return new THREE.MeshStandardMaterial({
        map: reflectionTexture,
        color: 0xFFFFFF,
        roughness: 0.02,
        metalness: 0.05
      });
    }
    return new THREE.MeshStandardMaterial({
      color: 0xEAE6DE,
      roughness: 0.04,
      metalness: 0.94
    });
  }

  static createMirrorBackMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0x2A241E,
      roughness: 0.60
    });
  }

  static createGlassMaterial(THREE, isAmber = false) {
    if (isAmber) {
      return new THREE.MeshStandardMaterial({
        color: 0xC88546,
        roughness: 0.12,
        metalness: 0.20,
        transparent: true,
        opacity: 0.85
      });
    }
    return new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.08,
      metalness: 0.15,
      transparent: true,
      opacity: 0.75
    });
  }

  static createBoucleMaterial(THREE, wovenTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: wovenTexture || null,
      color: 0xF5EFEB, // Luxurious cream bouclé upholstery
      roughness: 0.85,
      metalness: 0.02
    });
  }
}

export default VanityMaterials;
