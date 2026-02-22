import https from 'https';

console.log("Testing live Vercel proxy...");

const url = 'https://getkino.vercel.app/api/tmdb?endpoint=/search/multi&query=Avengers&language=en-US&page=1&include_adult=false';

https.get(url, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            console.log(`BODY: ${rawData}`);
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
