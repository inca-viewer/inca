const http = require('http');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const SCRIPT_DIR = path.dirname(__filename);
const DRIVE_ROOT = SCRIPT_DIR[0] + ':\\';
const CACHE_DIR = path.join(DRIVE_ROOT, 'inca', 'cache', 'html');
const inputFilePath = path.join(CACHE_DIR, 'in.txt');
const tempFilePath  = path.join(CACHE_DIR, 'out.txt');

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
                    let { voiceName, text, provider = 'elevenlabs', title: mediaTitle } = data;

                    if (!text) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "text is required" }));
                        return;
                    }
                    let buffer;
                    let finalVoiceName = voiceName;
                    if (provider === 'chatterbox' && text) {
                        text = text
                            .replace(/\n+/g, '. ')      // newlines → sentence break
                            .replace(/\s+/g, ' ')       // normalize spaces
                            .replace(/\.\s*\./g, '.')   // clean ".."
                            .trim();
                    }


// added reference_audio_path, format and max_reference_duration_sec to config.yaml
// chatterbox only uses wav, server.py commented out "import webbrowser"



 if (provider === 'chatterbox') {
    const refFilename = (voiceName || 'Clone') + '.mp3';
    const voicePath = path.join(DRIVE_ROOT, 'inca', 'cache', 'voices', 'clones', refFilename);
    const fileBuffer = await fsPromises.readFile(voicePath);
    const uploadForm = new FormData();
    uploadForm.append('files', new Blob([fileBuffer], { type: 'audio/mpeg' }), refFilename);
    const uploadRes = await fetch('http://127.0.0.1:8004/api/reference-audio', { method: 'POST', body: uploadForm });
    const ttsRes = await fetch('http://127.0.0.1:8004/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text,
            exaggeration: 1.4,
            voice_mode: 'clone',
            reference_audio_filename: refFilename
        })
    });
    if (!ttsRes.ok) {
        const errText = await ttsRes.text();
        throw new Error(`Chatterbox ${ttsRes.status}: ${errText}`);
    }
    buffer = Buffer.from(await ttsRes.arrayBuffer());



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

const clean = str => str.replace(/[\\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ') 
const safeVoice = clean(finalVoiceName).slice(0, 20).trim();
let textSize = 36 - safeVoice.length
const safeText = clean(text + ' QQQ').slice(0, textSize).replace(/\s+\S*$/, '').replace(/[.,;—…]+$/, '').trim();
const timestamp = new Date().toLocaleString('sv').replace(/:/g, '.');
const filename = `${safeVoice} - ${safeText} - ${timestamp}.mp3`;
const fullDir = path.join(DRIVE_ROOT, 'inca', 'cache', 'voices', mediaTitle);
await fsPromises.mkdir(fullDir, { recursive: true });

if (provider === 'chatterbox') {
  const ffmpeg = path.join(DRIVE_ROOT, 'inca', 'cache', 'apps', 'ffmpeg.exe');
  const tmp = path.join(fullDir, '_tmp.wav');
  const norm = path.join(fullDir, '_norm.mp3');
  await fsPromises.writeFile(tmp, buffer);
  require('child_process').execSync(`"${ffmpeg}" -y -i "${tmp}" -af "loudnorm=I=-24:TP=-3:LRA=7:linear=true" "${norm}"`);
  buffer = await fsPromises.readFile(norm);
  fsPromises.unlink(tmp).catch(()=>{});
  fsPromises.unlink(norm).catch(()=>{})}

const filepath = path.join(fullDir, filename);
await fsPromises.writeFile(filepath, buffer);
const publicPath = mediaTitle 
    ? `/inca/cache/voices/${mediaTitle}/${filename}`
    : `/inca/cache/voices/${filename}`;
res.writeHead(200, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ path: publicPath, voiceName: finalVoiceName, filename }));
} catch (err) {
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

// Clear out.txt once consumed
// fsPromises.writeFile(tempFilePath, '').catch(() => {});


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