import { useState } from 'react';
import ReactPlayer from 'react-player';
import { ArrowLeft, Lightbulb, LightbulbOff, Link as LinkIcon, AlertCircle, Play, Pause, Volume2, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Force cast to avoid strict type issues with the library
const Player = ReactPlayer as unknown as React.ComponentType<any>;

interface StreamRoomProps {
    onBack: () => void;
}

// Helper to convert various platform URLs to embed format
function convertToEmbedUrl(url: string): string {
    const trimmedUrl = url.trim();

    // YouTube (regular videos and shorts)
    const youtubePatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of youtubePatterns) {
        const match = trimmedUrl.match(pattern);
        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}`;
        }
    }

    // Twitch (videos and clips)
    const twitchVideoMatch = trimmedUrl.match(/twitch\.tv\/videos\/(\d+)/);
    if (twitchVideoMatch && twitchVideoMatch[1]) {
        return `https://player.twitch.tv/?video=${twitchVideoMatch[1]}&parent=${window.location.hostname}`;
    }

    const twitchClipMatch = trimmedUrl.match(/twitch\.tv\/\w+\/clip\/([a-zA-Z0-9_-]+)/);
    if (twitchClipMatch && twitchClipMatch[1]) {
        return `https://clips.twitch.tv/embed?clip=${twitchClipMatch[1]}&parent=${window.location.hostname}`;
    }

    // Vimeo
    const vimeoMatch = trimmedUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // TikTok
    const tiktokMatch = trimmedUrl.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
    if (tiktokMatch && tiktokMatch[1]) {
        return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
    }

    // Dailymotion
    const dailymotionMatch = trimmedUrl.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
    if (dailymotionMatch && dailymotionMatch[1]) {
        return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
    }

    return trimmedUrl; // Return original if no conversion needed
}

export default function StreamRoom({ onBack }: StreamRoomProps) {
    const [url, setUrl] = useState('');
    const [playingUrl, setPlayingUrl] = useState('');
    const [sterileMode, setSterileMode] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'video' | 'embed'>('video');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsLoading(true);
        setError('');

        // Simulate brief loading state for better UX
        setTimeout(() => {
            // If in Video Mode, use raw URL and let ReactPlayer handle it
            if (mode === 'video') {
                const canPlay = (ReactPlayer as any).canPlay;
                if (canPlay && !canPlay(url)) {
                    setError("Signal Incompatible. Switch to 'Web Protocol'.");
                    setIsLoading(false);
                    return;
                }
                setPlayingUrl(url);
            } else {
                const processedUrl = convertToEmbedUrl(url);
                setPlayingUrl(processedUrl);
            }
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className={`fixed inset-0 z-50 transition-colors duration-1000 ${sterileMode ? 'bg-black' : 'bg-slate-900'} text-cyan-50 font-mono overflow-hidden flex flex-col`}>
            {/* Clinical Header */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`p-4 flex items-center justify-between border-b border-cyan-900/30 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-500 ${sterileMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
            >
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBack}
                        className="p-2 rounded-lg border border-cyan-900/50 hover:bg-cyan-900/20 text-cyan-400 transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </motion.button>
                    <div>
                        <h1 className="text-xl font-bold tracking-widest uppercase text-cyan-400 flex items-center gap-2">
                            Isolation Ward <span className="text-xs bg-cyan-900/50 px-2 py-0.5 rounded text-cyan-200">UNIT-{Math.floor(Math.random() * 999)}</span>
                        </h1>
                        <div className="flex items-center gap-2 text-[10px] text-cyan-600 uppercase tracking-wider">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span>Live • Secure Stream</span>
                        </div>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSterileMode(!sterileMode)}
                    className="p-3 rounded-lg border border-cyan-900/50 hover:bg-cyan-900/20 text-cyan-400 transition-all"
                    title="Cinema Mode"
                >
                    {sterileMode ? <Lightbulb size={20} /> : <LightbulbOff size={20} />}
                </motion.button>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
                {/* Video Player Area */}
                <AnimatePresence mode="wait">
                    {playingUrl ? (
                        <motion.div
                            key="player"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ type: 'spring', duration: 0.6 }}
                            className="w-full max-w-6xl aspect-video relative rounded-2xl overflow-hidden shadow-2xl shadow-cyan-900/30 border border-cyan-900/30"
                        >
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-10"
                                >
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                                        <p className="text-cyan-400 text-sm uppercase tracking-wider animate-pulse">Initializing Stream...</p>
                                    </div>
                                </motion.div>
                            )}

                            {mode === 'video' ? (
                                <Player
                                    url={playingUrl}
                                    playing={isPlaying}
                                    controls
                                    width="100%"
                                    height="100%"
                                    onReady={() => setIsLoading(false)}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    config={{
                                        youtube: { playerVars: { modestbranding: 1 } },
                                    }}
                                />
                            ) : (
                                <iframe
                                    src={playingUrl}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    onLoad={() => setIsLoading(false)}
                                />
                            )}

                            {/* Glass morphism overlay controls */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="absolute bottom-4 left-4 right-4 p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                        {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
                                    </button>
                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                        <Volume2 size={18} className="text-white" />
                                    </button>
                                </div>
                                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <Maximize size={18} className="text-white" />
                                </button>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-6xl aspect-video bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-dashed border-cyan-900/50 rounded-2xl flex items-center justify-center"
                        >
                            <div className="text-center space-y-4">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-20 h-20 mx-auto bg-cyan-900/20 rounded-full flex items-center justify-center"
                                >
                                    <Play size={40} className="text-cyan-400 ml-1" />
                                </motion.div>
                                <p className="text-cyan-600 text-sm uppercase tracking-wider">Awaiting Stream Input</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Area */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-3xl"
                >
                    <form onSubmit={handlePlay} className="space-y-4">
                        {/* URL Input */}
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500 w-5 h-5" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste stream URL (YouTube, Vimeo, MP4, etc.)"
                                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-cyan-900/50 rounded-xl text-white placeholder-cyan-700 focus:outline-none focus:border-cyan-500 focus:bg-slate-800 transition-all"
                            />
                        </div>

                        {/* Mode Toggle & Submit */}
                        <div className="flex gap-3">
                            <div className="flex-1 flex gap-2 bg-slate-800/30 p-1 rounded-lg border border-cyan-900/30">
                                <button
                                    type="button"
                                    onClick={() => setMode('video')}
                                    className={`flex-1 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${mode === 'video'
                                            ? 'bg-cyan-900 text-cyan-100'
                                            : 'text-cyan-600 hover:text-cyan-400'
                                        }`}
                                >
                                    Video Mode
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('embed')}
                                    className={`flex-1 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${mode === 'embed'
                                            ? 'bg-cyan-900 text-cyan-100'
                                            : 'text-cyan-600 hover:text-cyan-400'
                                        }`}
                                >
                                    Web Protocol
                                </button>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="px-8 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/30 hover:shadow-xl hover:shadow-cyan-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider text-sm"
                            >
                                {isLoading ? 'Loading...' : 'Initialize'}
                            </motion.button>
                        </div>

                        {/* Error Display */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 bg-red-900/20 border border-red-900/50 text-red-200 px-4 py-3 rounded-lg text-sm"
                                >
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    {/* Info Badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-4 flex flex-wrap gap-2"
                    >
                        {['YouTube', 'Vimeo', 'Twitch', 'MP4', 'M3U8'].map((platform, i) => (
                            <motion.span
                                key={platform}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="px-3 py-1 bg-cyan-900/20 border border-cyan-900/30 rounded-full text-xs text-cyan-400 uppercase tracking-wider"
                            >
                                {platform}
                            </motion.span>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
