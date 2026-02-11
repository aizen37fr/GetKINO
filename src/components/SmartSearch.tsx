import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, X, TrendingUp, Star, Film } from 'lucide-react';
import { parseSearchQuery } from '../services/deepseek';
import { searchMoviesByTitle, searchTVByTitle } from '../services/tmdb';

interface SmartSearchProps {
    onSearch?: (query: string, results: any[]) => void;
}

export default function SmartSearch({ onSearch }: SmartSearchProps) {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        setShowResults(true);

        try {
            // Parse query with AI
            console.log('🔍 Smart Search: Parsing query...');
            const parsed = await parseSearchQuery(query);

            if (parsed) {
                console.log('✅ Parsed:', parsed);

                // Search based on parsed data
                const allResults = [];

                // Search movies and TV shows
                for (const term of parsed.searchTerms) {
                    const [movies, shows] = await Promise.all([
                        searchMoviesByTitle(term),
                        searchTVByTitle(term)
                    ]);

                    allResults.push(...movies.slice(0, 3), ...shows.slice(0, 3));
                }

                // Filter by type if specified
                const filtered = parsed.filters.type
                    ? allResults.filter(r => {
                        if (parsed.filters.type === 'movie') return r.title;
                        if (parsed.filters.type === 'tv') return r.name;
                        return true;
                    })
                    : allResults;

                setResults(filtered.slice(0, 6));
                onSearch?.(query, filtered);
            } else {
                // Fallback: simple search
                const [movies, shows] = await Promise.all([
                    searchMoviesByTitle(query),
                    searchTVByTitle(query)
                ]);

                const allResults = [...movies.slice(0, 3), ...shows.slice(0, 3)];
                setResults(allResults);
                onSearch?.(query, allResults);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
        if (e.key === 'Escape') {
            setShowResults(false);
        }
    };

    // Keyboard shortcut (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('smart-search-input')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative w-full max-w-3xl mx-auto">
            {/* Search Bar Container */}
            <motion.div
                animate={{
                    scale: isFocused ? 1.02 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="relative"
            >
                {/* Animated Gradient Border */}
                <motion.div
                    animate={{
                        rotate: isFocused ? 360 : 0,
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute inset-0 rounded-2xl blur-sm opacity-75"
                    style={{
                        background: isFocused
                            ? 'linear-gradient(45deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)'
                            : 'transparent',
                        zIndex: -1,
                    }}
                />

                {/* Glassmorphism Search Bar */}
                <div className="relative backdrop-blur-xl bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-900/20 overflow-hidden">
                    {/* Shimmer Effect */}
                    <motion.div
                        animate={{
                            x: ['-100%', '100%'],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                            repeatDelay: 1
                        }}
                        className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        style={{ pointerEvents: 'none' }}
                    />

                    <div className="relative flex items-center gap-3 p-2">
                        {/* Search Icon with Pulse */}
                        <motion.div
                            animate={{
                                scale: isFocused ? [1, 1.2, 1] : 1,
                            }}
                            transition={{
                                duration: 2,
                                repeat: isFocused ? Infinity : 0,
                            }}
                            className="pl-2"
                        >
                            <Search className={`w-6 h-6 transition-colors duration-300 ${isFocused ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </motion.div>

                        {/* Input Field */}
                        <input
                            id="smart-search-input"
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            placeholder="Search movies, TV shows, K-dramas..."
                            className="flex-1 bg-transparent border-none outline-none text-cyan-100 placeholder-cyan-700/50 text-lg font-light py-3"
                        />

                        {/* Keyboard Shortcut Hint */}
                        <AnimatePresence>
                            {!query && !isFocused && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 border border-cyan-900/30 rounded-lg"
                                >
                                    <span className="text-xs text-cyan-600">⌘K</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Loading Spinner */}
                            <AnimatePresence>
                                {isSearching && (
                                    <motion.div
                                        initial={{ opacity: 0, rotate: 0 }}
                                        animate={{ opacity: 1, rotate: 360 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles className="w-5 h-5 text-purple-400" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Clear Button */}
                            <AnimatePresence>
                                {query && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            setQuery('');
                                            setResults([]);
                                            setShowResults(false);
                                        }}
                                        className="p-2 hover:bg-cyan-900/20 rounded-lg transition-colors text-cyan-600"
                                    >
                                        <X size={18} />
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            {/* Search Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSearch}
                                disabled={!query.trim() || isSearching}
                                className="relative overflow-hidden px-6 py-2 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                            >
                                <motion.div
                                    animate={{
                                        x: isSearching ? [0, 100] : 0,
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: isSearching ? Infinity : 0,
                                    }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                                <span className="relative z-10">
                                    {isSearching ? 'Searching...' : 'Search'}
                                </span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Results Dropdown */}
            <AnimatePresence>
                {showResults && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3, type: "spring" }}
                        className="absolute top-full mt-4 w-full backdrop-blur-xl bg-slate-950/95 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-900/30 overflow-hidden z-50"
                    >
                        {/* Results Header */}
                        <div className="p-4 bg-gradient-to-r from-cyan-950/50 to-purple-950/50 border-b border-cyan-900/30">
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-semibold"
                            >
                                <Sparkles size={16} className="text-purple-400" />
                                AI-Powered Results
                                <span className="ml-auto text-xs text-cyan-600">
                                    {results.length} found
                                </span>
                            </motion.p>
                        </div>

                        {/* Results List */}
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {results.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05, type: "spring" }}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    className="p-4 hover:bg-gradient-to-r hover:from-cyan-900/20 hover:to-purple-900/20 cursor-pointer transition-all flex gap-4 border-b border-cyan-900/10 last:border-b-0 group"
                                >
                                    {/* Poster */}
                                    <div className="relative">
                                        {item.poster_path ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                                alt={item.title || item.name}
                                                className="w-14 h-20 object-cover rounded-lg shadow-lg group-hover:shadow-cyan-500/30 transition-all"
                                            />
                                        ) : (
                                            <div className="w-14 h-20 bg-gradient-to-br from-cyan-900/30 to-purple-900/30 rounded-lg flex items-center justify-center">
                                                <Film className="w-6 h-6 text-cyan-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-cyan-100 font-semibold text-base truncate group-hover:text-cyan-300 transition-colors">
                                            {item.title || item.name}
                                        </h4>
                                        <p className="text-cyan-600 text-sm mt-0.5">
                                            {item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-cyan-400 px-2 py-0.5 bg-cyan-950/50 border border-cyan-900/30 rounded-full">
                                                {item.title ? 'Movie' : 'TV Show'}
                                            </span>
                                            {item.vote_average && (
                                                <span className="text-xs flex items-center gap-1 text-yellow-400">
                                                    <Star size={12} className="fill-yellow-400" />
                                                    {item.vote_average.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hover Arrow */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        whileHover={{ opacity: 1, x: 0 }}
                                        className="self-center text-cyan-500"
                                    >
                                        <TrendingUp size={20} />
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Scrollbar Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(6, 182, 212, 0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.3);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.5);
                }
            `}</style>
        </div>
    );
}
