import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import CylinderDeck from '../components/CylinderDeck';
import MatchCelebration from '../components/MatchCelebration';
import { fetchContent } from '../services/api';
import { matchService } from '../services/match';
import type { ContentItem } from '../data/db';
import { Users, ArrowLeft, Copy, Zap } from 'lucide-react';

interface MatchModeProps {
    onBack: () => void;
}

export default function MatchMode({ onBack }: MatchModeProps) {
    const [view, setView] = useState<'lobby' | 'deck'>('lobby');
    const [sessionId, setSessionId] = useState('');
    const [joinCode, setJoinCode] = useState('');

    const [items, setItems] = useState<ContentItem[]>([]);
    const [matchItem, setMatchItem] = useState<ContentItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState("Waiting for friend...");

    // Setup Content
    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            try {
                // Fetch a mix for the session using the robust fetchContent (handles fallbacks)
                const movies = await fetchContent('movie', 'Excited', 'English');
                const anime = await fetchContent('anime', 'Excited', 'Japanese'); // fetchContent handles language mapping if needed

                // Combine and shuffle
                const mixed = [...movies, ...anime]
                    .filter(item => item.image) // Ensure images exist
                    .sort(() => Math.random() - 0.5);

                console.log("Match Mode items loaded:", mixed.length);
                setItems(mixed);
            } catch (err) {
                console.error("Match Mode load error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadContent();

        // Match Listener
        matchService.setMatchCallback((item) => {
            setMatchItem(item);
        });
    }, []);

    const createSession = () => {
        const id = matchService.createSession();
        setSessionId(id);
        setStatusText("Share code: " + id);
        setView('deck');
    };

    const joinSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode) return;
        matchService.joinSession(joinCode);
        setSessionId(joinCode);
        setStatusText("Connected to " + joinCode);
        setView('deck');
    };

    const handleSwipe = (item: ContentItem, direction: 'like' | 'nope') => {
        // Send to service
        matchService.sendSwipe(item, direction);

        // Also check LOCAL match logic (simple simulation if service is limited)
        // For BroadcastChannel, matchService handles logic if we had full item data.
        // But since we only pass IDs, we might need a smarter way.
        // For this demo: TRUST the service event?
        // Actually, let's keep the "Bot" logic as a fallback if no session ID provided?
        // No, let's commit to the session.
    };

    const copyCode = () => {
        navigator.clipboard.writeText(sessionId);
        alert("Code copied!");
    };

    return (
        <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden z-50">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onBack} className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors">
                    <ArrowLeft size={24} />
                </button>

                <div className="flex items-center gap-2 bg-pink-500/20 px-4 py-2 rounded-full backdrop-blur-md border border-pink-500/30 cursor-pointer" onClick={copyCode}>
                    <Users size={16} className="text-pink-400" />
                    <span className="font-bold text-sm text-pink-100">{statusText}</span>
                    {sessionId && <Copy size={12} className="text-pink-400 opacity-50" />}
                </div>
            </div>

            {view === 'lobby' ? (
                <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-6 text-center">
                    <div className="w-24 h-24 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-pink-500/20 transform rotate-3">
                        <Zap size={48} className="text-white" />
                    </div>

                    <h2 className="text-4xl font-bold mb-2">Match Mode</h2>
                    <p className="text-gray-400 mb-8">Swipe together with a friend in real-time. Open this app in two tabs to test!</p>

                    <button
                        onClick={createSession}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg mb-4 hover:scale-105 transition-transform shadow-lg"
                    >
                        Create Party
                    </button>

                    <div className="w-full flex items-center gap-2 mb-4">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-xs text-gray-500 uppercase font-bold">Or Join</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <form onSubmit={joinSession} className="w-full flex gap-2">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="Enter Code"
                            className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 text-white text-center font-bold tracking-widest placeholder-gray-600 focus:outline-none focus:border-pink-500 transition-colors"
                        />
                        <button
                            type="submit"
                            className="bg-white/10 px-6 rounded-xl font-bold hover:bg-white/20 transition-colors"
                        >
                            Join
                        </button>
                    </form>
                </div>
            ) : (
                <>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-pink-400 font-bold animate-pulse">Loading movies...</p>
                        </div>
                    ) : (
                        <CylinderDeck
                            items={items}
                            onClose={onBack}
                            onSwipe={handleSwipe}
                        />
                    )}
                </>
            )}

            <AnimatePresence>
                {matchItem && (
                    <MatchCelebration
                        item={matchItem}
                        onClose={() => setMatchItem(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
