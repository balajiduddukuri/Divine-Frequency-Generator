
import { Theme, MoodPreset, Frequency } from './types';

export const APP_STORAGE_KEY = 'aura_tuner_japa_stats_v2';

export const THEMES: Theme[] = [
  { id: 'neon', name: 'Van Gogh Neon', primary: 'cyan-400', secondary: 'slate-200', bg: '#020617', accent: '#22d3ee', glow: 'rgba(34, 211, 238, 0.2)' },
  { id: 'light', name: 'High Contrast Day', primary: 'blue-700', secondary: 'slate-900', bg: '#ffffff', accent: '#1d4ed8', glow: 'rgba(29, 78, 216, 0.1)' },
  { id: 'dark', name: 'OLED Eternity', primary: 'white', secondary: 'slate-100', bg: '#000000', accent: '#f8fafc', glow: 'rgba(255, 255, 255, 0.15)' },
  { id: 'classic', name: 'Klimt Gold', primary: 'amber-500', secondary: 'amber-50', bg: '#0c0a09', accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.2)' },
  { id: 'zen', name: 'Monet Mist', primary: 'emerald-400', secondary: 'emerald-50', bg: '#022c22', accent: '#34d399', glow: 'rgba(52, 211, 153, 0.15)' },
  { id: 'ruby', name: 'Basquiat Red', primary: 'rose-500', secondary: 'rose-50', bg: '#450a0a', accent: '#ef4444', glow: 'rgba(239, 68, 68, 0.2)' },
];

export const MOOD_PRESETS: MoodPreset[] = [
  { id: 'zen', name: 'Deep Zen', settings: { particleSize: 1.2, growthSpeed: 0.4, density: 2.0, opacity: 0.6 } },
  { id: 'nirvana', name: 'Vibrant Pulse', settings: { particleSize: 2.5, growthSpeed: 1.5, density: 1.0, opacity: 0.8 } },
  { id: 'gentle', name: 'Soft Flow', settings: { particleSize: 0.6, growthSpeed: 0.8, density: 3.0, opacity: 0.4 } },
];

export const FREQUENCIES: Frequency[] = [
  { id: '174', hz: 174, name: 'Grounding Foundation', description: 'Pain relief & stabilization.', info: 'Reduces physical pain and stress.', category: 'solfeggio', color: '#6366f1' },
  { id: '285', hz: 285, name: 'Cognitive Repair', description: 'Healing internal organs.', info: 'Restructures energy fields and tissue.', category: 'solfeggio', color: '#0ea5e9' },
  { id: '396', hz: 396, name: 'Guilt Liberation', description: 'Clearing fear and guilt.', info: 'Balances the Root Chakra.', category: 'solfeggio', color: '#f43f5e' },
  { id: '417', hz: 417, name: 'Sacral Renewal', description: 'Facilitating positive change.', info: 'Clears traumatic energy.', category: 'solfeggio', color: '#fb923c' },
  { id: '528', hz: 528, name: 'Miracle Repair', description: 'The Love Frequency (DNA).', info: 'Brings transformation and miracles.', category: 'solfeggio', color: '#10b981' },
  { id: '639', hz: 639, name: 'Heart Harmony', description: 'Harmonizing relationships.', info: 'Enhances interpersonal understanding.', category: 'solfeggio', color: '#22c55e' },
  { id: '741', hz: 741, name: 'Spiritual Expression', description: 'Solving & cleansing.', info: 'Detoxifies and clarifies expression.', category: 'solfeggio', color: '#06b6d4' },
  { id: '852', hz: 852, name: 'Third Eye Awakening', description: 'Awakening intuition.', info: 'Returns to spiritual order.', category: 'solfeggio', color: '#818cf8' },
  { id: '963', hz: 963, name: 'Divine Oneness', description: 'Crown Connection.', info: 'Frequency of Pure Consciousness.', category: 'solfeggio', color: '#a78bfa' },
];
