/**
 * Woobi - 3D Studio Features
 * avatar-customization/index.js - Public Interface & Factory
 */

import {
  SKIN_TONE_PRESETS,
  HAIR_COLOR_PRESETS,
  HAIR_STYLES,
  BODY_PROPORTIONS,
  DEFAULT_AVATAR_CONFIG
} from './CustomizationPresets.js';
import { CUSTOMIZER_EVENTS, CustomizerContract } from './CustomizerContract.js';
import { AvatarCustomizer, createAvatarCustomizer } from './AvatarCustomizer.js';
import { UserFaceMeshEngine, FACE_UV_BOUNDS, DEFAULT_BIOMETRICS } from './UserFaceMeshEngine.js';

export {
  SKIN_TONE_PRESETS,
  HAIR_COLOR_PRESETS,
  HAIR_STYLES,
  BODY_PROPORTIONS,
  DEFAULT_AVATAR_CONFIG,
  CUSTOMIZER_EVENTS,
  CustomizerContract,
  AvatarCustomizer,
  createAvatarCustomizer,
  UserFaceMeshEngine,
  FACE_UV_BOUNDS,
  DEFAULT_BIOMETRICS
};

if (typeof window !== 'undefined') {
  window.WoobiAvatarCustomizer = {
    SKIN_TONE_PRESETS,
    HAIR_COLOR_PRESETS,
    HAIR_STYLES,
    BODY_PROPORTIONS,
    DEFAULT_AVATAR_CONFIG,
    CUSTOMIZER_EVENTS,
    CustomizerContract,
    AvatarCustomizer,
    createAvatarCustomizer,
    UserFaceMeshEngine,
    FACE_UV_BOUNDS,
    DEFAULT_BIOMETRICS
  };
}
