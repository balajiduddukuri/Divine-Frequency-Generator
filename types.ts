
export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export type ThemeId = 'classic' | 'neon' | 'zen' | 'celestial' | 'earth';

export interface Theme {
  id: ThemeId;
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  accent: string;
  glow: string;
}

export interface VisualizerSettings {
  particleSize: number;
  growthSpeed: number;
  density: number;
  opacity: number;
}

export interface MoodPreset {
  id: string;
  name: string;
  settings: VisualizerSettings;
}

export interface Frequency {
  id: string;
  hz: number;
  name: string;
  description: string;
  info: string;
  category: 'solfeggio' | 'chakra' | 'universal';
  color: string;
}

export interface ActiveTone {
  freqId: string;
  oscL: OscillatorNode;
  oscR: OscillatorNode;
  gain: GainNode;
  pannerL: StereoPannerNode;
  pannerR: StereoPannerNode;
}

export interface AppState {
  isPlaying: boolean;
  masterVolume: number;
  waveform: Waveform;
  activeFrequencies: string[];
  mode: 'single' | 'mix' | 'random';
  timer: number | null; // minutes
}

export interface ReflectionResponse {
  message: string;
  source?: string;
}

export interface JapaStats {
  totalMantras: number;
  totalRounds: number;
  dailyStreak: number;
  currentBead: number;
}

export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  url: string;
}
