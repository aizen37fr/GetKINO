// New functions for recommendations - append to tmdb.ts

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Fetch similar content
export async function fetchSimilar(tmdbId: number, type: 'movie' | 'tv'): Promise<any[]> {
    if (!API_KEY) return [];

    try {
        const url = `${BASE_URL}/${type}/${tmdbId}/similar?api_key=${API_KEY}&language=en-US&page=1`;
        const res = await fetch(url);
        const data = await res.json();
        return data.results || [];
    } catch (err) {
        console.error('Error fetching similar:', err);
        return [];
    }
}

// Fetch TMDB recommendations
export async function fetchRecommendations(tmdbId: number, type: 'movie' | 'tv'): Promise<any[]> {
    if (!API_KEY) return [];

    try {
        const url = `${BASE_URL}/${type}/${tmdbId}/recommendations?api_key=${API_KEY}&language=en-US&page=1`;
        const res = await fetch(url);
        const data = await res.json();
        return data.results || [];
    } catch (err) {
        console.error('Error fetching recommendations:', err);
        return [];
    }
}

// Fetch credits (cast & crew)
export async function fetchCredits(tmdbId: number, type: 'movie' | 'tv'): Promise<{ cast: any[]; crew: any[] }> {
    if (!API_KEY) return { cast: [], crew: [] };

    try {
        const url = `${BASE_URL}/${type}/${tmdbId}/credits?api_key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
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
    if (!API_KEY) return [];

    try {
        const url = `${BASE_URL}/${type}/${tmdbId}/keywords?api_key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        return type === 'movie' ? (data.keywords || []) : (data.results || []);
    } catch (err) {
        console.error('Error fetching keywords:', err);
        return [];
    }
}

// Fetch content by actor
export async function fetchByActor(actorId: number): Promise<any[]> {
    if (!API_KEY) return [];

    try {
        const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_cast=${actorId}&sort_by=popularity.desc&page=1`;
        const res = await fetch(url);
        const data = await res.json();
        return data.results || [];
    } catch (err) {
        console.error('Error fetching by actor:', err);
        return [];
    }
}

// Fetch content by director
export async function fetchByDirector(directorId: number): Promise<any[]> {
    if (!API_KEY) return [];

    try {
        const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_crew=${directorId}&sort_by=popularity.desc&page=1`;
        const res = await fetch(url);
        const data = await res.json();
        return data.results || [];
    } catch (err) {
        console.error('Error fetching by director:', err);
        return [];
    }
}

// Helper to extract TMDB ID from content ID
export function extractTMDBId(contentId: string): { id: number; type: 'movie' | 'tv' } | null {
    // contentId format: "m-123" for movies, "s-456" for series
    const match = contentId.match(/^([ms])-(\d+)$/);
    if (!match) return null;

    return {
        id: parseInt(match[2]),
        type: match[1] === 'm' ? 'movie' : 'tv'
    };
}

// Search TMDB for movies and TV shows by query
export async function searchTMDB(query: string): Promise<{ id: number; title: string; type: 'movie' | 'tv'; posterPath: string | null; rating: number; year: string }[]> {
    if (!API_KEY || !query.trim()) return [];
    try {
        const url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
        const res = await fetch(url);
        const data = await res.json();
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
    if (!API_KEY) return [];
    try {
        const url = `${BASE_URL}/${type}/${tmdbId}/credits?api_key=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
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
    if (!API_KEY) return [];
    try {
        const url = `${BASE_URL}/person/${personId}/combined_credits?api_key=${API_KEY}&language=en-US`;
        const res = await fetch(url);
        const data = await res.json();
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
    if (!API_KEY) return null;
    try {
        const url = `${BASE_URL}/${type}/${tmdbId}?api_key=${API_KEY}&language=en-US`;
        const res = await fetch(url);
        return await res.json();
    } catch (err) {
        console.error('fetchDetails error:', err);
        return null;
    }
}
