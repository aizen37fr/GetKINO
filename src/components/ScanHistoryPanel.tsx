import { useState, useRef } from 'react';

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
    History, X, Search, Film,
    BookmarkPlus, BookmarkCheck, Clock, Scan, RotateCcw,
} from 'lucide-react';
import type { ScanHistoryItem } from '../types/scanHistory';
import { useAuth } from '../context/AuthContext';
import type { WatchlistItem, WatchStatus } from '../types/watchlist';


// ─── Time Formatting ──────────────────────────────────────────────────────────
function timeAgo(ts: number): string {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Particle Burst ──────────────────────────────────────────────────────────
function ParticleBurst({ active }: { active: boolean }) {
    const particles = Array.from({ length: 12 }, (_, i) => i);
    const colors = ['#a855f7', '#ec4899', '#22d3ee', '#4ade80', '#fbbf24'];

    return (
        <AnimatePresence>
            {active && (
                <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
                    {particles.map(i => {
                        const angle = (i / particles.length) * 360;
                        const radius = 40 + Math.random() * 30;
                        const rad = (angle * Math.PI) / 180;
                        const x = Math.cos(rad) * radius;
                        const y = Math.sin(rad) * radius;
                        return (
                            <motion.div
                                key={i}
                                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: colors[i % colors.length] }}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{ x, y, scale: 0, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                        );
                    })}
                </div>
            )}
        </AnimatePresence>
    );
}

