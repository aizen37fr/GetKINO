
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface HolographicCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    glowIntensity?: 'low' | 'medium' | 'high';
}

export default function HolographicCard({
    children,
    className = "",
    glowColor = "cyan",
    glowIntensity = "medium"
}: HolographicCardProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;

        const xPct = mouseXVal / width - 0.5;
        const yPct = mouseYVal / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const glowColors = {
        cyan: 'rgba(0, 245, 255, 0.4)',
        purple: 'rgba(168, 85, 247, 0.4)',
        pink: 'rgba(236, 72, 153, 0.4)',
        green: 'rgba(34, 197, 94, 0.4)'
    };

    const glowSizes = {
        low: '0 0 20px',
        medium: '0 0 30px',
        high: '0 0 50px'
    };

    const selectedGlow = glowColors[glowColor as keyof typeof glowColors] || glowColors.cyan;
    const selectedSize = glowSizes[glowIntensity];

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className={`relative transition-all duration-200 ease-out group ${className}`}
        >
            {/* Glassmorphic Container */}
            <div
                style={{
                    transform: "translateZ(75px)",
                    transformStyle: "preserve-3d",
                }}
                className="relative rounded-2xl overflow-hidden
                    bg-gradient-to-br from-slate-900/90 to-slate-800/80
                    backdrop-blur-xl border border-cyan-500/20
                    shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                    group-hover:border-cyan-500/40
                    transition-all duration-300"
            >
                {children}

                {/* Holographic Shine */}
                <div className="absolute inset-0 rounded-2xl 
                    bg-gradient-to-tr from-transparent via-white/10 to-transparent
                    opacity-0 group-hover:opacity-100 
                    transition-opacity duration-500 
                    pointer-events-none mix-blend-overlay z-50"
                />

                {/* Rainbow Edge Glow (on hover) */}
                <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                    style={{
                        boxShadow: `${selectedSize} ${selectedGlow}`,
                        filter: 'blur(10px)'
                    }}
                />
            </div>

            {/* Floating Shadow */}
            <div
                className="absolute inset-0 rounded-2xl bg-black/50 blur-2xl -z-20 
                    opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                style={{ transform: "translateZ(-50px) translateY(20px)" }}
            />
        </motion.div>
    );
}
