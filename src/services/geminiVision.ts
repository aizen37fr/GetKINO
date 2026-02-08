/**
 * Gemini Vision API Service
 * Uses Google's Gemini AI to identify K-dramas and C-dramas from screenshots
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

interface GeminiResponse {
    title: string;
    originalTitle: string;
    year?: number;
    confidence: number;
    type: 'kdrama' | 'cdrama' | 'unknown';
}

/**
 * Convert image to base64 for Gemini API
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

        // Prepare Gemini request
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `Analyze this image and identify if it's from a Korean drama (K-drama) or Chinese drama (C-drama).

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

Only return the JSON, nothing else.`
                    },
                    {
                        inline_data: {
                            mime_type: 'image/jpeg',
                            data: base64Image
                        }
                    }
                ]
            }]
        };

        // Call Gemini API
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error('Gemini API error:', response.status, response.statusText);
            return null;
        }

        const data = await response.json();

        // Extract text from Gemini response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            console.error('No text in Gemini response');
            return null;
        }

        console.log('Gemini raw response:', text);

        // Parse JSON from response
        // Remove markdown code blocks if present
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(cleanedText);

        console.log('Gemini parsed result:', result);

        // Validate result
        if (result.confidence > 0.5 && result.title) {
            return {
                title: result.title,
                originalTitle: result.originalTitle || result.title,
                year: result.year,
                confidence: result.confidence,
                type: result.type === 'kdrama' || result.type === 'cdrama' ? result.type : 'unknown'
            };
        }

        return null;
    } catch (error) {
        console.error('Gemini Vision error:', error);
        return null;
    }
}
