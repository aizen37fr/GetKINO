/**
 * Batch Results Display Component
 * Shows grid of batch detection results
 */

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Trash2, Download } from 'lucide-react';
import type { BatchJob } from '../utils/batchProcessor';

interface BatchResultsProps {
    jobs: BatchJob[];
    onRemoveJob?: (jobId: string) => void;
    onClearAll?: () => void;
    onAddAllToWatchlist?: () => void;
}

export default function BatchResults({ jobs, onRemoveJob, onClearAll, onAddAllToWatchlist }: BatchResultsProps) {
    const successfulJobs = jobs.filter(j => j.status === 'complete');
    const failedJobs = jobs.filter(j => j.status === 'error');

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="text-green-300 font-bold">{successfulJobs.length}</span>
                            <span className="text-green-600 text-sm">Found</span>
                        </div>
                    </div>
                    <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-2">
                        <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-300 font-bold">{failedJobs.length}</span>
                            <span className="text-red-600 text-sm">Failed</span>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                <div className="flex gap-2">
                    {successfulJobs.length > 0 && onAddAllToWatchlist && (
                        <button
                            onClick={onAddAllToWatchlist}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Add All to Watchlist
                        </button>
                    )}
                    {jobs.length > 0 && onClearAll && (
                        <button
                            onClick={onClearAll}
                            className="bg-red-600/20 hover:bg-red-600/30 border border-red-700/30 text-red-400 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job, index) => (
                    <BatchJobCard
                        key={job.id}
                        job={job}
                        index={index}
                        onRemove={onRemoveJob}
                    />
                ))}
            </div>
        </div>
    );
}

interface BatchJobCardProps {
    job: BatchJob;
    index: number;
    onRemove?: (jobId: string) => void;
}

function BatchJobCard({ job, index, onRemove }: BatchJobCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`relative rounded-xl border-2 overflow-hidden ${job.status === 'complete'
                    ? 'bg-slate-900/50 border-green-700/30'
                    : job.status === 'error'
                        ? 'bg-slate-900/50 border-red-700/30'
                        : 'bg-slate-900/50 border-cyan-900/30'
                }`}
        >
            {/* File Preview */}
            <div className="aspect-video bg-slate-800 relative">
                <img
                    src={URL.createObjectURL(job.file)}
                    alt={job.file.name}
                    className="w-full h-full object-cover"
                />

                {/* Status Overlay */}
                <div className={`absolute inset-0 flex items-center justify-center ${job.status === 'processing' ? 'bg-black/60' : ''
                    }`}>
                    {job.status === 'processing' && (
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    )}
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                    {job.status === 'complete' && (
                        <div className="bg-green-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Found
                        </div>
                    )}
                    {job.status === 'error' && (
                        <div className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Failed
                        </div>
                    )}
                </div>
            </div>

            {/* Result Info */}
            <div className="p-3">
                {job.result ? (
                    <>
                        <h4 className="font-bold text-cyan-100 truncate mb-1">
                            {job.result.title}
                        </h4>
                        <p className="text-sm text-cyan-600 truncate mb-2">
                            {job.result.year && `${job.result.year} • `}
                            {Math.round(job.result.confidence * 100)}% match
                        </p>
                        {job.result.genres && job.result.genres.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                                {job.result.genres.slice(0, 2).map(genre => (
                                    <span
                                        key={genre}
                                        className="text-xs bg-cyan-900/30 text-cyan-400 px-2 py-0.5 rounded"
                                    >
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                ) : job.status === 'error' ? (
                    <p className="text-sm text-red-400">
                        {job.error || 'Detection failed'}
                    </p>
                ) : (
                    <p className="text-sm text-cyan-600">
                        Processing...
                    </p>
                )}
            </div>

            {/* Remove Button */}
            {onRemove && (
                <button
                    onClick={() => onRemove(job.id)}
                    className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </motion.div>
    );
}
