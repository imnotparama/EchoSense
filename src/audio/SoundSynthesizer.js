export class SoundSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.activeOscillators = [];
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
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

  playBuzzerBeep() {
    if (this.isMuted) return;
    this.ensureContext();

    // Active piezo buzzer 2.3 kHz beep
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(2300, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.12);
  }

  playAlert(type) {
    if (this.isMuted) return;
    this.ensureContext();
    this.stopAll();

    const now = this.audioCtx.currentTime;

    if (type === 'fire') {
      // Fire smoke detector: 3.1 kHz pulsed beeps (Temporal-3 pattern)
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(3120, now);

      gain.gain.setValueAtTime(0, now);

      // 3 rapid pulses
      [0, 0.5, 1.0].forEach(offset => {
        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.setValueAtTime(0, now + offset + 0.35);
      });

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 2.0);
      this.activeOscillators.push(osc);
      this.playBuzzerBeep();

    } else if (type === 'doorbell') {
      // Two-tone chime: 660 Hz (Ding) then 550 Hz (Dong)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(660, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(550, now + 0.4);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.18, now + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.4);
      osc2.stop(now + 1.2);

      this.activeOscillators.push(osc1, osc2);
      this.playBuzzerBeep();

    } else if (type === 'baby') {
      // Baby cry: 450 Hz to 620 Hz modulated distress tone
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';

      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(620, now + 0.3);
      osc.frequency.linearRampToValueAtTime(420, now + 0.6);
      osc.frequency.linearRampToValueAtTime(640, now + 0.9);
      osc.frequency.linearRampToValueAtTime(400, now + 1.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.4);

      this.activeOscillators.push(osc);
      this.playBuzzerBeep();

    } else if (type === 'horn') {
      // Vehicle horn: Dual tone 400 Hz and 500 Hz dissonant blast
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(400, now);
      osc2.frequency.setValueAtTime(505, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.1);
      osc2.stop(now + 1.1);

      this.activeOscillators.push(osc1, osc2);
      this.playBuzzerBeep();
    }
  }
}
