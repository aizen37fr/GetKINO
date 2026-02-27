const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const keyMatch = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : '';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const prompt = `You are KINO's AI search engine. The user typed: "dark psychological anime like Death Note"

Find 6 REAL anime, movies, or TV shows matching this description/vibe. Only suggest titles that actually exist.

Return ONLY a JSON array:
[{"title":"exact title","type":"anime","year":2021,"genres":["Genre1"],"why":"why it matches","emoji":"emoji"}]`;

model.generateContent(prompt).then(res => {
    const text = res.response.text();
    console.log('RAW RESPONSE:');
    console.log(text);

    try {
        const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        console.log('JSON PARSED:', !!m && !!JSON.parse(m[0]));
        console.log('PARSED DATA:', JSON.parse(m[0]));
    } catch (e) {
        console.error('PARSE ERROR', e);
    }
}).catch(console.error);
