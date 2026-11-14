/**
 * Woobi - 3D Studio Features
 * VirtualTryOn.js - Core Virtual Try-On Engine & Garment Swapping Manager
 */

import {
  GARMENT_CATEGORIES,
  GARMENT_CATALOG,
  DEFAULT_OUTFIT,
  getGarmentRecord,
  registerDynamicGarment
} from './GarmentCatalog.js';
import { TRY_ON_EVENTS } from './TryOnContract.js';

export class VirtualTryOn {
  constructor(avatarModel = null, options = {}, THREE = (typeof window !== 'undefined' ? window.THREE : null)) {
    this.avatarModel = avatarModel;
    this.options = Object.assign({
      autoApplyToAvatar: true,
      initialOutfit: { ...DEFAULT_OUTFIT }
    }, options);
    this.THREE = THREE;

    // Equipped state: category -> garmentId
    this.equippedOutfit = {
      [GARMENT_CATEGORIES.TOP]: null,
      [GARMENT_CATEGORIES.BOTTOM]: null,
      [GARMENT_CATEGORIES.SHOES]: null,
      [GARMENT_CATEGORIES.ACCESSORY]: null
    };

    // Event listeners: eventName -> Set<Function>
    this.listeners = new Map();

    // Initialize with default outfit
    this.initializeOutfit(this.options.initialOutfit);
  }

  setAvatarModel(avatarModel) {
    this.avatarModel = avatarModel;
    if (this.options.autoApplyToAvatar) {
      this.applyCurrentOutfitToAvatar();
    }
  }

  initializeOutfit(outfit) {
    if (!outfit) return;
    Object.entries(outfit).forEach(([cat, id]) => {
      if (id) {
        this.equipGarment(cat, id, { silent: true });
      }
    });
  }

