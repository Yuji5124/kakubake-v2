/* ===== KAKUBAKE ver.2 app.js ===== */
/* KAKUBAKEは「画面の中に住んでいる」——操作がなくても一人で生活している */

'use strict';

// ============================================================
// 状態定義
// ============================================================

const STATES = {
  IDLE:     'idle',      // 普段の待機。ふわふわ浮いている
  WANDER:   'wander',    // 画面内をそっと移動する
  PEEKING:  'peeking',   // 端からのぞく
  HIDING:   'hiding',    // 端に隠れる。少しだけ見える
  SLEEPING: 'sleeping',  // 寝ている。タッチしても必ず起きない
  TOUCHED:  'touched',   // タッチ反応。短時間
  ABSENT:   'absent',    // いなくなる。数秒後に戻る
};

// ============================================================
// 画像リスト
// PNG を assets/ に置くと自動的に切り替わる。
// 追加したい画像はここのリストに加えるだけ。
// HTMLやCSSを変更する必要はない。
// ============================================================

const STATE_IMAGES = {

  // ---- 待機・浮遊 ----
  // 追加予定: ghost_float.png, ghost_idle_eyes_closed.png
  [STATES.IDLE]: [
    'ghost_idle_stand.png',
  ],

  // ---- 画面内を移動中 ----
  // 追加予定: ghost_float.png, ghost_move_right.png, ghost_move_left.png
  [STATES.WANDER]: [
    'ghost_idle_stand.png',
  ],

  // ---- のぞく（PNG未追加 → CSSフォールバック表示） ----
  // 追加予定: ghost_peek_right_full.png, ghost_peek_right_surprised.png 等
  [STATES.PEEKING]: [
    'ghost_peek_right_full.png',
    'ghost_peek_right_surprised.png',
    'ghost_peek_shy_wave.png',
    'ghost_hide_top_peek.png',
    'ghost_hide_right_edge_smile.png',
    'ghost_hide_right_wink.png',
  ],

  // ---- 隠れる（PNG未追加 → CSSフォールバック表示） ----
  // 追加予定: ghost_hide_bottom_peek.png 等
  [STATES.HIDING]: [
    'ghost_hide_bottom_peek.png',
    'ghost_hide_left_bottom_peek.png',
    'ghost_hide_shy_pout.png',
    'ghost_hide_sleepy_curl.png',
  ],

  // ---- 左移動（ghost_move_left.png 追加後にリストへ追加） ----
  _MOVE_LEFT: [
    'ghost_look_left.png',
  ],

  // ---- 右移動（ghost_move_right.png 追加後にリストへ追加） ----
  _MOVE_RIGHT: [
    'ghost_look_right.png',
  ],

  // ---- 入眠フェーズ ----
  // 追加予定: ghost_drowsy.png, ghost_yawn.png
  _SLEEP_ENTER: [
    'ghost_sleepy.png',
  ],

  // ---- 深い睡眠 ----
  // 追加予定: ghost_doze.png, ghost_sleep_side.png, ghost_sleep_smile.png
  [STATES.SLEEPING]: [
    'ghost_sleep_zzz.png',
  ],

  // ---- タッチ反応 ----
  // 追加予定: ghost_pet_happy.png, ghost_smile.png
  [STATES.TOUCHED]: [
    'ghost_happy.png',
  ],

  // ---- 起床（PNG未追加 → CSSフォールバック表示） ----
  // 追加予定: ghost_rub_eyes.png, ghost_still_sleepy.png, ghost_wake_up.png
  _WAKE_UP: [
    'ghost_rub_eyes.png',
    'ghost_still_sleepy.png',
    'ghost_wake_up.png',
  ],

  // ---- 普段の目線変化（micro-behavior用） ----
  // 追加予定: ghost_idle_eyes_closed.png, ghost_smile.png
  _MICRO: [
    'ghost_look_right.png',
    'ghost_look_left.png',
    'ghost_happy.png',
  ],

  // absent は画像なし（非表示）
  [STATES.ABSENT]: [],
};

// ============================================================
// 挙動パラメーター
// ============================================================

