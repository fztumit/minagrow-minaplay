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

  test('increases visible choices at level two and level three without changing the child flow', () => {
    const snapshots: SpeechMachineSnapshot[] = [];
    const machine = new SpeechStateMachine({
      items: () => items,
      onStateChange: (snapshot) => snapshots.push(snapshot)
    });

    machine.start();

    for (let index = 1; index <= 45; index += 1) {
      vi.advanceTimersByTime(1800);
      const round = snapshots.at(-1);
      expect(round?.visibleItemIds).toHaveLength(index > 20 ? (index > 45 ? 5 : 3) : 2);
      machine.submit(round?.targetId ?? '');
      expect(snapshots.at(-1)?.level).toBe(index >= 45 ? 3 : index >= 20 ? 2 : 1);
      vi.advanceTimersByTime(1200);
    }

    vi.advanceTimersByTime(1800);
    expect(snapshots.at(-1)?.level).toBe(3);
    expect(snapshots.at(-1)?.visibleItemIds).toHaveLength(5);
  });

  test('does not pick the same target twice in a row when alternatives exist', () => {
    const snapshots: SpeechMachineSnapshot[] = [];
    const targets: string[] = [];
    const machine = new SpeechStateMachine({
      items: () => items,
      onStateChange: (snapshot) => {
        snapshots.push(snapshot);
        if (snapshot.state === 'targeting' && snapshot.targetId) {
          targets.push(snapshot.targetId);
        }
      }
    });

    machine.start();

    for (let index = 0; index < 8; index += 1) {
      vi.advanceTimersByTime(1800);
      machine.submit(snapshots.at(-1)?.targetId ?? '');
      vi.advanceTimersByTime(1200);
    }

    for (let index = 1; index < targets.length; index += 1) {
      expect(targets[index]).not.toBe(targets[index - 1]);
    }
  });

  test('moves the target to a different visible slot on consecutive rounds', () => {
    const snapshots: SpeechMachineSnapshot[] = [];
    const targetIndexes: number[] = [];
    const machine = new SpeechStateMachine({
      items: () => items,
      onStateChange: (snapshot) => {
        snapshots.push(snapshot);
        if (snapshot.state === 'targeting' && snapshot.targetId) {
          targetIndexes.push(snapshot.visibleItemIds.indexOf(snapshot.targetId));
        }
      }
    });

    machine.start();

    for (let index = 0; index < 8; index += 1) {
      vi.advanceTimersByTime(1800);
      machine.submit(snapshots.at(-1)?.targetId ?? '');
      vi.advanceTimersByTime(1200);
    }

    expect(targetIndexes.length).toBeGreaterThan(2);
    for (let index = 1; index < targetIndexes.length; index += 1) {
      expect(targetIndexes[index]).not.toBe(targetIndexes[index - 1]);
    }
  });

  test('progresses hint levels while keeping the target stable', () => {
    const snapshots: SpeechMachineSnapshot[] = [];
    const hints: number[] = [];
    const machine = new SpeechStateMachine({
      items: () => items,
      waitingMs: 5000,
      hintStepMs: 3000,
      onStateChange: (snapshot) => snapshots.push(snapshot),
      onHint: (event) => hints.push(event.hintLevel)
    });

    machine.start();
    vi.advanceTimersByTime(1800);
    const targetId = snapshots.at(-1)?.targetId;

    vi.advanceTimersByTime(5010);
    expect(snapshots.at(-1)?.state).toBe('hint');
    expect(snapshots.at(-1)?.hintLevel).toBe(1);

    vi.advanceTimersByTime(3010);
    expect(snapshots.at(-1)?.targetId).toBe(targetId);
    expect(snapshots.at(-1)?.hintLevel).toBe(2);

    vi.advanceTimersByTime(3010);
    expect(snapshots.at(-1)?.hintLevel).toBe(3);
    expect(hints).toEqual([1, 2, 3]);
  });

  test('uses the calm 10, 20 and 30 second idle cadence by default', () => {
    const hints: number[] = [];
    const machine = new SpeechStateMachine({
      items: () => items,
      onStateChange: () => undefined,
      onHint: (event) => hints.push(event.hintLevel)
    });

    machine.start();
    vi.advanceTimersByTime(1740);

    vi.advanceTimersByTime(9999);
    expect(hints).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(hints).toEqual([1]);

    vi.advanceTimersByTime(10_000);
    expect(hints).toEqual([1, 2]);

    vi.advanceTimersByTime(10_000);
    expect(hints).toEqual([1, 2, 3]);
  });

  test('stops repeating hint audio after one complete hint sequence', () => {
    const snapshots: SpeechMachineSnapshot[] = [];
    const sounds: string[] = [];
    const machine = new SpeechStateMachine({
      items: () => items,
      waitingMs: 1000,
      hintStepMs: 500,
      onStateChange: (snapshot) => snapshots.push(snapshot),
      onSound: (event) => sounds.push(`${event.intent}:${event.item.id}`)
    });

    machine.start();
    vi.advanceTimersByTime(1800);
    const targetId = snapshots.at(-1)?.targetId;
    expect(sounds).toEqual([`target:${targetId}`]);

    vi.advanceTimersByTime(5000);
    expect(sounds).toEqual([`target:${targetId}`, `hint:${targetId}`, `hint:${targetId}`]);
    expect(snapshots.at(-1)?.state).toBe('waiting');

    vi.advanceTimersByTime(30000);
    expect(sounds).toEqual([`target:${targetId}`, `hint:${targetId}`, `hint:${targetId}`]);
    expect(snapshots.at(-1)?.state).toBe('waiting');
  });

  test('uses adaptive weighting and overall success rate without skipping the calm flow', () => {
    const targets: string[] = [];
    const machine = new SpeechStateMachine({
      items: () => items,
      targetWeight: (item) => (item.id === 'su' ? 8 : 0.2),
      overallSuccessRate: () => 0.8,
      onStateChange: (snapshot) => {
        if (snapshot.state === 'targeting' && snapshot.targetId) {
          targets.push(snapshot.targetId);
        }
      }
    });

    machine.start();
    for (let index = 1; index <= 8; index += 1) {
      vi.advanceTimersByTime(1800);
      machine.submit(targets.at(-1) ?? '');
      expect(machine.snapshot().level).toBe(index >= 8 ? 2 : 1);
      vi.advanceTimersByTime(1200);
    }

    expect(targets).toContain('su');
  });
});
