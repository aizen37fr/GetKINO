import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Video, Image as ImageIcon, Zap, AlertCircle, RotateCcw, Plus, Eye, EyeOff, Film, Globe, Users } from 'lucide-react';
import { extractVideoFrames } from '../utils/videoProcessor';
import { detectFromFrames, detectFromImage, type ReelDetectionResult } from '../services/reelDetector';
import { searchTMDB } from '../services/tmdb-extended';

// ─── Type helpers ────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    kdrama:  { label: '🇰🇷 K-Drama',      color: 'text-pink-300',   bg: 'bg-pink-500/20 border-pink-500/40' },
    cdrama:  { label: '🇨🇳 C-Drama',      color: 'text-red-300',    bg: 'bg-red-500/20 border-red-500/40' },
    anime:   { label: '⛩ Anime',          color: 'text-orange-300', bg: 'bg-orange-500/20 border-orange-500/40' },
    movie:   { label: '🎬 Movie',          color: 'text-blue-300',   bg: 'bg-blue-500/20 border-blue-500/40' },
    tv:      { label: '📺 TV Show',        color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-500/40' },
    unknown: { label: '❓ Unknown',         color: 'text-gray-300',   bg: 'bg-gray-500/20 border-gray-500/40' },
};

const SPOILER_CONFIG = {
    safe:    { label: '✅ No Spoilers',  color: 'text-green-400' },
    mild:    { label: '⚠️ Mild Spoiler', color: 'text-yellow-400' },
    spoiler: { label: '🚨 Major Spoiler', color: 'text-red-400' },
};

// ─── Confidence ring ─────────────────────────────────────────────────────────
function ConfidenceRing({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444';
    const r = 36, c = 40, circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;

    return (
        <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="absolute" width="80" height="80" viewBox="0 0 80 80">
                <circle cx={c} cy={c} r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
                <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    transform="rotate(-90 40 40)" />
            </svg>
            <div className="relative z-10 text-center">
                <p className="text-lg font-black leading-none" style={{ color }}>{pct}%</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wide">match</p>
            </div>
        </div>
    );
}

// ─── Frame strip ─────────────────────────────────────────────────────────────
function FrameStrip({ frames }: { frames: string[] }) {
    if (!frames.length) return null;
    return (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {frames.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border border-white/10">
                    <img src={f} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
                </motion.div>
            ))}
        </div>
    );
}

