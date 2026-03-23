/**
 * Reel Detector — Identify K-dramas, anime, movies from short video clips
 * Uses Groq's multimodal LLaMA 4 Scout model for frame-by-frame vision analysis
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export interface ReelDetectionResult {
    title: string;
    confidence: number;
    type: 'anime' | 'kdrama' | 'cdrama' | 'movie' | 'tv' | 'unknown';
    episode?: string;
    season?: string;
    characters?: string[];
    visualClues: string[];
    sceneDescription: string;
    alternatives: { title: string; confidence: number }[];
    spoilerLevel: 'safe' | 'mild' | 'spoiler';
    country?: string;
}

/**
 * Analyze a single frame (base64) using Groq vision
 */
async function analyzeFrame(base64Image: string, mimeType: string): Promise<string> {
    if (!GROQ_API_KEY) throw new Error('Groq API key not configured');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: VISION_MODEL,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                            },
                        },
                        {
                            type: 'text',
                            text: `You are KINO's Scene Detective. Identify the TV show, anime, movie, or drama in this frame.

Look for: character faces, costumes, art style, text/subtitles, Korean/Japanese/Chinese text, visual effects, setting, actor faces.

Return ONLY valid JSON:
{
  "title": "exact official title or 'Unknown'",
  "confidence": 0.85,
  "type": "kdrama",
  "episode": "Ep 7 Season 2 (or null)",
  "characters": ["character name if recognizable"],
  "visualClues": ["what gave it away", "e.g. Korean subtitles", "actor face", "specific costume"],
  "sceneDescription": "one sentence describing what's happening",
  "alternatives": [{"title": "possible alt", "confidence": 0.4}],
  "spoilerLevel": "safe",
  "country": "South Korea"
}

type must be: anime, kdrama, cdrama, movie, tv, unknown
spoilerLevel: safe (no spoilers), mild (minor), spoiler (major plot event)
confidence: 0.9+ only if you are very certain`,
                        },
                    ],
                },
            ],
            temperature: 0.3,
            max_tokens: 800,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq vision error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices[0].message.content as string;
}

/**
 * Parse raw JSON from model output
 */
function parseResult(raw: string): Partial<ReelDetectionResult> | null {
    try {
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) return null;
        return JSON.parse(match[0]);
    } catch {
        return null;
    }
}

/**
 * Analyze multiple frames and merge results for higher accuracy
 */
export async function detectFromFrames(
    frames: { data: string; mimeType: string; timestamp: number }[]
): Promise<ReelDetectionResult> {
    const results: Partial<ReelDetectionResult>[] = [];

    // Analyze up to 5 frames (spread across the clip for diversity)
    const toAnalyze = frames.length <= 5
        ? frames
        : [
              frames[0],
              frames[Math.floor(frames.length * 0.25)],
              frames[Math.floor(frames.length * 0.5)],
              frames[Math.floor(frames.length * 0.75)],
              frames[frames.length - 1],
          ];

    for (const frame of toAnalyze) {
        try {
            const raw = await analyzeFrame(frame.data, frame.mimeType);
            const parsed = parseResult(raw);
            if (parsed) results.push(parsed);
        } catch (e) {
            console.warn('Frame analysis failed:', e);
        }
    }

    if (results.length === 0) {
        return {
            title: 'Unknown',
            confidence: 0,
            type: 'unknown',
            visualClues: [],
            sceneDescription: 'Could not identify content from this clip.',
            alternatives: [],
            spoilerLevel: 'safe',
        };
    }

    // Vote: find the most common title across frames
    const titleVotes: Record<string, { count: number; confidence: number }> = {};
    for (const r of results) {
        if (!r.title || r.title === 'Unknown') continue;
        const key = r.title.toLowerCase();
        if (!titleVotes[key]) titleVotes[key] = { count: 0, confidence: 0 };
        titleVotes[key].count++;
        titleVotes[key].confidence = Math.max(titleVotes[key].confidence, r.confidence ?? 0);
    }

    const sortedTitles = Object.entries(titleVotes).sort(
        (a, b) => b[1].count * b[1].confidence - a[1].count * a[1].confidence
    );

    const winner = sortedTitles[0];
    const best = results.find(r => r.title?.toLowerCase() === winner?.[0]) ?? results[0];

    // Merge visual clues from all frames
    const allClues = results.flatMap(r => r.visualClues ?? []);
    const uniqueClues = [...new Set(allClues)].slice(0, 6);

    // Boost confidence if multiple frames agree
    const agreedFrames = winner ? titleVotes[winner[0]].count : 0;
    const boostedConfidence = Math.min(
        (best.confidence ?? 0.5) + (agreedFrames - 1) * 0.05,
        0.99
    );

    return {
        title: best.title ?? 'Unknown',
        confidence: boostedConfidence,
        type: best.type ?? 'unknown',
        episode: best.episode ?? undefined,
        season: best.season ?? undefined,
        characters: best.characters ?? [],
        visualClues: uniqueClues,
        sceneDescription: best.sceneDescription ?? '',
        alternatives: best.alternatives ?? [],
        spoilerLevel: best.spoilerLevel ?? 'safe',
        country: best.country ?? undefined,
    };
}

/**
 * Analyze a single screenshot image
 */
export async function detectFromImage(file: File): Promise<ReelDetectionResult> {
    const base64 = await fileToBase64(file);
    const base64Data = base64.split(',')[1];

    const raw = await analyzeFrame(base64Data, file.type || 'image/jpeg');
    const parsed = parseResult(raw);

    if (!parsed) {
        return {
            title: 'Unknown',
            confidence: 0,
            type: 'unknown',
            visualClues: [],
            sceneDescription: 'Could not parse AI response.',
            alternatives: [],
            spoilerLevel: 'safe',
        };
    }

    return {
        title: parsed.title ?? 'Unknown',
        confidence: parsed.confidence ?? 0.5,
        type: parsed.type ?? 'unknown',
        episode: parsed.episode ?? undefined,
        characters: parsed.characters ?? [],
        visualClues: parsed.visualClues ?? [],
        sceneDescription: parsed.sceneDescription ?? '',
        alternatives: parsed.alternatives ?? [],
        spoilerLevel: parsed.spoilerLevel ?? 'safe',
        country: parsed.country ?? undefined,
    };
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
