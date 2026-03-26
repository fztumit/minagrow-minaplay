import { MascotGuide } from '../mascot/index.js';

type SleepSoundKind = 'ocean' | 'rain' | 'wind' | 'lullaby';

type Star = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  twinkle: number;
};

class SleepAudioEngine {
  private ctx: AudioContext | null = null;
  private cleanups: Array<() => void> = [];

  async start(kind: SleepSoundKind): Promise<void> {
    this.stop();

    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    switch (kind) {
      case 'rain':
        this.cleanups.push(this.playRain());
        break;
      case 'wind':
        this.cleanups.push(this.playWind());
        break;
      case 'ocean':
        this.cleanups.push(this.playOcean());
        break;
      case 'lullaby':
        this.cleanups.push(this.playLullaby());
        break;
      default:
        this.cleanups.push(this.playOcean());
    }
  }

  stop(): void {
    for (const cleanup of this.cleanups) {
      cleanup();
    }
    this.cleanups = [];
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  private playNoise(gainValue: number, color: 'white' | 'pink'): () => void {
    const ctx = this.ensureContext();
    const source = this.createNoiseSource(color);
    const gain = ctx.createGain();

    gain.gain.value = gainValue;
    source.connect(gain).connect(ctx.destination);
    source.start();

    return () => {
      try {
        source.stop();
      } catch {
        // no-op
      }
      source.disconnect();
      gain.disconnect();
    };
  }

  private playRain(): () => void {
    const ctx = this.ensureContext();
    const source = this.createNoiseSource('white');
    const highPass = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    highPass.type = 'highpass';
    highPass.frequency.value = 950;
    gain.gain.value = 0.12;

    source.connect(highPass).connect(gain).connect(ctx.destination);
    source.start();

    return () => {
      try {
        source.stop();
      } catch {
        // no-op
      }
      source.disconnect();
      highPass.disconnect();
      gain.disconnect();
    };
  }

  private playWind(): () => void {
    const ctx = this.ensureContext();
    const source = this.createNoiseSource('pink');
    const lowPass = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();

    lowPass.type = 'lowpass';
    lowPass.frequency.value = 560;
    gain.gain.value = 0.08;

    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    lfoDepth.gain.value = 0.05;

    lfo.connect(lfoDepth).connect(gain.gain);
    source.connect(lowPass).connect(gain).connect(ctx.destination);

    source.start();
    lfo.start();

    return () => {
      try {
        source.stop();
      } catch {
        // no-op
      }
      try {
        lfo.stop();
      } catch {
        // no-op
      }
      source.disconnect();
      lowPass.disconnect();
      gain.disconnect();
      lfo.disconnect();
      lfoDepth.disconnect();
    };
  }

  private playOcean(): () => void {
    const ctx = this.ensureContext();
    const source = this.createNoiseSource('pink');
    const bandPass = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();

    bandPass.type = 'bandpass';
    bandPass.frequency.value = 420;
    bandPass.Q.value = 0.65;

    gain.gain.value = 0.11;
    lfo.frequency.value = 0.22;
    lfoDepth.gain.value = 0.06;

    lfo.connect(lfoDepth).connect(gain.gain);
    source.connect(bandPass).connect(gain).connect(ctx.destination);

    source.start();
    lfo.start();

    return () => {
      try {
        source.stop();
      } catch {
        // no-op
      }
      try {
        lfo.stop();
      } catch {
        // no-op
      }
      source.disconnect();
      bandPass.disconnect();
      gain.disconnect();
      lfo.disconnect();
      lfoDepth.disconnect();
    };
  }

  private playVacuum(): () => void {
    const ctx = this.ensureContext();
    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    const noisy = this.createNoiseSource('pink');
    const noisyFilter = ctx.createBiquadFilter();
    const noisyGain = ctx.createGain();

    hum.type = 'sawtooth';
    hum.frequency.value = 95;
    humGain.gain.value = 0.06;

    noisyFilter.type = 'lowpass';
    noisyFilter.frequency.value = 300;
    noisyGain.gain.value = 0.07;

    hum.connect(humGain).connect(ctx.destination);
    noisy.connect(noisyFilter).connect(noisyGain).connect(ctx.destination);

    hum.start();
    noisy.start();

    return () => {
      try {
        hum.stop();
      } catch {
        // no-op
      }
      try {
        noisy.stop();
      } catch {
        // no-op
      }
      hum.disconnect();
      humGain.disconnect();
      noisy.disconnect();
      noisyFilter.disconnect();
      noisyGain.disconnect();
    };
  }

  private playHeartbeat(): () => void {
    const ctx = this.ensureContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 52;
    gain.gain.value = 0;

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();

    const scheduleBeat = () => {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      gain.gain.setValueAtTime(0, now + 0.35);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.39);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.56);
    };

