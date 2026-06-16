import { describe, expect, test } from 'vitest';
import {
  DEFAULT_MIRROR_PLAN,
  DEFAULT_SLEEP_SETTINGS,
  mirrorExerciseOrder,
  normalizeMirrorPlan,
  normalizeSleepSettings
} from '../../src/modules/mvp-settings';

describe('MVP parent settings', () => {
  test('normalizes mirror presets and returns a stable exercise order', () => {
    expect(normalizeMirrorPlan({ preset: 'tongue-first' })).toEqual({ preset: 'tongue-first' });
    expect(mirrorExerciseOrder({ preset: 'mouth-first' }).slice(0, 3)).toEqual(['open-mouth', 'pucker', 'teeth']);
    expect(normalizeMirrorPlan({ preset: 'unknown' })).toEqual(DEFAULT_MIRROR_PLAN);
  });

  test('normalizes sleep sound, duration and volume safely', () => {
    expect(normalizeSleepSettings({ sound: 'ocean', durationMinutes: 20, volume: 0.8 })).toEqual({
      sound: 'ocean',
      durationMinutes: 20,
      volume: 0.8
    });
    expect(normalizeSleepSettings({ sound: 'invalid', durationMinutes: 7, volume: 4 })).toEqual({
      ...DEFAULT_SLEEP_SETTINGS,
      volume: 1
    });
  });
});
