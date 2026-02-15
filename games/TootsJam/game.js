const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const stateEl = document.getElementById("state");
const timerEl = document.getElementById("timer");
const nextLevelEl = document.getElementById("nextLevel");
const muteChargeBtn = document.getElementById("muteChargeBtn");
const sessionResetBtn = document.getElementById("sessionResetBtn");
const splashEl = document.getElementById("splash");
const splashYearEl = document.getElementById("splashYear");
const startBtn = document.getElementById("startBtn");
const splashTitleEl = document.getElementById("splashTitle");
const startLevelEl = document.getElementById("startLevel");

const W = canvas.width;
const H = canvas.height;
const floorY = H - 88;
const gravity = 0.29;
const airDrag = 0.998;
const player = { x: 100, y: floorY - 56 };
const handBall = { x: player.x + 38, y: player.y + 2 };
const dribbleX = player.x + 28;

const hoop = {
  x: W - 250,
  y: floorY - 220,
  rimRadius: 9,
  rimGap: 76
};

const backboard = {
  x: hoop.x + hoop.rimGap,
  y: floorY - 312,
  w: 14,
  h: 120
};

const ball = {
  x: handBall.x,
  y: handBall.y,
  r: 16,
  vx: 0,
  vy: 0,
  spin: 0,
  inFlight: false,
  resting: true,
  scoredOnThisShot: false
};

let score = 0;
let comboStreak = 0;
let lastComboShown = 0;
let charging = false;
let charge = 0;
let chargeDir = 1;
let lastMadeShot = false;
let lastShotWasSwish = false;
let touchedRim = false;
let touchedBackboard = false;
let resetCountdown = -1;
let spaceHeld = false;
let dribbleHeld = false;
let dribblePhase = 0;
let dribbleActive = false;
let dribbleCooldown = 0;
let dribbleBouncePlayed = false;
let netJiggle = 0;
let netJigglePhase = 0;
const particles = [];
const floatTexts = [];
let brickStampTimer = 0;
let bankShotStickerTimer = 0;
let brickStampedThisShot = false;
let brickStreak = 0;
let gotTheIckArmed = false;
let brickAltUnlocked = false;
let rimSoundCooldown = 0;
let floorSoundCooldown = 0;
let dribbleSoundCooldown = 0;
let chargeSoundCooldown = 0;
let muteChargeSfx = false;
let muteActivationCount = 0;
let unmutePlayCount = 0;
let activeChargeAudio = null;
const resetDelayFrames = 42;
const maxCharge = 1.28;
const planeIntervalMs = 120000;
let nextPlaneStartAt = performance.now() + planeIntervalMs;
const level2ScoreThreshold = 20;
const level3ScoreThreshold = 40;
const level4ScoreThreshold = 60;
const level5ScoreThreshold = 80;
const levelDurationMs = 120000;
let levelTimeRemainingMs = levelDurationMs;
let lastTimerTickAt = performance.now();
let level = 1;
const skyPlane = {
  active: false,
  startAt: 0,
  duration: 18000,
  y: 104,
  dir: 1
};
const gulls = [
  { x: W * 0.36, y: 205, baseX: W * 0.36, baseY: 209, orbitX: 42, orbitY: 24, speed: 0.0019, phase: 0.2, r: 11, cooldown: 0 },
  { x: W * 0.56, y: 232, baseX: W * 0.56, baseY: 232, orbitX: 36, orbitY: 21, speed: 0.0022, phase: 2.0, r: 11, cooldown: 0 },
  { x: W * 0.76, y: 214, baseX: W * 0.76, baseY: 216, orbitX: 40, orbitY: 26, speed: 0.002, phase: 4.1, r: 11, cooldown: 0 }
];
const helicopter = {
  x: W * 0.62,
  y: 284,
  baseX: W * 0.62,
  baseY: 284,
  orbitX: 38,
  orbitY: 16,
  speed: 0.0016,
  phase: 0.7,
  bodyRx: 34,
  bodyRy: 12,
  cooldown: 0
};
let touchedGullThisShot = false;
let touchedHeliThisShot = false;
let touchedBalloonThisShot = false;
const balloons = [
  { x: W * 0.41, y: floorY - 270, baseX: W * 0.41, baseY: floorY - 270, swayAmp: 16, swaySpeed: 0.00162, bobAmp: 24, bobSpeed: 0.00096, phase: 0.15, rx: 34, ry: 36, cooldown: 0 },
  { x: W * 0.59125, y: floorY - 306, baseX: W * 0.59125, baseY: floorY - 306, swayAmp: 12, swaySpeed: 0.00138, bobAmp: 20, bobSpeed: 0.00128, phase: 2.0, rx: 32, ry: 34, cooldown: 0 },
  { x: W * 0.77125, y: floorY - 353, baseX: W * 0.77125, baseY: floorY - 353, swayAmp: 12, swaySpeed: 0.00174, bobAmp: 14, bobSpeed: 0.00108, phase: 4.0, rx: 33, ry: 35, cooldown: 0 }
];
const spaceUfos = {
  left: { x: W * 0.28, y: 244, wobblePhase: 0.8 },
  center: { x: W * 0.5, y: 106, wobblePhase: 2.1 },
  right: { x: W * 0.72, y: 244, wobblePhase: 3.6 }
};
const spaceBeam = {
  radius: 108,
  minPhaseMs: 1200,
  maxPhaseMs: 1600,
  minVisualIntensity: 0.16
};
let spaceBeamMode = Math.random() < 0.5 ? "lift" : "press";
let spaceBeamPhaseStartedAt = performance.now();
let spaceBeamPhaseDurationMs = spaceBeam.minPhaseMs + Math.random() * (spaceBeam.maxPhaseMs - spaceBeam.minPhaseMs);

const sfx = {
  rim: ["sounds/rim1.mp3", "sounds/rim2.mp3"],
  floor: [
    "sounds/bounce/single_bounce.mp3",
    "sounds/bounce/single_bounce2.mp3",
    "sounds/bounce/single_bounce3.mp3",
    "sounds/bounce/single_bounce4.mp3",
    "sounds/bounce/single_bounce5.mp3",
    "sounds/bounce/single_bounce6.mp3",
    "sounds/bounce/single_bounce7.mp3",
    "sounds/bounce/single_bounce8.mp3"
  ],
  made: ["sounds/afterbasketfalls.mp3"],
  brick: ["sounds/brick1.mp3", "sounds/brick2.mp3", "sounds/brick3.mp3"],
  brickIck: ["sounds/bricks/gottheick.mp3"],
  brickStreak: [
    "sounds/bricks/dingus.mp3",
    "sounds/bricks/dingus2.mp3",
    "sounds/bricks/nofinesse.mp3",
    "sounds/bricks/nofinesse2.mp3",
    "sounds/bricks/yikes.mp3",
    "sounds/bricks/yikes2.mp3"
  ],
  airball: [
    "sounds/bricks/oof.mp3",
    "sounds/bricks/oof2.mp3"
  ],
  charge: [
    "sounds/charging1.mp3",
    "sounds/charging2.mp3",
    "sounds/charging3.mp3",
    "sounds/charging4.mp3",
    "sounds/charging5.mp3"
  ],
  swish: [
    "sounds/swish/bingo.mp3",
    "sounds/swish/groovy.mp3",
    "sounds/swish/groovy2.mp3",
    "sounds/swish/nice.mp3"
  ],
  net: [
    "sounds/net/net1.mp3",
    "sounds/net/net2.mp3",
    "sounds/net/net3.mp3",
    "sounds/net/net4.mp3",
    "sounds/net/net5.mp3",
    "sounds/net/net6.mp3"
  ],
  bankShot: [
    "sounds/bank/bank1.mp3",
    "sounds/bank/bank2.mp3",
    "sounds/bank/bank3.mp3",
    "sounds/bank/bank4.mp3"
  ],
  heli: [
    "sounds/heli/heli1.mp3",
    "sounds/heli/heli2.mp3",
    "sounds/heli/heli3.mp3",
    "sounds/heli/heli4.mp3"
  ],
  squawk: [
    "sounds/squawk/squawk1.mp3",
    "sounds/squawk/squawk2.mp3",
    "sounds/squawk/squawk3.mp3",
    "sounds/squawk/squawk4.mp3",
    "sounds/squawk/squawk5.mp3",
    "sounds/squawk/squawk6.mp3"
  ],
  start: [
    "sounds/start/start1.mp3",
    "sounds/start/start2.mp3",
    "sounds/start/start3.mp3",
    "sounds/start/start4.mp3",
    "sounds/start/splash.mp3"
  ],
  silence: [
    "sounds/charge6.mp3",
    "sounds/charge7.mp3",
    "sounds/charge8.mp3",
    "sounds/charge9.mp3",
    "sounds/charge10.mp3"
  ],
  unmute: [
    "sounds/chirp/island.mp3",
    "sounds/chirp/podcast.mp3",
    "sounds/chirp/actually.mp3"
  ],
  mute: [
    "sounds/chirp/fine.mp3",
    "sounds/chirp/but.mp3",
    "sounds/chirp/uh-well.mp3",
    "sounds/chirp/okay.mp3"
  ]
};
sfx.brickUnlocked = [...sfx.brick, ...sfx.brickStreak];
let gameStarted = false;
let splashReady = false;

function getLevelForScore(currentScore) {
  if (currentScore >= level5ScoreThreshold) return 5;
  if (currentScore >= level4ScoreThreshold) return 4;
  if (currentScore >= level3ScoreThreshold) return 3;
  if (currentScore >= level2ScoreThreshold) return 2;
  return 1;
}

function getLevelLabel(value) {
  if (value === 5) return "Level 5: Space";
  if (value === 4) return "Level 4: Golden Hour";
  if (value === 3) return "Level 3: Afternoon City";
  if (value === 2) return "Level 2: Morning City";
  return "Level 1: Night City";
}

