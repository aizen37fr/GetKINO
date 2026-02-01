import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ContentItem } from '../data/db';
import { supabase } from '../services/supabase';

type User = {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
};

type AuthContextType = {
    user: User | null;
    watchlist: ContentItem[];
    signIn: (email: string, pass: string) => Promise<{ error: any }>;
    signUp: (email: string, pass: string, name: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    addToWatchlist: (item: ContentItem) => void;
    removeFromWatchlist: (id: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [watchlist, setWatchlist] = useState<ContentItem[]>(() => {
        const saved = localStorage.getItem('wtw_watchlist');
        return saved ? JSON.parse(saved) : [];
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

    // Sync Watchlist to LocalStorage (Cloud Sync would go here)
    useEffect(() => {
        localStorage.setItem('wtw_watchlist', JSON.stringify(watchlist));
    }, [watchlist]);

    const signIn = async (email: string, pass: string) => {
        if (!supabase) return { error: { message: "Supabase not configured" } };
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        return { error };
    };

    const signUp = async (email: string, pass: string, name: string) => {
        if (!supabase) return { error: { message: "Supabase not configured" } };
        const { error } = await supabase.auth.signUp({
            email,
            password: pass,
            options: {
                data: { name }
            }
        });
        return { error };
    };

    const logout = async () => {
        if (supabase) await supabase.auth.signOut();
        setWatchlist([]);
        localStorage.removeItem('wtw_watchlist');
    };

    const addToWatchlist = (item: ContentItem) => {
        setWatchlist(prev => {
            if (prev.some(i => i.id === item.id)) return prev;
            return [...prev, item];
        });
    };

    const removeFromWatchlist = (id: string) => {
        setWatchlist(prev => prev.filter(item => item.id !== id));
    };

    return (
        <AuthContext.Provider value={{ user, watchlist, signIn, signUp, logout, addToWatchlist, removeFromWatchlist }}>
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
