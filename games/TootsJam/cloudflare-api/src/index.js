const MAX_STORED_SCORES = 2000;

function getDb(env) {
  return env?.DB || env?.tootsjam_scores || null;
}

function json(status, payload, origin = "*") {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function sanitizeInitials(raw) {
  return String(raw || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

function getAllowedOrigin(request, env) {
  const configured = String(env.ALLOWED_ORIGIN || "").trim();
  if (!configured) return "*";
  const incoming = request.headers.get("Origin") || "";
  return incoming === configured ? configured : configured;
}

async function handleGetScores(request, env) {
  const db = getDb(env);
  if (!db) {
    return json(500, { error: "D1 binding missing. Expected DB (or tootsjam_scores)." }, getAllowedOrigin(request, env));
  }

  const url = new URL(request.url);
  const limit = clampInt(url.searchParams.get("limit"), 10, 50);
  const modeFilter = url.searchParams.get("mode");

  let query = `
    SELECT id, initials, score, mode, startLevel, createdAt
    FROM scores
  `;
  const binds = [];

  if (modeFilter === "free_throw") {
    query += " WHERE mode = ? ";
    binds.push("free_throw");
  } else if (modeFilter === "normal") {
    query += " WHERE mode = ? OR mode IS NULL ";
    binds.push("normal");
  }

  query += " ORDER BY score DESC, createdAt ASC LIMIT ? ";
  binds.push(limit);

  const result = await db.prepare(query).bind(...binds).all();
  const scores = Array.isArray(result.results) ? result.results : [];
  return json(200, { scores }, getAllowedOrigin(request, env));
}

async function pruneOldScores(env) {
  const db = getDb(env);
  if (!db) return;

  await db.prepare(
    `
      DELETE FROM scores
      WHERE id IN (
        SELECT id
        FROM scores
        ORDER BY score DESC, createdAt ASC
        LIMIT -1 OFFSET ?
      )
    `
  ).bind(MAX_STORED_SCORES).run();
}

async function handlePostScore(request, env) {
  const db = getDb(env);
  if (!db) {
    return json(500, { error: "D1 binding missing. Expected DB (or tootsjam_scores)." }, getAllowedOrigin(request, env));
  }

  let parsed;
  try {
    parsed = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body." }, getAllowedOrigin(request, env));
  }

  const initials = sanitizeInitials(parsed?.initials);
  const score = Number(parsed?.score);
  const mode = parsed?.mode === "free_throw" ? "free_throw" : "normal";
  const startLevel = clampInt(parsed?.startLevel, 1, 6);

  if (!/^[A-Z]{3}$/.test(initials)) {
    return json(400, { error: "Initials must be exactly 3 letters." }, getAllowedOrigin(request, env));
  }
  if (!Number.isInteger(score) || score < 0 || score > 100000000) {
    return json(400, { error: "Score must be an integer between 0 and 100000000." }, getAllowedOrigin(request, env));
  }

  const entry = {
    id: crypto.randomUUID(),
    initials,
    score,
    mode,
    startLevel,
    createdAt: new Date().toISOString()
  };

  await db.prepare(
    `
      INSERT INTO scores (id, initials, score, mode, startLevel, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `
  ).bind(
    entry.id,
    entry.initials,
    entry.score,
    entry.mode,
    entry.startLevel,
    entry.createdAt
  ).run();

  await pruneOldScores(env);
  return json(201, { ok: true, entry }, getAllowedOrigin(request, env));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": getAllowedOrigin(request, env),
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "no-store"
        }
      });
    }

    if (url.pathname !== "/api/scores") {
      return json(404, { error: "Not found." }, getAllowedOrigin(request, env));
    }

    try {
      if (request.method === "GET") {
        return await handleGetScores(request, env);
      }
      if (request.method === "POST") {
        return await handlePostScore(request, env);
      }
      return json(405, { error: "Method not allowed." }, getAllowedOrigin(request, env));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error.";
      return json(500, { error: message }, getAllowedOrigin(request, env));
    }
  }
};
