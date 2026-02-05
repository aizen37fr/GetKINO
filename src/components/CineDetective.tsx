import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Scan, X, Search, AlertCircle } from 'lucide-react';
import { db } from '../data/db';
import { getRandomAnime } from '../services/anilist';
import { detectContent, type UniversalDetectionResult } from '../services/universalDetection';


export default function CineDetective({ onClose }: { onClose: () => void }) {
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<UniversalDetectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImage(url);
            setResult(null);
            setError(null);
            // Auto-start REAL scan with file
            startScan(file);
        }
    };

    const startScan = async (file: File) => {
        setIsScanning(true);
        setError(null);

        try {
            // UNIVERSAL AI DETECTION - Supports anime, movies, TV shows, K-Dramas, C-Dramas
            console.log('🔍 Universal scan: Detecting content type...');
            const detectionResult = await detectContent(file);

            if (detectionResult && detectionResult.confidence > 0.70) {
                // High confidence match
                console.log('✅ Detected:', detectionResult);

                setTimeout(() => {
                    setIsScanning(false);
                    setResult(detectionResult);
                }, 2000); // Simulate scanning delay for UX
            } else if (detectionResult) {
                // Low confidence - show warning but still display result
                console.log('⚠️ Low confidence match:', detectionResult);

                setTimeout(() => {
                    setIsScanning(false);
                    setError('Low confidence match. Result may be inaccurate.');
                    setResult(detectionResult);
                }, 2000);
            } else {
                // No match found - fallback to random
                console.log('❌ No match found, using fallback...');
                throw new Error('No match found');
            }
        } catch (error) {
            console.error('Universal detection error:', error);

            // Fallback: Try random anime from AniList
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
                        // Final fallback to local db
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-cyan-900/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-900/50"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-cyan-900/30 bg-gradient-to-r from-cyan-950/50 to-blue-950/50">
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
                            <p className="text-cyan-300 font-semibold mb-2">Upload Screenshot</p>
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
                                    className="absolute top-2 right-2 p-1 bg-red-900/80 hover:bg-red-800 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Results Area */}
                            <div className="flex flex-col">
                                <AnimatePresence mode="wait">
                                    {isScanning && (
                                        <motion.div
                                            key="scanning"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center h-full space-y-6"
                                        >
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Scan className="w-16 h-16 text-cyan-400" />
                                            </motion.div>
                                            <div className="text-center">
                                                <p className="text-cyan-300 font-semibold mb-2">SCANNING...</p>
                                                <p className="text-xs text-cyan-600 uppercase tracking-wider">ANALYZING SCENE</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {!isScanning && result && (
                                        <motion.div
                                            key="result"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-2 h-2 rounded-full ${result.confidence > 0.85 ? 'bg-green-400' : result.confidence > 0.70 ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`} />
                                                <span className="text-xs text-cyan-600 uppercase tracking-wider">
                                                    {result.confidence > 0.85 ? 'High Confidence' : result.confidence > 0.70 ? 'Medium Confidence' : 'Low Confidence'}
                                                </span>
                                            </div>

                                            <div>
                                                <p className="text-xs text-cyan-600 uppercase tracking-wider mb-1">Detected Scene</p>
                                                <h3 className="text-2xl font-bold text-cyan-100">{result.title}</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-900/30">
                                                    <p className="text-xs text-cyan-600 uppercase tracking-wider mb-1">Match</p>
                                                    <p className="text-lg font-bold text-cyan-300">{(result.confidence * 100).toFixed(1)}%</p>
                                                </div>
                                                {result.episode && (
                                                    <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-900/30">
                                                        <p className="text-xs text-cyan-600 uppercase tracking-wider mb-1">Episode</p>
                                                        <p className="text-lg font-bold text-cyan-300">{result.episode}</p>
                                                    </div>
                                                )}
                                                {result.timestamp && (
                                                    <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-900/30">
                                                        <p className="text-xs text-cyan-600 uppercase tracking-wider mb-1">Timestamp</p>
                                                        <p className="text-lg font-bold text-cyan-300">{result.timestamp}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {!isScanning && !result && (
                                        <motion.div
                                            key="ready"
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
                        <span>STATUS: {"GLOBAL"} • {"820,000+"} TITLES</span>
                    </div>
                    <p className="text-cyan-800 uppercase tracking-wider">Powered by AI Detection</p>
                </div>
            </motion.div>
        </motion.div>
    );
}
