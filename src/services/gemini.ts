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

        const prompt = `Analyze this screenshot from a TV show or movie. Provide detailed information and your TOP 3 MOST LIKELY MATCHES.

IMPORTANT: Always provide 3 possible matches, even if you're very confident about one. This helps users confirm the correct show.

For your analysis, identify:
1. **Primary Match** (your most confident guess):
   - Exact show/movie name
   - Confidence score (0.0-1.0)
   - Why you think it's this show

2. **Alternative Match #1** (second most likely):
   - Show/movie name
   - Confidence score
   - Reasoning

3. **Alternative Match #2** (third possibility):
   - Show/movie name
   - Confidence score
   - Reasoning

Also analyze:
- **Actors/Characters**: Any recognizable actors or character types
- **Setting**: Location, country, era (e.g., "Modern Korean office", "Historical palace")
- **Genre**: What genres does this appear to be?
- **Production Style**: K-drama, C-drama, American TV, Anime, etc.
- **Visual Clues**: Costumes, props, cinematography quality
- **Scene Context**: What's happening in this scene?

Return ONLY valid JSON in this exact format:
{
  "primaryMatch": {
    "showName": "exact title",
    "confidence": 0.85,
    "reason": "why you think it's this"
  },
  "alternatives": [
    {
      "showName": "alternative 1",
      "confidence": 0.65,
      "reason": "why it could be this"
    },
    {
      "showName": "alternative 2",
      "confidence": 0.45,
      "reason": "possible match because..."
    }
  ],
  "actors": ["actor names if recognizable"],
  "setting": "description",
  "genre": ["genre1", "genre2"],
  "era": "time period",
  "country": "country",
  "productionStyle": "style",
  "sceneDescription": "detailed description",
  "visualElements": ["element1", "element2"]
}

If you cannot identify the show at all, still provide 3 best guesses based on visual style and context.`;

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
        title: analysis.primaryMatch.showName || 'Unknown',
        confidence: analysis.primaryMatch.confidence,
        description: analysis.sceneDescription,
        alternatives: analysis.alternatives.map(a => a.showName)
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
        primaryMatch: {
            showName: 'Unknown',
            confidence: 0.5,
            reason: 'Could not parse AI response'
        },
        alternatives: [],
        setting: extractField(text, 'setting') || 'Unknown',
        genre: extractField(text, 'genre')?.split(',').map(g => g.trim()) || [],
        era: extractField(text, 'era') || 'Unknown',
        country: extractField(text, 'country') || 'Unknown',
        productionStyle: extractField(text, 'production') || 'Unknown',
        sceneDescription: text.substring(0, 200),
        visualElements: []
    };
}

function extractField(text: string, field: string): string | undefined {
    const regex = new RegExp(`${field}:?\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match?.[1]?.trim();
}
