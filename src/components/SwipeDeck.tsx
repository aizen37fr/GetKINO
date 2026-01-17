import { useState, forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { ContentItem } from '../data/db';
import { X, Heart, Star, Info, Share2, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SwipeDeckProps {
    items: ContentItem[];
    onClose: () => void;
}

// Separate component to isolate motion values for each card
// This prevents the "glitch" where the next card inherits the dragged position of the previous one
const SwipeCard = forwardRef(({ item, index, isTop, onSwipe, onDetails }: {
    item: ContentItem,
    index: number,
    isTop: boolean,
    onSwipe: (dir: 'like' | 'nope') => void,
    onDetails: (item: ContentItem) => void
}, ref) => {

    // Each card gets its own independent x value
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);

    // Expose method to trigger swipe from buttons
    useImperativeHandle(ref, () => ({
        triggerExit: (dir: 'like' | 'nope') => {
            onSwipe(dir);
        }
    }));

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            onSwipe('like');
        } else if (info.offset.x < -threshold) {
            onSwipe('nope');
        } else {
            x.set(0);
        }
    };

    return (
        <motion.div
            style={{
                gridRow: 1,
                gridColumn: 1,
                x: isTop ? x : 0,
                rotate: isTop ? rotate : 0,
                zIndex: index,
                // Stack effect: scale down cards behind
                scale: isTop ? 1 : 0.95 + (index * 0.05),
            }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: isTop ? 1 : 0.95, opacity: 1 }}
            exit={{
                x: 0,
                opacity: 0,
            }}
            variants={{
                exit: (direction: number) => ({
                    x: direction > 0 ? 500 : -500,
                    opacity: 0,
                    transition: { duration: 0.2 }
                })
            }}
            custom={0} // Default value
            className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-surface cursor-grab active:cursor-grabbing border border-white/10"
        >
            {/* Image */}
            <div className="absolute inset-0">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
            </div>

            {/* Overlays */}
            {isTop && (
                <>
                    <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 right-8 z-20 transform rotate-12">
                        <div className="border-4 border-green-500 text-green-500 font-bold text-4xl px-4 py-2 rounded-xl bg-black/20 backdrop-blur-sm">LIKE</div>
                    </motion.div>
                    <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 left-8 z-20 transform -rotate-12">
                        <div className="border-4 border-red-500 text-red-500 font-bold text-4xl px-4 py-2 rounded-xl bg-black/20 backdrop-blur-sm">NOPE</div>
                    </motion.div>
                </>
            )}

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10 text-white">
                <div className="flex justify-between items-end mb-2">
                    <h2 className="text-3xl font-bold leading-tight drop-shadow-md">{item.title}</h2>
                    <div className="flex items-center gap-1 bg-yellow-500/20 backdrop-blur-md px-2 py-1 rounded-lg text-yellow-400 font-bold border border-yellow-500/30">
                        <Star size={16} fill="currentColor" />
                        <span>{item.rating}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 text-sm font-medium">
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">{item.year}</span>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">{item.language}</span>
                    {item.genres.slice(0, 2).map(g => (
                        <span key={g} className="bg-primary/80 px-3 py-1 rounded-full">{g}</span>
                    ))}
                </div>

                <p className="text-gray-300 line-clamp-3 text-sm mb-4 leading-relaxed">
                    {item.description}
                </p>

                <div className="flex gap-3 mt-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDetails(item); }}
                        className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Info size={18} /> Details
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const link = item.trailerUrl || `https://www.youtube.com/results?search_query=${item.title}+trailer`;
                            window.open(link, '_blank');
                        }}
                        className="w-12 bg-red-600 hover:bg-red-700 backdrop-blur-md rounded-xl flex items-center justify-center transition-colors"
                    >
                        <Play size={18} fill="white" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
});


