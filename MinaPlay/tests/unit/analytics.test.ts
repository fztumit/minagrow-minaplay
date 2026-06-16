import { describe, expect, it } from 'vitest';
import { createInitialModuleStats, createParentGuidanceCards } from '../../src/modules/main';

describe('analytics baseline', () => {
  it('starts module stats from a calm zero state', () => {
    expect(createInitialModuleStats()).toEqual({
      opens: 0,
      actions: 0,
      correct: 0,
      softRedirects: 0
    });
  });

  it('turns local progress into gentle parent guidance', () => {
    const cards = createParentGuidanceCards(
      {
        sessions: 2,
        repeats: 1,
        modules: {
          touch: { opens: 2, actions: 5, correct: 1, softRedirects: 3 }
        }
      },
      {
        su: {
          success: 1,
          fail: 3,
          hintLevels: { 1: 2 },
          successLatencyMsTotal: 800,
          successLatencySamples: 1,
          repeatNeeds: 1,
          consecutiveCorrectCount: 0,
          recentResults: [false, false, true],
          lastPracticedAt: 1
        }
      },
      {},
      { su: 'Su' }
    );

    expect(cards).toHaveLength(3);
    expect(cards[0]).toMatchObject({ title: 'Bugünkü ritim', value: '2 oturum', tone: 'steady' });
    expect(cards[1]).toMatchObject({ title: 'Tekrar odağı', value: 'Su', tone: 'repeat' });
    expect(cards[2].note).toContain("Dokun'da");
  });
});
