import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Upload, Sparkles, Film, Search, X, Video, Image as ImageIcon, FileVideo, Zap, ChevronDown, ArrowLeft, Check, Star, Tv, ExternalLink, Loader2, Bookmark, BookmarkCheck, Compass } from 'lucide-react';
import { detectContent } from '../services/universalDetection';
import type { UniversalDetectionResult } from '../services/universalDetection';
import { extractVideoFrames, getFileType } from '../utils/videoProcessor';
import SmartSearch from '../components/SmartSearch';
import { getAnimeDetails } from '../services/tracemoe';
import { fetchWatchProviders, findAndFetchProviders } from '../services/watchProviders';
import type { StreamingProvider, WatchProvidersResult } from '../services/watchProviders';
import { PLATFORM_COLORS } from '../services/watchProviders';
import { useAuth } from '../context/AuthContext';
import type { WatchlistItem, WatchStatus } from '../types/watchlist';
import { useScanHistory } from '../hooks/useScanHistory';
import ScanHistoryPanel, { ScanHistoryButton } from '../components/ScanHistoryPanel';
import { analyzeVideoFrames } from '../services/gemini';
import type { SceneAnalysis } from '../services/gemini';
import { searchTMDB } from '../services/tmdb-extended';

export default function CineDetectivePage({ onOpenWatchlist, onOpenAI, onOpenRabbitHole }: { onOpenWatchlist?: () => void; onOpenAI?: () => void; onOpenRabbitHole?: () => void }) {

    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<UniversalDetectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [contentType, setContentType] = useState<'all' | 'anime' | 'movie-series' | 'kdrama-cdrama'>('all');
    const [isDragging, setIsDragging] = useState(false);
    const [showManualSearch, setShowManualSearch] = useState(false);
    const [isVideo, setIsVideo] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [sceneAnalysis, setSceneAnalysis] = useState<SceneAnalysis | null>(null);
    const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
    const [videoPhase, setVideoPhase] = useState<'idle' | 'extracting' | 'analyzing' | 'building'>('idle');
    const currentImageRef = useRef<string | null>(null);

    const { history: scanHistory, addScan, removeScan, clearHistory } = useScanHistory();

    // Parallax effect
    const { scrollY } = useScroll();
    const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);



    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
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
        currentImageRef.current = url;
        setImage(url);
        setResult(null);
        setError(null);
        setIsVideo(fileType === 'video');
        setVideoProgress(0);

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
            setSceneAnalysis(null);
            setExtractedFrames([]);

            // Phase 1: Extract frames (up to 8, every 2s)
            setVideoPhase('extracting');
            setVideoProgress(15);
            const frames = await extractVideoFrames(file, 2, 8);
            setVideoProgress(40);

            if (!frames.length) {
                setError('❌ Could not extract frames from video');
                setIsScanning(false);
                setVideoPhase('idle');
                return;
            }

            // Store thumbnail previews
            setExtractedFrames(frames.map(f => f.dataUrl));

            // Phase 2: Analyze all frames together with Gemini Vision
            setVideoPhase('analyzing');
            setVideoProgress(60);

            const framesForGemini = frames.map(f => ({
                data: f.dataUrl.split(',')[1],
                mimeType: 'image/jpeg',
                timestamp: f.timestamp,
            }));

            const sceneResult = await analyzeVideoFrames(framesForGemini);
            setVideoProgress(80);

            // Phase 3: Build detection result from scene analysis
            setVideoPhase('building');

            if (sceneResult && sceneResult.confidence >= 0.45 && sceneResult.showName !== 'Unknown') {
                // ✅ Gemini identified the show — use TMDB search to get accurate metadata
                setSceneAnalysis(sceneResult);
                setVideoProgress(85);

                const tmdbHits = await searchTMDB(sceneResult.showName);
                if (tmdbHits.length > 0) {
                    const top = tmdbHits[0];
                    const posterUrl = top.posterPath
                        ? `https://image.tmdb.org/t/p/w500${top.posterPath}`
                        : null;

                    const detectionResult: UniversalDetectionResult = {
                        title: top.title,
                        originalTitle: sceneResult.showName,
                        confidence: sceneResult.confidence,
                        type: top.type === 'movie' ? 'movie' : 'series',
                        year: top.year ? parseInt(top.year) : undefined,
                        image: posterUrl || undefined,
                        rating: top.rating ? parseFloat(top.rating.toFixed(1)) : undefined,
                        genres: [],
                        description: sceneResult.sceneDescription || undefined,
                        tmdbId: `${top.type === 'movie' ? 'm' : 's'}-${top.id}`,
                        source: 'tmdb',
                    } as UniversalDetectionResult;

                    setVideoProgress(100);
                    setVideoPhase('idle');
                    setTimeout(() => {
                        setIsScanning(false);
                        setResult(detectionResult);
                        addScan(detectionResult, currentImageRef.current ?? undefined, isVideo);
                    }, 500);
                } else {
                    // TMDB found nothing — fall back to single-frame scan with hint
                    const firstFrameFile = new File([frames[0].blob], 'frame.jpg', { type: 'image/jpeg' });
                    await startScan(firstFrameFile);
                }
            } else {
                // Gemini uncertain or returned Unknown — fall back to single-frame detection
                if (sceneResult) setSceneAnalysis(sceneResult);
                const firstFrameFile = new File([frames[0].blob], 'frame.jpg', { type: 'image/jpeg' });
                await startScan(firstFrameFile);
            }

            setVideoProgress(100);
            setVideoPhase('idle');

        } catch (error) {
            console.error('Video processing error:', error);
            setError('⚠️ Failed to process video. Please try an image instead.');
            setIsScanning(false);
            setVideoProgress(0);
            setVideoPhase('idle');
        }
    };

    const startScan = async (file: File) => {
        setIsScanning(true);
        setError(null);

        try {
            const detectionResult = await detectContent(file, contentType);

            if (detectionResult && detectionResult.confidence > 0.70) {
                setTimeout(() => {
                    setIsScanning(false);
                    setResult(detectionResult);
                    addScan(detectionResult, currentImageRef.current ?? undefined, isVideo);
                }, 2000);
            } else if (detectionResult) {
                setTimeout(() => {
                    setIsScanning(false);
                    setError('Low confidence match. Result may be inaccurate.');
                    setResult(detectionResult);
                    addScan(detectionResult, currentImageRef.current ?? undefined, isVideo);
                }, 2000);
            } else {
                setTimeout(() => {
                    setIsScanning(false);
                    setError('❌ No match found. Try a different screenshot or use manual search.');
                }, 2000);
            }
        } catch (error) {
            console.error('Detection error:', error);
            setTimeout(() => {
                setIsScanning(false);
                setError('⚠️ Detection failed. Please try again or use manual search.');
            }, 2000);
        }
    };

    const handleReset = () => {
        setImage(null);
        setResult(null);
        setError(null);
        setIsScanning(false);
        setIsVideo(false);
        setVideoProgress(0);
        setSceneAnalysis(null);
        setExtractedFrames([]);
        setVideoPhase('idle');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white overflow-hidden relative">
            {/* Animated Background with Parallax */}
            <motion.div
                style={{ y: backgroundY }}
                className="fixed inset-0 overflow-hidden pointer-events-none"
            >
                {/* Floating Particles */}
                <FloatingParticles />

                {/* Gradient Orbs */}
                <motion.div
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        x: [0, -100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-20 right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"
                />

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
                        backgroundSize: '50px 50px',
                    }}
                />
            </motion.div>

            {/* Navigation with Blur */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="relative z-50 flex items-center justify-between px-6 md:px-12 py-6 backdrop-blur-xl bg-slate-950/50 border-b border-white/5"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 cursor-pointer"
                >
                    <motion.div
                        animate={{
                            boxShadow: ['0 0 20px rgba(139, 92, 246, 0.5)', '0 0 30px rgba(236, 72, 153, 0.5)', '0 0 20px rgba(139, 92, 246, 0.5)']
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center"
                    >
                        <Film className="w-6 h-6" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            KINO
                        </h1>
                        <p className="text-xs text-gray-400">Detective</p>
                    </div>
                </motion.div>

                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onOpenWatchlist}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-colors text-sm font-semibold"
                    >
                        <Bookmark size={16} />
                        <span className="hidden sm:inline">Watchlist</span>
                    </motion.button>

                    {onOpenAI && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onOpenAI}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/20 text-purple-300 hover:from-purple-600/30 hover:to-cyan-600/30 transition-all text-sm font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]"
                        >
                            <Sparkles size={16} />
                            <span className="hidden sm:inline">AI Discovery</span>
                        </motion.button>
                    )}

                    {onOpenRabbitHole && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onOpenRabbitHole}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 text-indigo-300 hover:from-indigo-600/30 hover:to-purple-600/30 transition-all text-sm font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]"
                        >
                            <Compass size={16} />
                            <span className="hidden sm:inline">Rabbit Hole</span>
                        </motion.button>
                    )}

                    <ScanHistoryButton
                        onClick={() => setShowHistory(true)}
                        count={scanHistory.length}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05, x: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.reload()}
                        className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Home
                    </motion.button>
                </div>
            </motion.nav>

            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12">
                {/* Header with Staggered Animation */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-12"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6 backdrop-blur-sm"
                    >
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        </motion.div>
                        <span className="text-sm text-purple-300">AI-Powered Universal Recognition</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-6xl font-black mb-4"
                    >
                        <motion.span
                            animate={{
                                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                            }}
                            transition={{ duration: 5, repeat: Infinity }}
                            className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white bg-size-200"
                        >
                            Upload & Discover
                        </motion.span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        Upload any screenshot from movies, TV shows, anime, or K-dramas
                    </motion.p>
                </motion.div>

                {/* Content Type Selector with Smooth Transitions */}
                {!image && !isScanning && !result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center justify-center gap-3 mb-8"
                    >
                        {[
                            { value: 'all', label: 'All Content', icon: Sparkles, gradient: 'from-purple-600 to-pink-600' },
                            { value: 'anime', label: 'Anime', icon: Zap, gradient: 'from-cyan-600 to-blue-600' },
                            { value: 'movie-series', label: 'Movies / TV', icon: Film, gradient: 'from-orange-600 to-red-600' },
                            { value: 'kdrama-cdrama', label: 'K-Drama / C-Drama', icon: Film, gradient: 'from-green-600 to-emerald-600' },
                        ].map((type, idx) => (
                            <motion.button
                                key={type.value}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setContentType(type.value as any)}
                                className={`relative px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 overflow-hidden group ${contentType === type.value
                                    ? `bg-gradient-to-r ${type.gradient} shadow-lg shadow-purple-500/50`
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                {contentType === type.value && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute inset-0 bg-gradient-to-r ${type.gradient}`}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <type.icon size={18} className="relative z-10" />
                                <span className="relative z-10">{type.label}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}

                {/* Main Upload Area or Results */}
                <AnimatePresence mode="wait">
                    {!image && !result ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="max-w-4xl mx-auto"
                        >
                            {/* Giant Upload Zone with Enhanced Effects */}
                            <motion.div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                whileHover={{ scale: 1.01 }}
                                className="relative group"
                            >
                                {/* Animated Border Gradient with Multiple Layers */}
                                <motion.div
                                    animate={{
                                        rotate: 360,
                                        scale: isDragging ? 1.05 : 1,
                                    }}
                                    transition={{
                                        rotate: {
                                            duration: 8,
                                            repeat: Infinity,
                                            ease: "linear"
                                        },
                                        scale: {
                                            duration: 0.3
                                        }
                                    }}
                                    className="absolute -inset-1 rounded-3xl blur-xl opacity-75"
                                    style={{
                                        background: isDragging
                                            ? 'linear-gradient(45deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)'
                                            : 'linear-gradient(45deg, #8b5cf6, #ec4899, #8b5cf6)',
                                    }}
                                />

                                {/* Secondary Glow Layer */}
                                <motion.div
                                    animate={{
                                        opacity: [0.3, 0.6, 0.3],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                    }}
                                    className="absolute -inset-2 rounded-3xl blur-2xl bg-gradient-to-r from-purple-600/30 to-pink-600/30"
                                />

                                <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/70 to-slate-900/70 border-2 border-purple-500/30 rounded-3xl p-16 md:p-24 shadow-2xl">
                                    {/* Upload Icon with Complex Animation */}
                                    <motion.div
                                        animate={{
                                            y: isDragging ? -20 : [0, -10, 0],
                                            scale: isDragging ? 1.2 : 1,
                                            rotate: isDragging ? [0, -10, 10, 0] : 0,
                                        }}
                                        transition={{
                                            y: {
                                                duration: 2,
                                                repeat: isDragging ? 0 : Infinity,
                                            },
                                            scale: {
                                                duration: 0.3,
                                            },
                                            rotate: {
                                                duration: 0.5,
                                                repeat: isDragging ? Infinity : 0,
                                            }
                                        }}
                                        className="mb-8"
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                                        >
                                            {/* Shimmer Effect */}
                                            <motion.div
                                                animate={{
                                                    x: ['-100%', '200%'],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    repeatDelay: 1,
                                                }}
                                                className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                                            />
                                            <Upload className="w-12 h-12 relative z-10" />
                                        </motion.div>
                                    </motion.div>

                                    <motion.h3
                                        animate={{
                                            scale: isDragging ? 1.05 : 1,
                                        }}
                                        className="text-3xl font-bold mb-4 text-center"
                                    >
                                        {isDragging ? (
                                            <motion.span
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400"
                                            >
                                                Drop it here! 🎯
                                            </motion.span>
                                        ) : (
                                            'Drop your screenshot'
                                        )}
                                    </motion.h3>

                                    <p className="text-gray-400 text-center mb-8">
                                        or click to browse files
                                    </p>

                                    {/* File Input */}
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload">
                                        <motion.div
                                            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/50 cursor-pointer inline-flex items-center gap-3 mx-auto relative overflow-hidden group"
                                        >
                                            {/* Button Shimmer */}
                                            <motion.div
                                                animate={{
                                                    x: ['-200%', '200%'],
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    repeatDelay: 2,
                                                }}
                                                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                                            />
                                            <ImageIcon className="w-5 h-5 relative z-10" />
                                            <span className="relative z-10">Choose File</span>
                                        </motion.div>
                                    </label>

                                    {/* Supported Formats with Icons */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.8 }}
                                        className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400"
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.1, color: '#a78bfa' }}
                                            className="flex items-center gap-2"
                                        >
                                            <ImageIcon size={16} className="text-purple-400" />
                                            Images
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ scale: 1.1, color: '#f472b6' }}
                                            className="flex items-center gap-2"
                                        >
                                            <FileVideo size={16} className="text-pink-400" />
                                            Videos
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ scale: 1.1, color: '#22d3ee' }}
                                            className="flex items-center gap-2"
                                        >
                                            <Sparkles size={16} className="text-cyan-400" />
                                            AI Powered
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Manual Search with Smooth Dropdown */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="mt-12 text-center"
                            >
                                <p className="text-gray-400 mb-4">Can't find your screenshot?</p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowManualSearch(!showManualSearch)}
                                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-full font-semibold hover:bg-white/10 transition-all flex items-center gap-2 mx-auto backdrop-blur-sm"
                                >
                                    <Search size={18} />
                                    {showManualSearch ? 'Hide Search' : 'Search by Name'}
                                    <motion.div
                                        animate={{ rotate: showManualSearch ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </motion.div>
                                </motion.button>

                                <AnimatePresence>
                                    {showManualSearch && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="mt-6 overflow-hidden"
                                        >
                                            <SmartSearch />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="max-w-5xl mx-auto"
                        >
                            {/* Results Card with Enhanced Animations */}
                            <motion.div
                                layout
                                className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl"
                            >
                                {/* Animated Glow */}
                                <motion.div
                                    animate={{
                                        opacity: [0.3, 0.6, 0.3],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                    }}
                                    className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-2xl"
                                />

                                {/* Close Button with Ripple Effect */}
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleReset}
                                    className="absolute top-6 right-6 z-50 w-10 h-10 bg-red-500/20 hover:bg-red-500 border border-red-500/50 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                                >
                                    <X size={20} />
                                </motion.button>

                                <div className="relative grid md:grid-cols-2 gap-8 p-8">
                                    {/* Image Preview with Fade In */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="space-y-4"
                                    >
                                        <p className="text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            <ImageIcon size={14} />
                                            Your Upload
                                        </p>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            className="relative aspect-video bg-slate-900/50 rounded-xl overflow-hidden border border-white/5"
                                        >
                                            {image && (
                                                <img
                                                    src={image}
                                                    alt="Uploaded"
                                                    className="w-full h-full object-contain"
                                                />
                                            )}
                                            {isVideo && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="absolute top-3 left-3 px-3 py-1 bg-purple-600/90 rounded-full text-xs font-semibold flex items-center gap-2 backdrop-blur-sm"
                                                >
                                                    <Video size={14} />
                                                    Video
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    </motion.div>

                                    {/* Results with Staggered Animation */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex flex-col justify-center"
                                    >
                                        {isScanning ? (
                                            <ScanningAnimation progress={videoProgress} phase={videoPhase} />
                                        ) : result ? (
                                            <ResultDisplay result={result} sceneAnalysis={sceneAnalysis} />
                                        ) : error ? (
                                            <ErrorDisplay error={error} />
                                        ) : null}
                                    </motion.div>
                                </div>

                                {/* Frame Timeline Strip */}
                                {extractedFrames.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="px-8 pb-6"
                                    >
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Film size={12} />
                                            {extractedFrames.length} frames analyzed
                                        </p>
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {extractedFrames.map((frame, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="shrink-0 relative"
                                                >
                                                    <img
                                                        src={frame}
                                                        alt={`Frame ${i + 1}`}
                                                        className="w-20 h-12 object-cover rounded-lg border border-white/10"
                                                    />
                                                    <span className="absolute bottom-1 right-1 text-[8px] bg-black/70 text-white px-1 rounded">
                                                        {i + 1}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* ─── Scan History Panel ─── */}
                <ScanHistoryPanel
                    isOpen={showHistory}
                    onClose={() => setShowHistory(false)}
                    history={scanHistory}
                    onRemove={removeScan}
                    onClear={clearHistory}
                    totalScans={scanHistory.length}
                />
            </div>

        </div>
    );
}

// Floating Particles Component
function FloatingParticles() {
    return (
        <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: [0, -100, 0],
                        x: [0, Math.random() * 50 - 25, 0],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                    }}
                    className="absolute w-1 h-1 bg-purple-400/50 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                />
            ))}
        </div>
    );
}

// Enhanced Scanning Animation
function ScanningAnimation({ progress, phase }: {
    progress: number;
    phase?: 'idle' | 'extracting' | 'analyzing' | 'building';
}) {
    const phaseLabel = {
        idle: 'AI is identifying your content',
        extracting: '⚙️ Extracting frames from video...',
        analyzing: '🔍 Analyzing all frames with KINO AI...',
        building: '🎬 Building scene fingerprint...',
    }[phase ?? 'idle'];

    const phaseTitle = {
        idle: 'Analyzing...',
        extracting: 'Extracting Frames',
        analyzing: 'Analyzing Clip',
        building: 'Scene Detective',
    }[phase ?? 'idle'];

    return (
        <div className="text-center py-12">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 mx-auto mb-6 relative"
            >
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl"
                />
                <Sparkles className="w-full h-full text-purple-400 relative z-10" />
            </motion.div>

            <motion.h3
                key={phaseTitle}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold mb-2"
            >
                {phaseTitle}
            </motion.h3>

            <motion.p
                key={phaseLabel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-gray-400 mb-6 text-sm"
            >
                {phaseLabel}
            </motion.p>

            {progress > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xs mx-auto"
                >
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 relative"
                        >
                            {/* Shimmer */}
                            <motion.div
                                animate={{
                                    x: ['-100%', '200%'],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                }}
                                className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                            />
                        </motion.div>
                    </div>
                    <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-sm text-gray-500 mt-2"
                    >
                        {progress}%
                    </motion.p>
                </motion.div>
            )}
        </div>
    );
}

// Enhanced Result Display
function ResultDisplay({ result, sceneAnalysis }: {
    result: UniversalDetectionResult;
    sceneAnalysis?: import('../services/gemini').SceneAnalysis | null;
}) {
    const [providers, setProviders] = useState<StreamingProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [tmdbLink, setTmdbLink] = useState<string | undefined>();
    const [region, setRegion] = useState<'IN' | 'US'>('IN');

    useEffect(() => {
        async function fetchProviders() {
            setLoadingProviders(true);
            try {
                let providerResult: WatchProvidersResult;

                if (result.externalIds?.tmdbId) {
                    // We have TMDB ID — direct fetch
                    const type = result.type === 'movie' ? 'movie' : 'tv';
                    providerResult = await fetchWatchProviders(result.externalIds.tmdbId, type, result.title, region);
                } else {
                    // No TMDB ID — search by title
                    providerResult = await findAndFetchProviders(result.title, result.type);
                }

                setProviders(providerResult.providers);
                setTmdbLink(providerResult.tmdbLink);
            } catch (e) {
                setProviders([]);
            } finally {
                setLoadingProviders(false);
            }
        }

        fetchProviders();
    }, [result, region]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Success Badge */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex items-center gap-3 mb-4"
            >
                <motion.div
                    animate={{
                        boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 8px rgba(34, 197, 94, 0)'],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-3 h-3 bg-green-400 rounded-full"
                />
                <p className="text-sm text-green-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                    <Check size={16} />
                    Match Found
                </p>
            </motion.div>

            {/* Poster with Scale Animation */}
            {result.image && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    className="inline-block"
                >
                    <img
                        src={result.image}
                        alt={result.title}
                        className="w-32 h-48 object-cover rounded-xl shadow-2xl border-2 border-purple-500/30"
                    />
                </motion.div>
            )}

            {/* Title with Gradient */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h2 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    {result.title || 'Unknown'}
                </h2>
                <p className="text-gray-400">{result.genres?.join(', ') || result.originalTitle || ''}</p>
            </motion.div>

            {/* ── ADD TO WATCHLIST button ── */}
            <AddToWatchlistButton result={result} />

            {/* 🎬 Scene Context Panel — only for video clips */}
            {sceneAnalysis && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/60 to-purple-950/60 backdrop-blur-sm overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-indigo-500/15">
                        <div className="flex items-center gap-2">
                            <Film size={15} className="text-indigo-400" />
                            <span className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Scene Fingerprint</span>
                        </div>
                        {/* Spoiler badge */}
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest ${sceneAnalysis.spoilerLevel === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            sceneAnalysis.spoilerLevel === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-green-500/20 text-green-300 border border-green-500/30'
                            }`}>
                            {sceneAnalysis.spoilerLevel === 'high' ? '⚠️ High Spoilers' :
                                sceneAnalysis.spoilerLevel === 'medium' ? '🔶 Some Spoilers' : '✅ Safe to share'}
                        </span>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Arc & Episode Row */}
                        <div className="flex flex-wrap gap-3">
                            {sceneAnalysis.arcName && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/20">
                                    <span className="text-purple-400 text-xs">🎭 Arc</span>
                                    <span className="text-white text-sm font-semibold">{sceneAnalysis.arcName}</span>
                                </div>
                            )}
                            {sceneAnalysis.episodeRange && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/20">
                                    <span className="text-cyan-400 text-xs">📺 Episode</span>
                                    <span className="text-white text-sm font-semibold">{sceneAnalysis.episodeRange}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-700/40 border border-white/10">
                                <span className="text-gray-400 text-xs">📍 Content Type</span>
                                <span className="text-white text-sm font-semibold capitalize">{sceneAnalysis.contentType}</span>
                            </div>
                        </div>

                        {/* Narrative Position */}
                        {sceneAnalysis.narrativePosition && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Narrative Position</p>
                                <p className="text-gray-200 text-sm italic">{sceneAnalysis.narrativePosition}</p>
                            </div>
                        )}

                        {/* Scene Context */}
                        {sceneAnalysis.sceneContext && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Scene Context</p>
                                <p className="text-gray-300 text-sm">{sceneAnalysis.sceneContext}</p>
                            </div>
                        )}

                        {/* Characters */}
                        {sceneAnalysis.charactersVisible.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Characters Detected</p>
                                <div className="flex flex-wrap gap-2">
                                    {sceneAnalysis.charactersVisible.map((char, i) => (
                                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs">
                                            {char}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Visual Clues */}
                        {sceneAnalysis.keyVisualClues.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Visual Clues</p>
                                <ul className="space-y-1">
                                    {sceneAnalysis.keyVisualClues.slice(0, 4).map((clue, i) => (
                                        <li key={i} className="text-gray-400 text-xs flex items-start gap-2">
                                            <span className="text-indigo-400 mt-0.5">•</span>
                                            {clue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Frame confidence mini-bar chart */}
                        {sceneAnalysis.confidence_per_frame.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                    AI Confidence Per Frame ({sceneAnalysis.framesAnalyzed} frames)
                                </p>
                                <div className="flex items-end gap-1 h-8">
                                    {sceneAnalysis.confidence_per_frame.map((c, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.round(c * 100)}%` }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex-1 rounded-sm bg-gradient-to-t from-indigo-600 to-purple-400"
                                            title={`Frame ${i + 1}: ${Math.round(c * 100)}%`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Confidence Meter with Animation */}
            {result.confidence && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Confidence:</span>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm font-semibold"
                        >
                            {(result.confidence * 100).toFixed(0)}%
                        </motion.span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.confidence * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 relative"
                        >
                            <motion.div
                                animate={{
                                    x: ['-100%', '200%'],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                }}
                                className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            />
                        </motion.div>
                    </div>
                </motion.div>
            )}
            {/* Rating */}
            {result.rating && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-2"
                >
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-lg">{result.rating}/10</span>
                </motion.div>
            )}

            {/* ━━━━━━━━━━ EPISODE & TIMESTAMP (anime detections) ━━━━━━━━━━ */}
            {(result.episode !== undefined || result.timestamp) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="flex flex-wrap gap-2"
                >
                    {result.episode !== undefined && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-sm">
                            <span className="text-purple-300 font-semibold">
                                {result.season ? `S${result.season} ` : ''}Ep {result.episode}
                            </span>
                        </div>
                    )}
                    {result.timestamp && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-sm">
                            <span className="text-cyan-300">⏱</span>
                            <span className="text-cyan-300 font-semibold font-mono">{result.timestamp}</span>
                        </div>
                    )}
                    {result.year && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-white/10 text-sm">
                            <span className="text-gray-300">{result.year}</span>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ━━━━━━━━━━ MORE INFO (expandable details panel) ━━━━━━━━━━ */}
            <MoreInfoPanel result={result} />

            {/* ━━━━━━━━━━━━━━━━ WHERE TO WATCH ━━━━━━━━━━━━━━━━ */}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="border-t border-white/10 pt-5 mt-2"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Tv className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-bold text-lg text-white">Where to Watch</h3>
                    </div>
                    {/* Region Toggle */}
                    <div className="flex items-center gap-1 bg-slate-800/60 rounded-full p-1 text-xs">
                        {(['IN', 'US'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setRegion(r)}
                                className={`px-3 py-1 rounded-full font-semibold transition-all ${region === r
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {r === 'IN' ? '🇮🇳 IN' : '🇺🇸 US'}
                            </button>
                        ))}
                    </div>
                </div>

                {loadingProviders ? (
                    <div className="flex items-center gap-3 text-gray-400 py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                        <span className="text-sm">Finding streaming options...</span>
                    </div>
                ) : providers.length > 0 ? (
                    <div className="space-y-3">
                        {/* Streaming (flatrate) first */}
                        {providers.filter(p => p.type === 'flatrate').length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Stream</p>
                                <div className="flex flex-wrap gap-2">
                                    {providers.filter(p => p.type === 'flatrate').map((p, i) => (
                                        <ProviderBadge key={i} provider={p} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Free */}
                        {providers.filter(p => p.type === 'free').length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Free</p>
                                <div className="flex flex-wrap gap-2">
                                    {providers.filter(p => p.type === 'free').map((p, i) => (
                                        <ProviderBadge key={i} provider={p} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Rent/Buy */}
                        {providers.filter(p => p.type === 'rent' || p.type === 'buy').length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Rent / Buy</p>
                                <div className="flex flex-wrap gap-2">
                                    {providers.filter(p => p.type === 'rent' || p.type === 'buy').map((p, i) => (
                                        <ProviderBadge key={i} provider={p} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* TMDB link */}
                        {tmdbLink && (
                            <a
                                href={tmdbLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-cyan-400 transition-colors mt-1"
                            >
                                <ExternalLink size={12} />
                                View all options on TMDB
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500 italic">
                            No streaming info found for {region === 'IN' ? 'India' : 'US'}.
                        </p>
                        {/* Fallback: search links */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { name: 'Netflix', url: `https://www.netflix.com/search?q=${encodeURIComponent(result.title)}`, color: '#E50914' },
                                { name: 'Prime Video', url: `https://www.amazon.com/s?k=${encodeURIComponent(result.title)}&i=instant-video`, color: '#00A8E1' },
                                ...(result.type === 'anime' ? [
                                    { name: 'Crunchyroll', url: `https://www.crunchyroll.com/search?q=${encodeURIComponent(result.title)}`, color: '#F47521' },
                                ] : []),
                                { name: 'Google Search', url: `https://www.google.com/search?q=${encodeURIComponent(result.title + ' where to watch')}`, color: '#4285F4' },
                            ].map((p, i) => (
                                <motion.a
                                    key={i}
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all border border-white/10 hover:border-white/30"
                                    style={{ backgroundColor: p.color + '22' }}
                                >
                                    <span style={{ color: p.color }}>●</span>
                                    {p.name}
                                    <ExternalLink size={10} />
                                </motion.a>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

        </motion.div>



    );
}

// ━━━━━━━━━━━━━━━━ ADD TO WATCHLIST BUTTON ━━━━━━━━━━━━━━━━
function AddToWatchlistButton({ result }: { result: UniversalDetectionResult }) {
    const { addToWatchlist, removeFromWatchlist, isInWatchlist, getWatchlistItem } = useAuth();
    const [showPicker, setShowPicker] = useState(false);
    const [justAdded, setJustAdded] = useState(false);
    const inWatchlist = isInWatchlist(result.title);
    const existing = getWatchlistItem(result.title);

    const statusOptions: { value: WatchStatus; label: string; color: string }[] = [
        { value: 'plan-to-watch', label: '📋 Plan to Watch', color: '#818cf8' },
        { value: 'watching', label: '▶️ Watching', color: '#22d3ee' },
        { value: 'completed', label: '✅ Completed', color: '#4ade80' },
        { value: 'on-hold', label: '⏸️ On Hold', color: '#fbbf24' },
        { value: 'dropped', label: '❌ Dropped', color: '#f87171' },
    ];

    const handleAdd = (status: WatchStatus) => {
        const item: Omit<WatchlistItem, 'addedAt' | 'updatedAt'> = {
            id: result.title,
            title: result.title,
            type: result.type,
            image: result.image,
            year: result.year,
            genres: result.genres,
            rating: result.rating,
            overview: result.overview,
            externalIds: result.externalIds,
            status,
        };
        addToWatchlist(item);
        setShowPicker(false);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="relative">
            {inWatchlist ? (
                <div className="flex items-center gap-2">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-sm font-semibold"
                    >
                        <BookmarkCheck size={16} />
                        {justAdded ? 'Added!' : `In Watchlist · ${existing?.status?.replace(/-/g, ' ')}`}
                    </motion.div>
                    <button
                        onClick={() => setShowPicker(o => !o)}
                        className="px-3 py-2 rounded-xl bg-slate-700/60 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors text-xs"
                    >
                        Change
                    </button>
                    <button
                        onClick={() => removeFromWatchlist(result.title)}
                        className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-xs"
                    >
                        Remove
                    </button>
                </div>
            ) : (
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowPicker(o => !o)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition-all border border-purple-400/20"
                >
                    <Bookmark size={16} />
                    + Add to Watchlist
                </motion.button>
            )}

            {/* Status picker dropdown */}
            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 w-52 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider px-3 pt-3 pb-1">Add as…</p>
                        {statusOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleAdd(opt.value)}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
                                style={{ color: opt.color }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ━━━━━━━━━━━━━━━━ MORE INFO PANEL ━━━━━━━━━━━━━━━━
function MoreInfoPanel({ result }: { result: UniversalDetectionResult }) {
    const [isOpen, setIsOpen] = useState(false);
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleOpen = async () => {
        setIsOpen(o => !o);
        if (!details && !loading) {
            setLoading(true);
            try {
                if (result.externalIds?.anilistId) {
                    const data = await getAnimeDetails(result.externalIds.anilistId);
                    setDetails(data);
                }
            } catch (e) {
                // ignore
            } finally {
                setLoading(false);
            }
        }
    };

    const STREAMING_SITES = ['Crunchyroll', 'Netflix', 'Hulu', 'Funimation', 'Amazon Prime Video', 'HIDIVE', 'Disney Plus', 'Disney+', 'Bilibili', 'VRV', 'AnimeLab'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="border border-white/10 rounded-xl overflow-hidden"
        >
            <button
                onClick={handleOpen}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/40 hover:bg-slate-700/40 transition-colors text-left"
            >
                <span className="flex items-center gap-2 font-semibold text-sm text-white">
                    <span>📖</span> More Info
                </span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} className="text-gray-400" />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 space-y-4 border-t border-white/5">
                            {loading ? (
                                <div className="flex items-center gap-3 text-gray-400 py-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                    <span className="text-sm">Fetching details...</span>
                                </div>
                            ) : details ? (
                                <>
                                    {/* Description */}
                                    {details.description && (
                                        <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">
                                            {details.description.replace(/<[^>]*>/g, '')}
                                        </p>
                                    )}

                                    {/* Meta row */}
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {details.status && (
                                            <span className={`px-2 py-1 rounded-full font-semibold ${details.status === 'FINISHED' ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                : details.status === 'RELEASING' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                                }`}>
                                                {details.status === 'FINISHED' ? 'Completed' : details.status === 'RELEASING' ? '🔴 Airing' : details.status}
                                            </span>
                                        )}
                                        {details.episodes && (
                                            <span className="px-2 py-1 rounded-full bg-slate-700 text-gray-300 border border-white/10">
                                                {details.episodes} eps
                                            </span>
                                        )}
                                        {details.duration && (
                                            <span className="px-2 py-1 rounded-full bg-slate-700 text-gray-300 border border-white/10">
                                                {details.duration} min/ep
                                            </span>
                                        )}
                                        {details.averageScore && (
                                            <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                                ⭐ {(details.averageScore / 10).toFixed(1)}/10
                                            </span>
                                        )}
                                    </div>

                                    {/* Genres */}
                                    {details.genres?.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {details.genres.map((g: string) => (
                                                <span key={g} className="px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-300 border border-purple-500/20">
                                                    {g}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Studio */}
                                    {details.studios?.nodes?.length > 0 && (
                                        <p className="text-xs text-gray-400">
                                            <span className="text-gray-500">Studio: </span>
                                            <span className="text-white font-medium">{details.studios.nodes.map((s: any) => s.name).join(', ')}</span>
                                        </p>
                                    )}

                                    {/* Characters */}
                                    {details.characters?.nodes?.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Main Characters</p>
                                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                                {details.characters.nodes.slice(0, 6).map((c: any, i: number) => (
                                                    <div key={i} className="flex-shrink-0 text-center w-14">
                                                        {c.image?.medium ? (
                                                            <img src={c.image.medium} alt={c.name.full}
                                                                className="w-12 h-12 rounded-full object-cover mx-auto mb-1 border border-white/10" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-slate-700 mx-auto mb-1 flex items-center justify-center text-lg">👤</div>
                                                        )}
                                                        <p className="text-xxs text-gray-400 text-center leading-tight" style={{ fontSize: '9px' }}>
                                                            {c.name.full.split(' ')[0]}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Next Airing */}
                                    {details.nextAiringEpisode && (
                                        <p className="text-xs text-cyan-400">
                                            📅 Ep {details.nextAiringEpisode.episode} airs {new Date(details.nextAiringEpisode.airingAt * 1000).toLocaleDateString()}
                                        </p>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {/* AniList link */}
                                        <a
                                            href={`https://anilist.co/anime/${result.externalIds?.anilistId}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-600/30 transition-colors"
                                        >
                                            <ExternalLink size={12} /> View on AniList
                                        </a>
                                        {/* Trailer */}
                                        {details.trailer?.site === 'youtube' && (
                                            <a
                                                href={`https://www.youtube.com/watch?v=${details.trailer.id}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-600/30 transition-colors"
                                            >
                                                ▶ Trailer
                                            </a>
                                        )}
                                        {/* MAL link via imdbId or search */}
                                        <a
                                            href={`https://myanimelist.net/search/all?q=${encodeURIComponent(result.title)}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-800/30 text-blue-200 text-xs font-semibold hover:bg-blue-900/30 transition-colors"
                                        >
                                            <ExternalLink size={12} /> MyAnimeList
                                        </a>
                                    </div>

                                    {/* Streaming links from AniList */}
                                    {details.externalLinks?.filter((l: any) => STREAMING_SITES.includes(l.site)).length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Official Streams</p>
                                            <div className="flex flex-wrap gap-2">
                                                {details.externalLinks
                                                    .filter((l: any) => STREAMING_SITES.includes(l.site))
                                                    .map((l: any, i: number) => (
                                                        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all border border-white/10 hover:border-white/25"
                                                            style={{
                                                                backgroundColor: (l.color || PLATFORM_COLORS[l.site] || '#6366f1') + '22',
                                                                borderColor: (l.color || PLATFORM_COLORS[l.site] || '#6366f1') + '44',
                                                            }}
                                                        >
                                                            <span style={{ color: l.color || PLATFORM_COLORS[l.site] || '#a78bfa' }}>●</span>
                                                            {l.site}
                                                            <ExternalLink size={10} />
                                                        </a>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-400">
                                        {result.overview || 'No additional details available.'}
                                    </p>
                                    {result.genres && result.genres.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {result.genres.map((g) => (
                                                <span key={g} className="px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-300 border border-purple-500/20">{g}</span>
                                            ))}
                                        </div>
                                    )}
                                    <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(result.title + ' anime')}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 border border-white/10 text-gray-300 text-xs font-semibold hover:bg-slate-600 transition-colors"
                                    >
                                        <ExternalLink size={12} /> Search on Google
                                    </a>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Provider badge component
function ProviderBadge({ provider }: { provider: StreamingProvider }) {
    const color = PLATFORM_COLORS[provider.name] || '#6366f1';
    return (
        <motion.a
            href={provider.link}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            title={`Watch on ${provider.name}`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all border border-white/10 hover:border-opacity-50 hover:shadow-lg group"
            style={{
                backgroundColor: color + '22',
                borderColor: color + '44',
            }}
        >
            {provider.logo ? (
                <img
                    src={provider.logo}
                    alt={provider.name}
                    className="w-5 h-5 rounded object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            ) : (
                <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                />
            )}
            <span style={{ color }}>{provider.name}</span>
            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
        </motion.a>
    );
}



// Enhanced Error Display
function ErrorDisplay({ error }: { error: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-6 bg-red-500/20 border-2 border-red-500/50 rounded-full flex items-center justify-center relative"
            >
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
                />
                <X className="w-8 h-8 text-red-400 relative z-10" />
            </motion.div>

            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-bold mb-2 text-red-400"
            >
                Detection Failed
            </motion.h3>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400"
            >
                {error}
            </motion.p>
        </motion.div>
    );
}
