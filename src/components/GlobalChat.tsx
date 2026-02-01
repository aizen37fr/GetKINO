import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

type Message = {
    id: string;
    text: string;
    userId: string;
    userName: string;
    timestamp: number;
    isSystem?: boolean;
};

interface GlobalChatProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GlobalChat({ isOpen, onClose }: GlobalChatProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newItem, setNewItem] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<any>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Connect to Supabase Realtime
    useEffect(() => {
        if (!isOpen || !supabase || channelRef.current) return;

        console.log("Connecting to Global Chat...");
        const channel = supabase.channel('global-chat-room')
            .on('broadcast', { event: 'message' }, (payload: any) => {
                const msg = payload.payload as Message;
                setMessages(prev => [...prev, msg].slice(-100)); // Keep last 100
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Send join message
                    const joinMsg: Message = {
                        id: Date.now().toString(),
                        text: `${user?.name || 'Someone'} joined the party`,
                        userId: 'system',
                        userName: 'System',
                        timestamp: Date.now(),
                        isSystem: true
                    };
                    setMessages(prev => [...prev, joinMsg]);
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current && supabase) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [isOpen, user?.name]);

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newItem.trim() || !user || !channelRef.current) return;

        const msg: Message = {
            id: Date.now().toString(),
            text: newItem.trim(),
            userId: user.id || 'anon',
            userName: user.name || 'Guest',
            timestamp: Date.now()
        };

        // Add locally immediately for speed
        setMessages(prev => [...prev, msg]);
        setNewItem('');

        // Broadcast to others
        await channelRef.current.send({
            type: 'broadcast',
            event: 'message',
            payload: msg
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm md:hidden"
                    />

                    {/* Drawer / Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full md:w-96 bg-gray-900 border-l border-white/10 z-[70] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-500/20 rounded-full animate-pulse">
                                    <MessageSquare size={18} className="text-green-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-white">Global Chat 🌍</h2>
                                    <p className="text-xs text-gray-400">Live with everyone online</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900 to-black"
                        >
                            {messages.length === 0 && (
                                <div className="text-center text-gray-500 mt-10">
                                    <p>No messages yet.</p>
                                    <p className="text-sm">Say hello to the world! 👋</p>
                                </div>
                            )}

                            {messages.map((msg, index) => {
                                const isMe = msg.userId === user?.id;
                                const isSystem = msg.isSystem;

                                if (isSystem) {
                                    return (
                                        <div key={index} className="flex justify-center my-2">
                                            <span className="text-[10px] bg-white/5 text-gray-400 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                                                {msg.text}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-3 ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white/10 text-gray-200 rounded-bl-none'
                                            }`}>
                                            {!isMe && (
                                                <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                                                    <UserIcon size={10} />
                                                    {msg.userName}
                                                </div>
                                            )}
                                            <p className="text-sm break-words leading-relaxed">{msg.text}</p>
                                            <span className="text-[10px] opacity-50 block text-right mt-1">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-black/40">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!newItem.trim()}
                                    className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
