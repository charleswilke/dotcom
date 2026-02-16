CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  initials TEXT NOT NULL,
  score INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'normal',
  startLevel INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores(score DESC, createdAt ASC);
