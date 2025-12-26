
import { Waveform } from "../types";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeTones: Map<string, { 
    oscL: OscillatorNode; 
    oscR: OscillatorNode; 
    gain: GainNode; 
    merger: ChannelMergerNode;
    pannerL: StereoPannerNode;
    pannerR: StereoPannerNode;
  }> = new Map();

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }
  }

  playTone(id: string, freq: number, type: Waveform = 'sine', binaural: boolean = false) {
    this.init();
    if (this.activeTones.has(id)) return;

    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Create Stereo Setup
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const pannerL = ctx.createStereoPanner();
    const pannerR = ctx.createStereoPanner();
    const gain = ctx.createGain();

    oscL.type = type;
    oscR.type = type;

    if (binaural) {
      // Binaural offset: Left -3Hz, Right +3Hz for Theta-range entrainment
      oscL.frequency.setValueAtTime(freq - 3, now);
      oscR.frequency.setValueAtTime(freq + 3, now);
    } else {
      oscL.frequency.setValueAtTime(freq, now);
      oscR.frequency.setValueAtTime(freq, now);
    }

    pannerL.pan.setValueAtTime(-1, now); // Hard Left
    pannerR.pan.setValueAtTime(1, now);  // Hard Right

    gain.gain.setValueAtTime(0, now);
    // Smooth fade in over 1.5 seconds
    gain.gain.linearRampToValueAtTime(0.5, now + 1.5);

    oscL.connect(pannerL).connect(gain);
    oscR.connect(pannerR).connect(gain);
    gain.connect(this.masterGain!);

    oscL.start();
    oscR.start();

    this.activeTones.set(id, { oscL, oscR, gain, merger: {} as any, pannerL, pannerR });
  }

  stopTone(id: string) {
    const tone = this.activeTones.get(id);
    if (tone && this.ctx) {
      const now = this.ctx.currentTime;
      // Precise fade out to avoid clicks
      tone.gain.gain.cancelScheduledValues(now);
      tone.gain.gain.setValueAtTime(tone.gain.gain.value, now);
      tone.gain.gain.linearRampToValueAtTime(0, now + 1.5);
      
      setTimeout(() => {
        try {
          tone.oscL.stop();
          tone.oscR.stop();
          tone.oscL.disconnect();
          tone.oscR.disconnect();
          tone.gain.disconnect();
        } catch (e) {
          // Handle cases where context is closed
        }
        this.activeTones.delete(id);
      }, 1600);
    }
  }

  stopAll() {
    Array.from(this.activeTones.keys()).forEach(id => this.stopTone(id));
  }

  isActive(id: string) {
    return this.activeTones.has(id);
  }
}

export const audioEngine = new AudioEngine();
