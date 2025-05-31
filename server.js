const http = require('http');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const server = http.createServer(async (req, res) => {
  try {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Handle POST to generate HTML
    if (req.method === 'POST' && req.url === '/generate-html') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        console.log(`Received POST command: ${body}`);
        const startTime = Date.now();
        const inputFilePath = 'C:\\inca\\cache\\html\\in.txt';

        try {
          await fsPromises.writeFile(inputFilePath, body);
          console.log(`Wrote POST body to ${inputFilePath}`);
        } catch (err) {
          console.error(`Failed to write to ${inputFilePath}: ${err.message}`);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`Failed to write to in.txt: ${err.message}`);
          return;
        }

        let responseSent = false;

        const waitForTempFile = async () => {
          const tempFilePath = 'C:\\inca\\cache\\html\\temp.txt';
          const maxWaitTime = 9999;
          const pollInterval = 50;

          while (Date.now() - startTime < maxWaitTime) {
            try {
              const stats = await fsPromises.stat(tempFilePath);
              if (stats.mtimeMs > startTime) {
                console.log(`temp.txt updated at ${stats.mtime}`);
                return true;
              }
            } catch (err) {
              // File might not exist yet
            }
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
          console.log('Timeout: temp.txt not updated within 6 seconds');
          return false;
        };

        const tempFileUpdated = await waitForTempFile();
        if (!tempFileUpdated) {
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Failed to serve HTML file: temp.txt not updated in time');
          return;
        }

        responseSent = true;
        await serveHtmlFile(res, startTime);

        setTimeout(() => {
          if (!responseSent) {
            console.log('Timeout: Processing took too long (>6000ms)');
            responseSent = true;
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Failed to serve HTML file: Processing timed out');
          }
        }, 6000);
      });
      return;
    }

    // Handle static file serving
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
      console.log(`Invalid file path: ${filePath}`);
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid file path');
      return;
    }

    console.log(`Requested URL: ${req.url}`);
    console.log(`Resolved Path: ${filePath}`);

    // Check file existence
    try {
      await fsPromises.access(filePath, fs.constants.R_OK);
      console.log(`Found File: ${filePath}`);
    } catch (err) {
      console.log(`Error: File not found - ${filePath} (Error: ${err.message})`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`File Not Found: ${filePath}`);
      return;
    }

    // Get file stats
    let stats;
    try {
      stats = await fsPromises.stat(filePath);
    } catch (err) {
      console.log(`Error: Stats failed - ${filePath} (Error: ${err.message})`);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error reading file stats: ${filePath}`);
      return;
    }
    const fileSize = stats.size;

    // Determine MIME type
    const ext = path.extname(filePath).toLowerCase();
const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.wmv': 'video/x-ms-wmv',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mpg': 'video/mpeg',
  '.mpeg': 'video/mpeg',
  '.flv': 'video/x-flv',
  '.divx': 'video/divx',
  '.mkv': 'video/x-matroska',
  '.asf': 'video/x-ms-asf',
  '.m4v': 'video/x-m4v',
  '.mvb': 'video/x-mvb', // Note: .mvb is not standard; using a generic video MIME type
  '.rmvb': 'video/rmvb', // Note: .rmvb is not standard; using a custom MIME type
  '.vob': 'video/dvd',
  '.rm': 'application/vnd.rn-realmedia',
  '.ts': 'video/mp2t',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wma': 'audio/x-ms-wma',
  '.mid': 'audio/midi',
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
  '.ico': 'image/x-icon' // Retained from original mimeTypes
};
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Common headers
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

    console.log(`Serving file: ${filePath} with Content-Type: ${headers['Content-Type']}, Content-Disposition: ${headers['Content-Disposition']}`);

    // Handle range requests
    if (req.headers.range) {
      const parts = req.headers.range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
        console.log(`Invalid range request: ${req.headers.range}`);
        res.writeHead(416, { 'Content-Type': 'text/plain' });
        res.end('Requested Range Not Satisfiable');
        return;
      }

      const chunkSize = (end - start) + 1;
      headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
      headers['Content-Length'] = chunkSize;

      res.writeHead(206, headers);
      const stream = fs.createReadStream(filePath, { start, end });
      stream.on('error', (err) => {
        console.log(`Stream Error: ${filePath} (Error: ${err.message})`);
        res.writeHead(500);
        res.end('Stream error');
      });
      res.on('close', () => {
        stream.destroy();
        console.log(`Stream closed for ${filePath}`);
      });
      stream.on('data', () => console.log(`Streaming data for ${filePath}`));
      stream.on('end', () => console.log(`Finished streaming ${filePath}`));
      stream.pipe(res);
    } else {
      headers['Content-Length'] = fileSize;
      res.writeHead(200, headers);
      const stream = fs.createReadStream(filePath);
      stream.on('error', (err) => {
        console.log(`Stream Error: ${filePath} (Error: ${err.message})`);
        res.writeHead(500);
        res.end('Stream error');
      });
      res.on('close', () => {
        stream.destroy();
        console.log(`Stream closed for ${filePath}`);
      });
      stream.on('data', () => console.log(`Streaming data for ${filePath}`));
      stream.on('end', () => console.log(`Finished streaming ${filePath}`));
      stream.pipe(res);
    }
  } catch (err) {
    console.error(`Server Error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

async function serveHtmlFile(res, startTime) {
  try {
    const tempFilePath = 'C:\\inca\\cache\\html\\temp.txt';
    const filename = await fsPromises.readFile(tempFilePath, 'utf8').then(data => data.trim());
    console.log(`Read filename from ${tempFilePath}: ${filename}`);

    if (!filename.match(/\.(htm|html)$/i)) {
      throw new Error('Invalid filename: must have .htm or .html extension');
    }

    const filepath = path.join('C:\\inca\\cache\\html', filename);
    const url = `/inca/cache/html/${filename}`;

    await fsPromises.access(filepath);
    console.log(`Serving HTML URL: ${filepath}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ url }));
  } catch (err) {
    console.error('Error in serveHtmlFile:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Failed to serve HTML file: ${err.message}`);
  }
}

server.listen(3000, '127.0.0.1', () => {
  console.log('Server running at http://127.0.0.1:3000');
});