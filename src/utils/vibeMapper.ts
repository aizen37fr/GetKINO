import type { Mood } from '../data/db';

export interface VibeResponse {
    mood: Mood;
    keywords: string[];
    diagnosticCode: string; // e.g., "EMO-99"
    prescriptionType: string; // e.g., "Serotonin Boost"
}

// Simple rule-based "AI" to map input -> Vibe
export const mapVibeToQuery = (input: string): VibeResponse | null => {
    const text = input.toLowerCase();

    if (text.includes('sad') || text.includes('cry') || text.includes('breakup') || text.includes('tear') || text.includes('lonely')) {
        return {
            mood: 'Emotional',
            keywords: ['drama', 'romance'],
            diagnosticCode: 'ACUTE-MELANCHOLIA',
            prescriptionType: 'Catharsis Therapy'
        };
    }
    if (text.includes('laugh') || text.includes('funny') || text.includes('comedy') || text.includes('happy') || text.includes('bored')) {
        return {
            mood: 'Laugh',
            keywords: ['comedy'],
            diagnosticCode: 'DOPAMINE-DEFICIENCY',
            prescriptionType: 'Instant Serotonin'
        };
    }
    if (text.includes('scary') || text.includes('horror') || text.includes('dark') || text.includes('nightmare') || text.includes('fear')) {
        return {
            mood: 'Scared',
            keywords: ['horror', 'thriller'],
            diagnosticCode: 'ADRENAL-REQ-404',
            prescriptionType: 'Shock Treatment'
        };
    }
    if (text.includes('action') || text.includes('fast') || text.includes('fight') || text.includes('explosion') || text.includes('hype')) {
        return {
            mood: 'Excited',
            keywords: ['action', 'adventure'],
            diagnosticCode: 'LETHARGY-DETECTED',
            prescriptionType: 'Adrenaline Injection'
        };
    }
    if (text.includes('mind') || text.includes('think') || text.includes('twist') || text.includes('confus') || text.includes('smart')) {
        return {
            mood: 'Mind-bending',
            keywords: ['science fiction', 'mystery'],
            diagnosticCode: 'NEURAL-STAGNATION',
            prescriptionType: 'Cerebral Expansion'
        };
    }
    if (text.includes('chill') || text.includes('relax') || text.includes('calm') || text.includes('sleep') || text.includes('vibe')) {
        return {
            mood: 'Chill',
            keywords: ['animation', 'family', 'documentary'],
            diagnosticCode: 'CORTISOL-OVERLOAD',
            prescriptionType: 'System Reset'
        };
    }

    return null; // No clear match
};