// 状態遷移の重み
// idle と wander が多く「生活感」を出す。sleeping も十分ある。
const TRANSITION_WEIGHTS = [
  { state: STATES.IDLE,     weight: 32 },
  { state: STATES.WANDER,   weight: 18 },
  { state: STATES.PEEKING,  weight: 18 },
  { state: STATES.HIDING,   weight: 12 },
  { state: STATES.SLEEPING, weight: 12 },
  { state: STATES.ABSENT,   weight: 8  },
];

const PEEK_POSITIONS = ['right', 'left', 'top', 'bottom'];
const HIDE_POSITIONS = ['right', 'left', 'bottom'];

// メインサイクル間隔（ランダム）
const CYCLE_MIN = 6000;
const CYCLE_MAX = 16000;

// absent中の留守時間
const ABSENT_MIN = 3000;
const ABSENT_MAX = 8000;

// wander: 画面内の移動量上限（px）。screen 1280×720、ghost 320px から算出。
// safe range: (1280-320)/2=480px → ±200px, (720-320)/2=200px → ±120px
const WANDER_X_MAX = 200;
const WANDER_Y_MAX = 0;

// sleeping連続継続最大サイクル数
const SLEEP_MAX_CYCLES = 4;

// micro-behavior（idle中の細かい挙動）の間隔
const MICRO_MIN = 7000;
const MICRO_MAX = 15000;

// ---- 左右ドリフト ----
// idle/wander中にゴーストがゆっくり左右へ動く
const IDLE_DRIFT_X   = 160;  // idle時の最大左右移動量(px)
const WANDER_DRIFT_X = 240;  // wander時の最大左右移動量(px)
const WANDER_DRIFT_Y = 0;    // wander時の最大上下移動量(px)
const DRIFT_MIN = 3000;      // ドリフト間隔 min(ms)
const DRIFT_MAX = 8000;      // ドリフト間隔 max(ms)

const SFX_VOLUME = 0.27;
const MOVE_SFX_MIN_DELTA = 50;
const MOVE_SFX_COOLDOWN = 600;

const BGM_VOLUME = 0.042;
const BGM_LOOP_SECONDS = 180;
const BGM_BEATS_PER_LOOP = 256;
const BGM_STEPS_PER_BEAT = 2;
const BGM_STEPS_PER_LOOP = BGM_BEATS_PER_LOOP * BGM_STEPS_PER_BEAT;
const BGM_SECONDS_PER_STEP = BGM_LOOP_SECONDS / BGM_STEPS_PER_LOOP;
const BGM_LOOKAHEAD_MS = 180;
const BGM_SCHEDULE_AHEAD = 0.9;

const BGM_CHORDS = [
  ['C3', 'E4', 'G4', 'C5'],
  ['F3', 'A4', 'C5', 'F5'],
  ['G3', 'B4', 'D5', 'G5'],
  ['C3', 'G4', 'C5', 'E5'],
  ['A3', 'E4', 'A4', 'C5'],
  ['F3', 'A4', 'C5', 'F5'],
  ['D3', 'A4', 'D5', 'F5'],
  ['G3', 'B4', 'D5', 'G5'],
  ['C3', 'E4', 'G4', 'C5'],
  ['E3', 'G4', 'B4', 'E5'],
  ['F3', 'A4', 'C5', 'F5'],
  ['G3', 'B4', 'D5', 'G5'],
  ['A3', 'C5', 'E5', 'A5'],
  ['F3', 'C5', 'F5', 'A5'],
  ['G3', 'D5', 'G5', 'B5'],
  ['C3', 'E5', 'G5', 'C6'],
];

