import type { ContentItem, Mood } from '../data/db';

const GRAPHQL_URL = 'https://graphql.anilist.co';

// AniList Tags/Genres mapping
const MOOD_TAGS: Record<Mood, string[]> = {
    'Chill': ['Slice of Life', 'Comedy', 'Iyashikei'],
    'Excited': ['Action', 'Adventure', 'Sports'],
    'Emotional': ['Drama', 'Romance', 'Tragedy'],
    'Laugh': ['Comedy', 'Parody'],
    'Scared': ['Horror', 'Psychological', 'Thriller'],
    'Mind-bending': ['Sci-Fi', 'Mystery', 'Psychological', 'Time Travel']
};

export async function fetchAniList(mood: Mood): Promise<ContentItem[]> {
    const tags = MOOD_TAGS[mood];
    const randomTag = tags[Math.floor(Math.random() * tags.length)]; // Pick one tag to vary results

    const query = `
    query ($tag: String) {
      Page(page: 1, perPage: 20) {
        media(tag: $tag, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          id
          title {
            english
            romaji
          }
          description
          coverImage {
            extraLarge
          }
          averageScore
          seasonYear
          startDate {
            year
          }
          genres
        }
      }
    }
    `;

    try {
        const res = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { tag: randomTag }
            })
        });

        const data = await res.json();
        if (!data.data?.Page?.media) return [];

        return data.data.Page.media.map((item: any) => ({
            id: `a-${item.id}`,
            title: item.title.english || item.title.romaji,
            type: 'anime',
            moods: [mood],
            genres: item.genres,
            language: 'Japanese', // AniList is predominantly Japanese source
            rating: (item.averageScore || 0) / 10, // Convert 100 scale to 10
            year: item.seasonYear || item.startDate.year || 0,
            image: item.coverImage.extraLarge,
            description: item.description?.replace(/<[^>]*>?/gm, '') || '', // Strip HTML
        }));

    } catch (error) {
        console.error("AniList Fetch Error:", error);
        return [];
    }
}
