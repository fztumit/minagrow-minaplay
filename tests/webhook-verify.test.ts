import { describe, expect, it } from 'vitest';
import { verifyWebhookChallenge } from '../src/services/meta';

describe('verifyWebhookChallenge', () => {
  it('dogru mode ve token ile challenge dondurur', () => {
    const result = verifyWebhookChallenge({
      mode: 'subscribe',
      token: 'verify123',
      challenge: 'abc123',
      expectedToken: 'verify123'
    });

    expect(result).toBe('abc123');
  });

  it('token yanlissa null dondurur', () => {
    const result = verifyWebhookChallenge({
      mode: 'subscribe',
      token: 'wrong',
      challenge: 'abc123',
      expectedToken: 'verify123'
    });

    expect(result).toBeNull();
  });
});
