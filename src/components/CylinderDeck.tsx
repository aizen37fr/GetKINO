import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { ContentItem } from '../data/db';
import { Play, Info, Share2, Star, X, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CylinderDeckProps {
    items: ContentItem[];
    onClose: () => void;
}

const CARD_WIDTH = 260; // Slightly narrower for better cylinder density
const GAP = 20;

export default function CylinderDeck({ items, onClose }: CylinderDeckProps) {
    const { addToWatchlist } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showDetails, setShowDetails] = useState<ContentItem | null>(null);

    // Physics for rotation
    const rotation = useMotionValue(0);
    const smoothRotation = useSpring(rotation, { damping: 20, stiffness: 150, mass: 1 });

    // Calculate 3D geometry
    // Radius needs to accommodate all cards in a circle without overlap
    // Circumference = Count * (Width + Gap)
    // Radius = Circumference / (2 * PI)
    const count = items.length;
    const radius = Math.max((count * (CARD_WIDTH + GAP)) / (2 * Math.PI), 400); // Min radius to avoid cramping
    const anglePerCard = 360 / count;

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

    const handleShare = (item: ContentItem) => {
        const text = `Check out "${item.title}"!`;
        navigator.clipboard.writeText(text);
        alert("Copied!");
    };

    // Quick Actions on Active Card
    const swipeActive = (dir: 'like' | 'nope') => {
        if (!items[activeIndex]) return;

        if (dir === 'like') {
            addToWatchlist(items[activeIndex]);
            // Visual feedback could be added here
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
                    }}
                    drag="x"
                    dragElastic={0.1}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                >
                    {items.map((item, index) => {
                        const style = getCardStyle(index);
                        const isActive = index === activeIndex;

                        return (
                            <div
                                key={item.id}
                                className="absolute top-1/2 left-1/2 -ml-[130px] -mt-[195px] w-[260px] h-[390px] rounded-2xl overflow-hidden shadow-2xl backface-hidden transition-all duration-300"
                                style={{
                                    transform: `${style.transform}`,
                                    // Make inactive cards slightly dimmer
                                    filter: isActive ? 'brightness(1.1) drop-shadow(0 0 20px rgba(255,0,0,0.3))' : 'brightness(0.6)',
                                    zIndex: isActive ? 100 : 1,
                                    border: isActive ? '2px solid rgba(255,255,255,0.5)' : 'none'
                                }}
                            >
                                <img
                                    src={item.image}
                                    className="w-full h-full object-cover pointer-events-none"
                                    alt={item.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                    <h3 className="font-bold text-xl leading-tight truncate">{item.title}</h3>
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <span className="text-yellow-400 font-bold flex items-center gap-1">
                                            <Star size={12} fill="currentColor" /> {item.rating.toFixed(1)}
                                        </span>
                                        <span className="opacity-75">{item.year}</span>
                                    </div>

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
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8 z-50">
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

            {/* Details Modal (Reused) */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-0 z-[70] bg-black/95 p-6 flex flex-col overflow-y-auto"
                    >
                        <button onClick={() => setShowDetails(null)} className="self-end p-2 bg-white/10 rounded-full mb-4">
                            <X size={20} />
                        </button>
                        <img src={showDetails.image} className="w-full h-64 object-cover rounded-xl mb-4" />
                        <h2 className="text-3xl font-bold mb-2">{showDetails.title}</h2>
                        <p className="text-gray-300 leading-relaxed mb-6 block">{showDetails.description}</p>

                        <div className="mt-auto space-y-3">
                            {showDetails.trailerUrl && (
                                <a href={showDetails.trailerUrl} target="_blank" rel="noreferrer" className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl flex items-center justify-center gap-2 font-bold"><Play size={20} /> Watch Trailer</a>
                            )}
                            <button onClick={() => handleShare(showDetails)} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl flex items-center justify-center gap-2 font-bold"><Share2 size={20} /> Share</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
