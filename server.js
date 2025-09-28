
const http = require('http');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

process.on('uncaughtException', (err) => {});

const server = http.createServer(async (req, res) => {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (req.method === 'POST' && req.url === '/generate-html') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                const startTime = Date.now();
                const inputFilePath = 'C:\\inca\\cache\\html\\in.txt';
                await fsPromises.writeFile(inputFilePath, body);
                let responseSent = false;
                const waitForTempFile = async () => {
                    const tempFilePath = 'C:\\inca\\cache\\html\\temp.txt';
                    const maxWaitTime = 9999;
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
        let driveLetter = 'C';
        if (/^[a-zA-Z]:/.test(relativePath)) {
            driveLetter = relativePath[0].toUpperCase();
            relativePath = relativePath.slice(2);
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
            '.srt': 'text/srt',
            '.bat': 'text/plain',
            '.m3u': 'audio/x-mpegurl',
            '.ico': 'image/x-icon'
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
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
});

async function serveHtmlFile(res, startTime) {
    try {
        const tempFilePath = 'C:\\inca\\cache\\html\\temp.txt';
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

server.listen(3000, '127.0.0.1', () => {});