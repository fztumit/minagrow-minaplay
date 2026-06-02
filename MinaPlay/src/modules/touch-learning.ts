export interface TouchProgressEntry {
  success: number;
  fail: number;
  hintLevels: Record<number, number>;
  successLatencyMsTotal: number;
  successLatencySamples: number;
  repeatNeeds: number;
}

export type TouchProgressState = Record<string, TouchProgressEntry>;

export interface TouchMasteryState {
  masteredWords: string[];
}

export const TOUCH_PROGRESS_KEY = 'minaplay_touch_progress_v1';
export const TOUCH_MASTERY_KEY = 'minaplay_mastered_words_v1';

export const TOUCH_MASTERY_SUCCESS_THRESHOLD = 4;
export const TOUCH_MASTERY_RATE_THRESHOLD = 0.78;

export function createEmptyTouchProgressEntry(): TouchProgressEntry {
  return {
    success: 0,
    fail: 0,
    hintLevels: {},
    successLatencyMsTotal: 0,
    successLatencySamples: 0,
    repeatNeeds: 0
  };
}

export function normalizeTouchProgress(raw: unknown): TouchProgressState {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  return Object.entries(raw as Record<string, Partial<TouchProgressEntry>>).reduce<TouchProgressState>((state, [id, entry]) => {
    if (!id || !entry || typeof entry !== 'object') {
      return state;
    }

    state[id] = {
      success: safeCount(entry.success),
      fail: safeCount(entry.fail),
      hintLevels: normalizeHintLevels(entry.hintLevels),
      successLatencyMsTotal: safeCount(entry.successLatencyMsTotal),
      successLatencySamples: safeCount(entry.successLatencySamples),
      repeatNeeds: safeCount(entry.repeatNeeds)
    };
    return state;
  }, {});
}

export function touchProgressEntry(state: TouchProgressState, itemId: string): TouchProgressEntry {
  state[itemId] = state[itemId] ?? createEmptyTouchProgressEntry();
  return state[itemId];
}

export function successRate(entry: Pick<TouchProgressEntry, 'success' | 'fail'> | undefined): number {
  if (!entry) {
    return 0;
  }

  const total = entry.success + entry.fail;
  return total > 0 ? entry.success / total : 0;
}

export function overallSuccessRate(state: TouchProgressState): number {
  const totals = Object.values(state).reduce(
    (acc, entry) => {
      acc.success += entry.success;
      acc.fail += entry.fail;
      return acc;
    },
    { success: 0, fail: 0 }
  );
  const total = totals.success + totals.fail;
  return total > 0 ? totals.success / total : 0;
}

export function adaptiveTargetWeight(entry: TouchProgressEntry | undefined): number {
  if (!entry || entry.success + entry.fail === 0) {
    return 1.35;
  }

  const rate = successRate(entry);
  let weight = 1;
  if (rate < 0.6) {
    weight += 2;
  } else if (rate < 0.75) {
    weight += 1;
  } else if (rate > 0.9 && entry.success >= 4) {
    weight -= 0.45;
  }

  if (entry.fail > entry.success) {
    weight += 0.7;
  }

  return Math.max(0.35, weight);
}

export function adaptiveRepeatInterval(entry: TouchProgressEntry | undefined, minIntervalMs: number, maxIntervalMs: number): number {
  if (!entry) {
    return maxIntervalMs;
  }

  if (entry.fail > 2 || successRate(entry) < 0.6) {
    return Math.max(1200, Math.min(1500, maxIntervalMs));
  }

  if (entry.success > entry.fail + 2 && successRate(entry) >= 0.75) {
    return Math.max(minIntervalMs, Math.min(3600, maxIntervalMs));
  }

  return Math.max(minIntervalMs, Math.min(3000, maxIntervalMs));
}

export function isMastered(entry: TouchProgressEntry | undefined): boolean {
  return Boolean(
    entry &&
      entry.success >= TOUCH_MASTERY_SUCCESS_THRESHOLD &&
      successRate(entry) >= TOUCH_MASTERY_RATE_THRESHOLD
  );
}

export function normalizeMastery(raw: unknown): TouchMasteryState {
  if (!raw || typeof raw !== 'object') {
    return { masteredWords: [] };
  }

  const masteredWords = Array.isArray((raw as TouchMasteryState).masteredWords)
    ? (raw as TouchMasteryState).masteredWords.filter((word): word is string => typeof word === 'string' && word.length > 0)
    : [];

  return { masteredWords: [...new Set(masteredWords)] };
}

function normalizeHintLevels(raw: unknown): Record<number, number> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  return Object.entries(raw as Record<string, number>).reduce<Record<number, number>>((levels, [key, value]) => {
    const level = Number(key);
    if (Number.isFinite(level) && level > 0) {
      levels[level] = safeCount(value);
    }
    return levels;
  }, {});
}

function safeCount(value: unknown): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(Number(value))) : 0;
}