const BGM_MELODY = [
  ['C6', 'D6', 'E6', null, 'G6', 'E6', 'C6', null],
  ['F6', 'E6', 'D6', null, 'C6', 'D6', 'E6', null],
  ['G6', 'A6', 'G6', null, 'E6', 'D6', 'C6', null],
  ['E6', 'G6', 'C7', null, 'G6', 'E6', 'C6', null],
  ['A5', 'C6', 'E6', null, 'A6', 'G6', 'E6', null],
  ['F6', 'G6', 'A6', null, 'C7', 'A6', 'F6', null],
  ['D6', 'F6', 'A6', null, 'F6', 'E6', 'D6', null],
  ['G6', 'B6', 'D7', null, 'B6', 'G6', 'D6', null],
  ['C6', 'E6', 'G6', null, 'E6', 'G6', 'C7', null],
  ['B5', 'E6', 'G6', null, 'B6', 'G6', 'E6', null],
  ['A5', 'C6', 'F6', null, 'A6', 'F6', 'C6', null],
  ['G5', 'B5', 'D6', null, 'G6', 'B6', 'D7', null],
  ['A5', 'C6', 'E6', null, 'C7', 'A6', 'E6', null],
  ['F6', 'A6', 'C7', null, 'A6', 'F6', 'C6', null],
  ['G6', 'D7', 'B6', null, 'G6', 'E6', 'D6', null],
  ['C7', 'G6', 'E6', null, 'C6', 'E6', 'G6', null],
];

// ============================================================
// 状態変数
// ============================================================

let currentState    = STATES.IDLE;
let previousState   = STATES.IDLE;
let cycleTimer      = null;
let sleepCycles     = 0;
let isTouched       = false;
let microTimer      = null;
let driftTimer      = null;
let driftX          = 0;   // コンテナの現在X位置(px)
let driftY          = 0;   // コンテナの現在Y位置(px)
let lastGoodSrc     = '';  // 最後に成功したPNGのsrc（fallback防止に使う）
let audioCtx        = null;
let audioMaster     = null;
let bgmMaster       = null;
let bgmTimer        = null;
let bgmNextStep     = 0;
let bgmNextTime     = 0;
let audioUnlocked   = false;
let lastMoveSfxAt   = 0;

// ============================================================
// DOM
// ============================================================

const screen         = document.getElementById('screen');
const ghostContainer = document.getElementById('ghost-container');
const ghostImg       = document.getElementById('ghost-img');
const ghostFallback  = document.getElementById('ghost-fallback');
const debugBar       = document.getElementById('debug-bar');
const kakubakeBody   = document.body;

// ============================================================
// ユーティリティ
// ============================================================

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function noteToFrequency(note) {
  if (!note) return null;

  const noteIndex = {
    C: 0,
    'C#': 1,
    Db: 1,
    D: 2,
    'D#': 3,
    Eb: 3,
    E: 4,
    F: 5,
    'F#': 6,
    Gb: 6,
    G: 7,
    'G#': 8,
    Ab: 8,
    A: 9,
    'A#': 10,
    Bb: 10,
    B: 11,
  };
  const match = /^([A-G](?:#|b)?)(\d)$/.exec(note);
  if (!match) return null;

  const semitone = noteIndex[match[1]];
  const octave = Number(match[2]);
  const midi = (octave + 1) * 12 + semitone;

  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Sound effects are generated with Web Audio after the first user gesture.
function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
    audioMaster = audioCtx.createGain();
    audioMaster.gain.value = SFX_VOLUME;
    audioMaster.connect(audioCtx.destination);

    bgmMaster = audioCtx.createGain();
    bgmMaster.gain.value = 0.0001;
    bgmMaster.connect(audioCtx.destination);
  }

  return audioCtx;
}

function unlockAudio() {
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(false);

  const ready = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
  return ready
    .then(() => {
      audioUnlocked = true;
      startBgm();
      return true;
    })
    .catch(() => false);
}

function canPlaySfx() {
  return audioUnlocked && audioCtx && audioCtx.state === 'running' && audioMaster;
}

function playTone({
  type = 'sine',
  start = 0,
  duration = 0.18,
  frequency = 440,
  endFrequency = frequency,
  gain = 0.08,
  destination = audioMaster,
}) {
  if (!canPlaySfx()) return;

  const ctx = audioCtx;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, frequency), t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), t + duration);

  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t + 0.025);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(amp);
  amp.connect(destination);
  osc.start(t);
  osc.stop(t + duration + 0.04);
}

