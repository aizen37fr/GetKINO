import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { WatchlistItem } from '../types/watchlist';

type User = {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
};

type AuthContextType = {
    user: User | null;
    watchlist: WatchlistItem[];
    signIn: (username: string, pass: string) => Promise<{ error: any }>;
    signUp: (username: string, pass: string, name: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    addToWatchlist: (item: Omit<WatchlistItem, 'addedAt' | 'updatedAt'>) => void;
    removeFromWatchlist: (id: string) => void;
    updateWatchlistItem: (id: string, updates: Partial<WatchlistItem>) => void;
    isInWatchlist: (id: string) => boolean;
    getWatchlistItem: (id: string) => WatchlistItem | undefined;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
        try {
            const saved = localStorage.getItem('wtw_watchlist_v2');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Check active session on load
    useEffect(() => {
        if (!supabase) {
            console.warn("Supabase keys missing. Auth disabled.");
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User'
                });
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User'
                });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sync Watchlist to LocalStorage safely
    useEffect(() => {
        try {
            localStorage.setItem('wtw_watchlist_v2', JSON.stringify(watchlist));
        } catch (error) {
            console.error("Failed to save watchlist to localStorage:", error);
        }
    }, [watchlist]);

    const signIn = async (username: string, pass: string) => {
        if (!supabase) return { error: { message: "Supabase not configured" } };
        const email = `${username.toLowerCase().replace(/\s+/g, '')}@wtw.app`;
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        return { error };
    };

    const signUp = async (username: string, pass: string, name: string) => {
        if (!supabase) return { error: { message: "Supabase not configured" } };
        const email = `${username.toLowerCase().replace(/\s+/g, '')}@wtw.app`;
        const { error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: { data: { name } }
        });
        return { error };
    };

    const logout = async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
        // keep watchlist on logout (it's local to device)
    };

    const addToWatchlist = (item: Omit<WatchlistItem, 'addedAt' | 'updatedAt'>) => {
        const now = Date.now();
        setWatchlist(prev => {
            if (prev.some(i => i.id === item.id)) {
                // update status if already exists
                return prev.map(i => i.id === item.id ? { ...i, ...item, updatedAt: now } : i);
            }
            return [{ ...item, addedAt: now, updatedAt: now }, ...prev];
        });
    };

    const removeFromWatchlist = (id: string) => {
        setWatchlist(prev => prev.filter(item => item.id !== id));
    };

    const updateWatchlistItem = (id: string, updates: Partial<WatchlistItem>) => {
        const now = Date.now();
        setWatchlist(prev =>
            prev.map(item =>
                item.id === id
                    ? {
                        ...item,
                        ...updates,
                        updatedAt: now,
                        // auto-set completedAt / startedAt
                        completedAt: updates.status === 'completed' && !item.completedAt ? now : item.completedAt,
                        startedAt: updates.status === 'watching' && !item.startedAt ? now : item.startedAt,
                    }
                    : item
            )
        );
    };

    const isInWatchlist = (id: string) => watchlist.some(i => i.id === id);

    const getWatchlistItem = (id: string) => watchlist.find(i => i.id === id);

    return (
        <AuthContext.Provider value={{
            user, watchlist, signIn, signUp, logout,
            addToWatchlist, removeFromWatchlist, updateWatchlistItem,
            isInWatchlist, getWatchlistItem,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
