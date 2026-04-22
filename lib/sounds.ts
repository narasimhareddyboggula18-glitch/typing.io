// Sound engine using Web Audio API
class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private theme: 'mechanical' | 'soft' | 'click' = 'mechanical';
  private enabled: boolean = true;
  private volume: number = 0.4;

  private getCtx(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioCtx.destination);
    }
    return this.audioCtx;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainEnvelope?: { attack: number; decay: number; sustain: number; release: number; peak: number }
  ) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const env = gainEnvelope || { attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.1, peak: 0.8 };

      osc.connect(gainNode);
      gainNode.connect(this.masterGain!);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(env.peak, now + env.attack);
      gainNode.gain.linearRampToValueAtTime(env.sustain * env.peak, now + env.attack + env.decay);
      gainNode.gain.setValueAtTime(env.sustain * env.peak, now + duration - env.release);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // ignore audio errors
    }
  }

  private playNoise(duration: number, filterFreq: number, gainPeak: number = 0.3) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      filter.Q.value = 0.5;

      const gainNode = ctx.createGain();
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(gainPeak, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain!);
      source.start(now);
    } catch (e) {
      // ignore
    }
  }

  setTheme(theme: 'mechanical' | 'soft' | 'click') {
    this.theme = theme;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }

  playKeystroke() {
    switch (this.theme) {
      case 'mechanical':
        this.playNoise(0.08, 2000, 0.4);
        this.playTone(180, 0.05, 'square', { attack: 0.002, decay: 0.03, sustain: 0.1, release: 0.02, peak: 0.3 });
        break;
      case 'soft':
        this.playTone(440, 0.08, 'sine', { attack: 0.005, decay: 0.04, sustain: 0.1, release: 0.03, peak: 0.2 });
        break;
      case 'click':
        this.playNoise(0.04, 3000, 0.5);
        break;
    }
  }

  playCorrect() {
    switch (this.theme) {
      case 'mechanical':
        this.playNoise(0.06, 1800, 0.3);
        this.playTone(220, 0.06, 'square', { attack: 0.002, decay: 0.02, sustain: 0.1, release: 0.02, peak: 0.25 });
        break;
      case 'soft':
        this.playTone(523, 0.1, 'sine', { attack: 0.005, decay: 0.05, sustain: 0.15, release: 0.05, peak: 0.25 });
        break;
      case 'click':
        this.playNoise(0.035, 2500, 0.4);
        break;
    }
  }

  playError() {
    switch (this.theme) {
      case 'mechanical':
        this.playTone(120, 0.12, 'sawtooth', { attack: 0.005, decay: 0.06, sustain: 0.2, release: 0.05, peak: 0.4 });
        this.playNoise(0.1, 500, 0.3);
        break;
      case 'soft':
        this.playTone(220, 0.12, 'sine', { attack: 0.005, decay: 0.08, sustain: 0.1, release: 0.05, peak: 0.3 });
        break;
      case 'click':
        this.playTone(150, 0.1, 'square', { attack: 0.002, decay: 0.05, sustain: 0.1, release: 0.04, peak: 0.35 });
        break;
    }
  }

  playLevelComplete() {
    if (!this.enabled) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2, peak: 0.6 });
      }, i * 150);
    });
  }

  playLevelFail() {
    if (!this.enabled) return;
    const notes = [350, 280, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sawtooth', { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.15, peak: 0.4 });
      }, i * 200);
    });
  }

  playAchievement() {
    if (!this.enabled) return;
    const notes = [659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'sine', { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.3, peak: 0.7 });
      }, i * 100);
    });
  }

  playRaceStart() {
    if (!this.enabled) return;
    [200, 300, 400, 600].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'square', { attack: 0.005, decay: 0.05, sustain: 0.4, release: 0.1, peak: 0.5 });
      }, i * 300);
    });
  }
}

export const soundEngine = new SoundEngine();
