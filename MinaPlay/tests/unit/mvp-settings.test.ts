import { describe, expect, test } from 'vitest';
import {
  DEFAULT_MODULE_VISIBILITY,
  DEFAULT_MIRROR_PLAN,
  DEFAULT_POFI_GUIDE_SETTINGS,
  DEFAULT_SLEEP_SETTINGS,
  mirrorExerciseOrder,
  normalizeModuleVisibility,
  normalizeMirrorPlan,
  normalizePofiGuideSettings,
  pofiGuideDelay,
  normalizeSleepSettings
} from '../../src/modules/mvp-settings';

describe('MVP parent settings', () => {
  test('normalizes mirror presets and returns a stable exercise order', () => {
    expect(normalizeMirrorPlan({ preset: 'expression-first' })).toEqual({ preset: 'expression-first' });
    expect(normalizeMirrorPlan({ preset: 'tongue-first' })).toEqual({ preset: 'expression-first' });
    expect(mirrorExerciseOrder({ preset: 'mouth-first' }).slice(0, 3)).toEqual(['open-mouth', 'closed-mouth', 'pucker']);
    expect(mirrorExerciseOrder({ preset: 'expression-first' }).slice(0, 2)).toEqual(['smile', 'surprised-face']);
    expect(normalizeMirrorPlan({ preset: 'unknown' })).toEqual(DEFAULT_MIRROR_PLAN);
  });

  test('normalizes sleep sound, duration and volume safely', () => {
    expect(normalizeSleepSettings(undefined)).toEqual(DEFAULT_SLEEP_SETTINGS);
    expect(DEFAULT_SLEEP_SETTINGS.sound).toBe('sleep-sequence');
    expect(normalizeSleepSettings({ sound: 'ocean', durationMinutes: 20, volume: 0.8 })).toEqual({
      sound: 'ocean',
      durationMinutes: 20,
      volume: 0.8
    });
    expect(normalizeSleepSettings({ sound: 'sleep-gul', durationMinutes: 10, volume: 0.55 })).toEqual({
      sound: 'sleep-gul',
      durationMinutes: 10,
      volume: 0.55
    });
    expect(normalizeSleepSettings({ sound: 'invalid', durationMinutes: 7, volume: 4 })).toEqual({
      ...DEFAULT_SLEEP_SETTINGS,
      volume: 1
    });
  });

  test('normalizes module visibility and keeps at least one child mode active', () => {
    expect(normalizeModuleVisibility({ touch: false, match: true, unknown: true })).toEqual({
      ...DEFAULT_MODULE_VISIBILITY,
      touch: false,
      match: true
    });

    expect(
      normalizeModuleVisibility({
        touch: false,
        match: false,
        sentence: false,
        story: false,
        mirror: false,
        sleep: false,
        peekaboo: false
      })
    ).toEqual({
      touch: true,
      match: false,
      sentence: false,
      story: false,
      mirror: false,
      sleep: false,
      peekaboo: false
    });
  });

  test('normalizes Pofi guide frequency and divides only the waiting delay', () => {
    expect(normalizePofiGuideSettings(undefined)).toEqual(DEFAULT_POFI_GUIDE_SETTINGS);
    expect(normalizePofiGuideSettings({ frequencyMultiplier: 5 })).toEqual({ frequencyMultiplier: 5 });
    expect(normalizePofiGuideSettings({ frequencyMultiplier: 9 })).toEqual(DEFAULT_POFI_GUIDE_SETTINGS);
    expect(pofiGuideDelay(12_000, { frequencyMultiplier: 1 })).toBe(12_000);
    expect(pofiGuideDelay(12_000, { frequencyMultiplier: 3 })).toBe(4_000);
    expect(pofiGuideDelay(3_000, { frequencyMultiplier: 5 })).toBe(800);
  });
});