    scheduleBeat();
    const intervalId = window.setInterval(scheduleBeat, 920);

    return () => {
      window.clearInterval(intervalId);
      try {
        oscillator.stop();
      } catch {
        // no-op
      }
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  private playLullaby(): () => void {
    const windCleanup = this.playWind();
    const hushCleanup = this.playNoise(0.035, 'pink');

    return () => {
      windCleanup();
      hushCleanup();
    };
  }

  private createNoiseSource(color: 'white' | 'pink'): AudioBufferSourceNode {
    const ctx = this.ensureContext();
    const bufferLength = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let pinkState = 0;
    for (let index = 0; index < bufferLength; index += 1) {
      const white = Math.random() * 2 - 1;
      if (color === 'pink') {
        pinkState = 0.985 * pinkState + 0.015 * white;
        data[index] = pinkState;
      } else {
        data[index] = white;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }
}

export class SleepModeModule {
  private readonly rootEl: HTMLElement;
  private readonly soundSelect: HTMLSelectElement;
  private readonly timerGroup: HTMLElement;
  private readonly toggleBtn: HTMLButtonElement;
  private readonly statusEl: HTMLElement;
  private readonly countdownEl: HTMLElement;
  private readonly starCanvas: HTMLCanvasElement;
  private readonly mascot: MascotGuide;

  private readonly audio = new SleepAudioEngine();
  private selectedDurationMs: number | null = 30 * 60 * 1000;
  private running = false;
  private endTimeMs: number | null = null;
  private countdownInterval: number | null = null;
  private stopTimeout: number | null = null;
  private stars: Star[] = [];
  private starLoopHandle = 0;

  constructor(rootEl: HTMLElement, mascot: MascotGuide, controlsRoot: ParentNode = rootEl) {
    const soundSelect = controlsRoot.querySelector<HTMLSelectElement>('#sleep-sound-select');
    const timerGroup = controlsRoot.querySelector<HTMLElement>('#sleep-timers');
    const toggleBtn = rootEl.querySelector<HTMLButtonElement>('#sleep-toggle');
    const statusEl = rootEl.querySelector<HTMLElement>('#sleep-status');
    const countdownEl = rootEl.querySelector<HTMLElement>('#sleep-countdown');
    const starCanvas = rootEl.querySelector<HTMLCanvasElement>('#sleep-stars');

    if (!soundSelect || !timerGroup || !toggleBtn || !statusEl || !countdownEl || !starCanvas) {
      throw new Error('Sleep module missing required elements.');
    }

    this.rootEl = rootEl;
    this.soundSelect = soundSelect;
    this.timerGroup = timerGroup;
    this.toggleBtn = toggleBtn;
    this.statusEl = statusEl;
    this.countdownEl = countdownEl;
    this.starCanvas = starCanvas;
    this.mascot = mascot;
  }

  init(): void {
    this.bindEvents();
    this.rootEl.setAttribute('data-running', 'false');
    this.soundSelect.value = 'ocean';
    this.resizeCanvas();
    this.seedStars();
    this.animateStars();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private bindEvents(): void {
    this.timerGroup.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('.timer-btn');
      if (!target) {
        return;
      }

      const { duration } = target.dataset;
      this.selectedDurationMs = duration === 'allnight' ? null : Number(duration ?? 0);

      this.timerGroup.querySelectorAll<HTMLButtonElement>('.timer-btn').forEach((button) => {
        button.classList.toggle('active', button === target);
      });

      this.countdownEl.textContent = this.selectedDurationMs === null ? 'Süre: Tüm gece' : '';
    });

    this.toggleBtn.addEventListener('click', async () => {
      if (this.running) {
        this.stop();
        this.statusEl.textContent = 'Durduruldu.';
        this.mascot.setMessage('Ses durdu.');
        return;
      }

      await this.start();
    });
  }

  private async start(): Promise<void> {
    const selectedSound = this.soundSelect.value as SleepSoundKind;
    await this.audio.start(selectedSound);

    this.running = true;
    this.rootEl.setAttribute('data-running', 'true');
    this.toggleBtn.textContent = 'Uyku Sesini Durdur';
    this.statusEl.textContent = `Çalıyor: ${this.soundSelect.selectedOptions[0].textContent ?? selectedSound}`;
    this.mascot.setMessage('Dinlenelim.');

    this.scheduleStop();
  }

  private stop(): void {
    this.audio.stop();
    this.running = false;
    this.endTimeMs = null;
    this.rootEl.setAttribute('data-running', 'false');

    if (this.stopTimeout !== null) {
      window.clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    if (this.countdownInterval !== null) {
      window.clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.toggleBtn.textContent = 'Uyku Sesini Başlat';
    this.countdownEl.textContent = '';
  }

  private scheduleStop(): void {
    if (this.countdownInterval !== null) {
      window.clearInterval(this.countdownInterval);
    }

    if (this.stopTimeout !== null) {
      window.clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    if (this.selectedDurationMs === null) {
      this.endTimeMs = null;
      this.countdownEl.textContent = 'Tüm gece açık kalacak.';
      return;
    }

    this.endTimeMs = Date.now() + this.selectedDurationMs;
    this.updateCountdown();

    this.countdownInterval = window.setInterval(() => {
      this.updateCountdown();
    }, 1000);

    this.stopTimeout = window.setTimeout(() => {
      this.stop();
      this.statusEl.textContent = 'Süre doldu, ses otomatik kapatıldı.';
      this.mascot.setMessage('Tatlı uykular.');
    }, this.selectedDurationMs);
  }

  private updateCountdown(): void {
    if (!this.endTimeMs) {
      return;
    }

    const remainingMs = Math.max(0, this.endTimeMs - Date.now());
    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [hours, minutes, seconds]
      .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, '0')))
      .join(':');

    this.countdownEl.textContent = `Kalan süre: ${parts}`;
  }

  private resizeCanvas(): void {
    const ratio = window.devicePixelRatio || 1;
    const width = this.starCanvas.clientWidth || 640;
    const height = this.starCanvas.clientHeight || 260;

    this.starCanvas.width = Math.floor(width * ratio);
    this.starCanvas.height = Math.floor(height * ratio);

    const context = this.starCanvas.getContext('2d');
    if (context) {
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
  }

  private seedStars(): void {
    const width = this.starCanvas.clientWidth || 640;
    const height = this.starCanvas.clientHeight || 260;
    this.stars = Array.from({ length: 64 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.7 + 0.4,
      speed: Math.random() * 0.15 + 0.03,
      twinkle: Math.random() * 0.8 + 0.2
    }));
  }

  private animateStars(): void {
    const context = this.starCanvas.getContext('2d');
    if (!context) {
      return;
    }

    const width = this.starCanvas.clientWidth || 640;
    const height = this.starCanvas.clientHeight || 260;

    context.clearRect(0, 0, width, height);

    const skyGradient = context.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#1f2c60');
    skyGradient.addColorStop(1, '#0f1633');
    context.fillStyle = skyGradient;
    context.fillRect(0, 0, width, height);

    this.stars.forEach((star) => {
      star.y += star.speed;
      if (star.y > height) {
        star.y = -2;
        star.x = Math.random() * width;
      }

      const blink = 0.45 + Math.abs(Math.sin((performance.now() / 1000) * star.twinkle));
      context.fillStyle = `rgba(255, 244, 220, ${blink})`;
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
    });

    this.starLoopHandle = window.requestAnimationFrame(() => this.animateStars());
  }

  destroy(): void {
    this.stop();
    window.cancelAnimationFrame(this.starLoopHandle);
  }
}
