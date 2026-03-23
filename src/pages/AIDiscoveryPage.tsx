import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Search, Sun, Zap, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { topGenres as calcTopGenres } from '../utils/tasteDNA';
import {
    getAIRecommendations,
    nlSearch,
    getMoodPicks,
    getDailyPick,
    type AIRecommendation,
    type NLSearchResult,
    type MoodPick,
    type DailyPickResult,
} from '../services/gemini';

// ─── Moods ────────────────────────────────────────────────────────────────────
const MOODS = [
    { id: 'hyped', label: '⚡ Hyped', desc: 'energetic, action-packed, adrenaline rush', color: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/40' },
    { id: 'emotional', label: '😢 Emotional', desc: 'heart-warming, tearjerker, deeply moving stories', color: 'from-blue-500/20 to-purple-500/20', border: 'border-blue-500/40' },
    { id: 'cozy', label: '🍵 Cozy', desc: 'relaxing, slice of life, warm and comfortable', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/40' },
    { id: 'mindfuck', label: '🤯 Mind-Bender', desc: 'psychological thriller, plot twists, complex narratives', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/40' },
    { id: 'romantic', label: '💕 Romantic', desc: 'love stories, romance, relationship drama', color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/40' },
    { id: 'dark', label: '🌑 Dark & Gritty', desc: 'dark themes, mature content, morally complex characters', color: 'from-gray-700/40 to-slate-800/40', border: 'border-gray-500/40' },
    { id: 'funny', label: '😂 Comedy', desc: 'hilarious, light-hearted, feel-good humor', color: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/40' },
    { id: 'fantasy', label: '🧙 Fantasy', desc: 'epic worlds, magic, mythical creatures, adventure', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/40' },
];

// ─── Shared card component ────────────────────────────────────────────────────
function ResultCard({ title, type, emoji, tag, body, delay = 0, badge }: {
    title: string; type: string; emoji: string; tag: string; body: string;
    delay?: number; badge?: { text: string; color: string };
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 200, damping: 22 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm p-5 overflow-hidden"
        >
            {/* glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start gap-3 relative z-10">
                <span className="text-3xl flex-shrink-0 mt-0.5">{emoji}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-white text-[15px] leading-tight">{title}</h3>
                        {badge && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.text}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] text-gray-400 uppercase tracking-wider">{type}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        <span className="text-[11px] text-purple-400">{tag}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{body}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="rounded-2xl border border-white/5 bg-slate-800/60 h-28"
                />
            ))}
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon, msg }: { icon: string; msg: string }) {
    return (
        <div className="text-center py-16">
            <div className="text-5xl mb-4">{icon}</div>
            <p className="text-gray-400 text-sm">{msg}</p>
        </div>
    );
}

// ─── Tab: For You ─────────────────────────────────────────────────────────────
function ForYouTab({ watchlist }: { watchlist: any[] }) {
    const [recs, setRecs] = useState<AIRecommendation[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [filter, setFilter] = useState<'all' | 'anime' | 'movie' | 'tv'>('all');

    const topG = useMemo(() => calcTopGenres(watchlist, 8).map(g => g.genre), [watchlist]);
    const completed = useMemo(() => watchlist.filter(i => i.status === 'completed').map(i => i.title), [watchlist]);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getAIRecommendations(topG, completed, filter === 'all' ? undefined : filter);
        setRecs(data);
        setLoading(false);
        setLoaded(true);
    }, [topG, completed, filter]);

    const filtered = filter === 'all' ? recs : recs.filter(r => r.type === filter);

    return (
        <div>
            {!loaded ? (
                <div className="text-center py-16 space-y-6">
                    <div className="text-6xl">🎯</div>
                    <div>
                        <h3 className="font-bold text-white text-xl mb-2">Personalized Just for You</h3>
                        <p className="text-gray-400 text-sm mb-6">AI analyses your Taste DNA and finds your perfect matches</p>
                    </div>
                    <div className="flex gap-2 justify-center flex-wrap">
                        {(['all', 'anime', 'movie', 'tv'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-purple-600 text-white' : 'bg-slate-700/60 text-gray-400 hover:text-white'}`}>
                                {f === 'all' ? 'Any Type' : f === 'anime' ? '⛩ Anime' : f === 'movie' ? '🎬 Movies' : '📺 Shows'}
                            </button>
                        ))}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={load}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm shadow-lg shadow-purple-500/20"
                    >
                        <Sparkles size={16} /> Generate My Recommendations
                    </motion.button>
                </div>
            ) : loading ? (
                <LoadingSkeleton count={6} />
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2 flex-wrap">
                            {(['all', 'anime', 'movie', 'tv'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-purple-600 text-white' : 'bg-slate-700/60 text-gray-400 hover:text-white'}`}>
                                    {f === 'all' ? 'All' : f === 'anime' ? '⛩ Anime' : f === 'movie' ? '🎬 Movies' : '📺 Shows'}
                                </button>
                            ))}
                        </div>
                        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                            <RefreshCw size={12} /> Refresh
                        </button>
                    </div>
                    <div className="space-y-3">
                        {filtered.map((r, i) => (
                            <ResultCard key={i} title={r.title} type={r.type}
                                emoji={r.emoji} tag={r.genres.slice(0, 2).join(' · ')}
                                body={r.pitch}
                                delay={i * 0.06}
                                badge={{ text: `${Math.round(r.matchScore * 100)}% match`, color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' }}
                            />
                        ))}
                        {filtered.length === 0 && <EmptyState icon="🎯" msg="No results for this filter. Try All Types." />}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab: AI Search ───────────────────────────────────────────────────────────
function AISearchTab() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<NLSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const search = useCallback(async () => {
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        const data = await nlSearch(query.trim());
        setResults(data);
        setLoading(false);
    }, [query]);

    const EXAMPLES = [
        '🌑 dark psychological thriller like Parasite',
        '💕 romantic K-drama with enemies to lovers',
        '⛩ action anime with great power system',
        '🌍 mind-bending sci-fi movie like Inception',
        '😢 emotional tearjerker that destroys you',
        '🎭 crime documentary series like Making a Murderer',
        '🥋 martial arts Chinese drama (wuxia)',
        '🍵 cozy slice of life with amazing food',
    ];

    const typeLabel = (t: string) => {
        const map: Record<string, string> = {
            anime: '⛩ Anime', movie: '🎬 Movie', tv: '📺 TV Show',
            kdrama: '🇰🇷 K-Drama', cdrama: '🇨🇳 C-Drama',
            documentary: '🎥 Documentary', reality: '🎪 Reality',
        };
        return map[t] ?? t.toUpperCase();
    };

    return (
        <div>
            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    placeholder="Describe what you want to watch..."
                    className="w-full bg-slate-800/80 border border-white/10 rounded-2xl pl-11 pr-32 py-3.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                />
                <button onClick={search}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors">
                    Search
                </button>
            </div>

            {!searched && (
                <div>
                    <p className="text-gray-500 text-xs mb-3 font-medium uppercase tracking-wider">Example searches</p>
                    <div className="flex flex-wrap gap-2">
                        {EXAMPLES.map(ex => (
                            <button key={ex} onClick={() => { setQuery(ex); }}
                                className="text-xs px-3 py-1.5 rounded-full bg-slate-700/60 border border-white/5 text-gray-300 hover:text-white hover:border-purple-500/40 transition-all">
                                {ex}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {loading && <div className="mt-6"><LoadingSkeleton count={4} /></div>}

            {!loading && searched && results.length === 0 && (
                <EmptyState icon="🔍" msg="No results found. Try rephrasing your search." />
            )}

            {!loading && results.length > 0 && (
                <div className="space-y-3 mt-4">
                    {results.map((r, i) => (
                        <ResultCard key={i} title={r.title} type={typeLabel(r.type)}
                            emoji={r.emoji}
                            tag={`${r.year ?? ''} · ${r.genres.slice(0, 2).join(', ')}`}
                            body={r.why}
                            delay={i * 0.06}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Tab: Mood Engine ─────────────────────────────────────────────────────────
function MoodTab({ watchlist }: { watchlist: any[] }) {
    const [selectedMood, setSelectedMood] = useState<typeof MOODS[0] | null>(null);
    const [picks, setPicks] = useState<MoodPick[]>([]);
    const [loading, setLoading] = useState(false);

    const planToWatch = useMemo(() => watchlist.filter(i => i.status === 'plan-to-watch').map(i => i.title), [watchlist]);

    const pickMood = useCallback(async (mood: typeof MOODS[0]) => {
        setSelectedMood(mood);
        setLoading(true);
        const data = await getMoodPicks(mood.label, mood.desc, planToWatch);
        setPicks(data);
        setLoading(false);
    }, [planToWatch]);

    return (
        <div>
            <p className="text-gray-400 text-sm mb-4">What's your vibe right now?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                {MOODS.map(m => (
                    <motion.button key={m.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => pickMood(m)}
                        className={`p-3 rounded-2xl border text-center text-sm font-semibold transition-all bg-gradient-to-br ${m.color} ${m.border} ${selectedMood?.id === m.id ? 'ring-2 ring-white/30' : 'hover:brightness-110'}`}>
                        {m.label}
                    </motion.button>
                ))}
            </div>

            {loading && <LoadingSkeleton count={4} />}

            {!loading && picks.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${selectedMood?.color} border ${selectedMood?.border}`}>
                            {selectedMood?.label} picks
                        </div>
                        {picks.some(p => p.fromWatchlist) && (
                            <span className="text-[11px] text-emerald-400">✓ includes from your watchlist</span>
                        )}
                    </div>
                    <div className="space-y-3">
                        {picks.map((p, i) => (
                            <ResultCard key={i} title={p.title} type={p.type}
                                emoji={p.emoji}
                                tag={p.genres.slice(0, 2).join(' · ')}
                                body={p.moodFit}
                                delay={i * 0.06}
                                badge={p.fromWatchlist ? { text: '📋 In your list', color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' } : undefined}
                            />
                        ))}
                    </div>
                </div>
            )}

            {!loading && !selectedMood && (
                <EmptyState icon="🎭" msg="Pick a mood above and get instant AI-curated picks" />
            )}
        </div>
    );
}

// ─── Tab: Daily Pick ─────────────────────────────────────────────────────────
function DailyPickTab({ watchlist }: { watchlist: any[] }) {
    const [pick, setPick] = useState<DailyPickResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const topG = useMemo(() => calcTopGenres(watchlist, 6).map(g => g.genre), [watchlist]);
    const planToWatch = useMemo(() => watchlist
        .filter(i => i.status === 'plan-to-watch')
        .map(i => ({ title: i.title, genres: i.genres ?? [], type: i.type ?? 'anime' })),
        [watchlist]);

    const load = useCallback(async () => {
        if (planToWatch.length === 0) return;
        setLoading(true);
        const data = await getDailyPick(planToWatch, topG);
        setPick(data);
        setLoading(false);
        setLoaded(true);
    }, [planToWatch, topG]);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (planToWatch.length === 0) {
        return <EmptyState icon="📋" msg="Add some titles to your Plan to Watch list first!" />;
    }

    return (
        <div>
            <div className="text-center mb-6">
                <p className="text-gray-400 text-sm">{today}</p>
                <h3 className="text-white font-bold text-lg">Your AI-Chosen Pick for Today</h3>
            </div>

            {!loaded && !loading && (
                <div className="text-center py-10">
                    <div className="text-6xl mb-4">☀️</div>
                    <p className="text-gray-400 text-sm mb-6">AI picks the ONE title from your watchlist that's perfect for today</p>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={load}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20">
                        <Sun size={16} /> Reveal Today's Pick
                    </motion.button>
                </div>
            )}

            {loading && <LoadingSkeleton count={1} />}

            {!loading && pick && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-orange-500/10 backdrop-blur-sm p-8 text-center overflow-hidden"
                >
                    {/* shimmer bg */}
                    <div className="absolute inset-0 overflow-hidden rounded-3xl">
                        <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="text-7xl mb-4">{pick.emoji}</div>
                        <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3 uppercase tracking-wider">
                            Today's AI Pick
                        </div>
                        <h2 className="text-2xl font-black text-white mb-1">{pick.title}</h2>
                        <p className="text-gray-400 text-sm mb-4 capitalize">{pick.type} · {pick.timeCommitment}</p>
                        <p className="text-gray-200 text-sm leading-relaxed mb-4">{pick.pitch}</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                            <Sun size={14} /> {pick.whyToday}
                        </div>
                    </div>

                    <button onClick={load} className="mt-6 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5 mx-auto">
                        <RefreshCw size={11} /> Pick another
                    </button>
                </motion.div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'foryou', label: '🎯 For You', icon: Sparkles },
    { id: 'search', label: '🔍 AI Search', icon: Search },
    { id: 'mood', label: '🎭 Mood', icon: Zap },
    { id: 'daily', label: '☀️ Daily Pick', icon: Sun },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AIDiscoveryPage({ onBack }: { onBack: () => void }) {
    const { watchlist } = useAuth();
    const [activeTab, setActiveTab] = useState<TabId>('foryou');

    return (
        <div className="min-h-screen bg-[#060810] text-white overflow-x-hidden relative">

            {/* ── Animated background ───────────────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600 rounded-full blur-[120px]" />
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600 rounded-full blur-[120px]" />
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.08, 0.04] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600 rounded-full blur-[140px]" />
            </div>

            <div className="relative max-w-2xl mx-auto px-4 pt-6 pb-16">

                {/* ── Header ───────────────────────────────────────────────── */}
                <motion.button onClick={onBack} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back</span>
                </motion.button>

                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <div className="relative inline-block mb-4">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-xl"
                        />
                        <div className="relative text-5xl p-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30">🤖</div>
                    </div>
                    <h1 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                        AI Discovery
                    </h1>
                    <p className="text-gray-400 text-sm">Powered by Gemini · Personalised for you</p>
                </motion.div>

                {/* ── Tab bar ──────────────────────────────────────────────── */}
                <div className="flex gap-1 p-1 rounded-2xl bg-slate-800/60 border border-white/5 backdrop-blur-sm mb-8">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-purple-600/80 to-cyan-600/80 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-200'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab content ──────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'foryou' && <ForYouTab watchlist={watchlist} />}
                        {activeTab === 'search' && <AISearchTab />}
                        {activeTab === 'mood' && <MoodTab watchlist={watchlist} />}
                        {activeTab === 'daily' && <DailyPickTab watchlist={watchlist} />}
                    </motion.div>
                </AnimatePresence>

            </div>
        </div>
    );
}
