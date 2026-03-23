const GUIDE_MESSAGES = {
  hint: 'Hadi dokun.',
  repeat: 'Bir daha söyle.'
} as const;

type MascotVariant = 'normal' | 'sleep';

export class MascotGuide {
  private readonly outputEl: HTMLElement;
  private readonly imageEl: HTMLImageElement | null;
  private readonly shellEl: HTMLElement | null;
  private praiseFlip = false;
  private activeTimeoutId: number | null = null;
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
    this.praiseFlip = !this.praiseFlip;
  }

  sayRepeat(): void {
    this.pulse();
    this.setMessage(GUIDE_MESSAGES.repeat);
  }

  setSleepMode(enabled: boolean): void {
    this.variant = enabled ? 'sleep' : 'normal';

    if (this.imageEl) {
      this.imageEl.src = enabled ? '/assets/phoenix-sleep.svg' : '/assets/phoenix.svg';
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
}
