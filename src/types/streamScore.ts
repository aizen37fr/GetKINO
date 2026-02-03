export interface StreamScoreReview {
    id: string;
    userId: string;
    userName: string;
    contentId: string;
    storyScore: number;   // 1-10
    actingScore: number;  // 1-10
    visualsScore: number; // 1-10
    endingScore: number;  // 1-10
    emotionalVibe: 'Mind-blowing' | 'Heart-breaking' | 'Feel-good' | 'Terrifying' | 'Adrenaline' | 'Thought-provoking';
    comment?: string;
    createdAt: string;
    spoilerFree: boolean;
}

export interface StreamScoreStats {
    average: number;
    storyAvg: number;
    actingAvg: number;
    visualsAvg: number;
    endingAvg: number;
    topVibe: string;
    totalReviews: number;
}

export interface UserProfile {
    id: string;
    name: string;
    avatar: string;
    avgRating: number;
    favoriteGenres: { id: number; name: string }[];
    watchlist?: any[]; // Simplified for now
}