function playNoiseBurst({
  start = 0,
  duration = 0.16,
  gain = 0.045,
  filterFrequency = 1400,
  destination = audioMaster,
}) {
  if (!canPlaySfx()) return;

  const ctx = audioCtx;
  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < sampleCount; i++) {
    const fade = 1 - (i / sampleCount);
    data[i] = (Math.random() * 2 - 1) * fade;
  }

  const t = ctx.currentTime + start;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();

  src.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFrequency, t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(80, filterFrequency * 0.45), t + duration);

  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t + 0.018);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  src.connect(filter);
  filter.connect(amp);
  amp.connect(destination);
  src.start(t);
  src.stop(t + duration + 0.02);
}

function playMoveSfx(deltaX) {
  if (!canPlaySfx()) return;

  const now = performance.now();
  if (now - lastMoveSfxAt < MOVE_SFX_COOLDOWN) return;
  lastMoveSfxAt = now;

  const direction = deltaX >= 0 ? 1 : -1;
  const pan = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  const destination = pan || audioMaster;

  if (pan) {
    pan.pan.value = direction * 0.35;
    pan.connect(audioMaster);
  }

  playNoiseBurst({
    duration: 0.20,
    gain: 0.032,
    filterFrequency: 950,
    destination,
  });
  playTone({
    type: 'triangle',
    duration: 0.24,
    frequency: direction > 0 ? 220 : 320,
    endFrequency: direction > 0 ? 380 : 190,
    gain: 0.055,
    destination,
  });

  if (pan) {
    setTimeout(() => pan.disconnect(), 320);
  }
}

function playAppearSfx() {
  if (!canPlaySfx()) return;

  playNoiseBurst({
    duration: 0.18,
    gain: 0.035,
    filterFrequency: 1800,
  });
  playTone({
    type: 'sine',
    duration: 0.20,
    frequency: 520,
    endFrequency: 780,
    gain: 0.075,
  });
  playTone({
    type: 'triangle',
    start: 0.08,
    duration: 0.24,
    frequency: 780,
    endFrequency: 1180,
    gain: 0.052,
  });
  playTone({
    type: 'sine',
    start: 0.20,
    duration: 0.18,
    frequency: 1320,
    endFrequency: 980,
    gain: 0.035,
  });
}

function playTouchSfx() {
  if (!canPlaySfx()) return;

  playTone({
    type: 'triangle',
    duration: 0.12,
    frequency: 660,
    endFrequency: 880,
    gain: 0.065,
  });
  playTone({
    type: 'sine',
    start: 0.06,
    duration: 0.16,
    frequency: 990,
    endFrequency: 1320,
    gain: 0.05,
  });
  playNoiseBurst({
    start: 0.02,
    duration: 0.10,
    gain: 0.018,
    filterFrequency: 2600,
  });
}

function canPlayBgm() {
  return audioUnlocked && audioCtx && audioCtx.state === 'running' && bgmMaster;
}

function startBgm() {
  if (!canPlayBgm() || bgmTimer) return;

  const now = audioCtx.currentTime;
  bgmNextStep = 0;
  bgmNextTime = now + 0.08;

  bgmMaster.gain.cancelScheduledValues(now);
  bgmMaster.gain.setValueAtTime(0.0001, now);
  bgmMaster.gain.exponentialRampToValueAtTime(BGM_VOLUME, now + 2.5);

  scheduleBgm();
  bgmTimer = window.setInterval(scheduleBgm, BGM_LOOKAHEAD_MS);
}

function scheduleBgm() {
  if (!canPlayBgm()) return;

  const now = audioCtx.currentTime;
  if (bgmNextTime < now - BGM_SECONDS_PER_STEP) {
    const missedSteps = Math.floor((now - bgmNextTime) / BGM_SECONDS_PER_STEP);
    bgmNextStep = (bgmNextStep + missedSteps) % BGM_STEPS_PER_LOOP;
    bgmNextTime += missedSteps * BGM_SECONDS_PER_STEP;
  }

  while (bgmNextTime < now + BGM_SCHEDULE_AHEAD) {
    scheduleBgmStep(bgmNextStep, bgmNextTime);
    bgmNextStep = (bgmNextStep + 1) % BGM_STEPS_PER_LOOP;
    bgmNextTime += BGM_SECONDS_PER_STEP;
  }
}

