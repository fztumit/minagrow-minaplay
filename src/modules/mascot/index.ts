const GUIDE_MESSAGES = {
  hint: 'Hadi dokun.',
  repeat: 'Bir daha söyle.'
} as const;

export class MascotGuide {
  private readonly outputEl: HTMLElement;
  private praiseFlip = false;

  constructor(outputEl: HTMLElement) {
    this.outputEl = outputEl;
  }

  sayHint(): void {
    this.setMessage(GUIDE_MESSAGES.hint);
  }

  sayPraise(): void {
    this.setMessage(this.praiseFlip ? 'Harika.' : 'Aferin.');
    this.praiseFlip = !this.praiseFlip;
  }

  sayRepeat(): void {
    this.setMessage(GUIDE_MESSAGES.repeat);
  }

  setMessage(message: string): void {
    this.outputEl.textContent = message;
  }
}
