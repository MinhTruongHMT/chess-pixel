import type { Settings } from '../types';

type Sound = 'click' | 'move' | 'capture' | 'check' | 'promotion' | 'victory';
const NOTES: Record<Sound, number[]> = {
  click: [520], move: [440, 660], capture: [220, 330, 440], check: [740, 550, 740],
  promotion: [440, 554, 660, 880], victory: [523, 659, 784, 1047, 784, 1047],
};
let context: AudioContext | null = null;

/** Synthesized square waves; no audio downloads or autoplay. */
export function playSound(sound: Sound, settings: Settings) {
  if (!settings.sound || settings.volume <= 0) return;
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
    if (context.state !== 'running') return;
    const start = context.currentTime;
    NOTES[sound].forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      oscillator.type = 'square';
      oscillator.frequency.value = frequency;
      const at = start + index * 0.09;
      gain.gain.setValueAtTime(settings.volume * 0.1, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.085);
      oscillator.connect(gain); gain.connect(context!.destination);
      oscillator.start(at); oscillator.stop(at + 0.09);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  } catch { /* Audio is optional on browsers without Web Audio. */ }
}
