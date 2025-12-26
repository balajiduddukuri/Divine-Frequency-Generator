
import { Waveform } from "../types";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeTones: Map<string, { 
    oscL: OscillatorNode; 
    oscR: OscillatorNode; 
    gain: GainNode; 
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
      // Use setTargetAtTime for smooth master volume changes
      this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }
  }

  /**
   * Synthesizes a ritual Conch Shell (Śankha) sound.
   * Uses physical modeling: fundamental drone + breath noise + resonant filtering.
   */
  playShellSound() {
    this.init();
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const duration = 5;

    // Harmonic series for a resonant "hollow" tube sound
    const harmonics = [164.81, 329.63, 493.88, 659.25, 824.06]; 
    
    harmonics.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);
      // Signature pitch sweep of a conch blow
      osc.frequency.exponentialRampToValueAtTime(f * 1.04, now + 1.2);
      osc.frequency.exponentialRampToValueAtTime(f * 0.98, now + duration);

      filter.type = 'bandpass';
      filter.frequency.value = f;
      filter.Q.value = 15;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3 / (i + 1), now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter).connect(gain).connect(this.masterGain!);
      osc.start();
      osc.stop(now + duration);
    });

    // Simulated Air Turbulence (Breath)
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1200;
    noiseFilter.Q.value = 1;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 3);

    noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain!);
    noise.start();
  }

  playTone(id: string, freq: number, type: Waveform = 'sine', binaural: boolean = false) {
    this.init();
    // If it's already playing, we don't start a duplicate. 
    // If it's currently fading out (removed from map but still audible), 
    // we start a new one, which creates a rich overlap.
    if (this.activeTones.has(id)) return;

    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const fadeDuration = 1.2;

    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const pannerL = ctx.createStereoPanner();
    const pannerR = ctx.createStereoPanner();
    const gain = ctx.createGain();

    oscL.type = type;
    oscR.type = type;

    if (binaural) {
      // 7Hz difference for deep meditative entrainment
      oscL.frequency.setValueAtTime(freq - 3.5, now);
      oscR.frequency.setValueAtTime(freq + 3.5, now);
    } else {
      oscL.frequency.setValueAtTime(freq, now);
      oscR.frequency.setValueAtTime(freq, now);
    }

    pannerL.pan.setValueAtTime(-1, now);
    pannerR.pan.setValueAtTime(1, now);

    // Fade in: use exponential-like behavior with setTarget for natural curve
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.4, now + fadeDuration);

    oscL.connect(pannerL).connect(gain);
    oscR.connect(pannerR).connect(gain);
    gain.connect(this.masterGain!);

    oscL.start();
    oscR.start();

    this.activeTones.set(id, { oscL, oscR, gain, pannerL, pannerR });
  }

  stopTone(id: string) {
    const tone = this.activeTones.get(id);
    if (tone && this.ctx) {
      const now = this.ctx.currentTime;
      const fadeDuration = 1.2;

      // Remove from map immediately so that playTone can re-trigger if needed
      this.activeTones.delete(id);

      tone.gain.gain.cancelScheduledValues(now);
      tone.gain.gain.setValueAtTime(tone.gain.gain.value, now);
      // Exponential ramp to zero (near zero as log(0) is undefined)
      tone.gain.gain.exponentialRampToValueAtTime(0.001, now + fadeDuration);
      
      // Cleanup nodes after the fade duration
      setTimeout(() => {
        try {
          tone.oscL.stop();
          tone.oscR.stop();
          tone.oscL.disconnect();
          tone.oscR.disconnect();
          tone.gain.disconnect();
          tone.pannerL.disconnect();
          tone.pannerR.disconnect();
        } catch (e) {
          // Ignore errors if context was closed or nodes already disconnected
        }
      }, (fadeDuration + 0.1) * 1000);
    }
  }

  stopAll() {
    // Iterate over IDs and call stopTone for each
    const ids = Array.from(this.activeTones.keys());
    ids.forEach(id => this.stopTone(id));
  }
}

export const audioEngine = new AudioEngine();
