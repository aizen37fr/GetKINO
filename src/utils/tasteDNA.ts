import type { WatchlistItem } from '../types/watchlist';

// ─── Genre Radar ──────────────────────────────────────────────────────────────
export const RADAR_GENRES = [
    'Action', 'Romance', 'Horror', 'Comedy', 'Drama',
    'Sci-Fi', 'Fantasy', 'Mystery', 'Thriller', 'Slice of Life',
];

export function genreFrequency(watchlist: WatchlistItem[]): Record<string, number> {
    const freq: Record<string, number> = {};
    watchlist.forEach(item => {
        item.genres?.forEach(g => {
            freq[g] = (freq[g] || 0) + 1;
        });
    });
    return freq;
}

export function radarScores(watchlist: WatchlistItem[]): { genre: string; score: number }[] {
    const freq = genreFrequency(watchlist);
    const max = Math.max(1, ...Object.values(freq));
    return RADAR_GENRES.map(g => ({
        genre: g,
        score: Math.round(((freq[g] || 0) / max) * 100),
    }));
}

// ─── Type Breakdown ───────────────────────────────────────────────────────────
export function typeBreakdown(watchlist: WatchlistItem[]) {
    const total = watchlist.length || 1;
    const counts = { anime: 0, movie: 0, tv: 0 };
    watchlist.forEach(i => {
        if (i.type === 'anime') counts.anime++;
        else if (i.type === 'movie') counts.movie++;
        else counts.tv++;
    });
    return [
        { label: 'Anime', count: counts.anime, pct: counts.anime / total, color: '#a855f7', emoji: '⛩️' },
        { label: 'Movies', count: counts.movie, pct: counts.movie / total, color: '#22d3ee', emoji: '🎬' },
        { label: 'Shows', count: counts.tv, pct: counts.tv / total, color: '#f59e0b', emoji: '📺' },
    ];
}

// ─── Top Genres ───────────────────────────────────────────────────────────────
export function topGenres(watchlist: WatchlistItem[], n = 8) {
    const freq = genreFrequency(watchlist);
    const max = Math.max(1, ...Object.values(freq));
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([genre, count]) => ({ genre, count, pct: count / max }));
}

// ─── Taste Tags ───────────────────────────────────────────────────────────────
export function tasteTags(watchlist: WatchlistItem[]): { label: string; color: string; desc: string }[] {
    const freq = genreFrequency(watchlist);
    const types = typeBreakdown(watchlist);
    const animeRatio = types[0].pct;
    const rated = watchlist.filter(i => i.userRating);
    const avgRating = rated.length ? rated.reduce((s, i) => s + (i.userRating || 0), 0) / rated.length : 0;
    const completed = watchlist.filter(i => i.status === 'completed').length;
    const dropped = watchlist.filter(i => i.status === 'dropped').length;
    const totalEps = watchlist.reduce((s, i) => s + (i.currentEpisode || 0), 0);

    const tags: { label: string; color: string; desc: string }[] = [];

    if (animeRatio > 0.6) tags.push({ label: '⛩️ Anime Lord', color: '#a855f7', desc: 'Over 60% of your list is anime' });
    if ((freq['Action'] || 0) > 3) tags.push({ label: '⚡ Action Junkie', color: '#f97316', desc: 'You love high-octane action' });
    if ((freq['Romance'] || 0) > 3) tags.push({ label: '💖 Hopeless Romantic', color: '#ec4899', desc: 'Romance is your kryptonite' });
    if ((freq['Horror'] || 0) > 2) tags.push({ label: '💀 Horror Fiend', color: '#6b7280', desc: 'You thrive in the dark' });
    if ((freq['Slice of Life'] || 0) > 2) tags.push({ label: '🌸 Cozy Watcher', color: '#34d399', desc: 'Calm & comfy is your vibe' });
    if ((freq['Sci-Fi'] || 0) > 2) tags.push({ label: '🚀 Sci-Fi Nerd', color: '#38bdf8', desc: 'The future excites you' });
    if ((freq['Mystery'] || 0) > 2 || (freq['Thriller'] || 0) > 2) tags.push({ label: '🔍 Detective Mind', color: '#fbbf24', desc: 'You love puzzles & twists' });
    if ((freq['Fantasy'] || 0) > 3) tags.push({ label: '🧙 Fantasy Dreamer', color: '#818cf8', desc: 'Magic and worlds beyond reality' });
    if (avgRating >= 8.5) tags.push({ label: '🌟 Tough Critic', color: '#fbbf24', desc: 'You only rate things 8+ stars' });
    if (avgRating > 0 && avgRating < 6) tags.push({ label: '😤 Brutally Honest', color: '#ef4444', desc: 'No sugarcoating your ratings' });
    if (completed > 15) tags.push({ label: '🏆 Completionist', color: '#4ade80', desc: 'You always finish what you start' });
    if (dropped > 5) tags.push({ label: '🚪 Drop Trigger', color: '#94a3b8', desc: 'Life\'s too short for bad shows' });
    if (totalEps > 500) tags.push({ label: '📺 Marathon Runner', color: '#22d3ee', desc: `${totalEps}+ episodes consumed` });
    if (watchlist.length > 30) tags.push({ label: '📚 Collector', color: '#c084fc', desc: 'Your list is truly impressive' });

    return tags.slice(0, 8);
}

// ─── Extended Stats ───────────────────────────────────────────────────────────
export function dnaStats(watchlist: WatchlistItem[]) {
    const rated = watchlist.filter(i => i.userRating);
    const avgRating = rated.length
        ? (rated.reduce((s, i) => s + (i.userRating || 0), 0) / rated.length).toFixed(1)
        : '—';
    const totalEps = watchlist.reduce((s, i) => s + (i.currentEpisode || 0), 0);
    const completionRate = watchlist.length
        ? Math.round((watchlist.filter(i => i.status === 'completed').length / watchlist.length) * 100)
        : 0;
    const uniqueGenres = Object.keys(genreFrequency(watchlist)).length;
    return { avgRating, totalEps, completionRate, uniqueGenres, total: watchlist.length };
}
