/**
 * Woobi - 3D Studio Features
 * AvatarCustomizer.js - Avatar Customization Orchestrator, Undo/Redo & Storage Coordinator
 */

import {
  SKIN_TONE_PRESETS,
  HAIR_COLOR_PRESETS,
  HAIR_STYLES,
  BODY_PROPORTIONS,
  DEFAULT_AVATAR_CONFIG
} from './CustomizationPresets.js';
import { CUSTOMIZER_EVENTS } from './CustomizerContract.js';

export class AvatarCustomizer {
  constructor(avatarModel = null, options = {}) {
    this.avatarModel = avatarModel;
    this.options = Object.assign({
      storageKey: 'seren_avatar_prefs',
      secondaryStorageKey: 'woobi_avatar_prefs',
      maxHistory: 30,
      autoSave: true
    }, options);

    this.currentConfig = {
      gender: DEFAULT_AVATAR_CONFIG.gender,
      skinTone: DEFAULT_AVATAR_CONFIG.skinTone,
      hairStyle: DEFAULT_AVATAR_CONFIG.hairStyle,
      hairColor: DEFAULT_AVATAR_CONFIG.hairColor,
      proportions: DEFAULT_AVATAR_CONFIG.proportions,
      accessories: { ...DEFAULT_AVATAR_CONFIG.accessories },
      grooming: JSON.parse(JSON.stringify(DEFAULT_AVATAR_CONFIG.grooming || {})),
      masculineGrooming: JSON.parse(JSON.stringify(DEFAULT_AVATAR_CONFIG.masculineGrooming || {})),
      feminineGrooming: JSON.parse(JSON.stringify(DEFAULT_AVATAR_CONFIG.feminineGrooming || {})),
      neutralGrooming: JSON.parse(JSON.stringify(DEFAULT_AVATAR_CONFIG.neutralGrooming || {})),
      savedLooks: []
    };

    this.undoStack = [];
    this.redoStack = [];

    this.listeners = new Map();

    this.loadPreferences();
  }

