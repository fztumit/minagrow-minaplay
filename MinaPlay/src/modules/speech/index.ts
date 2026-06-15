export type SpeechMachineState = 'idle' | 'attention' | 'targeting' | 'waiting' | 'success' | 'retry' | 'hint';

export type SpeechPromptKind = 'attention' | 'targeting' | 'success' | 'retry' | 'hint';

export type SpeechSoundIntent = 'target' | 'success' | 'hint';

export type SpeechSoundStyle = 'clear' | 'celebration' | 'gentle';

export interface SpeechItem {
  id: string;
  label: string;
  audio?: string;
  learningGoal?: string;
}

export interface SpeechMachineSnapshot {
  state: SpeechMachineState;
  targetId?: string;
  visibleItemIds: string[];
  level: 1 | 2 | 3;
  prompt?: string;
  hintLevel?: 1 | 2 | 3 | 4;
}

export interface SpeechPromptEvent {
  kind: SpeechPromptKind;
  item?: SpeechItem;
  text: string;
  hintLevel?: 1 | 2 | 3 | 4;
}

export interface SpeechSoundEvent {
  intent: SpeechSoundIntent;
  item: SpeechItem;
  phrase: string;
  style: SpeechSoundStyle;
}

export interface SpeechAttemptEvent {
  item: SpeechItem;
  submittedId: string;
  correct: boolean;
  latencyMs: number;
}

export interface SpeechStateMachineOptions {
  items: () => SpeechItem[];
  waitingMs?: number;
  hintStepMs?: number;
  targetWeight?: (item: SpeechItem) => number;
  overallSuccessRate?: () => number;
  promptText?: (event: { kind: SpeechPromptKind; item?: SpeechItem; hintLevel?: 1 | 2 | 3 | 4 }) => string | undefined;
  onStateChange: (snapshot: SpeechMachineSnapshot) => void;
  onPrompt?: (event: SpeechPromptEvent) => void;
  onSound?: (event: SpeechSoundEvent) => void | Promise<void>;
  onAttempt?: (event: SpeechAttemptEvent) => void;
  onHint?: (event: { item: SpeechItem; hintLevel: 1 | 2 | 3 | 4 }) => void;
}

