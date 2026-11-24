/**
 * Woobi - AI Digital Wardrobe Engine
 * GarmentProcessingJobQueue.js - Asynchronous Job Queue for AI Garment Extraction
 * 
 * Manages background processing jobs so the Android app never hangs waiting on AI models.
 */

import crypto from 'node:crypto';

export const JOB_STATUS = {
  UPLOADED: 'uploaded',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  REVIEW_REQUIRED: 'review_required',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export class GarmentProcessingJobQueue {
  constructor(options = {}) {
    this.jobs = new Map(); // jobId -> JobRecord
    this.maxRetentionMs = options.maxRetentionMs || 24 * 60 * 60 * 1000; // 24 hours
  }

  createJob(userId, imageUrl, metadata = {}) {
    if (!userId) throw new Error('userId is required to create a processing job');
    if (!imageUrl) throw new Error('imageUrl is required to create a processing job');

    const jobId = 'job_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const jobRecord = {
      jobId,
      userId,
      imageUrl,
      status: JOB_STATUS.UPLOADED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
      extractedItems: [],
      error: null
    };

    this.jobs.set(jobId, jobRecord);
    return jobRecord;
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  getJobsForUser(userId) {
    const list = [];
    for (const job of this.jobs.values()) {
      if (job.userId === userId) list.push(job);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  updateJob(jobId, updates = {}) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    Object.assign(job, updates, {
      updatedAt: new Date().toISOString()
    });

    return job;
  }

  failJob(jobId, errorMessage) {
    return this.updateJob(jobId, {
      status: JOB_STATUS.FAILED,
      error: errorMessage
    });
  }

  completeJob(jobId, extractedItems) {
    return this.updateJob(jobId, {
      status: JOB_STATUS.COMPLETED,
      extractedItems: Array.isArray(extractedItems) ? extractedItems : [extractedItems],
      error: null
    });
  }

  requireReview(jobId, extractedItems) {
    return this.updateJob(jobId, {
      status: JOB_STATUS.REVIEW_REQUIRED,
      extractedItems: Array.isArray(extractedItems) ? extractedItems : [extractedItems],
      error: null
    });
  }
}

export default GarmentProcessingJobQueue;
