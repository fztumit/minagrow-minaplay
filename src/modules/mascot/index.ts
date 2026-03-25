const GUIDE_MESSAGES = {
  play: 'Hadi oynayalım.',
  hint: 'Hadi dokun.',
  peek: 'Ceee!',
  repeat: 'Bir daha söyle.',
  next: 'Şimdi buna dokun.'
} as const;

type MascotVariant = 'normal' | 'sleep';
type SpeechPromptOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
};

export class MascotGuide {
  private readonly outputEl: HTMLElement;
  private readonly imageEl: HTMLImageElement | null;
  private readonly shellEl: HTMLElement | null;
  private praiseFlip = false;
  private activeTimeoutId: number | null = null;
  private guideAudioContext: AudioContext | null = null;
  private variant: MascotVariant = 'normal';

  constructor(outputEl: HTMLElement, imageEl: HTMLImageElement | null, shellEl: HTMLElement | null) {
    this.outputEl = outputEl;
    this.imageEl = imageEl;
    this.shellEl = shellEl;
  }

  sayHint(): void {
    this.pulse();
    this.setMessage(GUIDE_MESSAGES.hint);
  }

  sayPlayStart(): void {
    this.pulse();
    this.setMessage(GUIDE_MESSAGES.play);
    this.speakPrompt(GUIDE_MESSAGES.play, {
      rate: 0.9,
      pitch: 1.08,
      volume: 0.88
    });
  }

  sayPeekaboo(): void {
    this.pulse();
    this.setMessage(GUIDE_MESSAGES.peek);
    this.playGuideChime();
    this.speakPrompt(GUIDE_MESSAGES.peek, {
      rate: 0.96,
      pitch: 1.16,
      volume: 0.92
    });
  }

  sayPraise(): void {
    this.pulse();
    const message = this.praiseFlip ? 'Harika.' : 'Aferin.';
    this.setMessage(message);
    this.speakPrompt(message, {
      rate: 0.92,
      pitch: 1.08,
      volume: 0.86
    });
    this.primeGuideAudio();
    this.praiseFlip = !this.praiseFlip;
  }

  sayRepeat(): void {
    this.pulse();
    this.setMessage(GUIDE_MESSAGES.repeat);
  }

  sayNextPrompt(): void {
    this.pulse();
    this.setMessage(GUIDE_MESSAGES.next);
    this.playGuideChime();
    this.speakPrompt(GUIDE_MESSAGES.next);
  }

  sayAttention(message: string): void {
    this.pulse();
    this.setMessage(message);
    this.playAttentionChirp();
    this.speakPrompt(message, {
      rate: 0.84,
      pitch: 1.08,
      volume: 0.86
    });
  }

  setSleepMode(enabled: boolean): void {
    this.variant = enabled ? 'sleep' : 'normal';

    if (this.imageEl) {
      this.imageEl.src = enabled ? '/assets/phoenix-sleep.svg' : '/assets/phoenix-ui.svg';
    }

    if (this.shellEl) {
      this.shellEl.dataset.mascotVariant = this.variant;
      if (enabled) {
        this.shellEl.classList.remove('is-active');
      }
    }
  }

  setMessage(message: string): void {
    this.outputEl.textContent = message;
  }

  private pulse(): void {
    if (this.variant === 'sleep' || !this.shellEl) {
      return;
    }

    if (this.activeTimeoutId !== null) {
      window.clearTimeout(this.activeTimeoutId);
    }

    this.shellEl.classList.add('is-active');
    this.activeTimeoutId = window.setTimeout(() => {
      this.shellEl?.classList.remove('is-active');
      this.activeTimeoutId = null;
    }, 1200);
  }

  private speakPrompt(message: string, options: SpeechPromptOptions = {}): void {
    const runtime = window as Window & { __mascotPromptLog?: string[] };
    runtime.__mascotPromptLog = runtime.__mascotPromptLog ?? [];
    runtime.__mascotPromptLog.push(message);

    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'tr-TR';
    utterance.rate = options.rate ?? 0.9;
    utterance.pitch = options.pitch ?? 1.04;
    utterance.volume = options.volume ?? 0.82;

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech prompt errors and keep visual guidance active.
    }
  }

  private primeGuideAudio(): void {
    if (!('AudioContext' in window)) {
      return;
    }

    if (!this.guideAudioContext) {
      try {
        this.guideAudioContext = new AudioContext();
      } catch {
        return;
      }
    }

    void this.guideAudioContext.resume().catch(() => {
      // Ignore resume failures; prompt audio is optional.
    });
  }

  private playGuideChime(): void {
    const runtime = window as Window & { __mascotSoundLog?: string[] };
    runtime.__mascotSoundLog = runtime.__mascotSoundLog ?? [];
    runtime.__mascotSoundLog.push('guide-chime');

    if (this.variant === 'sleep') {
      return;
    }

    this.primeGuideAudio();
    const context = this.guideAudioContext;
    if (!context || context.state !== 'running') {
      return;
    }

    const start = context.currentTime + 0.01;
    const master = context.createGain();
    master.connect(context.destination);
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.26, start + 0.04);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 0.44);

    this.playGuideTone(context, master, start, 740, 0.18, 'triangle');
    this.playGuideTone(context, master, start + 0.11, 988, 0.2, 'sine');
  }

  private playAttentionChirp(): void {
    const runtime = window as Window & { __mascotSoundLog?: string[] };
    runtime.__mascotSoundLog = runtime.__mascotSoundLog ?? [];
    runtime.__mascotSoundLog.push('attention-chirp');

    if (this.variant === 'sleep') {
      return;
    }

    this.primeGuideAudio();
    const context = this.guideAudioContext;
    if (!context || context.state !== 'running') {
      return;
    }

    const start = context.currentTime + 0.01;
    const master = context.createGain();
    master.connect(context.destination);
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.2, start + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

    this.playGuideTone(context, master, start, 622, 0.14, 'triangle');
    this.playGuideTone(context, master, start + 0.09, 784, 0.14, 'sine');
    this.playGuideTone(context, master, start + 0.18, 932, 0.18, 'triangle');
  }

  private playGuideTone(
    context: AudioContext,
    destination: GainNode,
    start: number,
    frequency: number,
    duration: number,
    type: OscillatorType
  ): void {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(0.42, start + 0.025);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gainNode);
    gainNode.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
}
