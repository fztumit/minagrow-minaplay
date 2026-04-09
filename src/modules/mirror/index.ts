type MirrorExercise = {
  id:
    | 'happy'
    | 'sad'
    | 'surprised'
    | 'sleepy'
    | 'kiss'
    | 'smile'
    | 'o-shape'
    | 'e-shape'
    | 'tongue-out'
    | 'tongue-left'
    | 'tongue-right'
    | 'tongue-up';
  label: string;
  instruction: string;
  category: 'yuz' | 'dudak' | 'dil';
  categoryLabel: string;
  rewardText: string;
};

const MIRROR_EXERCISES: MirrorExercise[] = [
  {
    id: 'happy',
    label: 'Mutlu yüz',
    instruction: 'Pofi gibi mutlu bir yüz yap.',
    category: 'yuz',
    categoryLabel: 'Yüz çalışması',
    rewardText: 'Harika gülümsedin.'
  },
  {
    id: 'sad',
    label: 'Üzgün yüz',
    instruction: 'Pofi gibi sakin bir üzgün yüz yap.',
    category: 'yuz',
    categoryLabel: 'Yüz çalışması',
    rewardText: 'Çok güzel denedin.'
  },
  {
    id: 'surprised',
    label: 'Şaşkın yüz',
    instruction: 'Kaşlarını kaldır ve şaşkın yüz yap.',
    category: 'yuz',
    categoryLabel: 'Yüz çalışması',
    rewardText: 'Pofi seni izliyor, süper.'
  },
  {
    id: 'sleepy',
    label: 'Uykulu yüz',
    instruction: 'Gözlerini yumuşat, uykulu yüz yap.',
    category: 'yuz',
    categoryLabel: 'Yüz çalışması',
    rewardText: 'Ne kadar sakin.'
  },
  {
    id: 'kiss',
    label: 'Öpücük dudak',
    instruction: 'Dudaklarını öpücük gibi öne uzat.',
    category: 'dudak',
    categoryLabel: 'Dudak çalışması',
    rewardText: 'Öpücük hareketi çok güzel.'
  },
  {
    id: 'smile',
    label: 'Geniş gülümse',
    instruction: 'Dudaklarını yana aç ve gülümse.',
    category: 'dudak',
    categoryLabel: 'Dudak çalışması',
    rewardText: 'Gülüşün harika.'
  },
  {
    id: 'o-shape',
    label: 'O şekli',
    instruction: 'Ağzınla yumuşak bir O şekli yap.',
    category: 'dudak',
    categoryLabel: 'Dudak çalışması',
    rewardText: 'O şekli çok net.'
  },
  {
    id: 'e-shape',
    label: 'E şekli',
    instruction: 'Ağzını yana aç ve E şekli yap.',
    category: 'dudak',
    categoryLabel: 'Dudak çalışması',
    rewardText: 'E şekli çok iyi.'
  },
  {
    id: 'tongue-out',
    label: 'Dil dışarı',
    instruction: 'Dilini yumuşakça dışarı çıkar.',
    category: 'dil',
    categoryLabel: 'Dil çalışması',
    rewardText: 'Dil hareketi harika.'
  },
  {
    id: 'tongue-left',
    label: 'Dil sola',
    instruction: 'Dilini sola doğru götür.',
    category: 'dil',
    categoryLabel: 'Dil çalışması',
    rewardText: 'Sola gidiş çok iyi.'
  },
  {
    id: 'tongue-right',
    label: 'Dil sağa',
    instruction: 'Dilini sağa doğru götür.',
    category: 'dil',
    categoryLabel: 'Dil çalışması',
    rewardText: 'Sağa gidiş çok güzel.'
  },
  {
    id: 'tongue-up',
    label: 'Dil yukarı',
    instruction: 'Dilini yukarı kaldır.',
    category: 'dil',
    categoryLabel: 'Dil çalışması',
    rewardText: 'Yukarı hareket tamam.'
  }
];

const MIRROR_CYCLE_MS = navigator.webdriver ? 1400 : 4000;
const MIRROR_REWARD_MS = navigator.webdriver ? 900 : 1600;

export class MirrorModeModule {
  private readonly rootEl: HTMLElement;
  private readonly videoEl: HTMLVideoElement;
  private readonly placeholderEl: HTMLElement;
  private readonly demoEl: HTMLElement;
  private readonly labelEl: HTMLElement;
  private readonly categoryEl: HTMLElement;
  private readonly instructionEl: HTMLElement;
  private readonly progressFillEl: HTMLElement;
  private readonly rewardEl: HTMLElement;
  private readonly rewardTextEl: HTMLElement;
  private readonly nextBtn: HTMLButtonElement;

  private stream: MediaStream | null = null;
  private exerciseIndex = 0;
  private cycleState: 'idle' | 'guiding' | 'reward' = 'idle';
  private cameraState: 'idle' | 'requesting' | 'ready' | 'fallback' | 'paused' = 'idle';
  private isActive = false;
  private advanceTimeoutId: number | null = null;
  private progressFrameId: number | null = null;
  private cycleStartedAt = 0;

