/**
 * Woobi - AI Digital Wardrobe Engine
 * index.js - Unified Module Export
 */

import { GarmentProcessingJobQueue, JOB_STATUS } from './GarmentProcessingJobQueue.js';
import { GarmentSegmentationEngine } from './GarmentSegmentationEngine.js';
import { OutfitRecommendationHeuristic } from './OutfitRecommendationHeuristic.js';
import { TRIAL_PRESETS } from './TrialPresets.js';

export {
  GarmentProcessingJobQueue,
  JOB_STATUS,
  GarmentSegmentationEngine,
  OutfitRecommendationHeuristic,
  TRIAL_PRESETS
};

export function createWardrobeAiEngine(options = {}) {
  const queue = new GarmentProcessingJobQueue(options);
  const segmentation = new GarmentSegmentationEngine(options);
  const recommendations = new OutfitRecommendationHeuristic(options);

  return {
    queue,
    segmentation,
    recommendations,
    trialPresets: TRIAL_PRESETS
  };
}

export default createWardrobeAiEngine;
