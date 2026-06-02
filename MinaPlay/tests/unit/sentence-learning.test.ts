import { describe, expect, it } from 'vitest';
import {
  normalizeSentenceProgress,
  sentenceChoiceCount,
  sentenceKey,
  sentenceProgressEntry,
  sentenceTargetWeight
} from '../../src/modules/sentence-learning';

describe('sentence learning', () => {
  it('normalizes progress and creates sentence keys', () => {
    const progress = normalizeSentenceProgress({
      [sentenceKey('top', 'at')]: { success: 2, fail: 1, hintLevels: { 1: 3 }, repeatPrompts: 2 }
    });

    expect(progress.top_at.success).toBe(2);
    expect(progress.top_at.fail).toBe(1);
    expect(progress.top_at.hintLevels[1]).toBe(3);
    expect(progress.top_at.repeatPrompts).toBe(2);
  });

  it('adapts choice count from success rate', () => {
    expect(sentenceChoiceCount(undefined, 4)).toBe(2);
    expect(sentenceChoiceCount({ success: 4, fail: 0, hintLevels: {}, repeatPrompts: 0, latencyMsTotal: 0, latencySamples: 0 }, 4)).toBe(4);
    expect(sentenceChoiceCount({ success: 1, fail: 4, hintLevels: {}, repeatPrompts: 0, latencyMsTotal: 0, latencySamples: 0 }, 4)).toBe(2);
  });

  it('weights low-performing sentences higher', () => {
    const progress = {};
    const weak = sentenceProgressEntry(progress, 'elma_ye');
    weak.fail = 3;
    const strong = sentenceProgressEntry(progress, 'top_at');
    strong.success = 5;

    expect(sentenceTargetWeight(weak)).toBeGreaterThan(sentenceTargetWeight(strong));
  });
});