  constructor(rootEl: HTMLElement) {
    const videoEl = rootEl.querySelector<HTMLVideoElement>('#mirror-video');
    const placeholderEl = rootEl.querySelector<HTMLElement>('#mirror-camera-placeholder');
    const demoEl = rootEl.querySelector<HTMLElement>('#mirror-pofi-demo');
    const labelEl = rootEl.querySelector<HTMLElement>('#mirror-exercise-label');
    const categoryEl = rootEl.querySelector<HTMLElement>('#mirror-exercise-category');
    const instructionEl = rootEl.querySelector<HTMLElement>('#mirror-instruction');
    const progressFillEl = rootEl.querySelector<HTMLElement>('#mirror-progress-fill');
    const rewardEl = rootEl.querySelector<HTMLElement>('#mirror-reward');
    const rewardTextEl = rootEl.querySelector<HTMLElement>('#mirror-reward-text');
    const nextBtn = rootEl.querySelector<HTMLButtonElement>('#mirror-next-btn');

    if (
      !videoEl ||
      !placeholderEl ||
      !demoEl ||
      !labelEl ||
      !categoryEl ||
      !instructionEl ||
      !progressFillEl ||
      !rewardEl ||
      !rewardTextEl ||
      !nextBtn
    ) {
      throw new Error('Mirror module requires video, demo, instruction, progress, reward, and next button.');
    }

    this.rootEl = rootEl;
    this.videoEl = videoEl;
    this.placeholderEl = placeholderEl;
    this.demoEl = demoEl;
    this.labelEl = labelEl;
    this.categoryEl = categoryEl;
    this.instructionEl = instructionEl;
    this.progressFillEl = progressFillEl;
    this.rewardEl = rewardEl;
    this.rewardTextEl = rewardTextEl;
    this.nextBtn = nextBtn;
  }

  init(): void {
    this.renderExercise();
    this.bindEvents();
    this.rootEl.setAttribute('data-current-exercise', this.getCurrentExercise().id);
    this.rootEl.setAttribute('data-current-category', this.getCurrentExercise().category);
    this.rootEl.setAttribute('data-camera-state', 'idle');
    this.rootEl.setAttribute('data-cycle-state', 'idle');
    this.rootEl.setAttribute('data-rewarding', 'false');
    this.rootEl.setAttribute('data-progress', '0');
    this.rootEl.setAttribute('data-last-reward', '');

    window.requestAnimationFrame(() => {
      if (document.body.getAttribute('data-active-view') === 'mirror') {
        this.resume();
      } else {
        this.pause();
      }
    });
  }

  private bindEvents(): void {
    this.rootEl.addEventListener('mirror-resume', () => {
      this.resume();
    });

    this.rootEl.addEventListener('mirror-pause', () => {
      this.pause();
    });

    this.nextBtn.addEventListener('click', () => {
      this.advanceExercise(true);
    });
  }

  private resume(): void {
    this.isActive = true;
    this.startCamera();
    this.startCycle();
  }

  private pause(): void {
    this.isActive = false;
    this.stopCycle();
    this.stopCamera();
    this.cycleState = 'idle';
    this.rootEl.setAttribute('data-cycle-state', 'idle');
    this.rootEl.setAttribute('data-progress', '0');
    this.rootEl.setAttribute('data-rewarding', 'false');
    this.cameraState = 'paused';
    this.rootEl.setAttribute('data-camera-state', 'paused');
  }

  private async startCamera(): Promise<void> {
    if (this.cameraState === 'requesting' || this.cameraState === 'ready') {
      return;
    }

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      this.setCameraFallback('Kamera açılamadı. Pofi’ye bakıp sen de yapabilirsin.');
      return;
    }

