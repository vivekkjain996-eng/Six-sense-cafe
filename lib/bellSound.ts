// A flat sine tone is the quietest-sounding waveform at any given amplitude —
// it has no harmonics for the ear to latch onto. This instead layers three
// triangle-wave partials (richer harmonic content than sine, so it reads as
// louder at the same peak level) through a shared compressor, which lets the
// individual oscillators run hot without the mix hard-clipping into a harsh
// crackle. Each partial still has a fast attack and exponential decay, like a
// real bell strike, rather than a constant-gain tone.
export function playBellStrike(ctx: AudioContext, volume = 1) {
  const now = ctx.currentTime;
  const duration = 1.1;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-30, now);
  compressor.knee.setValueAtTime(10, now);
  compressor.ratio.setValueAtTime(14, now);
  compressor.attack.setValueAtTime(0.002, now);
  compressor.release.setValueAtTime(0.3, now);

  // Compression trims the peaks to prevent clipping, which also lowers the
  // average level — a makeup gain stage after it reclaims that loudness
  // cleanly, rather than raising the oscillators' own gain into distortion.
  const makeupGain = ctx.createGain();
  makeupGain.gain.value = 1.8;
  compressor.connect(makeupGain);
  makeupGain.connect(ctx.destination);

  const partials: [frequency: number, relativeVolume: number][] = [
    [880, 1.8],
    [1320, 1.3],
    [1760, 0.9],
  ];

  for (const [frequency, relativeVolume] of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * relativeVolume), now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(compressor);
    osc.start(now);
    osc.stop(now + duration);
  }
}

// Three strikes in quick succession reads as more urgent/attention-grabbing
// than a single strike, and the extra repeats add to the total perceived
// loudness of the alert even though each strike peaks at the same level.
export function playBellChime(ctx: AudioContext, volume = 1) {
  [0, 260, 520].forEach((delay) => {
    setTimeout(() => {
      if (ctx.state !== "closed") playBellStrike(ctx, volume);
    }, delay);
  });
}
