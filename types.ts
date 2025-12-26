
export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface Frequency {
  id: string;
  hz: number;
  name: string;
  description: string;
  category: 'solfeggio' | 'chakra' | 'universal';
  color: string;
}

export interface ActiveTone {
  freqId: string;
  oscillator: OscillatorNode;
  gain: GainNode;
  panner?: StereoPannerNode;
}

export interface AppState {
  isPlaying: boolean;
  masterVolume: number;
  waveform: Waveform;
  activeFrequencies: string[];
  mode: 'single' | 'mix' | 'random';
  timer: number | null; // minutes
}

// Added missing interfaces for application data structures
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
