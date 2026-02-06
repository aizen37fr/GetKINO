/**
 * AnimatedBackground Component
 * Creates floating orbs with smooth animations
 */

import { motion } from 'framer-motion';

export function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

            {/* Animated Orbs */}
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full blur-3xl"
                    style={{
                        width: `${Math.random() * 400 + 200}px`,
                        height: `${Math.random() * 400 + 200}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        background: i % 3 === 0
                            ? 'radial-gradient(circle, rgba(0, 245, 255, 0.15), transparent)'
                            : i % 3 === 1
                                ? 'radial-gradient(circle, rgba(168, 85, 247, 0.15), transparent)'
                                : 'radial-gradient(circle, rgba(236, 72, 153, 0.15), transparent)'
                    }}
                    animate={{
                        x: [0, Math.random() * 100 - 50, 0],
                        y: [0, Math.random() * 100 - 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
    );
}