  on(event, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`VirtualTryOn listener error [${event}]:`, e);
        }
      });
    }
  }

  getGarmentDetails(garmentId) {
    return getGarmentRecord(garmentId);
  }

  getEquippedOutfit() {
    return { ...this.equippedOutfit };
  }

  getEquippedGarment(category) {
    const id = this.equippedOutfit[category];
    return id ? getGarmentRecord(id) : null;
  }

  isEquipped(garmentId) {
    const record = getGarmentRecord(garmentId);
    if (!record) return false;
    return this.equippedOutfit[record.category] === record.id;
  }

  equipGarment(categoryOrId, explicitId = null, options = {}) {
    let category, garmentId;

    if (explicitId !== null) {
      category = categoryOrId;
      garmentId = explicitId;
    } else {
      // Single argument passed as garmentId
      const rec = getGarmentRecord(categoryOrId);
      if (!rec && !options.item && !options.garment && !options.photo) {
        const error = new Error(`Unknown garment ID: ${categoryOrId}`);
        this.emit(TRY_ON_EVENTS.ERROR, { error, input: categoryOrId });
        return { success: false, error: error.message };
      }
      category = rec ? rec.category : (options.category || GARMENT_CATEGORIES.TOP);
      garmentId = rec ? rec.id : categoryOrId;
    }

    let record = getGarmentRecord(garmentId);
    if (!record) {
      if (options.item || options.garment || options.photo || options.name || options.color) {
        const itemData = options.item || options.garment || {
          id: garmentId,
          category,
          name: options.name || garmentId,
          photo: options.photo || null,
          color: options.color
        };
        record = registerDynamicGarment(itemData);
      } else {
        const error = new Error(`Garment not found in catalog: [${garmentId}]`);
        this.emit(TRY_ON_EVENTS.ERROR, { error, category, garmentId });
        return { success: false, error: error.message };
      }
    }

    const previousId = this.equippedOutfit[category];
    this.equippedOutfit[category] = record.id;

    if (this.options.autoApplyToAvatar) {
      this.applyGarmentToAvatar(record);
    }

    const payload = {
      category,
      garmentId: record.id,
      garment: record,
      previousId,
      outfit: this.getEquippedOutfit()
    };

    if (!options.silent) {
      if (previousId && previousId !== record.id) {
        this.emit(TRY_ON_EVENTS.REPLACE, payload);
      }
      this.emit(TRY_ON_EVENTS.EQUIP, payload);
    }

    return { success: true, ...payload };
  }

  replaceGarment(category, newGarmentId) {
    return this.equipGarment(category, newGarmentId);
  }

  removeGarment(category, options = {}) {
    if (!this.equippedOutfit[category]) {
      return { success: false, message: `No garment equipped in slot: ${category}` };
    }

    const previousId = this.equippedOutfit[category];
    const previousRecord = getGarmentRecord(previousId);
    this.equippedOutfit[category] = null;

    if (this.options.autoApplyToAvatar) {
      this.resetCategoryOnAvatar(category);
    }

    const payload = {
      category,
      removedId: previousId,
      removedGarment: previousRecord,
      outfit: this.getEquippedOutfit()
    };

    if (!options.silent) {
      this.emit(TRY_ON_EVENTS.REMOVE, payload);
    }

    return { success: true, ...payload };
  }

  resetTryOn(options = {}) {
    this.equippedOutfit = {
      [GARMENT_CATEGORIES.TOP]: null,
      [GARMENT_CATEGORIES.BOTTOM]: null,
      [GARMENT_CATEGORIES.SHOES]: null,
      [GARMENT_CATEGORIES.ACCESSORY]: null
    };

    this.initializeOutfit(this.options.initialOutfit);

    if (!options.silent) {
      this.emit(TRY_ON_EVENTS.RESET, { outfit: this.getEquippedOutfit() });
    }

    return { success: true, outfit: this.getEquippedOutfit() };
  }

  applyCurrentOutfitToAvatar() {
    Object.values(this.equippedOutfit).forEach((garmentId) => {
      if (garmentId) {
        const record = getGarmentRecord(garmentId);
        if (record) {
          this.applyGarmentToAvatar(record);
        }
      }
    });
  }

  applyGarmentToAvatar(garmentRecord) {
    if (!this.avatarModel) return;

    const materials = this.avatarModel.materials;
    const rig = this.avatarModel.rig;

    switch (garmentRecord.category) {
      case GARMENT_CATEGORIES.TOP: {
        if (materials && materials.tankMat) {
          if (garmentRecord.color !== undefined) {
            if (typeof materials.tankMat.color?.setHex === 'function') {
              materials.tankMat.color.setHex(garmentRecord.color);
            } else if (materials.tankMat.color) {
              materials.tankMat.color = garmentRecord.color;
            }
          }
          if (garmentRecord.roughness !== undefined) {
            materials.tankMat.roughness = garmentRecord.roughness;
          }
          if (garmentRecord.metalness !== undefined) {
            materials.tankMat.metalness = garmentRecord.metalness;
          }
          materials.tankMat.needsUpdate = true;
        }

        // Apply scale multiplier if specified and meshTarget exists
        if (rig && rig.chestGroup && garmentRecord.scaleMultiplier) {
          const targetMesh = rig.chestGroup.getObjectByName('AvatarTop');
          if (targetMesh && targetMesh.scale) {
            targetMesh.scale.set(
              garmentRecord.scaleMultiplier.x || 1,
              garmentRecord.scaleMultiplier.y || 1,
              garmentRecord.scaleMultiplier.z || 1
            );
          }
        }
        break;
      }

      case GARMENT_CATEGORIES.BOTTOM: {
        if (materials && materials.trouserMat) {
          if (garmentRecord.color !== undefined) {
            if (typeof materials.trouserMat.color?.setHex === 'function') {
              materials.trouserMat.color.setHex(garmentRecord.color);
            } else if (materials.trouserMat.color) {
              materials.trouserMat.color = garmentRecord.color;
            }
          }
          if (garmentRecord.roughness !== undefined) {
            materials.trouserMat.roughness = garmentRecord.roughness;
          }
          if (garmentRecord.metalness !== undefined) {
            materials.trouserMat.metalness = garmentRecord.metalness;
          }
          materials.trouserMat.needsUpdate = true;
        }
        break;
      }

      case GARMENT_CATEGORIES.SHOES: {
        if (materials && materials.sneakerMat) {
          if (garmentRecord.color !== undefined) {
            if (typeof materials.sneakerMat.color?.setHex === 'function') {
              materials.sneakerMat.color.setHex(garmentRecord.color);
            } else if (materials.sneakerMat.color) {
              materials.sneakerMat.color = garmentRecord.color;
            }
          }
          if (garmentRecord.roughness !== undefined) {
            materials.sneakerMat.roughness = garmentRecord.roughness;
          }
          if (garmentRecord.metalness !== undefined) {
            materials.sneakerMat.metalness = garmentRecord.metalness;
          }
          materials.sneakerMat.needsUpdate = true;
        }
        break;
      }

      default:
        break;
    }

    // 2. Direct PBR Stylization onto Genuine Rigged Mannequin GLB (avatar_female.glb / avatar_male.glb)
    const gltfModel = this.avatarModel.gltfAvatarGroup ||
                      (this.avatarModel.assets && this.avatarModel.assets.activeModel) ||
                      (typeof window !== 'undefined' && window.Studio3D && window.Studio3D.gltfAvatarGroup);
    if (gltfModel && typeof gltfModel.traverse === 'function') {
      gltfModel.traverse((child) => {
        if (!child.isMesh) return;
        child.frustumCulled = false;
        const name = child.name || '';
        let isMatch = false;

        if (garmentRecord.category === GARMENT_CATEGORIES.TOP) {
          isMatch = name.includes('Shirt') || name.includes('Sweater') || name.includes('Top') ||
                    name.includes('Zipper') || name.includes('Collar');
        } else if (garmentRecord.category === GARMENT_CATEGORIES.BOTTOM) {
          isMatch = name.includes('Pants') || name.includes('Bottom') || name.includes('Skirt') ||
                    name.includes('Trousers');
        } else if (garmentRecord.category === GARMENT_CATEGORIES.SHOES) {
          isMatch = name.includes('Sneakers') || name.includes('Shoes') || name.includes('Footwear') ||
                    name.includes('Sole');
        }

        if (isMatch) {
          const mats = Array.isArray(child.material) ? child.material : (child.material ? [child.material] : []);
          mats.forEach((mat) => {
            if (!mat) return;
            if (!mat._isClonedGarment) {
              const cloned = mat.clone();
              cloned._isClonedGarment = true;
              cloned._origMap = mat.map;
              child.material = cloned;
              mat = cloned;
            }

            const photoFront = garmentRecord.photoFront || garmentRecord.photo;
            const photoBack = garmentRecord.photoBack || photoFront;

            if (photoFront && typeof window !== 'undefined' && window.THREE && window.THREE.TextureLoader) {
              try {
                const texLoader = new window.THREE.TextureLoader();
                texLoader.load(photoFront, (frontTexture) => {
                  frontTexture.wrapS = window.THREE.RepeatWrapping;
                  frontTexture.wrapT = window.THREE.RepeatWrapping;
                  mat.map = frontTexture;

                  if (garmentRecord.color !== undefined) {
                    if (typeof mat.color?.setHex === 'function') mat.color.setHex(garmentRecord.color);
                    else mat.color = garmentRecord.color;
                  } else {
                    mat.color.setHex(0xFFFFFF);
                  }

                  // If back photo is also provided, setup Dual-Side UV Projection
                  if (garmentRecord.photoBack && garmentRecord.photoBack !== photoFront) {
                    texLoader.load(garmentRecord.photoBack, (backTexture) => {
                      backTexture.wrapS = window.THREE.RepeatWrapping;
                      backTexture.wrapT = window.THREE.RepeatWrapping;
                      mat.userData.uFrontMap = { value: frontTexture };
                      mat.userData.uBackMap = { value: backTexture };
                      mat.onBeforeCompile = (shader) => {
                        shader.uniforms.uFrontMap = mat.userData.uFrontMap;
                        shader.uniforms.uBackMap = mat.userData.uBackMap;
                        shader.vertexShader = shader.vertexShader.replace(
                          '#include <common>',
                          '#include <common>\nvarying vec3 vModelNormal;'
                        );
                        shader.vertexShader = shader.vertexShader.replace(
                          '#include <defaultnormal_vertex>',
                          '#include <defaultnormal_vertex>\nvModelNormal = normal;'
                        );
                        shader.fragmentShader = shader.fragmentShader.replace(
                          '#include <common>',
                          '#include <common>\nuniform sampler2D uFrontMap;\nuniform sampler2D uBackMap;\nvarying vec3 vModelNormal;'
                        );
                        shader.fragmentShader = shader.fragmentShader.replace(
                          '#include <map_fragment>',
                          '#ifdef USE_MAP\nvec4 frontTex = texture2D(uFrontMap, vUv);\nvec4 backTex = texture2D(uBackMap, vUv);\nfloat sideBlend = smoothstep(-0.06, 0.06, vModelNormal.z);\nvec4 texelColor = mix(backTex, frontTex, sideBlend);\ndiffuseColor *= texelColor;\n#endif'
                        );
                      };
                      mat.needsUpdate = true;
                    });
                  } else {
                    mat.onBeforeCompile = null;
                  }

                  mat.needsUpdate = true;
                }, undefined, () => {
                  mat.map = null;
                  if (garmentRecord.color !== undefined) {
                    if (typeof mat.color?.setHex === 'function') mat.color.setHex(garmentRecord.color);
                    else mat.color = garmentRecord.color;
                  }
                  mat.needsUpdate = true;
                });
              } catch (_) {
                mat.map = null;
                if (garmentRecord.color !== undefined) {
                  if (typeof mat.color?.setHex === 'function') mat.color.setHex(garmentRecord.color);
                  else mat.color = garmentRecord.color;
                }
              }
            } else if (garmentRecord.color !== undefined) {
              // Unbind pre-baked suit texture so garment color renders cleanly and purely
              mat.map = null;
              mat.onBeforeCompile = null;
              if (typeof mat.color?.setHex === 'function') {
                mat.color.setHex(garmentRecord.color);
              } else {
                mat.color = garmentRecord.color;
              }
            }
            if (garmentRecord.roughness !== undefined) {
              mat.roughness = garmentRecord.roughness;
            }
            if (garmentRecord.metalness !== undefined) {
              mat.metalness = garmentRecord.metalness;
            }
            mat.needsUpdate = true;
          });
        }
      });
    }
  }

  resetCategoryOnAvatar(category) {
    if (!this.avatarModel) return;
    const defaultId = DEFAULT_OUTFIT[category];
    if (defaultId) {
      const record = getGarmentRecord(defaultId);
      if (record) {
        this.applyGarmentToAvatar(record);
      }
    }
  }

  dispose() {
    this.listeners.clear();
    this.avatarModel = null;
    this.equippedOutfit = {
      [GARMENT_CATEGORIES.TOP]: null,
      [GARMENT_CATEGORIES.BOTTOM]: null,
      [GARMENT_CATEGORIES.SHOES]: null,
      [GARMENT_CATEGORIES.ACCESSORY]: null
    };
  }
}

export function createVirtualTryOn(avatarModel, options, THREE) {
  return new VirtualTryOn(avatarModel, options, THREE);
}
