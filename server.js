
const http = require('http');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const SCRIPT_DIR = path.dirname(__filename);
const DRIVE_ROOT = SCRIPT_DIR[0] + ':\\';
const CACHE_DIR = path.join(DRIVE_ROOT, 'inca', 'cache', 'html');
const inputFilePath = path.join(CACHE_DIR, 'in.txt');
const tempFilePath  = path.join(CACHE_DIR, 'temp.txt');

let ELEVENLABS_API_KEY = null;
let ELEVEN_MODEL = "eleven_v3";
let VENICE_API_KEY = null;
let VENICE_MODEL = "elevenlabs-tts-v3";
const voiceMap = new Map();

const keyFilePath = path.join(DRIVE_ROOT, 'inca', 'cache', 'apps', 'elevenLabs_api.txt');

try {
    const content = fs.readFileSync(keyFilePath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith(';') || line.startsWith('#')) continue;
        const [key, value] = line.split('=').map(s => s.trim());
        if (!key || !value) continue;
        const k = key.toLowerCase();
        if (k === 'api') {
            ELEVENLABS_API_KEY = value;
        } else if (k === 'venice') {
            VENICE_API_KEY = value;
        } else if (k === 'model') {
            ELEVEN_MODEL = value;			// eg eleven_V3
        } else {
            voiceMap.set(k, value);			// e.g. Sarah, Tracy, Rachel → voice ID
        }
    }
} catch (e) {}

process.on('uncaughtException', (err) => {});

