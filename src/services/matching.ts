import type { UserProfile } from '../types/streamScore';

export interface MatchProfile {
    userId: string;
    userName: string;
    avatar?: string;
    compatibility: number; // 0-100
    sharedGenres: string[];
    sharedMovies: string[]; // Titles
    vibeMatch: string; // "Soulmate", "Bestie", "Partner in Crime", etc.
}

// Calculate compatibility between current user and a potential match
export function calculateCompatibility(
    myProfile: UserProfile,
    theirProfile: UserProfile,
    theirName: string,
    theirId: string
): MatchProfile {
    let score = 0;
    const sharedGenres: string[] = [];
    // const sharedMovies: string[] = []; // In a real app, we'd need their full watchlist

    // 1. Genre Overlap (40%)
    // const sharedMovies = profileA.watchlist.filter(m => profileB.watchlist.some(w => w.id === m.id));
    const myGenres = myProfile.favoriteGenres.map((g: { id: number }) => g.id);
    const theirGenres = theirProfile.favoriteGenres.map((g: { id: number }) => g.id);

    // Find intersection
    const commonGenres = myGenres.filter((g: number) => theirGenres.includes(g));
    const unionGenres = new Set([...myGenres, ...theirGenres]);

    if (unionGenres.size > 0) {
        const jaccardIndex = commonGenres.length / unionGenres.size;
        score += jaccardIndex * 40;

        // Map ID to names (mock mapping for now, ideally pass genre list)
        // We'll just generic names for display since we don't have the map here
        if (commonGenres.length > 0) sharedGenres.push(`${commonGenres.length} Genres`);
    }

    // 2. Rating Style (20%)
    // If average ratings are similar, higher score
    const ratingDiff = Math.abs(myProfile.avgRating - theirProfile.avgRating);
    if (ratingDiff < 1) score += 20;
    else if (ratingDiff < 2) score += 10;

    // 3. Actor/Director Overlap (20%)
    // ... simplified logic

    // 4. Random Chemistry (20%) - To simulate real mystery
    score += Math.random() * 20;

    // Normalize to 0-100
    score = Math.min(100, Math.round(score));

    // Determine Vibe
    let vibe = "Movie Buddy";
    if (score > 90) vibe = "Soulmate 💍";
    else if (score > 80) vibe = "Cinema Bestie 👯‍♀️";
    else if (score > 70) vibe = "Popcorn Partner 🍿";
    else if (score > 60) vibe = "Casual Watcher 📺";

    return {
        userId: theirId,
        userName: theirName,
        compatibility: score,
        sharedGenres: ["Action", "Sci-Fi"], // Mocked for UI until we have full genre map
        sharedMovies: ["Inception", "Interstellar"], // Mocked
        vibeMatch: vibe
    };
}

// Mock users for the demo
export const MOCK_MATCHES: MatchProfile[] = [
    {
        userId: '101',
        userName: 'Sarah Connor',
        compatibility: 95,
        sharedGenres: ['Sci-Fi', 'Action'],
        sharedMovies: ['Terminator 2', 'Aliens'],
        vibeMatch: 'Soulmate 💍'
    },
    {
        userId: '102',
        userName: 'Tony Stark',
        compatibility: 88,
        sharedGenres: ['Tech', 'Adventure'],
        sharedMovies: ['Iron Man', 'The Avengers'],
        vibeMatch: 'Cinema Bestie 👯‍♀️'
    },
    {
        userId: '103',
        userName: 'Wednesday Addams',
        compatibility: 45,
        sharedGenres: ['Horror'],
        sharedMovies: [],
        vibeMatch: 'Nemesis 😈'
    }
];
