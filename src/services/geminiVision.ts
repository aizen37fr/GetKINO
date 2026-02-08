/**
 * Gemini Vision API Service
 * Uses Google's Gemini AI SDK to identify K-dramas and C-dramas from screenshots
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('⚠️ Gemini API key not found');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

interface GeminiResponse {
    title: string;
    originalTitle: string;
    year?: number;
    confidence: number;
    type: 'kdrama' | 'cdrama' | 'unknown';
}

/**
 * Convert image URL/data to base64 data
 */
async function imageToBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remove data:image/...;base64, prefix
            resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Identify drama from screenshot using Gemini Vision
 */
export async function identifyDramaFromImage(imageUrl: string): Promise<GeminiResponse | null> {
    try {
        console.log('🔍 Analyzing drama screenshot with Gemini Vision...');

        // Convert image to base64
        const base64Image = await imageToBase64(imageUrl);

        // Use Gemini 1.5 Flash for vision
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Analyze this image and identify if it's from a Korean drama (K-drama) or Chinese drama (C-drama).

Please provide the following information in JSON format:
{
  "title": "English title of the drama",
  "originalTitle": "Original Korean/Chinese title",
  "year": Year it was released (number),
  "type": "kdrama" or "cdrama",
  "confidence": Your confidence level from 0.0 to 1.0
}

If you cannot identify the drama, return:
{
  "title": "",
  "originalTitle": "",
  "confidence": 0.0,
  "type": "unknown"
}

Only return the JSON, nothing else.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        console.log('Gemini raw response:', text);

        // Parse JSON from response
        // Remove markdown code blocks if present
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        console.log('Gemini parsed result:', parsed);

        // Validate result
        if (parsed.confidence > 0.5 && parsed.title) {
            return {
                title: parsed.title,
                originalTitle: parsed.originalTitle || parsed.title,
                year: parsed.year,
                confidence: parsed.confidence,
                type: parsed.type === 'kdrama' || parsed.type === 'cdrama' ? parsed.type : 'unknown'
            };
        }

        return null;
    } catch (error) {
        console.error('Gemini Vision error:', error);
        return null;
    }
}
