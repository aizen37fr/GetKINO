/**
 * Google Gemini AI Service
 * Vision analysis + 7 AI-powered discovery features
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn('⚠️ Gemini API key not found');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

// ─── Shared helpers ───────────────────────────────────────────────────────────
function textModel() {
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

async function askGemini(prompt: string): Promise<string> {
    const result = await textModel().generateContent(prompt);
    return result.response.text();
}

function parseJSON<T>(text: string): T | null {
    try {
        const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        return m ? JSON.parse(m[0]) as T : null;
    } catch {
        return null;
    }
}

// ─── Vision types ─────────────────────────────────────────────────────────────
export interface MatchCandidate {
    showName: string;
    confidence: number;
    reason: string;
}

export interface GeminiAnalysis {
    primaryMatch: MatchCandidate;
    alternatives: MatchCandidate[];
    actors?: string[];
    setting: string;
    genre: string[];
    era: string;
    country: string;
    productionStyle: string;
    sceneDescription: string;
    visualElements: string[];
}

// ─── Vision: Analyze image ────────────────────────────────────────────────────
export async function analyzeWithGemini(imageFile: File): Promise<GeminiAnalysis | null> {
    if (!API_KEY) {
        console.error('Gemini API key not configured');
        return null;
    }

    try {
        console.log('🤖 Gemini: Analyzing image...');
        const base64 = await fileToBase64(imageFile);
        const base64Data = base64.split(',')[1];
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Analyze this screenshot from a TV show or movie. Provide detailed information and your TOP 3 MOST LIKELY MATCHES.

IMPORTANT: Always provide 3 possible matches, even if you're very confident about one.

Return ONLY valid JSON:
{
  "primaryMatch": { "showName": "exact title", "confidence": 0.85, "reason": "why" },
  "alternatives": [
    { "showName": "alt 1", "confidence": 0.65, "reason": "why" },
    { "showName": "alt 2", "confidence": 0.45, "reason": "why" }
  ],
  "actors": ["actor names if recognizable"],
  "setting": "description",
  "genre": ["genre1", "genre2"],
  "era": "time period",
  "country": "country",
  "productionStyle": "style",
  "sceneDescription": "detailed description",
  "visualElements": ["element1", "element2"]
}`;

        const result = await model.generateContent([
            { text: prompt },
            { inlineData: { mimeType: imageFile.type, data: base64Data } }
        ]);

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as GeminiAnalysis;
        }
        return fallbackAnalysis(text);

    } catch (error) {
        console.error('❌ Gemini error:', error);
        return null;
    }
}

export async function identifyContent(imageFile: File): Promise<{
    title: string; confidence: number; description: string; alternatives: string[];
} | null> {
    const analysis = await analyzeWithGemini(imageFile);
    if (!analysis) return null;
    return {
        title: analysis.primaryMatch.showName || 'Unknown',
        confidence: analysis.primaryMatch.confidence,
        description: analysis.sceneDescription,
        alternatives: analysis.alternatives.map(a => a.showName),
    };
}

// ─── Vision helpers ───────────────────────────────────────────────────────────
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function fallbackAnalysis(text: string): GeminiAnalysis {
    const extractField = (t: string, field: string) => {
        const m = t.match(new RegExp(`${field}:?\\s*([^\\n]+)`, 'i'));
        return m?.[1]?.trim();
    };
    return {
        primaryMatch: { showName: 'Unknown', confidence: 0.5, reason: 'Could not parse AI response' },
        alternatives: [],
        setting: extractField(text, 'setting') || 'Unknown',
        genre: extractField(text, 'genre')?.split(',').map(g => g.trim()) || [],
        era: extractField(text, 'era') || 'Unknown',
        country: extractField(text, 'country') || 'Unknown',
        productionStyle: extractField(text, 'production') || 'Unknown',
        sceneDescription: text.substring(0, 200),
        visualElements: [],
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── AI DISCOVERY FEATURES ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. For You Recommendations ──────────────────────────────────────────────
export interface AIRecommendation {
    title: string;
    type: 'anime' | 'movie' | 'tv';
    genres: string[];
    reason: string;
    pitch: string;
    emoji: string;
    matchScore: number;
}

export async function getAIRecommendations(
    topGenres: string[],
    completedTitles: string[],
    preferredType?: string,
): Promise<AIRecommendation[]> {
    const prompt = `You are KINO, a world-class entertainment recommender. Based on this user's taste profile, recommend 6 titles they MUST watch.

User's top genres: ${topGenres.slice(0, 6).join(', ')}
Titles already completed: ${completedTitles.slice(0, 10).join(', ') || 'none yet'}
Preferred content type: ${preferredType || 'any (anime, movies, shows)'}

Rules: Do NOT recommend completed titles. Mix types unless specified. matchScore is 0.0-1.0.

Return ONLY a JSON array:
[{"title":"exact title","type":"anime","genres":["Genre1"],"reason":"one sentence why","pitch":"2-3 sentence exciting hook","emoji":"one emoji","matchScore":0.95}]`;

    try {
        return parseJSON<AIRecommendation[]>(await askGemini(prompt)) ?? [];
    } catch { return []; }
}

// ─── 2. Natural Language Search ───────────────────────────────────────────────
export interface NLSearchResult {
    title: string;
    type: 'anime' | 'movie' | 'tv';
    year?: number;
    genres: string[];
    why: string;
    emoji: string;
}

export async function nlSearch(query: string): Promise<NLSearchResult[]> {
    const prompt = `You are KINO's AI search engine. The user typed: "${query}"

Find 6 REAL anime, movies, or TV shows matching this description/vibe. Only suggest titles that actually exist.

Return ONLY a JSON array:
[{"title":"exact title","type":"anime","year":2021,"genres":["Genre1"],"why":"why it matches","emoji":"emoji"}]`;

    try {
        return parseJSON<NLSearchResult[]>(await askGemini(prompt)) ?? [];
    } catch { return []; }
}

// ─── 3. Mood Engine ───────────────────────────────────────────────────────────
export interface MoodPick {
    title: string;
    type: string;
    genres: string[];
    moodFit: string;
    emoji: string;
    fromWatchlist: boolean;
}

export async function getMoodPicks(
    mood: string,
    moodDesc: string,
    planToWatch: string[],
): Promise<MoodPick[]> {
    const prompt = `You are KINO's mood-based recommender. User mood: "${mood}" — ${moodDesc}

${planToWatch.length > 0 ? `From their Plan to Watch: ${planToWatch.slice(0, 15).join(', ')}` : ''}

Return 6 recommendations (mix fromWatchlist:true and false). If title is in their plan-to-watch list, set fromWatchlist:true.

Return ONLY a JSON array:
[{"title":"title","type":"anime","genres":["Genre"],"moodFit":"why it fits this mood","emoji":"emoji","fromWatchlist":false}]`;

    try {
        return parseJSON<MoodPick[]>(await askGemini(prompt)) ?? [];
    } catch { return []; }
}

// ─── 4. AI Show Summary ───────────────────────────────────────────────────────
export async function getShowSummary(title: string, genres: string[], type: string): Promise<string> {
    const prompt = `Write a short exciting spoiler-free summary for "${title}" (${type}, genres: ${genres.join(', ')}).
Rules: max 3 sentences, no spoilers, present tense, sound like a passionate friend.
Return ONLY the summary text, no quotes.`;

    try {
        return (await askGemini(prompt)).trim().replace(/^["']|["']$/g, '');
    } catch {
        return 'Could not generate summary at this time.';
    }
}

// ─── 5. Taste Match Story ─────────────────────────────────────────────────────
export interface TasteStoryResult {
    story: string;
    compatibility: number;
    sharedTag: string;
    conflictTag: string;
}

export async function getTasteStory(
    user1: { genres: string[]; completed: string[] },
    user2: { genres: string[]; completed: string[] },
): Promise<TasteStoryResult> {
    const prompt = `Compare two users' taste profiles and write a fun compatibility report.

User 1 genres: ${user1.genres.slice(0, 5).join(', ')} | watched: ${user1.completed.slice(0, 5).join(', ')}
User 2 genres: ${user2.genres.slice(0, 5).join(', ')} | watched: ${user2.completed.slice(0, 5).join(', ')}

Return ONLY JSON:
{"story":"3-4 sentence fun horoscope-style personality paragraph","compatibility":0.78,"sharedTag":"what they share e.g. Dark Thriller Souls","conflictTag":"their difference e.g. Romance vs Action Split"}`;

    try {
        return parseJSON<TasteStoryResult>(await askGemini(prompt)) ?? {
            story: 'Your taste profiles create a uniquely compelling combination — contrasting styles that complement each other perfectly.',
            compatibility: 0.7,
            sharedTag: 'Genre Explorers',
            conflictTag: 'Style Contrast',
        };
    } catch {
        return { story: 'Your combined taste is an eclectic blend.', compatibility: 0.65, sharedTag: 'Diverse Watchers', conflictTag: 'Style Clash' };
    }
}

// ─── 5.5 Taste Personality (Single User) ──────────────────────────────────────
export async function getTastePersonality(
    genres: string[],
    completed: string[],
): Promise<string> {
    const prompt = `Analyze this user's taste profile.
    Top Genres: ${genres.slice(0, 5).join(', ')}
    Recently Watched: ${completed.slice(0, 5).join(', ')}

    Write a creative, fun "Taste Persona" description. Are they a "Chaos Binger"? A "Cozy Completionist"?
    Give them a cool title and a 2-sentence description of their vibe.

    Return ONLY the text.`;

    try {
        return (await askGemini(prompt)).trim().replace(/^["']|["']$/g, '');
    } catch {
        return 'The Mystery Viewer. Your taste defies simple classification.';
    }
}

// ─── 6. Similar After Rating ──────────────────────────────────────────────────

export interface SimilarTitle {
    title: string;
    type: string;
    emoji: string;
    similarity: string;
}

export async function getSimilarAfterRating(
    title: string,
    rating: number,
    genres: string[],
): Promise<SimilarTitle[]> {
    const sentiment = rating >= 8 ? 'loved' : rating >= 6 ? 'liked' : 'found okay';
    const prompt = `User rated "${title}" ${rating}/10 — they ${sentiment} it. Genres: ${genres.join(', ')}.

Suggest 4 similar titles to watch next. If rated high, recommend very similar. If average, suggest slight variations.

Return ONLY a JSON array:
[{"title":"title","type":"anime","emoji":"emoji","similarity":"why similar to ${title}"}]`;

    try {
        return parseJSON<SimilarTitle[]>(await askGemini(prompt)) ?? [];
    } catch { return []; }
}

// ─── 7. AI Daily Pick ─────────────────────────────────────────────────────────
export interface DailyPickResult {
    title: string;
    type: string;
    emoji: string;
    pitch: string;
    whyToday: string;
    timeCommitment: string;
}

export async function getDailyPick(
    planToWatch: { title: string; genres: string[]; type: string }[],
    topGenres: string[],
): Promise<DailyPickResult | null> {
    if (planToWatch.length === 0) return null;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const candidates = planToWatch.slice(0, 20).map(i => `"${i.title}" (${i.type})`).join(', ');

    const prompt = `Today is ${today}. Pick ONE perfect title from the user's Plan to Watch list.

Options: ${candidates}
Their top genres: ${topGenres.slice(0, 4).join(', ')}

Consider the day of week and create a compelling "why today" reason. Pick ONLY from the options list.

Return ONLY JSON:
{"title":"exact title from list","type":"anime","emoji":"emoji","pitch":"2 sentence exciting description","whyToday":"why TODAY is perfect for this","timeCommitment":"e.g. 24 min episodes"}`;

    try {
        return parseJSON<DailyPickResult>(await askGemini(prompt));
    } catch { return null; }
}
