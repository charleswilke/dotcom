// World state — the single global flags object (PRD §2.5, §5).
// One flag, one alternate dialogue line: high perceived depth per unit of
// work. This grows into the save file at M1 (localStorage tootsquest_save_v1).

export const worldState = { flags: {} };

export function setFlag(key, value = true) { worldState.flags[key] = value; }
export function getFlag(key) { return !!worldState.flags[key]; }