// ─── Holographic Card ────────────────────────────────────────────────────────
function HoloCard({ item, index, onRemove }: {
    item: ScanHistoryItem;
    index: number;
    onRemove: () => void;
}) {
    const { addToWatchlist, isInWatchlist } = useAuth();
    const [burst, setBurst] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-80, 80], [8, -8]);
    const rotateY = useTransform(x, [-80, 80], [-8, 8]);
    const glareX = useTransform(x, [-80, 80], ['0%', '100%']);
    const glareY = useTransform(y, [-80, 80], ['0%', '100%']);

    const result = item.result;
    const inWatchlist = isInWatchlist(result.title);
    const isLatest = index === 0;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    };
    const handleMouseLeave = () => { x.set(0); y.set(0); };

    const handleBookmark = (status: WatchStatus) => {
        const watchItem: Omit<WatchlistItem, 'addedAt' | 'updatedAt'> = {
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
        addToWatchlist(watchItem);
        setShowStatusPicker(false);
        setBurst(true);
        setTimeout(() => setBurst(false), 700);
    };

    const typeColor = result.type === 'anime' ? '#a855f7' : result.type === 'movie' ? '#22d3ee' : '#f59e0b';
    const typeIcon = result.type === 'anime' ? '⛩️' : result.type === 'movie' ? '🎬' : '📺';

    return (
        <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.9 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            className="relative"
        >
            {/* Timeline dot + line */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center" style={{ width: 24 }}>
                <motion.div
                    animate={isLatest ? {
                        boxShadow: ['0 0 0 0 rgba(168,85,247,0.7)', '0 0 0 8px rgba(168,85,247,0)', '0 0 0 0 rgba(168,85,247,0)'],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-3 h-3 rounded-full mt-4 flex-shrink-0 z-10"
                    style={{ backgroundColor: isLatest ? '#a855f7' : '#334155', border: '2px solid ' + (isLatest ? '#c084fc' : '#475569') }}
                />
                {/* Connector */}
                <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: index * 0.05 + 0.2, duration: 0.4 }}
                    className="flex-1 w-px origin-top"
                    style={{ backgroundColor: '#1e293b' }}
                />
            </div>

            {/* Card */}
            <div className="pl-8">
                <motion.div
                    ref={cardRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
                    className="relative rounded-2xl overflow-hidden border border-white/8 bg-slate-900/70 backdrop-blur-sm cursor-default"
                >
                    {/* Glare overlay */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none z-10 opacity-0 hover:opacity-30 transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                        }}
                    />

                    {/* Latest scan scan-line animation */}
                    {isLatest && (
                        <motion.div
                            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent z-20 pointer-events-none"
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                    )}

                    <div className="flex gap-3 p-3">
                        {/* Poster / Thumbnail */}
                        <div className="flex-shrink-0 relative">
                            <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-800">
                                {result.image ? (
                                    <img src={result.image} alt={result.title} className="w-full h-full object-cover" />
                                ) : item.thumbnail ? (
                                    <img src={item.thumbnail} alt="scan" className="w-full h-full object-cover opacity-50" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">{typeIcon}</div>
                                )}
                            </div>
                            {/* Type badge */}
                            <div
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] border-2 border-slate-900"
                                style={{ backgroundColor: typeColor + 'cc' }}
                            >
                                {result.type === 'anime' ? '⛩' : result.type === 'movie' ? '🎬' : '📺'}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-bold text-sm text-white leading-tight line-clamp-2">{result.title}</p>
                                <button
                                    onClick={onRemove}
                                    className="flex-shrink-0 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {result.year && (
                                    <span className="text-[10px] text-gray-500">{result.year}</span>
                                )}
                                {result.confidence && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                                        {Math.round(result.confidence * 100)}% match
                                    </span>
                                )}
                                <span
                                    className="text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-full"
                                    style={{ backgroundColor: typeColor + '22', color: typeColor }}
                                >
                                    {result.type}
                                </span>
                            </div>

                            {/* Genres */}
                            {result.genres && result.genres.length > 0 && (
                                <div className="flex gap-1 flex-wrap mb-2">
                                    {result.genres.slice(0, 3).map(g => (
                                        <span key={g} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-gray-500 border border-white/5">{g}</span>
                                    ))}
                                </div>
                            )}

                            {/* Footer: time + bookmark */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                    <Clock size={9} />
                                    {timeAgo(item.scannedAt)}
                                    {item.isVideo && (
                                        <span className="ml-1 flex items-center gap-0.5 text-purple-500">
                                            <Film size={9} /> video
                                        </span>
                                    )}
                                </div>

                                {/* Bookmark button */}
                                <div className="relative">
                                    <ParticleBurst active={burst} />
                                    {inWatchlist ? (
                                        <div className="flex items-center gap-1 text-green-400 text-[10px] font-semibold">
                                            <BookmarkCheck size={12} />
                                            Saved
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowStatusPicker(o => !o)}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-500/25 text-purple-300 text-[10px] font-semibold hover:bg-purple-500/25 transition-colors"
                                        >
                                            <BookmarkPlus size={10} />
                                            Add
                                        </button>
                                    )}
                                    <AnimatePresence>
                                        {showStatusPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="absolute bottom-full right-0 mb-1 w-44 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                            >
                                                {([
                                                    ['plan-to-watch', '📋 Plan to Watch', '#818cf8'],
                                                    ['watching', '▶️ Watching', '#22d3ee'],
                                                    ['completed', '✅ Completed', '#4ade80'],
                                                ] as [WatchStatus, string, string][]).map(([s, label, color]) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleBookmark(s)}
                                                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 transition-colors"
                                                        style={{ color }}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────
interface ScanHistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    history: ScanHistoryItem[];
    onRemove: (id: string) => void;
    onClear: () => void;
    totalScans: number;
}

export default function ScanHistoryPanel({ isOpen, onClose, history, onRemove, onClear, totalScans }: ScanHistoryPanelProps) {
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? history.filter(i => i.result.title.toLowerCase().includes(search.toLowerCase()))
        : history;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 flex flex-col bg-slate-950 border-l border-white/8 shadow-2xl"
                    >
                        {/* Gradient top glow */}
                        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

                        {/* Header */}
                        <div className="relative flex-shrink-0 px-5 py-5 border-b border-white/8">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                        className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center"
                                    >
                                        <Scan size={16} className="text-purple-400" />
                                    </motion.div>
                                    <div>
                                        <h2 className="font-black text-white text-base">Scan History</h2>
                                        <p className="text-xs text-gray-500">{totalScans} scans total</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {history.length > 0 && (
                                        <button
                                            onClick={onClear}
                                            className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Clear all"
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Stats bar */}
                            {history.length > 0 && (
                                <div className="flex gap-3 mt-3">
                                    {[
                                        { label: 'Anime', count: history.filter(i => i.result.type === 'anime').length, color: '#a855f7', icon: '⛩️' },
                                        { label: 'Movies', count: history.filter(i => i.result.type === 'movie').length, color: '#22d3ee', icon: '🎬' },
                                        { label: 'Shows', count: history.filter(i => i.result.type === 'tv').length, color: '#f59e0b', icon: '📺' },
                                    ].map(s => (
                                        <div key={s.label} className="flex-1 rounded-xl bg-slate-900/60 border border-white/5 px-2 py-1.5 text-center">
                                            <div className="text-lg leading-none mb-0.5">{s.icon}</div>
                                            <div className="text-sm font-black" style={{ color: s.color }}>{s.count}</div>
                                            <div className="text-[9px] text-gray-600">{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search */}
                        {history.length > 2 && (
                            <div className="flex-shrink-0 px-4 pt-3 pb-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search history…"
                                        className="w-full bg-slate-900/60 border border-white/8 rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar">
                            {filtered.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-20 text-center"
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="text-5xl mb-4"
                                    >
                                        📡
                                    </motion.div>
                                    <h3 className="font-bold text-white text-sm mb-1">
                                        {search ? 'No matches found' : 'No scans yet'}
                                    </h3>
                                    <p className="text-gray-600 text-xs max-w-[200px]">
                                        {search ? 'Try a different search term' : 'Upload an image or video to start detecting content'}
                                    </p>
                                </motion.div>
                            ) : (
                                <AnimatePresence>
                                    {filtered.map((item, i) => (
                                        <HoloCard
                                            key={item.id}
                                            item={item}
                                            index={i}
                                            onRemove={() => onRemove(item.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        {filtered.length > 0 && (
                            <div className="flex-shrink-0 px-4 py-3 border-t border-white/5">
                                <p className="text-[10px] text-gray-700 text-center">
                                    Showing {filtered.length} of {totalScans} scans · Stored locally
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Trigger Button (exported for nav bar) ────────────────────────────────────
export function ScanHistoryButton({ onClick, count }: { onClick: () => void; count: number }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-colors"
        >
            <History size={16} />
            <span className="hidden sm:inline text-sm">History</span>
            <AnimatePresence>
                {count > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-[9px] font-black flex items-center justify-center px-1"
                    >
                        {count > 99 ? '99+' : count}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
