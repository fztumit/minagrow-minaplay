import { describe, expect, test } from 'vitest';
import {
  createEmptyMatchProgressEntry,
  isMatchMastered,
  matchChoiceCount,
  matchLevelForProgress,
  matchSuccessRate,
  matchTargetWeight,
  normalizeMatchProgress,
  registerMatchAttempt
} from '../../src/modules/match-learning';

describe('match learning helpers', () => {
  test('normalizes progress and calculates success rate', () => {
    const progress = normalizeMatchProgress({
      top: {
        success: 4,
        fail: 1,
        hintUsed: 2,
        hintLevels: { 2: 1, 3: 1 },
        conceptGeneralizationSuccess: 3,
        latencyMsTotal: 1600,
        latencySamples: 4,
        repeatNeeds: 1
      }
    });

    expect(progress.top.success).toBe(4);
    expect(progress.top.hintUsed).toBe(2);
    expect(progress.top.hintLevels[2]).toBe(1);
    expect(progress.top.repeatNeeds).toBe(1);
    expect(progress.top.recentResults).toEqual([]);
    expect(progress.top.consecutiveCorrectCount).toBe(0);
    expect(matchSuccessRate(progress.top)).toBe(0.8);
  });

  test('raises level and choice count as concept success improves', () => {
    const early = progressEntry({ success: 1, fail: 1, sameImageSuccess: 1 });
    const growing = progressEntry({ success: 4, fail: 1, sameImageSuccess: 2, conceptGeneralizationSuccess: 2 });
    const strong = progressEntry({ success: 8, fail: 1, sameImageSuccess: 2, conceptGeneralizationSuccess: 6 });

    expect(matchLevelForProgress(early)).toBe(1);
    expect(matchLevelForProgress(growing)).toBe(2);
    expect(matchLevelForProgress(strong)).toBe(3);
    expect(matchChoiceCount(3, 5)).toBe(5);
  });

  test('weights weaker targets higher', () => {
    const weak = progressEntry({ success: 1, fail: 3, hintUsed: 2, hintLevels: { 2: 1 }, sameImageSuccess: 1, repeatNeeds: 2 });
    const strong = progressEntry({ success: 8, fail: 1, sameImageSuccess: 2, conceptGeneralizationSuccess: 6 });

    expect(matchTargetWeight(weak)).toBeGreaterThan(matchTargetWeight(strong));
  });

  test('records recent accuracy and requires a three-answer streak for mastery', () => {
    const entry = createEmptyMatchProgressEntry();

    registerMatchAttempt(entry, false, 100);
    registerMatchAttempt(entry, true, 200);
    registerMatchAttempt(entry, true, 300);
    registerMatchAttempt(entry, true, 400);
    registerMatchAttempt(entry, true, 500);

    expect(entry.recentResults).toEqual([false, true, true, true, true]);
    expect(entry.consecutiveCorrectCount).toBe(4);
    expect(entry.lastPracticedAt).toBe(500);
    expect(isMatchMastered(entry)).toBe(true);

    registerMatchAttempt(entry, false, 600);
    expect(entry.consecutiveCorrectCount).toBe(0);
    expect(isMatchMastered(entry)).toBe(false);
  });
});

function progressEntry(overrides: Partial<ReturnType<typeof createEmptyMatchProgressEntry>>) {
  return { ...createEmptyMatchProgressEntry(), ...overrides };
}
