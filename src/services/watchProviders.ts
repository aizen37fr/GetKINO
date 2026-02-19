/**
 * Streaming Watch Providers Service
 * Fetches where-to-watch info for detected content using TMDB & AniList
 */

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';
const USE_PROXY = true;
const PROXY_BASE = '/api/tmdb';

export interface StreamingProvider {
    name: string;
    logo: string;
    link: string;
    type: 'flatrate' | 'rent' | 'buy' | 'free';
}

export interface WatchProvidersResult {
    providers: StreamingProvider[];
    tmdbLink?: string;
    region: string;
}

// Platform-specific deep link builders
const PLATFORM_LINKS: Record<string, (title: string) => string> = {
    'Netflix': (t) => `https://www.netflix.com/search?q=${encodeURIComponent(t)}`,
    'Amazon Prime Video': (t) => `https://www.amazon.com/s?k=${encodeURIComponent(t)}&i=instant-video`,
    'Disney Plus': (t) => `https://www.disneyplus.com/search/${encodeURIComponent(t)}`,
    'Disney+': (t) => `https://www.disneyplus.com/search/${encodeURIComponent(t)}`,
    'Crunchyroll': (t) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(t)}`,
    'Hulu': (t) => `https://www.hulu.com/search?q=${encodeURIComponent(t)}`,
    'HBO Max': (t) => `https://www.max.com/search?q=${encodeURIComponent(t)}`,
    'Max': (t) => `https://www.max.com/search?q=${encodeURIComponent(t)}`,
    'Apple TV+': (t) => `https://tv.apple.com/search?term=${encodeURIComponent(t)}`,
    'Apple TV': (t) => `https://tv.apple.com/search?term=${encodeURIComponent(t)}`,
    'Funimation': (t) => `https://www.funimation.com/search/?q=${encodeURIComponent(t)}`,
    'Paramount Plus': (t) => `https://www.paramountplus.com/search/${encodeURIComponent(t)}/`,
    'Peacock': (t) => `https://www.peacocktv.com/search?q=${encodeURIComponent(t)}`,
    'Hotstar': (t) => `https://www.hotstar.com/in/search?q=${encodeURIComponent(t)}`,
    'JioCinema': (t) => `https://www.jiocinema.com/search/${encodeURIComponent(t)}`,
    'Sony LIV': (t) => `https://www.sonyliv.com/search?keyword=${encodeURIComponent(t)}`,
    'Zee5': (t) => `https://www.zee5.com/search-results/${encodeURIComponent(t)}`,
    'MX Player': (t) => `https://www.mxplayer.in/search?q=${encodeURIComponent(t)}`,
    'Aha': (t) => `https://www.aha.video/search?q=${encodeURIComponent(t)}`,
    'Sun NXT': (t) => `https://www.sunnxt.com/search/${encodeURIComponent(t)}`,
    'YouTube Premium': (t) => `https://www.youtube.com/results?search_query=${encodeURIComponent(t)}`,
    'Mubi': (t) => `https://mubi.com/search?q=${encodeURIComponent(t)}`,
};

/** Platform logo icons (using emoji + custom colors as fallback) */
export const PLATFORM_COLORS: Record<string, string> = {
    'Netflix': '#E50914',
    'Amazon Prime Video': '#00A8E1',
    'Disney Plus': '#113CCF',
    'Disney+': '#113CCF',
    'Crunchyroll': '#F47521',
    'Hulu': '#1CE783',
    'HBO Max': '#5d2d91',
    'Max': '#5d2d91',
    'Apple TV+': '#555555',
    'Apple TV': '#555555',
    'Funimation': '#410099',
    'Paramount Plus': '#0064FF',
    'Peacock': '#FF6E00',
    'Hotstar': '#1F80E0',
    'JioCinema': '#7B2CF4',
    'Sony LIV': '#003087',
    'Zee5': '#8B2BE2',
    'YouTube Premium': '#FF0000',
};

/**
 * Fetch watch providers for a movie/show via TMDB
 */
