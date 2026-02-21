// New functions for recommendations - append to tmdb.ts

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Fetch similar content
export async function fetchSimilar(tmdbId: number, type: 'movie' | 'tv'): Promise<any[]> {
    try {
        const data = await fetchViaProxy(`/${type}/${tmdbId}/similar`, { language: 'en-US', page: 1 });
        return data.results || [];
    } catch (err) {
        console.error('Error fetching similar:', err);
        return [];
    }
}

// Fetch TMDB recommendations
export async function fetchRecommendations(tmdbId: number, type: 'movie' | 'tv'): Promise<any[]> {
    try {
        const data = await fetchViaProxy(`/${type}/${tmdbId}/recommendations`, { language: 'en-US', page: 1 });
        return data.results || [];
    } catch (err) {
        console.error('Error fetching recommendations:', err);
        return [];
    }
}

// Fetch credits (cast & crew)
export async function fetchCredits(tmdbId: number, type: 'movie' | 'tv'): Promise<{ cast: any[]; crew: any[] }> {
    try {
        const data = await fetchViaProxy(`/${type}/${tmdbId}/credits`);
        return {
            cast: data.cast || [],
            crew: data.crew || []
        };
    } catch (err) {
        console.error('Error fetching credits:', err);
        return { cast: [], crew: [] };
    }
}

// Fetch keywords
export async function fetchKeywords(tmdbId: number, type: 'movie' | 'tv'): Promise<any[]> {
    try {
        const data = await fetchViaProxy(`/${type}/${tmdbId}/keywords`);
        return type === 'movie' ? (data.keywords || []) : (data.results || []);
    } catch (err) {
        console.error('Error fetching keywords:', err);
        return [];
    }
}

// Fetch content by actor
export async function fetchByActor(actorId: number): Promise<any[]> {
    try {
        const data = await fetchViaProxy('/discover/movie', {
            with_cast: actorId,
            sort_by: 'popularity.desc',
            page: 1
        });
        return data.results || [];
    } catch (err) {
        console.error('Error fetching by actor:', err);
        return [];
    }
}

// Fetch content by director
export async function fetchByDirector(directorId: number): Promise<any[]> {
    try {
        const data = await fetchViaProxy('/discover/movie', {
            with_crew: directorId,
            sort_by: 'popularity.desc',
            page: 1
        });
        return data.results || [];
    } catch (err) {
        console.error('Error fetching by director:', err);
        return [];
    }
}

// Helper to extract TMDB ID from content ID
export function extractTMDBId(contentId: string): { id: number; type: 'movie' | 'tv' } | null {
    const match = contentId.match(/^([ms])-(\d+)$/);
    if (!match) return null;
    return {
        id: parseInt(match[2]),
        type: match[1] === 'm' ? 'movie' : 'tv'
    };
}

/**
 * Enhanced fetcher that uses the Vercel proxy (/api/tmdb) in production
 * or direct TMDB calls in local development.
 */
async function fetchViaProxy(endpoint: string, params: Record<string, string | number | boolean> = {}) {
    // In production (Vercel), usually /api/...
    // In local dev, we might need direct TMDB unless vercel dev is used
    const isProd = import.meta.env.PROD;

    if (isProd) {
        const url = new URL('/api/tmdb', window.location.origin);
        url.searchParams.set('endpoint', endpoint);
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
        return res.json();
    } else {
        // Fallback for local dev
        const url = new URL(`${BASE_URL}${endpoint}`);
        url.searchParams.set('api_key', API_KEY || '');
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Direct TMDB error: ${res.status}`);
        return res.json();
    }
}

// Search TMDB for movies and TV shows by query
export async function searchTMDB(query: string): Promise<{ id: number; title: string; type: 'movie' | 'tv'; posterPath: string | null; rating: number; year: string }[]> {
    if (!query.trim()) return [];
    try {
        const data = await fetchViaProxy('/search/multi', {
            query: query,
            language: 'en-US',
            page: 1,
            include_adult: 'false'
        });

        return (data.results || [])
            .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
            .slice(0, 8)
            .map((r: any) => ({
                id: r.id,
                title: r.title || r.name,
                type: r.media_type as 'movie' | 'tv',
                posterPath: r.poster_path,
                rating: r.vote_average || 0,
                year: (r.release_date || r.first_air_date || '').slice(0, 4),
            }));
    } catch (err) {
        console.error('searchTMDB error:', err);
        return [];
    }
}

// Fetch top 3 cast members for rabbit hole connections
export async function fetchTopCast(tmdbId: number, type: 'movie' | 'tv'): Promise<{ id: number; name: string; character: string; profilePath: string | null }[]> {
    try {
        const data = await fetchViaProxy(`/${type}/${tmdbId}/credits`);
        return (data.cast || []).slice(0, 3).map((a: any) => ({
            id: a.id,
            name: a.name,
            character: a.character,
            profilePath: a.profile_path,
        }));
    } catch (err) {
        console.error('fetchTopCast error:', err);
        return [];
    }
}

// Fetch movies/shows by a person (actor or director)
export async function fetchByPerson(personId: number, personType: 'cast' | 'crew'): Promise<any[]> {
    try {
        const data = await fetchViaProxy(`/person/${personId}/combined_credits`, { language: 'en-US' });
        const items = personType === 'cast' ? (data.cast || []) : (data.crew || []).filter((c: any) => c.job === 'Director');
        return items
            .filter((i: any) => i.poster_path && i.vote_average > 6)
            .sort((a: any, b: any) => b.popularity - a.popularity)
            .slice(0, 5);
    } catch (err) {
        console.error('fetchByPerson error:', err);
        return [];
    }
}

// Fetch full details of a single movie or show
export async function fetchDetails(tmdbId: number, type: 'movie' | 'tv'): Promise<any | null> {
    try {
        return await fetchViaProxy(`/${type}/${tmdbId}`, { language: 'en-US' });
    } catch (err) {
        console.error('fetchDetails error:', err);
        return null;
    }
}
