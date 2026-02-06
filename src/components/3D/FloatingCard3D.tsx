/**
 * FloatingCard3D Component
 * 3D card with tilt effect, glassmorphism, and holographic shine
 */

import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import type { ReactNode } from 'react';

interface FloatingCard3DProps {
    children: ReactNode;
    className?: string;
    glowColor?: string;
    tiltMaxAngle?: number;
    scale?: number;
}

export function FloatingCard3D({
    children,
    className = '',
    glowColor = 'rgba(0, 245, 255, 0.3)',
    tiltMaxAngle = 10,
    scale = 1.03
}: FloatingCard3DProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -10 }}
            transition={{ duration: 0.3 }}
            className={`floating-card-container ${className}`}
        >
            <Tilt
                tiltMaxAngleX={tiltMaxAngle}
                tiltMaxAngleY={tiltMaxAngle}
                scale={scale}
                transitionSpeed={400}
                glareEnable={true}
                glareMaxOpacity={0.3}
                glareColor={glowColor}
                glarePosition="all"
                glareBorderRadius="24px"
            >
                <div className="relative rounded-3xl overflow-hidden
                    bg-gradient-to-br from-slate-900/90 to-slate-800/80
                    backdrop-blur-xl border border-cyan-500/20
                    shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                    hover:shadow-[0_8px_32px_${glowColor}]
                    transition-all duration-300
                    group">

                    {/* Holographic shine overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr 
                        from-transparent via-white/5 to-transparent
                        opacity-0 group-hover:opacity-100 
                        transition-opacity duration-500
                        pointer-events-none"
                    />

                    {/* Animated gradient border */}
                    <div className="absolute inset-0 rounded-3xl
                        bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20
                        opacity-0 group-hover:opacity-100
                        blur-xl transition-opacity duration-500
                        -z-10"
                    />

                    {/* Content */}
                    <div className="relative z-10">
                        {children}
                    </div>
                </div>
            </Tilt>
        </motion.div>
    );
}