function scheduleBgmStep(step, time) {
  const stepInLoop = step % BGM_STEPS_PER_LOOP;
  const stepInMeasure = stepInLoop % 8;
  const measure = Math.floor(stepInLoop / 8);
  const phraseMeasure = measure % BGM_MELODY.length;
  const phraseRound = Math.floor(measure / BGM_MELODY.length);
  const chord = BGM_CHORDS[phraseMeasure];
  const melodyNote = BGM_MELODY[phraseMeasure][stepInMeasure];

  if (stepInMeasure === 0) {
    playBgmBell(chord[0], time, BGM_SECONDS_PER_STEP * 3.7, 0.012, 'sine', false);
  } else if (stepInMeasure === 4) {
    playBgmBell(chord[2], time, BGM_SECONDS_PER_STEP * 2.2, 0.007, 'triangle', false);
  }

  if (stepInMeasure % 2 === 0) {
    const arpIndex = [1, 2, 3, 2][stepInMeasure / 2];
    playBgmBell(chord[arpIndex], time + 0.025, BGM_SECONDS_PER_STEP * 0.9, 0.010, 'triangle');
  }

  if (stepInMeasure === 2 || stepInMeasure === 6) {
    playBgmPop(time + 0.045, stepInMeasure === 6 ? 0.0065 : 0.0052);
  }

  if (melodyNote) {
    const accent = stepInMeasure === 0 || stepInMeasure === 4 ? 1.18 : 1;
    playBgmBell(melodyNote, time, BGM_SECONDS_PER_STEP * 0.95, 0.024 * accent, 'triangle');

    if (phraseRound % 2 === 1 && stepInMeasure === 6) {
      playBgmBell(melodyNote, time + BGM_SECONDS_PER_STEP * 0.5, BGM_SECONDS_PER_STEP * 0.7, 0.010, 'sine');
    }
  } else if (phraseRound % 2 === 1 && stepInMeasure === 3) {
    playBgmBell(chord[3], time, BGM_SECONDS_PER_STEP * 0.75, 0.012, 'sine');
  }
}

function playBgmPop(time, gain = 0.006) {
  if (!canPlayBgm()) return;

  const t = Math.max(time, audioCtx.currentTime + 0.001);
  const osc = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const amp = audioCtx.createGain();
  const duration = 0.13;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(280, t + duration);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, t);

  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(Math.max(0.0001, gain), t + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(filter);
  filter.connect(amp);
  amp.connect(bgmMaster);
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

function playBgmBell(note, time, duration, gain, type = 'triangle', sparkle = true) {
  const frequency = noteToFrequency(note);
  if (!frequency || !canPlayBgm()) return;

  playBgmOsc(frequency, time, duration, gain, type);

  if (sparkle) {
    playBgmOsc(frequency * 2.01, time + 0.006, duration * 0.55, gain * 0.28, 'sine');
  }
}

function playBgmOsc(frequency, time, duration, gain, type) {
  if (!canPlayBgm()) return;

  const t = Math.max(time, audioCtx.currentTime + 0.001);
  const osc = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const amp = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, t);

  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.linearRampToValueAtTime(Math.max(0.0001, gain), t + 0.018);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(filter);
  filter.connect(amp);
  amp.connect(bgmMaster);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

function setupAudioUnlock() {
  screen.addEventListener('pointerdown', unlockAudio, { once: true });
  screen.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  screen.addEventListener('keydown', unlockAudio, { once: true });
}

/** 重み付きランダムで次の状態を選ぶ。exclude は除外する状態 */
function pickNextState(exclude) {
  const pool = TRANSITION_WEIGHTS.filter(t => t.state !== exclude);
  const total = pool.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of pool) {
    r -= t.weight;
    if (r <= 0) return t.state;
  }
  return STATES.IDLE;
}

// ============================================================
// 画像管理
// PNG が存在すれば表示。存在しなければ CSS fallback に切替。
// 画像を追加した時はこのモジュールを変更するだけでよい。
// ============================================================

function setGhostImage(state) {
  const images = STATE_IMAGES[state];
  if (!images || images.length === 0) {
    showFallback();
    return;
  }
  loadImage(pickRandom(images));
}

function setGhostImageFromList(list) {
  const img = pickRandom(list);
  if (img) loadImage(img);
}

