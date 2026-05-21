export type SpeechMachineState = 'idle' | 'attention' | 'targeting' | 'waiting' | 'success' | 'retry' | 'hint';

export type SpeechPromptKind = 'attention' | 'targeting' | 'success' | 'retry' | 'hint';

export type SpeechSoundIntent = 'target' | 'success';

export interface SpeechItem {
  id: string;
  label: string;
  audio?: string;
}

export interface SpeechMachineSnapshot {
  state: SpeechMachineState;
  targetId?: string;
  visibleItemIds: string[];
  level: 1 | 2 | 3;
  prompt?: string;
}

export interface SpeechPromptEvent {
  kind: SpeechPromptKind;
  item?: SpeechItem;
  text: string;
}

export interface SpeechSoundEvent {
  intent: SpeechSoundIntent;
  item: SpeechItem;
  phrase: string;
}

export interface SpeechStateMachineOptions {
  items: () => SpeechItem[];
  waitingMs?: number;
  onStateChange: (snapshot: SpeechMachineSnapshot) => void;
  onPrompt?: (event: SpeechPromptEvent) => void;
  onSound?: (event: SpeechSoundEvent) => void | Promise<void>;
}

const DEFAULT_WAITING_MS = 5000;
const ATTENTION_MS = 620;
const TARGETING_MS = 760;
const SUCCESS_MS = 800;
const RETRY_MS = 900;
const HINT_MS = 1900;

const LEVEL_COUNTS: Record<1 | 2 | 3, number> = {
  1: 2,
  2: 3,
  3: 5
};
const LEVEL_2_CORRECT_THRESHOLD = 20;
const LEVEL_3_CORRECT_THRESHOLD = 45;

export class SpeechStateMachine {
  private state: SpeechMachineState = 'idle';
  private target?: SpeechItem;
  private visibleItemIds: string[] = [];
  private level: 1 | 2 | 3 = 1;
  private correctCount = 0;
  private lastTargetIds: string[] = [];
  private timer: number | undefined;
  private readonly waitingMs: number;

  constructor(private readonly options: SpeechStateMachineOptions) {
    this.waitingMs = options.waitingMs ?? DEFAULT_WAITING_MS;
  }

  start(): void {
    this.clearTimer();
    this.correctCount = 0;
    this.level = 1;
    this.lastTargetIds = [];
    this.enterIdle(true);
  }

  stop(): void {
    this.clearTimer();
    this.state = 'idle';
    this.target = undefined;
    this.visibleItemIds = [];
    this.emit();
  }

  submit(itemId: string): void {
    if (!['targeting', 'waiting', 'hint'].includes(this.state) || !this.target) {
      return;
    }

    this.clearTimer();

    if (itemId === this.target.id) {
      this.enterSuccess();
      return;
    }

    this.enterRetry();
  }

  nudge(): void {
    if (!this.target || this.state === 'idle') {
      this.startRound();
      return;
    }

    if (this.state === 'waiting') {
      this.enterHint();
    }
  }

  snapshot(): SpeechMachineSnapshot {
    return {
      state: this.state,
      targetId: this.target?.id,
      visibleItemIds: [...this.visibleItemIds],
      level: this.level,
      prompt: this.promptText()
    };
  }

  private enterIdle(continueToNextRound = false): void {
    this.state = 'idle';
    this.emit();

    if (continueToNextRound) {
      this.timer = window.setTimeout(() => this.startRound(), 360);
    }
  }

  private startRound(): void {
    const items = this.items();
    if (items.length === 0) {
      this.enterIdle(false);
      return;
    }

    this.target = this.pickTarget(items);
    this.visibleItemIds = this.pickVisibleItemIds(items, this.target);
    this.enterAttention();
  }

  private enterAttention(): void {
    this.state = 'attention';
    this.emit();
    this.options.onPrompt?.({ kind: 'attention', text: 'Bak 😊' });
    this.timer = window.setTimeout(() => this.enterTargeting(), ATTENTION_MS);
  }

