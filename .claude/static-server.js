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

http.createServer((req, res) => {
  const isHead = req.method === 'HEAD';
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  let fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.stat(fp, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA-ish fallback: serve index.html for clean routes without extension
      if (!path.extname(fp)) return fs.readFile(path.join(ROOT,'index.html'), (e,d)=>{
        if(e){res.writeHead(404);return res.end('not found');}
        res.writeHead(200,{'Content-Type':'text/html'});res.end(d);
      });
      res.writeHead(404); return res.end('not found');
    }
    const type = TYPES[path.extname(fp).toLowerCase()] || 'application/octet-stream';
    const range = parseRange(req.headers.range, stat.size);
    if (range === 'invalid') {
      res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size, 'Accept-Ranges': 'bytes' });
      return res.end();
    }
    if (range) {
      return send(res, 206, {
        'Content-Type': type,
        'Accept-Ranges': 'bytes',
        'Content-Range': 'bytes ' + range.start + '-' + range.end + '/' + stat.size,
        'Content-Length': range.end - range.start + 1
      }, fp, range, isHead);
    }
    send(res, 200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': stat.size }, fp, null, isHead);
  });
}).listen(PORT, () => console.log('static server on http://localhost:'+PORT));
