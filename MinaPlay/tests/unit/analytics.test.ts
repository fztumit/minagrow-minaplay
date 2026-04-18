import { describe, expect, it } from 'vitest';
import { createInitialModuleStats } from '../../src/modules/main';

describe('analytics baseline', () => {
  it('starts module stats from a calm zero state', () => {
    expect(createInitialModuleStats()).toEqual({
      opens: 0,
      actions: 0,
      correct: 0,
      softRedirects: 0
    });
  });
});
