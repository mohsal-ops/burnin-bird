// Synthesized new-order alert tone for the kitchen orders screen. Uses the Web
// Audio API directly (no MP3 asset to source/license) - the same technique real
// alert tones use. A branded sound file could later replace chime() with an
// <audio loop> without changing how startAlertLoop/stopAlertLoop are triggered.

let ctx: AudioContext | null = null;

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

export function getAudioContext(): AudioContext {
  if (!ctx) {
    const w = window as AudioWindow;
    const Ctor = w.AudioContext || w.webkitAudioContext!;
    ctx = new Ctor();
  }
  return ctx!;
}

// Call once, from a real click/tap, to satisfy the browser's autoplay gesture
// requirement for the rest of this page session. Plays a near-silent blip so the
// unlock is real (an actual scheduled sound), not just a state change.
export function unlockAudio() {
  const c = getAudioContext();
  if (c.state === "suspended") void c.resume();
  const osc = c.createOscillator();
  const gain = c.createGain();
  gain.gain.value = 0.001;
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.05);
}

// One two-tone chime. Short attack/decay envelope so it doesn't click/pop.
function chime() {
  const c = getAudioContext();
  if (c.state === "suspended") void c.resume();
  const now = c.currentTime;
  [880, 660].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
    gain.gain.linearRampToValueAtTime(0, start + 0.16);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.18);
  });
}

let loopId: ReturnType<typeof setInterval> | null = null;

// Repeats the chime until acknowledged, so nobody misses an order that came in
// while they were at the pass. Every ~1.5s (chime itself is ~0.36s).
export function startAlertLoop() {
  if (loopId) return;
  chime();
  loopId = setInterval(chime, 1500);
}

export function stopAlertLoop() {
  if (loopId) clearInterval(loopId);
  loopId = null;
}
