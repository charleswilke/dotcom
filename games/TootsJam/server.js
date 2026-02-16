const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8080);
const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const scoresFile = path.join(dataDir, "scores.json");
const postWindowMs = 60 * 1000;
const postLimitPerWindow = 8;
const maxStoredScores = 2000;
const postCounters = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(scoresFile);
  } catch {
    await fs.writeFile(scoresFile, "[]\n", "utf8");
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

function sanitizeInitials(raw) {
  return String(raw || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function compareScoresDesc(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  return String(a.createdAt).localeCompare(String(b.createdAt));
}

async function readScores() {
  await ensureDataFile();
  try {
    const content = await fs.readFile(scoresFile, "utf8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) =>
      entry &&
      typeof entry.initials === "string" &&
      Number.isInteger(entry.score) &&
      typeof entry.createdAt === "string"
    );
  } catch {
    return [];
  }
}

async function writeScores(scores) {
  const sorted = [...scores].sort(compareScoresDesc).slice(0, maxStoredScores);
  await fs.writeFile(scoresFile, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function allowedToPost(ip) {
  const now = Date.now();
  const current = postCounters.get(ip);
  if (!current || now >= current.resetAt) {
    postCounters.set(ip, { count: 1, resetAt: now + postWindowMs });
    return true;
  }
  if (current.count >= postLimitPerWindow) return false;
  current.count += 1;
  return true;
}

async function readBody(req, maxBytes = 8 * 1024) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleApi(req, res, urlObj) {
  if (urlObj.pathname !== "/api/scores") return false;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
    });
    res.end();
    return true;
  }

  if (req.method === "GET") {
    const limit = clampInt(urlObj.searchParams.get("limit"), 10, 50);
    const modeFilter = urlObj.searchParams.get("mode");
    const scores = await readScores();
    const filtered = modeFilter === "free_throw"
      ? scores.filter((entry) => entry.mode === "free_throw")
      : (modeFilter === "normal"
        ? scores.filter((entry) => (entry.mode || "normal") === "normal")
        : scores);
    sendJson(res, 200, { scores: filtered.sort(compareScoresDesc).slice(0, limit) });
    return true;
  }

  if (req.method === "POST") {
    const ip = clientIp(req);
    if (!allowedToPost(ip)) {
      sendJson(res, 429, { error: "Too many posts. Please wait and try again." });
      return true;
    }

    let parsed;
    try {
      const body = await readBody(req);
      parsed = JSON.parse(body || "{}");
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body." });
      return true;
    }

    const initials = sanitizeInitials(parsed.initials);
    const score = Number(parsed.score);
    const mode = parsed.mode === "free_throw" ? "free_throw" : "normal";
    const startLevel = clampInt(parsed.startLevel, 1, 6);

    if (!/^[A-Z]{3}$/.test(initials)) {
      sendJson(res, 400, { error: "Initials must be exactly 3 letters." });
      return true;
    }
    if (!Number.isInteger(score) || score < 0 || score > 100000000) {
      sendJson(res, 400, { error: "Score must be an integer between 0 and 100000000." });
      return true;
    }

    const scores = await readScores();
    const entry = {
      id: crypto.randomUUID(),
      initials,
      score,
      mode,
      startLevel,
      createdAt: new Date().toISOString()
    };
    scores.push(entry);
    await writeScores(scores);
    sendJson(res, 201, { ok: true, entry });
    return true;
  }

  sendJson(res, 405, { error: "Method not allowed." });
  return true;
}

function safeFilePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded === "/" ? "tootsjam.html" : decoded.slice(1);
  const normalized = path.normalize(relativePath);
  const resolved = path.resolve(rootDir, normalized);
  if (!resolved.startsWith(rootDir)) return null;
  return resolved;
}

async function serveStatic(req, res, urlObj) {
  const filePath = safeFilePath(urlObj.pathname);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = mimeTypes[ext] || "application/octet-stream";
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not Found");
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }
  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    const handled = await handleApi(req, res, urlObj);
    if (handled) return;
    await serveStatic(req, res, urlObj);
  } catch {
    sendJson(res, 500, { error: "Internal server error." });
  }
});

server.listen(port, host, () => {
  console.log(`Toots Jam server running at http://localhost:${port}`);
});