function getNextLevelTarget(currentLevel) {
  if (currentLevel <= 1) return level2ScoreThreshold;
  if (currentLevel === 2) return level3ScoreThreshold;
  if (currentLevel === 3) return level4ScoreThreshold;
  if (currentLevel === 4) return level5ScoreThreshold;
  return null;
}

function formatLevelTime(ms) {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function resetLevelTimer(now = performance.now()) {
  levelTimeRemainingMs = levelDurationMs;
  lastTimerTickAt = now;
}

function applyLevelProgression() {
  const nextLevel = getLevelForScore(score);
  if (nextLevel <= level) return false;
  level = nextLevel;
  resetLevelTimer();
  stateEl.textContent = getLevelLabel(level);
  return true;
}

function updateHud() {
  scoreEl.textContent = `Score: ${score}`;
  comboEl.textContent = `Combo: x${getComboMultiplier(comboStreak)}`;
  if (timerEl) timerEl.textContent = `Time: ${formatLevelTime(levelTimeRemainingMs)}`;
  if (nextLevelEl) {
    if (level === 5) {
      const phase = getSpaceBeamState(performance.now());
      nextLevelEl.textContent = `Beam: ${phase.mode.toUpperCase()} ${Math.round(phase.intensity * 100)}%`;
    } else {
      const target = getNextLevelTarget(level);
      if (target == null) {
        nextLevelEl.textContent = "Next: Max Level";
      } else {
        const needed = Math.max(0, target - score);
        const nextLabel = level + 1;
        nextLevelEl.textContent = `Next: L${nextLabel} in ${needed}`;
      }
    }
  }
  if (comboStreak > lastComboShown) {
    comboEl.classList.remove("combo-up");
    void comboEl.offsetWidth;
    comboEl.classList.add("combo-up");
  }
  lastComboShown = comboStreak;
}

function resetBall() {
  ball.x = handBall.x;
  ball.y = handBall.y;
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.inFlight = false;
  ball.resting = true;
  ball.scoredOnThisShot = false;
  charge = 0;
  charging = false;
  stopChargeSfx();
  dribbleHeld = false;
  dribblePhase = 0;
  dribbleActive = false;
  dribbleCooldown = 0;
  dribbleBouncePlayed = false;
  touchedRim = false;
  touchedBackboard = false;
  touchedGullThisShot = false;
  touchedHeliThisShot = false;
  touchedBalloonThisShot = false;
  brickStampedThisShot = false;
  bankShotStickerTimer = 0;
  stateEl.textContent = "Hold to Shoot";
  resetCountdown = -1;
  updateHud();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getComboMultiplier(streak) {
  if (streak <= 0) return 1;
  return 2 ** streak;
}

function chooseRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function playSfx(key, volume = 0.8) {
  const choices = sfx[key];
  if (!choices || choices.length === 0) return;
  const audio = new Audio(chooseRandom(choices));
  audio.volume = clamp(volume, 0, 1);
  audio.play().catch(() => {});
}

function stopChargeSfx() {
  if (!activeChargeAudio) return;
  try {
    activeChargeAudio.pause();
    activeChargeAudio.currentTime = 0;
  } catch {}
  activeChargeAudio = null;
}

function playChargeSfx() {
  const key = muteChargeSfx ? "silence" : "charge";
  const volume = muteChargeSfx ? 0.16 : 0.33;
  const choices = sfx[key];
  if (!choices || choices.length === 0) return;
  stopChargeSfx();
  const audio = new Audio(chooseRandom(choices));
  audio.volume = clamp(volume, 0, 1);
  activeChargeAudio = audio;
  audio.play().catch(() => {});
}

function updateMuteButton() {
  if (!muteChargeBtn) return;
  muteChargeBtn.classList.toggle("is-muted", muteChargeSfx);
  muteChargeBtn.setAttribute("aria-pressed", muteChargeSfx ? "true" : "false");
}

function playUnmuteSequenceSfx() {
  const sequence = sfx.unmute;
  if (!sequence || sequence.length === 0) return;
  if (unmutePlayCount >= sequence.length) return;
  const clipIndex = unmutePlayCount;
  const audio = new Audio(sequence[clipIndex]);
  audio.volume = 0.84;
  audio.play().catch(() => {});
  if (clipIndex === 0) {
    gotTheIckArmed = true;
  }
  unmutePlayCount += 1;
}

function playMuteSequenceSfx() {
  const sequence = sfx.mute;
  if (!sequence || sequence.length === 0) return;
  const clipIndex = Math.min(muteActivationCount, sequence.length - 1);
  const audio = new Audio(sequence[clipIndex]);
  audio.volume = 0.84;
  audio.play().catch(() => {});
  muteActivationCount += 1;
}

function resetSessionRunState() {
  score = 0;
  comboStreak = 0;
  lastComboShown = 0;
  resetLevelTimer();
  brickStreak = 0;
  gotTheIckArmed = false;
  brickAltUnlocked = false;
  muteActivationCount = 0;
  unmutePlayCount = 0;
}

function beginCharge() {
  if (!gameStarted) return;
  if (resetCountdown >= 0) return;
  if (ball.inFlight) return;
  dribbleHeld = false;
  dribbleActive = false;
  dribbleCooldown = 0;
  ball.x = handBall.x;
  ball.y = handBall.y;
  charging = true;
  if (chargeSoundCooldown <= 0) {
    playChargeSfx();
    chargeSoundCooldown = 18;
  }
  stateEl.textContent = "Charging";
}

function releaseShot() {
  if (!gameStarted) return;
  if (!charging || ball.inFlight) return;
  charging = false;
  stopChargeSfx();
  ball.inFlight = true;
  ball.resting = false;
  ball.scoredOnThisShot = false;
  touchedRim = false;
  touchedBackboard = false;
  touchedGullThisShot = false;
  touchedHeliThisShot = false;
  touchedBalloonThisShot = false;
  brickStampedThisShot = false;
  lastMadeShot = false;
  lastShotWasSwish = false;

  const { angle, speed } = getShotParams(charge);
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
  ball.spin = 0.23 + charge * 0.18;
  stateEl.textContent = "Ball in Flight";
}

function queueReset(message) {
  ball.vx = 0;
  ball.vy = 0;
  ball.inFlight = false;
  ball.resting = true;
  charging = false;
  stopChargeSfx();
  charge = 0;
  chargeDir = 1;
  stateEl.textContent = message;
  resetCountdown = resetDelayFrames;
  updateHud();
}

function beginDribble() {
  if (!gameStarted) return;
  if (resetCountdown >= 0 || ball.inFlight || charging) return;
  dribbleHeld = true;
  if (!dribbleActive && dribbleCooldown <= 0) {
    dribbleActive = true;
    dribblePhase = 0;
  }
  stateEl.textContent = "Dribbling";
}

function endDribble() {
  if (!gameStarted) return;
  if (!dribbleHeld) return;
  dribbleHeld = false;
  if (!dribbleActive) {
    ball.x = handBall.x;
    ball.y = handBall.y;
  }
  if (!dribbleActive && !charging && !ball.inFlight && resetCountdown < 0) {
    stateEl.textContent = "Hold to Shoot";
  }
}

function lineCircleHit(x1, y1, x2, y2, cx, cy, r) {
  const acx = cx - x1;
  const acy = cy - y1;
  const abx = x2 - x1;
  const aby = y2 - y1;
  const abLen2 = abx * abx + aby * aby;
  const t = clamp((acx * abx + acy * aby) / abLen2, 0, 1);
  const hx = x1 + abx * t;
  const hy = y1 + aby * t;
  const dx = cx - hx;
  const dy = cy - hy;
  return dx * dx + dy * dy <= r * r;
}

function getShotParams(rawCharge) {
  const t = clamp(rawCharge / maxCharge, 0, 1);
  const eased = t * t * (3 - 2 * t);
  const angle = -1.18 + (0.2 * eased);
  const minSpeed = 7.4;
  const maxSpeed = 21.6;
  const speed = minSpeed + (maxSpeed - minSpeed) * eased;
  return { angle, speed };
}

function spawnScoreEffects(x, y, swish) {
  const count = swish ? 22 : 14;
  for (let i = 0; i < count; i++) {
    const speed = 1 + Math.random() * 2.6;
    const angle = -Math.PI * 0.9 + Math.random() * Math.PI * 0.8;
    const life = 24 + Math.random() * 20;
    particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.7,
      vy: Math.sin(angle) * speed - Math.random() * 0.5,
      life,
      maxLife: life,
      size: 1.8 + Math.random() * 2.4,
      color: swish ? "255,245,170" : "133,240,255"
    });
  }
}

function spawnTrickShotEffects(x, y) {
  for (let i = 0; i < 26; i++) {
    const speed = 1.3 + Math.random() * 3.2;
    const angle = -Math.PI + Math.random() * (Math.PI * 2);
    const life = 30 + Math.random() * 24;
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: 2.2 + Math.random() * 2.8,
      color: "255,234,170"
    });
  }
}

function spawnFloatingPoints(points) {
  floatTexts.push({
    x: hoop.x + hoop.rimGap * 0.5,
    y: hoop.y - 6,
    vy: -0.85,
    life: 46,
    maxLife: 46,
    text: `+${points}`
  });
}

function updateEffects() {
  if (netJiggle > 0.001) {
    netJigglePhase += 0.35;
    netJiggle *= 0.93;
  } else {
    netJiggle = 0;
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.vx *= 0.985;
    p.life -= 1;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const t = floatTexts[i];
    t.y += t.vy;
    t.vy *= 0.985;
    t.life -= 1;
    if (t.life <= 0) {
      floatTexts.splice(i, 1);
    }
  }

  if (brickStampTimer > 0) {
    brickStampTimer -= 1;
  }
  if (bankShotStickerTimer > 0) {
    bankShotStickerTimer -= 1;
  }
}

