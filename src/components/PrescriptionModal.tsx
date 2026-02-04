import { motion } from 'framer-motion';
import { X, Activity, Pill, FileText, Clock, Star, AlertTriangle, Share2, Plus } from 'lucide-react';
import type { ContentItem } from '../data/db';

interface PrescriptionModalProps {
    item: ContentItem;
    onClose: () => void;
    diagnosticCode?: string;
    prescriptionType?: string;
}

export default function PrescriptionModal({ item, onClose, diagnosticCode = "GENERIC-REQ", prescriptionType = "General Wellness" }: PrescriptionModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative w-full max-w-4xl bg-white text-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.3)] flex flex-col md:flex-row"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Left: Visuals */}
                <div className="md:w-1/3 relative h-64 md:h-auto">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover grayscale contrast-125" />
                    <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                        <div className="font-mono text-xs opacity-70">SUBJECT ID: {item.id.toUpperCase()}</div>
                    </div>
                </div>

                {/* Right: Clinical Report */}
                <div className="flex-1 p-8 bg-gray-50 flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-dashed border-gray-300 pb-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 text-cyan-600 font-bold mb-1">
                                <Activity size={18} />
                                <span className="tracking-widest uppercase text-xs">Pharma-KINO Medical Report</span>
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter">{item.title}</h2>
                        </div>
                        <div className="text-right font-mono text-xs text-gray-500">
                            <div>DIAG: {diagnosticCode}</div>
                            <div>RX: {prescriptionType.toUpperCase()}</div>
                        </div>
                    </div>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6 font-mono text-sm">
                        <div className="bg-white p-3 rounded-xl border border-gray-200">
                            <span className="text-gray-400 block text-xs mb-1">DOSAGE (RUNTIME)</span>
                            <div className="flex items-center gap-2 font-bold">
                                <Clock size={16} className="text-cyan-500" />
                                {item.type === 'movie' ? '124 MINS' : '45 MINS / DOSE'}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-200">
                            <span className="text-gray-400 block text-xs mb-1">POTENCY (RATING)</span>
                            <div className="flex items-center gap-2 font-bold text-yellow-600">
                                <Star size={16} />
                                {item.rating}/10
                            </div>
                        </div>
                    </div>

                    {/* Clinical Notes (Plot) */}
                    <div className="flex-1 mb-6">
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-2 uppercase">
                            <FileText size={14} /> Clinical Notes
                        </div>
                        <p className="text-gray-700 leading-relaxed font-serif text-lg">
                            {item.description}
                        </p>
                    </div>

                    {/* Side Effects (Genres) */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-2 uppercase">
                            <AlertTriangle size={14} /> Known Side Effects
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {item.genres.map(g => (
                                <span key={g} className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-bold uppercase tracking-wide">
                                    {g}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-4">
                        <button className="flex-1 bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-cyan-900/20">
                            <Pill size={20} className="text-cyan-400" />
                            ADMINISTER DOSE (PLAY)
                        </button>
                        <button className="p-4 border-2 border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600">
                            <Plus size={20} />
                        </button>
                        <button className="p-4 border-2 border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600">
                            <Share2 size={20} />
                        </button>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
