// Procedural Web Audio API Sound Synthesizer for Kurogane Tactical HUD & Pac-Man Arcade Engine
class TacticalAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._chompToggle = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.init();
      this.playPacmanChomp();
    }
    return this.enabled;
  }

  playBeep(freq = 440, duration = 0.06, type = 'sine', gainVal = 0.15) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  /* ==========================================================
     PAC-MAN ARCADE PROCEDURAL SOUNDS
     ========================================================== */

  // Authentic 8-bit "Waka-Waka" Dual-Tone Chomp
  playPacmanChomp() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Alternate between low and high tone of the classic waka-waka
      this._chompToggle = !this._chompToggle;
      const startFreq = this._chompToggle ? 260 : 490;
      const endFreq = this._chompToggle ? 490 : 260;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.07);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn("Chomp sound error:", e);
    }
  }

  // Fruit Pickup Bonus Chime (Cherry, Strawberry, Orange, Trophy)
  playFruitPickup() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [622.25, 783.99, 932.33, 1244.51]; // Eb5, G5, Bb5, Eb6
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.12, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.12);
      });
    } catch (e) {}
  }

  // 8-bit Ghost Eat / Power Munch Crunch
  playGhostEat() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // Power Pellet / Energizer Mode Siren Pulse
  playPowerPellet() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.1);
      osc.frequency.linearRampToValueAtTime(220, now + 0.2);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  // Stage Clear / Milestone Victory Arpeggio
  playStageClear() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const melody = [
        { f: 523.25, d: 0.08 }, // C5
        { f: 659.25, d: 0.08 }, // E5
        { f: 783.99, d: 0.08 }, // G5
        { f: 1046.50, d: 0.16 }, // C6
        { f: 783.99, d: 0.08 }, // G5
        { f: 1046.50, d: 0.25 }  // C6
      ];

      let t = now;
      melody.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0.13, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + note.d);
        t += note.d * 0.9;
      });
    } catch (e) {}
  }

  /* ==========================================================
     TACTICAL HUD UI SOUNDS
     ========================================================== */

  playKeystroke() {
    if (!this.enabled) return;
    this.playBeep(1200 + Math.random() * 400, 0.03, 'triangle', 0.08);
  }

  playSelect() {
    if (!this.enabled) return;
    this.playBeep(640, 0.05, 'square', 0.08);
    setTimeout(() => this.playBeep(960, 0.05, 'sine', 0.1), 30);
  }

  playExecute() {
    if (!this.enabled) return;
    this.playPacmanChomp();
  }

  playSuccess() {
    this.playFruitPickup();
  }

  playError() {
    if (!this.enabled) return;
    this.playBeep(180, 0.18, 'sawtooth', 0.2);
  }

  playScramble() {
    if (!this.enabled) return;
    this.playBeep(800 + Math.random() * 800, 0.02, 'square', 0.04);
  }
}

window.tacticalAudio = new TacticalAudioEngine();
