export type MatchMode = 'same-image' | 'concept';
export type MatchState = 'idle' | 'attention' | 'targeting' | 'waiting' | 'success' | 'retry' | 'hint';
export type MatchLevel = 1 | 2 | 3;

export interface MatchProgressEntry {
  success: number;
  fail: number;
  hintUsed: number;
  hintLevels: Record<number, number>;
  sameImageSuccess: number;
  conceptGeneralizationSuccess: number;
  latencyMsTotal: number;
  latencySamples: number;
  repeatNeeds: number;
}

export type MatchProgressState = Record<string, MatchProgressEntry>;

export const MATCH_PROGRESS_KEY = 'minaplay_match_progress_v1';

export function createEmptyMatchProgressEntry(): MatchProgressEntry {
  return {
    success: 0,
    fail: 0,
    hintUsed: 0,
    hintLevels: {},
    sameImageSuccess: 0,
    conceptGeneralizationSuccess: 0,
    latencyMsTotal: 0,
    latencySamples: 0,
    repeatNeeds: 0
  };
}

export function normalizeMatchProgress(raw: unknown): MatchProgressState {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  return Object.entries(raw as Record<string, Partial<MatchProgressEntry>>).reduce<MatchProgressState>((state, [id, entry]) => {
    if (!id || !entry || typeof entry !== 'object') {
      return state;
    }

    state[id] = {
      success: safeCount(entry.success),
      fail: safeCount(entry.fail),
      hintUsed: safeCount(entry.hintUsed),
      hintLevels: normalizeHintLevels(entry.hintLevels),
      sameImageSuccess: safeCount(entry.sameImageSuccess),
      conceptGeneralizationSuccess: safeCount(entry.conceptGeneralizationSuccess),
      latencyMsTotal: safeCount(entry.latencyMsTotal),
      latencySamples: safeCount(entry.latencySamples),
      repeatNeeds: safeCount(entry.repeatNeeds)
    };
    return state;
  }, {});
}

export function matchProgressEntry(state: MatchProgressState, itemId: string): MatchProgressEntry {
  state[itemId] = state[itemId] ?? createEmptyMatchProgressEntry();
  return state[itemId];
}

export function matchSuccessRate(entry: Pick<MatchProgressEntry, 'success' | 'fail'> | undefined): number {
  if (!entry) {
    return 0;
  }

  const total = entry.success + entry.fail;
  return total > 0 ? entry.success / total : 0;
}

export function matchLevelForProgress(entry: MatchProgressEntry | undefined): MatchLevel {
  if (!entry) {
    return 1;
  }

  const rate = matchSuccessRate(entry);
  if (entry.conceptGeneralizationSuccess >= 6 && rate >= 0.75) {
    return 3;
  }

  if (entry.success >= 3 && rate >= 0.65) {
    return 2;
  }

  return 1;
}

export function matchChoiceCount(level: MatchLevel, availableCount: number): number {
  const desired = level === 1 ? 2 : level === 2 ? 3 : 5;
  return Math.max(1, Math.min(desired, availableCount));
}

export function matchTargetWeight(entry: MatchProgressEntry | undefined): number {
  if (!entry || entry.success + entry.fail === 0) {
    return 1.25;
  }

  const rate = matchSuccessRate(entry);
  if (rate < 0.55) {
    return 3;
  }

  if (rate < 0.75) {
    return 2;
  }

  return 0.75;
}

function safeCount(value: unknown): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(Number(value))) : 0;
}

function normalizeHintLevels(value: unknown): Record<number, number> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<number, number>>((levels, [level, count]) => {
    const numericLevel = Number(level);
    if (Number.isFinite(numericLevel) && numericLevel >= 1 && numericLevel <= 4) {
      levels[numericLevel] = safeCount(count);
    }
    return levels;
  }, {});
}
