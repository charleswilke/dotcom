const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 8080;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.webp':'image/webp', '.png':'image/png',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.svg':'image/svg+xml',
  '.ico':'image/x-icon', '.mp3':'audio/mpeg', '.mp4':'video/mp4', '.woff2':'font/woff2' };

// Byte-range support matters for more than politeness: without Accept-Ranges the
// browser reports media as unseekable (audio.seekable stays [0,0]) and clamps
// every seek to zero, which makes the album players' time vial look broken on
// localhost while working fine on Vercel. Returns a {start,end} pair, null to
// serve the whole file, or 'invalid' for an unsatisfiable range (416).
function parseRange(header, size) {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null; // multi-range or malformed — fall back to the full body
  const hasStart = m[1] !== '', hasEnd = m[2] !== '';
  if (!hasStart && !hasEnd) return null;
  let start, end;
  if (!hasStart) {
    const suffix = Number(m[2]); // bytes=-N → final N bytes
    if (suffix === 0) return 'invalid';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = hasEnd ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  if (start > end || start >= size) return 'invalid';
  return { start, end };
}

function send(res, code, headers, fp, range, isHead) {
  res.writeHead(code, headers);
  if (isHead) return res.end();
  const stream = fs.createReadStream(fp, range || {});
  stream.on('error', () => res.end());
  res.on('close', () => stream.destroy()); // client seeked away mid-response
  stream.pipe(res);
}

function createServer(root = ROOT) {
  // Resolve symlinks as well as '..'; a lexical prefix alone is not containment.
  const realRoot = fs.realpathSync(root);
  const contained = fp => fp === realRoot || fp.startsWith(realRoot + path.sep);
  const hidden = fp => path.relative(realRoot, fp).split(path.sep).some(part => part.startsWith('.'));
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end();
    }
    let pathname;
    try { pathname = decodeURIComponent((req.url || '').split('?')[0]); }
    catch { res.writeHead(400); return res.end('Bad Request'); }
    if (!pathname.startsWith('/') || pathname.includes('\0')) {
      res.writeHead(400); return res.end('Bad Request');
    }
    if (pathname.endsWith('/')) pathname += 'index.html';
    let file = path.resolve(realRoot, '.' + pathname);
    if (!contained(file) || hidden(file)) { res.writeHead(403); return res.end('Forbidden'); }
    try {
      try { file = await fs.promises.realpath(file); }
      catch (error) {
        // Preserve the existing clean-route homepage fallback.
        if (error.code !== 'ENOENT' || path.extname(file)) throw error;
        file = await fs.promises.realpath(path.join(realRoot, 'index.html'));
      }
      if (!contained(file) || hidden(file)) { res.writeHead(403); return res.end('Forbidden'); }
      const stat = await fs.promises.stat(file);
      if (!stat.isFile()) { res.writeHead(404); return res.end('Not Found'); }
      const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
      const range = parseRange(req.headers.range, stat.size);
      if (range === 'invalid') {
        res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size, 'Accept-Ranges': 'bytes' });
        return res.end();
      }
      const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': stat.size };
      if (range) {
        headers['Content-Range'] = `bytes ${range.start}-${range.end}/${stat.size}`;
        headers['Content-Length'] = range.end - range.start + 1;
      }
      send(res, range ? 206 : 200, headers, file, range, req.method === 'HEAD');
    } catch {
      res.writeHead(404); res.end('Not Found');
    }
  });
}

if (require.main === module) {
  createServer().listen(PORT, '127.0.0.1', () => console.log('static server on http://localhost:'+PORT));
}
module.exports = { createServer, parseRange };