function loadImage(filename) {
  ghostImg.style.opacity = '0';
  ghostImg.src = `assets/${filename}`;
}

function crossfadeImage(filename) {
  ghostImg.style.opacity = '0';
  setTimeout(() => {
    ghostImg.src = `assets/${filename}`;
    // opacity は load イベントで 1 に戻る
  }, 320);
}

function showFallback() {
  ghostImg.style.display = 'none';
  ghostFallback.classList.add('active');
}

function hideFallback() {
  ghostFallback.classList.remove('active');
  ghostImg.style.display = 'block';
}

ghostImg.addEventListener('load', () => {
  hideFallback();
  ghostImg.style.opacity = '1';
  lastGoodSrc = ghostImg.src; // 成功したPNGを記憶
});

ghostImg.addEventListener('error', () => {
  if (lastGoodSrc) {
    // 前回成功したPNGに戻す → CSS fallbackゴーストを出さない
    ghostImg.src = lastGoodSrc;
  } else {
    // 一度もPNGが読めていない場合のみCSSフォールバック
    showFallback();
    ghostImg.style.opacity = '1';
  }
});

// ============================================================
// 状態クラス管理
// ============================================================

const ALL_STATE_CLASSES = [
  'state-idle', 'state-wander', 'state-peeking', 'state-hiding',
  'state-sleeping', 'state-touched', 'state-absent',
  'peek-right', 'peek-left', 'peek-top', 'peek-bottom',
  'hide-right', 'hide-left', 'hide-bottom',
  'absent-return',
];

function clearStateClasses() {
  ALL_STATE_CLASSES.forEach(c => kakubakeBody.classList.remove(c));
}

function applyStateClass(state, opts = {}) {
  clearStateClasses();
  kakubakeBody.classList.add(`state-${state}`);

  if (opts.position) {
    const prefix = state === STATES.PEEKING ? 'peek' : 'hide';
    kakubakeBody.classList.add(`${prefix}-${opts.position}`);
  }

  if (opts.absentReturn) {
    kakubakeBody.classList.add('absent-return');
  }
}

// ============================================================
// ゴーストコンテナの位置制御（wander 用）
// CSS の transition で滑らかに移動する
// ============================================================

function setContainerPosition(x, y) {
  driftX = x;
  driftY = y;
  ghostContainer.style.transform = `translate(${x}px, ${y}px)`;
}

function resetContainerPosition() {
  driftX = 0;
  driftY = 0;
  ghostContainer.style.transform = '';
}

// ============================================================
// 状態遷移
// ============================================================

function transitionTo(state, opts = {}) {
  const from = currentState;
  previousState = currentState;
  currentState  = state;

  stopMicroBehavior();
  stopDrift();

  // ---- コンテナ位置の管理 ----
  // peeking/hiding: クラスを先に適用(transition:none有効化)→即座にリセット
  // touched/sleeping/absent: ゆっくり中央へ戻す（CSS 2s transition）
  // idle: ドリフト位置を維持（リセットしない）
  // wander: startDrift(true)で即座に新位置へ移動
  const RESET_STATES = [STATES.TOUCHED, STATES.SLEEPING, STATES.ABSENT];

  if (state === STATES.PEEKING || state === STATES.HIDING) {
    applyStateClass(state, opts);
    driftX = 0; driftY = 0;
    ghostContainer.style.transform = '';
  } else {
    if (RESET_STATES.includes(state)) {
      driftX = 0; driftY = 0;
      ghostContainer.style.transform = '';
    }
    applyStateClass(state, opts);
  }

  // sleeping: 二段階で深く眠る
  if (state === STATES.SLEEPING) {
    setGhostImageFromList(STATE_IMAGES._SLEEP_ENTER);
    setTimeout(() => {
      if (currentState === STATES.SLEEPING) {
        setGhostImage(STATES.SLEEPING);
      }
    }, 2400);

  } else if (state !== STATES.ABSENT) {
    setGhostImage(state);
  }

  // idle/wander: micro-behavior と drift を開始
  if (state === STATES.IDLE || state === STATES.WANDER) {
    startMicroBehavior();
    startDrift(state === STATES.WANDER); // wander は即座に移動、idle は遅延
  }

  if (opts.absentReturn || (state === STATES.PEEKING && from !== STATES.PEEKING)) {
    playAppearSfx();
  }

  const imgName = ghostImg.src ? ghostImg.src.split('/').pop() : '(css fallback)';
  console.log(`[KAKUBAKE] ${from} → ${state}` +
    (opts.position ? ` [${opts.position}]` : '') +
    ` | ${imgName}`);

  updateDebug(state, opts);
}

