/**
 * trace.moe API Integration
 * Real anime scene search engine - "Shazam for Anime"
 * Provides accurate anime identification with episode and timestamp
 */

const TRACE_MOE_API = 'https://api.trace.moe/search';

export interface TraceMoeResult {
    anilist: number;
    filename: string;
    episode: number | string;
    from: number; // timestamp start in seconds
    to: number; // timestamp end in seconds
    similarity: number; // 0-1 (confidence score)
    video: string; // preview video URL
    image: string; // preview image URL
}

export interface TraceMoeResponse {
    frameCount: number;
    error: string;
    result: TraceMoeResult[];
}

/**
 * Search for anime using an image
 * @param imageUrl - URL or base64 data of the anime screenshot
 * @returns Match results with anime info, episode, and timestamp
 */
export async function searchAnimeByImage(imageUrl: string): Promise<TraceMoeResult | null> {
    try {
        // If it's a blob URL, convert to base64
        let searchUrl = imageUrl;
        if (imageUrl.startsWith('blob:')) {
            const blob = await fetch(imageUrl).then(r => r.blob());
            const base64 = await blobToBase64(blob);
            searchUrl = base64;
        }

        // Make API request
        const url = searchUrl.startsWith('data:') || searchUrl.startsWith('http')
            ? `${TRACE_MOE_API}?url=${encodeURIComponent(searchUrl)}`
            : `${TRACE_MOE_API}?url=${encodeURIComponent(searchUrl)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`trace.moe API error: ${response.statusText}`);
        }

        const data: TraceMoeResponse = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        if (!data.result || data.result.length === 0) {
            return null;
        }

        // Return the best match (highest similarity)
        return data.result[0];
    } catch (error) {
        console.error('trace.moe search error:', error);
        return null;
    }
}

/**
 * Search using image file directly (Form Data upload)
 * More reliable for local images
 */
export async function searchAnimeByFile(file: File): Promise<TraceMoeResult | null> {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(TRACE_MOE_API, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`trace.moe API error: ${response.statusText}`);
        }

        const data: TraceMoeResponse = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        if (!data.result || data.result.length === 0) {
            return null;
        }

        return data.result[0];
    } catch (error) {
        console.error('trace.moe file search error:', error);
        return null;
    }
}

/**
 * Get anime details from AniList using trace.moe result
 */
export async function getAnimeDetails(anilistId: number) {
    const query = `
        query ($id: Int) {
            Media(id: $id, type: ANIME) {
                id
                title {
                    romaji
                    english
                    native
                }
                coverImage {
                    large
                    medium
                }
                episodes
                seasonYear
                description
            }
        }
    `;

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { id: anilistId },
            }),
        });

        const data = await response.json();
        return data.data.Media;
    } catch (error) {
        console.error('AniList details error:', error);
        return null;
    }
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Format timestamp from seconds to MM:SS
 */
export function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}
