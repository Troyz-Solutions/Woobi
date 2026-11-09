/**
 * Woobi 3D Studio - Wardrobe Assets
 * Handles GLTF/GLB asset loading, Astra styling pipeline integration,
 * and graceful fallback resolution for the 3D wardrobe.
 */

export const WARDROBE_ASSET_PATHS = [
  '3D- Wardrobe by Astra/wardrobe.glb',
  'wardrobe.glb',
  'wardrobe-revised-compressed.glb'
];

export class WardrobeAssets {
  /**
   * Attempts to load authentic 3D GLB wardrobe asset with DRACOLoader support.
   * @param {Object} THREE Three.js global instance
   * @param {number} scale Normalization scale factor
   * @param {Function} onLoaded Callback when GLB is successfully loaded and styled
   * @param {Function} onError Callback if all GLB paths fail
   */
  static loadAstraWardrobe(THREE, scale, onLoaded, onError) {
    if (!THREE || typeof THREE.GLTFLoader === 'undefined') {
      if (typeof onError === 'function') onError(new Error('GLTFLoader not available'));
      return;
    }

    const gltfLoader = new THREE.GLTFLoader();

    // Configure offline DRACOLoader for compressed GLB geometry
    const DracoClass = THREE.DRACOLoader || (typeof window !== 'undefined' ? (window.THREE?.DRACOLoader || window.DRACOLoader) : null);
    if (DracoClass) {
      try {
        const dracoLoader = new DracoClass();
        dracoLoader.setDecoderPath('libs/draco/gltf/');
        if (typeof dracoLoader.preload === 'function') dracoLoader.preload();
        gltfLoader.setDRACOLoader(dracoLoader);
      } catch (e) {
        console.warn('[WardrobeAssets] DRACOLoader initialization warning:', e.message);
      }
    }

    // Configure MeshoptDecoder if available
    const Meshopt = (typeof MeshoptDecoder !== 'undefined') ? MeshoptDecoder : (typeof window !== 'undefined' ? window.MeshoptDecoder : null);
    if (Meshopt && typeof gltfLoader.setMeshoptDecoder === 'function') {
      gltfLoader.setMeshoptDecoder(Meshopt);
    }

    const tryLoad = (idx) => {
      if (idx >= WARDROBE_ASSET_PATHS.length) {
        if (typeof onError === 'function') onError(new Error('All wardrobe GLB paths failed'));
        return;
      }

      gltfLoader.load(
        WARDROBE_ASSET_PATHS[idx],
        (gltf) => {
          const model = gltf.scene;

          // Orient front opening towards room interior (+Z in Three.js coordinates)
          model.rotation.y = -Math.PI / 2;

          // Compute raw dimensions and scale to standard height 2.40m
          const targetHeight = 2.40;
          let scaleFactor = 2.44;
          try {
            if (THREE.Box3) {
              const bbox = new THREE.Box3().setFromObject(model);
              const rawHeight = bbox.max.y - bbox.min.y;
              if (rawHeight > 0.05) {
                scaleFactor = targetHeight / rawHeight;
              }
            }
          } catch (e) {}

          model.scale.set(scaleFactor, scaleFactor, scaleFactor);

          // Align base of wardrobe flush with floor (Y = 0)
          try {
            if (THREE.Box3) {
              const scaledBbox = new THREE.Box3().setFromObject(model);
              model.position.set(0, -scaledBbox.min.y, 0);
            } else {
              model.position.set(0, 1.195, 0);
            }
          } catch (e) {
            model.position.set(0, 1.195, 0);
          }

          // Apply authentic Beige aesthetic styling pipeline (warm champagne beige, matte finish, soft internal shelf lighting)
          if (typeof window !== 'undefined') {
            const styling = window.AstraWardrobeStyling;
            if (styling && typeof styling.applyMaterials === 'function') {
              styling.applyMaterials(model);
            }
          }

          console.log('[WardrobeAssets] Successfully loaded ' + WARDROBE_ASSET_PATHS[idx]);
          if (typeof onLoaded === 'function') onLoaded(model);
        },
        (progress) => {
          if (progress.lengthComputable) {
            console.log('[WardrobeAssets] Loading progress:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
          }
        },
        (err) => {
          console.warn('[WardrobeAssets] Failed loading ' + WARDROBE_ASSET_PATHS[idx] + ':', err ? (err.message || err) : 'unknown error');
          tryLoad(idx + 1);
        }
      );
    };

    tryLoad(0);
  }
}

export default WardrobeAssets;