// ============================================================
// メインサイクル
// ============================================================

function scheduleNextState() {
  clearTimeout(cycleTimer);

  // sleeping は最大 SLEEP_MAX_CYCLES サイクル継続
  if (currentState === STATES.SLEEPING) {
    sleepCycles++;
    if (sleepCycles >= SLEEP_MAX_CYCLES) {
      sleepCycles = 0;
      doTransitionCycle(STATES.IDLE);
      return;
    }
    const delay = randomBetween(CYCLE_MIN, CYCLE_MAX);
    cycleTimer = setTimeout(scheduleNextState, delay);
    return;
  }

  sleepCycles = 0;
  const delay = randomBetween(CYCLE_MIN, CYCLE_MAX);
  cycleTimer = setTimeout(() => doTransitionCycle(), delay);
}

function doTransitionCycle(forceState) {
  if (isTouched) return; // タッチ処理中は割り込まない

  const next = forceState || pickNextState(currentState);

  if (next === STATES.PEEKING) {
    transitionTo(STATES.PEEKING, { position: pickRandom(PEEK_POSITIONS) });

  } else if (next === STATES.HIDING) {
    transitionTo(STATES.HIDING, { position: pickRandom(HIDE_POSITIONS) });

  } else if (next === STATES.WANDER) {
    // drift が startDrift(true) で即座に新位置へ移動するので個別の setContainerPosition 不要
    transitionTo(STATES.WANDER);

  } else if (next === STATES.ABSENT) {
    transitionTo(STATES.ABSENT);
    // absent中は自動復帰タイマーのみ。サイクルは復帰後に再開。
    const returnDelay = randomBetween(ABSENT_MIN, ABSENT_MAX);
    setTimeout(returnFromAbsent, returnDelay);
    return;

  } else {
    transitionTo(next);
  }

  scheduleNextState();
}

function returnFromAbsent() {
  const next = pickNextState(STATES.ABSENT);
  const opts = { absentReturn: true };

  if (next === STATES.PEEKING) {
    opts.position = pickRandom(PEEK_POSITIONS);
  } else if (next === STATES.HIDING) {
    opts.position = pickRandom(HIDE_POSITIONS);
  } else if (next === STATES.WANDER) {
    // wander復帰は中央から始めて位置を決める
  }

  transitionTo(next, opts);

  // absent-return クラスはアニメ完了後に外す
  setTimeout(() => kakubakeBody.classList.remove('absent-return'), 1100);

  scheduleNextState();
}

// ============================================================
// Micro-behavior（idle/wander 中の細かい生活動作）
// 状態は変えず、画像だけ一時的に切り替える。
// 「見てない方向を見る」「目を閉じる」などで生きている感を出す。
// ============================================================

function startMicroBehavior() {
  clearTimeout(microTimer);
  scheduleMicro();
}

function stopMicroBehavior() {
  clearTimeout(microTimer);
}

function scheduleMicro() {
  const delay = randomBetween(MICRO_MIN, MICRO_MAX);
  microTimer = setTimeout(doMicroBehavior, delay);
}

function doMicroBehavior() {
  if (currentState !== STATES.IDLE && currentState !== STATES.WANDER) return;

  const filename = pickRandom(STATE_IMAGES._MICRO);
  if (!filename) { scheduleMicro(); return; }

  crossfadeImage(filename);

  // 1.5〜3.5秒後に元の状態画像に戻す
  const revertDelay = randomBetween(1500, 3500);
  setTimeout(() => {
    if (currentState === STATES.IDLE || currentState === STATES.WANDER) {
      setGhostImage(currentState);
      scheduleMicro(); // 次のmicro-behaviorをスケジュール
    }
  }, revertDelay);
}