    this.cameraState = 'requesting';
    this.rootEl.setAttribute('data-camera-state', 'requesting');
    this.placeholderEl.textContent = 'Ayna açılıyor...';
    this.placeholderEl.classList.remove('is-hidden');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 960 }
        }
      });
    } catch {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      } catch {
        this.setCameraFallback('Kamera izni verilmedi. Pofi’ye bakıp yine deneyebilirsin.');
        return;
      }
    }

    this.videoEl.srcObject = this.stream;
    void this.videoEl.play().catch(() => {
      // Mirror view can continue without autoplay.
    });
    this.cameraState = 'ready';
    this.rootEl.setAttribute('data-camera-state', 'ready');
    this.placeholderEl.classList.add('is-hidden');
  }

  private stopCamera(): void {
    this.videoEl.pause();
    const currentStream = this.videoEl.srcObject as MediaStream | null;
    currentStream?.getTracks().forEach((track) => track.stop());
    this.stream?.getTracks().forEach((track) => track.stop());
    this.videoEl.srcObject = null;
    this.stream = null;
  }

  private startCycle(): void {
    this.stopCycle();
    this.renderExercise();
    this.cycleState = 'guiding';
    this.rootEl.setAttribute('data-cycle-state', 'guiding');
    this.rootEl.setAttribute('data-rewarding', 'false');
    this.cycleStartedAt = performance.now();
    this.speakInstruction(this.getCurrentExercise().instruction);

    const updateProgress = (timestamp: number) => {
      if (!this.isActive || this.cycleState !== 'guiding') {
        return;
      }

      const elapsed = timestamp - this.cycleStartedAt;
      const ratio = Math.max(0, Math.min(1, elapsed / MIRROR_CYCLE_MS));
      this.progressFillEl.style.setProperty('--mirror-progress-ratio', String(ratio));
      this.rootEl.setAttribute('data-progress', String(Math.round(ratio * 100)));

      if (ratio >= 1) {
        this.triggerReward();
        return;
      }

      this.progressFrameId = window.requestAnimationFrame(updateProgress);
    };

    this.progressFrameId = window.requestAnimationFrame(updateProgress);
  }

  private stopCycle(): void {
    if (this.progressFrameId !== null) {
      window.cancelAnimationFrame(this.progressFrameId);
      this.progressFrameId = null;
    }

    if (this.advanceTimeoutId !== null) {
      window.clearTimeout(this.advanceTimeoutId);
      this.advanceTimeoutId = null;
    }

    this.rewardEl.classList.remove('is-active');
    this.progressFillEl.style.setProperty('--mirror-progress-ratio', '0');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private triggerReward(): void {
    if (!this.isActive) {
      return;
    }

    const exercise = this.getCurrentExercise();
    this.cycleState = 'reward';
    this.rootEl.setAttribute('data-cycle-state', 'reward');
    this.rootEl.setAttribute('data-rewarding', 'true');
    this.rootEl.setAttribute('data-last-reward', exercise.id);
    this.rootEl.setAttribute('data-progress', '100');
    this.instructionEl.textContent = exercise.rewardText;
    this.rewardTextEl.textContent = 'Yıldız zamanı';
    this.rewardEl.classList.remove('is-active');
    void this.rewardEl.offsetWidth;
    this.rewardEl.classList.add('is-active');
    this.playRewardSound();
    this.rootEl.dispatchEvent(
      new CustomEvent('mirror-activity', {
        detail: { exercise: exercise.id }
      })
    );

    this.advanceTimeoutId = window.setTimeout(() => {
      this.advanceExercise(false);
    }, MIRROR_REWARD_MS);
  }

  private advanceExercise(fromButton: boolean): void {
    this.stopCycle();
    this.exerciseIndex = (this.exerciseIndex + 1) % MIRROR_EXERCISES.length;
    this.renderExercise();
    this.rootEl.setAttribute('data-last-reward', fromButton ? 'manual-next' : this.rootEl.getAttribute('data-last-reward') ?? '');

    if (!this.isActive) {
      this.rootEl.setAttribute('data-cycle-state', 'idle');
      this.rootEl.setAttribute('data-rewarding', 'false');
      return;
    }

    this.startCycle();
  }

  private renderExercise(): void {
    const exercise = this.getCurrentExercise();
    this.demoEl.setAttribute('data-exercise', exercise.id);
    this.rootEl.setAttribute('data-current-exercise', exercise.id);
    this.rootEl.setAttribute('data-current-category', exercise.category);
    this.labelEl.textContent = exercise.label;
    this.categoryEl.textContent = exercise.categoryLabel;
    this.instructionEl.textContent = exercise.instruction;
    this.rewardTextEl.textContent = exercise.rewardText;
    this.rootEl.setAttribute('data-rewarding', 'false');
  }

  private getCurrentExercise(): MirrorExercise {
    return MIRROR_EXERCISES[this.exerciseIndex] ?? MIRROR_EXERCISES[0];
  }

  private setCameraFallback(message: string): void {
    this.cameraState = 'fallback';
    this.rootEl.setAttribute('data-camera-state', 'fallback');
    this.placeholderEl.textContent = message;
    this.placeholderEl.classList.remove('is-hidden');
  }

  private playRewardSound(): void {
    if (!('AudioContext' in window)) {
      return;
    }

    let context: AudioContext;
    try {
      context = new AudioContext();
    } catch {
      return;
    }

    const now = context.currentTime + 0.02;
    const gain = context.createGain();
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);

    this.playTone(context, gain, now, 660, 0.16);
    this.playTone(context, gain, now + 0.14, 880, 0.22);
    window.setTimeout(() => {
      void context.close().catch(() => {
        // Ignore cleanup failure.
      });
    }, 900);
  }

  private playTone(context: AudioContext, gain: GainNode, start: number, frequency: number, duration: number): void {
    const oscillator = context.createOscillator();
    const oscillatorGain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillatorGain.gain.setValueAtTime(0.0001, start);
    oscillatorGain.gain.exponentialRampToValueAtTime(0.28, start + 0.02);
    oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(oscillatorGain);
    oscillatorGain.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private speakInstruction(message: string): void {
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
      return;
    }

    const runtime = window as Window & { __mirrorPromptLog?: string[] };
    runtime.__mirrorPromptLog = runtime.__mirrorPromptLog ?? [];
    runtime.__mirrorPromptLog.push(message);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.82;
    utterance.pitch = 1.02;
    utterance.volume = 0.82;

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      // Voice guidance is optional.
    }
  }
}
