import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Scan, Sparkles, Film, Zap, Globe, Search, X, Video } from 'lucide-react';
import { detectContent } from '../services/universalDetection';
import type { UniversalDetectionResult } from '../services/universalDetection';
import { searchTVByTitle, searchMoviesByTitle } from '../services/tmdb';
import { getGenreName } from '../data/genres';
import { extractVideoFrames, getVideoMetadata, getFileType } from '../utils/videoProcessor';
import { BatchProcessor } from '../utils/batchProcessor';
import type { BatchJob, BatchProgress } from '../utils/batchProcessor';
import BatchResults from '../components/BatchResults';
import { AnimatedBackground } from '../components/Effects/AnimatedBackground';

export default function CineDetectiveHero() {
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<UniversalDetectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [contentType, setContentType] = useState<'all' | 'anime' | 'movie-series' | 'kdrama-cdrama'>('all');

    // Manual search states
    const [showManualSearch, setShowManualSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Video processing states
    const [isVideo, setIsVideo] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const [extractedFrames, setExtractedFrames] = useState<number>(0);

    // Batch processing states
    const [batchMode, setBatchMode] = useState(false);
    const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
    const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
    const [batchProcessor] = useState(() => new BatchProcessor(3)); // 3 concurrent

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 1) {
            // Batch mode
            processBatch(files);
        } else if (files.length === 1) {
            // Single file mode
            processFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 1) {
            // Batch mode
            processBatch(files);
        } else if (files.length === 1) {
            // Single file mode
            processFile(files[0]);
        }
    };

    const processFile = async (file: File) => {
        const fileType = getFileType(file);

        if (fileType === 'unknown') {
            setError('❌ Please upload an image or video file');
            return;
        }

        const url = URL.createObjectURL(file);
        setImage(url);
        setResult(null);
        setError(null);
        setIsVideo(fileType === 'video');
        setVideoProgress(0);
        setExtractedFrames(0);

        if (fileType === 'video') {
            await processVideo(file);
        } else {
            startScan(file);
        }
    };

    const processVideo = async (file: File) => {
        try {
            setIsScanning(true);
            setError(null);

            console.log('🎥 Processing video...');

            // Get video metadata
            const metadata = await getVideoMetadata(file);
            console.log('📊 Video metadata:', metadata);

            // Extract frames
            setVideoProgress(20);
            const frames = await extractVideoFrames(file, 2, 5); // 5 frames max
            setExtractedFrames(frames.length);
            setVideoProgress(60);

            console.log(`✅ Extracted ${frames.length} frames`);

            // Analyze first frame (or combine multiple)
            if (frames.length > 0) {
                setVideoProgress(80);
                const firstFrameFile = new File([frames[0].blob], 'frame.jpg', { type: 'image/jpeg' });
                await startScan(firstFrameFile);
            } else {
                setError('❌ Could not extract frames from video');
                setIsScanning(false);
            }

            setVideoProgress(100);
        } catch (error) {
            console.error('Video processing error:', error);
            setError('⚠️ Failed to process video. Please try an image instead.');
            setIsScanning(false);
            setVideoProgress(0);
        }
    };

    const startScan = async (file: File) => {
        setIsScanning(true);
        setError(null);

        try {
            console.log('🔍 Universal scan: Detecting content type...', { contentType });
            const detectionResult = await detectContent(file, contentType);

            if (detectionResult && detectionResult.confidence > 0.70) {
                console.log('✅ Detected:', detectionResult);
                setTimeout(() => {
                    setIsScanning(false);
                    setResult(detectionResult);
                }, 2000);
            } else if (detectionResult) {
                console.log('⚠️ Low confidence match:', detectionResult);
                setTimeout(() => {
                    setIsScanning(false);
                    setError('Low confidence match. Result may be inaccurate.');
                    setResult(detectionResult);
                }, 2000);
            } else {
                // NO MATCH FOUND - show error based on filter
                console.log('❌ No match found');
                setTimeout(() => {
                    setIsScanning(false);

                    // Different error messages based on filter selection
                    if (contentType === 'anime') {
                        setError('❌ No anime found. Try a different screenshot with clearer scenes.');
                    } else if (contentType === 'kdrama-cdrama') {
                        setError('❌ No K-drama/C-drama found. Try a screenshot with clear text or logos.');
                    } else if (contentType === 'movie-series') {
                        setError('❌ No movie/TV show found. Try a screenshot with clearer details.');
                    } else {
                        setError('❌ Could not identify content. Try a clearer screenshot.');
                    }

                    setResult(null); // DON'T show any fallback result
                }, 2000);
            }
        } catch (error) {
            console.error('Universal detection error:', error);
            setIsScanning(false);
            setError('⚠️ Scan failed. Please try again.');
            setResult(null);
        }
    };

    const handleManualSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsScanning(true);
        setError(null);
        setResult(null);

        try {
            console.log('🔍 Manual search:', { searchQuery, contentType });

            // Search TV shows and movies
            const [tvResults, movieResults] = await Promise.all([
                searchTVByTitle(searchQuery),
                searchMoviesByTitle(searchQuery)
            ]);

            const searchResults = [...(tvResults || []), ...(movieResults || [])];

            if (searchResults.length > 0) {
                const item = searchResults[0];
                const isTV = 'name' in item;

                setResult({
                    type: isTV ? 'tv' : 'movie',
                    title: isTV ? item.name : item.title,
                    originalTitle: isTV ? item.original_name : item.original_title,
                    confidence: 0.95,
                    year: isTV
                        ? (item.first_air_date ? new Date(item.first_air_date).getFullYear() : undefined)
                        : (item.release_date ? new Date(item.release_date).getFullYear() : undefined),
                    genres: item.genre_ids?.map((id: number) => getGenreName(id)) || [],
                    rating: item.vote_average,
                    image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
                    backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
                    overview: item.overview,
                    source: 'manual-search'
                });
                setIsScanning(false);
                setShowManualSearch(false);
            } else {
                setIsScanning(false);
                setError(`❌ No results found for "${searchQuery}". Try a different search term.`);
            }

        } catch (error) {
            console.error('Manual search error:', error);
            setIsScanning(false);
            setError('⚠️ Search failed. Please try again.');
        }
    };

    // Batch processing handler
    const processBatch = async (files: File[]) => {
        console.log(`📂 Batch mode: Processing ${files.length} files...`);

        setBatchMode(true);
        setImage(null);
        setResult(null);
        setError(null);
        setBatchJobs([]);
        setBatchProgress(null);

        // Process all files
        const jobs = await batchProcessor.processBatch(
            files,
            contentType,
            (progress) => {
                setBatchProgress(progress);
                console.log(`📊 Batch progress: ${progress.percentage}%`, progress);
            },
            (job) => {
                setBatchJobs(prev => {
                    const index = prev.findIndex(j => j.id === job.id);
                    if (index >= 0) {
                        const newJobs = [...prev];
                        newJobs[index] = job;
                        return newJobs;
                    }
                    return [...prev, job];
                });
            }
        );

        setBatchJobs(jobs);
        console.log(`✅ Batch complete: ${jobs.filter(j => j.status === 'complete').length}/${jobs.length} successful`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated 3D Background */}
            <AnimatedBackground />

            <div className="max-w-7xl w-full relative z-10">
                {/* Hero Header with 3D Effects */}
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="text-center mb-12 relative"
                >
                    {/* Floating 3D Title Container */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative"
                    >
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="relative"
                            >
                                <Scan className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_20px_rgba(0,245,255,0.6)]" />
                            </motion.div>
                            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent
                                drop-shadow-[0_0_30px_rgba(0,245,255,0.3)]">
                                CineDetective
                            </h1>
                        </div>

                        <p className="text-2xl md:text-3xl text-cyan-300 font-light mb-4
                            drop-shadow-[0_0_10px_rgba(0,245,255,0.2)]">
                            AI-Powered Universal Content Recognition
                        </p>

                        <p className="text-cyan-600 text-lg max-w-2xl mx-auto">
                            Upload any screenshot from movies, TV shows, anime, K-dramas, or C-dramas.
                            Our AI instantly identifies it from <span className="text-cyan-400 font-bold">820,000+ titles</span>!
                        </p>
                    </motion.div>

                    {/* Stats with glassmorphism */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                        <motion.div
                            whileHover={{ scale: 1.1, y: -5 }}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 backdrop-blur-sm rounded-full border border-cyan-500/30"
                        >
                            <Globe className="w-5 h-5 text-cyan-400" />
                            <span className="font-semibold text-cyan-400">820K+ Titles</span>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.1, y: -5 }}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 backdrop-blur-sm rounded-full border border-purple-500/30"
                        >
                            <Zap className="w-5 h-5 text-purple-400" />
                            <span className="font-semibold text-purple-400">Instant Detection</span>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.1, y: -5 }}
                            className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 backdrop-blur-sm rounded-full border border-pink-500/30"
                        >
                            <Sparkles className="w-5 h-5 text-pink-400" />
                            <span className="font-semibold text-pink-400">AI-Powered</span>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Content Type Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <p className="text-center text-cyan-600 text-sm mb-4 uppercase tracking-wider">
                        Select Content Type
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setContentType('all')}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${contentType === 'all'
                                ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/50'
                                : 'bg-slate-800/50 border border-cyan-900/30 text-cyan-400 hover:border-cyan-700/50'
                                }`}
                        >
                            🌐 All Content
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setContentType('anime')}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${contentType === 'anime'
                                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/50'
                                : 'bg-slate-800/50 border border-cyan-900/30 text-cyan-400 hover:border-cyan-700/50'
                                }`}
                        >
                            🎌 Anime
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setContentType('movie-series')}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${contentType === 'movie-series'
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
                                : 'bg-slate-800/50 border border-cyan-900/30 text-cyan-400 hover:border-cyan-700/50'
                                }`}
                        >
                            🎬 Movies / TV Series
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setContentType('kdrama-cdrama')}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${contentType === 'kdrama-cdrama'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-slate-800/50 border border-cyan-900/30 text-cyan-400 hover:border-cyan-700/50'
                                }`}
                        >
                            🇰🇷 K-Drama / C-Drama
                        </motion.button>
                    </div>
                </motion.div>

                {/* Manual Search Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8 flex justify-center"
                >
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowManualSearch(!showManualSearch)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80 transition-all flex items-center gap-2"
                    >
                        <Search className="w-5 h-5" />
                        {showManualSearch ? 'Hide Search' : 'Search by Name'}
                    </motion.button>
                </motion.div>

                {/* Animated Manual Search Panel */}
                <AnimatePresence>
                    {showManualSearch && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -20 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="mb-8 overflow-hidden"
                        >
                            <motion.div
                                className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 max-w-2xl mx-auto"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-2">
                                        Search by Title
                                    </h3>
                                    <p className="text-cyan-600 text-sm">
                                        Type the name of any movie, TV show, K-drama, or anime
                                    </p>
                                </div>

                                <form onSubmit={handleManualSearch} className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="e.g., Squid Game, Breaking Bad, Demon Slayer..."
                                            className="w-full px-6 py-4 bg-slate-900/50 border-2 border-purple-500/30 rounded-xl text-cyan-100 placeholder-cyan-700 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all text-lg"
                                            autoFocus
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-600 hover:text-cyan-400 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={!searchQuery.trim() || isScanning}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                    >
                                        {isScanning ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <Search className="w-5 h-5" />
                                                </motion.div>
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-5 h-5" />
                                                Search Now
                                            </>
                                        )}
                                    </motion.button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Upload Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid md:grid-cols-2 gap-8"
                >
                    {/* 3D Upload Zone with Glassmorphism */}
                    <motion.div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => document.getElementById('fileInput')?.click()}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/60
                            backdrop-blur-2xl border-2 border-dashed border-cyan-500/40
                            rounded-3xl p-12 cursor-pointer group
                            shadow-[0_0_40px_rgba(0,245,255,0.1)]
                            hover:border-cyan-400/80
                            hover:shadow-[0_0_60px_rgba(0,245,255,0.25)]
                            transition-all duration-300"
                    >
                        {!image ? (
                            <div className="text-center">
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="mb-6"
                                >
                                    <Upload className="w-24 h-24 mx-auto text-cyan-600 group-hover:text-cyan-400 transition-colors" />
                                </motion.div>

                                <h3 className="text-2xl font-bold text-cyan-100 mb-2">
                                    Drop Screenshot or Video Here
                                </h3>
                                <p className="text-cyan-600 mb-4">
                                    or click to browse (PNG, JPG, MP4, MOV)
                                </p>

                                <div className="text-sm text-cyan-700 space-y-1">
                                    <p>✓ Movies • TV Shows • Anime</p>
                                    <p>✓ K-Dramas • C-Dramas • More</p>
                                    <p>✓ JPG, PNG • Max 10MB</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={image}
                                    alt="Uploaded"
                                    className="w-full rounded-2xl border border-cyan-900/30"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setImage(null);
                                        setResult(null);
                                        setError(null);
                                    }}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        <input
                            id="fileInput"
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </motion.div>

                    {/* Batch Mode UI */}
                    {batchMode && (
                        <div className="space-y-6">
                            {/* Batch Progress */}
                            {batchProgress && batchProgress.percentage < 100 && (
                                <div className="bg-slate-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-3xl p-6">
                                    <h3 className="text-xl font-bold text-cyan-100 mb-4">
                                        Processing Batch...
                                    </h3>
                                    <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden mb-2">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${batchProgress.percentage}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-cyan-400">
                                            {batchProgress.completed + batchProgress.failed} / {batchProgress.total} files
                                        </span>
                                        <span className="text-purple-400">
                                            {batchProgress.percentage}% complete
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Batch Results */}
                            {batchJobs.length > 0 && (
                                <BatchResults
                                    jobs={batchJobs}
                                    onRemoveJob={(jobId) => {
                                        setBatchJobs(prev => prev.filter(j => j.id !== jobId));
                                    }}
                                    onClearAll={() => {
                                        setBatchJobs([]);
                                        setBatchMode(false);
                                        setBatchProgress(null);
                                        batchProcessor.clear();
                                    }}
                                    onAddAllToWatchlist={() => {
                                        console.log('📋 Add all to watchlist:', batchJobs.filter(j => j.result));
                                        // TODO: Implement watchlist functionality
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* Results Area - Hide in batch mode */}
                    {!batchMode && (
                        <div className="bg-slate-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-3xl p-8">
                            {!result && !isScanning && !error && (
                                <div className="h-full flex flex-col items-center justify-center text-center text-cyan-700">
                                    <Film className="w-20 h-20 mb-4 opacity-50" />
                                    <p className="text-xl">Upload a screenshot to begin</p>
                                    <p className="text-sm mt-2">AI detection results will appear here</p>
                                </div>
                            )}

                            {isVideo && videoProgress > 0 && videoProgress < 100 && (
                                <div className="text-center py-16">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="mb-6"
                                    >
                                        <Video className="w-16 h-16 mx-auto text-purple-500" />
                                    </motion.div>
                                    <h4 className="text-xl font-bold text-purple-400 mb-4">
                                        Processing Video...
                                    </h4>
                                    <div className="w-full max-w-md mx-auto bg-slate-800 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${videoProgress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <p className="text-cyan-600 mt-4">
                                        {extractedFrames > 0 && `Extracted ${extractedFrames} frames • `}
                                        {videoProgress}% complete
                                    </p>
                                </div>
                            )}

                            {isScanning && !isVideo && (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="mb-6"
                                    >
                                        <Scan className="w-20 h-20 text-cyan-400" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-cyan-100 mb-2">Scanning...</h3>
                                    <p className="text-cyan-600">
                                        {contentType === 'all' && 'Analyzing with AI • Searching 820K+ titles'}
                                        {contentType === 'anime' && '🎌 Searching anime database...'}
                                        {contentType === 'kdrama-cdrama' && '🇰🇷 Searching K-dramas & C-dramas...'}
                                        {contentType === 'movie-series' && '🎬 Searching movies & TV shows...'}
                                    </p>
                                </div>
                            )}

                            {error && !result && !isScanning && (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6 max-w-md">
                                        <p className="text-red-400 text-lg mb-2">{error}</p>
                                        <p className="text-red-600 text-sm">
                                            Tips: Use screenshots with clear text, logos, or recognizable scenes
                                        </p>
                                    </div>
                                </div>
                            )}

                            {result && !isScanning && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {error && (
                                        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 text-yellow-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-cyan-900/30 border border-cyan-700/50 rounded-full text-xs text-cyan-400 uppercase font-semibold">
                                                {result.type}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${result.confidence > 0.85 ? 'bg-green-900/30 border border-green-700/50 text-green-400' :
                                                result.confidence > 0.70 ? 'bg-yellow-900/30 border border-yellow-700/50 text-yellow-400' :
                                                    'bg-red-900/30 border border-red-700/50 text-red-400'
                                                }`}>
                                                {(result.confidence * 100).toFixed(0)}% Match
                                            </span>
                                        </div>

                                        <h3 className="text-3xl font-bold text-cyan-100 mb-2">
                                            {result.title}
                                        </h3>

                                        {result.originalTitle && (
                                            <p className="text-cyan-600 text-sm">{result.originalTitle}</p>
                                        )}
                                    </div>

                                    {result.overview && (
                                        <p className="text-cyan-300 text-sm leading-relaxed">
                                            {result.overview}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        {result.year && (
                                            <div className="bg-slate-800/50 border border-cyan-900/30 rounded-lg p-3">
                                                <p className="text-xs text-cyan-600 uppercase mb-1">Year</p>
                                                <p className="text-cyan-100 font-semibold">{result.year}</p>
                                            </div>
                                        )}

                                        {result.episode && (
                                            <div className="bg-slate-800/50 border border-cyan-900/30 rounded-lg p-3">
                                                <p className="text-xs text-cyan-600 uppercase mb-1">Episode</p>
                                                <p className="text-cyan-100 font-semibold">{result.episode}</p>
                                            </div>
                                        )}

                                        {result.rating && (
                                            <div className="bg-slate-800/50 border border-cyan-900/30 rounded-lg p-3">
                                                <p className="text-xs text-cyan-600 uppercase mb-1">Rating</p>
                                                <p className="text-cyan-100 font-semibold">⭐ {result.rating.toFixed(1)}/10</p>
                                            </div>
                                        )}

                                        {result.timestamp && (
                                            <div className="bg-slate-800/50 border border-cyan-900/30 rounded-lg p-3">
                                                <p className="text-xs text-cyan-600 uppercase mb-1">Timestamp</p>
                                                <p className="text-cyan-100 font-semibold">{result.timestamp}</p>
                                            </div>
                                        )}
                                    </div>

                                    {result.genres && result.genres.length > 0 && (
                                        <div>
                                            <p className="text-xs text-cyan-600 uppercase mb-2">Genres</p>
                                            <div className="flex flex-wrap gap-2">
                                                {result.genres.map((genre, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1 bg-purple-900/30 border border-purple-700/50 rounded-full text-xs text-purple-300"
                                                    >
                                                        {genre}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