const server = http.createServer(async (req, res) => {
    try {
        if (req.method === 'POST' && req.url === '/generate-voice') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const { voiceName, text, provider = 'elevenlabs' } = data;

                    if (!text) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "text is required" }));
                        return;
                    }

                    let buffer;
                    let finalVoiceName = voiceName || 'Clone';


 if (provider === 'openaudio') {

    const voicePath = path.join(DRIVE_ROOT, 'inca', 'cache', 'voices', 'clones');
    const clonePath = path.join(voicePath, 'clone.mp3');			// retrieve and rename temp clone reference voice
    const finalPath = path.join(voicePath, voiceName + '.mp3');
    await fsPromises.access(finalPath).catch(() => fsPromises.rename(clonePath, finalPath));
    const refPath = path.join(DRIVE_ROOT, 'inca', 'cache', 'voices', 'clones', voiceName + '.mp3');
    const fileBuffer = await fsPromises.readFile(refPath);
    const uploadForm = new FormData();
    uploadForm.append('files', new Blob([fileBuffer], { type: 'audio/mpeg' }), 'voiceClone.mp3');
    const uploadData = await (await fetch('http://127.0.0.1:7860/gradio_api/upload', { method: 'POST', body: uploadForm })).json();
    const uploadedPath = uploadData[0];
    const session_hash = Math.random().toString(36).slice(2);
    await fetch('http://127.0.0.1:7860/gradio_api/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_name: "/partial", fn_index: 1, session_hash, event_data: null,
data: [ text, "", { path: uploadedPath, meta: { _type: "gradio.FileData" } }, "", 0, 300, 0.8, 1.1, 0.8, Math.floor(Math.random() * 1000), "off" ]        })
    });
    const rawText = await (await fetch(`http://127.0.0.1:7860/gradio_api/queue/data?session_hash=${session_hash}`)).text();
    const outputPath = rawText.match(/"path"\s*:\s*"([^"]+)"/)?.[1];
    if (!outputPath) throw new Error('No output path in queue response');
    const audioRes = await fetch(`http://127.0.0.1:7860/gradio_api/file=${outputPath.replace(/\\\\/g, '/')}`);
    if (!audioRes.ok) throw new Error(`Audio fetch failed: ${audioRes.status}`);
    buffer = Buffer.from(await audioRes.arrayBuffer());


                   } else if (provider === 'venice' && VENICE_API_KEY) {
                        const response = await fetch('https://api.venice.ai/api/v1/audio/speech', {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${VENICE_API_KEY}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                input: text,
                                model: VENICE_MODEL,
                                voice: voiceMap.get(voiceName?.toLowerCase()) || voiceName,
                                response_format: "mp3"
                            })
                        });

                        if (!response.ok) throw new Error(`Venice ${response.status}: ${await response.text()}`);
                        buffer = Buffer.from(await response.arrayBuffer());

                    } else if (provider === 'elevenlabs' && ELEVENLABS_API_KEY) {
                        const voiceId = voiceMap.get(voiceName?.toLowerCase());
                        if (!voiceId) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: `Voice "${voiceName}" not found in map` }));
                            return;
                        }

                        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                            method: "POST",
                            headers: {
                                "xi-api-key": ELEVENLABS_API_KEY,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                text: text,
                                model_id: ELEVEN_MODEL,
                                output_format: "mp3_44100_128"
                            })
                        });

                        if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
                        buffer = Buffer.from(await response.arrayBuffer());
                     }

                    // ====================== Save file ======================
                    const clean = str => str.replace(/[\\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').slice(0, 40);
                    const safeVoice = clean(finalVoiceName);
                    const safeText = clean(text);
                    const timestamp = new Date().toLocaleString('sv').replace(/:/g, '.');	// "2026-05-20 17.05.12"
                    const filename = `${safeVoice} - ${safeText} - ${timestamp}.mp3`;
                    const fullDir = path.join(DRIVE_ROOT, 'inca', 'cache', 'voices');
                    await fsPromises.mkdir(fullDir, { recursive: true });
                    const filepath = path.join(fullDir, filename);

                    await fsPromises.writeFile(filepath, buffer);

                    const publicPath = `/inca/cache/voices/${filename}`;

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        path: publicPath, 
                        voiceName: finalVoiceName,
                        filename 
                    }));

                } catch (err) {
                    console.error('Voice generation error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        // ====================== ORIGINAL CODE ======================
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (req.method === 'POST' && req.url === '/generate-html') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                const startTime = Date.now();
                await fsPromises.writeFile(inputFilePath, body);
                let responseSent = false;

                const waitForTempFile = async () => {
                    const maxWaitTime = 12000;
                    const pollInterval = 50;
                    while (Date.now() - startTime < maxWaitTime) {
                        try {
                            const stats = await fsPromises.stat(tempFilePath);
                            if (stats.mtimeMs > startTime) return true;
                        } catch (err) {}
                        await new Promise(resolve => setTimeout(resolve, pollInterval));
                    }
                    return false;
                };

                const tempFileUpdated = await waitForTempFile();
                if (!tempFileUpdated) {
                    res.end();
                    return;
                }
                responseSent = true;
                await serveHtmlFile(res, startTime);

                setTimeout(() => {
                    if (!responseSent) {
                        responseSent = true;
                        res.end();
                    }
                }, 6000);
            });
            return;
        }

        let relativePath = decodeURIComponent(req.url.slice(1)).replace(/%20/g, ' ');

        if (!relativePath || relativePath === '/' || relativePath.toLowerCase() === 'null') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end();
            return;
        }

        let driveLetter = DRIVE_ROOT[0];
        if (/^[a-zA-Z]:/.test(relativePath)) {
            driveLetter = relativePath[0].toUpperCase();
            relativePath = relativePath.slice(2);
            relativePath = relativePath.replace(/^[\\/]/, '');
        }
        relativePath = relativePath.replace(/\//g, '\\');
        let filePath = path.join(`${driveLetter}:\\`, relativePath);
        filePath = path.normalize(filePath).replace(/^(\.\.[\\\/])+/, '');

        if (!filePath.startsWith(`${driveLetter}:\\`)) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid file path');
            return;
        }

        let stats = await fsPromises.stat(filePath);
        if (stats.isDirectory()) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Directory listing not allowed');
            return;
        }

        await fsPromises.access(filePath, fs.constants.R_OK);

        const fileSize = stats.size;
        const ext = path.extname(filePath).toLowerCase();

        const mimeTypes = {
            '.ico': 'image/x-icon',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.webm': 'video/webm',
            '.m4v': 'video/x-m4v',
            '.mvb': 'video/x-mvb',
            '.mp3': 'audio/mpeg',
            '.m4a': 'audio/mp4',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.rtf': 'application/rtf',
            '.doc': 'application/msword',
            '.epub': 'application/epub+zip',
            '.mobi': 'application/x-mobipocket-ebook',
            '.htm': 'text/html',
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.ini': 'text/plain',
            '.ahk': 'text/plain',
            '.vtt': 'text/vtt',
            '.srt': 'text/plain',
            '.bat': 'text/plain',
            '.m3u': 'audio/x-mpegurl'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const headers = {
            'Accept-Ranges': 'bytes',
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store',
            'Content-Disposition': 'inline'
        };

        if (ext === '.html' || ext === '.htm') {
            headers['Content-Type'] = 'text/html';
            headers['Content-Disposition'] = 'inline';
        }

        if (req.headers.range) {
            const parts = req.headers.range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
                res.writeHead(416, { 'Content-Type': 'text/plain' });
                res.end('Requested Range Not Satisfiable');
                return;
            }

            const chunkSize = (end - start) + 1;
            headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
            headers['Content-Length'] = chunkSize;
            res.writeHead(206, headers);
            const stream = fs.createReadStream(filePath, { start, end });
            stream.pipe(res);
        } else {
            headers['Content-Length'] = fileSize;
            res.writeHead(200, headers);
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        }

    } catch (err) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
    }
});

async function serveHtmlFile(res, startTime) {
    try {
        const fileContent = await fsPromises.readFile(tempFilePath, 'utf8');
        if (!fileContent.trim()) {
            res.writeHead(200);
            res.end();
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/text' });
        res.end(fileContent);
    } catch (err) {
        res.end();
    }
}

server.listen(3000, '127.0.0.1', () => {
    console.log('Server running on http://127.0.0.1:3000');
});