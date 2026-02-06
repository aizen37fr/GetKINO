/**
 * Google Gemini Vision AI Service
 * Advanced scene analysis and content detection
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn('⚠️ Gemini API key not found');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

export interface GeminiAnalysis {
    showName?: string;
    actors?: string[];
    setting: string;
    genre: string[];
    era: string;
    country: string;
    productionStyle: string;
    sceneDescription: string;
    visualElements: string[];
    confidence: number;
    alternativeMatches?: string[];
}

/**
 * Analyze an image using Gemini Vision
 */
export async function analyzeWithGemini(imageFile: File): Promise<GeminiAnalysis | null> {
    if (!API_KEY) {
        console.error('Gemini API key not configured');
        return null;
    }

    try {
        console.log('🤖 Gemini: Analyzing image...');

        // Convert file to base64
        const base64 = await fileToBase64(imageFile);
        const base64Data = base64.split(',')[1]; // Remove data:image/... prefix

        // Use Gemini 2.0 Flash for vision (fastest, Pro subscription)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `Analyze this screenshot from a TV show or movie. Provide detailed information:

1. **Show/Movie Name**: If you can identify it, what is the exact title?
2. **Actors**: Can you identify any actors or characters? List them.
3. **Setting**: Where is this scene taking place? (e.g., "Modern Korean office", "Historical palace", "American high school")
4. **Genre**: What genres does this appear to be? (Romance, Action, Comedy, Drama, etc.)
5. **Era**: What time period? (Contemporary 2020s, 2010s, Historical, etc.)
6. **Country**: What country is this production from? (Korea, USA, Japan, China, etc.)
7. **Production Style**: What type of production? (K-drama, C-drama, American TV, Anime, Netflix series, etc.)
8. **Scene Description**: Describe what's happening in detail
9. **Visual Elements**: List key visual elements (costumes, props, setting details)
10. **Alternative Matches**: If unsure, list 2-3 possible shows this could be from

Be specific and detailed. If you're certain about the show name, state it clearly. If unsure, provide your best guesses.

Format your response as JSON:
{
    "showName": "exact title or null if unknown",
    "actors": ["actor names if recognizable"],
    "setting": "description",
    "genre": ["genre1", "genre2"],
    "era": "time period",
    "country": "country",
    "productionStyle": "style",
    "sceneDescription": "detailed description",
    "visualElements": ["element1", "element2"],
    "confidence": 0.0-1.0,
    "alternativeMatches": ["show1", "show2", "show3"]
}`;

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType: imageFile.type,
                    data: base64Data
                }
            }
        ]);

        const response = result.response;
        const text = response.text();

        console.log('🤖 Gemini response:', text);

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis: GeminiAnalysis = JSON.parse(jsonMatch[0]);
            console.log('✅ Gemini analysis:', analysis);
            return analysis;
        }

        // Fallback: parse text response
        return parseTextResponse(text);

    } catch (error) {
        console.error('❌ Gemini error:', error);
        return null;
    }
}

/**
 * Identify content with high accuracy
 */
export async function identifyContent(imageFile: File): Promise<{
    title: string;
    confidence: number;
    description: string;
    alternatives: string[];
} | null> {
    const analysis = await analyzeWithGemini(imageFile);

    if (!analysis) return null;

    return {
        title: analysis.showName || 'Unknown',
        confidence: analysis.confidence,
        description: analysis.sceneDescription,
        alternatives: analysis.alternativeMatches || []
    };
}

// Helper functions
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function parseTextResponse(text: string): GeminiAnalysis {
    // Fallback parser for non-JSON responses
    return {
        setting: extractField(text, 'setting') || 'Unknown',
        genre: extractField(text, 'genre')?.split(',').map(g => g.trim()) || [],
        era: extractField(text, 'era') || 'Unknown',
        country: extractField(text, 'country') || 'Unknown',
        productionStyle: extractField(text, 'production') || 'Unknown',
        sceneDescription: text.substring(0, 200),
        visualElements: [],
        confidence: 0.5
    };
}

function extractField(text: string, field: string): string | undefined {
    const regex = new RegExp(`${field}:?\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match?.[1]?.trim();
}
