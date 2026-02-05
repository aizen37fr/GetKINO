/**
 * Universal Content Detection Service
 * Detects anime, movies, TV shows, K-Dramas, C-Dramas, and more
 * Uses multiple AI services for maximum accuracy
 */

import { searchAnimeByFile, getAnimeDetails } from './tracemoe';
import { searchMoviesByTitle, searchTVByTitle } from './tmdb';

export type ContentType = 'anime' | 'movie' | 'tv' | 'unknown';

export interface UniversalDetectionResult {
    type: ContentType;
    title: string;
    originalTitle?: string;
    confidence: number;
    year?: number;
    season?: number;
    episode?: number | string;
    timestamp?: string;
    genres?: string[];
    rating?: number;
    image: string;
    backdrop?: string;
    overview?: string;
    source: 'trace.moe' | 'tmdb' | 'fallback';
    externalIds?: {
        tmdbId?: number;
        anilistId?: number;
        imdbId?: string;
    };
}

/**
 * Main universal detection function
 * Tries multiple detection methods in parallel for speed
 */
export async function detectContent(imageFile: File): Promise<UniversalDetectionResult | null> {
    console.log('🔍 Universal Detection: Starting multi-source scan...');

    try {
        // Run all detection methods in parallel
        const [animeResult, tmdbResult] = await Promise.allSettled([
            detectAnime(imageFile),
            detectFromFilename(imageFile.name), // Try to extract title from filename
        ]);

        // Check anime detection first (most accurate for anime)
        if (animeResult.status === 'fulfilled' && animeResult.value) {
            console.log('✅ Anime detected via trace.moe');
            return animeResult.value;
        }

        // Check TMDB detection
        if (tmdbResult.status === 'fulfilled' && tmdbResult.value) {
            console.log('✅ Content detected via TMDB');
            return tmdbResult.value;
        }

        console.log('❌ No detection found');
        return null;
    } catch (error) {
        console.error('💥 Universal detection error:', error);
        return null;
    }
}

/**
 * Detect anime using trace.moe
 */
async function detectAnime(imageFile: File): Promise<UniversalDetectionResult | null> {
    try {
        const traceMoeResult = await searchAnimeByFile(imageFile);

        if (!traceMoeResult || traceMoeResult.similarity < 0.75) {
            return null;
        }

        // Get full details from AniList
        const animeDetails = await getAnimeDetails(traceMoeResult.anilist);

        return {
            type: 'anime',
            title: animeDetails?.title?.english || animeDetails?.title?.romaji || 'Unknown Anime',
            originalTitle: animeDetails?.title?.native,
            confidence: traceMoeResult.similarity,
            episode: traceMoeResult.episode,
            timestamp: `${formatTime(traceMoeResult.from)} - ${formatTime(traceMoeResult.to)}`,
            year: animeDetails?.seasonYear,
            genres: animeDetails?.genres || [],
            rating: animeDetails?.averageScore ? animeDetails.averageScore / 10 : undefined,
            image: animeDetails?.coverImage?.large || traceMoeResult.image,
            backdrop: animeDetails?.bannerImage,
            overview: animeDetails?.description?.replace(/<[^>]*>/g, ''), // Strip HTML
            source: 'trace.moe',
            externalIds: {
                anilistId: traceMoeResult.anilist,
                tmdbId: animeDetails?.idMal,
            }
        };
    } catch (error) {
        console.error('Anime detection error:', error);
        return null;
    }
}

/**
 * Try to extract content info from filename
 * Common formats: "Movie.Name.2023.1080p.mkv" or "Show.S01E05.mkv"
 */
async function detectFromFilename(filename: string): Promise<UniversalDetectionResult | null> {
    try {
        // Remove file extension
        const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

        // Try to extract title and year
        const yearMatch = nameWithoutExt.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? parseInt(yearMatch[0]) : undefined;

        // Extract episode info (S01E05 format)
        const episodeMatch = nameWithoutExt.match(/S(\d+)E(\d+)/i);
        const season = episodeMatch ? parseInt(episodeMatch[1]) : undefined;
        const episode = episodeMatch ? parseInt(episodeMatch[2]) : undefined;

        // Clean up title (remove quality markers, release group, etc.)
        let title = nameWithoutExt
            .replace(/\b(19|20)\d{2}\b/, '') // Remove year
            .replace(/S\d+E\d+/i, '') // Remove episode info
            .replace(/\b(1080p|720p|480p|4K|UHD|HDR|BluRay|WEB-?DL|WEBRip|HDTV)\b/gi, '')
            .replace(/\[.*?\]/g, '') // Remove brackets
            .replace(/\(.*?\)/g, '') // Remove parentheses
            .replace(/[._]/g, ' ') // Replace dots/underscores with spaces
            .trim();

        if (!title || title.length < 3) {
            return null;
        }

        console.log('📝 Extracted from filename:', { title, year, season, episode });

        // Search TMDB with extracted info
        if (season && episode) {
            // It's a TV show
            const tvResults = await searchTVByTitle(title);
            if (tvResults && tvResults.length > 0) {
                const show = tvResults[0];
                return {
                    type: 'tv',
                    title: show.name,
                    originalTitle: show.original_name,
                    confidence: 0.7, // Lower confidence for filename-based detection
                    year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : year,
                    season,
                    episode,
                    genres: show.genre_ids?.map(id => getGenreName(id)) || [],
                    rating: show.vote_average,
                    image: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : '',
                    backdrop: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : undefined,
                    overview: show.overview,
                    source: 'tmdb',
                    externalIds: {
                        tmdbId: show.id,
                    }
                };
            }
        } else {
            // It's likely a movie
            const movieResults = await searchMoviesByTitle(title);
            if (movieResults && movieResults.length > 0) {
                const movie = movieResults[0];
                return {
                    type: 'movie',
                    title: movie.title,
                    originalTitle: movie.original_title,
                    confidence: 0.7,
                    year: movie.release_date ? new Date(movie.release_date).getFullYear() : year,
                    genres: movie.genre_ids?.map(id => getGenreName(id)) || [],
                    rating: movie.vote_average,
                    image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
                    backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : undefined,
                    overview: movie.overview,
                    source: 'tmdb',
                    externalIds: {
                        tmdbId: movie.id,
                    }
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Filename detection error:', error);
        return null;
    }
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Map TMDB genre ID to name
 */
function getGenreName(id: number): string {
    const genreMap: Record<number, string> = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
        80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
        14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
        9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
        53: 'Thriller', 10752: 'War', 37: 'Western',
        // TV genres
        10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
        10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
        10767: 'Talk', 10768: 'War & Politics',
    };
    return genreMap[id] || 'Unknown';
}
