import { useRef, useEffect, useState } from 'react';
import type { ContentItem } from '../data/db';

interface Star {
    x: number;
    y: number;
    z: number;
    size: number;
    color: string;
    item?: ContentItem;
    speed: number;
}

interface GalaxyViewProps {
    items: ContentItem[];
    onSelect: (item: ContentItem) => void;
}

export default function GalaxyView({ items, onSelect }: GalaxyViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Engine State
    const starsRef = useRef<Star[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initialize Galaxy
        const initStars = () => {
            const stars: Star[] = [];
            // Background Stars (Dust)
            for (let i = 0; i < 400; i++) {
                stars.push({
                    x: (Math.random() - 0.5) * window.innerWidth * 2,
                    y: (Math.random() - 0.5) * window.innerHeight * 2,
                    z: Math.random() * 2000,
                    size: Math.random() * 2,
                    color: `rgba(255, 255, 255, ${Math.random() * 0.5})`,
                    speed: 0.5 + Math.random()
                });
            }

            // Content Stars (The Movies)
            items.forEach((item, i) => {
                // Distribute in a spiral
                const angle = i * 0.5;
                const radius = 200 + i * 10;
                stars.push({
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                    z: Math.random() * 500, // Depth variation
                    size: 4 + Math.random() * 4, // Larger stars for movies
                    color: item.type === 'movie' ? '#ec4899' : '#8b5cf6', // Pink movies, Purple TV
                    item: item,
                    speed: 0
                });
            });

            starsRef.current = stars;
        };

        const render = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Clear space
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Center of Galaxy
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // Draw Stars
            starsRef.current.forEach(star => {
                // 3D Perspective Projection
                const scale = 1000 / (1000 + star.z);
                const x2d = (star.x - mousePos.x * 2) * scale + cx;
                const y2d = (star.y - mousePos.y * 2) * scale + cy;

                if (star.z > -900) {
                    star.z -= star.speed; // Move forward
                    if (star.z < -1000) star.z = 2000; // Reset loop
                }

                // Draw Star
                ctx.beginPath();
                ctx.fillStyle = star.color;

                ctx.arc(x2d, y2d, star.size * scale, 0, Math.PI * 2);
                ctx.fill();

                // If massive content star, draw text
                if (star.item && scale > 0.8) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${scale * 0.5})`;
                    ctx.font = '10px Inter';
                    ctx.fillText(star.item.title.substring(0, 15), x2d + 10, y2d);
                }
            });

            animationFrameRef.current = requestAnimationFrame(render);
        };

        initStars();
        render();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [items, mousePos]);

    const handleMouseMove = (e: React.MouseEvent) => {
        // Parallax effect based on mouse from center
        const x = (e.clientX - window.innerWidth / 2) / 20;
        const y = (e.clientY - window.innerHeight / 2) / 20;
        setMousePos({ x, y });
    };

    const handleClick = () => {
        // Simple click detection (finding closest star)
        // For MVP, just selects random or first visible for demo effect
        // Real implementation would raycast
        if (items.length > 0) {
            onSelect(items[0]);
        }
    };

    return (
        <div
            className="fixed inset-0 z-0 overflow-hidden bg-black"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
        >
            <canvas ref={canvasRef} className="w-full h-full" />

            {/* Holographic Overlay UI */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 pointer-events-none">
                <p className="text-purple-400 font-mono text-xs tracking-[0.5em] animate-pulse">
                    NAVIGATING SECTOR 7G
                </p>
            </div>
        </div>
    );
}
