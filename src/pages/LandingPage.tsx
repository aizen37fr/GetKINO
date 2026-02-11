import { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Upload, Search, Sparkles, Zap, Globe, TrendingUp, Film, ArrowRight, Check, Play, X, LogIn, UserPlus, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
    onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
    const { scrollY } = useScroll();
    const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
    const heroScale = useTransform(scrollY, [0, 300], [1, 0.8]);
    const { user, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: 'reverse',
                    }}
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
                        backgroundSize: '100% 100%',
                    }}
                />
                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
                        backgroundSize: '100px 100px',
                    }}
                />
            </div>

            {/* Navigation */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="relative z-50 flex items-center justify-between px-6 md:px-12 py-6 backdrop-blur-md bg-slate-950/50 border-b border-white/5"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-3"
                >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                        <Film className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            KINO
                        </h1>
                        <p className="text-xs text-gray-400">Smart Cinema</p>
                    </div>
                </motion.div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full"
                            >
                                <User size={18} className="text-purple-400" />
                                <span className="text-sm">{user.name}</span>
                            </motion.div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onGetStarted}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 bg-pos-0 hover:bg-pos-100 rounded-full font-bold shadow-lg shadow-purple-500/50 transition-all duration-300 flex items-center gap-2"
                            >
                                Get Started
                                <ArrowRight size={18} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={logout}
                                className="px-6 py-2 text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                <span className="hidden md:inline">Logout</span>
                            </motion.button>
                        </>
                    ) : (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setAuthMode('login');
                                    setShowAuthModal(true);
                                }}
                                className="px-6 py-2 text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <LogIn size={18} />
                                Login
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setAuthMode('signup');
                                    setShowAuthModal(true);
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 bg-pos-0 hover:bg-pos-100 rounded-full font-bold shadow-lg shadow-purple-500/50 transition-all duration-300 flex items-center gap-2"
                            >
                                <UserPlus size={18} />
                                Sign Up
                            </motion.button>
                        </>
                    )}
                </div>
            </motion.nav>

            {/* Auth Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <AuthModal
                        mode={authMode}
                        onClose={() => setShowAuthModal(false)}
                        onSwitchMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    />
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <motion.section
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="relative z-10 min-h-screen flex items-center justify-center px-6 md:px-12 pt-20 pb-32"
            >
                <div className="max-w-6xl mx-auto text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-8"
                    >
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-300">AI-Powered Detection</span>
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
                    >
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-pink-200">
                            Find Any Show
                        </span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                            From a Screenshot
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto"
                    >
                        Upload any image, get instant recommendations. Works with anime, movies, TV shows, K-dramas, and more.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onGetStarted}
                            className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-lg shadow-2xl shadow-purple-500/50 flex items-center gap-3 relative overflow-hidden"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                            <Upload className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">Upload Screenshot</span>
                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg backdrop-blur-sm hover:bg-white/10 transition-all flex items-center gap-3"
                        >
                            <Play className="w-5 h-5" />
                            See Demo
                        </motion.button>
                    </motion.div>

                    {/* Social Proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-wrap items-center justify-center gap-8 text-gray-400"
                    >
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-400" />
                            <span>Instant Results</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-400" />
                            <span>50+ Languages</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-400" />
                            <span>Unlimited Searches</span>
                        </div>
                    </motion.div>

                    {/* Hero Image/Demo */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mt-20 relative"
                    >
                        <div className="relative max-w-4xl mx-auto">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl rounded-3xl" />

                            {/* Screenshot Preview */}
                            <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl">
                                <div className="grid md:grid-cols-2 gap-6 items-center">
                                    {/* Before */}
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-400 uppercase tracking-wider">Upload</p>
                                        <div className="aspect-video bg-slate-900/50 rounded-xl border border-purple-500/30 flex items-center justify-center">
                                            <Upload className="w-12 h-12 text-purple-400" />
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <ArrowRight className="w-8 h-8 text-purple-400" />
                                    </div>

                                    {/* After */}
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-400 uppercase tracking-wider">Get Results</p>
                                        <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30 p-4 flex flex-col justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-16 bg-purple-500/20 rounded" />
                                                <div>
                                                    <div className="h-4 w-32 bg-purple-400/30 rounded mb-2" />
                                                    <div className="h-3 w-20 bg-purple-400/20 rounded" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="h-2 w-full bg-purple-400/20 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2"
                >
                    <div className="w-6 h-10 border-2 border-purple-400/30 rounded-full flex justify-center p-1">
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                        />
                    </div>
                </motion.div>
            </motion.section>

            {/* Features Section */}
            <section className="relative z-10 py-32 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-4">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                Powerful Features
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Everything you need to discover and track your favorite content
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <FeatureCard key={idx} feature={feature} index={idx} />
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="relative z-10 py-32 px-6 md:px-12 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-4">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                How It Works
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400">
                            Three simple steps to discover your next favorite show
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connection Lines */}
                        <div className="hidden md:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0" />

                        {steps.map((step, idx) => (
                            <StepCard key={idx} step={step} index={idx} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-32 px-6 md:px-12">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-3xl p-12 md:p-16 overflow-hidden">
                        {/* Animated Background */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl"
                        />

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black mb-6">
                                Ready to Start Discovering?
                            </h2>
                            <p className="text-xl text-gray-300 mb-10">
                                Join thousands of users finding their next favorite show
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onGetStarted}
                                className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl shadow-2xl shadow-purple-500/50 flex items-center gap-3 mx-auto"
                            >
                                <Sparkles className="w-6 h-6" />
                                Start Detecting Now
                                <ArrowRight className="w-6 h-6" />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 px-6 md:px-12 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                            <Film className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg">KINO</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        © 2026 KINO. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

// Feature Card Component
function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="group relative backdrop-blur-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300"
        >
            {/* Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-2xl transition-all duration-300" />

            <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/80 transition-all">
                    <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
        </motion.div>
    );
}

// Step Card Component
function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            className="relative text-center"
        >
            {/* Number Badge */}
            <div className="relative z-10 mb-6 flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl shadow-purple-500/50">
                    {index + 1}
                </div>
            </div>

            <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
            <p className="text-gray-400 leading-relaxed">{step.description}</p>
        </motion.div>
    );
}

const features = [
    {
        icon: Upload,
        title: 'Upload Anything',
        description: 'Screenshots, posters, or even video clips. Our AI handles it all with precision.',
    },
    {
        icon: Zap,
        title: 'Instant Detection',
        description: 'Get results in seconds. Powered by advanced AI and machine learning algorithms.',
    },
    {
        icon: Globe,
        title: 'Universal Support',
        description: 'Works with anime, movies, TV shows, K-dramas, C-dramas, and more from around the world.',
    },
    {
        icon: Search,
        title: 'Smart Search',
        description: 'AI-powered search understands context and finds exactly what you\'re looking for.',
    },
    {
        icon: TrendingUp,
        title: 'Trending Insights',
        description: 'Discover what\'s popular and get personalized recommendations based on your taste.',
    },
    {
        icon: Sparkles,
        title: 'Mood-Based Discovery',
        description: 'Tell us how you feel, and we\'ll recommend the perfect show for your mood.',
    },
];

const steps = [
    {
        title: 'Upload Your Screenshot',
        description: 'Drag and drop any image or screenshot from a show, movie, or anime.',
    },
    {
        title: 'AI Analyzes It',
        description: 'Our advanced AI instantly identifies the content with incredible accuracy.',
    },
    {
        title: 'Get Instant Results',
        description: 'See detailed information, ratings, streaming options, and personalized recommendations.',
    },
];

// Auth Modal Component
function AuthModal({ mode, onClose, onSwitchMode }: { mode: 'login' | 'signup'; onClose: () => void; onSwitchMode: () => void }) {
    const { signIn, signUp } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                const { error: authError } = await signIn(username, password);
                if (authError) {
                    setError(authError.message || 'Login failed');
                } else {
                    onClose();
                }
            } else {
                const { error: authError } = await signUp(username, password, name || username);
                if (authError) {
                    setError(authError.message || 'Signup failed');
                } else {
                    onClose();
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-md backdrop-blur-xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-purple-500/30 rounded-3xl p-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 bg-red-500/20 hover:bg-red-500 border border-red-500/50 rounded-full flex items-center justify-center transition-all"
                >
                    <X size={20} />
                </motion.button>

                {/* Header */}
                <div className="mb-8">
                    <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-3 mb-4"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                            {mode === 'login' ? <LogIn size={24} /> : <UserPlus size={24} />}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black">
                                {mode === 'login' ? 'Welcome Back' : 'Join KINO'}
                            </h2>
                            <p className="text-sm text-gray-400">
                                {mode === 'login' ? 'Login to continue' : 'Create your account'}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                                placeholder="John Doe"
                            />
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: mode === 'signup' ? 0.3 : 0.2 }}
                    >
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                            placeholder="johndoe"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: mode === 'signup' ? 0.4 : 0.3 }}
                    >
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                            placeholder="••••••••"
                        />
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
                    </motion.button>
                </form>

                {/* Switch Mode */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-center"
                >
                    <p className="text-gray-400 text-sm">
                        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                        {' '}
                        <button
                            type="button"
                            onClick={onSwitchMode}
                            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                        >
                            {mode === 'login' ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

