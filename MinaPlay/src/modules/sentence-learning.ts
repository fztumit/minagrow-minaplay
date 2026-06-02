export const SENTENCE_PROGRESS_KEY = 'minaplay_sentence_progress_v1';

export interface SentenceProgressEntry {
  success: number;
  fail: number;
  hintLevels: Record<number, number>;
  repeatPrompts: number;
  latencyMsTotal: number;
  latencySamples: number;
}

export type SentenceProgressState = Record<string, SentenceProgressEntry>;

export function sentenceKey(subjectId: string, verbId: string): string {
  return `${subjectId}_${verbId}`;
}

export function sentenceProgressEntry(progress: SentenceProgressState, key: string): SentenceProgressEntry {
  progress[key] ??= {
    success: 0,
    fail: 0,
    hintLevels: {},
    repeatPrompts: 0,
    latencyMsTotal: 0,
    latencySamples: 0
  };
  return progress[key];
}

export function normalizeSentenceProgress(input: unknown): SentenceProgressState {
  if (!input || typeof input !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, Partial<SentenceProgressEntry>>).map(([key, value]) => [
      key,
      {
        success: Math.max(0, Number(value.success) || 0),
        fail: Math.max(0, Number(value.fail) || 0),
        hintLevels: normalizeHintLevels(value.hintLevels),
        repeatPrompts: Math.max(0, Number(value.repeatPrompts) || 0),
        latencyMsTotal: Math.max(0, Number(value.latencyMsTotal) || 0),
        latencySamples: Math.max(0, Number(value.latencySamples) || 0)
      }
    ])
  );
}

export function sentenceSuccessRate(entry?: SentenceProgressEntry): number {
  const total = (entry?.success ?? 0) + (entry?.fail ?? 0);
  return total > 0 ? (entry?.success ?? 0) / total : 0;
}

export function sentenceChoiceCount(entry?: SentenceProgressEntry, maxChoices = 4): number {
  const total = (entry?.success ?? 0) + (entry?.fail ?? 0);
  if (total < 3) {
    return Math.min(2, maxChoices);
  }

  const rate = sentenceSuccessRate(entry);
  if (rate > 0.75) {
    return Math.min(4, maxChoices);
  }
  if (rate < 0.45 || (entry?.fail ?? 0) > (entry?.success ?? 0)) {
    return Math.min(2, maxChoices);
  }
  return Math.min(3, maxChoices);
}

export function sentenceTargetWeight(entry?: SentenceProgressEntry): number {
  if (!entry) {
    return 4;
  }

  const total = entry.success + entry.fail;
  const rate = sentenceSuccessRate(entry);
  let weight = 1;
  if (total < 2) {
    weight += 2;
  }
  if (rate < 0.6) {
    weight += 3;
  }
  if (entry.fail > entry.success) {
    weight += 2;
  }
  if (rate > 0.82 && total >= 4) {
    weight *= 0.45;
  }
  return Math.max(0.3, weight);
}

function normalizeHintLevels(input: unknown): Record<number, number> {
  if (!input || typeof input !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([level, count]) => [Number(level), Math.max(0, Number(count) || 0)])
  );
}