// ============================================================
// ドリフト（idle/wander中の左右移動）
// ゴーストが「普段の生活動作」として画面内をふわっと移動する
// ============================================================

function startDrift(immediate) {
  clearTimeout(driftTimer);
  if (immediate) {
    doDrift();      // wander 入場時などに即座に動く
  } else {
    scheduleDrift(); // idle 時はしばらく静止してから動く
  }
}

function stopDrift() {
  clearTimeout(driftTimer);
}

function scheduleDrift() {
  const delay = randomBetween(DRIFT_MIN, DRIFT_MAX);
  driftTimer = setTimeout(doDrift, delay);
}

function doDrift() {
  if (currentState !== STATES.IDLE && currentState !== STATES.WANDER) return;

  const isWander = currentState === STATES.WANDER;
  const maxX = isWander ? WANDER_DRIFT_X : IDLE_DRIFT_X;
  const maxY = isWander ? WANDER_DRIFT_Y : 0;

  const prevX = driftX;
  const newX  = randomBetween(-maxX, maxX);
  const newY  = maxY > 0 ? randomBetween(-maxY, maxY) : 0;

  driftX = newX;
  driftY = newY;
  ghostContainer.style.transform = `translate(${newX}px, ${newY}px)`;

  // 移動量が大きい時だけ方向画像に切り替える
  const delta = newX - prevX;
  if (Math.abs(delta) > MOVE_SFX_MIN_DELTA) {
    playMoveSfx(delta);

    const list = delta > 0 ? STATE_IMAGES._MOVE_RIGHT : STATE_IMAGES._MOVE_LEFT;
    const filename = pickRandom(list);
    if (filename) {
      crossfadeImage(filename);
      // 移動が落ち着いたら元の状態画像に戻す
      setTimeout(() => {
        if (currentState === STATES.IDLE || currentState === STATES.WANDER) {
          setGhostImage(currentState);
        }
      }, 1800);
    }
  }

  console.log(`[KAKUBAKE] drift → (${newX}, ${newY})px`);
  scheduleDrift();
}

// ============================================================
// タッチ / クリック処理
// ============================================================

function handleTouch(e) {
  const audioReady = unlockAudio();
  e.preventDefault();

  if (currentState === STATES.ABSENT) return;

  // sleeping: 60%の確率でそのまま寝続ける
  if (currentState === STATES.SLEEPING) {
    if (Math.random() < 0.60) {
      console.log('[KAKUBAKE] zzz... (no response)');
      return;
    }
    // 起きた
    clearTimeout(cycleTimer);
    sleepCycles = 0;
    setGhostImageFromList(STATE_IMAGES._WAKE_UP);
    setTimeout(() => {
      transitionTo(STATES.IDLE);
      scheduleNextState();
    }, 1800);
    return;
  }

  if (isTouched) return; // 二重タッチ防止

  isTouched = true;
  clearTimeout(cycleTimer);
  stopMicroBehavior();

  transitionTo(STATES.TOUCHED);
  audioReady.then(() => playTouchSfx());

  setTimeout(() => {
    isTouched = false;
    transitionTo(STATES.IDLE);
    scheduleNextState();
  }, 2200);
}

screen.addEventListener('click',      handleTouch);
screen.addEventListener('touchstart', handleTouch, { passive: false });

// キーボードアクセシビリティ
screen.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') handleTouch(e);
});

// ============================================================
// デバッグ表示（極めて小さく。開発確認用）
// ============================================================

function updateDebug(state, opts = {}) {
  const pos = opts.position ? `/${opts.position}` : '';
  const t   = new Date().toLocaleTimeString('ja-JP', { hour12: false });
  debugBar.textContent = `${state}${pos} ${t}`;
}

// ============================================================
// 起動
// ============================================================

function init() {
  setupAudioUnlock();

  // CSSフォールバックは出さない。PNGが来るまで透明のまま待つ。
  ghostFallback.classList.remove('active');
  ghostImg.style.opacity = '0';
  ghostImg.style.display = 'block';

  // idle から開始
  transitionTo(STATES.IDLE);
  scheduleNextState();

  console.log('[KAKUBAKE] ver.2 started — living in the screen');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
