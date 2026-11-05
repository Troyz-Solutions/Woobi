/**
 * Woobi - 3D Studio Avatar Module
 * AvatarController.js - Avatar State, Customization API & Preferences Persistence
 */

import { AVATAR_CONFIG } from './AvatarModel.js';

export class AvatarController {
  constructor(avatarModel) {
    this.model = avatarModel;
    this.avatarConfig = {
      gender: AVATAR_CONFIG.defaultGender,
      skinTone: AVATAR_CONFIG.defaultSkinTone,
      hairStyle: AVATAR_CONFIG.defaultHairStyle,
      hairColor: AVATAR_CONFIG.defaultHairColor,
      proportions: AVATAR_CONFIG.defaultProportions,
      top: AVATAR_CONFIG.defaultTop,
      bottom: AVATAR_CONFIG.defaultBottom,
      shoes: AVATAR_CONFIG.defaultShoes,
      accessories: { ...AVATAR_CONFIG.defaultAccessories }
    };

    this.loadSavedPreferences();
  }

  setSkinTone(hex) {
    if (!hex) return;
    this.avatarConfig.skinTone = hex;
    if (this.model && this.model.materials) {
      this.model.materials.updateSkinTone(hex);
    }
    this.savePreferences();
  }

  setHairColor(hex) {
    if (!hex) return;
    this.avatarConfig.hairColor = hex;
    if (this.model && this.model.materials) {
      this.model.materials.updateHairColor(hex);
    }
    this.savePreferences();
  }

  setHairstyle(styleName) {
    if (!styleName) return;
    this.avatarConfig.hairStyle = styleName;
    if (this.model && this.model.rig && typeof this.model.rig.setHairstyle === 'function') {
      this.model.rig.setHairstyle(styleName);
    }
    this.savePreferences();
  }

  setBodyProportions(preset) {
    if (!preset) return;
    this.avatarConfig.proportions = preset;
    if (this.model && this.model.morphs) {
      this.model.morphs.setBodyProportions(preset);
    }
    this.savePreferences();
  }

  setGenderPresentation(gender) {
    if (!gender) return;
    this.avatarConfig.gender = gender;
    if (this.model && this.model.morphs) {
      this.model.morphs.setGenderPresentation(gender);
    }
    this.savePreferences();
  }

  toggleAccessory(name, isActive) {
    if (!name) return;
    if (!this.avatarConfig.accessories) {
      this.avatarConfig.accessories = {};
    }
    this.avatarConfig.accessories[name] = isActive;
    if (this.model && this.model.morphs) {
      this.model.morphs.toggleAccessory(name, isActive);
    }
    this.savePreferences();
  }

  applyAvatarConfig(cfg) {
    if (!cfg) return;
    if (cfg.gender) this.setGenderPresentation(cfg.gender);
    if (cfg.skinTone) this.setSkinTone(cfg.skinTone);
    if (cfg.hairColor) this.setHairColor(cfg.hairColor);
    if (cfg.hairStyle) this.setHairstyle(cfg.hairStyle);
    if (cfg.proportions) this.setBodyProportions(cfg.proportions);
    if (cfg.accessories) {
      Object.entries(cfg.accessories).forEach(([acc, val]) => {
        this.toggleAccessory(acc, val);
      });
    }
    if (cfg.grooming) {
      this.applyGroomingConfig(cfg.grooming);
    }
  }

  setBeardStyle(styleId) {
    if (!this.avatarConfig.grooming) this.avatarConfig.grooming = {};
    this.avatarConfig.grooming.beardStyle = styleId;
    if (this.model && this.model.rig && typeof this.model.rig.setBeardStyle === 'function') {
      this.model.rig.setBeardStyle(styleId);
    }
    this.savePreferences();
  }

  setMoustacheStyle(styleId) {
    if (!this.avatarConfig.grooming) this.avatarConfig.grooming = {};
    this.avatarConfig.grooming.moustacheStyle = styleId;
    if (this.model && this.model.rig && typeof this.model.rig.setMoustacheStyle === 'function') {
      this.model.rig.setMoustacheStyle(styleId);
    }
    this.savePreferences();
  }

  setLipstick(color, finish = 'satin') {
    if (!this.avatarConfig.grooming) this.avatarConfig.grooming = {};
    this.avatarConfig.grooming.lipColor = color;
    this.avatarConfig.grooming.lipFinish = finish;
    if (this.model && this.model.materials && typeof this.model.materials.updateLipstick === 'function') {
      this.model.materials.updateLipstick(color, finish);
    }
    this.savePreferences();
  }

  setEyebrowShape(shapeId) {
    if (!this.avatarConfig.grooming) this.avatarConfig.grooming = {};
    this.avatarConfig.grooming.eyebrowShape = shapeId;
    if (this.model && this.model.rig && typeof this.model.rig.setEyebrowShape === 'function') {
      this.model.rig.setEyebrowShape(shapeId);
    }
    this.savePreferences();
  }

  setBlush(color, opacity = 0.35) {
    if (!this.avatarConfig.grooming) this.avatarConfig.grooming = {};
    this.avatarConfig.grooming.blushColor = color;
    this.avatarConfig.grooming.blushIntensity = opacity;
    if (this.model && this.model.materials && typeof this.model.materials.updateBlush === 'function') {
      this.model.materials.updateBlush(color, opacity);
    }
    this.savePreferences();
  }