  private enterTargeting(): void {
    if (!this.target) {
      this.startRound();
      return;
    }

    this.state = 'targeting';
    this.emit();
    this.options.onPrompt?.({ kind: 'targeting', item: this.target, text: `${this.target.label} kartına dokun 😊` });
    void this.options.onSound?.({ intent: 'target', item: this.target, phrase: this.target.label });
    this.timer = window.setTimeout(() => this.enterWaiting(), TARGETING_MS);
  }

  private enterWaiting(): void {
    this.state = 'waiting';
    this.emit();
    this.timer = window.setTimeout(() => this.enterHint(), this.waitingMs);
  }

  private enterSuccess(): void {
    if (!this.target) {
      this.startRound();
      return;
    }

    this.state = 'success';
    this.correctCount += 1;
    this.level = this.levelForCorrectCount(this.correctCount);
    this.emit();
    const successText = this.correctCount % 8 === 0 ? `Harika! ${this.target.label} 😄` : this.target.label;
    const successPhrase = this.correctCount % 8 === 0 ? `Harika, ${this.target.label}` : this.target.label;
    this.options.onPrompt?.({ kind: 'success', item: this.target, text: successText });
    void this.options.onSound?.({ intent: 'success', item: this.target, phrase: successPhrase });
    this.timer = window.setTimeout(() => this.enterIdle(true), SUCCESS_MS);
  }

  private enterRetry(): void {
    this.state = 'retry';
    this.emit();
    this.options.onPrompt?.({ kind: 'retry', item: this.target, text: 'Hadi tekrar bakalım 😊' });
    this.timer = window.setTimeout(() => this.enterWaiting(), RETRY_MS);
  }

  private enterHint(): void {
    if (!this.target) {
      this.startRound();
      return;
    }

    this.state = 'hint';
    this.emit();
    this.options.onPrompt?.({ kind: 'hint', item: this.target, text: `${this.target.label} burada 😊` });
    this.timer = window.setTimeout(() => this.enterWaiting(), HINT_MS);
  }

  private emit(): void {
    this.options.onStateChange(this.snapshot());
  }

  private items(): SpeechItem[] {
    return this.options.items().filter((item) => item.id && item.label);
  }

  private pickTarget(items: SpeechItem[]): SpeechItem {
    const recentLimit = this.lastTargetIds.slice(-2);
    const immediatePrevious = this.lastTargetIds.at(-1);
    const pool = items.filter((item) => {
      if (items.length > 1 && item.id === immediatePrevious) {
        return false;
      }

      return !(recentLimit.length === 2 && recentLimit.every((id) => id === item.id));
    });
    const target = this.pickOne(pool.length > 0 ? pool : items);
    this.lastTargetIds.push(target.id);
    this.lastTargetIds = this.lastTargetIds.slice(-6);
    return target;
  }

  private pickVisibleItemIds(items: SpeechItem[], target: SpeechItem): string[] {
    const count = Math.min(LEVEL_COUNTS[this.level], items.length);
    const distractors = this.shuffle(items.filter((item) => item.id !== target.id)).slice(0, Math.max(0, count - 1));
    return this.shuffle([target, ...distractors]).map((item) => item.id);
  }

  private levelForCorrectCount(count: number): 1 | 2 | 3 {
    if (count >= LEVEL_3_CORRECT_THRESHOLD) {
      return 3;
    }

    if (count >= LEVEL_2_CORRECT_THRESHOLD) {
      return 2;
    }

    return 1;
  }

  private promptText(): string | undefined {
    if (!this.target) {
      return undefined;
    }

    if (this.state === 'success') {
      return this.correctCount % 8 === 0 ? `Harika! ${this.target.label} 😄` : this.target.label;
    }

    if (this.state === 'retry') {
      return 'Hadi tekrar bakalım 😊';
    }

    if (this.state === 'hint') {
      return `${this.target.label} burada 😊`;
    }

    if (this.state === 'targeting' || this.state === 'waiting') {
      return `${this.target.label} kartına dokun 😊`;
    }

    return undefined;
  }

  private pickOne(items: SpeechItem[]): SpeechItem {
    return items[Math.floor(Math.random() * items.length)] ?? items[0];
  }

  private shuffle(items: SpeechItem[]): SpeechItem[] {
    return [...items].sort(() => Math.random() - 0.5);
  }

  private clearTimer(): void {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
