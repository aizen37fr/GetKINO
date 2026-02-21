import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ZoomIn, ZoomOut, Compass, RotateCcw, Plus, Star, Film, Tv, Info, Loader2, ChevronLeft } from 'lucide-react';
import { searchTMDB } from '../services/tmdb-extended';
import {
    buildSeedGraph,
    expandNode,
    type GraphNode,
    type GraphData,
    EDGE_COLORS,
    EDGE_LABELS,
} from '../services/rabbitHole';
import { useAuth } from '../context/AuthContext';

// ─── Mini force simulation (no D3 needed) ─────────────────────────────────────
function useForceLayout(graph: GraphData) {
    const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
    const frameRef = useRef<number | undefined>(undefined);
    const posRef = useRef<Record<string, { x: number; y: number; vx: number; vy: number }>>({});

    useEffect(() => {
        if (!graph.nodes.length) { setPositions({}); return; }

        // Initialize new nodes at center or near parent
        graph.nodes.forEach(node => {
            if (!posRef.current[node.id]) {
                posRef.current[node.id] = {
                    x: node.fx !== null && node.fx !== undefined ? node.fx : (Math.random() - 0.5) * 200,
                    y: node.fy !== null && node.fy !== undefined ? node.fy : (Math.random() - 0.5) * 200,
                    vx: 0,
                    vy: 0,
                };
            }
        });

        // Remove deleted nodes
        Object.keys(posRef.current).forEach(id => {
            if (!graph.nodes.find(n => n.id === id)) delete posRef.current[id];
        });

        const tick = () => {
            const cx = 0, cy = 0;
            const REPEL = 10000;
            const ATTRACT = 0.04;
            const CENTER_PULL = 0.005;
            const DAMPING = 0.85;
            const ids = graph.nodes.map(n => n.id);

            ids.forEach(id => {
                const p = posRef.current[id];
                if (!p) return;
                const node = graph.nodes.find(n => n.id === id)!;

                // Skip pinned nodes
                if (node.fx !== null && node.fx !== undefined) { p.x = node.fx; p.vx = 0; }
                if (node.fy !== null && node.fy !== undefined) { p.y = node.fy; p.vy = 0; }
                if (node.fx !== null && node.fx !== undefined && node.fy !== null && node.fy !== undefined) return;

                let fx = 0, fy = 0;

                // Repulsion between all nodes
                ids.forEach(oid => {
                    if (oid === id) return;
                    const op = posRef.current[oid];
                    if (!op) return;
                    const dx = p.x - op.x;
                    const dy = p.y - op.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = REPEL / (dist * dist);
                    fx += (dx / dist) * force;
                    fy += (dy / dist) * force;
                });

                // Attraction along edges
                graph.edges.forEach(e => {
                    const isSource = e.source === id;
                    const isTarget = e.target === id;
                    if (!isSource && !isTarget) return;
                    const otherId = isSource ? e.target : e.source;
                    const op = posRef.current[otherId];
                    if (!op) return;
                    const dx = op.x - p.x;
                    const dy = op.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const targetDist = 220;
                    const stretch = dist - targetDist;
                    fx += dx / dist * stretch * ATTRACT;
                    fy += dy / dist * stretch * ATTRACT;
                });

                // Center gravity
                fx += (cx - p.x) * CENTER_PULL;
                fy += (cy - p.y) * CENTER_PULL;

                p.vx = (p.vx + fx) * DAMPING;
                p.vy = (p.vy + fy) * DAMPING;
                p.x += p.vx;
                p.y += p.vy;
            });

            const snap: Record<string, { x: number; y: number }> = {};
            ids.forEach(id => {
                const p = posRef.current[id];
                if (p) snap[id] = { x: p.x, y: p.y };
            });
            setPositions({ ...snap });
            frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [graph]);

    return positions;
}

// ─── Hover Card ───────────────────────────────────────────────────────────────
function HoverCard({ node, onClose, onExpand, onAddWatchlist }: {
    node: GraphNode;
    onClose: () => void;
    onExpand: () => void;
    onAddWatchlist: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            className="absolute z-50 pointer-events-auto"
            style={{ bottom: '110%', left: '50%', transform: 'translateX(-50%)', width: 220 }}
        >
            <div className="bg-[#0d0d1a] border border-white/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 backdrop-blur-xl">
                {node.posterPath ? (
                    <img src={node.posterPath} alt={node.label} className="w-full h-28 object-cover" />
                ) : (
                    <div className="w-full h-28 bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                        <Film className="w-10 h-10 text-white/30" />
                    </div>
                )}
                <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-sm text-white leading-tight line-clamp-2">{node.label}</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-white shrink-0 mt-0.5">
                            <X size={12} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        {node.type === 'movie' ? <Film size={10} /> : <Tv size={10} />}
                        <span>{node.year}</span>
                        <span className="text-yellow-400 flex items-center gap-0.5">
                            <Star size={10} fill="currentColor" /> {node.rating.toFixed(1)}
                        </span>
                    </div>
                    {node.overview && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3">{node.overview}</p>
                    )}
                    <div className="flex gap-2">
                        {!node.isExpanded && (
                            <button
                                onClick={onExpand}
                                className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1 transition-colors"
                            >
                                <Compass size={12} /> Explore
                            </button>
                        )}
                        <button
                            onClick={onAddWatchlist}
                            className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-1 transition-colors"
                        >
                            <Plus size={12} /> Save
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Graph Node Card ──────────────────────────────────────────────────────────
function NodeCard({ node, isHovered, onHover, onLeave, onClick }: {
    node: GraphNode;
    isHovered: boolean;
    onHover: () => void;
    onLeave: () => void;
    onClick: () => void;
}) {
    const CARD_W = 80;
    const CARD_H = 110;

    const glowColor = node.isSeed
        ? 'rgba(168,85,247,0.6)'
        : node.isExpanded
            ? 'rgba(6,182,212,0.4)'
            : 'rgba(255,255,255,0.1)';

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
            style={{
                width: CARD_W,
                height: CARD_H,
                position: 'absolute',
                left: -CARD_W / 2,
                top: -CARD_H / 2,
                cursor: node.isExpanded ? 'default' : 'pointer',
                boxShadow: isHovered ? `0 0 28px 6px ${glowColor}` : `0 0 10px 2px ${glowColor}`,
            }}
            className={`rounded-xl overflow-visible border transition-all duration-300 ${node.isSeed
                ? 'border-purple-500 ring-2 ring-purple-400/40 scale-125'
                : isHovered
                    ? 'border-white/60 scale-110'
                    : 'border-white/15'
                }`}
        >
            <div className="w-full h-full rounded-xl overflow-hidden relative bg-[#111]">
                {node.posterPath ? (
                    <img src={node.posterPath} alt={node.label} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                        <Film className="w-6 h-6 text-white/30" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="text-[9px] font-bold text-white leading-tight text-center line-clamp-2">{node.label}</p>
                </div>
                {node.isSeed && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                )}
                {!node.isExpanded && !node.isSeed && (
                    <div className="absolute top-1 left-1 w-3 h-3 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Plus size={8} className="text-white/60" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
interface RabbitHolePageProps {
    onBack: () => void;
    seedTmdbId?: number;
    seedType?: 'movie' | 'tv';
}

export default function RabbitHolePage({ onBack, seedTmdbId, seedType }: RabbitHolePageProps) {
    const { addToWatchlist } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ w: 1200, h: 700 });

    const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [] });
    const [loading, setLoading] = useState(false);
    const [expandingId, setExpandingId] = useState<string | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Camera (pan + zoom)
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    // Search
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchTMDB>>>([]);
    const [searching, setSearching] = useState(false);
    const [searchDone, setSearchDone] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const searchBarRef = useRef<HTMLDivElement>(null);

    // Depth counter
    const maxDepth = graph.nodes.filter(n => n.isExpanded).length;

    // Measure container
    useEffect(() => {
        const measure = () => {
            if (containerRef.current) {
                setDimensions({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight });
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    // Auto-seed if provided
    useEffect(() => {
        if (seedTmdbId && seedType) seedGraph(seedTmdbId, seedType);
    }, []);

    // Force layout
    const positions = useForceLayout(graph);

    // ── Search ──────────────────────────────────────────────────────────────
    const onQueryChange = (val: string) => {
        setQuery(val);
        setSearchDone(false);
        clearTimeout(searchTimeout.current);
        if (!val.trim()) { setSearchResults([]); return; }
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            const res = await searchTMDB(val);
            setSearchResults(res);
            setSearchDone(true);
            setSearching(false);
        }, 400);
    };

    const onSearchSelect = (id: number, type: 'movie' | 'tv') => {
        seedGraph(id, type);
        setSearchDone(false);
    };

    // Dropdown position from ref
    const getDropdownStyle = () => {
        if (!searchBarRef.current) return {};
        const rect = searchBarRef.current.getBoundingClientRect();
        return {
            position: 'fixed' as const,
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
        };
    };

    const seedGraph = useCallback(async (tmdbId: number, type: 'movie' | 'tv') => {
        setLoading(true);
        setGraph({ nodes: [], edges: [] });
        setPan({ x: 0, y: 0 });
        setZoom(1);
        setSearchResults([]);
        setQuery('');
        try {
            const g = await buildSeedGraph(tmdbId, type);
            setGraph(g);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Expand Node ──────────────────────────────────────────────────────────
    const handleExpand = useCallback(async (nodeId: string) => {
        if (expandingId) return;
        setExpandingId(nodeId);
        setHoveredNode(null);
        try {
            const newGraph = await expandNode(nodeId, graph);
            setGraph(newGraph);
        } finally {
            setExpandingId(null);
        }
    }, [graph, expandingId]);

    // ── Add to watchlist ─────────────────────────────────────────────────────
    const handleAddWatchlist = useCallback((node: GraphNode) => {
        addToWatchlist({
            id: `${node.type === 'movie' ? 'm' : 's'}-${node.tmdbId}`,
            title: node.label,
            type: node.type === 'movie' ? 'movie' : 'tv',
            image: node.posterPath || undefined,
            year: node.year ? parseInt(node.year) : undefined,
            rating: node.rating,
            overview: node.overview,
            status: 'plan-to-watch',
        });
    }, [addToWatchlist]);

    // ── Camera drag ──────────────────────────────────────────────────────────
    const onMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.node-card')) return;
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging.current = false; };
    const onWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(z => Math.min(2.5, Math.max(0.3, z - e.deltaY * 0.001)));
    };

    // ── Viewport transform ───────────────────────────────────────────────────
    const cx = dimensions.w / 2 + pan.x;
    const cy = dimensions.h / 2 + pan.y;

    return (
        <div className="fixed inset-0 bg-[#05050f] text-white overflow-hidden flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="shrink-0 flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md z-30">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <Compass size={16} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none">Rabbit Hole</h1>
                        <p className="text-xs text-gray-400 leading-none mt-0.5">Pick a show & fall in</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-lg relative ml-4" ref={searchBarRef}>
                    <div className="flex items-center gap-3 bg-white/8 border border-white/12 rounded-2xl px-4 py-2.5">
                        {searching ? <Loader2 size={16} className="text-purple-400 animate-spin shrink-0" /> : <Search size={16} className="text-gray-400 shrink-0" />}
                        <input
                            value={query}
                            onChange={e => onQueryChange(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && searchResults.length > 0) {
                                    onSearchSelect(searchResults[0].id, searchResults[0].type);
                                }
                            }}
                            placeholder="Search any movie or show to start..."
                            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
                        />
                        {query && <button onClick={() => { setQuery(''); setSearchResults([]); setSearchDone(false); }} className="text-gray-500 hover:text-white"><X size={14} /></button>}
                    </div>

                    {/* Dropdown — rendered as fixed to escape overflow clipping */}
                    <AnimatePresence>
                        {query.trim() && (searchResults.length > 0 || searchDone) && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                style={getDropdownStyle()}
                                className="bg-[#0d0d1a] border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
                            >
                                {searchResults.length > 0 ? searchResults.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => onSearchSelect(r.id, r.type)}
                                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/8 transition-colors text-left"
                                    >
                                        {r.posterPath ? (
                                            <img src={`https://image.tmdb.org/t/p/w92${r.posterPath}`} alt={r.title} className="w-8 h-12 object-cover rounded-md shrink-0" />
                                        ) : (
                                            <div className="w-8 h-12 bg-white/10 rounded-md flex items-center justify-center shrink-0">
                                                <Film size={14} />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate">{r.title}</p>
                                            <p className="text-xs text-gray-400">{r.year} · {r.type === 'movie' ? 'Movie' : 'TV'} · ⭐ {r.rating.toFixed(1)}</p>
                                        </div>
                                        <Compass size={14} className="text-purple-400 shrink-0 ml-auto" />
                                    </button>
                                )) : (
                                    <div className="px-4 py-5 text-center text-sm text-gray-500">
                                        No results for "{query}" — try another title
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* HUD stats */}
                {graph.nodes.length > 0 && (
                    <div className="flex items-center gap-4 text-xs text-gray-400 ml-auto shrink-0">
                        <span className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-3 py-1.5 font-mono">
                            {graph.nodes.length} nodes
                        </span>
                        <span className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono">
                            Depth {maxDepth}
                        </span>
                        <button
                            title="Reset to seed"
                            onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Main Canvas ── */}
            <div
                ref={containerRef}
                className="flex-1 relative overflow-hidden"
                style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onWheel={onWheel}
            >
                {/* Background grid */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <defs>
                        <pattern id="rh-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#rh-grid)" />
                </svg>

                {/* Empty state */}
                {!loading && graph.nodes.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pointer-events-none select-none">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="w-32 h-32 rounded-full border border-purple-500/20 relative"
                        >
                            {[0, 60, 120, 180, 240, 300].map(deg => (
                                <div
                                    key={deg}
                                    className="absolute w-3 h-3 rounded-full bg-purple-500/40"
                                    style={{
                                        top: '50%', left: '50%',
                                        transform: `rotate(${deg}deg) translateX(58px) translateY(-50%)`,
                                    }}
                                />
                            ))}
                            <Compass className="absolute inset-0 m-auto w-10 h-10 text-purple-400/60" />
                        </motion.div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white/80 mb-2">Search above to begin</p>
                            <p className="text-sm text-gray-500">Find any movie or show, then click nodes to surf their connections</p>
                        </div>
                    </div>
                )}

                {/* Loading spinner */}
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 animate-spin text-purple-500" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-purple-300 text-sm animate-pulse font-medium">Building your rabbit hole...</p>
                    </div>
                )}

                {/* Graph layer */}
                {!loading && graph.nodes.length > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            transform: `translate(${cx}px, ${cy}px) scale(${zoom})`,
                            transformOrigin: '0 0',
                        }}
                    >
                        {/* SVG Edges */}
                        <svg
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
                        >
                            <defs>
                                {Object.entries(EDGE_COLORS).map(([reason, color]) => (
                                    <marker
                                        key={reason}
                                        id={`arrow-${reason}`}
                                        markerWidth="6" markerHeight="6"
                                        refX="5" refY="3"
                                        orient="auto"
                                    >
                                        <path d="M0,0 L0,6 L6,3 z" fill={color} opacity={0.7} />
                                    </marker>
                                ))}
                            </defs>
                            <AnimatePresence>
                                {graph.edges.map(edge => {
                                    const sp = positions[edge.source];
                                    const tp = positions[edge.target];
                                    if (!sp || !tp) return null;
                                    const color = EDGE_COLORS[edge.reason];
                                    // Draw a slightly curved line
                                    const mx = (sp.x + tp.x) / 2;
                                    const my = (sp.y + tp.y) / 2;
                                    const dx = tp.x - sp.x;
                                    const dy = tp.y - sp.y;
                                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                                    const curve = 30;
                                    const cx2 = mx - (dy / len) * curve;
                                    const cy2 = my + (dx / len) * curve;
                                    return (
                                        <motion.path
                                            key={edge.id}
                                            initial={{ opacity: 0, pathLength: 0 }}
                                            animate={{ opacity: 0.55, pathLength: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            d={`M ${sp.x} ${sp.y} Q ${cx2} ${cy2} ${tp.x} ${tp.y}`}
                                            stroke={color}
                                            strokeWidth={1.5}
                                            fill="none"
                                            strokeDasharray="none"
                                            markerEnd={`url(#arrow-${edge.reason})`}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </svg>

                        {/* Node Cards */}
                        <AnimatePresence>
                            {graph.nodes.map(node => {
                                const pos = positions[node.id];
                                if (!pos) return null;
                                const isHovered = hoveredNode === node.id;
                                const isExpanding = expandingId === node.id;
                                return (
                                    <div
                                        key={node.id}
                                        className="node-card"
                                        style={{
                                            position: 'absolute',
                                            left: pos.x,
                                            top: pos.y,
                                            transform: 'translate(0,0)',
                                        }}
                                    >
                                        {/* Expanding spinner */}
                                        {isExpanding && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                                                style={{ left: -40, top: -40, width: 160, height: 190 }}>
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                                            </div>
                                        )}

                                        <NodeCard
                                            node={node}
                                            isHovered={isHovered}
                                            onHover={() => setHoveredNode(node.id)}
                                            onLeave={() => setHoveredNode(null)}
                                            onClick={() => !node.isExpanded && handleExpand(node.id)}
                                        />

                                        {/* Hover Card popup */}
                                        <AnimatePresence>
                                            {isHovered && (
                                                <HoverCard
                                                    node={node}
                                                    onClose={() => setHoveredNode(null)}
                                                    onExpand={() => handleExpand(node.id)}
                                                    onAddWatchlist={() => handleAddWatchlist(node)}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── Legend ── */}
                {graph.nodes.length > 0 && (
                    <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-2 z-20">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Connections</p>
                        {Object.entries(EDGE_LABELS).map(([reason, label]) => (
                            <div key={reason} className="flex items-center gap-2.5">
                                <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: EDGE_COLORS[reason as keyof typeof EDGE_COLORS] }} />
                                <span className="text-xs text-gray-300">{label}</span>
                            </div>
                        ))}
                        <div className="border-t border-white/10 pt-2 mt-2 flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse shrink-0" />
                            <span className="text-xs text-gray-300">🌱 Seed Node</span>
                        </div>
                    </div>
                )}

                {/* ── Zoom controls ── */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
                    <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ZoomIn size={18} />
                    </button>
                    <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ZoomOut size={18} />
                    </button>
                    <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors" title="Reset view">
                        <RotateCcw size={16} />
                    </button>
                </div>

                {/* ── Hint ── */}
                {graph.nodes.length > 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-gray-400 z-20 pointer-events-none">
                        <Info size={12} />
                        Click any node to expand · Drag to pan · Scroll to zoom
                    </div>
                )}
            </div>
        </div>
    );
}
