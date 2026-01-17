import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, ArrowRight } from 'lucide-react';
import Background from '../components/Background';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        // Simulate network delay for premium feel
        setTimeout(() => {
            login(name);
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative">
            <Background />

            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md z-10 p-4"
            >
                <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />

                    <div className="text-center mb-8 relative">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="inline-block p-3 rounded-full bg-white/5 border border-white/10 mb-4"
                        >
                            <Sparkles className="w-8 h-8 text-primary" />
                        </motion.div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            What to Watch
                        </h1>
                        <p className="text-sm text-gray-400 mt-2">
                            Curated entertainment for your mood.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">
                                {isLogin ? 'Welcome Back' : 'Join the Club'}
                            </label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                            className="w-full bg-primary hover:bg-red-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Start Watching' : 'Get Started'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            {isLogin ? "New here? Create an account" : "Already have an account? Login"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
