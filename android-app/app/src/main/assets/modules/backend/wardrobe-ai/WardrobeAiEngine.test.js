import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  GarmentProcessingJobQueue,
  JOB_STATUS,
  GarmentSegmentationEngine,
  OutfitRecommendationHeuristic,
  TRIAL_PRESETS,
  createWardrobeAiEngine
} from './index.js';

describe('AI Digital Wardrobe Engine - Blueprint Execution Verification', () => {

  describe('1. Asynchronous Job Processing Queue', () => {
    it('creates job in uploaded state and tracks user ownership', () => {
      const queue = new GarmentProcessingJobQueue();
      const job = queue.createJob('user_123', 'https://example.com/outfit.jpg');

      assert.ok(job.jobId.startsWith('job_'));
      assert.strictEqual(job.userId, 'user_123');
      assert.strictEqual(job.status, JOB_STATUS.UPLOADED);

      const found = queue.getJob(job.jobId);
      assert.strictEqual(found.jobId, job.jobId);

      const userJobs = queue.getJobsForUser('user_123');
      assert.strictEqual(userJobs.length, 1);
    });

    it('transitions through processing, review required, and completion states', () => {
      const queue = new GarmentProcessingJobQueue();
      const job = queue.createJob('user_123', 'https://example.com/outfit.jpg');

      queue.updateJob(job.jobId, { status: JOB_STATUS.PROCESSING });
      assert.strictEqual(queue.getJob(job.jobId).status, JOB_STATUS.PROCESSING);

      queue.requireReview(job.jobId, [{ itemId: 'item_1', category: 'tops' }]);
      assert.strictEqual(queue.getJob(job.jobId).status, JOB_STATUS.REVIEW_REQUIRED);
      assert.strictEqual(queue.getJob(job.jobId).extractedItems.length, 1);

      queue.completeJob(job.jobId, [{ itemId: 'item_1', category: 'tops', verified: true }]);
      assert.strictEqual(queue.getJob(job.jobId).status, JOB_STATUS.COMPLETED);
    });
  });

  describe('2. Garment Segmentation & Attribute Classification', () => {
    const engine = new GarmentSegmentationEngine();

    it('validates image constraints correctly', () => {
      assert.strictEqual(engine.validateImage(null).valid, false);
      assert.strictEqual(engine.validateImage({ mimeType: 'application/pdf' }).valid, false);
      assert.strictEqual(engine.validateImage({ mimeType: 'image/jpeg', size: 1000 }).valid, true);
    });

    it('segments item at tap coordinates and maps to correct garment zone', async () => {
      // Tap top region (Y = 0.25) -> Tops
      const topItem = await engine.segmentGarment({
        imageUrl: 'assets/sample.jpg',
        tapX: 0.5,
        tapY: 0.25
      });
      assert.strictEqual(topItem.attributes.category, 'tops');
      assert.strictEqual(topItem.processingStatus, 'completed');

      // Tap bottom region (Y = 0.60) -> Bottoms
      const bottomItem = await engine.segmentGarment({
        imageUrl: 'assets/sample.jpg',
        tapX: 0.5,
        tapY: 0.60
      });
      assert.strictEqual(bottomItem.attributes.category, 'bottoms');

      // Tap shoes region (Y = 0.88) -> Shoes
      const shoesItem = await engine.segmentGarment({
        imageUrl: 'assets/sample.jpg',
        tapX: 0.5,
        tapY: 0.88
      });
      assert.strictEqual(shoesItem.attributes.category, 'shoes');
    });
  });

  describe('3. Blueprint Recommendation Heuristic Scoring Formula', () => {
    const heuristic = new OutfitRecommendationHeuristic();

    it('computes score using 0.35C + 0.30S + 0.20O + 0.15P formula', () => {
      // Classic formal outfit: White Shirt, Black Trousers, Brown Shoes
      const result = heuristic.scoreOutfit({
        top: { colour: 'White', style: 'Formal', occasion: ['Office', 'Formal'], name: 'White Shirt' },
        bottom: { colour: 'Black', style: 'Formal', occasion: ['Office', 'Formal'], name: 'Black Trousers' },
        shoes: { colour: 'Brown', style: 'Formal', occasion: ['Office'], name: 'Brown Shoes' },
        occasion: 'office',
        preferenceScore: 90
      });

      assert.ok(result.score >= 90, `Expected score >= 90, got ${result.score}`);
      assert.strictEqual(result.breakdown.colourCompatibility, 98);
      assert.strictEqual(result.breakdown.styleCompatibility, 95);
      assert.ok(result.explanation.includes('Exceptional'));
    });

    it('penalizes severe style mismatches', () => {
      const result = heuristic.scoreOutfit({
        top: { colour: 'Neon Green', style: 'Sport', occasion: ['Gym'] },
        bottom: { colour: 'Orange', style: 'Formal', occasion: ['Black Tie'] },
        shoes: { colour: 'Red', style: 'Casual', occasion: ['Beach'] },
        occasion: 'office',
        preferenceScore: 50
      });

      assert.ok(result.score < 70, `Expected low score for clashing styles, got ${result.score}`);
    });
  });

  describe('4. Built-in Multi-Garment Trial Presets', () => {
    it('provides multi-garment presets with valid tap coordinates', () => {
      assert.ok(TRIAL_PRESETS.length >= 2);
      const klassKombin = TRIAL_PRESETS.find(p => p.id === 'trial_klass_kombin');
      assert.ok(klassKombin);
      assert.strictEqual(klassKombin.garments.length, 3);
      assert.ok(klassKombin.garments[0].tapCoordinates);
    });

    it('instantiates unified engine via createWardrobeAiEngine', () => {
      const unified = createWardrobeAiEngine();
      assert.ok(unified.queue);
      assert.ok(unified.segmentation);
      assert.ok(unified.recommendations);
      assert.ok(unified.trialPresets.length > 0);
    });
  });

});
