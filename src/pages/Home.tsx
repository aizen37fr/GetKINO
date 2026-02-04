import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
// import { db } from '../data/db'; // Removed direct DB access
import { fetchContent } from '../services/api';
import type { ContentItem, Mood } from '../data/db';
import { Globe, MessageCircle } from 'lucide-react';
// import SwipeDeck from '../components/SwipeDeck'; // Replaced by Cylinder
// import CylinderDeck from '../components/CylinderDeck';
import Background from '../components/Background';
import GalaxyView from '../components/GalaxyView';
import StreamRoom from './StreamRoom';
import GlobalChat from '../components/GlobalChat';
import { mapVibeToQuery } from '../utils/vibeMapper';
import { Sparkles, MonitorPlay, Dna, LogOut, Users } from 'lucide-react'; // Added Dna icon
import CineDetective from '../components/CineDetective';
import ReelDNAView from '../components/ReelDNAView';
import PharmacistHero from '../components/PharmacistHero';
import SocialView from '../components/SocialView';
import PrescriptionModal from '../components/PrescriptionModal';

export default function HomePage({ onStartMatch }: { onStartMatch?: () => void }) {
    const { } = useAuth();
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null); // For Prescription Modal
    const [items, setItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Event Listener for CineDetective
    useEffect(() => {
        const handleOpenDetective = () => setShowDetective(true);
        document.addEventListener('open-detective', handleOpenDetective);
        return () => document.removeEventListener('open-detective', handleOpenDetective);
    }, []);

    // Effect to fetch data when criteria change
    useEffect(() => {
        if (!selectedMood) return;

        const loadData = async () => {
            setLoading(true);
            // Defaulting to 'movie', 'English', and no provider/genre filtering for now since legacy UI is gone
            const data = await fetchContent('movie', selectedMood, 'English', undefined);

            setItems(data);
            setLoading(false);
        };

        loadData();
    }, [selectedMood]);

    const finalItems = items;
    // Fallback logic is now handled in api.ts

    // Watchlist & Social & Stream State
    const [showWatchlist, setShowWatchlist] = useState(false);
    const [showSocial, setShowSocial] = useState(false);
    const [showStreamRoom, setShowStreamRoom] = useState(false);

    const [showGlobalChat, setShowGlobalChat] = useState(false);
    const [showDetective, setShowDetective] = useState(false);
    const [showDNA, setShowDNA] = useState(false);
    const { watchlist, removeFromWatchlist, logout } = useAuth(); // Get watchlist data



    if (selectedMood) {
        return (
            <div className="min-h-screen bg-black relative flex flex-col z-50">
                {/* Background Ambience */}
                <div className="absolute inset-0 bg-no-repeat bg-cover bg-center opacity-30 blur-3xl scale-110"
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=2000&auto=format&fit=crop)' }} />

                <div className="relative z-10 flex-1 p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => setSelectedMood(null)}
                            className="text-white/50 hover:text-white px-4 py-2"
                        >
                            &larr; Back to Vibe
                        </button>
                        <div className="flex flex-col items-center">
                            <h2 className="text-xl font-bold bg-white/10 px-4 py-1 rounded-full backdrop-blur-md">
                                {selectedMood}
                            </h2>
                        </div>
                        <div className="w-20" /> {/* Spacer */}
                    </div>

                    <div className="flex-1 mb-20 flex items-center justify-center">
                        {loading ? (
                            <div className="relative flex flex-col items-center justify-center py-20">
                                {/* Neural Scanner Animation */}
                                <div className="relative w-64 h-64">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 rounded-full border border-purple-500/20"
                                    />
                                    <motion.div
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-4 rounded-full border border-blue-500/20 border-dashed"
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-gradient-radial from-purple-500/10 to-transparent blur-xl"
                                    />

                                    {/* Scanning Beam */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-purple-500/20 to-transparent w-1 h-full mx-auto"
                                    />

                                    {/* Central Core */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-20 h-20 bg-black rounded-full border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                                            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mt-8 mb-2">
                                    Synthesizing Vibe...
                                </h3>
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        ) : (
                            <GalaxyView items={finalItems} onSelect={(item) => setSelectedItem(item)} />
                        )}
                        <AnimatePresence>
                            {selectedItem && (
                                <PrescriptionModal
                                    item={selectedItem}
                                    onClose={() => setSelectedItem(null)}
                                    diagnosticCode="VIBE-MATCH-01"
                                    prescriptionType="Recommended Watch"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        );
    }

    // ... rest of Home return ...


    // ... (rest of search logic)

    return (
        <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
            <Background />

            {/* Header */}
            <header className="p-4 md:p-6 flex flex-col gap-4 relative z-10 sticky top-0 bg-background/80 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            {/* New Logo / Branding */}
                            <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                                KINO
                            </h1>
                            <p className="text-gray-400 text-xs">Social Cinema</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Big Match Button */}
                        <button
                            onClick={onStartMatch}
                            className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        >
                            <Users size={16} /> Swipe Party
                        </button>

                        <button
                            onClick={logout}
                            className="text-white/50 hover:text-white"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                <PharmacistHero onPrescribe={(s) => {
                    const result = mapVibeToQuery(s);
                    if (result) setSelectedMood(result.mood);
                    else alert("Symptom unclear. Try 'sad', 'happy', 'anxious'...");
                }} />

                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 justify-center">
                    {/* Reel DNA Button */}
                    <button
                        onClick={() => setShowDNA(true)}
                        className="p-2 md:p-3 bg-purple-500/20 border border-purple-500/50 rounded-full hover:bg-purple-500 hover:text-white transition-all text-purple-400 flex items-center gap-2"
                        title="My Reel DNA"
                    >
                        <Dna size={18} className="md:w-5 md:h-5" />
                    </button>

                    {/* Stream Room Button */}
                    <button
                        onClick={() => setShowStreamRoom(true)}
                        className="p-2 md:p-3 bg-blue-500/20 border border-blue-500/50 rounded-full hover:bg-blue-500 hover:text-white transition-all text-blue-400 flex items-center gap-2"
                        title="Universal Stream"
                    >
                        <MonitorPlay size={18} className="md:w-5 md:h-5" />
                    </button>

                    {/* Social / Chat Toggle */}
                    <button
                        onClick={() => setShowSocial(true)}
                        className="p-2 md:p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3" /><path d="M21 12.1H3" /><path d="M15.1 18H3" /></svg>
                    </button>

                    {/* Watchlist Toggle */}
                    <button
                        onClick={() => setShowWatchlist(true)}
                        className="p-2 md:p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors relative"
                    >
                        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        {watchlist.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full text-[10px] md:text-xs flex items-center justify-center font-bold">
                                {watchlist.length}
                            </span>
                        )}
                    </button>

                    {/* Global Chat Button */}
                    <button
                        onClick={() => setShowGlobalChat(true)}
                        className="p-2 md:p-3 bg-green-500/20 border border-green-500/50 rounded-full hover:bg-green-500 hover:text-white transition-all text-green-400 flex items-center gap-2"
                        title="Global Chat"
                    >
                        <Globe size={18} className="md:w-5 md:h-5" />
                    </button>
                </div>

                {/* Vibe Search Bar */}

            </header>

            {/* Views Overlay */}
            <AnimatePresence>
                {showSocial && <SocialView onClose={() => setShowSocial(false)} />}
                {showStreamRoom && <StreamRoom onBack={() => setShowStreamRoom(false)} />}
                <GlobalChat isOpen={showGlobalChat} onClose={() => setShowGlobalChat(false)} />
                <GlobalChat isOpen={showGlobalChat} onClose={() => setShowGlobalChat(false)} />
                {showDetective && <CineDetective onClose={() => setShowDetective(false)} />}
                <ReelDNAView isOpen={showDNA} onClose={() => setShowDNA(false)} />
            </AnimatePresence>

            {/* Watchlist Drawer */}
            <AnimatePresence>
                {showWatchlist && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowWatchlist(false)}
                            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-surface rounded-t-3xl z-50 border-t border-white/10 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                                <h2 className="text-2xl font-bold">My Watchlist ({watchlist.length})</h2>
                                <button onClick={() => setShowWatchlist(false)} className="p-2 bg-white/10 rounded-full">
                                    <span className="sr-only">Close</span>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 md:grid-cols-4 gap-4">
                                {watchlist.length === 0 ? (
                                    <div className="col-span-2 text-center text-gray-400 py-10">
                                        <p className="text-lg">No movies saved yet.</p>
                                        <p className="text-sm">Swipe right on a card to add it here!</p>
                                    </div>
                                ) : (
                                    watchlist.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="relative group rounded-xl overflow-hidden aspect-[2/3]"
                                        >
                                            <img src={item.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3 opacity-100 transition-opacity duration-300">
                                                <h3 className="font-bold text-sm truncate">{item.title}</h3>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-xs text-yellow-400">★ {item.rating}</span>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.id); }}
                                                        className="p-1.5 bg-red-500/80 rounded-full hover:bg-red-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="relative z-10 p-6 space-y-8 max-w-4xl mx-auto">


            </div>
        </div>
    );
}
