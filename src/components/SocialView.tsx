import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronLeft, MoreVertical, Phone, Video, UserPlus, Copy } from 'lucide-react';
import { GROUPS } from '../data/socialMock';
import { useAuth } from '../context/AuthContext';

interface Message {
    id: string;
    text: string;
    senderId: string; // 'me' or other
    timestamp: string;
}

export default function SocialView({ onClose }: { onClose: () => void }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'groups' | 'chats'>('groups');
    const [selectedChat, setSelectedChat] = useState<any | null>(null);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendIdInput, setFriendIdInput] = useState('');

    // Default chats
    const [chats, setChats] = useState([
        { id: 'u2', name: 'Sarah', lastMessage: 'See you then!', time: 'Now' },
        { id: 'u3', name: 'Mike', lastMessage: 'That movie was crazy', time: '1h ago' }
    ]);

    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'Hey! What are we watching?', senderId: 'u2', timestamp: '8:30 PM' },
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg: Message = {
            id: Date.now().toString(),
            text: input,
            senderId: 'me',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([...messages, newMsg]);
        setInput('');

        // Simulate reply
        setTimeout(() => {
            const reply: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Sounds great! Let\'s do it! 🍿',
                senderId: 'other',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, reply]);
        }, 1500);
    };

    const handleAddFriend = () => {
        if (!friendIdInput.trim()) return;
        // Simulate adding a friend
        const newFriend = {
            id: friendIdInput,
            name: `User ${friendIdInput}`,
            lastMessage: 'New connection',
            time: 'Just now'
        };
        setChats([newFriend, ...chats]);
        setFriendIdInput('');
        setShowAddFriend(false);
        alert(`Friend ${newFriend.name} added!`);
        // Switch to DMs tab
        setActiveTab('chats');
    };

    const copyId = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            alert('ID copied to clipboard!');
        }
    };

    return (
        <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-black/95 z-[60] flex flex-col md:max-w-md md:left-auto md:border-l md:border-white/10"
        >
            <AnimatePresence mode="wait">
                {!selectedChat ? (
                    // Chat List View
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col h-full"
                    >
                        {/* Header */}
                        <header className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">Social 💬</h2>
                                <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                                    <ChevronLeft size={24} />
                                </button>
                            </div>

                            {/* User ID Display */}
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center font-bold text-lg">
                                        {user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{user?.name}</p>
                                        <p className="text-xs text-primary font-mono">{user?.id || '#----'}</p>
                                    </div>
                                </div>
                                <button onClick={copyId} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white" title="Copy ID">
                                    <Copy size={18} />
                                </button>
                            </div>
                        </header>

                        {/* Tabs */}
                        <div className="flex p-4 gap-4">
                            <button
                                onClick={() => setActiveTab('groups')}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'groups' ? 'bg-primary text-white shadow-lg shadow-red-900/20' : 'bg-white/5 text-gray-400'}`}
                            >
                                Groups
                            </button>
                            <button
                                onClick={() => setActiveTab('chats')}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'chats' ? 'bg-primary text-white shadow-lg shadow-red-900/20' : 'bg-white/5 text-gray-400'}`}
                            >
                                Direct
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {activeTab === 'groups' ? (
                                GROUPS.map(group => (
                                    <motion.div
                                        key={group.id}
                                        layoutId={group.id}
                                        onClick={() => setSelectedChat(group)}
                                        className="p-4 bg-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 cursor-pointer border border-white/5"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl font-bold text-white">
                                            {group.name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className="font-bold text-lg">{group.name}</h3>
                                                <span className="text-xs text-gray-500">{group.time}</span>
                                            </div>
                                            <p className="text-gray-400 text-sm truncate">{group.lastMessage}</p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <>
                                    {/* Add Friend Trigger */}
                                    <button
                                        onClick={() => setShowAddFriend(!showAddFriend)}
                                        className="w-full py-3 border border-dashed border-white/20 rounded-xl hover:bg-white/5 text-gray-400 flex items-center justify-center gap-2 mb-4"
                                    >
                                        <UserPlus size={18} /> Add Friend by ID
                                    </button>

                                    {/* Add Friend Input */}
                                    <AnimatePresence>
                                        {showAddFriend && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden mb-4"
                                            >
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter friend's ID (e.g. #1234)"
                                                        value={friendIdInput}
                                                        onChange={(e) => setFriendIdInput(e.target.value)}
                                                        className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                    <button
                                                        onClick={handleAddFriend}
                                                        disabled={!friendIdInput.trim()}
                                                        className="bg-primary px-4 rounded-xl font-bold disabled:opacity-50"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {chats.map(chat => (
                                        <motion.div
                                            key={chat.id}
                                            onClick={() => setSelectedChat(chat)}
                                            className="p-4 bg-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 cursor-pointer border border-white/5"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-xl font-bold text-white">
                                                {chat.name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="font-bold text-lg">{chat.name}</h3>
                                                    <span className="text-xs text-gray-500">{chat.time}</span>
                                                </div>
                                                <p className="text-gray-400 text-sm truncate">{chat.lastMessage}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    // Active Chat View
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
                        className="flex-1 flex flex-col h-full bg-surface"
                    >
                        {/* Header */}
                        <header className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedChat(null)} className="p-2 hover:bg-white/10 rounded-full">
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                                    {selectedChat.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold">{selectedChat.name}</h3>
                                    <span className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 text-gray-400">
                                <button className="p-2 hover:bg-white/10 rounded-full"><Phone size={20} /></button>
                                <button className="p-2 hover:bg-white/10 rounded-full"><Video size={20} /></button>
                                <button className="p-2 hover:bg-white/10 rounded-full"><MoreVertical size={20} /></button>
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${msg.senderId === 'me'
                                        ? 'bg-primary text-white rounded-tr-none'
                                        : 'bg-white/10 text-white rounded-tl-none'
                                        }`}>
                                        <p>{msg.text}</p>
                                        <span className="text-[10px] opacity-50 mt-1 block text-right">{msg.timestamp}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10">
                            <div className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white/10 border-none rounded-full px-6 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    className="p-3 bg-primary rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-900/30"
                                >
                                    <Send size={20} fill="white" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
