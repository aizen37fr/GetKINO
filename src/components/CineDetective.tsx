import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Scan, X, Search, Film, AlertCircle } from 'lucide-react';
import { db } from '../data/db';
import { getRandomAnime } from '../services/anilist';
import { searchAnimeByImage, getAnimeDetails, formatTimestamp } from '../services/tracemoe';

interface ScanResult {
    id: string | number;
    title: string;
    similarity: number;
    episode?: number | string;
    timestamp: string;
    image: string;
    video?: string;
}

export default function CineDetective({ onClose }: { onClose: () => void }) {
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check if it's an image
            if (!file.type.startsWith('image/')) {
                setError('Please upload an image file (JPG, PNG, etc.)');
                return;
            }

            const url = URL.createObjectURL(file);
            setImage(url);
            setResult(null);
            setError(null);
            // Auto-start REAL AI scan
            startScan(url);
        }
    };

    const startScan = async (imageUrl: string) => {
        setIsScanning(true);
        setError(null);

        try {
            // REAL AI SCAN using trace.moe API
            console.log('🔍 Scanning image with trace.moe AI...');
            const traceMoeResult = await searchAnimeByImage(imageUrl);

            if (traceMoeResult && traceMoeResult.similarity > 0.80) {
                // High confidence match - use trace.moe result
                console.log('✅ Found match:', traceMoeResult);

                // Get full anime details from AniList
                const animeDetails = await getAnimeDetails(traceMoeResult.anilist);

                setTimeout(() => {
                    setIsScanning(false);
                    setResult({
                        id: `anilist_${traceMoeResult.anilist}`,
                        title: animeDetails?.title?.english || animeDetails?.title?.romaji || 'Unknown Anime',
                        similarity: traceMoeResult.similarity,
                        episode: traceMoeResult.episode,
                        timestamp: `${formatTimestamp(traceMoeResult.from)} - ${formatTimestamp(traceMoeResult.to)}`,
                        image: animeDetails?.coverImage?.large || traceMoeResult.image,
                        video: traceMoeResult.video
                    });
                }, 2000); // Simulate scanning delay for UX
            } else if (traceMoeResult) {
                // Low confidence - show warning but still display result
                console.log('⚠️ Low confidence match:', traceMoeResult);
                const animeDetails = await getAnimeDetails(traceMoeResult.anilist);

                setTimeout(() => {
                    setIsScanning(false);
                    setError('Low confidence match. Result may be inaccurate.');
                    setResult({
                        id: `anilist_${traceMoeResult.anilist}`,
                        title: animeDetails?.title?.english || animeDetails?.title?.romaji || 'Unknown Anime',
                        similarity: traceMoeResult.similarity,
                        episode: traceMoeResult.episode,
                        timestamp: `${formatTimestamp(traceMoeResult.from)} - ${formatTimestamp(traceMoeResult.to)}`,
                        image: animeDetails?.coverImage?.large || traceMoeResult.image,
                        video: traceMoeResult.video
                    });
                }, 2000);
            } else {
                // No match found - fallback to random
                console.log('❌ No match found, using fallback...');
                throw new Error('No match found');
            }
        } catch (error) {
            console.error('trace.moe scan error:', error);

            // Fallback: Try random anime from AniList
            try {
                const anime = await getRandomAnime();
                setTimeout(() => {
                    setIsScanning(false);
                    setError('Could not identify anime. Showing random suggestion instead.');

                    if (anime) {
                        setResult({
                            id: anime.id,
                            title: anime.title,
                            similarity: 0.50, // Low confidence indicator
                            timestamp: `${Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`,
                            image: anime.image
                        });
                    } else {
                        // Final fallback to local db
                        const randomItem = db[Math.floor(Math.random() * db.length)];
                        setResult({
                            id: randomItem.id,
                            title: randomItem.title,
                            similarity: 0.40,
                            timestamp: `${Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`,
                            image: randomItem.image
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-cyan-900/30 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-950/50 to-blue-950/50 p-4 flex items-center justify-between border-b border-cyan-900/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-900/30 rounded-lg">
                            <Scan className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-cyan-100 tracking-wide">CINEDETECTIVE_V1.0</h2>
                            <p className="text-xs text-cyan-600 uppercase tracking-wider">AI Scene Recognition</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-cyan-900/20 rounded-lg transition-colors text-cyan-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-6">
                    {/* Upload Area */}
                    {!image ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border-2 border-dashed border-cyan-900/50 rounded-xl p-12 text-center hover:border-cyan-700/50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-16 h-16 mx-auto mb-4 text-cyan-600" />
                            <p className="text-cyan-300 font-semibold mb-2">Upload Anime Screenshot</p>
                            <p className="text-xs text-cyan-700 uppercase tracking-wider">JPEG, PNG • MAX 5MB</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Image Preview */}
                            <div className="relative">
                                <img
                                    src={image}
                                    alt="Uploaded"
                                    className="w-full rounded-xl border border-cyan-900/30 shadow-lg"
                                />
                                <button
                                    onClick={() => {
                                        setImage(null);
                                        setResult(null);
                                        setError(null);
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-red-900/80 hover:bg-red-900 rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-white" />
                                </button>
                            </div>

                            {/* Results Area */}
                            <div className="flex flex-col justify-center">
                                <AnimatePresence mode="wait">
                                    {isScanning ? (
                                        <motion.div
                                            key="scanning"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center py-12"
                                        >
                                            <div className="relative w-24 h-24 mx-auto mb-6">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                                    className="absolute inset-0 border-4 border-cyan-900/30 border-t-cyan-500 rounded-full"
                                                />
                                                <Film className="absolute inset-0 m-auto w-10 h-10 text-cyan-400" />
                                            </div>
                                            <p className="text-cyan-300 font-semibold mb-2 animate-pulse">ANALYZING SCENE...</p>
                                            <p className="text-xs text-cyan-700 uppercase tracking-wider">Scanning 20,000+ anime database</p>
                                        </motion.div>
                                    ) : result ? (
                                        <motion.div
                                            key="result"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-2 h-2 rounded-full ${result.similarity > 0.85 ? 'bg-green-400' : result.similarity > 0.70 ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`} />
                                                <span className="text-xs text-cyan-600 uppercase tracking-wider">
                                                    {result.similarity > 0.85 ? 'High Confidence' : result.similarity > 0.70 ? 'Medium Confidence' : 'Low Confidence'}
                                                </span>
                                            </div>

                                            <div>
                                                <p className="text-xs text-cyan-600 uppercase tracking-wider mb-1">Detected Scene</p>
                                                <h3 className="text-2xl font-bold text-cyan-100">{result.title}</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-900/30">
                                                    <p className="text-xs text-cyan-600 uppercase tracking-wider mb-1">Match</p>
                                                    <p className="text-lg font-bold text-cyan-300">{(result.similarity * 100).toFixed(1)}%</p>
                                                </div>
                                                {result.episode && (
                                                    <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-900/30">
                                                        <p className="text-xs text-cyan-600 uppercase tracking-wider mb-1">Episode</p>
                                                        <p className="text-lg font-bold text-cyan-300">{result.episode}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-900/30">
                                                <p className="text-xs text-cyan-600 uppercase tracking-wider mb-1">Timestamp</p>
                                                <p className="text-sm font-mono text-cyan-300">{result.timestamp}</p>
                                            </div>

                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2"
                                            >
                                                <Search size={18} />
                                                Scan Another Image
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="idle"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-12"
                                        >
                                            <Search className="w-16 h-16 mx-auto mb-4 text-cyan-600" />
                                            <p className="text-cyan-500 font-semibold">Ready to Scan</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error Display */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 bg-red-900/20 border border-red-900/50 rounded-lg p-3 flex items-center gap-2 text-red-200 text-sm"
                                    >
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-950/50 p-4 border-t border-cyan-900/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-cyan-700 uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span>STATUS: {"GLOBAL"} • {"20,000+"} SCENES</span>
                    </div>
                    <p className="text-cyan-800 uppercase tracking-wider">Powered by trace.moe AI</p>
                </div>
            </motion.div>
        </motion.div>
    );
}
