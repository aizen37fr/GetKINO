import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Sparkles } from 'lucide-react';
import { MOCK_MATCHES, type MatchProfile } from '../services/matching';
import { useAuth } from '../context/AuthContext';

export default function TasteMatch() {
    const { user } = useAuth();
    const [profiles] = useState<MatchProfile[]>(MOCK_MATCHES);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lastDirection, setLastDirection] = useState<'left' | 'right' | null>(null);

    const currentProfile = profiles[currentIndex];

    const swipe = (direction: 'left' | 'right') => {
        setLastDirection(direction);
        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
            setLastDirection(null);
        }, 300);

        if (direction === 'right') {
            // Handle match logic here
            // In real app: Send friend request / match notification
        }
    };

    if (!user) return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <Sparkles className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Find Your Cine-Soulmate</h3>
            <p className="text-gray-400">Sign in to match with people who share your weird taste in movies.</p>
        </div>
    );

    if (currentIndex >= profiles.length) return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Sparkles className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">That's everyone for now!</h3>
            <p className="text-gray-400">Check back later for more potential movie dates.</p>
        </div>
    );

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            <div className="flex-1 relative flex items-center justify-center p-4">
                <AnimatePresence>
                    {currentProfile && (
                        <motion.div
                            key={currentProfile.userId}
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ x: lastDirection === 'left' ? -300 : 300, opacity: 0, rotate: lastDirection === 'left' ? -20 : 20 }}
                            className="w-full max-w-sm bg-surface border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
                        >
                            {/* Compatibility Badge */}
                            <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-green-500/50">
                                <span className="text-green-400 font-bold">{currentProfile.compatibility}% Match</span>
                            </div>

                            {/* Avatar / Placeholder */}
                            <div className="h-64 bg-gradient-to-br from-purple-800 to-blue-900 flex items-center justify-center relative">
                                <span className="text-6xl font-bold text-white/20">{currentProfile.userName[0]}</span>

                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                    <h2 className="text-2xl font-bold text-white mb-1">{currentProfile.userName}</h2>
                                    <p className="text-purple-300 font-medium text-sm flex items-center gap-2">
                                        <Sparkles size={14} /> {currentProfile.vibeMatch}
                                    </p>
                                </div>
                            </div>

                            {/* Shared Interests */}
                            <div className="p-6 space-y-4">
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">You Both Love</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {currentProfile.sharedMovies.map(movie => (
                                            <span key={movie} className="text-xs px-2 py-1 bg-white/5 rounded-full border border-white/10">
                                                🎬 {movie}
                                            </span>
                                        ))}
                                        {currentProfile.sharedGenres.map(genre => (
                                            <span key={genre} className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-400 italic">
                                        "{currentProfile.userName} also rated Inception 10/10. Definitely a keeper."
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-6 pt-0 flex items-center justify-center gap-6">
                                <button
                                    onClick={() => swipe('left')}
                                    className="w-14 h-14 rounded-full bg-black/40 border border-white/10 text-gray-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-all"
                                >
                                    <X size={28} />
                                </button>
                                <button
                                    onClick={() => swipe('right')}
                                    className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:shadow-purple-500/40 hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Heart size={28} fill="currentColor" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
