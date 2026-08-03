import { describe, expect, it } from 'vitest';
import {
  createInitialModuleStats,
  createParentDetailAnalysis,
  createParentGuidanceCards,
  createParentInsight,
  createParentTodaySummary
} from '../../src/modules/main';

describe('analytics baseline', () => {
  it('starts module stats from a calm zero state', () => {
    expect(createInitialModuleStats()).toEqual({
      opens: 0,
      actions: 0,
      correct: 0,
      softRedirects: 0,
      pofiSupportTypes: {
        softRedirect: 0,
        hint: 0,
        repeat: 0,
        model: 0,
        calm: 0
      },
      pofiSupportTargets: {},
      pofiFatigueEvents: 0
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
    expect(cards[0]).toMatchObject({ title: 'Bugünkü ritim', value: 'Kısa temas', tone: 'steady' });
    expect(cards[1]).toMatchObject({ title: 'Tekrar odağı', value: 'Su', tone: 'repeat' });
    expect(cards[2].note).toContain("Dokun'da");
  });

  it('summarizes played games, independence balance, learned words and a parent plan', () => {
    const summary = createParentTodaySummary(
      {
        sessions: 3,
        repeats: 2,
        modules: {
          touch: {
            opens: 2,
            actions: 5,
            correct: 4,
            softRedirects: 1,
            pofiSupportTypes: { softRedirect: 1, hint: 2, repeat: 0, model: 0, calm: 0 },
            pofiSupportTargets: {
              su: {
                label: 'Su',
                total: 3,
                repeatSignals: 1,
                supportTypes: { softRedirect: 1, hint: 2, repeat: 0, model: 0, calm: 0 }
              }
            }
          },
          match: { opens: 1, actions: 2, correct: 1, softRedirects: 0, pofiSupportTypes: { softRedirect: 0, hint: 0, repeat: 0, model: 1, calm: 0 } }
        }
      },
      {
        su: {
          success: 4,
          fail: 0,
          hintLevels: {},
          successLatencyMsTotal: 1100,
          successLatencySamples: 4,
          repeatNeeds: 0,
          consecutiveCorrectCount: 4,
          recentResults: [true, true, true, true, true],
          lastPracticedAt: 1
        }
      },
      {},
      { su: 'Su' }
    );

    expect(summary.modules[0]).toMatchObject({ label: 'Dokun', opens: 2, independent: 4, supported: 1 });
    expect(summary.supportSummary).toContain('83% bağımsız deneme');
    expect(summary.supportTypeSummary).toEqual(['Yumuşak yönlendirme 1', 'İpucu 2', 'Model gösterimi 1']);
    expect(summary.supportDetailSummary[0]).toContain('Su: İpucu 2');
    expect(summary.detailAnalysis).toMatchObject({ focusLabel: 'Su', nextMode: 'Eşleme' });
    expect(summary.fatigueSummary).toContain('sakin');
    expect(summary.learnedWords).toContain('Su');
    expect(summary.recommendedWords[0]).toMatchObject({ label: 'Su', level: 'Seviye 1' });
    expect(summary.plan).toHaveLength(3);
  });

  it('turns support traces into a practical detail analysis', () => {
    const analysis = createParentDetailAnalysis(
      {
        sessions: 4,
        repeats: 2,
        modules: {
          touch: {
            opens: 2,
            actions: 5,
            correct: 1,
            softRedirects: 4,
            pofiFatigueEvents: 1,
            pofiSupportTargets: {
              baba: {
                label: 'Baba',
                total: 4,
                repeatSignals: 3,
                supportTypes: { softRedirect: 2, hint: 1, repeat: 1, model: 0, calm: 0 }
              }
            }
          }
        }
      },
      {
        baba: {
          success: 1,
          fail: 3,
          hintLevels: { 1: 2 },
          successLatencyMsTotal: 800,
          successLatencySamples: 1,
          repeatNeeds: 2,
          consecutiveCorrectCount: 0,
          recentResults: [false, false, true],
          lastPracticedAt: 1
        }
      },
      {},
      { baba: 'Baba' }
    );

    expect(analysis).toMatchObject({
      focusLabel: 'Baba',
      priorityLabel: 'Yüksek',
      nextMode: 'Dokun',
      supportRhythm: 'Destek arası açılmalı'
    });
    expect(analysis.rows).toHaveLength(4);
  });

  it('summarizes parent insight as development stage and a short home plan', () => {
    const insight = createParentInsight(
      {
        sessions: 2,
        repeats: 1,
        modules: {
          touch: { opens: 2, actions: 5, correct: 1, softRedirects: 3 }
        }
      },
      {
        baba: {
          success: 1,
          fail: 3,
          hintLevels: { 1: 2 },
          successLatencyMsTotal: 800,
          successLatencySamples: 1,
          repeatNeeds: 2,
          consecutiveCorrectCount: 0,
          recentResults: [false, false, true],
          lastPracticedAt: 1
        }
      },
      {},
      { baba: 'Baba' }
    );

    expect(insight).toMatchObject({
      focusLabel: 'Baba',
      stageLabel: 'Tanıma başladı',
      comprehensionLabel: 'Destekle artıyor',
      planTitle: 'Baba için rehberli 3 dakika'
    });
    expect(insight.steps[0]).toContain('4-6 kez');
  });

  it('marks generalized mastered words as high comprehension', () => {
    const insight = createParentInsight(
      {
        sessions: 3,
        repeats: 0,
        modules: {
          match: { opens: 2, actions: 6, correct: 5, softRedirects: 0 }
        }
      },
      {},
      {
        su: {
          success: 5,
          fail: 0,
          hintUsed: 0,
          hintLevels: {},
          sameImageSuccess: 2,
          conceptGeneralizationSuccess: 3,
          latencyMsTotal: 1200,
          latencySamples: 5,
          repeatNeeds: 0,
          consecutiveCorrectCount: 5,
          recentResults: [true, true, true, true, true],
          lastPracticedAt: 1
        }
      },
      { su: 'Su' }
    );

    expect(insight.stageLabel).toBe('Genelleme');
    expect(insight.comprehensionLabel).toBe('Yüksek anlaşılma');
    expect(insight.steps[2]).toContain("Eşleme'de");
  });
});
