/**
 * Woobi - 3D Studio Lighting Module
 * LightingController.js - High-level Controller for Atmospheric Presets & Illumination Controls
 */

import { LIGHTING_PRESETS, LIGHTING_ALIASES, DEFAULT_LIGHTING_PRESET } from './LightingPresets.js';

export class LightingController {
  constructor(studioLighting) {
    this.lighting = studioLighting;
    this.activePreset = DEFAULT_LIGHTING_PRESET;
  }

  applyPreset(presetName) {
    const preset = LIGHTING_PRESETS[presetName] || (LIGHTING_ALIASES && LIGHTING_ALIASES[presetName]);
    if (!preset) {
      console.warn(`LightingController: Unknown preset '${presetName}', ignoring.`);
      return false;
    }
    this.activePreset = preset.name || presetName;
    if (this.lighting) {
      this.lighting.applyPreset(presetName);
    }
    return true;
  }

  setIntensityMultiplier(multiplier) {
    if (this.lighting) {
      this.lighting.setIntensityMultiplier(multiplier);
    }
  }

  setShadowsEnabled(enabled) {
    if (this.lighting) {
      this.lighting.setShadowsEnabled(enabled);
    }
  }

  setAccentLightsEnabled(enabled) {
    if (!this.lighting) return;
    const mult = enabled ? 1.0 : 0.0;
    if (this.lighting.wardrobeSpot) {
      this.lighting.wardrobeSpot.visible = enabled;
    }
    if (this.lighting.vanitySpot) {
      this.lighting.vanitySpot.visible = enabled;
    }
  }

  getState() {
    return {
      activePreset: this.activePreset,
      availablePresets: Object.keys(LIGHTING_PRESETS),
      lighting: this.lighting ? this.lighting.getLightingState() : null
    };
  }

  dispose(scene) {
    if (this.lighting) {
      this.lighting.dispose(scene);
      this.lighting = null;
    }
  }
}
