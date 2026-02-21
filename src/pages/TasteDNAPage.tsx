import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Dna, Zap, Star, Trophy, TrendingUp, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    radarScores, topGenres, typeBreakdown,
    tasteTags, dnaStats,
} from '../utils/tasteDNA';
import { getTastePersonality } from '../services/gemini';



// ─── Animated count-up hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 1.4) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (target === 0) return;
        let start: number | null = null;
        const step = (ts: number) => {
            if (!start) start = ts;
            const prog = Math.min((ts - start) / (duration * 1000), 1);
            setVal(Math.round(prog * target));
            if (prog < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration]);
    return val;
}

// ─── SVG Radar Chart ─────────────────────────────────────────────────────────
function RadarChart({ scores }: { scores: { genre: string; score: number }[] }) {
    const cx = 160, cy = 160, r = 120;
    const n = scores.length;
    const [hovered, setHovered] = useState<number | null>(null);

    // convert score (0-100) + axis angle to (x,y)
    const point = (score: number, i: number) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const dist = (score / 100) * r;
        return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
    };

    // axis end points (full length)
    const axisEnd = (i: number) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    };

    // label point (slightly outside)
    const labelPt = (i: number) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        return { x: cx + (r + 26) * Math.cos(angle), y: cy + (r + 26) * Math.sin(angle) };
    };

    // Build polygon points string
    const polyPoints = scores.map((s, i) => {
        const p = point(s.score, i);
        return `${p.x},${p.y}`;
    }).join(' ');

    // concentric rings
    const rings = [25, 50, 75, 100];

    return (
        <div className="relative w-full max-w-xs mx-auto select-none">
            <svg viewBox="0 0 320 320" className="w-full">
                <defs>
                    <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
                    </radialGradient>
                    <filter id="radarGlow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Concentric rings */}
                {rings.map(pct => {
                    const ringPts = scores.map((_, i) => {
                        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
                        const dist = (pct / 100) * r;
                        return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
                    }).join(' ');
                    return (
                        <polygon
                            key={pct}
                            points={ringPts}
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Axis lines */}
                {scores.map((_, i) => {
                    const end = axisEnd(i);
                    return (
                        <motion.line
                            key={i}
                            x1={cx} y1={cy}
                            x2={end.x} y2={end.y}
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="1"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                        />
                    );
                })}

                {/* Filled radar polygon */}
                <motion.polygon
                    points={polyPoints}
                    fill="url(#radarFill)"
                    stroke="rgba(168,85,247,0.7)"
                    strokeWidth="1.5"
                    filter="url(#radarGlow)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, type: 'spring', stiffness: 80 }}
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                />

                {/* Data points */}
                {scores.map((s, i) => {
                    const p = point(s.score, i);
                    return (
                        <motion.circle
                            key={i}
                            cx={p.x} cy={p.y} r={hovered === i ? 5 : 3}
                            fill={hovered === i ? '#fff' : '#a855f7'}
                            stroke={hovered === i ? '#a855f7' : 'rgba(168,85,247,0.5)'}
                            strokeWidth="1.5"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6 + i * 0.04, type: 'spring' }}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            className="cursor-pointer"
                        />
                    );
                })}

                {/* Axis Labels */}
                {scores.map((s, i) => {
                    const lp = labelPt(i);
                    return (
                        <motion.text
                            key={i}
                            x={lp.x} y={lp.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={hovered === i ? 9.5 : 8.5}
                            fill={hovered === i ? '#a855f7' : '#94a3b8'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 + i * 0.04 }}
                            className="cursor-pointer select-none"
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {s.genre}
                        </motion.text>
                    );
                })}

                {/* Center dot */}
                <circle cx={cx} cy={cy} r={3} fill="rgba(168,85,247,0.6)" />

                {/* Hover tooltip */}
                {hovered !== null && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <rect
                            x={point(scores[hovered].score, hovered).x - 28}
                            y={point(scores[hovered].score, hovered).y - 24}
                            width="56" height="18" rx="5"
                            fill="rgba(15,23,42,0.9)"
                            stroke="rgba(168,85,247,0.4)"
                            strokeWidth="1"
                        />
                        <text
                            x={point(scores[hovered].score, hovered).x}
                            y={point(scores[hovered].score, hovered).y - 15}
                            textAnchor="middle" fontSize="9" fill="#e2e8f0"
                        >
                            {scores[hovered].score}%
                        </text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; count: number; pct: number; color: string; emoji: string }[] }) {
    const cx = 90, cy = 90, r = 68, strokeW = 22;
    const circ = 2 * Math.PI * r;
    const [hov, setHov] = useState<number | null>(null);

    let cumulative = 0;
    const segments = data.map(d => {
        const len = d.pct * circ;
        const offset = cumulative;
        cumulative += len;
        return { ...d, len, offset };
    });

    return (
        <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0" style={{ width: 180, height: 180 }}>
                <svg width={180} height={180}>
                    <defs>
                        {data.map((_, i) => (
                            <filter key={i} id={`donutGlow${i}`}>
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        ))}
                    </defs>

                    {/* Background ring */}
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} />

                    {/* Segments */}
                    {segments.map((s, i) => (
                        <motion.circle
                            key={i}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={hov === i ? strokeW + 4 : strokeW}
                            strokeLinecap="round"
                            strokeDasharray={circ}
                            strokeDashoffset={circ - s.len}
                            style={{
                                transformOrigin: `${cx}px ${cy}px`,
                                transform: `rotate(${(s.offset / circ) * 360 - 90}deg)`,
                                opacity: hov !== null && hov !== i ? 0.4 : 1,
                                filter: hov === i ? `drop-shadow(0 0 8px ${s.color})` : 'none',
                            }}
                            initial={{ strokeDashoffset: circ }}
                            animate={{ strokeDashoffset: circ - s.len }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.2, ease: 'easeOut' }}
                            onMouseEnter={() => setHov(i)}
                            onMouseLeave={() => setHov(null)}
                            className="cursor-pointer"
                        />
                    ))}

                    {/* Center label */}
                    <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fill="white" fontWeight="800">
                        {hov !== null ? data[hov].count : data.reduce((s, d) => s + d.count, 0)}
                    </text>
                    <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#64748b">
                        {hov !== null ? data[hov].label : 'TOTAL'}
                    </text>
                </svg>
            </div>

            {/* Legend */}
            <div className="space-y-3">
                {data.map((d, i) => (
                    <motion.div
                        key={d.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.15 }}
                        onMouseEnter={() => setHov(i)}
                        onMouseLeave={() => setHov(null)}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <span className="text-base">{d.emoji}</span>
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                <span className="text-xs text-white font-semibold">{d.label}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                                {d.count} · {Math.round(d.pct * 100)}%
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
const BAR_COLORS = [
    '#a855f7', '#ec4899', '#22d3ee', '#f59e0b',
    '#4ade80', '#f97316', '#818cf8', '#38bdf8',
];

function BarChart({ data }: { data: { genre: string; count: number; pct: number }[] }) {
    return (
        <div className="space-y-2.5">
            {data.map((d, i) => (
                <motion.div
                    key={d.genre}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 200 }}
                    className="flex items-center gap-3"
                >
                    <span className="text-[10px] text-gray-400 w-24 flex-shrink-0 text-right">{d.genre}</span>
                    <div className="flex-1 h-2.5 bg-slate-800/60 rounded-full overflow-hidden relative">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${d.pct * 100}%` }}
                            transition={{ duration: 0.9, delay: 0.2 + i * 0.07, ease: 'easeOut' }}
                        />
                        {/* shimmer */}
                        <motion.div
                            className="absolute top-0 right-0 h-full w-6 bg-gradient-to-r from-transparent to-white/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.8, 0] }}
                            transition={{ duration: 0.5, delay: 1 + i * 0.07 }}
                        />
                    </div>
                    <span className="text-[10px] text-gray-500 w-4 flex-shrink-0">{d.count}</span>
                </motion.div>
            ))}
        </div>
    );
}

// ─── Taste Tag Pill ───────────────────────────────────────────────────────────
function TagPill({ label, color, desc, delay }: { label: string; color: string; desc: string; delay: number }) {
    const [hov, setHov] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 250, damping: 20 }}
            onHoverStart={() => setHov(true)}
            onHoverEnd={() => setHov(false)}
            className="relative cursor-default"
        >
            <motion.div
                animate={hov ? { scale: 1.06, y: -2 } : { scale: 1, y: 0 }}
                className="px-3 py-1.5 rounded-full border font-semibold text-xs whitespace-nowrap"
                style={{
                    backgroundColor: color + '18',
                    borderColor: color + '44',
                    color,
                    boxShadow: hov ? `0 0 12px ${color}44` : 'none',
                }}
            >
                {label}
            </motion.div>
            <AnimatePresence>
                {hov && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[160px] bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-gray-300 shadow-2xl z-50 text-center whitespace-normal"
                    >
                        {desc}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay }: {
    icon: React.ReactNode; label: string; value: number | string; color: string; delay: number;
}) {
    const num = typeof value === 'number' ? value : null;
    const counted = useCountUp(num ?? 0);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 200 }}
            className="rounded-2xl p-4 border border-white/8 backdrop-blur-sm"
            style={{ background: `linear-gradient(135deg, ${color}18 0%, transparent 100%)`, borderColor: color + '28' }}
        >
            <div className="mb-2" style={{ color }}>{icon}</div>
            <div className="text-2xl font-black text-white">
                {num !== null ? counted : value}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
        </motion.div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyDNA() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center px-8"
        >
            <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl mb-6"
            >
                🧬
            </motion.div>
            <h2 className="text-2xl font-black text-white mb-3">Not enough data</h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Add at least <span className="text-purple-400 font-semibold">5 titles</span> to your watchlist to generate your Taste DNA profile.
            </p>
        </motion.div>
    );
}

// ─── Floating Orbs ────────────────────────────────────────────────────────────
function FloatingOrb({ size, color, x, y, delay }: { size: number; color: string; x: string; y: string; delay: number }) {
    return (
        <motion.div
            className="absolute rounded-full blur-3xl pointer-events-none"
            style={{ width: size, height: size, backgroundColor: color, left: x, top: y, opacity: 0.12 }}
            animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 7 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
        />
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TasteDNAPage({ onBack }: { onBack: () => void }) {
    const { watchlist } = useAuth();

    const radar = useMemo(() => radarScores(watchlist), [watchlist]);
    const bars = useMemo(() => topGenres(watchlist, 8), [watchlist]);
    const donut = useMemo(() => typeBreakdown(watchlist), [watchlist]);
    const tags = useMemo(() => tasteTags(watchlist), [watchlist]);
    const stats = useMemo(() => dnaStats(watchlist), [watchlist]);

    const [personality, setPersonality] = useState<string | null>(null);
    const [loadingPersona, setLoadingPersona] = useState(false);

    const handleRevealPersona = async () => {
        setLoadingPersona(true);
        const topG = topGenres(watchlist, 5).map(g => g.genre);
        const completed = watchlist.filter(i => i.status === 'completed').slice(0, 5).map(i => i.title);
        const text = await getTastePersonality(topG, completed);
        setPersonality(text);
        setLoadingPersona(false);
    };


    const hasData = watchlist.length >= 5;

    return (
        <div className="min-h-screen bg-[#060810] text-white overflow-x-hidden relative">

            {/* ── Animated Background ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <FloatingOrb size={400} color="#a855f7" x="-5%" y="-10%" delay={0} />
                <FloatingOrb size={300} color="#22d3ee" x="70%" y="60%" delay={2} />
                <FloatingOrb size={250} color="#ec4899" x="40%" y="20%" delay={4} />
                {/* Animated grid */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 pb-24">

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center"
                        >
                            <Dna size={20} className="text-purple-400" />
                        </motion.div>
                        <div>
                            <motion.h1
                                className="text-3xl font-black bg-clip-text text-transparent"
                                style={{
                                    backgroundImage: 'linear-gradient(to right, #a855f7, #ec4899, #22d3ee)',
                                }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                Taste DNA
                            </motion.h1>
                            <motion.p
                                className="text-xs text-gray-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                Your watching personality decoded
                            </motion.p>
                        </div>
                    </div>
                </motion.div>

                {!hasData ? <EmptyDNA /> : (
                    <div className="space-y-6">

                        {/* ── Taste Tags ── */}
                        {tags.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="rounded-3xl border border-white/8 bg-slate-900/40 backdrop-blur-sm p-5"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap size={14} className="text-yellow-400" />
                                    <h2 className="text-sm font-bold text-white">Your Personality Tags</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((t, i) => (
                                        <TagPill
                                            key={t.label}
                                            label={t.label}
                                            color={t.color}
                                            desc={t.desc}
                                            delay={0.2 + i * 0.07}
                                        />
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* ── Stats Row ── */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard icon={<Layers size={18} />} label="Titles Tracked" value={stats.total} color="#a855f7" delay={0.2} />
                            <StatCard icon={<Star size={18} />} label="Avg Rating" value={stats.avgRating} color="#fbbf24" delay={0.27} />
                            <StatCard icon={<Trophy size={18} />} label="Completion Rate" value={`${stats.completionRate}%`} color="#4ade80" delay={0.34} />
                            <StatCard icon={<TrendingUp size={18} />} label="Episodes" value={stats.totalEps} color="#22d3ee" delay={0.41} />
                        </div>

                        {/* ── Radar + Donut ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Radar */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="rounded-3xl border border-white/8 bg-slate-900/40 backdrop-blur-sm p-5"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-base">🕸️</span>
                                    <h2 className="text-sm font-bold text-white">Genre Radar</h2>
                                    <span className="ml-auto text-[10px] text-gray-600 italic">hover axes</span>
                                </div>
                                <RadarChart scores={radar} />
                            </motion.section>

                            {/* Donut */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="rounded-3xl border border-white/8 bg-slate-900/40 backdrop-blur-sm p-5"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-base">🍩</span>
                                    <h2 className="text-sm font-bold text-white">Content Mix</h2>
                                </div>
                                <DonutChart data={donut} />
                            </motion.section>
                        </div>

                        {/* ── Top Genres Bar Chart ── */}
                        {bars.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="rounded-3xl border border-white/8 bg-slate-900/40 backdrop-blur-sm p-5"
                            >
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="text-base">📊</span>
                                    <h2 className="text-sm font-bold text-white">Top Genres</h2>
                                    <span className="ml-auto text-[10px] text-gray-600">{stats.uniqueGenres} unique genres discovered</span>
                                </div>
                                <BarChart data={bars} />
                            </motion.section>
                        )}

                        {/* ── DNA Fingerprint card ── */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-slate-900/60 to-cyan-500/10 backdrop-blur-sm p-6 text-center relative overflow-hidden"
                        >
                            {/* animated lines */}
                            {Array.from({ length: 12 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute top-0 bottom-0 w-px"
                                    style={{ left: `${(i + 1) * (100 / 13)}%`, backgroundColor: `rgba(168,85,247,${0.03 + (i % 3) * 0.02})` }}
                                    animate={{ scaleY: [0.6, 1, 0.6], opacity: [0.3, 0.8, 0.3] }}
                                    transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
                                />
                            ))}
                            <div className="relative z-10">
                                <motion.div
                                    className="text-5xl mb-3"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    🧬
                                </motion.div>
                                <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
                                    Your taste profile is based on <span className="text-purple-300 font-semibold">{watchlist.length} titles</span> with <span className="text-cyan-300 font-semibold">{stats.uniqueGenres} genre preferences</span> detected. Keep watching to refine your DNA!
                                </p>
                            </div>
                        </motion.section>

                        {/* ── AI Persona Card ── */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-6 text-center"
                        >
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Zap size={18} className="text-yellow-400" />
                                <h2 className="text-lg font-bold text-white">AI Taste Persona</h2>
                            </div>

                            {!personality ? (
                                <button
                                    onClick={handleRevealPersona}
                                    disabled={loadingPersona}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto shadow-lg shadow-purple-500/20"
                                >
                                    {loadingPersona ? (
                                        <>✨ Analyzing your mind...</>
                                    ) : (
                                        <>🔮 Reveal My Persona</>
                                    )}
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6"
                                >
                                    <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">
                                        {personality.split('.')[0]}
                                    </p>
                                    <p className="text-gray-300 text-sm leading-relaxed italic">
                                        "{personality.split('.').slice(1).join('.').trim()}"
                                    </p>
                                </motion.div>
                            )}
                        </motion.section>


                    </div>
                )}
            </div>
        </div>
    );
}
