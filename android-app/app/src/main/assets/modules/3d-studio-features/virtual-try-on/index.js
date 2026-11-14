/**
 * Woobi - 3D Studio Features
 * virtual-try-on/index.js - Public Module Interface & Factory
 */

import {
  GARMENT_CATEGORIES,
  GARMENT_CATALOG,
  DEFAULT_OUTFIT,
  getGarmentRecord,
  DYNAMIC_GARMENT_REGISTRY,
  registerDynamicGarment
} from './GarmentCatalog.js';
import { TryOnContract, TRY_ON_EVENTS } from './TryOnContract.js';
import { VirtualTryOn, createVirtualTryOn } from './VirtualTryOn.js';

export {
  GARMENT_CATEGORIES,
  GARMENT_CATALOG,
  DEFAULT_OUTFIT,
  getGarmentRecord,
  DYNAMIC_GARMENT_REGISTRY,
  registerDynamicGarment,
  TryOnContract,
  TRY_ON_EVENTS,
  VirtualTryOn,
  createVirtualTryOn
};

if (typeof window !== 'undefined') {
  window.WoobiTryOn = {
    GARMENT_CATEGORIES,
    GARMENT_CATALOG,
    DEFAULT_OUTFIT,
    getGarmentRecord,
    DYNAMIC_GARMENT_REGISTRY,
    registerDynamicGarment,
    TryOnContract,
    TRY_ON_EVENTS,
    VirtualTryOn,
    createVirtualTryOn
  };
}
