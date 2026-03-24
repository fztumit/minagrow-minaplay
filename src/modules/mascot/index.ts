const GUIDE_MESSAGES = {
  hint: 'Hadi dokun.',
  repeat: 'Bir daha söyle.',
  next: 'Şimdi buna dokun.'
} as const;

type MascotVariant = 'normal' | 'sleep';

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

  sayPraise(): void {
    this.pulse();
    this.setMessage(this.praiseFlip ? 'Harika.' : 'Aferin.');
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

  private speakPrompt(message: string): void {
    const runtime = window as Window & { __mascotPromptLog?: string[] };
    runtime.__mascotPromptLog = runtime.__mascotPromptLog ?? [];
    runtime.__mascotPromptLog.push(message);

    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.9;
    utterance.pitch = 1.04;
    utterance.volume = 0.82;

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
