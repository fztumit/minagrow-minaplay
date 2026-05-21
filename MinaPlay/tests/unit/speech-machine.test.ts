import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SpeechStateMachine, type SpeechMachineSnapshot } from '../../src/modules/speech';

const items = [
  { id: 'su', label: 'Su', audio: '/audio/su.mp3' },
  { id: 'baba', label: 'Baba', audio: '/audio/baba.mp3' },
  { id: 'top', label: 'Top', audio: '/audio/top.mp3' },
  { id: 'araba', label: 'Araba', audio: '/audio/araba.mp3' },
  { id: 'elma', label: 'Elma', audio: '/audio/elma.mp3' }
];

describe('SpeechStateMachine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  test('starts with attention, targets one item, waits, and succeeds', () => {
    const snapshots: SpeechMachineSnapshot[] = [];
    const prompts: string[] = [];
    const sounds: string[] = [];
    const machine = new SpeechStateMachine({
      items: () => items,
      onStateChange: (snapshot) => snapshots.push(snapshot),
      onPrompt: (event) => prompts.push(event.text),
      onSound: (event) => sounds.push(`${event.intent}:${event.item.id}`)
    });

    machine.start();
    vi.advanceTimersByTime(370);

    expect(snapshots.at(-1)?.state).toBe('attention');
    expect(prompts).toContain('Bak 😊');

    vi.advanceTimersByTime(630);
    const targeting = snapshots.at(-1);
    expect(targeting?.state).toBe('targeting');
    expect(targeting?.targetId).toBeTruthy();
    expect(targeting?.visibleItemIds).toHaveLength(2);
    expect(sounds.at(-1)).toBe(`target:${targeting?.targetId}`);

    vi.advanceTimersByTime(780);
    expect(snapshots.at(-1)?.state).toBe('waiting');

    machine.submit(targeting?.targetId ?? '');
    expect(snapshots.at(-1)?.state).toBe('success');
    expect(sounds.at(-1)).toBe(`success:${targeting?.targetId}`);
  });

  test('keeps the same target on wrong touch and moves to hint after waiting', () => {
    const snapshots: SpeechMachineSnapshot[] = [];
    const machine = new SpeechStateMachine({
      items: () => items,
      waitingMs: 5000,
      onStateChange: (snapshot) => snapshots.push(snapshot)
    });

    machine.start();
    vi.advanceTimersByTime(1800);
    const targetId = snapshots.at(-1)?.targetId;
    const wrongId = items.find((item) => item.id !== targetId)?.id ?? 'su';

    machine.submit(wrongId);
    expect(snapshots.at(-1)?.state).toBe('retry');
    expect(snapshots.at(-1)?.targetId).toBe(targetId);

    vi.advanceTimersByTime(910);
    expect(snapshots.at(-1)?.state).toBe('waiting');

    vi.advanceTimersByTime(5010);
    expect(snapshots.at(-1)?.state).toBe('hint');
    expect(snapshots.at(-1)?.targetId).toBe(targetId);
  });

  test('keeps level progression calm until twenty correct touches', () => {
    const snapshots: SpeechMachineSnapshot[] = [];
    const machine = new SpeechStateMachine({
      items: () => items,
      onStateChange: (snapshot) => snapshots.push(snapshot)
    });

    machine.start();

    for (let index = 1; index <= 20; index += 1) {
      vi.advanceTimersByTime(1800);
      const targetId = snapshots.at(-1)?.targetId;
      machine.submit(targetId ?? '');
      expect(snapshots.at(-1)?.state).toBe('success');
      expect(snapshots.at(-1)?.level).toBe(index >= 20 ? 2 : 1);
      vi.advanceTimersByTime(1200);
    }
  });
});
