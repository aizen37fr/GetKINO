import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, HeartPulse, BrainCircuit, Scan } from 'lucide-react';

export default function PharmacistHero({ onPrescribe }: { onPrescribe: (symptom: string) => void }) {
    const [symptom, setSymptom] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Holographic Pill Animation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        let rotation = 0;

        const render = () => {
            canvas.width = 300;
            canvas.height = 300;
            ctx.clearRect(0, 0, 300, 300);

            const cx = 150;
            const cy = 150;

            // Pill Shape Math (Mock 3D)
            rotation += 0.02;
            const width = 100;
            const height = 40;

            // Draw Wireframe Pill
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rotation);
            ctx.rotate(Math.PI / 6); // Tilt

            // Glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#06b6d4'; // Cyan glow

            // Pill Body Left (White)
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.roundRect(-width / 2, -height / 2, width / 2, height, [height / 2, 0, 0, height / 2]);
            ctx.fill();

            // Pill Body Right (Cyan)
            ctx.beginPath();
            ctx.fillStyle = 'rgba(6, 182, 212, 0.9)'; // Cyan-500
            ctx.roundRect(0, -height / 2, width / 2, height, [0, height / 2, height / 2, 0]);
            ctx.fill();

            // Holographic Scan Lines
            for (let i = -height / 2; i < height / 2; i += 4) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(frame * 0.1 + i) * 0.5 + 0.5})`;
                ctx.fillRect(-width / 2, i, width, 1);
            }

            // Floating Particles
            /*
            for(let i=0; i<5; i++) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(
                    Math.cos(frame * 0.05 + i) * 80,
                    Math.sin(frame * 0.05 + i) * 80, 
                    2, 2
                );
            }
            */

            ctx.restore();
            frame++;
            requestAnimationFrame(render);
        };
        render();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!symptom) return;
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            onPrescribe(symptom);
        }, 2000); // Fake diagnosis time
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto my-12 p-1">
            {/* Glass Container */}
            <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.1)]">

                {/* Background Grid (Clinical) */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-center p-8 md:p-12 gap-12">

                    {/* Left: THe Interface */}
                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-wider">
                            <Activity size={14} /> SYSTEM: ONLINE
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">Pharmacist</span>.
                        </h1>
                        <p className="text-gray-400 text-lg font-light">
                            Cinema is medicine. Tell us your symptoms (mood), and we will dispense a visual prescription.
                        </p>

                        <form onSubmit={handleSubmit} className="relative max-w-md mx-auto md:mx-0">
                            <input
                                type="text"
                                value={symptom}
                                onChange={e => setSymptom(e.target.value)}
                                placeholder="I feel empty inside..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-6 pr-14 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 aspect-square bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-white rounded-lg flex items-center justify-center transition-all"
                            >
                                <Zap size={20} />
                            </button>
                        </form>

                        <div className="flex gap-4 justify-center md:justify-start text-xs text-gray-500 font-mono">
                            <span className="flex items-center gap-1"><BrainCircuit size={12} /> AI DIAGNOSIS</span>
                            <span className="flex items-center gap-1"><HeartPulse size={12} /> 99% ACCURACY</span>
                            <button
                                type="button"
                                onClick={() => document.dispatchEvent(new CustomEvent('open-detective'))}
                                className="flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer group ml-4"
                            >
                                <Scan size={12} className="group-hover:animate-spin" />
                                <span className="underline decoration-dashed underline-offset-4 decoration-cyan-500/50">SCAN IMAGE</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: The Hologram */}
                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full animate-pulse" />
                        <canvas ref={canvasRef} className="relative z-10 w-full h-full" />

                        {/* Scanning Overlay */}
                        <AnimatePresence>
                            {isScanning && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full z-20"
                                >
                                    <div className="text-cyan-400 font-mono text-xl animate-pulse tracking-widest">
                                        ANALYZING...
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

                {/* Decorative UI Lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-cyan-500/10 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
