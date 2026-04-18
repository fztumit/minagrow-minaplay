import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

type ExpressStackLayer = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
  };
};

describe('MinaPlay server', () => {
  it('registers the health endpoint', () => {
    const app = createApp({ PORT: 3000 });
    const stack = (app as unknown as { _router?: { stack: ExpressStackLayer[] } })._router?.stack ?? [];

    expect(stack.some((layer) => layer.route?.path === '/health' && layer.route.methods.get)).toBe(true);
  });
});