export async function fetchWatchProviders(
    tmdbId: number,
    type: 'movie' | 'tv',
    title: string,
    region: string = 'IN' // Default to India
): Promise<WatchProvidersResult> {
    if (!API_KEY || !tmdbId) {
        return { providers: [], region };
    }

    try {
        let url: string;
        if (USE_PROXY) {
            url = `${PROXY_BASE}?endpoint=/${type}/${tmdbId}/watch/providers`;
        } else {
            url = `${BASE_URL}/${type}/${tmdbId}/watch/providers?api_key=${API_KEY}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        const regionData = data.results?.[region] || data.results?.US || data.results?.GB;

        if (!regionData) {
            // Try to fall back to US if region not found
            const fallbackData = data.results?.US;
            if (!fallbackData) return { providers: [], region };
        }

        const activeRegion = data.results?.[region] ? region : (data.results?.US ? 'US' : 'GB');
        const regionResult = data.results?.[activeRegion];
        const tmdbLink = regionResult?.link;

        const allProviders: StreamingProvider[] = [];

        // Flatrate (subscription streaming - most important!)
        (regionResult?.flatrate || []).slice(0, 5).forEach((p: any) => {
            allProviders.push({
                name: p.provider_name,
                logo: p.logo_path ? `${IMAGE_BASE}${p.logo_path}` : '',
                link: PLATFORM_LINKS[p.provider_name]?.(title) || tmdbLink || `https://www.themoviedb.org/${type}/${tmdbId}`,
                type: 'flatrate',
            });
        });

        // Free (ad-supported)
        (regionResult?.free || []).slice(0, 3).forEach((p: any) => {
            if (!allProviders.find(x => x.name === p.provider_name)) {
                allProviders.push({
                    name: p.provider_name,
                    logo: p.logo_path ? `${IMAGE_BASE}${p.logo_path}` : '',
                    link: PLATFORM_LINKS[p.provider_name]?.(title) || tmdbLink || '',
                    type: 'free',
                });
            }
        });

        // Rent
        (regionResult?.rent || []).slice(0, 3).forEach((p: any) => {
            if (!allProviders.find(x => x.name === p.provider_name)) {
                allProviders.push({
                    name: p.provider_name,
                    logo: p.logo_path ? `${IMAGE_BASE}${p.logo_path}` : '',
                    link: PLATFORM_LINKS[p.provider_name]?.(title) || tmdbLink || '',
                    type: 'rent',
                });
            }
        });

        return { providers: allProviders, tmdbLink, region: activeRegion };
    } catch (err) {
        console.error('Watch providers fetch error:', err);
        return { providers: [], region };
    }
}

/**
 * Fetch watch providers via AniList externalLinks (for anime)
 */
export function extractAnimeStreamingLinks(externalLinks: Array<{ site: string; url: string; icon?: string }> | undefined): StreamingProvider[] {
    if (!externalLinks) return [];

    const STREAMING_SITES = ['Crunchyroll', 'Netflix', 'Hulu', 'Funimation', 'Amazon Prime Video', 'HIDIVE', 'Disney Plus', 'Disney+', 'Bilibili', 'VRV', 'AnimeLab'];

    return externalLinks
        .filter(l => STREAMING_SITES.includes(l.site))
        .slice(0, 6)
        .map(l => ({
            name: l.site,
            logo: l.icon || '',
            link: l.url,
            type: 'flatrate' as const,
        }));
}

/**
 * Search TMDB for a title and get its TMDB ID + providers
 * Used when we only have a title (no tmdbId in detection result)
 */
export async function findAndFetchProviders(
    title: string,
    contentType: 'anime' | 'movie' | 'tv'
): Promise<WatchProvidersResult & { tmdbId?: number }> {
    if (!API_KEY) return { providers: [], region: 'IN' };

    try {
        // Search TMDB
        const type = contentType === 'anime' ? 'tv' : contentType === 'movie' ? 'movie' : 'tv';

        let searchUrl: string;
        if (USE_PROXY) {
            searchUrl = `${PROXY_BASE}?endpoint=/search/${type}&query=${encodeURIComponent(title)}&include_adult=false`;
        } else {
            searchUrl = `${BASE_URL}/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(title)}&include_adult=false`;
        }

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const firstResult = searchData.results?.[0];

        if (!firstResult) return { providers: [], region: 'IN' };

        const providersResult = await fetchWatchProviders(firstResult.id, type, title);
        return { ...providersResult, tmdbId: firstResult.id };
    } catch (err) {
        console.error('Find and fetch providers error:', err);
        return { providers: [], region: 'IN' };
    }
}
