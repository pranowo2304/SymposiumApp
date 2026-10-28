// Web Audio API chime generator for broadcast notifications
export const playBroadcastChime = (type: 'info' | 'warning' | 'urgent' | 'success' = 'info') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const createTone = (freq: number, startTime: number, duration: number, volume: number = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    if (type === 'urgent') {
      // Alert chime: triple tone
      createTone(660, now, 0.2, 0.2);
      createTone(660, now + 0.18, 0.2, 0.2);
      createTone(880, now + 0.36, 0.35, 0.25);
    } else if (type === 'warning') {
      // Warning chime: ascending major third
      createTone(587.33, now, 0.25, 0.18); // D5
      createTone(739.99, now + 0.18, 0.4, 0.2); // F#5
    } else if (type === 'success') {
      // Pleasant chime: chord
      createTone(523.25, now, 0.2, 0.15); // C5
      createTone(659.25, now + 0.12, 0.2, 0.18); // E5
      createTone(783.99, now + 0.24, 0.45, 0.2); // G5
    } else {
      // Standard gentle broadcast chime
      createTone(554.37, now, 0.22, 0.16); // C#5
      createTone(659.25, now + 0.14, 0.4, 0.2); // E5
    }
  } catch (err) {
    console.debug('Audio chime playback omitted or unsupported:', err);
  }
};
