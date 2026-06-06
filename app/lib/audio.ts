// Asset-free card "click" synthesized with the Web Audio API — no binary files to ship.

class AudioManager {
  private ctx: AudioContext | null = null;
  private sfxOn = true;

  private context(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setSfx(on: boolean) {
    this.sfxOn = on;
  }

  /** Short filtered noise burst — a card landing on the table. */
  playCard() {
    if (!this.sfxOn) {
      return;
    }
    const ctx = this.context();
    const duration = 0.09;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const decay = Math.pow(1 - i / data.length, 2.5);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1700;
    band.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.22;
    source.connect(band).connect(gain).connect(ctx.destination);
    source.start();
  }
}

export const audio = new AudioManager();
