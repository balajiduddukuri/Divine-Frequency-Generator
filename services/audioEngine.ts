
import { Waveform } from "../types";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeTones: Map<string, { osc: OscillatorNode; gain: GainNode; panner?: StereoPannerNode }> = new Map();

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
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(volume, this.ctx!.currentTime, 0.1);
    }
  }

  playTone(id: string, freq: number, type: Waveform = 'sine', pan: number = 0) {
    this.init();
    if (this.activeTones.has(id)) return;

    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    const panner = this.ctx!.createStereoPanner();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
    
    gain.gain.setValueAtTime(0, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.ctx!.currentTime + 0.5);

    panner.pan.setValueAtTime(pan, this.ctx!.currentTime);

    osc.connect(gain).connect(panner).connect(this.masterGain!);
    osc.start();

    this.activeTones.set(id, { osc, gain, panner });
  }

  stopTone(id: string) {
    const tone = this.activeTones.get(id);
    if (tone) {
      const now = this.ctx!.currentTime;
      tone.gain.gain.cancelScheduledValues(now);
      tone.gain.gain.setValueAtTime(tone.gain.gain.value, now);
      tone.gain.gain.linearRampToValueAtTime(0, now + 0.5);
      setTimeout(() => {
        tone.osc.stop();
        tone.osc.disconnect();
        this.activeTones.delete(id);
      }, 600);
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
