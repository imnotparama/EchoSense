export class SoundSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.activeOscillators = [];
    this.masterCompressor = null;
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      // Master studio limiter/compressor to eliminate harsh digital clipping
      this.masterCompressor = this.audioCtx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-12, this.audioCtx.currentTime);
      this.masterCompressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(8, this.audioCtx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);
      this.masterCompressor.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAll();
    }
    return this.isMuted;
  }

  stopAll() {
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Ignored
      }
    });
    this.activeOscillators = [];
  }

  playHapticRumble(duration = 0.8) {
    if (this.isMuted) return;
    this.ensureContext();

    const now = this.audioCtx.currentTime;
    // 55 Hz fundamental frequency with 110 Hz harmonic simulating ERM coin vibration motor
    const subOsc = this.audioCtx.createOscillator();
    const harmOsc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(52, now);
    subOsc.frequency.linearRampToValueAtTime(58, now + 0.1);
    subOsc.frequency.linearRampToValueAtTime(54, now + duration);

    harmOsc.type = 'triangle';
    harmOsc.frequency.setValueAtTime(108, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.08); // spin-up
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // spin-down

    subOsc.connect(gain);
    harmOsc.connect(gain);
    gain.connect(this.masterCompressor);

    subOsc.start(now);
    harmOsc.start(now);
    subOsc.stop(now + duration);
    harmOsc.stop(now + duration);

    this.activeOscillators.push(subOsc, harmOsc);
  }

  playBuzzerBeep() {
    if (this.isMuted) return;
    this.ensureContext();

    // Active piezo buzzer 2.4 kHz resonant beep with subtle transient click
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(5.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterCompressor);

    osc.start(now);
    osc.stop(now + 0.12);
    this.activeOscillators.push(osc);
  }

  playAlert(type) {
    if (this.isMuted) return;
    this.ensureContext();
    this.stopAll();

    const now = this.audioCtx.currentTime;
    this.playHapticRumble(1.2);

    if (type === 'fire') {
      // Fire smoke detector: 3.1 kHz pulsed beeps (Temporal-3 pattern)
      const osc = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(3120, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3120, now);
      filter.Q.setValueAtTime(6.0, now);

      gain.gain.setValueAtTime(0, now);

      // 3 rapid pulses
      [0, 0.45, 0.9].forEach(offset => {
        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.setValueAtTime(0, now + offset + 0.3);
      });

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterCompressor);

      osc.start(now);
      osc.stop(now + 1.8);
      this.activeOscillators.push(osc);
      this.playBuzzerBeep();

    } else if (type === 'doorbell') {
      // Two-tone chime: 660 Hz (Ding) then 550 Hz (Dong) with tubular bell warmth
      const osc1 = this.audioCtx.createOscillator();
      const filter1 = this.audioCtx.createBiquadFilter();
      const gain1 = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // Note E5

      filter1.type = 'lowpass';
      filter1.frequency.setValueAtTime(2000, now);

      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(this.masterCompressor);
      osc1.start(now);
      osc1.stop(now + 0.7);

      const osc2 = this.audioCtx.createOscillator();
      const filter2 = this.audioCtx.createBiquadFilter();
      const gain2 = this.audioCtx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.35); // Note C5

      filter2.type = 'lowpass';
      filter2.frequency.setValueAtTime(1800, now + 0.35);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.18, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(this.masterCompressor);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.3);

      this.activeOscillators.push(osc1, osc2);
      this.playBuzzerBeep();

    } else if (type === 'baby') {
      // Baby cry: 450 Hz to 640 Hz modulated distress tone with vocal formant filter
      const osc = this.audioCtx.createOscillator();
      const formant = this.audioCtx.createBiquadFilter();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(1200, now);
      formant.Q.setValueAtTime(3.5, now);

      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(620, now + 0.3);
      osc.frequency.linearRampToValueAtTime(420, now + 0.6);
      osc.frequency.linearRampToValueAtTime(640, now + 0.9);
      osc.frequency.linearRampToValueAtTime(400, now + 1.3);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(formant);
      formant.connect(gain);
      gain.connect(this.masterCompressor);
      osc.start(now);
      osc.stop(now + 1.4);

      this.activeOscillators.push(osc);
      this.playBuzzerBeep();

    } else if (type === 'horn') {
      // Vehicle horn: Dual tone 400 Hz and 505 Hz dissonant blast with low-pass horn cabinet resonance
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(410, now);
      osc2.frequency.setValueAtTime(512, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterCompressor);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.1);
      osc2.stop(now + 1.1);

      this.activeOscillators.push(osc1, osc2);
      this.playBuzzerBeep();
    }
  }
}
