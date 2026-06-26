import { describe, expect, test } from 'vitest';
import {
  DEFAULT_MODULE_VISIBILITY,
  DEFAULT_MIRROR_PLAN,
  DEFAULT_SLEEP_SETTINGS,
  mirrorExerciseOrder,
  normalizeModuleVisibility,
  normalizeMirrorPlan,
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
    expect(normalizeSleepSettings({ sound: 'pispis', durationMinutes: 20, volume: 0.8 })).toEqual({
      sound: 'pispis',
      durationMinutes: 20,
      volume: 0.8
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
});