  setAvatarModel(avatarModel) {
    this.avatarModel = avatarModel;
    this.applyToAvatar(this.currentConfig);
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
          console.error(`AvatarCustomizer error [${event}]:`, e);
        }
      });
    }
  }

  getConfig() {
    return {
      ...this.currentConfig,
      accessories: { ...this.currentConfig.accessories }
    };
  }

  pushHistory() {
    this.undoStack.push(JSON.stringify(this.currentConfig));
    if (this.undoStack.length > this.options.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return false;
    this.redoStack.push(JSON.stringify(this.currentConfig));
    const previous = JSON.parse(this.undoStack.pop());
    this.currentConfig = previous;
    this.applyToAvatar(this.currentConfig);
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.UNDO, { config: this.getConfig() });
    this.emit(CUSTOMIZER_EVENTS.CHANGE, { config: this.getConfig() });
    return true;
  }

  redo() {
    if (!this.canRedo()) return false;
    this.undoStack.push(JSON.stringify(this.currentConfig));
    const next = JSON.parse(this.redoStack.pop());
    this.currentConfig = next;
    this.applyToAvatar(this.currentConfig);
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.REDO, { config: this.getConfig() });
    this.emit(CUSTOMIZER_EVENTS.CHANGE, { config: this.getConfig() });
    return true;
  }

  setSkinTone(hex) {
    if (!hex) return false;
    // Normalize preset ID or hex string
    let resolvedHex = hex;
    const preset = SKIN_TONE_PRESETS.find(p => p.id === hex);
    if (preset) resolvedHex = preset.hex;

    if (this.currentConfig.skinTone === resolvedHex) return true;

    this.pushHistory();
    this.currentConfig.skinTone = resolvedHex;
    this.applyToAvatar({ skinTone: resolvedHex });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'skinTone', value: resolvedHex, config: this.getConfig() });
    return true;
  }

  setHairColor(hex) {
    if (!hex) return false;
    let resolvedHex = hex;
    const preset = HAIR_COLOR_PRESETS.find(p => p.id === hex);
    if (preset) resolvedHex = preset.hex;

    if (this.currentConfig.hairColor === resolvedHex) return true;

    this.pushHistory();
    this.currentConfig.hairColor = resolvedHex;
    this.applyToAvatar({ hairColor: resolvedHex });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'hairColor', value: resolvedHex, config: this.getConfig() });
    return true;
  }

  setHairstyle(styleId) {
    if (!styleId) return false;
    if (this.currentConfig.hairStyle === styleId) return true;

    this.pushHistory();
    this.currentConfig.hairStyle = styleId;
    this.applyToAvatar({ hairStyle: styleId });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'hairStyle', value: styleId, config: this.getConfig() });
    return true;
  }

  setBodyProportions(presetId) {
    if (!presetId) return false;
    if (this.currentConfig.proportions === presetId) return true;

    this.pushHistory();
    this.currentConfig.proportions = presetId;
    this.applyToAvatar({ proportions: presetId });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'proportions', value: presetId, config: this.getConfig() });
    return true;
  }

  setGenderPresentation(gender) {
    if (!gender) return false;
    if (this.currentConfig.gender === gender) return true;

    this.pushHistory();
    this.currentConfig.gender = gender;
    this.applyToAvatar({ gender });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'gender', value: gender, config: this.getConfig() });
    return true;
  }

  toggleAccessory(name, isActive) {
    if (!name) return false;
    const currentVal = !!this.currentConfig.accessories[name];
    const nextVal = isActive !== undefined ? !!isActive : !currentVal;

    if (currentVal === nextVal) return true;

    this.pushHistory();
    this.currentConfig.accessories[name] = nextVal;
    this.applyToAvatar({ accessory: { name, active: nextVal } });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'accessories', accessory: name, value: nextVal, config: this.getConfig() });
    return true;
  }

  // =========================================================================
  // GENDER-ADAPTIVE GROOMING STUDIO CONTROLS
  // =========================================================================

  setGrooming(partial = {}) {
    if (!partial || typeof partial !== 'object') return false;
    this.pushHistory();
    this.currentConfig.grooming = Object.assign(this.currentConfig.grooming || {}, partial);

    // Synchronize to active gender-specific preference slot
    const gender = this.currentConfig.gender || 'neutral';
    if (gender === 'male') {
      this.currentConfig.masculineGrooming = Object.assign(this.currentConfig.masculineGrooming || {}, partial);
    } else if (gender === 'female') {
      this.currentConfig.feminineGrooming = Object.assign(this.currentConfig.feminineGrooming || {}, partial);
    } else {
      this.currentConfig.neutralGrooming = Object.assign(this.currentConfig.neutralGrooming || {}, partial);
    }

    this.applyToAvatar({ grooming: this.currentConfig.grooming });
    if (this.options.autoSave) this.savePreferences();
    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'grooming', value: this.currentConfig.grooming, config: this.getConfig() });
    return true;
  }

  setBeardStyle(styleId) {
    return this.setGrooming({ beardStyle: styleId });
  }

  setMoustacheStyle(styleId) {
    return this.setGrooming({ moustacheStyle: styleId });
  }

  setLipstick(color, finish = 'satin') {
    return this.setGrooming({ lipColor: color, lipFinish: finish });
  }

  setEyebrowShape(shapeId) {
    return this.setGrooming({ eyebrowShape: shapeId });
  }

  setBlush(color, opacity = 0.35) {
    return this.setGrooming({ blushColor: color, blushIntensity: opacity });
  }

  setNailCustomization(opts = {}) {
    return this.setGrooming({
      nailShape: opts.shape || this.currentConfig.grooming?.nailShape || 'natural',
      nailLength: opts.length || this.currentConfig.grooming?.nailLength || 'short',
      nailFinish: opts.finish || this.currentConfig.grooming?.nailFinish || 'gloss',
      nailColor: opts.color || this.currentConfig.grooming?.nailColor || '#E8C5B8'
    });
  }

  // Lookbook Snapshot Management
  saveLookbook(name, category = 'daily') {
    const look = {
      id: `look_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: (name || 'My Curated Look').trim(),
      category,
      timestamp: Date.now(),
      config: JSON.parse(JSON.stringify(this.currentConfig))
    };
    if (!Array.isArray(this.currentConfig.savedLooks)) {
      this.currentConfig.savedLooks = [];
    }
    this.currentConfig.savedLooks.unshift(look);
    if (this.currentConfig.savedLooks.length > 20) {
      this.currentConfig.savedLooks.pop();
    }
    this.savePreferences();
    this.emit('lookbook:saved', { look, looks: this.currentConfig.savedLooks });
    return look;
  }

  loadLookbook(lookId) {
    const looks = this.currentConfig.savedLooks || [];
    const target = looks.find(l => l.id === lookId);
    if (!target || !target.config) return false;
    this.pushHistory();
    this.currentConfig = Object.assign(this.currentConfig, JSON.parse(JSON.stringify(target.config)));
    this.applyToAvatar(this.currentConfig);
    this.savePreferences();
    this.emit(CUSTOMIZER_EVENTS.CHANGE, { config: this.getConfig(), loadedLook: target });
    return true;
  }

  deleteLookbook(lookId) {
    if (!Array.isArray(this.currentConfig.savedLooks)) return false;
    this.currentConfig.savedLooks = this.currentConfig.savedLooks.filter(l => l.id !== lookId);
    this.savePreferences();
    this.emit('lookbook:deleted', { lookId, looks: this.currentConfig.savedLooks });
    return true;
  }

  getLookbooks() {
    return this.currentConfig.savedLooks || [];
  }

  applyConfig(cfg) {
    if (!cfg) return false;
    this.pushHistory();

    if (cfg.gender) this.currentConfig.gender = cfg.gender;
    if (cfg.skinTone) this.currentConfig.skinTone = cfg.skinTone;
    if (cfg.hairColor) this.currentConfig.hairColor = cfg.hairColor;
    if (cfg.hairStyle) this.currentConfig.hairStyle = cfg.hairStyle;
    if (cfg.proportions) this.currentConfig.proportions = cfg.proportions;
    if (cfg.accessories) {
      this.currentConfig.accessories = { ...this.currentConfig.accessories, ...cfg.accessories };
    }

    this.applyToAvatar(this.currentConfig);
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { config: this.getConfig() });
    return true;
  }

  applyToAvatar(cfg) {
    if (!this.avatarModel) return;

    // 1. Materials: Skin, Hair, Lips, Blush & Nails
    if (this.avatarModel.materials) {
      if (cfg.skinTone && typeof this.avatarModel.materials.updateSkinTone === 'function') {
        this.avatarModel.materials.updateSkinTone(cfg.skinTone);
      }
      if (cfg.hairColor && typeof this.avatarModel.materials.updateHairColor === 'function') {
        this.avatarModel.materials.updateHairColor(cfg.hairColor);
      }
      const gr = cfg.grooming || {};
      if (gr.lipColor && typeof this.avatarModel.materials.updateLipstick === 'function') {
        this.avatarModel.materials.updateLipstick(gr.lipColor, gr.lipFinish || 'satin');
      }
      if (gr.blushColor && typeof this.avatarModel.materials.updateBlush === 'function') {
        this.avatarModel.materials.updateBlush(gr.blushColor, gr.blushIntensity);
      }
      if (gr.nailColor && typeof this.avatarModel.materials.updateNailFinish === 'function') {
        this.avatarModel.materials.updateNailFinish(gr.nailColor, gr.nailFinish || 'gloss');
      }
    }

    // 2. Rig: Beard, Moustache, Eyebrows & Nails
    if (this.avatarModel.rig) {
      const gr = cfg.grooming || {};
      if (typeof this.avatarModel.rig.setBeardStyle === 'function') {
        this.avatarModel.rig.setBeardStyle(gr.beardStyle || 'clean');
      }
      if (typeof this.avatarModel.rig.setMoustacheStyle === 'function') {
        this.avatarModel.rig.setMoustacheStyle(gr.moustacheStyle || 'none');
      }
      if (typeof this.avatarModel.rig.setEyebrowShape === 'function') {
        this.avatarModel.rig.setEyebrowShape(gr.eyebrowShape || 'natural');
      }
      if (typeof this.avatarModel.rig.setNailShape === 'function') {
        this.avatarModel.rig.setNailShape(gr.nailShape || 'natural', gr.nailLength || 'short');
      }
    }

    // 2. Morphs: Proportions, Gender & Accessories
    if (this.avatarModel.morphs) {
      if (cfg.proportions && typeof this.avatarModel.morphs.setBodyProportions === 'function') {
        this.avatarModel.morphs.setBodyProportions(cfg.proportions);
      }
      if (cfg.gender && typeof this.avatarModel.morphs.setGenderPresentation === 'function') {
        this.avatarModel.morphs.setGenderPresentation(cfg.gender);
      }
      if (cfg.accessory && typeof this.avatarModel.morphs.toggleAccessory === 'function') {
        this.avatarModel.morphs.toggleAccessory(cfg.accessory.name, cfg.accessory.active);
      } else if (cfg.accessories) {
        Object.entries(cfg.accessories).forEach(([acc, val]) => {
          this.avatarModel.morphs.toggleAccessory(acc, val);
        });
      }
    }
  }

  resetCustomization() {
    this.pushHistory();
    this.currentConfig = {
      gender: DEFAULT_AVATAR_CONFIG.gender,
      skinTone: DEFAULT_AVATAR_CONFIG.skinTone,
      hairStyle: DEFAULT_AVATAR_CONFIG.hairStyle,
      hairColor: DEFAULT_AVATAR_CONFIG.hairColor,
      proportions: DEFAULT_AVATAR_CONFIG.proportions,
      accessories: { ...DEFAULT_AVATAR_CONFIG.accessories },
      grooming: JSON.parse(JSON.stringify(DEFAULT_AVATAR_CONFIG.grooming || {})),
      masculineGrooming: JSON.parse(JSON.stringify(DEFAULT_AVATAR_CONFIG.masculineGrooming || {})),
      feminineGrooming: JSON.parse(JSON.stringify(DEFAULT_AVATAR_CONFIG.feminineGrooming || {})),
      neutralGrooming: JSON.parse(JSON.stringify(DEFAULT_AVATAR_CONFIG.neutralGrooming || {})),
      savedLooks: []
    };

    this.applyToAvatar(this.currentConfig);
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.RESET, { config: this.getConfig() });
    this.emit(CUSTOMIZER_EVENTS.CHANGE, { config: this.getConfig() });
    return true;
  }

  savePreferences() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = JSON.stringify(this.currentConfig);
      localStorage.setItem(this.options.storageKey, data);
      localStorage.setItem(this.options.secondaryStorageKey, data);
    } catch (e) {
      console.warn('AvatarCustomizer: could not save preferences', e);
    }
  }

  loadPreferences() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.options.storageKey) ||
                  localStorage.getItem(this.options.secondaryStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.currentConfig = Object.assign(this.currentConfig, parsed);
        }
      }
    } catch (e) {
      console.warn('AvatarCustomizer: could not load preferences', e);
    }
  }

  dispose() {
    this.listeners.clear();
    this.undoStack = [];
    this.redoStack = [];
    this.avatarModel = null;
  }
}

export function createAvatarCustomizer(avatarModel = null, options = {}) {
  return new AvatarCustomizer(avatarModel, options);
}
