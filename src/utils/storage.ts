import { DEFAULT_SETTINGS, type Settings } from '../types';

export const SAVE_KEY = 'pixel-chess.save.v1';
const SETTINGS_KEY = 'pixel-chess.settings.v1';
export function readSettings(): Settings {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
    const data = raw as Record<string, unknown>;
    return {
      sound: typeof data.sound === 'boolean' ? data.sound : DEFAULT_SETTINGS.sound,
      volume: typeof data.volume === 'number' && Number.isFinite(data.volume) ? Math.max(0, Math.min(1, data.volume)) : DEFAULT_SETTINGS.volume,
      animation: typeof data.animation === 'boolean' ? data.animation : DEFAULT_SETTINGS.animation,
      theme: data.theme === 'forest' || data.theme === 'lavender' ? data.theme : 'caramel',
      difficulty: data.difficulty === 'easy' || data.difficulty === 'hard' ? data.difficulty : 'medium',
      minutes: typeof data.minutes === 'number' && [0, 3, 5, 10, 15, 30].includes(data.minutes) ? data.minutes : 10,
    };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
export function writeSettings(settings: Settings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
export function hasSavedGame() { try { return Boolean(localStorage.getItem(SAVE_KEY)); } catch { return false; } }