const DEFAULT_WAITING_MS = 5000;
const DEFAULT_HINT_STEP_MS = 3000;
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
  private lastTargetVisibleIndex = -1;
  private hintSequenceComplete = false;
  private timer: number | undefined;
  private readonly waitingMs: number;
  private readonly hintStepMs: number;
  private hintLevel: 1 | 2 | 3 | 4 | undefined;
  private roundStartedAt = 0;

  constructor(private readonly options: SpeechStateMachineOptions) {
    this.waitingMs = options.waitingMs ?? DEFAULT_WAITING_MS;
    this.hintStepMs = options.hintStepMs ?? DEFAULT_HINT_STEP_MS;
  }

  start(): void {
    this.clearTimer();
    this.correctCount = 0;
    this.level = 1;
    this.lastTargetIds = [];
    this.lastTargetVisibleIndex = -1;
    this.hintSequenceComplete = false;
    this.hintLevel = undefined;
    this.roundStartedAt = 0;
    this.enterIdle(true);
  }

  stop(): void {
    this.clearTimer();
    this.state = 'idle';
    this.target = undefined;
    this.visibleItemIds = [];
    this.hintLevel = undefined;
    this.emit();
  }

  submit(itemId: string): void {
    if (!['targeting', 'waiting', 'hint'].includes(this.state) || !this.target) {
      return;
    }

    this.clearTimer();
    const latencyMs = this.roundStartedAt > 0 ? Math.max(0, Date.now() - this.roundStartedAt) : 0;

    if (itemId === this.target.id) {
      this.options.onAttempt?.({ item: this.target, submittedId: itemId, correct: true, latencyMs });
      this.enterSuccess();
      return;
    }

    this.options.onAttempt?.({ item: this.target, submittedId: itemId, correct: false, latencyMs });
    this.enterRetry();
  }

  nudge(): void {
    if (!this.target || this.state === 'idle') {
      this.startRound();
      return;
    }

    if (this.state === 'waiting') {
      this.enterHint(1);
    }
  }

  snapshot(): SpeechMachineSnapshot {
    return {
      state: this.state,
      targetId: this.target?.id,
      visibleItemIds: [...this.visibleItemIds],
      level: this.level,
      prompt: this.promptText(),
      hintLevel: this.hintLevel
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
    this.hintSequenceComplete = false;
    this.hintLevel = undefined;
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
    this.roundStartedAt = Date.now();
    this.emit();
    this.options.onPrompt?.({ kind: 'targeting', item: this.target, text: this.promptFor('targeting', this.target) });
    void this.options.onSound?.({ intent: 'target', item: this.target, phrase: this.target.label, style: 'clear' });
    this.timer = window.setTimeout(() => this.enterWaiting(), TARGETING_MS);
  }

  private enterWaiting(): void {
    this.state = 'waiting';
    this.hintLevel = undefined;
    this.emit();
    if (!this.hintSequenceComplete) {
      this.timer = window.setTimeout(() => this.enterHint(1), this.waitingMs);
    }
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
    this.options.onPrompt?.({ kind: 'success', item: this.target, text: this.promptFor('success', this.target) ?? successText });
    void this.options.onSound?.({ intent: 'success', item: this.target, phrase: successPhrase, style: 'celebration' });
    this.timer = window.setTimeout(() => this.enterIdle(true), SUCCESS_MS);
  }

  private enterRetry(): void {
    this.state = 'retry';
    this.hintLevel = undefined;
    this.emit();
    this.options.onPrompt?.({ kind: 'retry', item: this.target, text: this.promptFor('retry', this.target) });
    this.timer = window.setTimeout(() => this.enterWaiting(), RETRY_MS);
  }

  private enterHint(level: 1 | 2 | 3 | 4): void {
    if (!this.target) {
      this.startRound();
      return;
    }

    this.state = 'hint';
    this.hintLevel = level;
    this.emit();
    this.options.onHint?.({ item: this.target, hintLevel: level });
    this.options.onPrompt?.({ kind: 'hint', item: this.target, text: this.promptFor('hint', this.target, level), hintLevel: level });
    if (level === 1 || level === 3) {
      void this.options.onSound?.({ intent: 'hint', item: this.target, phrase: this.target.label, style: 'gentle' });
    }
    const nextLevel = Math.min(4, level + 1) as 1 | 2 | 3 | 4;
    this.timer = window.setTimeout(
      () => {
        if (level < 4) {
          this.enterHint(nextLevel);
          return;
        }
        this.hintSequenceComplete = true;
        this.enterWaiting();
      },
      level < 4 ? this.hintStepMs : HINT_MS
    );
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
    const target = this.pickWeighted(pool.length > 0 ? pool : items);
    this.lastTargetIds.push(target.id);
    this.lastTargetIds = this.lastTargetIds.slice(-6);
    return target;
  }

  private pickVisibleItemIds(items: SpeechItem[], target: SpeechItem): string[] {
    const count = Math.min(LEVEL_COUNTS[this.level], items.length);
    const distractors = this.shuffle(items.filter((item) => item.id !== target.id)).slice(0, Math.max(0, count - 1));
    const availableIndexes = Array.from({ length: count }, (_, index) => index).filter(
      (index) => count === 1 || index !== this.lastTargetVisibleIndex
    );
    const targetIndex = this.pickOne(availableIndexes.length > 0 ? availableIndexes : [0]);
    const visible = [...distractors];
    visible.splice(targetIndex, 0, target);
    this.lastTargetVisibleIndex = targetIndex;
    return visible.map((item) => item.id);
  }

  private levelForCorrectCount(count: number): 1 | 2 | 3 {
    const rate = this.options.overallSuccessRate?.();
    if (typeof rate === 'number' && rate > 0.75 && count >= 8) {
      return count >= 16 ? 3 : 2;
    }

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
      return this.promptFor('retry', this.target);
    }

    if (this.state === 'hint') {
      return this.promptFor('hint', this.target, this.hintLevel);
    }

    if (this.state === 'targeting' || this.state === 'waiting') {
      return this.promptFor('targeting', this.target);
    }

    return undefined;
  }

  private promptFor(kind: SpeechPromptKind, item?: SpeechItem, hintLevel?: 1 | 2 | 3 | 4): string {
    const custom = this.options.promptText?.({ kind, item, hintLevel });
    if (custom) {
      return custom;
    }

    if (kind === 'attention') {
      return 'Bak 😊';
    }

    if (!item) {
      return '';
    }

    if (kind === 'targeting') {
      return `${item.label} kartına dokun 😊`;
    }

    if (kind === 'success') {
      return this.correctCount % 8 === 0 ? `Harika! ${item.label} 😄` : item.label;
    }

    if (kind === 'retry') {
      return 'Hadi tekrar bakalım 😊';
    }

    return hintLevel && hintLevel >= 4 ? `${item.label} burada. Bu karta dokun 😊` : `${item.label} burada 😊`;
  }

  private pickOne<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)] ?? items[0];
  }

  private pickWeighted(items: SpeechItem[]): SpeechItem {
    const weighted = items.map((item) => ({ item, weight: Math.max(0.1, this.options.targetWeight?.(item) ?? 1) }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = Math.random() * total;

    for (const entry of weighted) {
      cursor -= entry.weight;
      if (cursor <= 0) {
        return entry.item;
      }
    }

    return this.pickOne(items);
  }

  private shuffle(items: SpeechItem[]): SpeechItem[] {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  private clearTimer(): void {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
