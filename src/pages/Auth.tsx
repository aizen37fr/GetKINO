import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight } from 'lucide-react';
import Background from '../components/Background';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email || !password || (!isLogin && !name)) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            let res;
            if (isLogin) {
                res = await signIn(email, password);
            } else {
                res = await signUp(email, password, name);
            }

            if (res.error) {
                setError(res.error.message);
            } else {
                // Success! (User state updates via onAuthStateChange)
                if (!isLogin) {
                    setError("Account created! Verify your email or try logging in.");
                }
            }
        } catch (err) {
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
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
                            {isLogin ? "Welcome back! Login to continue." : "Create an account to join the club."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 relative">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                            className="w-full bg-primary hover:bg-red-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all mt-6"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
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
