import type { WatchlistItem } from '../types/watchlist';

export interface DNATrait {
    label: string;
    score: number; // 0-100
    color: string;
    icon: string;
}

export interface DNAProfile {
    traits: DNATrait[];
    totalWatchTime: number; // minutes
    dominantGenre: string;
    adventurousness: number; // Diversity of genres
    spiritAnimal: string;
    tagline: string;
}

const TRAITS_MAP: Record<string, string> = {
    'Action': 'Adrenaline',
    'Adventure': 'Adrenaline',
    'Horror': 'Adrenaline',
    'Comedy': 'Joy',
    'Romance': 'Romance',
    'Drama': 'Emotion',
    'Sci-Fi': 'Intellect',
    'Thriller': 'Intellect',
    'Documentary': 'Intellect',
    'Fantasy': 'Imagination',
    'Animation': 'Imagination',
};

const SPIRIT_ANIMALS = [
    { threshold: 'Adrenaline', animal: 'Cheetah', emoji: '🐆', tagline: 'Fast-paced thrill seeker' },
    { threshold: 'Joy', animal: 'Dolphin', emoji: '🐬', tagline: 'Here for a good time' },
    { threshold: 'Romance', animal: 'Swan', emoji: '🦢', tagline: 'Hopeless romantic' },
    { threshold: 'Emotion', animal: 'Elephant', emoji: '🐘', tagline: 'Deep feeler' },
    { threshold: 'Intellect', animal: 'Owl', emoji: '🦉', tagline: 'Curious observer' },
    { threshold: 'Imagination', animal: 'Unicorn', emoji: '🦄', tagline: 'Dreamer' },
];

export function calculateReelDNA(watchlist: WatchlistItem[]): DNAProfile {
    if (watchlist.length === 0) {
        return {
            traits: [],
            totalWatchTime: 0,
            dominantGenre: 'N/A',
            adventurousness: 0,
            spiritAnimal: 'Sloth',
            tagline: 'Start watching something!'
        };
    }

    const traitScores: Record<string, number> = {
        'Adrenaline': 0, 'Joy': 0, 'Romance': 0, 'Emotion': 0, 'Intellect': 0, 'Imagination': 0
    };

    const genreCounts: Record<string, number> = {};
    let totalItems = 0;

    watchlist.forEach(item => {
        const genres = item.genres || [];
        genres.forEach((g: string) => {
            const trait = TRAITS_MAP[g] || 'Adrenaline'; // Default fallback
            // Add weighted score based on rating if available, else 1
            traitScores[trait] += item.rating ? item.rating / 2 : 5;

            genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
        totalItems++;
    });

    // Normalize scores to 0-100
    const maxScore = Math.max(...Object.values(traitScores)) || 1;
    const traits: DNATrait[] = [
        { label: 'Adrenaline', score: Math.round((traitScores['Adrenaline'] / maxScore) * 100), color: 'bg-red-500', icon: '🔥' },
        { label: 'Joy', score: Math.round((traitScores['Joy'] / maxScore) * 100), color: 'bg-yellow-400', icon: '😂' },
        { label: 'Romance', score: Math.round((traitScores['Romance'] / maxScore) * 100), color: 'bg-pink-500', icon: '💖' },
        { label: 'Emotion', score: Math.round((traitScores['Emotion'] / maxScore) * 100), color: 'bg-blue-400', icon: '😭' },
        { label: 'Intellect', score: Math.round((traitScores['Intellect'] / maxScore) * 100), color: 'bg-purple-500', icon: '🧠' },
        { label: 'Imagination', score: Math.round((traitScores['Imagination'] / maxScore) * 100), color: 'bg-indigo-400', icon: '✨' },
    ].sort((a, b) => b.score - a.score);

    // Determine Dominant Genre
    const dominantGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Determine Spirit Animal (based on top trait)
    const topTrait = traits[0];
    const animal = SPIRIT_ANIMALS.find(a => a.threshold === topTrait.label) || SPIRIT_ANIMALS[0];

    // Adventurousness (unique genres count / total possible genres)
    const uniqueGenres = Object.keys(genreCounts).length;
    const adventurousness = Math.min(100, Math.round((uniqueGenres / 15) * 100));

    return {
        traits,
        totalWatchTime: watchlist.length * 110, // Approx 110 mins per movie
        dominantGenre,
        adventurousness,
        spiritAnimal: `${animal.emoji} ${animal.animal}`,
        tagline: animal.tagline
    };
}
