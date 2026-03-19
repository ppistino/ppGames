/* ══ ppPacSmile — Sound System (Web Audio API) ══ */
const SOUND_KEY = 'pacsmile_sound';
let audioCtx = null;
let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'off';

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, type, dur, vol = 0.18, delay = 0) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.01);
  } catch(e) {}
}

function playChord(notes, type, dur, vol = 0.12) {
  notes.forEach((f, i) => playTone(f, type, dur, vol, i * 0.04));
}

const SFX = {
  collect() {
    playTone(880, 'sine', 0.08, 0.15);
    playTone(1320, 'sine', 0.06, 0.1, 0.06);
  },
  deliver() {
    [523, 659, 784, 1047].forEach((f, i) => playTone(f, 'sine', 0.12, 0.15, i * 0.07));
  },
  eat() {
    [300, 200, 150].forEach((f, i) => playTone(f, 'sawtooth', 0.08, 0.12, i * 0.05));
  },
  hit() {
    playTone(120, 'sawtooth', 0.15, 0.25);
    playTone(80, 'square', 0.1, 0.2, 0.07);
  },
  powerup() {
    [440, 550, 660, 880].forEach((f, i) => playTone(f, 'sine', 0.1, 0.14, i * 0.06));
  },
  levelup() {
    const melody = [523, 659, 784, 1047, 1319];
    melody.forEach((f, i) => playTone(f, 'sine', 0.18, 0.18, i * 0.1));
  },
  gameover() {
    [400, 300, 250, 150].forEach((f, i) => playTone(f, 'sawtooth', 0.2, 0.2, i * 0.12));
  },
  shop() {
    playTone(660, 'sine', 0.08, 0.12);
    playTone(880, 'sine', 0.07, 0.1, 0.07);
  },
  coin() {
    playTone(1047, 'sine', 0.06, 0.12);
    playTone(1319, 'sine', 0.06, 0.1, 0.05);
  },
  shield() {
    playTone(440, 'triangle', 0.12, 0.15);
    playTone(660, 'triangle', 0.1, 0.12, 0.06);
  },
  dot() {
    playTone(800 + Math.random() * 200, 'sine', 0.03, 0.06);
  },
  move() {
    // Silent or very subtle
  },
  scared() {
    playTone(220, 'square', 0.06, 0.08);
    playTone(180, 'square', 0.05, 0.07, 0.06);
  },
  bomb() {
    [150, 100, 80].forEach((f, i) => playTone(f, 'sawtooth', 0.18, 0.28, i * 0.08));
    playTone(300, 'square', 0.1, 0.15, 0.1);
  },
  ice() {
    [880, 1047, 1319, 1568].forEach((f, i) => playTone(f, 'triangle', 0.08, 0.12, i * 0.04));
  },
  ads() {
    [440, 550, 660].forEach((f, i) => playTone(f, 'sine', 0.1, 0.12, i * 0.06));
    playTone(880, 'sine', 0.12, 0.15, 0.22);
  },
};

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_KEY, soundEnabled ? 'on' : 'off');
  return soundEnabled;
}
