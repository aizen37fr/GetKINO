import type { ContentItem, Mood, Language } from '../data/db';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';

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

export async function fetchTMDB(type: 'movie' | 'tv', mood: Mood, language: Language): Promise<ContentItem[]> {
    if (!API_KEY) {
        console.error("TMDB API Key missing! Check .env");
        return [];
    }

    const genreIds = MOOD_GENRES[mood].join(',');
    const langCode = LANG_MAP[language];

    // Discover endpoint offers rich filtering
    const url = `${BASE_URL}/discover/${type}?api_key=${API_KEY}&language=en-US&with_original_language=${langCode}&with_genres=${genreIds}&sort_by=popularity.desc&include_adult=false&page=1`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.results) return [];

        return data.results.map((item: any) => ({
            id: `${type === 'movie' ? 'm' : 's'}-${item.id}`,
            title: item.title || item.name,
            type: type === 'movie' ? 'movie' : 'series', // Normalized type
            moods: [mood], // Tagged with the requested mood
            genres: item.genre_ids ? item.genre_ids.map((id: number) => GENRE_ID_MAP[id] || 'Unknown') : [],
            language: language,
            rating: item.vote_average,
            year: new Date(item.release_date || item.first_air_date).getFullYear() || 0,
            image: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : '',
            description: item.overview,
            trailerUrl: '', // Requires a second call, keeping it simple for now or fetch on detail
        }));

    } catch (error) {
        console.error("TMDB Fetch Error:", error);
        return [];
    }
}
