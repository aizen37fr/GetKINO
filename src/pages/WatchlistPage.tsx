import { useState, useMemo, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Search, Grid3X3, List, Star, Trash2, Edit3,
    X, Check, BookOpen, Play, Trophy, Filter,
    ChevronDown, ExternalLink, TrendingUp, Film, Tv, Zap, Sparkles, RefreshCw, ThumbsUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getShowSummary, getSimilarAfterRating, type SimilarTitle } from '../services/gemini';

import type { WatchlistItem, WatchStatus } from '../types/watchlist';
import { STATUS_LABELS, STATUS_COLORS } from '../types/watchlist';

// ─── Status Tab Config ────────────────────────────────────────────────────────
const STATUS_TABS: { value: 'all' | WatchStatus; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '✨' },
    { value: 'watching', label: 'Watching', icon: '▶️' },
    { value: 'plan-to-watch', label: 'Plan to Watch', icon: '📋' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'on-hold', label: 'On Hold', icon: '⏸️' },
    { value: 'dropped', label: 'Dropped', icon: '❌' },
];

const SORT_OPTIONS = [
    { value: 'addedAt-desc', label: 'Recently Added' },
    { value: 'addedAt-asc', label: 'Oldest Added' },
    { value: 'title-asc', label: 'A → Z' },
    { value: 'title-desc', label: 'Z → A' },
    { value: 'userRating-desc', label: 'My Rating ↓' },
    { value: 'rating-desc', label: 'Score ↓' },
    { value: 'updatedAt-desc', label: 'Last Updated' },
];

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function WatchlistPage({ onBack, onOpenDNA }: { onBack: () => void; onOpenDNA?: () => void }) {
    const { watchlist, removeFromWatchlist, updateWatchlistItem } = useAuth();

    const [activeStatus, setActiveStatus] = useState<'all' | WatchStatus>('all');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('addedAt-desc');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
    const [sortOpen, setSortOpen] = useState(false);

    // ── Stats ────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const completed = watchlist.filter(i => i.status === 'completed').length;
        const watching = watchlist.filter(i => i.status === 'watching').length;
        const planned = watchlist.filter(i => i.status === 'plan-to-watch').length;
        const rated = watchlist.filter(i => i.userRating);
        const avgRating = rated.length
            ? (rated.reduce((s, i) => s + (i.userRating || 0), 0) / rated.length).toFixed(1)
            : '—';
        const totalEps = watchlist.reduce((s, i) => s + (i.currentEpisode || 0), 0);
        const movies = watchlist.filter(i => i.type === 'movie').length;
        const anime = watchlist.filter(i => i.type === 'anime').length;
        return { total: watchlist.length, completed, watching, planned, avgRating, totalEps, movies, anime };
    }, [watchlist]);

    // ── Filter + Sort ────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = watchlist;
        if (activeStatus !== 'all') list = list.filter(i => i.status === activeStatus);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(i => i.title.toLowerCase().includes(q) || i.genres?.some(g => g.toLowerCase().includes(q)));
        }
        const [field, dir] = sort.split('-') as [keyof WatchlistItem | string, string];
        list = [...list].sort((a: any, b: any) => {
            const av = a[field] ?? 0;
            const bv = b[field] ?? 0;
            if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            return dir === 'asc' ? av - bv : bv - av;
        });
        return list;
    }, [watchlist, activeStatus, search, sort]);

    const tabCounts = useMemo(() => {
        const counts: Record<string, number> = { all: watchlist.length };
        STATUS_TABS.slice(1).forEach(t => { counts[t.value] = watchlist.filter(i => i.status === t.value).length; });
        return counts;
    }, [watchlist]);

    return (
        <div className="min-h-screen bg-[#080b14] text-white overflow-x-hidden">

            {/* ── Hero Gradient Banner ─────────────────────────────────────── */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-slate-900 to-cyan-900/20" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl" />

                <div className="relative max-w-6xl mx-auto px-4 pt-6 pb-8">
                    {/* Back */}
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    {/* Title */}
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400"
                            >
                                My Watchlist
                            </motion.h1>
                            <p className="text-gray-400 text-sm">{stats.total} titles tracked</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            {onOpenDNA && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onOpenDNA}
                                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-300 text-sm font-semibold hover:from-purple-500/30 hover:to-cyan-500/30 transition-all"
                                >
                                    <span>🧬</span>
                                    Taste DNA
                                </motion.button>
                            )}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-semibold"
                            >
                                <Zap size={14} className="text-purple-400" />
                                Powered by KINO
                            </motion.div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Completed', value: stats.completed, icon: <Trophy size={18} />, color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20', text: 'text-green-400' },
                            { label: 'Watching', value: stats.watching, icon: <Play size={18} />, color: 'from-cyan-500/20 to-blue-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
                            { label: 'Plan to Watch', value: stats.planned, icon: <BookOpen size={18} />, color: 'from-indigo-500/20 to-purple-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
                            { label: 'Avg Rating', value: stats.avgRating, icon: <Star size={18} />, color: 'from-yellow-500/20 to-orange-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
                        ].map((s, i) => (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-4 backdrop-blur-sm`}
                            >
                                <div className={`${s.text} mb-2`}>{s.icon}</div>
                                <div className="text-2xl font-black text-white">{s.value}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mini type breakdown */}
                    {stats.total > 0 && (
                        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Film size={12} className="text-purple-400" /> {stats.movies} Movies</span>
                            <span className="flex items-center gap-1"><Tv size={12} className="text-cyan-400" /> {stats.anime} Anime</span>
                            <span className="flex items-center gap-1"><TrendingUp size={12} className="text-pink-400" /> {stats.totalEps} Episodes watched</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Controls ─────────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">

                {/* Search + Sort + View */}
                <div className="flex gap-3 flex-wrap">
                    {/* Search */}
                    <div className="flex-1 min-w-48 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search titles, genres…"
                            className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <button
                            onClick={() => setSortOpen(o => !o)}
                            className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-gray-300 hover:border-white/20 transition-colors"
                        >
                            <Filter size={14} />
                            <span className="hidden sm:inline">{SORT_OPTIONS.find(s => s.value === sort)?.label}</span>
                            <ChevronDown size={14} />
                        </button>
                        <AnimatePresence>
                            {sortOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                >
                                    {SORT_OPTIONS.map(o => (
                                        <button
                                            key={o.value}
                                            onClick={() => { setSort(o.value); setSortOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 transition-colors ${sort === o.value ? 'text-purple-400 bg-purple-500/10' : 'text-gray-300'}`}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* View toggle */}
                    <div className="flex bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
                        {(['grid', 'list'] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setViewMode(v)}
                                className={`px-3 py-2.5 transition-colors ${viewMode === v ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {v === 'grid' ? <Grid3X3 size={16} /> : <List size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveStatus(tab.value)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${activeStatus === tab.value
                                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                                : 'bg-slate-800/50 border-white/5 text-gray-400 hover:border-white/15 hover:text-gray-300'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {tabCounts[tab.value] > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeStatus === tab.value ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-700 text-gray-500'
                                    }`}>
                                    {tabCounts[tab.value]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ───────────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 pb-20">
                {filtered.length === 0 ? (
                    <EmptyState status={activeStatus} />
                ) : viewMode === 'grid' ? (
                    <motion.div
                        layout
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                    >
                        <AnimatePresence>
                            {filtered.map(item => (
                                <WatchCard
                                    key={item.id}
                                    item={item}
                                    onEdit={() => setEditingItem(item)}
                                    onRemove={() => removeFromWatchlist(item.id)}
                                    onStatusChange={(s) => updateWatchlistItem(item.id, { status: s })}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {filtered.map(item => (
                                <WatchListRow
                                    key={item.id}
                                    item={item}
                                    onEdit={() => setEditingItem(item)}
                                    onRemove={() => removeFromWatchlist(item.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Edit Modal ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {editingItem && (
                    <EditModal
                        item={editingItem}
                        onClose={() => setEditingItem(null)}
                        onSave={(updates) => {
                            updateWatchlistItem(editingItem.id, updates);
                            setEditingItem(null);
                        }}
                        onRemove={() => {
                            removeFromWatchlist(editingItem.id);
                            setEditingItem(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Grid Card ─────────────────────────────────────────────────────────────────
function WatchCard({
    item, onEdit, onRemove
}: {
    item: WatchlistItem;
    onEdit: () => void;
    onRemove: () => void;
    onStatusChange?: (s: WatchStatus) => void;
}) {
    const [hovered, setHovered] = useState(false);
    const statusColor = STATUS_COLORS[item.status];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            whileHover={{ y: -4 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative group rounded-2xl overflow-hidden bg-slate-900/60 border border-white/5 hover:border-white/15 transition-all cursor-pointer shadow-lg"
            onClick={onEdit}
        >
            {/* Poster */}
            <div className="aspect-[2/3] relative overflow-hidden bg-slate-800">
                {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900">
                        <span className="text-4xl">{item.type === 'anime' ? '⛩️' : item.type === 'movie' ? '🎬' : '📺'}</span>
                    </div>
                )}

                {/* Status pill */}
                <div
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: statusColor + 'dd' }}
                >
                    {item.status === 'watching' ? '▶' : item.status === 'completed' ? '✓' : item.status === 'dropped' ? '✕' : item.status === 'on-hold' ? '⏸' : '📋'}
                </div>

                {/* User rating */}
                {item.userRating && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/70 text-yellow-400 text-[10px] font-bold">
                        <Star size={9} fill="currentColor" /> {item.userRating}
                    </div>
                )}

                {/* Hover overlay */}
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/80 text-white text-xs font-semibold hover:bg-purple-500 transition-colors"
                            >
                                <Edit3 size={12} /> Edit
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/60 text-white text-xs font-semibold hover:bg-red-500/80 transition-colors"
                            >
                                <Trash2 size={12} /> Remove
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Info */}
            <div className="p-2.5">
                <p className="text-xs font-semibold text-white leading-tight line-clamp-2 mb-1">{item.title}</p>

                {/* Episode progress */}
                {item.type !== 'movie' && item.currentEpisode && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-gray-500">
                            <span>Ep {item.currentEpisode}{item.totalEpisodes ? `/${item.totalEpisodes}` : ''}</span>
                            {item.totalEpisodes && (
                                <span>{Math.round((item.currentEpisode / item.totalEpisodes) * 100)}%</span>
                            )}
                        </div>
                        {item.totalEpisodes && (
                            <div className="h-0.5 bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.currentEpisode / item.totalEpisodes) * 100}%` }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: statusColor }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── List Row ──────────────────────────────────────────────────────────────────
function WatchListRow({
    item, onEdit, onRemove
}: {
    item: WatchlistItem;
    onEdit: () => void;
    onRemove: () => void;
    onStatusChange?: (s: WatchStatus) => void;
}) {
    const statusColor = STATUS_COLORS[item.status];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/15 transition-all group"
        >
            {/* Thumbnail */}
            <div className="w-12 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-slate-800">
                {item.image
                    ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">{item.type === 'anime' ? '⛩️' : '🎬'}</div>
                }
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-white truncate">{item.title}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white flex-shrink-0" style={{ backgroundColor: statusColor + 'bb' }}>
                        {STATUS_LABELS[item.status].split(' ').slice(1).join(' ')}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    {item.year && <span>{item.year}</span>}
                    {item.type && <span className="capitalize">{item.type}</span>}
                    {item.currentEpisode && item.type !== 'movie' && (
                        <span>Ep {item.currentEpisode}{item.totalEpisodes ? `/${item.totalEpisodes}` : ''}</span>
                    )}
                    {item.genres?.[0] && <span>{item.genres[0]}</span>}
                </div>

                {/* Progress bar for series */}
                {item.type !== 'movie' && item.currentEpisode && item.totalEpisodes && (
                    <div className="mt-1.5 h-0.5 w-32 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${(item.currentEpisode / item.totalEpisodes) * 100}%`,
                                backgroundColor: statusColor,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Rating */}
            {item.userRating && (
                <div className="hidden sm:flex items-center gap-1 text-yellow-400 text-sm font-bold">
                    <Star size={12} fill="currentColor" /> {item.userRating}
                </div>
            )}

            {/* Notes indicator */}
            {item.notes && (
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-purple-400" title="Has notes" />
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="p-1.5 rounded-lg hover:bg-purple-500/20 text-gray-400 hover:text-purple-300 transition-colors"
                >
                    <Edit3 size={14} />
                </button>
                <button
                    onClick={onRemove}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </motion.div>
    );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({
    item, onClose, onSave, onRemove
}: {
    item: WatchlistItem;
    onClose: () => void;
    onSave: (u: Partial<WatchlistItem>) => void;
    onRemove: () => void;
}) {
    const [status, setStatus] = useState<WatchStatus>(item.status);
    const [userRating, setUserRating] = useState(item.userRating || 0);
    const [notes, setNotes] = useState(item.notes || '');
    const [currentEpisode, setCurrentEpisode] = useState(item.currentEpisode || 0);
    const [hoverRating, setHoverRating] = useState(0);

    // AI State
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [similar, setSimilar] = useState<SimilarTitle[]>([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);

    // Fetch similar titles when rating is high (>= 7)
    useEffect(() => {
        if (userRating >= 7 && item.userRating !== userRating) {
            const fetchSimilar = async () => {
                setLoadingSimilar(true);
                const recs = await getSimilarAfterRating(item.title, userRating, item.genres || []);
                setSimilar(recs);
                setLoadingSimilar(false);
            };
            const timer = setTimeout(fetchSimilar, 500);
            return () => clearTimeout(timer);
        }
    }, [userRating, item.title, item.genres, item.userRating]);

    const handleSummarize = async () => {
        if (!item.title) return;
        setIsSummarizing(true);
        const text = await getShowSummary(item.title, item.genres || [], item.type || 'anime');

        setAiSummary(text);
        setIsSummarizing(false);
    };


    const handleSave = () => {
        onSave({ status, userRating: userRating || undefined, notes: notes.trim() || undefined, currentEpisode: currentEpisode || undefined });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 60, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Banner */}
                <div className="relative h-32 overflow-hidden">
                    {item.image ? (
                        <>
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-30 scale-110 blur-sm" />
                            <img src={item.image} alt="" className="absolute left-4 bottom-0 translate-y-1/2 w-16 h-24 object-cover rounded-xl border-2 border-slate-900 shadow-xl" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-slate-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-gray-400 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 pt-10 pb-5 space-y-5">
                    {/* Title */}
                    <div>
                        <h2 className="font-black text-lg text-white leading-tight">{item.title}</h2>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.type} {item.year ? `• ${item.year}` : ''}</p>
                    </div>

                    {/* Status Picker */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {(Object.entries(STATUS_LABELS) as [WatchStatus, string][]).map(([s, label]) => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border ${status === s
                                        ? 'border-opacity-100 text-white'
                                        : 'border-white/5 text-gray-500 hover:border-white/15 hover:text-gray-300 bg-slate-800/40'
                                        }`}
                                    style={status === s ? { backgroundColor: STATUS_COLORS[s] + '33', borderColor: STATUS_COLORS[s] + '88', color: 'white' } : {}}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Star Rating */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">My Rating</p>
                        <div className="flex gap-1">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                                <button
                                    key={n}
                                    onMouseEnter={() => setHoverRating(n)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setUserRating(userRating === n ? 0 : n)}
                                    className="transition-transform hover:scale-125"
                                >
                                    <Star
                                        size={20}
                                        className={`transition-colors ${n <= (hoverRating || userRating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`}
                                    />
                                </button>
                            ))}
                            {userRating > 0 && (
                                <span className="text-yellow-400 text-sm font-bold ml-1">{userRating}/10</span>
                            )}
                        </div>
                    </div>

                    {/* Episode Progress */}
                    {item.type !== 'movie' && (
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Episode Progress</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={item.totalEpisodes || 9999}
                                    value={currentEpisode || ''}
                                    onChange={e => setCurrentEpisode(parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-20 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                />
                                {item.totalEpisodes && (
                                    <span className="text-gray-500 text-sm">/ {item.totalEpisodes} eps</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Your thoughts…"
                            rows={3}
                        />
                    </div>

                    {/* AI Summary */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Sparkles size={10} /> AI Insight
                            </p>
                            {!aiSummary && !isSummarizing && (
                                <button onClick={handleSummarize} className="text-[10px] text-gray-400 hover:text-white underline decoration-dotted">
                                    Generate Summary
                                </button>
                            )}
                        </div>
                        {isSummarizing ? (
                            <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse">
                                <RefreshCw size={10} className="animate-spin" /> Analyzing story...
                            </div>
                        ) : aiSummary ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <p className="text-xs text-gray-300 leading-relaxed italic">"{aiSummary}"</p>
                            </motion.div>
                        ) : (
                            <button onClick={handleSummarize} className="w-full py-2 rounded-xl border border-dashed border-white/10 text-xs text-gray-500 hover:text-purple-300 hover:border-purple-500/30 transition-colors flex items-center justify-center gap-2">
                                <Sparkles size={12} /> Click to generate AI summary
                            </button>
                        )}
                    </div>

                    {/* Similar Titles (AI) */}
                    {(loadingSimilar || similar.length > 0) && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                            <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                <ThumbsUp size={10} /> Because you rated it {userRating}/10
                            </p>
                            {loadingSimilar ? (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {[1, 2, 3].map(i => <div key={i} className="w-24 h-32 flex-shrink-0 bg-slate-800/50 rounded-lg animate-pulse" />)}
                                </div>
                            ) : (
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {similar.map((s, i) => (
                                        <div key={i} className="w-24 flex-shrink-0 relative group cursor-help" title={s.similarity}>
                                            <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden mb-1 relative">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-[9px] text-gray-300 leading-tight line-clamp-3">{s.similarity}</p>
                                                </div>
                                                <div className="w-full h-full flex items-center justify-center text-xl bg-slate-800 text-gray-600">
                                                    {s.type === 'movie' ? '🎬' : '📺'}
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-medium text-gray-300 truncate">{s.title}</p>
                                        </div>
                                    ))}

                                </div>
                            )}
                        </motion.div>
                    )}


                    {/* Links */}
                    <div className="flex gap-2">
                        {item.externalIds?.anilistId && (
                            <a
                                href={`https://anilist.co/anime/${item.externalIds.anilistId}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs hover:bg-blue-500/25 transition-colors"
                            >
                                <ExternalLink size={10} /> AniList
                            </a>
                        )}
                        {item.externalIds?.tmdbId && (
                            <a
                                href={`https://www.themoviedb.org/${item.type === 'movie' ? 'movie' : 'tv'}/${item.externalIds.tmdbId}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/25 text-teal-300 text-xs hover:bg-teal-500/25 transition-colors"
                            >
                                <ExternalLink size={10} /> TMDB
                            </a>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleSave}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors"
                        >
                            <Check size={15} /> Save
                        </button>
                        <button
                            onClick={onRemove}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 font-semibold text-sm transition-colors"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ status }: { status: string }) {
    const messages: Record<string, { icon: string; title: string; sub: string }> = {
        all: { icon: '🎬', title: 'Your watchlist is empty', sub: 'Use CineDetective to identify anime & movies, then add them with one tap!' },
        'watching': { icon: '▶️', title: 'Nothing currently watching', sub: 'Add something you\'re currently into' },
        'plan-to-watch': { icon: '📋', title: 'No plans yet!', sub: 'Add titles you want to watch later' },
        'completed': { icon: '🏆', title: 'No completed titles', sub: 'Finish something and mark it done!' },
        'on-hold': { icon: '⏸️', title: 'Nothing on hold', sub: 'Titles you\'ve paused will appear here' },
        'dropped': { icon: '❌', title: 'Nothing dropped', sub: 'Titles you\'ve given up on appear here' },
    };
    const m = messages[status] || messages.all;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
        >
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl mb-6"
            >
                {m.icon}
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">{m.title}</h3>
            <p className="text-gray-500 text-sm max-w-xs">{m.sub}</p>
        </motion.div>
    );
}
