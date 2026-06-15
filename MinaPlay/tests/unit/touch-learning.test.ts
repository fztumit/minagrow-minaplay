import { describe, expect, test } from 'vitest';
import {
  adaptiveRepeatInterval,
  adaptiveTargetWeight,
  createEmptyTouchProgressEntry,
  isMastered,
  normalizeTouchProgress,
  overallSuccessRate,
  registerTouchAttempt,
  successRate
} from '../../src/modules/touch-learning';

describe('touch learning helpers', () => {
  test('normalizes persisted progress and calculates rates', () => {
    const progress = normalizeTouchProgress({
      su: { success: 3, fail: 1, hintLevels: { 2: 1 }, successLatencyMsTotal: 1200, successLatencySamples: 3 }
    });

    expect(progress.su.success).toBe(3);
    expect(progress.su.hintLevels[2]).toBe(1);
    expect(progress.su.recentResults).toEqual([]);
    expect(progress.su.consecutiveCorrectCount).toBe(0);
    expect(progress.su.lastPracticedAt).toBe(0);
    expect(successRate(progress.su)).toBe(0.75);
    expect(overallSuccessRate(progress)).toBe(0.75);
  });

  test('weights weaker words higher and stretches repeat for mastered words', () => {
    const weaker = {
      success: 1,
      fail: 3,
      hintLevels: {},
      successLatencyMsTotal: 0,
      successLatencySamples: 0,
      repeatNeeds: 2,
      consecutiveCorrectCount: 0,
      recentResults: [false, false, true, false],
      lastPracticedAt: 100
    };
    const stronger = {
      success: 5,
      fail: 0,
      hintLevels: {},
      successLatencyMsTotal: 900,
      successLatencySamples: 5,
      repeatNeeds: 0,
      consecutiveCorrectCount: 5,
      recentResults: [true, true, true, true, true],
      lastPracticedAt: 200
    };

    expect(adaptiveTargetWeight(weaker)).toBeGreaterThan(adaptiveTargetWeight(stronger));
    expect(adaptiveRepeatInterval(weaker, 1800, 3200)).toBe(1500);
    expect(adaptiveRepeatInterval(stronger, 1800, 3200)).toBe(3200);
    expect(isMastered(stronger)).toBe(true);
  });

  test('records a five-attempt window, current streak and practice time', () => {
    const entry = createEmptyTouchProgressEntry();

    registerTouchAttempt(entry, true, 100);
    registerTouchAttempt(entry, true, 200);
    registerTouchAttempt(entry, false, 300);
    registerTouchAttempt(entry, true, 400);
    registerTouchAttempt(entry, true, 500);
    registerTouchAttempt(entry, true, 600);

    expect(entry.success).toBe(5);
    expect(entry.fail).toBe(1);
    expect(entry.repeatNeeds).toBe(1);
    expect(entry.consecutiveCorrectCount).toBe(3);
    expect(entry.recentResults).toEqual([true, false, true, true, true]);
    expect(entry.lastPracticedAt).toBe(600);
    expect(isMastered(entry)).toBe(true);
  });

  test('does not mark a word mastered without both recent accuracy and a three-answer streak', () => {
    const missingStreak = createEmptyTouchProgressEntry();
    missingStreak.recentResults = [true, true, true, false, true];
    missingStreak.consecutiveCorrectCount = 1;

    const missingRecentAccuracy = createEmptyTouchProgressEntry();
    missingRecentAccuracy.recentResults = [false, false, true, true, true];
    missingRecentAccuracy.consecutiveCorrectCount = 3;

    expect(isMastered(missingStreak)).toBe(false);
    expect(isMastered(missingRecentAccuracy)).toBe(false);
  });
});
