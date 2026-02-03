import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Scan, Film, Image as ImageIcon, AlertCircle, HelpCircle } from 'lucide-react';
import { extractFrameFromVideo, identifyMovie, type VisionResult } from '../services/vision';
// import { fetchContent } from '../services/api'; // Removed as it's unused

interface ClipAnalyzerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ClipAnalyzer({ isOpen, onClose }: ClipAnalyzerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<VisionResult | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAnalyzing(true);
        setResult(null);
        setFilePreview(null);

        try {
            let imageToAnalyze = '';

            if (file.type.startsWith('video/')) {
                // Extract frame
                imageToAnalyze = await extractFrameFromVideo(file);
                setFilePreview(imageToAnalyze);
            } else if (file.type.startsWith('image/')) {
                // Read image
                const reader = new FileReader();
                reader.readAsDataURL(file);
                await new Promise(resolve => { reader.onload = resolve; });
                imageToAnalyze = reader.result as string;
                setFilePreview(imageToAnalyze);
            } else {
                throw new Error('Unsupported file type');
            }

            // Analyze
            const res = await identifyMovie(imageToAnalyze);
            setResult(res);

        } catch (err) {
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            >
                <div className="w-full max-w-2xl bg-surface border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg shadow-lg shadow-purple-500/30">
                                <Scan className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">CineDetective</h2>
                                <p className="text-sm text-gray-400">Shazam for Movies</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center text-center">

                        {!analyzing && !result && (
                            <div className="space-y-6 w-full max-w-md">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/20 hover:border-purple-500/50 hover:bg-white/5 rounded-3xl p-10 cursor-pointer transition-all group"
                                >
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                        <Upload className="w-10 h-10 text-gray-400 group-hover:text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Upload visual evidence</h3>
                                    <p className="text-gray-400 text-sm mb-6">
                                        Drop a video clip (TikTok/Reel) or a screenshot here.
                                        We'll extract frames and scan our database.
                                    </p>
                                    <div className="flex justify-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Film size={14} /> MP4, MOV</span>
                                        <span className="flex items-center gap-1"><ImageIcon size={14} /> JPG, PNG</span>
                                    </div>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        )}

                        {analyzing && (
                            <div className="py-12 relative w-full h-full flex flex-col items-center justify-center">
                                {/* Using canvas scan effect simulation via CSS/Framer would be cool here */}
                                <div className="relative w-64 h-48 bg-black rounded-lg overflow-hidden mb-8 border border-white/20">
                                    {filePreview && <img src={filePreview} className="w-full h-full object-cover opacity-50" alt="Preview" />}
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        className="absolute left-0 right-0 h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                                    />
                                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                                        {[...Array(16)].map((_, i) => (
                                            <div key={i} className="border-[0.5px] border-green-500/10" />
                                        ))}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold animate-pulse">Analyzing Scene...</h3>
                                <p className="text-gray-400 mt-2">Matching visual fingerprints...</p>
                            </div>
                        )}

                        {result && (
                            <div className="w-full max-w-lg animate-fade-in">
                                {result.found ? (
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-left relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <AlertCircle size={100} />
                                        </div>

                                        <div className="flex gap-4 items-start relative z-10">
                                            <div className="w-16 h-24 bg-black rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                                                {/* In real app, fetch poster from TMDB using result.title */}
                                                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-500">Poster</div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 bg-green-500 text-black text-xs font-bold rounded-full">MATCH FOUND</span>
                                                    <span className="text-green-400 text-xs font-mono">{result.confidence}% Confidence</span>
                                                </div>
                                                <h3 className="text-2xl font-bold text-white mb-1">{result.title}</h3>
                                                <p className="text-gray-300 text-sm mb-3">Est. Timestamp: {result.timestamp}</p>
                                                <p className="text-gray-400 text-xs Italic border-l-2 border-green-500/30 pl-3">
                                                    "{result.reasoning}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            <button className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                                Go to Movie
                                            </button>
                                            <button
                                                onClick={() => { setResult(null); setFilePreview(null); }}
                                                className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl"
                                            >
                                                Scan Another
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                            <h3 className="text-xl font-bold text-red-200 mb-2">No High-Confidence Match</h3>
                                            <p className="text-red-200/60 text-sm">
                                                We analyzed the frames but couldn't find a direct match in our database. The scene might be too dark, blurry, or from a very new release.
                                            </p>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-gray-400 mb-4">Don't give up! Our community of 50k+ detectives can help.</p>
                                            <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold text-white shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                                                <HelpCircle size={20} />
                                                Ask the Community
                                            </button>
                                            <p className="text-xs text-purple-400 mt-2">You'll earn StreamScore points if someone answers!</p>
                                        </div>

                                        <button
                                            onClick={() => { setResult(null); setFilePreview(null); }}
                                            className="text-gray-500 text-sm hover:text-white"
                                        >
                                            Try another file
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
