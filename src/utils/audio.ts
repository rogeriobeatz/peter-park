// Centralized Audio Utility for Peter Park
// Using Web Audio API to generate playful sounds for children

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playSuccessSound = () => {
  initAudio();
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;

  const playNote = (freq: number, start: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.1, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  };

  // Joyful arpeggio
  playNote(523.25, now); // C5
  playNote(659.25, now + 0.1); // E5
  playNote(783.99, now + 0.2); // G5
  playNote(1046.50, now + 0.3); // C6
};

export const playErrorSound = () => {
  initAudio();
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
  
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(now + 0.3);
};

export const playPopSound = (freqOverride?: number) => {
  initAudio();
  if (!audioCtx) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const freq = freqOverride || (400 + Math.random() * 200);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.1);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(now + 0.1);
};
