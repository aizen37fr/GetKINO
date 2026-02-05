import Tesseract from 'tesseract.js';

/**
 * Extract text from image using OCR (Optical Character Recognition)
 * FREE, open-source, supports Korean, Chinese, English
 */
export async function extractTextFromImage(imageFile: File): Promise<{
    text: string;
    confidence: number;
    words: string[];
}> {
    try {
        console.log('🔍 OCR: Extracting text from screenshot...');

        const result = await Tesseract.recognize(
            imageFile,
            'eng+kor+chi_sim+chi_tra', // English + Korean + Simplified Chinese + Traditional Chinese
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
                    }
                }
            }
        );

        const text = result.data.text.trim();
        const words = text
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !word.match(/^[\d\W]+$/)); // Remove numbers and special chars only

        console.log('✅ OCR Result:', {
            text: text.substring(0, 100),
            confidence: result.data.confidence,
            wordCount: words.length
        });

        return {
            text,
            confidence: result.data.confidence / 100, // Convert to 0-1 range
            words
        };

    } catch (error) {
        console.error('OCR extraction failed:', error);
        return {
            text: '',
            confidence: 0,
            words: []
        };
    }
}

/**
 * Clean and extract potential titles from OCR text
 */
export function extractPotentialTitles(text: string, words: string[]): string[] {
    const titles: string[] = [];

    // 1. Try to find title-like patterns (all caps, quoted text, etc.)
    const allCapsMatches = text.match(/[A-Z][A-Z\s]{3,}/g);
    if (allCapsMatches) {
        titles.push(...allCapsMatches.map(t => t.trim()));
    }

    // 2. Look for quoted text (common for titles)
    const quotedMatches = text.match(/"([^"]+)"/g);
    if (quotedMatches) {
        titles.push(...quotedMatches.map(t => t.replace(/"/g, '').trim()));
    }

    // 3. Use first few words (often the title)
    if (words.length >= 2) {
        titles.push(words.slice(0, 3).join(' '));
        titles.push(words.slice(0, 4).join(' '));
    }

    // 4. Look for Korean/Chinese text (likely the title)
    const koreanMatches = text.match(/[가-힣]{2,}/g);
    if (koreanMatches) {
        titles.push(...koreanMatches);
    }

    const chineseMatches = text.match(/[\u4e00-\u9fa5]{2,}/g);
    if (chineseMatches) {
        titles.push(...chineseMatches);
    }

    // Remove duplicates and sort by length (longer = more specific)
    return [...new Set(titles)]
        .filter(t => t.length >= 3)
        .sort((a, b) => b.length - a.length);
}
