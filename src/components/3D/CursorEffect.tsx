/**
 * Custom Cursor Effect
 * Creates an animated cursor with glow trail
 */

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CursorEffect() {
    const [isHovering, setIsHovering] = useState(false);
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 700 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX - 16);
            cursorY.set(e.clientY - 16);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [cursorX, cursorY]);

    return (
        <>
            {/* Main cursor */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                }}
            >
                <motion.div
                    className="w-full h-full rounded-full border-2 border-cyan-400"
                    animate={{
                        scale: isHovering ? 1.5 : 1,
                        borderColor: isHovering ? '#a855f7' : '#00f5ff'
                    }}
                    transition={{ duration: 0.2 }}
                />
            </motion.div>

            {/* Glow trail */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[9998]"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                }}
            >
                <div className="w-full h-full rounded-full bg-cyan-400/20 blur-xl" />
            </motion.div>
        </>
    );
}
