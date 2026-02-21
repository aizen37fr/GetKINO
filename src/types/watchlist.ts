/**
 * Enhanced Watchlist Types
 */

export type WatchStatus = 'plan-to-watch' | 'watching' | 'completed' | 'dropped' | 'on-hold';

export interface WatchlistItem {
    // Core identity
    id: string;
    title: string;
    type: 'anime' | 'movie' | 'tv' | 'series';
    image?: string;
    year?: number;
    genres?: string[];
    rating?: number; // TMDB/AniList rating out of 10
    overview?: string;
    totalEpisodes?: number;

    // External IDs for deep links
    externalIds?: {
        tmdbId?: number;
        anilistId?: number;
        imdbId?: string;
    };

    // User's personal tracking
    status: WatchStatus;
    userRating?: number; // 1-10
    notes?: string;
    currentEpisode?: number; // progress tracking
    addedAt: number; // timestamp ms
    updatedAt: number; // timestamp ms
    completedAt?: number;
    startedAt?: number;
}

export const STATUS_LABELS: Record<WatchStatus, string> = {
    'plan-to-watch': '📋 Plan to Watch',
    'watching': '▶️ Watching',
    'completed': '✅ Completed',
    'dropped': '❌ Dropped',
    'on-hold': '⏸️ On Hold',
};

export const STATUS_COLORS: Record<WatchStatus, string> = {
    'plan-to-watch': '#818cf8',    // indigo
    'watching': '#22d3ee',         // cyan
    'completed': '#4ade80',        // green
    'dropped': '#f87171',          // red
    'on-hold': '#fbbf24',          // amber
};
