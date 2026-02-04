import { useState } from 'react';
import ReactPlayer from 'react-player';
import { ArrowLeft, Lightbulb, LightbulbOff, Link as LinkIcon, AlertCircle } from 'lucide-react';
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
    const [lightsOff, setLightsOff] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'video' | 'embed'>('video');

    const handlePlay = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        // If in Video Mode, use raw URL and let ReactPlayer handle it
        if (mode === 'video') {
            // Basic validation
            const canPlay = (ReactPlayer as any).canPlay;
            if (canPlay && !canPlay(url)) {
                setError("Standard player can't play this. Try switching to 'Web Embed' mode.");
                return;
            }
            setPlayingUrl(url); // Use raw URL
        } else {
            // Embed Mode: Convert to embeddable format
            const processedUrl = convertToEmbedUrl(url);
            setPlayingUrl(processedUrl);
        }

        setError('');
    };

    return (
        <div className={`fixed inset-0 z-50 transition-colors duration-1000 ${lightsOff ? 'bg-black' : 'bg-gray-900'} text-white overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className={`p-4 flex items-center justify-between transition-opacity duration-500 ${lightsOff ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <ArrowLeft size={24} />
                </button>

                <div className="flex-1 max-w-3xl mx-4 flex gap-2">
                    {/* Mode Toggle */}
                    <div className="bg-black/40 p-1 rounded-xl flex shrink-0">
                        <button
                            onClick={() => setMode('video')}
                            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'video' ? 'bg-blue-600 shadow-lg' : 'hover:bg-white/10 text-gray-400'}`}
                        >
                            Video
                        </button>
                        <button
                            onClick={() => setMode('embed')}
                            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'embed' ? 'bg-purple-600 shadow-lg' : 'hover:bg-white/10 text-gray-400'}`}
                        >
                            Web Embed
                        </button>
                    </div>

                    <form onSubmit={handlePlay} className="relative group flex-1">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                            <LinkIcon size={16} />
                        </div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={mode === 'video' ? "Paste video link (YouTube, Twitch, TikTok, Vimeo)..." : "Paste website URL to embed..."}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-24 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                            type="submit"
                            className="absolute inset-y-1 right-1 bg-white/10 hover:bg-white/20 text-white px-4 rounded-lg text-sm font-bold transition-colors"
                        >
                            {mode === 'video' ? 'Play' : 'Load'}
                        </button>
                    </form>
                </div>

                <button
                    onClick={() => setLightsOff(!lightsOff)}
                    className={`p-2 rounded-full transition-colors ${lightsOff ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-gray-400'}`}
                    title={lightsOff ? "Lights On" : "Lights Off"}
                >
                    {lightsOff ? <Lightbulb size={24} /> : <LightbulbOff size={24} />}
                </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-2 rounded-full flex items-center gap-2 z-10"
                    >
                        <AlertCircle size={16} />
                        <span className="text-sm font-bold">{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Player Container */}
            <div className="flex-1 flex items-center justify-center p-4 relative">
                {playingUrl ? (
                    <div className="w-full h-full max-w-6xl max-h-[85vh] aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative">
                        {mode === 'video' ? (
                            <Player
                                url={playingUrl}
                                width="100%"
                                height="100%"
                                controls
                                playing
                                light={false}
                                onError={() => setError("Error loading video source. Try 'Web Embed' mode.")}
                            />
                        ) : (
                            <iframe
                                src={playingUrl}
                                className="w-full h-full border-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"
                            />
                        )}
                    </div>
                ) : (
                    <div className="text-center opacity-30">
                        <div className="w-24 h-24 mx-auto mb-4 border-4 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                            <LinkIcon size={40} />
                        </div>
                        <h2 className="text-2xl font-bold">Ready to Stream</h2>
                        <p>Paste a link above to start.</p>
                        <p className="text-xs mt-2 text-gray-500">
                            {mode === 'video'
                                ? "Supports YouTube, Twitch, TikTok, Vimeo, Dailymotion, and direct files."
                                : "Embeds websites directly. (Note: Some sites block embedding)"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