export default function SwipeDeck({ items, onClose }: SwipeDeckProps) {
    const [cards, setCards] = useState(items);
    const [history, setHistory] = useState<ContentItem[]>([]);
    const [showDetails, setShowDetails] = useState<ContentItem | null>(null);
    const { addToWatchlist } = useAuth();

    // Track last swipe direction for button clicks (1 = right/like, -1 = left/nope)
    // Used by AnimatePresence's 'custom' prop
    const [exitDirection, setExitDirection] = useState(0);

    const removeCard = (dir: 'like' | 'nope') => {
        if (cards.length === 0) return;
        const item = cards[cards.length - 1];

        if (dir === 'like') {
            addToWatchlist(item);
            setExitDirection(1);
        } else {
            setExitDirection(-1);
        }

        setCards((prev) => {
            const newCards = [...prev];
            const removed = newCards.pop();
            if (removed) setHistory([...history, removed]);
            return newCards;
        });
    };

    const handleShare = (item: ContentItem) => {
        const text = `Hey! Check out "${item.title}" on What to Watch!`;
        navigator.clipboard.writeText(text);
        alert('Link copied to clipboard! Share it with friends.');
    };

    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h2 className="text-3xl font-bold mb-4">That's all folks!</h2>
                <p className="text-gray-400 mb-8">You've seen all recommendations for this mood.</p>
                <button
                    onClick={onClose}
                    className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                >
                    Choose another Vibe
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full max-w-sm mx-auto flex items-center justify-center">

            {/* Details Modal (Hoisted to Deck level) */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-0 z-[60] bg-black/95 p-6 flex flex-col overflow-y-auto"
                    >
                        <button onClick={() => setShowDetails(null)} className="self-end p-2 bg-white/10 rounded-full mb-4">
                            <X size={20} />
                        </button>
                        <img src={showDetails.image} className="w-full h-64 object-cover rounded-xl mb-4" />
                        <h2 className="text-3xl font-bold mb-2">{showDetails.title}</h2>
                        <div className="flex gap-2 mb-4">
                            <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-sm font-bold">★ {showDetails.rating}</span>
                            <span className="bg-white/10 px-2 py-1 rounded text-sm">{showDetails.year}</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed mb-6">{showDetails.description}</p>

                        <div className="mt-auto space-y-3">
                            {showDetails.trailerUrl && (
                                <a href={showDetails.trailerUrl} target="_blank" rel="noreferrer" className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl flex items-center justify-center gap-2 font-bold"><Play size={20} /> Watch Trailer</a>
                            )}
                            <button onClick={() => handleShare(showDetails)} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl flex items-center justify-center gap-2 font-bold"><Share2 size={20} /> Share</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Back button */}
            <button onClick={onClose} className="absolute top-4 left-4 z-40 p-2 bg-black/50 rounded-full text-white backdrop-blur-md">
                <X size={24} />
            </button>

            <div className="relative w-full aspect-[2/3]">
                <AnimatePresence custom={exitDirection}>
                    {cards.map((card, index) => {
                        // Only render top 2
                        if (index < cards.length - 2) return null;
                        const isTop = index === cards.length - 1;
                        const stackIndex = index - (cards.length - 2);

                        return (
                            <SwipeCard
                                key={card.id}
                                item={card}
                                index={stackIndex}
                                isTop={isTop}
                                onSwipe={removeCard}
                                onDetails={setShowDetails}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="absolute -bottom-24 left-0 right-0 flex justify-center items-center gap-8 z-50">
                <button
                    className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border-2 border-red-500 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-xl shadow-red-900/20"
                    onClick={() => removeCard('nope')} aria-label="Pass">
                    <X size={32} strokeWidth={3} />
                </button>
                <button
                    onClick={() => { if (cards.length) addToWatchlist(cards[cards.length - 1]); }}
                    className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border-2 border-blue-400 text-blue-400 flex items-center justify-center hover:bg-blue-400 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-lg shadow-blue-900/20" aria-label="Super Like">
                    <Star size={24} fill="currentColor" />
                </button>
                <button
                    className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border-2 border-green-500 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-xl shadow-green-900/20"
                    onClick={() => removeCard('like')} aria-label="Like">
                    <Heart size={32} fill="currentColor" />
                </button>
            </div>
        </div>
    );
}
