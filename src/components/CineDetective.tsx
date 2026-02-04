import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Scan, X, Search, Film } from 'lucide-react';

interface ScanResult {
    id: number;
    title: string;
    similarity: number;
    episode?: number;
    timestamp: string;
    image: string;
    video?: string;
}

export default function CineDetective({ onClose }: { onClose: () => void }) {
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImage(url);
            setResult(null);
            // Auto-start scan simulation
            startScan();
        }
    };

    const startScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            setResult({
                id: 101,
                title: "Blade Runner 2049",
                similarity: 0.98,
                timestamp: "01:45:20",
                image: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg"
            });
        }, 3000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-xl"
        >
            <div className="w-full max-w-2xl bg-black/40 border border-cyan-900/50 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-cyan-900/30 bg-cyan-950/20">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Scan size={20} />
                        <h2 className="font-mono font-bold uppercase tracking-widest">CineDetective<span className="animate-pulse">_v1.0</span></h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-8 min-h-[400px] flex flex-col items-center justify-center relative">

                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    />

                    {!image ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-64 border-2 border-dashed border-cyan-900/50 rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-cyan-900/10 hover:border-cyan-500/50 transition-all group"
                        >
                            <div className="w-20 h-20 rounded-full bg-cyan-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload size={32} className="text-cyan-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-cyan-100 font-bold text-lg">Upload Frame or Video Clip</p>
                                <p className="text-cyan-600 text-sm mt-1">Drag & Drop or Click to Browse</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                onChange={handleFileUpload}
                            />
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex flex-col items-center">

                            {/* Image Preview Container */}
                            <div className="relative rounded-lg overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] max-h-[300px]">
                                <img src={image} alt="Scan Target" className="max-w-full max-h-full object-contain" />

                                {/* Scanning Laser Animation */}
                                {isScanning && (
                                    <motion.div
                                        initial={{ top: 0 }}
                                        animate={{ top: '100%' }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] z-10"
                                    />
                                )}

                                {/* Overlay UI */}
                                <div className="absolute inset-0 border-2 border-cyan-500/20 pointer-events-none">
                                    <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400 bg-black/50 px-1">SOURCE_IMG</div>
                                    {isScanning && (
                                        <div className="absolute bottom-2 right-2 text-xs font-mono text-cyan-400 bg-black/50 px-2 animate-pulse">
                                            ANALYZING...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Results Area */}
                            <AnimatePresence>
                                {!isScanning && result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 w-full bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 flex items-center gap-4 hover:bg-cyan-950/50 transition-colors cursor-pointer group"
                                    >
                                        <div className="relative w-24 aspect-video rounded overflow-hidden bg-black">
                                            <img src={result.image} alt={result.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                                    <Film size={14} className="text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-500/30">
                                                    98% MATCH
                                                </div>
                                                <span className="text-cyan-600 text-xs font-mono">{result.timestamp}</span>
                                            </div>
                                            <h3 className="text-white font-bold text-lg truncate">{result.title}</h3>
                                            <p className="text-cyan-400/60 text-xs truncate">Detected Scene: "Interlinked Cells"</p>
                                        </div>
                                        <div className="text-cyan-400">
                                            <Search size={20} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer Status */}
                <div className="p-3 bg-black/40 border-t border-cyan-900/30 flex justify-between text-[10px] font-mono text-cyan-600 uppercase">
                    <span>SCOPE: GLOBAL (K-DRAMA, ANIME, MOVIE)</span>
                    <span>STATUS: {isScanning ? 'SEARCHING...' : image ? 'MATCH FOUND' : 'AWAITING INPUT'}</span>
                </div>
            </div>
        </motion.div>
    );
}
