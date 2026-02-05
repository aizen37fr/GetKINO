import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState } from 'react';
import type { ContentItem } from '../data/db';

interface Card3DProps {
    item: ContentItem;
    onClick?: () => void;
}

export default function Card3D({ item, onClick }: Card3DProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Mouse position tracking
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring physics for rotation
    const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), {
        stiffness: 200,
        damping: 20
    });
    const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), {
        stiffness: 200,
        damping: 20
    });

    // Lift effect (z-axis)
    const z = useSpring(isHovered ? 60 : 0, {
        stiffness: 300,
        damping: 25
    });

    // Handle mouse move for tilt effect
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{
                perspective: 1000,
                transformStyle: 'preserve-3d',
            }}
            className="relative cursor-pointer"
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    z,
                    transformStyle: 'preserve-3d',
                }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25
                }}
                className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden"
            >
                {/* Multiple shadow layers for depth */}
                <motion.div
                    className="absolute inset-0 bg-black rounded-2xl"
                    style={{
                        z: -10,
                        filter: 'blur(20px)',
                        opacity: isHovered ? 0.6 : 0.3,
                    }}
                    animate={{
                        scale: isHovered ? 1.05 : 1,
                        opacity: isHovered ? 0.6 : 0.3,
                    }}
                />
                <motion.div
                    className="absolute inset-0 bg-black/40 rounded-2xl"
                    style={{
                        z: -5,
                        filter: 'blur(10px)',
                    }}
                    animate={{
                        scale: isHovered ? 1.03 : 1,
                        opacity: isHovered ? 0.4 : 0.2,
                    }}
                />

                {/* Main card */}
                <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-white/10">
                    {/* Image */}
                    <div className="relative w-full h-full">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                            <h3 className="text-white font-bold text-lg line-clamp-2">
                                {item.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white/80">
                                    {item.type}
                                </span>
                                <span className="px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white/80">
                                    {item.year}
                                </span>
                                <span className="px-2 py-0.5 bg-yellow-500/20 backdrop-blur-sm rounded-full text-xs text-yellow-300 flex items-center gap-1">
                                    ⭐ {item.rating.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        {/* Hover shine effect */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0"
                            style={{
                                opacity: isHovered ? 1 : 0,
                            }}
                            animate={{
                                opacity: isHovered ? [0, 1, 0] : 0,
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: isHovered ? Infinity : 0,
                            }}
                        />
                    </div>

                    {/* Glass morphism top bar */}
                    <motion.div
                        className="absolute top-0 left-0 right-0 p-3 bg-white/5 backdrop-blur-md border-b border-white/10"
                        style={{
                            opacity: isHovered ? 1 : 0,
                            translateY: isHovered ? 0 : -20,
                        }}
                    >
                        <div className="flex items-center justify-between text-xs text-white/60">
                            <span>{item.language}</span>
                            <span>{item.genres[0]}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Floating accent layer (appears behind on hover) */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl"
                    style={{
                        z: -15,
                        scale: 0.95,
                    }}
                    animate={{
                        opacity: isHovered ? 0.8 : 0,
                        scale: isHovered ? 1.1 : 0.95,
                    }}
                />
            </motion.div>
        </motion.div>
    );
}
