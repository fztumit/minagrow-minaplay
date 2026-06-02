import { describe, expect, test } from 'vitest';
import {
  adaptiveRepeatInterval,
  adaptiveTargetWeight,
  isMastered,
  normalizeTouchProgress,
  overallSuccessRate,
  successRate
} from '../../src/modules/touch-learning';

describe('touch learning helpers', () => {
  test('normalizes persisted progress and calculates rates', () => {
    const progress = normalizeTouchProgress({
      su: { success: 3, fail: 1, hintLevels: { 2: 1 }, successLatencyMsTotal: 1200, successLatencySamples: 3 }
    });

    expect(progress.su.success).toBe(3);
    expect(progress.su.hintLevels[2]).toBe(1);
    expect(successRate(progress.su)).toBe(0.75);
    expect(overallSuccessRate(progress)).toBe(0.75);
  });

  test('weights weaker words higher and stretches repeat for mastered words', () => {
    const weaker = { success: 1, fail: 3, hintLevels: {}, successLatencyMsTotal: 0, successLatencySamples: 0, repeatNeeds: 2 };
    const stronger = { success: 5, fail: 0, hintLevels: {}, successLatencyMsTotal: 900, successLatencySamples: 5, repeatNeeds: 0 };

    expect(adaptiveTargetWeight(weaker)).toBeGreaterThan(adaptiveTargetWeight(stronger));
    expect(adaptiveRepeatInterval(weaker, 1800, 3200)).toBe(1500);
    expect(adaptiveRepeatInterval(stronger, 1800, 3200)).toBe(3200);
    expect(isMastered(stronger)).toBe(true);
  });
});
