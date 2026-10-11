import type { Color } from 'chess.js';

export type GameMode = 'local' | 'ai';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Promotion = 'q' | 'r' | 'b' | 'n';
export interface Settings {
  sound: boolean;
  volume: number;
  animation: boolean;
  theme: 'caramel' | 'forest' | 'lavender';
  difficulty: Difficulty;
  minutes: number;
}
export interface Result {
  winner: Color | null;
  reason: string;
}
export const DEFAULT_SETTINGS: Settings = {
  sound: true, volume: 0.35, animation: true,
  theme: 'caramel', difficulty: 'medium', minutes: 10,
};
