import { describe, expect, test } from 'vitest';
import {
  matchChoiceCount,
  matchLevelForProgress,
  matchSuccessRate,
  matchTargetWeight,
  normalizeMatchProgress
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
    expect(matchSuccessRate(progress.top)).toBe(0.8);
  });

  test('raises level and choice count as concept success improves', () => {
    const early = { success: 1, fail: 1, hintUsed: 0, hintLevels: {}, sameImageSuccess: 1, conceptGeneralizationSuccess: 0, latencyMsTotal: 0, latencySamples: 0, repeatNeeds: 0 };
    const growing = { success: 4, fail: 1, hintUsed: 0, hintLevels: {}, sameImageSuccess: 2, conceptGeneralizationSuccess: 2, latencyMsTotal: 0, latencySamples: 0, repeatNeeds: 0 };
    const strong = { success: 8, fail: 1, hintUsed: 0, hintLevels: {}, sameImageSuccess: 2, conceptGeneralizationSuccess: 6, latencyMsTotal: 0, latencySamples: 0, repeatNeeds: 0 };

    expect(matchLevelForProgress(early)).toBe(1);
    expect(matchLevelForProgress(growing)).toBe(2);
    expect(matchLevelForProgress(strong)).toBe(3);
    expect(matchChoiceCount(3, 5)).toBe(5);
  });

  test('weights weaker targets higher', () => {
    const weak = { success: 1, fail: 3, hintUsed: 2, hintLevels: { 2: 1 }, sameImageSuccess: 1, conceptGeneralizationSuccess: 0, latencyMsTotal: 0, latencySamples: 0, repeatNeeds: 2 };
    const strong = { success: 8, fail: 1, hintUsed: 0, hintLevels: {}, sameImageSuccess: 2, conceptGeneralizationSuccess: 6, latencyMsTotal: 0, latencySamples: 0, repeatNeeds: 0 };

    expect(matchTargetWeight(weak)).toBeGreaterThan(matchTargetWeight(strong));
  });
});
