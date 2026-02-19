import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Upload, Sparkles, Film, Search, X, Video, Image as ImageIcon, FileVideo, Zap, ChevronDown, ArrowLeft, Check, Star, Tv, ExternalLink, Loader2 } from 'lucide-react';
import { detectContent } from '../services/universalDetection';
import type { UniversalDetectionResult } from '../services/universalDetection';
import { extractVideoFrames, getFileType } from '../utils/videoProcessor';
import SmartSearch from '../components/SmartSearch';
import { fetchWatchProviders, findAndFetchProviders } from '../services/watchProviders';
import type { StreamingProvider, WatchProvidersResult } from '../services/watchProviders';
import { PLATFORM_COLORS } from '../services/watchProviders';

export default function CineDetectivePage() {
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<UniversalDetectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [contentType, setContentType] = useState<'all' | 'anime' | 'movie-series' | 'kdrama-cdrama'>('all');
    const [isDragging, setIsDragging] = useState(false);
    const [showManualSearch, setShowManualSearch] = useState(false);
    const [isVideo, setIsVideo] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);


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

            setVideoProgress(20);
            const frames = await extractVideoFrames(file, 2, 5);
            setVideoProgress(60);

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
            const detectionResult = await detectContent(file, contentType);

            if (detectionResult && detectionResult.confidence > 0.70) {
                setTimeout(() => {
                    setIsScanning(false);
                    setResult(detectionResult);
                }, 2000);
            } else if (detectionResult) {
                setTimeout(() => {
                    setIsScanning(false);
                    setError('Low confidence match. Result may be inaccurate.');
                    setResult(detectionResult);
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
                                            <ScanningAnimation progress={videoProgress} />
                                        ) : result ? (
                                            <ResultDisplay result={result} />
                                        ) : error ? (
                                            <ErrorDisplay error={error} />
                                        ) : null}
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
function ScanningAnimation({ progress }: { progress: number }) {
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold mb-2"
            >
                Analyzing...
            </motion.h3>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 mb-6"
            >
                AI is identifying your content
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
function ResultDisplay({ result }: { result: UniversalDetectionResult }) {
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
