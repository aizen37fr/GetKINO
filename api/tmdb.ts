/**
 * TMDB API Proxy - Serverless Function
 * Bypasses network restrictions by proxying TMDB requests through Vercel
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.VITE_TMDB_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { endpoint, ...queryParams } = req.query;

        if (!endpoint || typeof endpoint !== 'string') {
            return res.status(400).json({ error: 'Missing endpoint parameter' });
        }

        if (!API_KEY) {
            return res.status(500).json({ error: 'TMDB API key not configured' });
        }

        // Build the TMDB URL
        const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
        url.searchParams.set('api_key', API_KEY);

        // Add any additional query parameters
        Object.entries(queryParams).forEach(([key, value]) => {
            if (typeof value === 'string') {
                url.searchParams.set(key, value);
            }
        });

        console.log('Proxying TMDB request:', url.toString());

        // Fetch from TMDB
        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok) {
            console.error('TMDB API error:', data);
            return res.status(response.status).json(data);
        }

        // Return the data
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            error: 'Proxy failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
