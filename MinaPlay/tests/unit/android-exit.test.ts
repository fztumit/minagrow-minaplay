import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('Android Parent PIN exit contract', () => {
  test('releases lock task before opening the launcher', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'android/app/src/main/java/com/minagrow/minaplay/MinaPlayKioskPlugin.java'),
      'utf8'
    );
    const methodStart = source.indexOf('public void exitToLauncher(PluginCall call)');
    const methodEnd = source.indexOf('private void ensureDeviceOwnerLockTask', methodStart);
    const method = source.slice(methodStart, methodEnd);

    expect(methodStart).toBeGreaterThan(0);
    expect(method).toContain('activity.stopLockTask()');
    expect(method).toContain('Intent.CATEGORY_HOME');
    expect(method).toContain('activity.moveTaskToBack(true)');
    expect(method.indexOf('activity.stopLockTask()')).toBeLessThan(method.indexOf('Intent.CATEGORY_HOME'));
  });
});
