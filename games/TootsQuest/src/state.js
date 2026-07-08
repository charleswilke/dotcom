// World state — the single global flags object (PRD §2.5, §5) and, as of
// M1 item 4, the save file built on top of it (localStorage
// tootsquest_save_v1). One flag, one alternate dialogue line: high
// perceived depth per unit of work.
//
// Save fiction (PRD §2.6): stitching at an embroidery hoop is the save;
// the autosave on gutter crossings is the safety net. Both call saveGame —
// the difference is ceremony, and ceremony lives in main.js.

export const worldState = { flags: {} };

export function setFlag(key, value = true) { worldState.flags[key] = value; }
export function getFlag(key) { return !!worldState.flags[key]; }

const SAVE_KEY = 'tootsquest_save_v1';

// localStorage can throw (private windows, storage quotas) — a save that
// fails must never take the game down with it.
export function saveGame(roomId, x, y, tDay) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: 1, flags: worldState.flags, roomId, x, y, tDay,
    }));
    return true;
  } catch {
    return false;
  }
}

// Returns the parsed save or null. Restoring flags mutates worldState in
// place so every live reference (dialogue lines, __TQ.flags) stays valid.
export function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!s || s.v !== 1 || typeof s.roomId !== 'string') return null;
    Object.assign(worldState.flags, s.flags || {});
    return s;
  } catch {
    return null;
  }
}

export function wipeSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* nothing to lose */ }
  for (const k of Object.keys(worldState.flags)) delete worldState.flags[k];
}
