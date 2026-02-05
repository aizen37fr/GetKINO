import type { ContentItem, Mood, Language } from '../data/db';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Mapping Moods to TMDB Genre IDs
const MOOD_GENRES: Record<Mood, number[]> = {
    'Chill': [35, 10751, 16], // Comedy, Family, Animation
    'Excited': [28, 12, 10759], // Action, Adventure, Action & Adventure
    'Emotional': [18, 10749], // Drama, Romance
    'Laugh': [35], // Comedy
    'Scared': [27, 53, 9648], // Horror, Thriller, Mystery
    'Mind-bending': [878, 9648, 14] // Sci-Fi, Mystery, Fantasy
};

// Mapping Languages to ISO 639-1
const LANG_MAP: Record<Language, string> = {
    'English': 'en',
    'Hindi': 'hi',
    'Japanese': 'ja',
    'Spanish': 'es',
    'Korean': 'ko',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Chinese': 'zh',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Arabic': 'ar'
};

const GENRE_ID_MAP: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

export async function fetchTMDB(type: 'movie' | 'tv', mood: Mood, language: Language, providerId?: number): Promise<ContentItem[]> {
    if (!API_KEY) {
        console.error("TMDB API Key missing! Check .env");
        return [];
    }

    const genreIds = MOOD_GENRES[mood].join(',');
    const langCode = LANG_MAP[language];

    // Discover endpoint offers rich filtering
    let url = `${BASE_URL}/discover/${type}?api_key=${API_KEY}&language=en-US&with_original_language=${langCode}&with_genres=${genreIds}&sort_by=popularity.desc&include_adult=false&page=1`;

    // Add Streaming Provider Filter (Region: IN for India relevance)
    if (providerId) {
        url += `&with_watch_providers=${providerId}&watch_region=IN`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.results) return [];

        // We need to fetch details for EACH item to get trailers/providers
        // This is expensive, so we'll limit to top 5-10 or trigger on hover.
        // For this demo, let's fetch details for the top 10 items in parallel.
        const topResults = data.results.slice(0, 15);

        const detailedPromises = topResults.map(async (item: any) => {
            // 1. Fetch Details (Videos + Providers + Credits)
            const detailUrl = `${BASE_URL}/${type}/${item.id}?api_key=${API_KEY}&append_to_response=videos,watch/providers,credits`;
            const detailRes = await fetch(detailUrl);
            const detailData = await detailRes.json();

            // Extract Trailer
            const trailer = detailData.videos?.results?.find(
                (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
            );

            // Extract US Providers (Flatrate / Stream)
            const providers = detailData['watch/providers']?.results?.US?.flatrate?.slice(0, 3).map((p: any) => ({
                name: p.provider_name,
                logo: `${IMAGE_BASE}${p.logo_path}`,
                link: detailData['watch/providers']?.results?.US?.link // This is usually a general link
            })) || [];

            return {
                id: `${type === 'movie' ? 'm' : 's'}-${item.id}`,
                title: item.title || item.name,
                type: type === 'movie' ? 'movie' : 'series',
                moods: [mood],
                genres: item.genre_ids ? item.genre_ids.map((id: number) => GENRE_ID_MAP[id] || 'Unknown') : [],
                language: language,
                rating: item.vote_average,
                year: new Date(item.release_date || item.first_air_date).getFullYear() || 0,
                image: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : '',
                description: item.overview,
                trailerKey: trailer?.key,
                watchProviders: providers,
                cast: detailData.credits?.cast?.slice(0, 6).map((c: any) => ({
                    name: c.name,
                    character: c.character,
                    image: c.profile_path ? `${IMAGE_BASE}${c.profile_path}` : null
                })) || []
            };
        });

        return Promise.all(detailedPromises);

    } catch (error) {
        console.error("TMDB Fetch Error:", error);
        return [];
    }
}

/**
 * Search movies by title
 */
export async function searchMoviesByTitle(title: string) {
    if (!API_KEY) return [];

    const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&include_adult=false`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('TMDB movie search error:', error);
        return [];
    }
}

/**
 * Search TV shows by title
 */
export async function searchTVByTitle(title: string) {
    if (!API_KEY) return [];

    const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(title)}&include_adult=false`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('TMDB TV search error:', error);
        return [];
    }
}
