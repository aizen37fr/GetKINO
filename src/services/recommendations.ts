import type { ContentItem } from '../data/db';
import type { WatchlistItem } from '../types/watchlist';
import type { UserProfile, RecommendationResult, SignalScores } from '../types/recommendations';
import {
    fetchSimilar,
    fetchRecommendations,
    fetchCredits,
    fetchKeywords,
    extractTMDBId
} from './tmdb-extended';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

/**
 * Main recommendation engine using hybrid multi-signal approach
 */
export async function getHybridRecommendations(
    watchlist: WatchlistItem[],
    limit: number = 20
): Promise<RecommendationResult[]> {
    if (watchlist.length === 0) {
        return [];
    }

    // Step 1: Build user profile
    const userProfile = await buildUserProfile(watchlist);

    // Step 2: Gather candidate content from multiple sources
    const candidates = await gatherCandidates(watchlist);

    // Step 3: Score each candidate
    const scored = await Promise.all(
        candidates.map(async (candidate) => {
            const scores = await scoreContent(candidate, userProfile);
            const finalScore = calculateFinalScore(scores);
            const reasons = generateReasons(scores, userProfile, candidate);

            return {
                content: candidate,
                score: finalScore,
                reasons
            };
        })
    );

    // Step 4: Sort by score and return top results
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Build a user profile from their watchlist
 */
async function buildUserProfile(watchlist: WatchlistItem[]): Promise<UserProfile> {
    const genreCount: Record<string, number> = {};
    const actorCount: Record<string, { name: string; count: number }> = {};
    const directorCount: Record<string, { name: string; count: number }> = {};
    const keywordCount: Record<number, { name: string; count: number }> = {};
    let totalRating = 0;

    for (const item of watchlist) {
        // Count genres
        const genres = item.genres || [];
        genres.forEach((genre: string) => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
        });

        // Count rating
        if (item.rating) {
            totalRating += item.rating;
        }

        // Fetch detailed data for actors, directors, keywords
        const tmdbInfo = extractTMDBId(item.id);
        if (tmdbInfo) {
            try {
                // Get credits
                const credits = await fetchCredits(tmdbInfo.id, tmdbInfo.type);

                // Top 3 actors
                credits.cast.slice(0, 3).forEach((actor: any) => {
                    if (!actorCount[actor.id]) {
                        actorCount[actor.id] = { name: actor.name, count: 0 };
                    }
                    actorCount[actor.id].count++;
                });

                // Director(s)
                const directors = credits.crew.filter((c: any) => c.job === 'Director');
                directors.forEach((director: any) => {
                    if (!directorCount[director.id]) {
                        directorCount[director.id] = { name: director.name, count: 0 };
                    }
                    directorCount[director.id].count++;
                });

                // Keywords
                const keywords = await fetchKeywords(tmdbInfo.id, tmdbInfo.type);
                keywords.slice(0, 10).forEach((kw: any) => {
                    if (!keywordCount[kw.id]) {
                        keywordCount[kw.id] = { name: kw.name, count: 0 };
                    }
                    keywordCount[kw.id].count++;
                });
            } catch (err) {
                console.error('Error building profile for', item.title, err);
            }
        }
    }

    // Convert to sorted arrays
    const favoriteGenres = Object.entries(genreCount)
        .map(([genre, count]) => ({ id: hashString(genre), weight: count / watchlist.length }))
        .sort((a, b) => b.weight - a.weight);

    const favoriteActors = Object.entries(actorCount)
        .map(([id, data]) => ({ id: parseInt(id), name: data.name, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const favoriteDirectors = Object.entries(directorCount)
        .map(([id, data]) => ({ id: parseInt(id), name: data.name, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const commonKeywords = Object.entries(keywordCount)
        .map(([id, data]) => ({ id: parseInt(id), name: data.name, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

    return {
        favoriteGenres,
        favoriteActors,
        favoriteDirectors,
        commonKeywords,
        avgRating: watchlist.length > 0 ? totalRating / watchlist.length : 7.0
    };
}

/**
 * Gather candidate content from multiple sources
 */
async function gatherCandidates(watchlist: WatchlistItem[]): Promise<any[]> {
    const candidateMap = new Map<string, any>();

    for (const item of watchlist.slice(0, 5)) { // Limit to top 5 to avoid rate limits
        const tmdbInfo = extractTMDBId(item.id);
        if (!tmdbInfo) continue;

        try {
            // Get similar content
            const similar = await fetchSimilar(tmdbInfo.id, tmdbInfo.type);
            similar.forEach(c => candidateMap.set(`${tmdbInfo.type}-${c.id}`, c));

            // Get TMDB recommendations
            const recommended = await fetchRecommendations(tmdbInfo.id, tmdbInfo.type);
            recommended.forEach(c => candidateMap.set(`${tmdbInfo.type}-${c.id}`, c));
        } catch (err) {
            console.error('Error gathering candidates:', err);
        }
    }

    // Filter out items already in watchlist
    const watchlistIds = new Set(watchlist.map(i => i.id));
    return Array.from(candidateMap.values()).filter(c => {
        const id = `${c.media_type || 'movie'}-${c.id}`;
        return !watchlistIds.has(id);
    });
}

/**
 * Score a candidate based on multiple signals
 */
async function scoreContent(
    candidate: any,
    userProfile: UserProfile
): Promise<SignalScores> {
    const tmdbId = candidate.id;
    const type = candidate.media_type === 'tv' ? 'tv' : 'movie';

    let similarityScore = 0;
    let castCrewScore = 0;
    let keywordScore = 0;
    let genreScore = 0;
    let ratingScore = 0;

    try {
        // 1. Similarity Score (based on appearance frequency)
        similarityScore = 1.0; // Default for appearing in results

        // 2. Cast/Crew Score
        const credits = await fetchCredits(tmdbId, type);
        const candidateActors = credits.cast.slice(0, 5).map((a: any) => a.id);
        const candidateDirectors = credits.crew.filter((c: any) => c.job === 'Director').map((d: any) => d.id);

        castCrewScore =
            candidateActors.filter(id => userProfile.favoriteActors.some(a => a.id === id)).length * 0.5 +
            candidateDirectors.filter(id => userProfile.favoriteDirectors.some(d => d.id === id)).length * 0.5;

        // 3. Keyword Score
        const candidateKeywords = await fetchKeywords(tmdbId, type);
        const candidateKwIds = candidateKeywords.map((kw: any) => kw.id);
        keywordScore = candidateKwIds.filter(id => userProfile.commonKeywords.some(k => k.id === id)).length * 0.3;

        // 4. Genre Score
        const candidateGenres = candidate.genre_ids || [];
        genreScore = candidateGenres.reduce((score: number, genreId: number) => {
            const match = userProfile.favoriteGenres.find(g => g.id === genreId);
            return score + (match ? match.weight : 0);
        }, 0);

        // 5. Rating Score
        const rating = candidate.vote_average || 0;
        ratingScore = rating >= userProfile.avgRating ? 1.0 : rating / userProfile.avgRating;

    } catch (err) {
        console.error('Error scoring content:', err);
    }

    return {
        similarityScore,
        castCrewScore,
        keywordScore,
        genreScore,
        ratingScore
    };
}

/**
 * Calculate final weighted score
 */
function calculateFinalScore(scores: SignalScores): number {
    return (
        scores.similarityScore * 0.3 +
        scores.castCrewScore * 0.25 +
        scores.keywordScore * 0.2 +
        scores.genreScore * 0.15 +
        scores.ratingScore * 0.1
    ) * 100; // Scale to 0-100
}

/**
 * Generate human-readable reasons
 */
function generateReasons(scores: SignalScores, userProfile: UserProfile, candidate: any): string[] {
    const reasons: string[] = [];

    if (scores.castCrewScore > 0.5) {
        reasons.push('Features actors/directors you love');
    }

    if (scores.keywordScore > 0.3) {
        reasons.push('Similar themes to your favorites');
    }

    if (scores.genreScore > 0.5) {
        const topGenre = userProfile.favoriteGenres[0];
        if (topGenre) {
            reasons.push(`Top pick for genre fans`);
        }
    }

    if (scores.ratingScore > 0.9) {
        reasons.push(`Highly rated (${candidate.vote_average?.toFixed(1)}★)`);
    }

    if (reasons.length === 0) {
        reasons.push('Recommended for you');
    }

    return reasons;
}

/**
 * Simple hash function for genre names
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Convert raw TMDB data to ContentItem format
 */
export function convertToContentItem(tmdbData: any, type: 'movie' | 'tv'): ContentItem {
    return {
        id: `${type === 'movie' ? 'm' : 's'}-${tmdbData.id}`,
        title: tmdbData.title || tmdbData.name,
        type: type === 'movie' ? 'movie' : 'series',
        moods: [],
        genres: tmdbData.genre_ids?.map((id: number) => `Genre-${id}`) || [],
        language: 'English',
        rating: tmdbData.vote_average || 0,
        year: new Date(tmdbData.release_date || tmdbData.first_air_date || '2024').getFullYear(),
        image: tmdbData.poster_path ? `${IMAGE_BASE}${tmdbData.poster_path}` : '',
        description: tmdbData.overview || '',
        trailerKey: undefined,
        watchProviders: [],
        cast: []
    };
}