  setSideburnStyle(styleId = 'natural') {
    if (!this.avatarConfig.grooming) this.avatarConfig.grooming = {};
    this.avatarConfig.grooming.sideburnStyle = styleId;
    if (this.model && this.model.rig && typeof this.model.rig.setSideburnStyle === 'function') {
      this.model.rig.setSideburnStyle(styleId);
    }
    this.savePreferences();
  }

  setEyeMakeup(style = 'natural', color = '#C4A482', intensity = 0.5, mascara = 'natural') {
    if (!this.avatarConfig.grooming) this.avatarConfig.grooming = {};
    this.avatarConfig.grooming.eyeMakeupStyle = style;
    this.avatarConfig.grooming.eyeMakeupColor = color;
    this.avatarConfig.grooming.eyeMakeupIntensity = intensity;
    this.avatarConfig.grooming.mascaraStyle = mascara;
    if (this.model && this.model.materials && typeof this.model.materials.updateEyeMakeup === 'function') {
      this.model.materials.updateEyeMakeup(style, color, intensity);
    }
    if (this.model && this.model.rig && typeof this.model.rig.setEyeMakeup === 'function') {
      this.model.rig.setEyeMakeup(style, color, intensity, mascara);
    }
    this.savePreferences();
  }

  setNailCustomization(opts = {}) {
    if (!this.avatarConfig.grooming) this.avatarConfig.grooming = {};
    const targetHand = opts.targetHand || opts.hand || 'both';
    if (opts.shape) this.avatarConfig.grooming.nailShape = opts.shape;
    if (opts.length) this.avatarConfig.grooming.nailLength = opts.length;
    if (opts.finish) this.avatarConfig.grooming.nailFinish = opts.finish;
    if (opts.color) this.avatarConfig.grooming.nailColor = opts.color;
    if (opts.design) this.avatarConfig.grooming.nailDesign = opts.design;

    if (this.model && this.model.rig && typeof this.model.rig.setNailShape === 'function') {
      this.model.rig.setNailShape(
        opts.shape || this.avatarConfig.grooming.nailShape || 'natural',
        opts.length || this.avatarConfig.grooming.nailLength || 'short',
        targetHand
      );
    }
    if (this.model && this.model.materials && typeof this.model.materials.updateNailFinish === 'function') {
      this.model.materials.updateNailFinish(
        opts.color || this.avatarConfig.grooming.nailColor || '#E8C5B8',
        opts.finish || this.avatarConfig.grooming.nailFinish || 'gloss',
        targetHand
      );
    }
    this.savePreferences();
  }

  applyGroomingConfig(grooming = {}) {
    if (!grooming) return;
    if (!this.avatarConfig.grooming) this.avatarConfig.grooming = {};
    Object.assign(this.avatarConfig.grooming, grooming);

    if (grooming.beardStyle !== undefined) this.setBeardStyle(grooming.beardStyle);
    if (grooming.moustacheStyle !== undefined) this.setMoustacheStyle(grooming.moustacheStyle);
    if (grooming.sideburnStyle !== undefined) this.setSideburnStyle(grooming.sideburnStyle);
    if (grooming.lipColor) this.setLipstick(grooming.lipColor, grooming.lipFinish || 'satin');
    if (grooming.eyebrowShape) this.setEyebrowShape(grooming.eyebrowShape);
    if (grooming.blushColor) this.setBlush(grooming.blushColor, grooming.blushIntensity !== undefined ? grooming.blushIntensity : 0.35);
    if (grooming.eyeMakeupStyle || grooming.eyeMakeupColor || grooming.mascaraStyle) {
      this.setEyeMakeup(
        grooming.eyeMakeupStyle || 'natural',
        grooming.eyeMakeupColor || '#C4A482',
        grooming.eyeMakeupIntensity !== undefined ? grooming.eyeMakeupIntensity : 0.5,
        grooming.mascaraStyle || 'natural'
      );
    }
    if (grooming.nailShape || grooming.nailLength || grooming.nailFinish || grooming.nailColor) {
      this.setNailCustomization({
        shape: grooming.nailShape,
        length: grooming.nailLength,
        finish: grooming.nailFinish,
        color: grooming.nailColor,
        design: grooming.nailDesign,
        targetHand: grooming.nailHand || 'both'
      });
    }
  }

  setTargetRotation(targetY) {
    if (this.model && this.model.animations) {
      this.model.animations.setTargetRotation(targetY);
    }
  }

  addRotation(deltaY) {
    if (this.model && this.model.animations) {
      this.model.animations.addRotation(deltaY);
    }
  }

  loadSavedPreferences() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('seren_avatar_prefs');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.avatarConfig = Object.assign(this.avatarConfig, parsed);
        }
      }
    } catch (e) {
      console.warn('AvatarController: Could not read avatar prefs from storage', e);
    }
  }

  savePreferences() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('seren_avatar_prefs', JSON.stringify(this.avatarConfig));
      }
    } catch (e) {
      console.warn('AvatarController: Could not persist avatar prefs', e);
    }
  }

  getAvatarState() {
    return {
      activeType: this.model ? this.model.activeAvatarType : 'uninitialized',
      config: { ...this.avatarConfig },
      proportions: this.model && this.model.morphs ? this.model.morphs.getProportions() : null,
      isGrounded: true,
      elevation: AVATAR_CONFIG.daisElevation
    };
  }

  update(delta, time) {
    if (this.model) {
      this.model.update(delta, time);
    }
  }

  dispose(scene) {
    if (this.model) {
      this.model.dispose(scene);
      this.model = null;
    }
  }
}
