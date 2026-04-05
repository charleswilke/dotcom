const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const comboTextEl = document.getElementById("comboText");
const comboStepEls = comboEl ? Array.from(comboEl.querySelectorAll(".combo-step")) : [];
const stateEl = document.getElementById("state");
const timerEl = document.getElementById("timer");
const nextLevelEl = document.getElementById("nextLevel");
const muteAllBtn = document.getElementById("muteAllBtn");
const muteChargeBtn = document.getElementById("muteChargeBtn");
const sessionResetBtn = document.getElementById("sessionResetBtn");
const chargeBtn = document.getElementById("chargeBtn");
const splashEl = document.getElementById("splash");
const splashYearEl = document.getElementById("splashYear");
const startBtn = document.getElementById("startBtn");
const splashTitleEl = document.getElementById("splashTitle");
const startLevelEl = document.getElementById("startLevel");
const freeThrowModeBtn = document.getElementById("freeThrowModeBtn");
const runSummaryEl = document.getElementById("runSummary");
const scoreSubmitFormEl = document.getElementById("scoreSubmitForm");
const scoreSubmitHeadlineEl = document.getElementById("scoreSubmitHeadline");
const scoreInitialsEl = document.getElementById("scoreInitials");
const scoreInitialSlotEls = Array.from(document.querySelectorAll(".initials-slot"));
const submitScoreBtnEl = document.getElementById("submitScoreBtn");
const scoreSubmitStatusEl = document.getElementById("scoreSubmitStatus");
const leaderboardListEl = document.getElementById("leaderboardList");
const leaderboardStatusEl = document.getElementById("leaderboardStatus");
const leaderboardTitleEl = document.getElementById("leaderboardTitle");
const leaderboardNormalBtnEl = document.getElementById("leaderboardNormalBtn");
const leaderboardFreeThrowBtnEl = document.getElementById("leaderboardFreeThrowBtn");

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
let airballStampTimer = 0;
let swishStampTimer = 0;
let tootsBounceStickerTimer = 0;
let comboCalloutTimer = 0;
let comboCalloutKey = "";
let tootsFeverFlashTimer = 0;
let brickStampedThisShot = false;
let gotTheIckArmed = false;
let rimSoundCooldown = 0;
let floorSoundCooldown = 0;
let dribbleSoundCooldown = 0;
let chargeSoundCooldown = 0;
let muteAllAudio = false;
let muteChargeSfx = false;
let muteActivationCount = 0;
let unmutePlayCount = 0;
let activeChargeAudio = null;
let activeTootsFeverAudio = null;
const resetDelayFrames = 42;
const maxCharge = 1.28;
const planeIntervalMs = 120000;
let nextPlaneStartAt = performance.now() + planeIntervalMs;
const level2ScoreThreshold = 20;
const level3ScoreThreshold = 40;
const level4ScoreThreshold = 60;
const level5ScoreThreshold = 80;
const level6ScoreThreshold = 100;
const levelDurationMs = 120000;
const comboCalloutDurationFrames = 54;
const tootsFeverModeStreak = 5;
const comboLadder = [
  { streak: 2, key: "nice", sfxKey: "nice", label: "NICE!" },
  { streak: 3, key: "groovy", sfxKey: "groovy", label: "GROOVY!" },
  { streak: 4, key: "onfire", sfxKey: "onfire", label: "ON FIRE!" },
  { streak: 5, key: "tootsfever", sfxKey: "tootsFever", label: "TOOTS FEVER!" }
];
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
  // Upper arc gulls — staggered heights across the court
  { x: W * 0.24, y: 238, baseX: W * 0.24, baseY: 238, orbitX: 44, orbitY: 22, speed: 0.0019, phase: 0.2, r: 11, cooldown: 0 },
  { x: W * 0.46, y: 186, baseX: W * 0.46, baseY: 186, orbitX: 40, orbitY: 20, speed: 0.0022, phase: 2.0, r: 11, cooldown: 0 },
  { x: W * 0.66, y: 220, baseX: W * 0.66, baseY: 220, orbitX: 38, orbitY: 22, speed: 0.002, phase: 4.1, r: 11, cooldown: 0 },
  // Mid-descent plinko gulls — staggered 50-110px above hoop so deflections can still arc in
  { x: W * 0.37, y: 338, baseX: W * 0.37, baseY: 338, orbitX: 32, orbitY: 18, speed: 0.0021, phase: 1.3, r: 12, cooldown: 0 },
  { x: W * 0.55, y: 302, baseX: W * 0.55, baseY: 302, orbitX: 28, orbitY: 16, speed: 0.00195, phase: 2.6, r: 12, cooldown: 0 },
  { x: W * 0.71, y: 358, baseX: W * 0.71, baseY: 358, orbitX: 26, orbitY: 14, speed: 0.0018, phase: 3.8, r: 12, cooldown: 0 }
];
const helicopter = {
  x: W * 0.60,
  y: 300,
  baseX: W * 0.60,
  baseY: 300,
  orbitX: 56,
  orbitY: 22,
  speed: 0.0016,
  phase: 0.7,
  bodyRx: 34,
  bodyRy: 12,
  cooldown: 0
};
let touchedGullThisShot = false;
let touchedHeliThisShot = false;
let touchedBalloonThisShot = false;
let touchedLaserThisShot = false;
let touchedAlienUfoThisShot = false;
const balloons = [
  // Rising staircase left→right, but pulled back so no balloon seals off the backboard
  { x: W * 0.40, y: floorY - 268, baseX: W * 0.40, baseY: floorY - 268, swayAmp: 18, swaySpeed: 0.00162, bobAmp: 26, bobSpeed: 0.00096, phase: 0.15, rx: 34, ry: 36, cooldown: 0 },
  { x: W * 0.57, y: floorY - 336, baseX: W * 0.57, baseY: floorY - 336, swayAmp: 14, swaySpeed: 0.00138, bobAmp: 22, bobSpeed: 0.00128, phase: 2.0, rx: 32, ry: 34, cooldown: 0 },
  { x: W * 0.70, y: floorY - 382, baseX: W * 0.70, baseY: floorY - 382, swayAmp: 12, swaySpeed: 0.00174, bobAmp: 16, bobSpeed: 0.00108, phase: 4.0, rx: 33, ry: 35, cooldown: 0 }
];
const spaceUfos = {
  left: { x: W * 0.26, y: 256, wobblePhase: 0.8 },
  center: { x: W * 0.5, y: 160, wobblePhase: 2.1 },
  right: { x: W * 0.74, y: 228, wobblePhase: 3.6 }
};
const alienBaseUfos = [
  { x: W * 0.66, y: floorY - 476, wobblePhase: 0.7, scale: 0.84, cooldown: 0 },  // visible mid-court, high — threatens arc apex
  { x: W * 0.80, y: floorY - 416, wobblePhase: 1.8, scale: 0.80, cooldown: 0 },  // near backboard, mid-high
  { x: W * 0.88, y: floorY - 352, wobblePhase: 2.6, scale: 0.86, cooldown: 0 },  // far right, mid-descent zone
  { x: W * 0.74, y: floorY - 296, wobblePhase: 3.5, scale: 0.78, cooldown: 0 }   // hovering over the hoop — low lasers, max drama
];
const alienLaserField = {
  minIntervalMs: 300,
  maxIntervalMs: 520,
  speed: 6.7,
  minLength: 86,
  maxLength: 150,
  thickness: 4.8
};
const alienLaserRhythm = {
  shotsPerPhraseMin: 4,
  shotsPerPhraseMax: 6,
  restMinMs: 860,
  restMaxMs: 1180
};
const alienLasers = [];
let nextAlienLaserSpawnAt = performance.now() + 380;
let alienLaserShotsInPhrase = 0;
let alienLaserPhraseTarget = 5;
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
  nice: ["sounds/swish/nice.mp3"],
  groovy: ["sounds/swish/groovy.mp3", "sounds/swish/groovy2.mp3"],
  smooth: ["sounds/swish/smooth.mp3", "sounds/swish/smooth2.mp3", "sounds/swish/smooth3.mp3"],
  onfire: ["sounds/swish/onfire.mp3", "sounds/swish/onfire2.mp3"],
  tootsFever: ["sounds/swish/tootsfever.mp3", "sounds/swish/tootsfever2.mp3", "sounds/swish/tootsfever3.mp3"],
  swish: [
    "sounds/swish/swish.mp3",
    "sounds/swish/swish2.mp3",
    "sounds/swish/swish3.mp3",
    "sounds/swish/swish4.mp3"
  ],
  net: [
    "sounds/net/net1.mp3",
    "sounds/net/net2.mp3",
    "sounds/net/net3.mp3",
    "sounds/net/net4.mp3",
    "sounds/net/net5.mp3",
    "sounds/net/net6.mp3"
  ],
  tootsBounce: [
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
  laser: [
    "sounds/laser/laser.mp3",
    "sounds/laser/laser2.mp3",
    "sounds/laser/laser3.mp3",
    "sounds/laser/laser4.mp3",
    "sounds/laser/laser5.mp3",
    "sounds/laser/laser6.mp3",
    "sounds/laser/laser7.mp3",
    "sounds/laser/laser8.mp3"
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
    "sounds/start/splash.mp3",
    "sounds/start/splash2.mp3"
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
const extraPreloadAudio = [
  "sounds/tootsfever.mp3"
];
const preloadableAudioSrcs = Array.from(
  new Set([
    ...Object.values(sfx).flat(),
    ...extraPreloadAudio
  ])
);
const preloadedAudioTemplates = new Map();
let audioPreloadStarted = false;
let gameStarted = false;
let splashReady = false;
let freeThrowMode = false;
let pendingScoreForSubmission = null;
const leaderboardLimit = 10;
let leaderboardModeFilter = "normal";
let latestLeaderboardScores = [];
let newScoreSpotlight = null;
const brickStampImage = new Image();
brickStampImage.src = "images/brick.webp";
const airballStampImage = new Image();
airballStampImage.src = "images/airball.webp";
const swishStampImage = new Image();
swishStampImage.src = "images/swish.webp";
const tootsBounceStickerImage = new Image();
tootsBounceStickerImage.src = "images/tootsbounce.webp";
const comboCalloutImages = {
  nice: new Image(),
  groovy: new Image(),
  smooth: new Image(),
  onfire: new Image(),
  tootsfever: new Image(),
  tootsbounce: new Image()
};
comboCalloutImages.nice.src = "images/nice.webp";
comboCalloutImages.groovy.src = "images/groovy.webp";
comboCalloutImages.smooth.src = "images/smooth.webp";
comboCalloutImages.onfire.src = "images/onfire.webp";
comboCalloutImages.tootsfever.src = "images/tootsfever.webp";
comboCalloutImages.tootsbounce.src = "images/tootsbounce.webp";
const sfxLastChoiceByKey = {};
const apiBaseMetaEl = document.querySelector('meta[name="tootsjam-api-base"]');
const rawApiBase = typeof window.TOOTSJAM_API_BASE === "string" && window.TOOTSJAM_API_BASE.trim()
  ? window.TOOTSJAM_API_BASE.trim()
  : (apiBaseMetaEl?.content?.trim() || "");
const apiBase = rawApiBase.replace(/\/+$/, "");

function getApiUrl(pathname) {
  if (!apiBase) return pathname;
  if (pathname.startsWith("/")) return `${apiBase}${pathname}`;
  return `${apiBase}/${pathname}`;
}

function getLevelForScore(currentScore) {
  if (currentScore >= level6ScoreThreshold) return 6;
  if (currentScore >= level5ScoreThreshold) return 5;
  if (currentScore >= level4ScoreThreshold) return 4;
  if (currentScore >= level3ScoreThreshold) return 3;
  if (currentScore >= level2ScoreThreshold) return 2;
  return 1;
}

function getLevelLabel(value) {
  if (value === 6) return "Level 6: Alien Base";
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
  if (currentLevel === 5) return level6ScoreThreshold;
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
  if (freeThrowMode) {
    return false;
  }
  const nextLevel = getLevelForScore(score);
  if (nextLevel <= level) return false;
  level = nextLevel;
  if (level === 6) {
    resetAlienLasers();
  }
  resetLevelTimer();
  stateEl.textContent = getLevelLabel(level);
  return true;
}

function updateHud() {
  if (freeThrowMode) {
    scoreEl.textContent = `Score: ${score}`;
  } else {
    const nextTarget = getNextLevelTarget(level);
    const displayTarget = nextTarget == null ? level6ScoreThreshold : nextTarget;
    scoreEl.textContent = `Score: ${score}/${displayTarget}`;
  }
  const comboLabel = `Combo: x${getComboMultiplier(comboStreak)}`;
  if (comboTextEl) {
    comboTextEl.textContent = comboLabel;
  } else {
    comboEl.textContent = comboLabel;
  }
  if (comboStepEls.length > 0) {
    const litSteps = Math.min(tootsFeverModeStreak, Math.max(0, comboStreak));
    for (let i = 0; i < comboStepEls.length; i++) {
      comboStepEls[i].classList.toggle("is-active", i < litSteps);
    }
    comboEl.classList.toggle("is-fever", comboStreak >= tootsFeverModeStreak);
  }
  if (timerEl) timerEl.textContent = freeThrowMode ? "Free throw mode" : `Time: ${formatLevelTime(levelTimeRemainingMs)}`;
  if (nextLevelEl) nextLevelEl.textContent = "";
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
  touchedLaserThisShot = false;
  touchedAlienUfoThisShot = false;
  brickStampedThisShot = false;
  airballStampTimer = 0;
  swishStampTimer = 0;
  tootsBounceStickerTimer = 0;
  comboCalloutTimer = 0;
  comboCalloutKey = "";
  tootsFeverFlashTimer = 0;
  stateEl.textContent = "Hold to Shoot";
  resetCountdown = -1;
  updateChargeButtonState();
  updateHud();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getComboMultiplier(streak) {
  if (streak <= 0) return 1;
  return 2 ** streak;
}

function getComboTierForStreak(streak) {
  for (let i = 0; i < comboLadder.length; i++) {
    if (comboLadder[i].streak === streak) return comboLadder[i];
  }
  return null;
}

function triggerComboCallout(key) {
  comboCalloutKey = key;
  comboCalloutTimer = comboCalloutDurationFrames;
}

function chooseRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function createAudioElement(src) {
  const template = preloadedAudioTemplates.get(src);
  if (template) {
    return template.cloneNode(false);
  }
  const audio = new Audio(src);
  audio.preload = "auto";
  return audio;
}

function preloadOneAudioClip(src) {
  if (!src || preloadedAudioTemplates.has(src)) return;
  const audio = new Audio();
  audio.preload = "auto";
  audio.src = src;
  audio.load();
  preloadedAudioTemplates.set(src, audio);
}

function startAudioPreload() {
  if (audioPreloadStarted) return;
  audioPreloadStarted = true;

  let index = 0;
  function step() {
    if (index >= preloadableAudioSrcs.length) return;
    preloadOneAudioClip(preloadableAudioSrcs[index]);
    index += 1;
    setTimeout(step, 120);
  }

  step();
}

function playSfx(key, volume = 0.8) {
  if (muteAllAudio) return;
  const choices = sfx[key];
  if (!choices || choices.length === 0) return;
  let clipIndex = Math.floor(Math.random() * choices.length);
  if (choices.length > 1 && sfxLastChoiceByKey[key] === clipIndex) {
    clipIndex = (clipIndex + 1 + Math.floor(Math.random() * (choices.length - 1))) % choices.length;
  }
  sfxLastChoiceByKey[key] = clipIndex;
  const audio = createAudioElement(choices[clipIndex]);
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

function stopTootsFeverSfx() {
  if (!activeTootsFeverAudio) return;
  try {
    activeTootsFeverAudio.pause();
    activeTootsFeverAudio.currentTime = 0;
  } catch {}
  activeTootsFeverAudio = null;
}

function playTootsFeverSfx() {
  if (muteAllAudio) return;
  if (activeTootsFeverAudio && !activeTootsFeverAudio.paused) return;
  const audio = createAudioElement("sounds/tootsfever.mp3");
  audio.volume = 0.88;
  audio.addEventListener("ended", () => {
    if (activeTootsFeverAudio === audio) {
      activeTootsFeverAudio = null;
    }
  });
  activeTootsFeverAudio = audio;
  audio.play().catch(() => {
    if (activeTootsFeverAudio === audio) {
      activeTootsFeverAudio = null;
    }
  });
}

function playChargeSfx() {
  if (muteAllAudio) return;
  const key = muteChargeSfx ? "silence" : "charge";
  const volume = muteChargeSfx ? 0.16 : 0.10;
  const choices = sfx[key];
  if (!choices || choices.length === 0) return;
  stopChargeSfx();
  const audio = createAudioElement(chooseRandom(choices));
  audio.volume = clamp(volume, 0, 1);
  activeChargeAudio = audio;
  audio.play().catch(() => {});
}

function updateMuteButton() {
  if (!muteChargeBtn) return;
  muteChargeBtn.classList.toggle("is-muted", muteChargeSfx);
  muteChargeBtn.setAttribute("aria-pressed", muteChargeSfx ? "true" : "false");
}

function updateMuteAllButton() {
  if (!muteAllBtn) return;
  muteAllBtn.classList.toggle("is-muted", muteAllAudio);
  muteAllBtn.setAttribute("aria-pressed", muteAllAudio ? "true" : "false");
  const label = muteAllAudio ? "Sound muted" : "Sound on";
  muteAllBtn.setAttribute("aria-label", label);
  muteAllBtn.setAttribute("title", label);
}

function updateChargeButtonState() {
  if (!chargeBtn) return;
  chargeBtn.classList.toggle("is-charging", charging && gameStarted && !ball.inFlight);
}

function toggleMuteAllAudio() {
  muteAllAudio = !muteAllAudio;
  if (muteAllAudio) {
    stopChargeSfx();
    stopTootsFeverSfx();
  }
  updateMuteAllButton();
}

function updateFreeThrowModeButton() {
  if (!freeThrowModeBtn) return;
  freeThrowModeBtn.classList.toggle("is-active", freeThrowMode);
  freeThrowModeBtn.setAttribute("aria-pressed", freeThrowMode ? "true" : "false");
  freeThrowModeBtn.textContent = freeThrowMode ? "Free Throw: On" : "Free Throw: Off";
  if (startLevelEl) startLevelEl.disabled = !splashReady;
}

function sanitizeInitials(value) {
  return (value || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

function getInitialsFromSlots() {
  if (scoreInitialSlotEls.length !== 3) {
    return sanitizeInitials(scoreInitialsEl?.value || "");
  }
  return sanitizeInitials(scoreInitialSlotEls.map((slot) => slot.value || "").join(""));
}

function setInitialsSlots(value) {
  const clean = sanitizeInitials(value);
  if (scoreInitialsEl) scoreInitialsEl.value = clean;
  if (scoreInitialSlotEls.length !== 3) return;
  for (let i = 0; i < scoreInitialSlotEls.length; i++) {
    scoreInitialSlotEls[i].value = clean[i] || "";
  }
}

function getPendingScoreRank() {
  if (!pendingScoreForSubmission) return null;
  const mode = pendingScoreForSubmission.mode === "free_throw" ? "free_throw" : "normal";
  const pendingScore = Number(pendingScoreForSubmission.score) || 0;
  const modeScores = latestLeaderboardScores
    .filter((entry) => (entry?.mode === "free_throw" ? "free_throw" : "normal") === mode)
    .sort((a, b) => (Number(b?.score) || 0) - (Number(a?.score) || 0));
  let rank = 1;
  for (let i = 0; i < modeScores.length; i++) {
    if ((Number(modeScores[i]?.score) || 0) >= pendingScore) rank += 1;
    else break;
  }
  return rank;
}

function getRankTierClass(rank) {
  if (!rank || rank > leaderboardLimit) return "rank-out";
  if (rank === 1) return "rank-1";
  if (rank <= 5) return "rank-top5";
  return "rank-top10";
}

function getScoreRankForMode(target) {
  if (!target) return null;
  const targetMode = target.mode === "free_throw" ? "free_throw" : "normal";
  const targetScore = Number(target.score) || 0;
  const targetInitials = sanitizeInitials(target.initials || "");
  const targetLevel = Number(target.startLevel) || 1;
  const modeScores = latestLeaderboardScores
    .filter((entry) => (entry?.mode === "free_throw" ? "free_throw" : "normal") === targetMode)
    .sort((a, b) => (Number(b?.score) || 0) - (Number(a?.score) || 0));
  for (let i = 0; i < modeScores.length; i++) {
    const entry = modeScores[i];
    const entryInitials = sanitizeInitials(entry?.initials || "");
    const entryScore = Number(entry?.score) || 0;
    const entryLevel = Number(entry?.startLevel) || 1;
    if (entryScore !== targetScore) continue;
    if (entryInitials !== targetInitials) continue;
    if (targetMode === "free_throw" && entryLevel !== targetLevel) continue;
    return i + 1;
  }
  return null;
}

function setScoreSubmitStatus(message, tone = "info") {
  if (!scoreSubmitStatusEl) return;
  const normalizedTone = typeof tone === "boolean"
    ? (tone ? "error" : "info")
    : (tone || "info");
  if (!message) {
    scoreSubmitStatusEl.textContent = "";
    scoreSubmitStatusEl.classList.add("hidden");
    scoreSubmitStatusEl.classList.remove("error", "pending", "success");
    return;
  }
  scoreSubmitStatusEl.textContent = message;
  scoreSubmitStatusEl.classList.remove("hidden");
  scoreSubmitStatusEl.classList.toggle("error", normalizedTone === "error");
  scoreSubmitStatusEl.classList.toggle("pending", normalizedTone === "pending");
  scoreSubmitStatusEl.classList.toggle("success", normalizedTone === "success");
}

function renderLeaderboard(entries) {
  if (!leaderboardListEl) return;
  leaderboardListEl.innerHTML = "";
  const filteredEntries = (entries || []).filter((entry) => {
    const mode = entry?.mode === "free_throw" ? "free_throw" : "normal";
    return mode === leaderboardModeFilter;
  });
  if (filteredEntries.length === 0) {
    const li = document.createElement("li");
    li.classList.add("lb-empty");
    li.textContent = "No scores yet.";
    leaderboardListEl.appendChild(li);
    return;
  }

  for (let i = 0; i < filteredEntries.length && i < leaderboardLimit; i++) {
    const entry = filteredEntries[i];
    const li = document.createElement("li");
    const rank = i + 1;
    const score = Number(entry?.score) || 0;
    const initials = (entry?.initials || "???").toString().slice(0, 3).toUpperCase();
    const meta = leaderboardModeFilter === "free_throw" ? `LEVEL ${entry?.startLevel || 1}` : "";
    li.classList.add("lb-entry", `rank-${Math.min(rank, 10)}`);

    const rankEl = document.createElement("span");
    rankEl.className = "lb-rank";
    rankEl.textContent = `#${rank}`;

    const nameEl = document.createElement("span");
    nameEl.className = "lb-name";
    nameEl.textContent = initials;

    const scoreEl = document.createElement("span");
    scoreEl.className = "lb-score";
    scoreEl.textContent = score.toLocaleString("en-US");

    const metaEl = document.createElement("span");
    metaEl.className = "lb-meta";
    metaEl.textContent = meta;
    if (meta) li.classList.add("has-meta");
    if (newScoreSpotlight) {
      const spotlightMode = newScoreSpotlight.mode === "free_throw" ? "free_throw" : "normal";
      const spotlightInitials = sanitizeInitials(newScoreSpotlight.initials || "");
      const spotlightScore = Number(newScoreSpotlight.score) || 0;
      const spotlightLevel = Number(newScoreSpotlight.startLevel) || 1;
      const entryInitials = sanitizeInitials(entry?.initials || "");
      const entryScore = Number(entry?.score) || 0;
      const entryLevel = Number(entry?.startLevel) || 1;
      const isMatch = spotlightMode === leaderboardModeFilter
        && entryInitials === spotlightInitials
        && entryScore === spotlightScore
        && (spotlightMode !== "free_throw" || entryLevel === spotlightLevel);
      if (isMatch) {
        li.classList.add("is-new-score");
        li.setAttribute("aria-label", `New high score at rank ${rank}`);
        setTimeout(() => {
          li.classList.remove("is-new-score");
        }, 2100);
        newScoreSpotlight = null;
      }
    }

    li.appendChild(rankEl);
    li.appendChild(nameEl);
    li.appendChild(scoreEl);
    if (meta) li.appendChild(metaEl);
    leaderboardListEl.appendChild(li);
  }
}

function updateLeaderboardFilterUi() {
  if (leaderboardNormalBtnEl) {
    const active = leaderboardModeFilter === "normal";
    leaderboardNormalBtnEl.classList.toggle("is-active", active);
    leaderboardNormalBtnEl.setAttribute("aria-pressed", active ? "true" : "false");
  }
  if (leaderboardFreeThrowBtnEl) {
    const active = leaderboardModeFilter === "free_throw";
    leaderboardFreeThrowBtnEl.classList.toggle("is-active", active);
    leaderboardFreeThrowBtnEl.setAttribute("aria-pressed", active ? "true" : "false");
  }
  if (leaderboardTitleEl) {
    leaderboardTitleEl.textContent = leaderboardModeFilter === "free_throw"
      ? "Top Scores - Free Throw"
      : "Top Scores - Normal";
  }
}

async function getApiErrorMessage(response, fallback = "Request failed.") {
  try {
    const payload = await response.json();
    const detail = typeof payload?.error === "string" ? payload.error : "";
    return detail ? `${fallback} ${detail}` : fallback;
  } catch {
    return fallback;
  }
}

async function fetchLeaderboard() {
  if (leaderboardStatusEl) leaderboardStatusEl.textContent = "Loading...";
  try {
    const response = await fetch(`${getApiUrl("/api/scores")}?limit=${leaderboardLimit * 8}`, { cache: "no-store" });
    if (!response.ok) {
      const message = await getApiErrorMessage(response, `Leaderboard request failed (HTTP ${response.status}).`);
      throw new Error(message);
    }
    const payload = await response.json();
    const scores = Array.isArray(payload?.scores)
      ? payload.scores.slice().sort((a, b) => (Number(b?.score) || 0) - (Number(a?.score) || 0))
      : [];
    latestLeaderboardScores = scores.slice();
    renderLeaderboard(scores);
    updateScoreSubmissionUi();
    if (leaderboardStatusEl) leaderboardStatusEl.textContent = "";
  } catch (err) {
    latestLeaderboardScores = [];
    renderLeaderboard([]);
    updateScoreSubmissionUi();
    if (leaderboardStatusEl) {
      leaderboardStatusEl.textContent = err?.message || "Leaderboard unavailable.";
    }
  }
}

function updateScoreSubmissionUi() {
  if (!runSummaryEl || !scoreSubmitFormEl) return;
  scoreSubmitFormEl.classList.remove("rank-1", "rank-top5", "rank-top10", "rank-out");
  if (!pendingScoreForSubmission) {
    runSummaryEl.classList.add("hidden");
    scoreSubmitFormEl.classList.add("hidden");
    if (scoreSubmitHeadlineEl) scoreSubmitHeadlineEl.textContent = "New High Score";
    setInitialsSlots("");
    setScoreSubmitStatus("");
    return;
  }
  const modeLabel = pendingScoreForSubmission.mode === "free_throw"
    ? `Free Throw L${pendingScoreForSubmission.startLevel}`
    : "Normal";
  const rank = getPendingScoreRank();
  const rankTier = getRankTierClass(rank);
  scoreSubmitFormEl.classList.add(rankTier);
  const scoreLabel = Number(pendingScoreForSubmission.score || 0).toLocaleString("en-US");
  const rankLabel = !rank || rank > leaderboardLimit ? "OUTSIDE TOP 10" : `PROJECTED #${rank}`;
  runSummaryEl.textContent = `${rankLabel}  |  ${scoreLabel} PTS  |  ${modeLabel.toUpperCase()}`;
  if (scoreSubmitHeadlineEl) {
    scoreSubmitHeadlineEl.textContent = rank === 1
      ? "New Champion Score"
      : "New High Score";
  }
  setInitialsSlots(getInitialsFromSlots());
  runSummaryEl.classList.remove("hidden");
  scoreSubmitFormEl.classList.remove("hidden");
  if (submitScoreBtnEl) submitScoreBtnEl.textContent = "Lock It In";
  setScoreSubmitStatus("READY TO POST", "info");
  if (scoreInitialSlotEls[0] && !getInitialsFromSlots()) scoreInitialSlotEls[0].focus();
}

async function submitPendingScore(initials) {
  if (!pendingScoreForSubmission) return;
  const payload = {
    initials,
    score: pendingScoreForSubmission.score,
    mode: pendingScoreForSubmission.mode,
    startLevel: pendingScoreForSubmission.startLevel
  };
  if (submitScoreBtnEl) submitScoreBtnEl.disabled = true;
  if (submitScoreBtnEl) submitScoreBtnEl.textContent = "Transmitting...";
  setScoreSubmitStatus("TRANSMITTING...", "pending");
  try {
    const response = await fetch(getApiUrl("/api/scores"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const message = await getApiErrorMessage(response, `Could not post score (HTTP ${response.status}).`);
      throw new Error(message);
    }
    newScoreSpotlight = {
      initials: payload.initials,
      score: payload.score,
      mode: payload.mode,
      startLevel: payload.startLevel
    };
    leaderboardModeFilter = payload.mode === "free_throw" ? "free_throw" : "normal";
    updateLeaderboardFilterUi();
    pendingScoreForSubmission = null;
    setInitialsSlots("");
    if (submitScoreBtnEl) submitScoreBtnEl.textContent = "Lock It In";
    updateScoreSubmissionUi();
    await fetchLeaderboard();
    const postedRank = getScoreRankForMode(payload);
    if (postedRank && postedRank <= leaderboardLimit) {
      setScoreSubmitStatus(`SCORE LOCKED IN  |  NEW #${postedRank}`, "success");
    } else {
      setScoreSubmitStatus("SCORE LOCKED IN", "success");
    }
    newScoreSpotlight = null;
  } catch (err) {
    if (submitScoreBtnEl) submitScoreBtnEl.textContent = "Retry Post";
    setScoreSubmitStatus(err?.message || "LINK DOWN / RETRY", "error");
    newScoreSpotlight = null;
  } finally {
    if (submitScoreBtnEl) submitScoreBtnEl.disabled = false;
  }
}

function playUnmuteSequenceSfx() {
  if (muteAllAudio) return;
  const sequence = sfx.unmute;
  if (!sequence || sequence.length === 0) return;
  if (unmutePlayCount >= sequence.length) return;
  const clipIndex = unmutePlayCount;
  const audio = createAudioElement(sequence[clipIndex]);
  audio.volume = 0.84;
  audio.play().catch(() => {});
  if (clipIndex === 0) {
    gotTheIckArmed = true;
  }
  unmutePlayCount += 1;
}

function playMuteSequenceSfx() {
  if (muteAllAudio) return;
  const sequence = sfx.mute;
  if (!sequence || sequence.length === 0) return;
  const clipIndex = Math.min(muteActivationCount, sequence.length - 1);
  const audio = createAudioElement(sequence[clipIndex]);
  audio.volume = 0.84;
  audio.play().catch(() => {});
  muteActivationCount += 1;
}

function resetSessionRunState() {
  score = 0;
  comboStreak = 0;
  lastComboShown = 0;
  comboCalloutTimer = 0;
  comboCalloutKey = "";
  tootsFeverFlashTimer = 0;
  stopTootsFeverSfx();
  resetLevelTimer();
  gotTheIckArmed = false;
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
  updateChargeButtonState();
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
  touchedLaserThisShot = false;
  touchedAlienUfoThisShot = false;
  brickStampedThisShot = false;
  lastMadeShot = false;
  lastShotWasSwish = false;

  const { angle, speed } = getShotParams(charge);
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
  ball.spin = 0.23 + charge * 0.18;
  stateEl.textContent = "Ball in Flight";
  updateChargeButtonState();
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
  updateChargeButtonState();
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
  if (airballStampTimer > 0) {
    airballStampTimer -= 1;
  }
  if (swishStampTimer > 0) {
    swishStampTimer -= 1;
  }
  if (tootsBounceStickerTimer > 0) {
    tootsBounceStickerTimer -= 1;
  }
  if (comboCalloutTimer > 0) {
    comboCalloutTimer -= 1;
  }
  if (tootsFeverFlashTimer > 0) {
    tootsFeverFlashTimer -= 1;
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

function getAlienBaseUfoPose(now, index) {
  const ufo = alienBaseUfos[index];
  if (!ufo) return { x: 0, y: 0, scale: 0.8 };
  return {
    x: ufo.x + Math.sin(now * 0.0018 + ufo.wobblePhase) * 9,
    y: ufo.y + Math.cos(now * 0.0028 + ufo.wobblePhase * 1.3) * 5,
    scale: ufo.scale
  };
}

function getNextAlienLaserIntervalMs() {
  return alienLaserField.minIntervalMs + Math.random() * (alienLaserField.maxIntervalMs - alienLaserField.minIntervalMs);
}

function getNextAlienLaserPhraseTarget() {
  const min = alienLaserRhythm.shotsPerPhraseMin;
  const max = alienLaserRhythm.shotsPerPhraseMax;
  return min + Math.floor(Math.random() * (max - min + 1));
}

function getAlienLaserPhraseRestMs() {
  return alienLaserRhythm.restMinMs + Math.random() * (alienLaserRhythm.restMaxMs - alienLaserRhythm.restMinMs);
}

function resetAlienLasers(now = performance.now()) {
  alienLasers.length = 0;
  for (let i = 0; i < alienBaseUfos.length; i++) {
    alienBaseUfos[i].cooldown = 0;
  }
  alienLaserShotsInPhrase = 0;
  alienLaserPhraseTarget = getNextAlienLaserPhraseTarget();
  nextAlienLaserSpawnAt = now + getNextAlienLaserIntervalMs();
}

function spawnAlienLaser(now) {
  if (alienBaseUfos.length === 0) return;
  const ufoIndex = Math.floor(Math.random() * alienBaseUfos.length);
  const pose = getAlienBaseUfoPose(now, ufoIndex);
  const y = clamp(pose.y + (Math.random() - 0.5) * 10, floorY - 520, backboard.y - 12);
  alienLasers.push({
    x: pose.x - 26,
    y,
    length: alienLaserField.minLength + Math.random() * (alienLaserField.maxLength - alienLaserField.minLength),
    speed: alienLaserField.speed + Math.random() * 0.8,
    thickness: alienLaserField.thickness + Math.random() * 0.7,
    pulsePhase: Math.random() * Math.PI * 2,
    cooldown: 0
  });
}

function updateAlienLasers(now) {
  if (level !== 6) return;
  let guard = 0;
  while (now >= nextAlienLaserSpawnAt && guard < 32) {
    spawnAlienLaser(now);
    alienLaserShotsInPhrase += 1;
    nextAlienLaserSpawnAt += getNextAlienLaserIntervalMs();
    if (alienLaserShotsInPhrase >= alienLaserPhraseTarget) {
      nextAlienLaserSpawnAt += getAlienLaserPhraseRestMs();
      alienLaserShotsInPhrase = 0;
      alienLaserPhraseTarget = getNextAlienLaserPhraseTarget();
    }
    guard += 1;
  }
  for (let i = alienLasers.length - 1; i >= 0; i--) {
    const laser = alienLasers[i];
    laser.x -= laser.speed;
    if (laser.cooldown > 0) laser.cooldown -= 1;
    if (laser.x + laser.length < -36) {
      alienLasers.splice(i, 1);
    }
  }
}

function resolveAlienLaserCollision() {
  if (level !== 6) return false;
  for (let i = 0; i < alienLasers.length; i++) {
    const laser = alienLasers[i];
    if (laser.cooldown > 0) continue;
    const left = laser.x;
    const right = laser.x + laser.length;
    const hitY = Math.abs(ball.y - laser.y) <= ball.r + laser.thickness;
    const hitX = ball.x + ball.r > left && ball.x - ball.r < right;
    if (!hitX || !hitY) continue;

    const above = ball.y < laser.y;
    ball.y = above
      ? (laser.y - ball.r - laser.thickness - 0.2)
      : (laser.y + ball.r + laser.thickness + 0.2);
    ball.vy = above
      ? -Math.max(1.7, Math.abs(ball.vy) * 0.78)
      : Math.max(1.1, Math.abs(ball.vy) * 0.6);
    ball.vx -= 0.65 + Math.random() * 0.35;
    ball.spin += (above ? -1 : 1) * 0.05;
    playSfx("laser", 0.54);
    touchedLaserThisShot = true;
    laser.cooldown = 8;
    return true;
  }
  return false;
}

function resolveAlienUfoCollisions(now) {
  if (level !== 6) return false;
  for (let i = 0; i < alienBaseUfos.length; i++) {
    const ufo = alienBaseUfos[i];
    if (ufo.cooldown > 0) {
      ufo.cooldown -= 1;
      continue;
    }

    const pose = getAlienBaseUfoPose(now, i);
    const rx = 30 * pose.scale + ball.r;
    const ry = 12 * pose.scale + ball.r;
    const dx = ball.x - pose.x;
    const dy = ball.y - pose.y;
    const ellipseN = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    if (ellipseN > 1) continue;

    const safeN = Math.max(0.0001, ellipseN);
    const t = 1 / Math.sqrt(safeN);
    ball.x = pose.x + dx * t;
    ball.y = pose.y + dy * t;

    let nx = (ball.x - pose.x) / (rx * rx);
    let ny = (ball.y - pose.y) / (ry * ry);
    const nLen = Math.hypot(nx, ny);
    if (nLen > 0.0001) {
      nx /= nLen;
      ny /= nLen;
    } else {
      nx = dx >= 0 ? 1 : -1;
      ny = 0;
    }

    const dot = ball.vx * nx + ball.vy * ny;
    const bounce = 0.84;
    ball.vx -= (1 + bounce) * dot * nx;
    ball.vy -= (1 + bounce) * dot * ny;
    ball.vx -= 0.15;
    ball.vy -= 0.12;
    touchedAlienUfoThisShot = true;
    playSfx("laser", 0.46);
    ufo.cooldown = 8;
    return true;
  }
  return false;
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

function drawAlienLasers(now) {
  if (level !== 6) return;
  for (let i = 0; i < alienLasers.length; i++) {
    const laser = alienLasers[i];
    const left = laser.x;
    const right = laser.x + laser.length;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.02 + laser.pulsePhase);
    const glowAlpha = 0.2 + pulse * 0.26;
    const beamGrad = ctx.createLinearGradient(left, laser.y, right, laser.y);
    beamGrad.addColorStop(0, `rgba(255, 116, 90, ${0.72 + pulse * 0.2})`);
    beamGrad.addColorStop(0.38, `rgba(255, 225, 140, ${0.58 + pulse * 0.2})`);
    beamGrad.addColorStop(1, `rgba(255, 92, 148, ${0.8 + pulse * 0.16})`);

    ctx.strokeStyle = `rgba(255, 124, 110, ${glowAlpha})`;
    ctx.lineWidth = laser.thickness * 3.2;
    ctx.beginPath();
    ctx.moveTo(left, laser.y);
    ctx.lineTo(right, laser.y);
    ctx.stroke();

    ctx.strokeStyle = beamGrad;
    ctx.lineWidth = laser.thickness;
    ctx.beginPath();
    ctx.moveTo(left, laser.y);
    ctx.lineTo(right, laser.y);
    ctx.stroke();
  }
}

function drawAlienBaseUfos(now) {
  if (level !== 6) return;
  drawAlienLasers(now);
  for (let i = 0; i < alienBaseUfos.length; i++) {
    const pose = getAlienBaseUfoPose(now, i);
    const aura = ctx.createRadialGradient(pose.x - 8, pose.y + 2, 3, pose.x, pose.y + 2, 34 * pose.scale);
    aura.addColorStop(0, "rgba(136, 255, 210, 0.32)");
    aura.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(pose.x, pose.y + 2, 34 * pose.scale, 0, Math.PI * 2);
    ctx.fill();
    drawSpaceUfo(pose, pose.scale, 0.9);
  }
}

function triggerBrickStamp() {
  if (!brickStampedThisShot) {
    if (gotTheIckArmed) {
      playSfx("brickIck", 0.82);
      gotTheIckArmed = false;
    } else {
      playSfx("brickUnlocked", 0.74);
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
  if (!freeThrowMode) {
    levelTimeRemainingMs = Math.max(0, levelTimeRemainingMs - elapsed);
    if (levelTimeRemainingMs <= 0) {
      resetToSplash("timeout");
      return;
    }
  }

  updateEffects();
  updateGulls(now);
  updateHelicopter(now);
  updateBalloons(now);
  updateAlienLasers(now);
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
  } else if (level === 6) {
    resolveAlienUfoCollisions(now);
    resolveAlienLaserCollision();
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
        const touchedObstacleThisShot = touchedGullThisShot || touchedHeliThisShot || touchedBalloonThisShot || touchedLaserThisShot || touchedAlienUfoThisShot;
        const isAirball = !touchedRim && !touchedBackboard && !touchedObstacleThisShot;
        if (isAirball) {
          playSfx("airball", 0.82);
          airballStampTimer = 52;
        } else if (touchedRim && !brickStampedThisShot) {
          triggerBrickStamp();
        }
        comboStreak = 0;
        comboCalloutTimer = 0;
        comboCalloutKey = "";
        tootsFeverFlashTimer = 0;
        stopTootsFeverSfx();
        lastMadeShot = false;
        lastShotWasSwish = false;
        queueReset(isAirball ? "Airball" : "Brick");
        return;
      }
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
    const trickShot = touchedGullThisShot || touchedHeliThisShot || touchedBalloonThisShot || touchedLaserThisShot || touchedAlienUfoThisShot;
    ball.scoredOnThisShot = true;
    lastMadeShot = true;
    lastShotWasSwish = swish;
    comboStreak += 1;
    const comboTier = getComboTierForStreak(comboStreak);
    brickStampTimer = 0;
    brickStampedThisShot = false;
    netJiggle = 1;
    netJigglePhase = 0;
    playSfx("net", 0.78);
    if (swish && !comboTier) {
      playSfx("swish", 0.8);
      swishStampTimer = 52;
    }
    if (comboTier && trickShot) {
      playSfx("tootsBounce", 0.84);
      triggerComboCallout("tootsbounce");
      if (comboStreak === tootsFeverModeStreak) {
        tootsFeverFlashTimer = 96;
      }
    } else if (trickShot) {
      playSfx("tootsBounce", 0.84);
    }
    if (comboTier && !trickShot) {
      playSfx(comboTier.sfxKey, 0.84);
      triggerComboCallout(comboTier.key);
      if (comboStreak === tootsFeverModeStreak) {
        tootsFeverFlashTimer = 96;
      }
    } else if (!trickShot && comboStreak <= 1 && !swish) {
      playSfx("made", 0.75);
    }
    if (comboStreak >= tootsFeverModeStreak) {
      playTootsFeverSfx();
    } else {
      stopTootsFeverSfx();
    }
    spawnScoreEffects(hoop.x + hoop.rimGap * 0.5, hoop.y + 22, swish);
    if (trickShot) {
      spawnTrickShotEffects(hoop.x + hoop.rimGap * 0.5, hoop.y + 22);
      tootsBounceStickerTimer = 54;
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
    if (comboTier) {
      stateEl.textContent = `${comboTier.label} ${stateEl.textContent}`;
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
  const isAlienBase = level === 6;
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
  } else if (isAlienBase) {
    sky.addColorStop(0, "#07040d");
    sky.addColorStop(0.46, "#22123a");
    sky.addColorStop(1, "#3d2455");
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
  } else if (isAlienBase) {
    const moonX = W * 0.78;
    const moonY = 100;
    const moonGrad = ctx.createRadialGradient(moonX - 10, moonY - 10, 6, moonX, moonY, 46);
    moonGrad.addColorStop(0, "rgba(222, 255, 164, 0.96)");
    moonGrad.addColorStop(0.68, "rgba(152, 255, 154, 0.84)");
    moonGrad.addColorStop(1, "rgba(64, 164, 108, 0.84)");
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(180, 255, 194, 0.48)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(moonX, moonY, 52, 10, 0.18, 0, Math.PI * 2);
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

  if (!isSpace && !isAlienBase) {
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
  } else if (level === 6) {
    drawAlienBaseUfos(performance.now());
  } else {
    drawSkyPlane(performance.now());
  }

  if (!isSpace && !isAlienBase) {
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
  } else if (isAlienBase) {
    courtGrad.addColorStop(0, "#3c2650");
    courtGrad.addColorStop(0.55, "#301f43");
    courtGrad.addColorStop(1, "#241736");
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

  ctx.strokeStyle = isSunrise ? "#ffe6b3" : (isAfternoon ? "#f3fbff" : (isGolden ? "#ffe1a7" : (isSpace ? "#94e4ff" : (isAlienBase ? "#f2baff" : "#93f0ff"))));
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(W, floorY);
  ctx.stroke();

  const paint = isSunrise ? "#ffe8bf" : (isAfternoon ? "#f4fcff" : (isGolden ? "#ffe2b4" : (isSpace ? "#bee9ff" : (isAlienBase ? "#f3ccff" : "#b5f7ff"))));
  const paintShade = isSunrise
    ? "rgba(58, 35, 58, 0.28)"
    : (isAfternoon
      ? "rgba(17, 27, 44, 0.26)"
      : (isGolden ? "rgba(68, 41, 36, 0.26)" : (isSpace ? "rgba(8, 18, 48, 0.4)" : (isAlienBase ? "rgba(44, 20, 58, 0.4)" : "rgba(12, 18, 33, 0.35)"))));
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
  if (brickStampImage.complete && brickStampImage.naturalWidth > 0) {
    const pulse = 1 + Math.sin(performance.now() * 0.03) * 0.02;
    const width = 280 * pulse;
    const height = width * (brickStampImage.naturalHeight / brickStampImage.naturalWidth);
    ctx.save();
    ctx.globalAlpha = 0.96 * alpha;
    ctx.translate(W * 0.52, H * 0.36);
    ctx.rotate(-0.16);
    ctx.drawImage(brickStampImage, -width * 0.5, -height * 0.5, width, height);
    ctx.restore();
    return;
  }
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

function drawAirballStamp() {
  if (airballStampTimer <= 0) return;
  const life = airballStampTimer / 52;
  const fade = Math.min(1, airballStampTimer / 10) * Math.max(0, life);
  const pulse = 1 + Math.sin(performance.now() * 0.032) * 0.018;
  if (airballStampImage.complete && airballStampImage.naturalWidth > 0) {
    const width = 310 * pulse;
    const height = width * (airballStampImage.naturalHeight / airballStampImage.naturalWidth);
    ctx.save();
    ctx.globalAlpha = 0.97 * fade;
    ctx.translate(W * 0.5, H * 0.33);
    ctx.rotate(0.09);
    ctx.drawImage(airballStampImage, -width * 0.5, -height * 0.5, width, height);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(W * 0.5, H * 0.33);
  ctx.rotate(0.09);
  ctx.strokeStyle = `rgba(172, 230, 255, ${0.8 * fade})`;
  ctx.lineWidth = 5;
  ctx.strokeRect(-148, -48, 296, 96);
  ctx.fillStyle = `rgba(18, 46, 78, ${0.26 * fade})`;
  ctx.fillRect(-148, -48, 296, 96);
  ctx.font = "bold 52px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = `rgba(196, 236, 255, ${0.95 * fade})`;
  ctx.fillText("AIRBALL", 0, 2);
  ctx.restore();
}

function drawSwishStamp() {
  if (swishStampTimer <= 0) return;
  const life = swishStampTimer / 52;
  const fade = Math.min(1, swishStampTimer / 10) * Math.max(0, life);
  const pulse = 1 + Math.sin(performance.now() * 0.03) * 0.02;
  if (swishStampImage.complete && swishStampImage.naturalWidth > 0) {
    const width = 320 * pulse;
    const height = width * (swishStampImage.naturalHeight / swishStampImage.naturalWidth);
    ctx.save();
    ctx.globalAlpha = 0.97 * fade;
    ctx.translate(W * 0.5, H * 0.29);
    ctx.rotate(-0.05);
    ctx.drawImage(swishStampImage, -width * 0.5, -height * 0.5, width, height);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(W * 0.5, H * 0.29);
  ctx.rotate(-0.05);
  ctx.strokeStyle = `rgba(120, 245, 255, ${0.82 * fade})`;
  ctx.lineWidth = 5;
  ctx.strokeRect(-152, -50, 304, 100);
  ctx.fillStyle = `rgba(10, 57, 74, ${0.24 * fade})`;
  ctx.fillRect(-152, -50, 304, 100);
  ctx.font = "bold 54px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = `rgba(212, 250, 255, ${0.95 * fade})`;
  ctx.fillText("SWISH", 0, 2);
  ctx.restore();
}

function drawTootsBounceSticker() {
  if (tootsBounceStickerTimer <= 0) return;
  const life = tootsBounceStickerTimer / 54;
  const fade = Math.min(1, tootsBounceStickerTimer / 10) * Math.max(0, life);
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.05);
  const flash = 0.72 + pulse * 0.28;
  if (tootsBounceStickerImage.complete && tootsBounceStickerImage.naturalWidth > 0) {
    const width = 420 * (1 + pulse * 0.03);
    const height = width * (tootsBounceStickerImage.naturalHeight / tootsBounceStickerImage.naturalWidth);
    ctx.save();
    ctx.globalAlpha = 0.98 * fade;
    ctx.translate(W * 0.48, H * 0.25);
    ctx.rotate(-0.12);
    ctx.drawImage(tootsBounceStickerImage, -width * 0.5, -height * 0.5, width, height);
    ctx.restore();
    return;
  }

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
  ctx.fillText("TOOTS BOUNCE!", 0, -2);

  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = `rgba(24, 34, 72, ${0.9 * fade})`;
  ctx.strokeText("TOOTS BOUNCE!", 0, -2);
  ctx.restore();
}

function drawComboCallout() {
  if (comboCalloutTimer <= 0 || !comboCalloutKey) return;
  const life = comboCalloutTimer / comboCalloutDurationFrames;
  const fade = Math.min(1, comboCalloutTimer / 10) * Math.max(0, life);
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.05);
  const image = comboCalloutImages[comboCalloutKey];
  if (image && image.complete && image.naturalWidth > 0) {
    const width = 410 * (1 + pulse * 0.03);
    const height = width * (image.naturalHeight / image.naturalWidth);
    ctx.save();
    ctx.globalAlpha = 0.98 * fade;
    ctx.translate(W * 0.5, H * 0.2);
    ctx.rotate(-0.06);
    ctx.drawImage(image, -width * 0.5, -height * 0.5, width, height);
    ctx.restore();
    return;
  }

  const tier = comboLadder.find((entry) => entry.key === comboCalloutKey);
  if (!tier) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 56px 'Courier New', monospace";
  ctx.fillStyle = `rgba(255, 255, 255, ${0.94 * fade})`;
  ctx.strokeStyle = `rgba(18, 28, 56, ${0.9 * fade})`;
  ctx.lineWidth = 2;
  ctx.fillText(tier.label, W * 0.5, H * 0.2);
  ctx.strokeText(tier.label, W * 0.5, H * 0.2);
  ctx.restore();
}

function drawTootsFeverBorder() {
  const feverActive = comboStreak >= tootsFeverModeStreak;
  if (!feverActive && tootsFeverFlashTimer <= 0) return;
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.011);
  const flash = tootsFeverFlashTimer > 0 ? tootsFeverFlashTimer / 96 : 0;
  const base = feverActive ? 1 : flash;
  const alpha = 0.26 + base * 0.26 + pulse * 0.12 + flash * 0.24;

  ctx.save();
  ctx.shadowBlur = 18 + pulse * 16 + flash * 10;
  ctx.shadowColor = `rgba(255, 97, 22, ${0.45 + flash * 0.35})`;
  ctx.strokeStyle = `rgba(255, 188, 58, ${alpha})`;
  ctx.lineWidth = 7;
  ctx.strokeRect(6, 6, W - 12, H - 12);

  ctx.shadowBlur = 12 + pulse * 10;
  ctx.shadowColor = `rgba(255, 52, 20, ${0.4 + flash * 0.3})`;
  ctx.strokeStyle = `rgba(255, 97, 22, ${Math.min(0.95, alpha + 0.14)})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, W - 28, H - 28);
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
  drawAirballStamp();
  drawSwishStamp();
  drawTootsBounceSticker();
  drawComboCallout();
  drawCrtOverlay();
  drawTootsFeverBorder();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (e) => {
  startAudioPreload();
  if (e.code === "KeyM") {
    const target = e.target;
    const tagName = target && typeof target.tagName === "string" ? target.tagName.toUpperCase() : "";
    const isTypingTarget = tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || Boolean(target?.isContentEditable);
    if (!isTypingTarget) {
      e.preventDefault();
      toggleMuteAllAudio();
    }
    return;
  }

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
window.addEventListener("pointerdown", startAudioPreload, { once: true });
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
if (muteAllBtn) {
  muteAllBtn.addEventListener("click", () => {
    toggleMuteAllAudio();
  });
}
if (splashYearEl) {
  splashYearEl.textContent = String(new Date().getFullYear());
}
function startGame() {
  if (!splashReady || gameStarted) return;
  setScoreSubmitStatus("");
  resetSessionRunState();
  const selectedLevel = Number(startLevelEl?.value || "1");
  if (freeThrowMode) {
    level = selectedLevel === 6
      ? 6
      : (selectedLevel === 5
        ? 5
        : (selectedLevel === 4 ? 4 : (selectedLevel === 3 ? 3 : (selectedLevel === 2 ? 2 : 1))));
    score = 0;
  } else {
    level = selectedLevel === 6
      ? 6
      : (selectedLevel === 5
        ? 5
        : (selectedLevel === 4 ? 4 : (selectedLevel === 3 ? 3 : (selectedLevel === 2 ? 2 : 1))));
    score = level === 6
      ? level6ScoreThreshold
      : (level === 5
        ? level5ScoreThreshold
        : (level === 4
          ? level4ScoreThreshold
          : (level === 3 ? level3ScoreThreshold : (level === 2 ? level2ScoreThreshold : 0))));
    level = getLevelForScore(score);
  }
  if (level === 6) {
    resetAlienLasers();
  }
  resetLevelTimer();
  comboStreak = 0;
  lastComboShown = 0;
  const startChoices = sfx.start;
  if (!muteAllAudio && startChoices && startChoices.length > 0) {
    const clip = chooseRandom(startChoices);
    const audio = createAudioElement(clip);
    const isNumberedStartClip = /\/start\d+\.mp3$/i.test(clip) || /\\start\d+\.mp3$/i.test(clip);
    audio.volume = isNumberedStartClip ? 0.10 : 0.33;
    audio.play().catch(() => {});
  }
  nextPlaneStartAt = performance.now() + planeIntervalMs;
  skyPlane.active = false;
  gameStarted = true;
  if (splashEl) splashEl.classList.add("hidden");
  resetBall();
}

function resetToSplash(reason = "manual") {
  const completedRun = score > 0
    ? {
      score,
      mode: freeThrowMode ? "free_throw" : "normal",
      startLevel: Math.max(1, Math.min(6, level))
    }
    : null;
  const currentLevel = String(level);
  spaceHeld = false;
  stopChargeSfx();
  resetSessionRunState();
  gameStarted = false;
  if (splashEl) splashEl.classList.remove("hidden");
  if (startLevelEl) startLevelEl.value = currentLevel;
  updateFreeThrowModeButton();
  pendingScoreForSubmission = completedRun;
  updateScoreSubmissionUi();
  if (reason !== "startup") {
    fetchLeaderboard();
  }
  resetBall();
}

if (startBtn) {
  startBtn.addEventListener("click", startGame);
}
if (freeThrowModeBtn) {
  freeThrowModeBtn.addEventListener("click", () => {
    if (!splashReady) return;
    freeThrowMode = !freeThrowMode;
    updateFreeThrowModeButton();
  });
}
if (scoreInitialSlotEls.length === 3) {
  scoreInitialSlotEls.forEach((slot, index) => {
    slot.addEventListener("focus", () => {
      slot.select();
    });
    slot.addEventListener("input", () => {
      const clean = sanitizeInitials(slot.value);
      slot.value = clean ? clean[0] : "";
      const current = getInitialsFromSlots();
      if (scoreInitialsEl) scoreInitialsEl.value = current;
      if (slot.value && index < 2) scoreInitialSlotEls[index + 1].focus();
      if (submitScoreBtnEl) submitScoreBtnEl.textContent = "Lock It In";
      setScoreSubmitStatus("READY TO POST", "info");
    });
    slot.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !slot.value && index > 0) {
        scoreInitialSlotEls[index - 1].focus();
      }
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        scoreInitialSlotEls[index - 1].focus();
      }
      if (e.key === "ArrowRight" && index < 2) {
        e.preventDefault();
        scoreInitialSlotEls[index + 1].focus();
      }
    });
    slot.addEventListener("paste", (e) => {
      e.preventDefault();
      const raw = e.clipboardData?.getData("text") || "";
      const clean = sanitizeInitials(raw);
      setInitialsSlots(clean);
      if (clean.length < 3) scoreInitialSlotEls[Math.min(2, clean.length)].focus();
      else scoreInitialSlotEls[2].focus();
      if (submitScoreBtnEl) submitScoreBtnEl.textContent = "Lock It In";
      setScoreSubmitStatus("READY TO POST", "info");
    });
  });
}
if (scoreSubmitFormEl) {
  scoreSubmitFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!pendingScoreForSubmission) return;
    const initials = getInitialsFromSlots();
    if (initials.length !== 3) {
      setScoreSubmitStatus("ENTER EXACTLY 3 LETTERS", "error");
      return;
    }
    await submitPendingScore(initials);
  });
}
if (leaderboardNormalBtnEl) {
  leaderboardNormalBtnEl.addEventListener("click", () => {
    if (leaderboardModeFilter === "normal") return;
    leaderboardModeFilter = "normal";
    updateLeaderboardFilterUi();
    fetchLeaderboard();
  });
}
if (leaderboardFreeThrowBtnEl) {
  leaderboardFreeThrowBtnEl.addEventListener("click", () => {
    if (leaderboardModeFilter === "free_throw") return;
    leaderboardModeFilter = "free_throw";
    updateLeaderboardFilterUi();
    fetchLeaderboard();
  });
}
if (sessionResetBtn) {
  sessionResetBtn.addEventListener("click", resetToSplash);
}
if (chargeBtn) {
  const onChargePress = (e) => {
    if (e) e.preventDefault();
    beginCharge();
  };
  const onChargeRelease = (e) => {
    if (e) e.preventDefault();
    releaseShot();
  };

  chargeBtn.addEventListener("pointerdown", onChargePress);
  chargeBtn.addEventListener("pointerup", onChargeRelease);
  chargeBtn.addEventListener("pointercancel", onChargeRelease);
  chargeBtn.addEventListener("pointerleave", onChargeRelease);
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
    startAudioPreload();
    if (startBtn) startBtn.disabled = false;
    if (freeThrowModeBtn) freeThrowModeBtn.disabled = false;
    updateFreeThrowModeButton();
    updateLeaderboardFilterUi();
    updateScoreSubmissionUi();
    fetchLeaderboard();
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
updateMuteAllButton();
frame();
