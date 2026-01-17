import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ContentItem } from '../data/db';

type User = {
    id: string; // Unique ID (e.g., #1234)
    name: string;
    avatar?: string;
};

type AuthContextType = {
    user: User | null;
    watchlist: ContentItem[];
    login: (name: string) => void;
    logout: () => void;
    addToWatchlist: (item: ContentItem) => void;
    removeFromWatchlist: (id: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('wtw_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [watchlist, setWatchlist] = useState<ContentItem[]>(() => {
        const saved = localStorage.getItem('wtw_watchlist');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('wtw_watchlist', JSON.stringify(watchlist));
    }, [watchlist]);

    const login = (name: string) => {
        // Generate a random 4-digit ID
        const randomId = '#' + Math.floor(1000 + Math.random() * 9000).toString();
        const newUser = { name, id: randomId };
        setUser(newUser);
        localStorage.setItem('wtw_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        setWatchlist([]);
        localStorage.removeItem('wtw_user');
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
        <AuthContext.Provider value={{ user, watchlist, login, logout, addToWatchlist, removeFromWatchlist }}>
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