// ─── Result card ─────────────────────────────────────────────────────────────
function ResultCard({ result, tmdbPoster, onSelectAlternative }: {
    result: ReelDetectionResult;
    tmdbPoster?: string;
    onSelectAlternative?: (title: string) => void;
}) {
    const [showSpoiler, setShowSpoiler] = useState(false);
    const [wrongOpen, setWrongOpen] = useState(false);
    const tc = TYPE_CONFIG[result.type] ?? TYPE_CONFIG.unknown;
    const sc = SPOILER_CONFIG[result.spoilerLevel];
    const hasSpoilerContent = result.spoilerLevel !== 'safe';

    return (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm overflow-hidden">

            {/* Top: poster + title */}
            <div className="flex gap-4 p-5">
                {tmdbPoster && (
                    <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        src={`https://image.tmdb.org/t/p/w200${tmdbPoster}`}
                        alt={result.title} className="w-20 h-28 object-cover rounded-xl flex-shrink-0 shadow-lg" />
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h2 className="text-xl font-black text-white leading-tight">{result.title}</h2>
                        <ConfidenceRing value={result.confidence} />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tc.bg} ${tc.color}`}>
                            {tc.label}
                        </span>
                        {result.country && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Globe size={11} />{result.country}
                            </span>
                        )}
                        {result.episode && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 border border-white/10 text-gray-300">
                                {result.episode}
                            </span>
                        )}
                    </div>

                    {/* Spoiler toggle */}
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                        {hasSpoilerContent && (
                            <button onClick={() => setShowSpoiler(s => !s)}
                                className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                                {showSpoiler ? <EyeOff size={11} /> : <Eye size={11} />}
                                {showSpoiler ? 'Hide' : 'Show scene'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Scene description */}
            <AnimatePresence>
                {(!hasSpoilerContent || showSpoiler) && result.sceneDescription && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-3">
                        <p className="text-sm text-gray-300 leading-relaxed italic">"{result.sceneDescription}"</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Characters */}
            {result.characters && result.characters.length > 0 && (
                <div className="px-5 pb-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Users size={9} /> Characters spotted
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {result.characters.map((c, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300">
                                {c}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Visual clues */}
            {result.visualClues.length > 0 && (
                <div className="px-5 pb-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Eye size={9} /> How I knew
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {result.visualClues.map((clue, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                {clue}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Wrong? Section ─── */}
            <div className="border-t border-white/5">
                <button onClick={() => setWrongOpen(o => !o)}
                    className={`w-full flex items-center justify-between px-5 py-3 text-sm transition-colors
                        ${wrongOpen ? 'bg-orange-500/10 text-orange-300' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}>
                    <span className="flex items-center gap-2 font-semibold">
                        <span>🤔</span>
                        {wrongOpen ? 'Pick the correct one below' : 'Wrong result? See other possibilities'}
                    </span>
                    <span className="text-xs">{wrongOpen ? '▲' : '▼'}</span>
                </button>

                <AnimatePresence>
                    {wrongOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-5 pb-4 space-y-2">
                                {result.alternatives.length > 0
                                    ? result.alternatives.slice(0, 3).map((alt, i) => {
                                        const pct = Math.round(alt.confidence * 100);
                                        const barColor = pct >= 50 ? 'bg-yellow-500' : 'bg-gray-500';
                                        return (
                                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.07 }}
                                                onClick={() => onSelectAlternative?.(alt.title)}
                                                className="group flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/3 hover:bg-white/8 hover:border-orange-500/30 cursor-pointer transition-all">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors truncate">
                                                        {alt.title}
                                                    </p>
                                                    <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                            transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                                                            className={`h-full rounded-full ${barColor}`} />
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-500 flex-shrink-0">{pct}%</span>
                                            </motion.div>
                                        );
                                    })
                                    : (
                                        <p className="text-sm text-gray-500 text-center py-2">
                                            No alternatives available. Try uploading a clearer clip.
                                        </p>
                                    )
                                }
                                <p className="text-[10px] text-gray-600 text-center pt-1">
                                    💡 Tip: Clips with visible subtitles or title cards give the best results
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ─── Phase labels ─────────────────────────────────────────────────────────────
const PHASE_LABELS = {
    extracting: { icon: '🎞️', text: 'Extracting frames from clip...', sub: 'Sampling key moments' },
    analyzing:  { icon: '🧠', text: 'AI analyzing frames...', sub: 'Cross-referencing 820K+ titles' },
    building:   { icon: '✨', text: 'Building result...', sub: 'Almost there' },
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReelDetectorPage({ onBack }: { onBack: () => void }) {
    const [_file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isVideo, setIsVideo] = useState(false);
    const [frames, setFrames] = useState<string[]>([]);
    const [phase, setPhase] = useState<'idle' | 'extracting' | 'analyzing' | 'building' | 'done' | 'error'>('idle');
    const [result, setResult] = useState<ReelDetectionResult | null>(null);
    const [tmdbPoster, setTmdbPoster] = useState<string | undefined>();
    const [errorMsg, setErrorMsg] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setFile(null); setPreview(null); setIsVideo(false);
        setFrames([]); setPhase('idle'); setResult(null);
        setTmdbPoster(undefined); setErrorMsg('');
    };

    const process = useCallback(async (f: File) => {
        const isVid = f.type.startsWith('video/');
        setFile(f);
        setIsVideo(isVid);
        setPreview(URL.createObjectURL(f));
        setResult(null); setErrorMsg(''); setFrames([]);

        try {
            let detection: ReelDetectionResult;

            if (isVid) {
                // ── Video path: extract frames → analyze
                setPhase('extracting');
                const videoFrames = await extractVideoFrames(f, 2, 8);
                const frameDataUrls = videoFrames.map(fr => fr.dataUrl);
                setFrames(frameDataUrls);

                setPhase('analyzing');
                const frameInputs = videoFrames.map(fr => ({
                    data: fr.dataUrl.split(',')[1],
                    mimeType: 'image/jpeg',
                    timestamp: fr.timestamp,
                }));
                detection = await detectFromFrames(frameInputs);
            } else {
                // ── Image path: direct analysis
                setPhase('analyzing');
                detection = await detectFromImage(f);
            }

            setPhase('building');
            setResult(detection);

            // Try to fetch TMDB poster
            if (detection.title && detection.title !== 'Unknown') {
                try {
                    const tmdbRes = await searchTMDB(detection.title);
                    const first = Array.isArray(tmdbRes) ? tmdbRes[0] : tmdbRes;
                    if (first?.posterPath) setTmdbPoster(first.posterPath);
                } catch { /* poster is optional */ }
            }

            setPhase('done');
        } catch (e: any) {
            setPhase('error');
            setErrorMsg(e.message || 'Analysis failed. Try a clearer image or clip.');
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const f = Array.from(e.dataTransfer.files)[0];
        if (f) process(f);
    }, [process]);

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) process(f);
    };

    const phaseInfo = phase !== 'idle' && phase !== 'done' && phase !== 'error'
        ? PHASE_LABELS[phase as keyof typeof PHASE_LABELS]
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
            {/* Header */}
            <div className="sticky top-0 z-40 flex items-center gap-4 px-5 py-4 bg-slate-950/80 backdrop-blur border-b border-white/5">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </motion.button>
                <div>
                    <h1 className="font-black text-lg flex items-center gap-2">
                        <Film size={18} className="text-pink-400" />
                        Reel Detective
                    </h1>
                    <p className="text-xs text-gray-500">Drop any clip or screenshot — I'll find the show</p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

                {/* Upload zone */}
                <AnimatePresence mode="wait">
                    {phase === 'idle' && (
                        <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                            className={`relative rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-all
                                ${isDragging
                                    ? 'border-pink-500 bg-pink-500/10 scale-[1.02]'
                                    : 'border-white/10 hover:border-pink-500/50 hover:bg-pink-500/5'}`}>

                            {/* Animated glow */}
                            <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }}
                                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5" />

                            <div className="relative z-10">
                                <div className="flex justify-center gap-4 mb-5">
                                    <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 2.5, repeat: Infinity }}
                                        className="w-14 h-14 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
                                        <Video className="text-pink-400" size={26} />
                                    </motion.div>
                                    <motion.div animate={{ y: [4, -4, 4] }} transition={{ duration: 2.5, repeat: Infinity }}
                                        className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                                        <ImageIcon className="text-purple-400" size={26} />
                                    </motion.div>
                                </div>

                                <h3 className="text-xl font-black mb-2">Drop your reel here</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Any K-drama, anime, or movie clip from TikTok, Instagram, or your gallery
                                </p>

                                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                                    {['MP4', 'MOV', 'WebM', 'JPG', 'PNG', 'GIF'].map(f => (
                                        <span key={f} className="px-2 py-1 rounded-full bg-white/5 border border-white/10">{f}</span>
                                    ))}
                                </div>

                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-sm font-bold shadow-lg shadow-pink-500/20">
                                    <Upload size={16} /> Choose File
                                </motion.div>
                            </div>

                            <input ref={inputRef} type="file" accept="video/*,image/*" className="hidden" onChange={handleSelect} />
                        </motion.div>
                    )}

                    {/* Processing state */}
                    {phaseInfo && (
                        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="rounded-3xl border border-white/10 bg-slate-800/60 p-8 text-center space-y-4">

                            {/* Preview */}
                            {preview && !isVideo && (
                                <div className="w-40 h-24 mx-auto rounded-xl overflow-hidden border border-white/10">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}

                            {/* Frame strip for video */}
                            {frames.length > 0 && <FrameStrip frames={frames} />}

                            {/* Animated icon */}
                            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-5xl">{phaseInfo.icon}</motion.div>

                            <div>
                                <p className="font-bold text-white">{phaseInfo.text}</p>
                                <p className="text-sm text-gray-500">{phaseInfo.sub}</p>
                            </div>

                            {/* Progress dots */}
                            <div className="flex justify-center gap-2">
                                {[0, 1, 2].map(i => (
                                    <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                        className="w-2 h-2 rounded-full bg-pink-500" />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Error state */}
                    {phase === 'error' && (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-3">
                            <AlertCircle className="mx-auto text-red-400" size={32} />
                            <p className="text-red-300 font-semibold">{errorMsg}</p>
                            <button onClick={reset}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-colors">
                                <RotateCcw size={14} /> Try again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Frame strip after done */}
                {phase === 'done' && frames.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Frames analyzed</p>
                        <FrameStrip frames={frames} />
                    </div>
                )}

                {/* Result */}
                {phase === 'done' && result && (
                    <ResultCard result={result} tmdbPoster={tmdbPoster} />
                )}

                {/* Scan another */}
                {phase === 'done' && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                        onClick={reset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                        <Plus size={16} /> Scan another clip
                    </motion.button>
                )}

                {/* Instructions  */}
                {phase === 'idle' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="grid grid-cols-3 gap-3 text-center">
                        {[
                            { icon: '📱', title: 'Save reel', desc: 'Download from IG, TikTok, or your gallery' },
                            { icon: '⬆️', title: 'Upload here', desc: 'Drop it or tap to choose' },
                            { icon: '🎯', title: 'Get the show', desc: 'Title, episode, characters & more' },
                        ].map(s => (
                            <div key={s.title} className="rounded-2xl border border-white/5 bg-white/3 p-3">
                                <div className="text-2xl mb-1">{s.icon}</div>
                                <p className="text-xs font-semibold text-white mb-0.5">{s.title}</p>
                                <p className="text-[10px] text-gray-500">{s.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Powered by badge */}
                <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <Zap size={9} className="text-yellow-500" />
                    Powered by Groq Vision · 820K+ titles
                </p>
            </div>
        </div>
    );
}