function updateSkyPlane(now) {
  if (!gameStarted || level !== 1) {
    skyPlane.active = false;
    return;
  }

  if (!skyPlane.active && now >= nextPlaneStartAt) {
    skyPlane.active = true;
    skyPlane.startAt = now;
    skyPlane.duration = 17000 + Math.random() * 5000;
    skyPlane.y = 74 + Math.random() * 62;
    skyPlane.dir = Math.random() < 0.5 ? 1 : -1;
    nextPlaneStartAt += planeIntervalMs;
  }

  if (skyPlane.active) {
    const t = (now - skyPlane.startAt) / skyPlane.duration;
    if (t >= 1) {
      skyPlane.active = false;
    }
  }
}

function updateGulls(now) {
  if (level !== 2) return;
  for (let i = 0; i < gulls.length; i++) {
    const g = gulls[i];
    const theta = now * g.speed + g.phase;
    g.x = g.baseX + Math.cos(theta) * g.orbitX;
    g.y = g.baseY + Math.sin(theta) * g.orbitY;
    if (g.cooldown > 0) g.cooldown -= 1;
  }
}

function updateHelicopter(now) {
  if (level !== 3) return;
  const theta = now * helicopter.speed + helicopter.phase;
  helicopter.x = helicopter.baseX + Math.cos(theta) * helicopter.orbitX;
  helicopter.y = helicopter.baseY + Math.sin(theta) * helicopter.orbitY;
  if (helicopter.cooldown > 0) helicopter.cooldown -= 1;
}

function updateBalloons(now) {
  if (level !== 4) return;
  for (let i = 0; i < balloons.length; i++) {
    const b = balloons[i];
    b.x = b.baseX + Math.sin(now * b.swaySpeed + b.phase) * b.swayAmp;
    b.y = b.baseY + Math.sin(now * b.bobSpeed + b.phase * 1.7) * b.bobAmp;
    if (b.cooldown > 0) b.cooldown -= 1;
  }
}

function getSpaceUfoPose(now, ufoName) {
  const ufo = spaceUfos[ufoName];
  if (!ufo) return { x: 0, y: 0 };
  const edgeShip = ufoName === "left" || ufoName === "right";
  const swayAmpX = edgeShip ? 26 : 8;
  const swaySpeedX = edgeShip ? 0.00145 : 0.00195;
  const bobAmpY = edgeShip ? 4 : 3;
  const bobSpeedY = edgeShip ? 0.0026 : 0.0034;
  return {
    x: ufo.x + Math.sin(now * swaySpeedX + ufo.wobblePhase) * swayAmpX,
    y: ufo.y + Math.cos(now * bobSpeedY + ufo.wobblePhase * 1.4) * bobAmpY
  };
}

function getSpaceBeamState(now) {
  let guard = 0;
  while (now - spaceBeamPhaseStartedAt >= spaceBeamPhaseDurationMs && guard < 256) {
    spaceBeamPhaseStartedAt += spaceBeamPhaseDurationMs;
    spaceBeamMode = spaceBeamMode === "lift" ? "press" : "lift";
    spaceBeamPhaseDurationMs = spaceBeam.minPhaseMs + Math.random() * (spaceBeam.maxPhaseMs - spaceBeam.minPhaseMs);
    guard += 1;
  }
  if (guard >= 256) {
    spaceBeamPhaseStartedAt = now;
  }
  const progress = clamp((now - spaceBeamPhaseStartedAt) / Math.max(1, spaceBeamPhaseDurationMs), 0, 1);
  const intensity = Math.sin(progress * Math.PI);
  const wave = (spaceBeamMode === "lift" ? -1 : 1) * intensity;
  return {
    mode: spaceBeamMode,
    progress,
    intensity,
    wave
  };
}

function isPointInSpaceBeam(x, y, now) {
  if (level !== 5) return false;
  const centerPose = getSpaceUfoPose(now, "center");
  const beamTop = centerPose.y + 16;
  if (y < beamTop || y > floorY) return false;
  return Math.abs(x - centerPose.x) <= spaceBeam.radius;
}

function getSpaceBeamGravityMultiplierAt(x, y, now) {
  if (!isPointInSpaceBeam(x, y, now)) return 1;
  const state = getSpaceBeamState(now);
  if (state.wave < 0) {
    // Lift phase: 100% -> 30% gravity.
    return 1 - 0.7 * Math.abs(state.wave);
  }
  // Press phase: +50% -> +100% gravity (1.5x -> 2.0x).
  return 1.5 + 0.5 * state.wave;
}

function getBallBeamGlow(now) {
  if (level !== 5) return null;
  if (!isPointInSpaceBeam(ball.x, ball.y, now)) return null;
  const state = getSpaceBeamState(now);
  const intensity = Math.max(0.12, state.intensity);
  const isPress = state.mode === "press";
  const color = isPress ? "255, 56, 176" : "126, 234, 255";
  const boost = isPress ? 1.9 : 1;
  return { color, intensity, boost };
}

function getBalloonHullPoints(b) {
  return [
    { x: b.x - b.rx, y: b.y - b.ry * 0.14 },
    { x: b.x - b.rx * 0.76, y: b.y - b.ry * 0.8 },
    { x: b.x, y: b.y - b.ry },
    { x: b.x + b.rx * 0.76, y: b.y - b.ry * 0.8 },
    { x: b.x + b.rx, y: b.y - b.ry * 0.14 },
    { x: b.x + b.rx * 0.56, y: b.y + b.ry * 0.6 },
    { x: b.x, y: b.y + b.ry + 24 },
    { x: b.x - b.rx * 0.56, y: b.y + b.ry * 0.6 }
  ];
}

function pointInPolygon(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const yi = pts[i].y;
    const xj = pts[j].x;
    const yj = pts[j].y;
    const intersects = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi + 0.000001) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function closestPointOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const abLen2 = abx * abx + aby * aby;
  if (abLen2 <= 0.000001) return { x: ax, y: ay };
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / abLen2, 0, 1);
  return { x: ax + abx * t, y: ay + aby * t };
}

function resolveGullCollision(g) {
  const dx = ball.x - g.x;
  const dy = ball.y - g.y;
  const hitDist = ball.r + g.r;
  const dist2 = dx * dx + dy * dy;
  if (dist2 > hitDist * hitDist || g.cooldown > 0) return false;

  const dist = Math.max(0.0001, Math.sqrt(dist2));
  const nx = dx / dist;
  const ny = dy / dist;
  ball.x = g.x + nx * hitDist;
  ball.y = g.y + ny * hitDist;
  const dot = ball.vx * nx + ball.vy * ny;
  const bounce = 0.88;
  ball.vx -= (1 + bounce) * dot * nx;
  ball.vy -= (1 + bounce) * dot * ny;
  ball.vx += (Math.random() - 0.5) * 0.55;
  ball.vy -= 0.15;
  touchedGullThisShot = true;
  playSfx("squawk", 0.62);
  g.cooldown = 10;
  return true;
}

function resolveHelicopterCollision() {
  if (level !== 3 || helicopter.cooldown > 0) return false;

  const rx = helicopter.bodyRx + ball.r;
  const ry = helicopter.bodyRy + ball.r;
  const dx = ball.x - helicopter.x;
  const dy = ball.y - helicopter.y;
  const inside = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
  if (!inside) return false;

  const wasAbove = ball.y < helicopter.y - helicopter.bodyRy * 0.25;
  if (wasAbove && ball.vy > 0) {
    ball.y = helicopter.y - helicopter.bodyRy - ball.r - 1;
    ball.vy = -Math.abs(ball.vy) * 0.86;
    ball.vx += (ball.x - helicopter.x) * 0.02;
  } else {
    ball.vx *= -0.74;
    ball.vy *= 0.9;
  }
  touchedHeliThisShot = true;
  playSfx("heli", 0.68);
  helicopter.cooldown = 10;
  return true;
}

function resolveBalloonCollision(b) {
  if (level !== 4 || b.cooldown > 0) return false;

  const hull = getBalloonHullPoints(b);
  const inside = pointInPolygon(ball.x, ball.y, hull);

  let nearest = null;
  let minDist2 = Infinity;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const c = hull[(i + 1) % hull.length];
    const p = closestPointOnSegment(ball.x, ball.y, a.x, a.y, c.x, c.y);
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < minDist2) {
      minDist2 = d2;
      nearest = p;
    }
  }

  if (!inside && minDist2 > ball.r * ball.r) return false;

  let nx = ball.x - nearest.x;
  let ny = ball.y - nearest.y;
  let dist = Math.hypot(nx, ny);
  if (dist < 0.001) {
    nx = ball.x - b.x;
    ny = ball.y - b.y;
    dist = Math.max(0.001, Math.hypot(nx, ny));
  }
  nx /= dist;
  ny /= dist;
  ball.x = nearest.x + nx * ball.r;
  ball.y = nearest.y + ny * ball.r;
  const dot = ball.vx * nx + ball.vy * ny;
  const bounce = 0.84;
  ball.vx -= (1 + bounce) * dot * nx;
  ball.vy -= (1 + bounce) * dot * ny;

  touchedBalloonThisShot = true;
  b.cooldown = 10;
  return true;
}

function drawGulls(now) {
  if (level !== 2) return;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
  ctx.lineWidth = 2;
  for (let i = 0; i < gulls.length; i++) {
    const g = gulls[i];
    const flap = Math.sin(now * 0.02 + g.phase);
    const wing = 8 + Math.abs(flap) * 7;
    ctx.beginPath();
    ctx.moveTo(g.x - wing, g.y);
    ctx.quadraticCurveTo(g.x - wing * 0.45, g.y - (3 + Math.abs(flap) * 4), g.x, g.y - 1);
    ctx.quadraticCurveTo(g.x + wing * 0.45, g.y - (3 + Math.abs(flap) * 4), g.x + wing, g.y);
    ctx.stroke();
  }
}

