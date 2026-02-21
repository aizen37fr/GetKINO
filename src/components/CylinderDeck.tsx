import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { ContentItem } from '../data/db';
import { Info, Star, X, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TheaterModal from './TheaterModal';
import StreamScoreModal from './StreamScoreModal';

interface CylinderDeckProps {
    items: ContentItem[];
    onClose: () => void;
    onSwipe?: (item: ContentItem, dir: 'like' | 'nope') => void;
}

const GAP = 20;

export default function CylinderDeck({ items, onClose, onSwipe }: CylinderDeckProps) {
    const { addToWatchlist } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showDetails, setShowDetails] = useState<ContentItem | null>(null);
    const [showRating, setShowRating] = useState<ContentItem | null>(null);

    // Responsive sizing
    const [cardWidth, setCardWidth] = useState(260);
    const [radius, setRadius] = useState(400);

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 640;
            const newCardWidth = isMobile ? 220 : 260;
            setCardWidth(newCardWidth);

            const count = items.length;
            // Tighter radius on mobile for more "wrap" feel
            const minRadius = isMobile ? 250 : 400;
            const newRadius = Math.max((count * (newCardWidth + GAP)) / (2 * Math.PI), minRadius);
            setRadius(newRadius);
        };

        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [items.length]);

    const count = items.length;
    const anglePerCard = 360 / count;

    // Physics for rotation (tuned for "buttery" feel)
    const rotation = useMotionValue(0);
    const smoothRotation = useSpring(rotation, { damping: 25, stiffness: 120, mass: 0.8 });

    // Handle Drag
    const handleDrag = (_: any, info: PanInfo) => {
        // Map drag pixel distance to rotation degrees
        // dragging width of screen should rotate significant amount
        const sensitivity = 0.2;
        rotation.set(rotation.get() + info.delta.x * sensitivity);
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
        // Snap to nearest card
        const currentRot = rotation.get();
        // Add velocity for "throw" feel
        const velocity = info.velocity.x * 0.2;
        const targetRot = currentRot + velocity;

        // Find nearest multiple of anglePerCard
        const nearestIndex = Math.round(targetRot / anglePerCard);
        // Snap to that angle
        rotation.set(nearestIndex * anglePerCard);

        // Update active index (normalized to 0...count-1)
        // Note: rotation is negative for left drag (next item)
        // We invert for index calc
        let index = -nearestIndex % count;
        if (index < 0) index += count;
        setActiveIndex(index);
    };

    // Auto-select center item on mount
    useEffect(() => {
        // Center the 0th item initially
        // Using -0 to indicate start
    }, []);

    // Helper to calculate card transformation
    const getCardStyle = (index: number) => {
        // Base Rotation for this card placement
        const baseAngle = index * anglePerCard;

        // We apply rotation to the PARENT container, but here we can add individual flourishes
        // For the cylinder, the simplest way is rotating the generic container (see below)
        // and placing these items statically in the 3D space of that container.

        return {
            transform: `rotateY(${baseAngle}deg) translateZ(${radius}px)`,
        };
    };



    // Quick Actions on Active Card
    const swipeActive = (dir: 'like' | 'nope') => {
        if (!items[activeIndex]) return;

        // Trigger external handler (for Match Mode)
        if (onSwipe) {
            onSwipe(items[activeIndex], dir);
        }

        if (dir === 'like') {
            const item = items[activeIndex];
            addToWatchlist({
                id: item.id,
                title: item.title,
                type: item.type === 'kdrama' || item.type === 'cdrama' ? 'tv' : item.type as 'anime' | 'movie' | 'tv' | 'series',
                image: item.image,
                year: item.year,
                genres: item.genres,
                rating: item.rating,
                overview: item.description,
                status: 'plan-to-watch',
            });
        }

        // Rotate to next
        const currentRot = rotation.get();
        const nextRot = currentRot - anglePerCard; // Move "left" visually to bring right item to center
        rotation.set(nextRot);

        const nextIndex = (activeIndex + 1) % count;
        setActiveIndex(nextIndex);
    };

    if (items.length === 0) return null;

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden perspective-1000">

            {/* 3D Scene Container */}
            <div className="relative w-full h-[60vh] flex items-center justify-center perspective-[1200px] cursor-grab active:cursor-grabbing"
                ref={containerRef}
            >
                {/* Rotating Cylinder Group */}
                <motion.div
                    style={{
                        rotateY: smoothRotation,
                        transformStyle: 'preserve-3d',
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        willChange: 'transform', // Hardware acceleration hint
                    }}
                    onPan={handleDrag}
                    onPanEnd={handleDragEnd}
                    className="touch-none" // Prevent scroll on mobile while spinning
                >
                    {items.map((item, index) => {
                        const style = getCardStyle(index);
                        const isActive = index === activeIndex;

                        // Auto-play trailer if active for > 1.5s
                        const [playTrailer, setPlayTrailer] = useState(false);
                        useEffect(() => {
                            let timer: any;
                            if (isActive && item.trailerKey) {
                                timer = setTimeout(() => setPlayTrailer(true), 1500);
                            } else {
                                setPlayTrailer(false);
                            }
                            return () => clearTimeout(timer);
                        }, [isActive, item.trailerKey]);

                        return (
                            <div
                                key={item.id}
                                className="absolute top-1/2 left-1/2 rounded-2xl overflow-hidden shadow-2xl backface-hidden transition-all duration-300"
                                style={{
                                    width: `${cardWidth}px`,
                                    height: `${cardWidth * 1.5}px`, // Maintain aspect ratio
                                    marginLeft: `-${cardWidth / 2}px`,
                                    marginTop: `-${(cardWidth * 1.5) / 2}px`,
                                    transform: `${style.transform}`,
                                    // Make inactive cards slightly dimmer
                                    filter: isActive ? 'brightness(1.1) drop-shadow(0 0 20px rgba(255,0,0,0.3))' : 'brightness(0.6)',
                                    zIndex: isActive ? 100 : 1,
                                    border: isActive ? '2px solid rgba(255,255,255,0.5)' : 'none'
                                }}
                            >
                                {/* Living Poster: Video Background */}
                                {playTrailer && isActive ? (
                                    <div className="absolute inset-0 z-10 bg-black">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${item.trailerKey}?autoplay=1&controls=0&mute=1&loop=1&playlist=${item.trailerKey}`}
                                            title="Trailer"
                                            frameBorder="0"
                                            allow="autoplay; encrypted-media"
                                            className="w-full h-full object-cover scale-150 pointer-events-none" // Scale to remove black bars
                                        ></iframe>
                                        <div className="absolute inset-0 bg-transparent" /> {/* Overlay to prevent iframe interaction stealing drag */}
                                    </div>
                                ) : (
                                    <img
                                        src={item.image}
                                        className="w-full h-full object-cover pointer-events-none"
                                        alt={item.title}
                                    />
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
                                    <h3 className="font-bold text-xl leading-tight truncate">{item.title}</h3>
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <span className="text-yellow-400 font-bold flex items-center gap-1">
                                            <Star size={12} fill="currentColor" /> {item.rating.toFixed(1)}
                                        </span>
                                        <span className="opacity-75">{item.year}</span>
                                    </div>

                                    {/* Watch Providers (Netflix, Prime, etc.) */}
                                    {item.watchProviders && item.watchProviders.length > 0 && (
                                        <div className="flex items-center gap-2 mt-3">
                                            {item.watchProviders.map((provider) => (
                                                <a
                                                    key={provider.name}
                                                    href={provider.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-8 h-8 rounded-full overflow-hidden border border-white/30 hover:scale-110 transition-transform bg-white/10 flex items-center justify-center p-1"
                                                    title={`Watch on ${provider.name}`}
                                                >
                                                    {/* Fallback to text initials if logo fails/is complex, but real app would use img */}
                                                    <img src={provider.logo} alt={provider.name} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Buttons (Only visible on active or semi-visible) */}
                                    <div className="flex gap-2 mt-3 opacity-0 hover:opacity-100 transition-opacity">
                                        <button onClick={() => setShowDetails(item)} className="flex-1 bg-white/20 py-2 rounded text-xs font-bold">Info</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Controls (Fixed at bottom) */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-6 z-50">
                <button
                    onClick={() => swipeActive('nope')}
                    className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border-2 border-red-500 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95 transition-all"
                >
                    <X size={32} />
                </button>

                {/* Active Item Info / Open Details */}
                <button
                    onClick={() => items[activeIndex] && setShowDetails(items[activeIndex])}
                    className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 hover:scale-105 transition-all"
                >
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                        <Info size={24} />
                    </div>
                </button>

                {/* Rate Button */}
                <button
                    onClick={() => items[activeIndex] && setShowRating(items[activeIndex])}
                    className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 hover:scale-105 transition-all"
                >
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                        <Star size={24} className="text-yellow-400" />
                    </div>
                </button>

                <button
                    onClick={() => swipeActive('like')}
                    className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border-2 border-green-500 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white hover:scale-110 active:scale-95 transition-all"
                >
                    <Heart size={32} fill="currentColor" />
                </button>
            </div>

            {/* Back Button */}
            <button onClick={onClose} className="absolute top-4 left-4 z-50 p-2 bg-black/50 rounded-full text-white">
                <X size={24} />
            </button>

            {/* Immersive Theater Mode Details */}
            <TheaterModal
                item={showDetails}
                onClose={() => setShowDetails(null)}
            />

            {/* StreamScore Rating Modal */}
            {showRating && (
                <StreamScoreModal
                    isOpen={!!showRating}
                    onClose={() => setShowRating(null)}
                    contentTitle={showRating.title}
                    contentId={showRating.id.toString()}
                    onSubmit={(review) => {
                        console.log('Submitted Review:', review);
                        alert(`Thanks for rating ${showRating.title}! Score: ${(review.storyScore + review.actingScore + review.visualsScore + review.endingScore) / 4}`);
                    }}
                />
            )}
        </div>
    );
}
