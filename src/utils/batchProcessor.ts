/**
 * Batch Processing Utilities
 * Process multiple files concurrently with queue management
 */

import PQueue from 'p-queue';
import { detectContent } from '../services/universalDetection';
import type { UniversalDetectionResult } from '../services/universalDetection';

export interface BatchJob {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'complete' | 'error';
    progress: number;
    result?: UniversalDetectionResult;
    error?: string;
}

export interface BatchProgress {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
}

/**
 * Process multiple files in batch with concurrency control
 */
export class BatchProcessor {
    private queue: PQueue;
    private jobs: Map<string, BatchJob>;
    private onProgressCallback?: (progress: BatchProgress) => void;
    private onJobUpdateCallback?: (job: BatchJob) => void;

    constructor(concurrency: number = 3) {
        this.queue = new PQueue({ concurrency });
        this.jobs = new Map();
    }

    /**
     * Add files to batch processing queue
     */
    async processBatch(
        files: File[],
        contentType: 'all' | 'anime' | 'movie-series' | 'kdrama-cdrama' = 'all',
        onProgress?: (progress: BatchProgress) => void,
        onJobUpdate?: (job: BatchJob) => void
    ): Promise<BatchJob[]> {
        this.onProgressCallback = onProgress;
        this.onJobUpdateCallback = onJobUpdate;

        // Create jobs
        const jobs: BatchJob[] = files.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            file,
            status: 'pending' as const,
            progress: 0
        }));

        jobs.forEach(job => this.jobs.set(job.id, job));

        // Process all jobs
        await Promise.all(
            jobs.map(job => this.queue.add(() => this.processJob(job, contentType)))
        );

        return Array.from(this.jobs.values());
    }

    /**
     * Process a single job
     */
    private async processJob(job: BatchJob, contentType: 'all' | 'anime' | 'movie-series' | 'kdrama-cdrama'): Promise<void> {
        try {
            // Update status to processing
            job.status = 'processing';
            job.progress = 0;
            this.updateJob(job);

            // Detect content
            const result = await detectContent(job.file, contentType);

            if (result) {
                job.status = 'complete';
                job.progress = 100;
                job.result = result;
            } else {
                job.status = 'error';
                job.error = 'No match found';
            }

            this.updateJob(job);
            this.updateProgress();

        } catch (error) {
            console.error(`Batch job ${job.id} failed:`, error);
            job.status = 'error';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            this.updateJob(job);
            this.updateProgress();
        }
    }

    /**
     * Update job and trigger callback
     */
    private updateJob(job: BatchJob) {
        this.jobs.set(job.id, job);
        if (this.onJobUpdateCallback) {
            this.onJobUpdateCallback(job);
        }
    }

    /**
     * Calculate and report progress
     */
    private updateProgress() {
        const jobs = Array.from(this.jobs.values());
        const total = jobs.length;
        const completed = jobs.filter(j => j.status === 'complete').length;
        const failed = jobs.filter(j => j.status === 'error').length;
        const percentage = Math.round(((completed + failed) / total) * 100);

        if (this.onProgressCallback) {
            this.onProgressCallback({
                total,
                completed,
                failed,
                percentage
            });
        }
    }

    /**
     * Get current batch status
     */
    getProgress(): BatchProgress {
        const jobs = Array.from(this.jobs.values());
        const total = jobs.length;
        const completed = jobs.filter(j => j.status === 'complete').length;
        const failed = jobs.filter(j => j.status === 'error').length;
        const percentage = Math.round(((completed + failed) / total) * 100);

        return { total, completed, failed, percentage };
    }

    /**
     * Clear all jobs
     */
    clear() {
        this.jobs.clear();
        this.queue.clear();
    }
}