function drawHelicopter(now) {
  if (level !== 3) return;
  const h = helicopter;
  const rotor = Math.sin(now * 0.05);

  ctx.fillStyle = "rgba(56, 74, 96, 0.92)";
  ctx.beginPath();
  ctx.ellipse(h.x, h.y, h.bodyRx, h.bodyRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(22, 32, 48, 0.85)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(169, 209, 245, 0.75)";
  ctx.beginPath();
  ctx.ellipse(h.x + 13, h.y - 1, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(36, 46, 66, 0.88)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(h.x - h.bodyRx - 26, h.y + 2);
  ctx.lineTo(h.x - h.bodyRx + 4, h.y + 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(25, 35, 50, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(h.x, h.y - h.bodyRy - 5);
  ctx.lineTo(h.x, h.y - h.bodyRy - 13);
  ctx.stroke();

  ctx.strokeStyle = "rgba(225, 238, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(h.x - 46 - rotor * 6, h.y - h.bodyRy - 13);
  ctx.lineTo(h.x + 46 + rotor * 6, h.y - h.bodyRy - 13);
  ctx.stroke();
}

function drawBalloons(now) {
  if (level !== 4) return;
  for (let i = 0; i < balloons.length; i++) {
    const b = balloons[i];
    const glow = 0.74 + Math.sin(now * 0.004 + b.phase) * 0.1;
    const grad = ctx.createRadialGradient(b.x - b.rx * 0.3, b.y - b.ry * 0.35, b.rx * 0.2, b.x, b.y, b.ry * 1.15);
    grad.addColorStop(0, `rgba(255, 224, 154, ${0.85 * glow})`);
    grad.addColorStop(0.45, `rgba(241, 163, 105, ${0.88 * glow})`);
    grad.addColorStop(1, `rgba(176, 103, 81, ${0.92 * glow})`);
    ctx.fillStyle = grad;
    const hull = getBalloonHullPoints(b);
    ctx.beginPath();
    for (let p = 0; p < hull.length; p++) {
      if (p === 0) {
        ctx.moveTo(hull[p].x, hull[p].y);
      } else {
        ctx.lineTo(hull[p].x, hull[p].y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(96, 54, 49, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const tipY = b.y + b.ry + 24;
    ctx.strokeStyle = "rgba(114, 78, 66, 0.8)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(b.x - 6, tipY - 1);
    ctx.lineTo(b.x - 5, tipY + 10);
    ctx.moveTo(b.x + 6, tipY - 1);
    ctx.lineTo(b.x + 5, tipY + 10);
    ctx.stroke();

    ctx.fillStyle = "rgba(88, 70, 55, 0.92)";
    ctx.fillRect(b.x - 7, tipY + 10, 14, 9);
    ctx.strokeStyle = "rgba(46, 36, 29, 0.84)";
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x - 7, tipY + 10, 14, 9);
  }
}

function drawSkyPlane(now) {
  if (!skyPlane.active) return;
  const t = clamp((now - skyPlane.startAt) / skyPlane.duration, 0, 1);
  const startX = skyPlane.dir === 1 ? -280 : W + 280;
  const endX = skyPlane.dir === 1 ? W + 280 : -280;
  const x = startX + (endX - startX) * t;
  const y = skyPlane.y + Math.sin(t * Math.PI * 3) * 2;

  const planeX = x;
  const planeY = y;

  ctx.strokeStyle = "rgba(165, 220, 255, 0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(planeX - 8, planeY);
  ctx.lineTo(planeX + 10, planeY);
  ctx.stroke();

  ctx.fillStyle = "rgba(183, 229, 255, 0.7)";
  ctx.beginPath();
  ctx.moveTo(planeX + 10, planeY);
  ctx.lineTo(planeX + 2, planeY - 4);
  ctx.lineTo(planeX + 2, planeY + 4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(150, 214, 255, 0.4)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(planeX - 16, planeY + 2);
  ctx.lineTo(planeX - 44, planeY + 8);
  ctx.stroke();

  const bannerX = planeX - 172;
  const bannerY = planeY + 8;
  ctx.fillStyle = "rgba(229, 240, 251, 0.78)";
  ctx.fillRect(bannerX, bannerY - 14, 124, 18);
  ctx.strokeStyle = "rgba(122, 160, 195, 0.68)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bannerX, bannerY - 14, 124, 18);

  ctx.fillStyle = "rgba(23, 35, 66, 0.82)";
  ctx.font = "bold 8px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Don't you have something", bannerX + 4, bannerY - 8);
  ctx.fillText("to do right now?", bannerX + 4, bannerY);
}

function drawSpaceUfo(pose, scale, alpha) {
  const x = pose.x;
  const y = pose.y;
  const bodyRx = 34 * scale;
  const bodyRy = 11 * scale;
  const domeRy = 15 * scale;

  const bodyGrad = ctx.createLinearGradient(x, y - bodyRy, x, y + bodyRy);
  bodyGrad.addColorStop(0, `rgba(166, 206, 255, ${0.95 * alpha})`);
  bodyGrad.addColorStop(1, `rgba(82, 128, 196, ${0.94 * alpha})`);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(x, y, bodyRx, bodyRy, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(196, 244, 255, ${0.66 * alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y - 8 * scale, 14 * scale, domeRy, 0, Math.PI, 0, true);
  ctx.fill();

  ctx.strokeStyle = `rgba(26, 44, 80, ${0.9 * alpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = `rgba(129, 255, 242, ${0.75 * alpha})`;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(x + i * 11 * scale, y + 1.5 * scale, 1.8 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAmbientSpaceBeam(now, pose, beamRadius, state, phaseShift) {
  const beamX = pose.x;
  const beamTop = pose.y + 16;
  const beamApexY = pose.y + 9;
  const beamBottom = floorY;
  const beamColor = state.mode === "lift" ? "162, 246, 255" : "255, 155, 132";
  const intensity = Math.max(spaceBeam.minVisualIntensity, state.intensity);
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.012 + phaseShift);
  const sway = Math.sin(now * 0.004 + phaseShift * 1.7) * 8;

  const beamGrad = ctx.createLinearGradient(beamX, beamTop, beamX, beamBottom);
  beamGrad.addColorStop(0, `rgba(${beamColor}, ${(0.12 + pulse * 0.07) * intensity})`);
  beamGrad.addColorStop(0.62, `rgba(${beamColor}, ${(0.05 + pulse * 0.04) * intensity})`);
  beamGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(beamX, beamApexY);
  ctx.quadraticCurveTo(beamX + beamRadius * 0.08, beamTop + 24, beamX + beamRadius * 0.82, beamBottom);
  ctx.lineTo(beamX - beamRadius * 0.82, beamBottom);
  ctx.quadraticCurveTo(beamX - beamRadius * 0.08, beamTop + 24, beamX, beamApexY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = `rgba(${beamColor}, ${(0.24 + pulse * 0.2) * intensity})`;
  ctx.lineWidth = 1.3 + intensity * 0.8;
  const ringCount = 5;
  const ringTravel = state.mode === "lift" ? (1 - state.progress) : state.progress;
  for (let i = 0; i < ringCount; i++) {
    const t = (i / ringCount + ringTravel + phaseShift * 0.05) % 1;
    const y = beamApexY + 10 + t * (beamBottom - beamApexY - 10);
    const rx = 8 + t * (beamRadius - 8);
    ctx.beginPath();
    ctx.ellipse(beamX + sway * (1 - t), y, rx, 4.2 + t * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSpaceBeam(now, centerPose, state = getSpaceBeamState(now)) {
  if (level !== 5) return;

  const beamX = centerPose.x;
  const beamTop = centerPose.y + 17;
  const beamApexY = centerPose.y + 10;
  const beamBottom = floorY;
  const beamColor = state.mode === "lift" ? "126, 234, 255" : "255, 138, 118";
  const intensity = Math.max(spaceBeam.minVisualIntensity, state.intensity);
  const ringDrift = state.mode === "lift" ? -1 : 1;
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.017);

  const beamGrad = ctx.createLinearGradient(beamX, beamTop, beamX, beamBottom);
  beamGrad.addColorStop(0, `rgba(${beamColor}, ${(0.2 + pulse * 0.1) * intensity})`);
  beamGrad.addColorStop(0.55, `rgba(${beamColor}, ${(0.08 + pulse * 0.06) * intensity})`);
  beamGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(beamX, beamApexY);
  ctx.quadraticCurveTo(beamX + spaceBeam.radius * 0.12, beamTop + 28, beamX + spaceBeam.radius, beamBottom);
  ctx.lineTo(beamX - spaceBeam.radius, beamBottom);
  ctx.quadraticCurveTo(beamX - spaceBeam.radius * 0.12, beamTop + 28, beamX, beamApexY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = `rgba(${beamColor}, ${(0.44 + pulse * 0.2) * intensity})`;
  ctx.lineWidth = 1.5 + intensity * 0.9;
  const ringCount = 7;
  const ringTravel = state.mode === "lift" ? (1 - state.progress) : state.progress;
  for (let i = 0; i < ringCount; i++) {
    const base = (i / ringCount + ringTravel) % 1;
    const y = beamApexY + 12 + base * (beamBottom - beamApexY - 12);
    const rx = 10 + base * (spaceBeam.radius - 10);
    const ry = 5 + base * 2.2;
    ctx.beginPath();
    ctx.ellipse(beamX, y + ringDrift * Math.sin(now * 0.006 + i) * 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSpaceUfos(now) {
  if (level !== 5) return;
  const leftPose = getSpaceUfoPose(now, "left");
  const centerPose = getSpaceUfoPose(now, "center");
  const rightPose = getSpaceUfoPose(now, "right");
  const centerState = getSpaceBeamState(now);
  const sideState = {
    mode: centerState.mode === "lift" ? "press" : "lift",
    progress: centerState.progress,
    intensity: centerState.intensity,
    wave: -centerState.wave
  };

  drawAmbientSpaceBeam(now, leftPose, 72, sideState, 0.9);
  drawAmbientSpaceBeam(now, rightPose, 72, sideState, 2.2);
  drawSpaceBeam(now, centerPose, centerState);

  drawSpaceUfo(leftPose, 0.95, 0.86);
  drawSpaceUfo(rightPose, 0.95, 0.86);
  drawSpaceUfo(centerPose, 1.08, 0.95);
}

function triggerBrickStamp() {
  if (!brickStampedThisShot) {
    if (gotTheIckArmed) {
      playSfx("brickIck", 0.82);
      gotTheIckArmed = false;
    } else {
      playSfx(brickAltUnlocked ? "brickUnlocked" : "brick", 0.74);
    }
  }
  brickStampTimer = 44;
  brickStampedThisShot = true;
}

function resolveRimCollision(rimX, rimY) {
  const dx = ball.x - rimX;
  const dy = ball.y - rimY;
  const dist = Math.hypot(dx, dy);
  const minDist = ball.r + hoop.rimRadius;
  if (dist < minDist && dist > 0) {
    touchedRim = true;
    if (rimSoundCooldown <= 0) {
      playSfx("rim", 0.75);
      rimSoundCooldown = 6;
    }
    const nx = dx / dist;
    const ny = dy / dist;
    ball.x = rimX + nx * minDist;
    ball.y = rimY + ny * minDist;
    const dot = ball.vx * nx + ball.vy * ny;
    const bounce = 0.72;
    ball.vx -= (1 + bounce) * dot * nx;
    ball.vy -= (1 + bounce) * dot * ny;
    ball.vx += ball.spin * 0.2;
    ball.vy -= Math.abs(ball.spin) * 0.08;
  }
}

function physicsStep() {
  if (!gameStarted) return;
  const now = performance.now();
  const elapsed = Math.max(0, now - lastTimerTickAt);
  lastTimerTickAt = now;
  levelTimeRemainingMs = Math.max(0, levelTimeRemainingMs - elapsed);
  if (levelTimeRemainingMs <= 0) {
    resetToSplash();
    return;
  }

  updateEffects();
  updateGulls(now);
  updateHelicopter(now);
  updateBalloons(now);
  if (rimSoundCooldown > 0) rimSoundCooldown -= 1;
  if (floorSoundCooldown > 0) floorSoundCooldown -= 1;
  if (dribbleSoundCooldown > 0) dribbleSoundCooldown -= 1;
  if (chargeSoundCooldown > 0) chargeSoundCooldown -= 1;

  if (resetCountdown >= 0) {
    resetCountdown -= 1;
    if (resetCountdown <= 0) {
      resetBall();
    }
    return;
  }

  if (charging) {
    charge += chargeDir * 0.013;
    if (charge >= maxCharge) {
      charge = maxCharge;
      chargeDir = -1;
    } else if (charge <= 0) {
      charge = 0;
      chargeDir = 1;
    }
  }

  if (!ball.inFlight && !charging) {
    if (dribbleCooldown > 0) dribbleCooldown -= 1;

    if (dribbleActive) {
      dribblePhase += 0.09;
      const t = clamp(dribblePhase, 0, 1);
      const bounce = Math.sin(t * Math.PI);
      ball.x = dribbleX + Math.sin(t * Math.PI * 2) * 2;
      ball.y = handBall.y + bounce * (floorY - ball.r - handBall.y);
      ball.spin += 0.08;
      const nearFloorContact = t >= 0.47 && t <= 0.6;
      if (nearFloorContact && !dribbleBouncePlayed && dribbleSoundCooldown <= 0) {
        playSfx("floor", 0.64);
        dribbleBouncePlayed = true;
        dribbleSoundCooldown = 8;
      }

      if (t >= 1) {
        dribbleActive = false;
        dribbleCooldown = dribbleHeld ? 7 : 0;
        dribbleBouncePlayed = false;
        ball.x = handBall.x;
        ball.y = handBall.y;
      }
    } else if (dribbleHeld && dribbleCooldown <= 0) {
      dribbleActive = true;
      dribblePhase = 0;
      dribbleBouncePlayed = false;
    } else if (!dribbleHeld) {
      ball.x = handBall.x;
      ball.y = handBall.y;
    }
  }

  updateHud();

  if (!ball.inFlight) return;

  const prevX = ball.x;
  const prevY = ball.y;

  const gravityMultiplier = getSpaceBeamGravityMultiplierAt(ball.x, ball.y, now);
  ball.vy += gravity * gravityMultiplier;
  ball.vx *= airDrag;
  ball.vy *= airDrag;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (level === 2) {
    for (let i = 0; i < gulls.length; i++) {
      resolveGullCollision(gulls[i]);
    }
  } else if (level === 3) {
    resolveHelicopterCollision();
  } else if (level === 4) {
    for (let i = 0; i < balloons.length; i++) {
      resolveBalloonCollision(balloons[i]);
    }
  }

  const leftRimX = hoop.x;
  const rightRimX = hoop.x + hoop.rimGap;
  const rimY = hoop.y;

  resolveRimCollision(leftRimX, rimY);
  resolveRimCollision(rightRimX, rimY);

  if (
    ball.x + ball.r > backboard.x &&
    ball.x - ball.r < backboard.x + backboard.w &&
    ball.y + ball.r > backboard.y &&
    ball.y - ball.r < backboard.y + backboard.h
  ) {
    touchedBackboard = true;
    ball.x = backboard.x - ball.r;
    ball.vx = -Math.abs(ball.vx) * 0.78;
    ball.vy *= 0.92;
  }

  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx = Math.abs(ball.vx) * 0.7;
  }

  if (ball.x + ball.r > W) {
    ball.x = W - ball.r;
    ball.vx = -Math.abs(ball.vx) * 0.7;
  }

  if (ball.y + ball.r >= floorY) {
    if (Math.abs(ball.vy) > 1.2 && floorSoundCooldown <= 0) {
      playSfx("floor", 0.72);
      floorSoundCooldown = 8;
    }
    ball.y = floorY - ball.r;
    if (Math.abs(ball.vy) < 1.8) {
      ball.vy = 0;
      ball.vx *= 0.82;
    } else {
      ball.vy = -Math.abs(ball.vy) * 0.54;
      ball.vx *= 0.86;
    }

    if (Math.abs(ball.vx) < 0.2 && Math.abs(ball.vy) < 0.2) {
      if (!ball.scoredOnThisShot) {
        const touchedObstacleThisShot = touchedGullThisShot || touchedHeliThisShot || touchedBalloonThisShot;
        const isAirball = !touchedRim && !touchedBackboard && !touchedObstacleThisShot;
        if (isAirball) {
          playSfx("airball", 0.82);
        } else if (touchedRim && !brickStampedThisShot) {
          triggerBrickStamp();
        }
        brickStreak += 1;
        if (brickStreak >= 3) {
          brickAltUnlocked = true;
        }
        comboStreak = 0;
        lastMadeShot = false;
        lastShotWasSwish = false;
        queueReset(isAirball ? "Airball" : "Brick");
        return;
      }
      brickStreak = 0;
      queueReset(comboStreak > 1 ? `Combo x${getComboMultiplier(comboStreak)}` : "Made Shot");
      return;
    }
  }

  const crossedRimPlane = prevY < rimY && ball.y >= rimY;
  const withinRimGap = ball.x > leftRimX + 8 && ball.x < rightRimX - 8;
  const scorePlaneY = rimY + 18;
  const crossedScorePlane = prevY < scorePlaneY && ball.y >= scorePlaneY;
  const withinScoreWindow = ball.x > leftRimX + 10 && ball.x < rightRimX - 10;
  const throughCylinder = lineCircleHit(
    prevX,
    prevY,
    ball.x,
    ball.y,
    hoop.x + hoop.rimGap / 2,
    rimY + 26,
    hoop.rimGap / 2 - 10
  );

  const madeOnEntry = crossedRimPlane && withinRimGap && throughCylinder;
  const madeOnDrop = crossedScorePlane && withinScoreWindow;
  if (!ball.scoredOnThisShot && ball.vy > 0 && (madeOnEntry || madeOnDrop)) {
    const swish = !touchedRim && !touchedBackboard;
    const trickShot = touchedGullThisShot || touchedHeliThisShot || touchedBalloonThisShot;
    ball.scoredOnThisShot = true;
    lastMadeShot = true;
    lastShotWasSwish = swish;
    comboStreak += 1;
    brickStampTimer = 0;
    brickStampedThisShot = false;
    netJiggle = 1;
    netJigglePhase = 0;
    playSfx("net", 0.78);
    if (trickShot) {
      playSfx("bankShot", 0.84);
    } else {
      playSfx(comboStreak > 1 ? "swish" : "made", comboStreak > 1 ? 0.82 : 0.75);
    }
    spawnScoreEffects(hoop.x + hoop.rimGap * 0.5, hoop.y + 22, swish);
    if (trickShot) {
      spawnTrickShotEffects(hoop.x + hoop.rimGap * 0.5, hoop.y + 22);
      bankShotStickerTimer = 54;
    }

    if (swish) {
      const basePoints = 2;
      const earnedPoints = basePoints * getComboMultiplier(comboStreak);
      score += earnedPoints;
      spawnFloatingPoints(earnedPoints);
      stateEl.textContent = comboStreak > 1
        ? `Swish +${earnedPoints}! Combo x${getComboMultiplier(comboStreak)}`
        : `Swish +${earnedPoints}!`;
      if (trickShot) {
        stateEl.textContent = `${stateEl.textContent} Trick Shot!`;
      }
    } else {
      const basePoints = 1;
      const earnedPoints = basePoints * getComboMultiplier(comboStreak);
      score += earnedPoints;
      spawnFloatingPoints(earnedPoints);
      stateEl.textContent = comboStreak > 1
        ? `Bucket +${earnedPoints}! Combo x${getComboMultiplier(comboStreak)}`
        : `Bucket +${earnedPoints}`;
      if (trickShot) {
        stateEl.textContent = `${stateEl.textContent} Trick Shot!`;
      }
    }
    applyLevelProgression();
    updateHud();
  }

  if (!ball.scoredOnThisShot && touchedRim && !brickStampedThisShot) {
    const rimCenterX = hoop.x + hoop.rimGap * 0.5;
    const belowDecisionLine = ball.y > hoop.y + 20;
    const outsideMakeLane = ball.x < hoop.x + 10 || ball.x > hoop.x + hoop.rimGap - 10;
    const movingAway =
      (ball.x < rimCenterX && ball.vx <= -0.18) ||
      (ball.x > rimCenterX && ball.vx >= 0.18);
    if (belowDecisionLine && outsideMakeLane && movingAway) {
      triggerBrickStamp();
    }
  }
}

function drawCourt() {
  const isSunrise = level === 2;
  const isAfternoon = level === 3;
  const isGolden = level === 4;
  const isSpace = level === 5;
  const sky = ctx.createLinearGradient(0, 0, 0, floorY);
  if (isSunrise) {
    sky.addColorStop(0, "#5b3f8e");
    sky.addColorStop(0.42, "#9a5f92");
    sky.addColorStop(1, "#f1b06a");
  } else if (isAfternoon) {
    sky.addColorStop(0, "#8fd3ff");
    sky.addColorStop(0.45, "#bce8ff");
    sky.addColorStop(1, "#d9f3ff");
  } else if (isGolden) {
    sky.addColorStop(0, "#5964a0");
    sky.addColorStop(0.46, "#e08b62");
    sky.addColorStop(1, "#f0c176");
  } else if (isSpace) {
    sky.addColorStop(0, "#060918");
    sky.addColorStop(0.48, "#101a3d");
    sky.addColorStop(1, "#1b2856");
  } else {
    sky.addColorStop(0, "#2a1f66");
    sky.addColorStop(0.45, "#203a7e");
    sky.addColorStop(1, "#1b2e62");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, floorY);

  if (isSunrise || isAfternoon || isGolden) {
    const sunX = W * 0.76;
    const sunY = 104;
    ctx.fillStyle = isSunrise
      ? "rgba(255, 214, 134, 0.88)"
      : (isAfternoon ? "rgba(255, 234, 170, 0.9)" : "rgba(255, 203, 120, 0.9)");
    ctx.beginPath();
    ctx.arc(sunX, sunY, isAfternoon ? 34 : (isGolden ? 36 : 30), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 237, 186, 0.46)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sunX, sunY, isAfternoon ? 42 : (isGolden ? 46 : 38), 0, Math.PI * 2);
    ctx.stroke();
  } else if (isSpace) {
    const planetX = W * 0.77;
    const planetY = 98;
    const planetGrad = ctx.createRadialGradient(planetX - 12, planetY - 10, 6, planetX, planetY, 42);
    planetGrad.addColorStop(0, "rgba(170, 224, 255, 0.95)");
    planetGrad.addColorStop(0.62, "rgba(93, 163, 243, 0.9)");
    planetGrad.addColorStop(1, "rgba(59, 102, 190, 0.88)");
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(163, 221, 255, 0.52)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 54, 11, -0.25, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const moonX = W * 0.74;
    const moonY = 104;
    ctx.fillStyle = "rgba(236, 245, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#233668";
    ctx.beginPath();
    ctx.arc(moonX + 12, moonY - 4, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(206, 238, 255, 0.38)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 34, -Math.PI * 0.7, Math.PI * 0.55);
    ctx.stroke();
  }

  function drawCloud(x, y, scale, alpha) {
    const cloudColor = isSunrise
      ? `rgba(255, 231, 196, ${alpha})`
      : (isAfternoon
        ? `rgba(255, 255, 255, ${alpha})`
        : (isGolden ? `rgba(255, 232, 196, ${alpha})` : `rgba(194, 220, 255, ${alpha})`));
    ctx.fillStyle = cloudColor;
    ctx.beginPath();
    ctx.ellipse(x, y, 116 * scale, 28 * scale, 0.05, 0, Math.PI * 2);
    ctx.ellipse(x - 72 * scale, y + 4 * scale, 66 * scale, 22 * scale, 0.08, 0, Math.PI * 2);
    ctx.ellipse(x + 66 * scale, y + 2 * scale, 72 * scale, 24 * scale, -0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!isSpace) {
    const cloudTime = performance.now() * 0.00003;
    drawCloud(W * 0.2 + Math.sin(cloudTime * 1.2) * 36, 118, 1.05, isSunrise ? 0.22 : (isAfternoon ? 0.24 : (isGolden ? 0.23 : 0.13)));
    drawCloud(W * 0.56 + Math.sin(cloudTime * 0.9 + 1.7) * 30, 146, 0.95, isSunrise ? 0.2 : (isAfternoon ? 0.22 : (isGolden ? 0.22 : 0.11)));
    drawCloud(W * 0.86 + Math.sin(cloudTime * 1.05 + 3.1) * 40, 128, 1.1, isSunrise ? 0.24 : (isAfternoon ? 0.26 : (isGolden ? 0.25 : 0.14)));
  } else {
    for (let i = 0; i < 120; i++) {
      const sx = (i * 83) % W;
      const sy = (i * 47) % (floorY - 40);
      const twinkle = 0.45 + 0.55 * Math.sin(performance.now() * 0.002 + i * 0.9);
      ctx.fillStyle = `rgba(225, 237, 255, ${0.18 + twinkle * 0.45})`;
      const size = i % 4 === 0 ? 2 : 1;
      ctx.fillRect(sx, sy, size, size);
    }
  }

  if (level === 2) {
    drawGulls(performance.now());
  } else if (level === 3) {
    drawHelicopter(performance.now());
  } else if (level === 4) {
    drawBalloons(performance.now());
  } else if (level === 5) {
    drawSpaceUfos(performance.now());
  } else {
    drawSkyPlane(performance.now());
  }

  if (!isSpace) {
    ctx.fillStyle = isSunrise ? "#8a79a7" : (isAfternoon ? "#8da4b8" : (isGolden ? "#9a7f76" : "#141b42"));
    for (let i = 0; i < 20; i++) {
      const x = i * 52 + ((i % 2) * 7);
      const h = 48 + ((i * 13) % 64);
      ctx.fillRect(x, floorY - h - 26, 40, h);
    }
  }

  const courtGrad = ctx.createLinearGradient(0, floorY, 0, H);
  if (isSunrise) {
    courtGrad.addColorStop(0, "#564765");
    courtGrad.addColorStop(0.55, "#473a55");
    courtGrad.addColorStop(1, "#372d44");
  } else if (isAfternoon) {
    courtGrad.addColorStop(0, "#4e535b");
    courtGrad.addColorStop(0.55, "#3e434b");
    courtGrad.addColorStop(1, "#30353d");
  } else if (isGolden) {
    courtGrad.addColorStop(0, "#5a4a4a");
    courtGrad.addColorStop(0.55, "#4a3d3f");
    courtGrad.addColorStop(1, "#3a3032");
  } else if (isSpace) {
    courtGrad.addColorStop(0, "#29335f");
    courtGrad.addColorStop(0.55, "#202a4e");
    courtGrad.addColorStop(1, "#171f3d");
  } else {
    courtGrad.addColorStop(0, "#35383f");
    courtGrad.addColorStop(0.55, "#2b2d33");
    courtGrad.addColorStop(1, "#1e2026");
  }
  ctx.fillStyle = courtGrad;
  ctx.fillRect(0, floorY, W, H - floorY);

  // Deterministic speckle noise so asphalt reads textured without frame flicker.
  for (let y = floorY + 2; y < H; y += 5) {
    for (let x = 0; x < W; x += 7) {
      const n = Math.sin(x * 0.13 + y * 0.21) * 0.5 + 0.5;
      if (n > 0.78) {
        ctx.fillStyle = "rgba(210, 216, 228, 0.08)";
        ctx.fillRect(x, y, 2, 2);
      } else if (n < 0.18) {
        ctx.fillStyle = "rgba(6, 9, 14, 0.14)";
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  ctx.strokeStyle = isSunrise ? "#ffe6b3" : (isAfternoon ? "#f3fbff" : (isGolden ? "#ffe1a7" : (isSpace ? "#94e4ff" : "#93f0ff")));
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(W, floorY);
  ctx.stroke();

  const paint = isSunrise ? "#ffe8bf" : (isAfternoon ? "#f4fcff" : (isGolden ? "#ffe2b4" : (isSpace ? "#bee9ff" : "#b5f7ff")));
  const paintShade = isSunrise
    ? "rgba(58, 35, 58, 0.28)"
    : (isAfternoon
      ? "rgba(17, 27, 44, 0.26)"
      : (isGolden ? "rgba(68, 41, 36, 0.26)" : (isSpace ? "rgba(8, 18, 48, 0.4)" : "rgba(12, 18, 33, 0.35)")));
  const depth = H - floorY;
  const visibleDepth = floorY + depth * 0.56;

  // Side-view half-court lane as a trapezoid (near plane detail emphasized).
  const laneLeft = player.x - 4;
  const laneRight = hoop.x + 12;
  ctx.strokeStyle = paintShade;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(laneLeft, floorY + 2);
  ctx.lineTo(laneLeft + 26, visibleDepth);
  ctx.lineTo(laneRight - 12, visibleDepth);
  ctx.lineTo(laneRight, floorY + 2);
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = paint;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(laneLeft, floorY + 2);
  ctx.lineTo(laneLeft + 26, visibleDepth);
  ctx.lineTo(laneRight - 12, visibleDepth);
  ctx.lineTo(laneRight, floorY + 2);
  ctx.closePath();
  ctx.stroke();

  // Free-throw "top" curve compressed for side perspective and visible-half only.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, floorY - 2, W, visibleDepth - floorY + 6);
  ctx.clip();
  ctx.strokeStyle = paint;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(player.x - 34, floorY + 2, 94, 26, 0, Math.PI, 0, true);
  ctx.stroke();
  ctx.restore();

  // Baseline under hoop and a short sideline hash to sell half-court setup.
  ctx.strokeStyle = paint;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(hoop.x + 74, floorY);
  ctx.lineTo(hoop.x + 74, floorY + depth * 0.55);
  ctx.moveTo(hoop.x - 6, floorY + depth * 0.22);
  ctx.lineTo(hoop.x + 42, floorY + depth * 0.22);
  ctx.stroke();
}

function drawHoop() {
  const supportPoleX = backboard.x + 76;
  const supportTopY = hoop.y - 26;
  const baseY = floorY - 52;

  ctx.fillStyle = "#4f5ca0";
  ctx.fillRect(supportPoleX - 7, supportTopY, 14, floorY - supportTopY);
  ctx.strokeStyle = "#0d122f";
  ctx.lineWidth = 3;
  ctx.strokeRect(supportPoleX - 7, supportTopY, 14, floorY - supportTopY);

  ctx.fillStyle = "#6f80c6";
  ctx.beginPath();
  ctx.moveTo(supportPoleX - 2, supportTopY + 10);
  ctx.lineTo(backboard.x + 4, hoop.y - 14);
  ctx.lineTo(backboard.x + 4, hoop.y - 2);
  ctx.lineTo(supportPoleX - 2, supportTopY + 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#3a3f66";
  ctx.fillRect(supportPoleX - 42, baseY, 84, 52);
  ctx.strokeRect(supportPoleX - 42, baseY, 84, 52);
  ctx.fillStyle = "#2a2e4d";
  ctx.fillRect(supportPoleX - 42, baseY + 34, 84, 18);

  const boardFrontX = backboard.x - 2;
  const boardFrontW = backboard.w + 4;
  ctx.fillStyle = "#5d74cb";
  ctx.fillRect(boardFrontX + 3, backboard.y + 4, boardFrontW, backboard.h);
  ctx.fillStyle = "#8bc9ff";
  ctx.fillRect(boardFrontX, backboard.y, boardFrontW, backboard.h);
  ctx.strokeStyle = "#0d122f";
  ctx.lineWidth = 3;
  ctx.strokeRect(boardFrontX, backboard.y, boardFrontW, backboard.h);
  ctx.strokeStyle = "rgba(11, 22, 58, 0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(boardFrontX + 3, backboard.y + 8, boardFrontW - 6, backboard.h - 16);
  ctx.strokeStyle = "#16245b";
  ctx.lineWidth = 2;
  ctx.strokeRect(boardFrontX + 2, hoop.y - 40, Math.max(6, (boardFrontW - 4) * 0.5), 26);

  ctx.strokeStyle = "#ff9640";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(hoop.x, hoop.y);
  ctx.lineTo(hoop.x + hoop.rimGap, hoop.y);
  ctx.stroke();

  const leftRim = { x: hoop.x, y: hoop.y };
  const rightRim = { x: hoop.x + hoop.rimGap, y: hoop.y };
  ctx.fillStyle = "#ff9640";
  ctx.beginPath();
  ctx.arc(leftRim.x, leftRim.y, hoop.rimRadius, 0, Math.PI * 2);
  ctx.arc(rightRim.x, rightRim.y, hoop.rimRadius, 0, Math.PI * 2);
  ctx.fill();

  const netTopY = hoop.y + 2;
  const jiggleX = Math.sin(netJigglePhase * 1.8) * 4.4 * netJiggle;
  const jiggleY = Math.abs(Math.sin(netJigglePhase * 2.2)) * 7 * netJiggle;
  const netBottomY = hoop.y + 56 + jiggleY;
  const netBottomInset = 11;
  const netLeftTop = hoop.x + 3;
  const netRightTop = hoop.x + hoop.rimGap - 3;
  const netLeftBottom = hoop.x + netBottomInset + jiggleX;
  const netRightBottom = hoop.x + hoop.rimGap - netBottomInset + jiggleX;

  ctx.strokeStyle = "rgba(152, 243, 255, 0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(netLeftTop, netTopY);
  ctx.lineTo(netLeftBottom, netBottomY);
  ctx.lineTo(netRightBottom, netBottomY);
  ctx.lineTo(netRightTop, netTopY);
  ctx.stroke();

  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const topX = netLeftTop + (netRightTop - netLeftTop) * t;
    const bottomX = netLeftBottom + (netRightBottom - netLeftBottom) * t;
    ctx.beginPath();
    ctx.moveTo(topX, netTopY);
    ctx.lineTo(bottomX, netBottomY);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(152, 243, 255, 0.42)";
  for (let i = 1; i < 4; i++) {
    const y = netTopY + (netBottomY - netTopY) * (i / 4);
    const inset = (y - netTopY) / (netBottomY - netTopY) * (netBottomInset - 2);
    ctx.beginPath();
    ctx.moveTo(netLeftTop + inset, y);
    ctx.lineTo(netRightTop - inset, y);
    ctx.stroke();
  }
}

function drawParticles() {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.95})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFloatingPoints() {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < floatTexts.length; i++) {
    const t = floatTexts[i];
    const alpha = Math.max(0, t.life / t.maxLife);
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.strokeStyle = `rgba(11, 16, 45, ${alpha * 0.9})`;
    ctx.lineWidth = 4;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = `rgba(255, 240, 155, ${alpha})`;
    ctx.fillText(t.text, t.x, t.y);
  }
}

function drawBrickStamp() {
  if (brickStampTimer <= 0) return;
  const alpha = Math.min(1, brickStampTimer / 10) * Math.max(0, brickStampTimer / 44);
  ctx.save();
  ctx.translate(W * 0.52, H * 0.36);
  ctx.rotate(-0.16);

  ctx.strokeStyle = `rgba(210, 36, 36, ${0.86 * alpha})`;
  ctx.lineWidth = 6;
  ctx.strokeRect(-130, -46, 260, 92);

  ctx.strokeStyle = `rgba(255, 115, 115, ${0.62 * alpha})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(-124, -40, 248, 80);

  ctx.fillStyle = `rgba(180, 24, 24, ${0.16 * alpha})`;
  ctx.fillRect(-124, -40, 248, 80);

  ctx.font = "bold 58px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = `rgba(224, 28, 28, ${0.9 * alpha})`;
  ctx.fillText("BRICK", 0, 2);
  ctx.restore();
}

function drawBankShotSticker() {
  if (bankShotStickerTimer <= 0) return;
  const life = bankShotStickerTimer / 54;
  const fade = Math.min(1, bankShotStickerTimer / 10) * Math.max(0, life);
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.05);
  const flash = 0.72 + pulse * 0.28;

  ctx.save();
  ctx.translate(W * 0.48, H * 0.25);
  ctx.rotate(-0.12);
  ctx.scale(1 + pulse * 0.03, 1 + pulse * 0.03);

  ctx.shadowBlur = 28;
  ctx.shadowColor = `rgba(24, 235, 255, ${0.85 * fade})`;
  ctx.fillStyle = `rgba(12, 22, 60, ${0.68 * fade})`;
  ctx.strokeStyle = `rgba(33, 246, 255, ${0.98 * fade * flash})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-196, -42);
  ctx.lineTo(182, -56);
  ctx.lineTo(210, -4);
  ctx.lineTo(170, 54);
  ctx.lineTo(-176, 44);
  ctx.lineTo(-214, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 20;
  ctx.shadowColor = `rgba(255, 46, 220, ${0.8 * fade})`;
  ctx.strokeStyle = `rgba(255, 46, 220, ${0.92 * fade * flash})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(170, 251, 255, ${0.88 * fade})`;
  ctx.lineWidth = 1.5;
  for (let i = -160; i <= 160; i += 22) {
    ctx.beginPath();
    ctx.moveTo(i, -26);
    ctx.lineTo(i + 22, -37);
    ctx.stroke();
  }

  ctx.shadowBlur = 16;
  ctx.shadowColor = `rgba(33, 246, 255, ${0.9 * fade})`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 56px 'Courier New', monospace";
  ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * fade})`;
  ctx.fillText("BANK SHOT!", 0, -2);

  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = `rgba(24, 34, 72, ${0.9 * fade})`;
  ctx.strokeText("BANK SHOT!", 0, -2);
  ctx.restore();
}

function drawTrajectory() {
  if (!charging || ball.inFlight) return;
  const now = performance.now();
  const { angle, speed } = getShotParams(charge);
  let tx = ball.x;
  let ty = ball.y;
  let tvx = Math.cos(angle) * speed;
  let tvy = Math.sin(angle) * speed;

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 6]);
  const points = [{ x: tx, y: ty }];
  for (let i = 0; i < 90; i++) {
    const gravityMultiplier = getSpaceBeamGravityMultiplierAt(tx, ty, now);
    tvy += gravity * gravityMultiplier;
    tvx *= airDrag;
    tvy *= airDrag;
    tx += tvx;
    ty += tvy;
    points.push({ x: tx, y: ty });
    if (ty > floorY) break;
  }

  const visibleCount = Math.max(2, Math.floor(points.length * 0.74));
  const endpoint = points[visibleCount - 1];
  const pulse = 0.65 + Math.sin(performance.now() * 0.012) * 0.35;
  const lightSky = level === 3;
  const arcGlow = lightSky ? "rgba(21, 56, 86, 0.34)" : "rgba(25, 224, 210, 0.26)";
  const arcCore = lightSky ? "rgba(12, 32, 56, 0.9)" : "rgba(255, 255, 255, 0.85)";
  const arcTip = lightSky ? `rgba(32, 72, 111, ${0.5 + pulse * 0.3})` : `rgba(255, 245, 170, ${0.45 + pulse * 0.35})`;

  ctx.strokeStyle = arcGlow;
  ctx.lineWidth = 8;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < visibleCount; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  ctx.strokeStyle = arcCore;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < visibleCount; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  ctx.fillStyle = arcTip;
  ctx.beginPath();
  ctx.arc(endpoint.x, endpoint.y, 4 + pulse * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  ctx.arc(endpoint.x, endpoint.y, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.setLineDash([]);
}

function drawPlayer() {
  const px = player.x;
  const py = player.y;
  const bob = dribbleHeld ? Math.sin(dribblePhase) * 1.6 : 0;
  const lean = charging ? -4 - charge * 5 : (dribbleHeld ? 1.5 : 0);
  const shoulderX = px + lean;
  const shoulderY = py - 2 + bob * 0.2;

  const rightHandX = charging
    ? handBall.x - 6 + charge * 4
    : (dribbleHeld ? ball.x - 5 : handBall.x - 5);
  const rightHandY = charging
    ? handBall.y - 10 - charge * 10
    : (dribbleHeld ? ball.y - 7 : handBall.y - 8);
  const leftHandX = px - 24 + lean * 0.5;
  const leftHandY = py + 2 + bob * 0.1;

  ctx.fillStyle = "#2d4252";
  ctx.beginPath();
  ctx.moveTo(px - 14 + lean * 0.4, py - 10);
  ctx.lineTo(px + 10 + lean * 0.4, py - 14);
  ctx.lineTo(px + 17, py + 28);
  ctx.lineTo(px - 20, py + 28);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#f1c9a5";
  ctx.beginPath();
  ctx.ellipse(px + lean * 0.5, py - 34 + bob * 0.15, 14, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#f1c9a5";
  ctx.beginPath();
  ctx.moveTo(px - 8 + lean * 0.5, py - 37);
  ctx.lineTo(px - 2 + lean * 0.5, py - 38);
  ctx.moveTo(px + 1 + lean * 0.5, py - 38);
  ctx.lineTo(px + 8 + lean * 0.5, py - 37);
  ctx.stroke();

  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(px - 4 + lean * 0.5, py - 33, 1.3, 0, Math.PI * 2);
  ctx.arc(px + 5 + lean * 0.5, py - 33, 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(rightHandX, rightHandY);
  ctx.moveTo(shoulderX - 6, shoulderY + 3);
  ctx.lineTo(leftHandX, leftHandY);
  ctx.stroke();

  ctx.fillStyle = "#f1c9a5";
  ctx.beginPath();
  ctx.arc(rightHandX, rightHandY, 3, 0, Math.PI * 2);
  ctx.arc(leftHandX, leftHandY, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(px - 6, py + 28);
  ctx.lineTo(px - 12, py + 56);
  ctx.moveTo(px + 7, py + 28);
  ctx.lineTo(px + 18, py + 56);
  ctx.stroke();
}

function drawBall() {
  const now = performance.now();
  const beamGlow = getBallBeamGlow(now);
  if (beamGlow) {
    const spill = ctx.createRadialGradient(
      ball.x,
      ball.y,
      ball.r * 0.84,
      ball.x,
      ball.y,
      ball.r * (1.45 + beamGlow.intensity * 0.28)
    );
    spill.addColorStop(0, `rgba(${beamGlow.color}, ${(0.12 + beamGlow.intensity * 0.16) * beamGlow.boost})`);
    spill.addColorStop(0.62, `rgba(${beamGlow.color}, ${(0.05 + beamGlow.intensity * 0.1) * beamGlow.boost})`);
    spill.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spill;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r * (1.95 + beamGlow.intensity * 0.35), 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowBlur = 11 + beamGlow.intensity * 8 + (beamGlow.boost - 1) * 5;
    ctx.shadowColor = `rgba(${beamGlow.color}, ${(0.72 + beamGlow.intensity * 0.28) * beamGlow.boost})`;
    ctx.strokeStyle = `rgba(${beamGlow.color}, ${(0.58 + beamGlow.intensity * 0.24) * beamGlow.boost})`;
    ctx.lineWidth = 1.8 + beamGlow.intensity * 1.2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r + 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const ballGrad = ctx.createRadialGradient(
    ball.x - ball.r * 0.35,
    ball.y - ball.r * 0.35,
    ball.r * 0.3,
    ball.x,
    ball.y,
    ball.r * 1.05
  );
  ballGrad.addColorStop(0, "#ffcf6d");
  ballGrad.addColorStop(0.45, "#ff8d37");
  ballGrad.addColorStop(1, "#c7471f");
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#37130d";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 235, 180, 0.42)";
  ctx.beginPath();
  ctx.arc(ball.x - 4, ball.y - 5, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate((performance.now() * 0.003 + ball.x * 0.04) % (Math.PI * 2));
  ctx.beginPath();
  ctx.arc(0, 0, ball.r - 0.8, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = "#35120b";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, ball.r * 0.62, -Math.PI * 0.85, Math.PI * 0.85);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(-ball.r * 0.62, 0, ball.r * 0.42, ball.r * 0.92, 0, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(ball.r * 0.62, 0, ball.r * 0.42, ball.r * 0.92, 0, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-ball.r + 2.2, 0);
  ctx.lineTo(ball.r - 2.2, 0);
  ctx.stroke();
  ctx.restore();
}

function drawCrtOverlay() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1);
  }

  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

function frame() {
  updateSkyPlane(performance.now());
  physicsStep();
  drawCourt();
  drawHoop();
  drawPlayer();
  drawTrajectory();
  drawBall();
  drawParticles();
  drawFloatingPoints();
  drawBrickStamp();
  drawBankShotSticker();
  drawCrtOverlay();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (e) => {
  if (!gameStarted) {
    if (splashReady && (e.code === "Enter" || e.code === "Space")) {
      e.preventDefault();
      startGame();
    }
    return;
  }
  if (e.code === "Space") {
    e.preventDefault();
    if (spaceHeld) return;
    spaceHeld = true;
    beginCharge();
    return;
  }
  if (e.key.toLowerCase() === "r") resetBall();
});
window.addEventListener("keyup", (e) => {
  if (!gameStarted) return;
  if (e.code !== "Space") return;
  e.preventDefault();
  spaceHeld = false;
  releaseShot();
});
window.addEventListener("blur", () => {
  if (spaceHeld) {
    spaceHeld = false;
    releaseShot();
  }
  stopChargeSfx();
  endDribble();
});
if (muteChargeBtn) {
  muteChargeBtn.addEventListener("click", () => {
    const wasMuted = muteChargeSfx;
    muteChargeSfx = !muteChargeSfx;
    if (wasMuted && !muteChargeSfx) {
      playUnmuteSequenceSfx();
    } else if (!wasMuted && muteChargeSfx) {
      playMuteSequenceSfx();
    }
    updateMuteButton();
  });
}
if (splashYearEl) {
  splashYearEl.textContent = String(new Date().getFullYear());
}
function startGame() {
  if (!splashReady || gameStarted) return;
  resetSessionRunState();
  const selectedLevel = Number(startLevelEl?.value || "1");
  level = selectedLevel === 5
    ? 5
    : (selectedLevel === 4 ? 4 : (selectedLevel === 3 ? 3 : (selectedLevel === 2 ? 2 : 1)));
  score = level === 5
    ? level5ScoreThreshold
    : (level === 4
      ? level4ScoreThreshold
      : (level === 3 ? level3ScoreThreshold : (level === 2 ? level2ScoreThreshold : 0)));
  level = getLevelForScore(score);
  resetLevelTimer();
  comboStreak = 0;
  lastComboShown = 0;
  const startChoices = sfx.start;
  if (startChoices && startChoices.length > 0) {
    const clip = chooseRandom(startChoices);
    const audio = new Audio(clip);
    audio.volume = 0.33;
    audio.play().catch(() => {});
  }
  nextPlaneStartAt = performance.now() + planeIntervalMs;
  skyPlane.active = false;
  gameStarted = true;
  if (splashEl) splashEl.classList.add("hidden");
  resetBall();
}

function resetToSplash() {
  const currentLevel = String(level);
  spaceHeld = false;
  stopChargeSfx();
  resetSessionRunState();
  gameStarted = false;
  if (splashEl) splashEl.classList.remove("hidden");
  if (startLevelEl) startLevelEl.value = currentLevel;
  resetBall();
}

if (startBtn) {
  startBtn.addEventListener("click", startGame);
}
if (sessionResetBtn) {
  sessionResetBtn.addEventListener("click", resetToSplash);
}
if (splashEl) {
  if (splashTitleEl) {
    splashTitleEl.classList.remove("stinger");
    // Force a reflow so the stinger animation restarts on page load.
    void splashTitleEl.offsetWidth;
    splashTitleEl.classList.add("stinger");
  }
  setTimeout(() => {
    splashReady = true;
    if (startBtn) startBtn.disabled = false;
    if (startLevelEl) startLevelEl.disabled = false;
  }, 1200);
}
if (startBtn) {
  startBtn.addEventListener("keydown", (e) => {
    if (!splashReady) return;
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      startGame();
    }
  });
}
canvas.addEventListener("mousedown", (e) => {
  if (!gameStarted) return;
  if (e.button === 0) {
    beginCharge();
    return;
  }
  if (e.button === 2) {
    e.preventDefault();
    beginDribble();
  }
});
canvas.addEventListener("mouseup", (e) => {
  if (!gameStarted) return;
  if (e.button === 0) {
    releaseShot();
    return;
  }
  if (e.button === 2) {
    endDribble();
  }
});
canvas.addEventListener("mouseleave", () => {
  if (!gameStarted) return;
  releaseShot();
  endDribble();
});
canvas.addEventListener("contextmenu", (e) => {
  if (gameStarted) {
    e.preventDefault();
  }
});
canvas.addEventListener(
  "touchstart",
  (e) => {
    if (!gameStarted) return;
    e.preventDefault();
    beginCharge();
  },
  { passive: false }
);
canvas.addEventListener(
  "touchend",
  (e) => {
    if (!gameStarted) return;
    e.preventDefault();
    releaseShot();
  },
  { passive: false }
);

resetBall();
updateMuteButton();
frame();
