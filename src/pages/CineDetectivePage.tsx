import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Scan, Sparkles, Film, Zap, Globe } from 'lucide-react';
import { detectContent } from '../services/universalDetection';
import { getRandomAnime } from '../services/anilist';
import { db } from '../data/db';
import type { UniversalDetectionResult } from '../services/universalDetection';

export default function CineDetectiveHero() {
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<UniversalDetectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [contentType, setContentType] = useState<'all' | 'anime' | 'movie-series' | 'kdrama-cdrama'>('all');

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processImage(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processImage(file);
        }
    };

    const processImage = (file: File) => {
        const url = URL.createObjectURL(file);
        setImage(url);
        setResult(null);
        setError(null);
        startScan(file);
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
                console.log('❌ No match found, using fallback...');
                throw new Error('No match found');
            }
        } catch (error) {
            console.error('Universal detection error:', error);

            try {
                const anime = await getRandomAnime();
                setTimeout(() => {
                    setIsScanning(false);
                    setError('Could not identify content. Showing random suggestion instead.');

                    if (anime) {
                        setResult({
                            type: 'anime',
                            title: anime.title,
                            confidence: 0.50,
                            timestamp: `${Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`,
                            image: anime.image,
                            source: 'fallback'
                        });
                    } else {
                        const randomItem = db[Math.floor(Math.random() * db.length)];
                        setResult({
                            type: 'unknown',
                            title: randomItem.title,
                            confidence: 0.40,
                            image: randomItem.image,
                            source: 'fallback'
                        });
                    }
                }, 2000);
            } catch (fallbackError) {
                setIsScanning(false);
                setError('Scan failed. Please try again with a clearer image.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-7xl w-full relative z-10">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            <Scan className="w-16 h-16 text-cyan-400" />
                        </motion.div>
                        <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            CineDetective
                        </h1>
                    </div>

                    <p className="text-2xl md:text-3xl text-cyan-300 font-light mb-4">
                        AI-Powered Universal Content Recognition
                    </p>

                    <p className="text-cyan-600 text-lg max-w-2xl mx-auto">
                        Upload any screenshot from movies, TV shows, anime, K-dramas, or C-dramas.
                        Our AI instantly identifies it from <span className="text-cyan-400 font-bold">820,000+ titles</span>!
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                        <div className="flex items-center gap-2 text-cyan-400">
                            <Globe className="w-5 h-5" />
                            <span className="font-semibold">820K+ Titles</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-400">
                            <Zap className="w-5 h-5" />
                            <span className="font-semibold">Instant Detection</span>
                        </div>
                        <div className="flex items-center gap-2 text-pink-400">
                            <Sparkles className="w-5 h-5" />
                            <span className="font-semibold">AI-Powered</span>
                        </div>
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

                {/* Main Upload Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid md:grid-cols-2 gap-8"
                >
                    {/* Upload Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="bg-slate-900/50 backdrop-blur-sm border-2 border-dashed border-cyan-900/50 rounded-3xl p-12 hover:border-cyan-700/70 transition-all cursor-pointer group"
                        onClick={() => document.getElementById('fileInput')?.click()}
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
                                    Drop Screenshot Here
                                </h3>
                                <p className="text-cyan-600 mb-4">
                                    or click to browse
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
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Results Area */}
                    <div className="bg-slate-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-3xl p-8">
                        {!result && !isScanning && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-cyan-700">
                                <Film className="w-20 h-20 mb-4 opacity-50" />
                                <p className="text-xl">Upload a screenshot to begin</p>
                                <p className="text-sm mt-2">AI detection results will appear here</p>
                            </div>
                        )}

                        {isScanning && (
                            <div className="h-full flex flex-col items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="mb-6"
                                >
                                    <Scan className="w-20 h-20 text-cyan-400" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-cyan-100 mb-2">Scanning...</h3>
                                <p className="text-cyan-600">Analyzing with AI • Searching 820K+ titles</p>
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
                </motion.div>
            </div>
        </div>
    );
}
