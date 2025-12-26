
import { Theme, MoodPreset, Frequency } from './types';

export const APP_STORAGE_KEY = 'aura_tuner_japa_stats';

export const THEMES: Theme[] = [
  { id: 'neon', name: 'Cyber Spirit', primary: 'cyan-400', secondary: 'slate-300', bg: '#010410', accent: '#22d3ee', glow: 'rgba(34, 211, 238, 0.25)' },
  { id: 'light', name: 'Pure Light', primary: 'blue-600', secondary: 'slate-900', bg: '#ffffff', accent: '#2563eb', glow: 'rgba(37, 99, 235, 0.1)' },
  { id: 'dark', name: 'Eternal Night', primary: 'white', secondary: 'slate-100', bg: '#000000', accent: '#ffffff', glow: 'rgba(255, 255, 255, 0.2)' },
  { id: 'earth', name: 'Tulsi Earth', primary: 'emerald-500', secondary: 'stone-300', bg: '#080c05', accent: '#a3e635', glow: 'rgba(163, 230, 53, 0.2)' },
  { id: 'classic', name: 'Golden Vedic', primary: 'amber-500', secondary: 'amber-100', bg: '#080502', accent: '#fbbf24', glow: 'rgba(251, 191, 36, 0.25)' },
  { id: 'zen', name: 'Zazen', primary: 'emerald-400', secondary: 'stone-300', bg: '#040d0a', accent: '#34d399', glow: 'rgba(52, 211, 153, 0.2)' },
  { id: 'celestial', name: 'Cosmic', primary: 'indigo-400', secondary: 'slate-300', bg: '#02020a', accent: '#818cf8', glow: 'rgba(129, 140, 248, 0.25)' },
  { id: 'ruby', name: 'Royal Ruby', primary: 'rose-500', secondary: 'rose-100', bg: '#0d0205', accent: '#f43f5e', glow: 'rgba(244, 63, 94, 0.25)' },
];

export const MOOD_PRESETS: MoodPreset[] = [
  { id: 'zen', name: 'Deep Zen', settings: { particleSize: 0.8, growthSpeed: 0.5, density: 1.5, opacity: 0.6 } },
  { id: 'nirvana', name: 'Nirvana Burst', settings: { particleSize: 2.2, growthSpeed: 1.8, density: 0.6, opacity: 0.9 } },
  { id: 'gentle', name: 'Gentle Flow', settings: { particleSize: 0.5, growthSpeed: 0.8, density: 2.5, opacity: 0.4 } },
  { id: 'starlight', name: 'Starlight', settings: { particleSize: 0.3, growthSpeed: 3.0, density: 4.0, opacity: 0.8 } },
  { id: 'ethereal', name: 'Ethereal', settings: { particleSize: 1.5, growthSpeed: 0.3, density: 1.0, opacity: 0.3 } },
  { id: 'cosmic', name: 'Cosmic Pulse', settings: { particleSize: 1.8, growthSpeed: 1.5, density: 0.8, opacity: 0.9 } },
];

export const FREQUENCIES: Frequency[] = [
  { id: '174', hz: 174, name: 'Foundation', description: 'Pain relief & grounding.', info: 'The 174Hz frequency acts as a natural anesthetic, grounding energy and providing a sense of security to the body\'s internal systems.', category: 'solfeggio', color: '#6366f1' },
  { id: '285', hz: 285, name: 'Cognition', description: 'Restructures energy fields.', info: 'Helps return tissue to its original form. 285Hz influences energy fields to rejuvenate and heal internal organs.', category: 'solfeggio', color: '#0ea5e9' },
  { id: '396', hz: 396, name: 'Liberation', description: 'Clears guilt and fear.', info: 'Balances the Root Chakra. It helps in releasing feelings of guilt and fear, turning them into joy and liberation.', category: 'solfeggio', color: '#f43f5e' },
  { id: '417', hz: 417, name: 'Renewal', description: 'Facilitates change.', info: 'Clears traumatic experiences and destructive influences from the past, allowing for positive spiritual growth.', category: 'solfeggio', color: '#fb923c' },
  { id: '528', hz: 528, name: 'Transformation', description: 'Miracle DNA repair.', info: 'The "Love Frequency." Known for its ability to bring transformation and DNA repair into the listener\'s life.', category: 'solfeggio', color: '#2dd4bf' },
  { id: '639', hz: 639, name: 'Harmony', description: 'Harmonizes relationships.', info: 'Enhances interpersonal communication, understanding, tolerance, and love.', category: 'solfeggio', color: '#4ade80' },
  { id: '741', hz: 741, name: 'Expression', description: 'Cleansing & solving.', info: 'Leads to a healthier, simpler life by cleansing cells of toxins and promoting creative self-expression.', category: 'solfeggio', color: '#22d3ee' },
  { id: '852', hz: 852, name: 'Intuition', description: 'Awakening inner strength.', info: 'Used to return to spiritual order. It awakens intuition and inner clarity of vision.', category: 'solfeggio', color: '#818cf8' },
  { id: '963', hz: 963, name: 'Oneness', description: 'Divine connection.', info: 'The "Frequency of Pure Consciousness." Allows direct experience with the Divine Source.', category: 'solfeggio', color: '#a78bfa' },
];
