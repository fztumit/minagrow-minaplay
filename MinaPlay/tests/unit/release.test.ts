import { describe, expect, test, vi } from 'vitest';
import {
  isReleaseNewer,
  parseReleaseIdentity,
  parseReleaseMetadata,
  requireHttpsUrl
} from '../../src/modules/release';
import { createReleaseMetadataLoader } from '../../src/services/release-service';

const metadata = {
  channel: 'stable',
  version: '1.0.37',
  versionCode: 38,
  apkUrl: 'https://github.com/fztumit/minagrow-minaplay/releases/download/v1.0.37/minaplay-v1.0.37.apk',
  sha256: 'a'.repeat(64),
  publishedAt: '2026-08-03T12:00:00.000Z'
};

describe('release contract', () => {
  test('parses the bundled stable identity and compares numeric version codes', () => {
    const current = parseReleaseIdentity({
      channel: 'stable',
      version: '1.0.36',
      versionCode: 37,
      metadataUrl: 'https://minagrow-minaplay-production.up.railway.app/api/update'
    });
    const latest = parseReleaseMetadata(metadata);

    expect(isReleaseNewer(latest, current)).toBe(true);
    expect(isReleaseNewer({ versionCode: 37 }, current)).toBe(false);
    expect(latest.sha256).toBe('a'.repeat(64));
  });

  test('rejects insecure URLs and malformed stable metadata', () => {
    expect(() => requireHttpsUrl('http://192.168.1.10/update.apk', 'apkUrl')).toThrow(/HTTPS/);
    expect(() => parseReleaseMetadata({ ...metadata, versionCode: 0 })).toThrow(/versionCode/);
    expect(() => parseReleaseMetadata({ ...metadata, sha256: 'not-a-digest' })).toThrow(/sha256/);
    expect(() => parseReleaseMetadata({ ...metadata, channel: 'beta' })).toThrow(/stable/);
  });

  test('caches only validated metadata for the configured TTL', async () => {
    let now = 1_000;
    const fetcher = vi.fn(async () => new Response(JSON.stringify(metadata), {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' }
    }));
    const loader = createReleaseMetadataLoader({
      sourceUrl: 'https://github.com/example/minaplay-release.json',
      ttlMs: 500,
      fetcher: fetcher as typeof fetch,
      now: () => now
    });

    await expect(loader.load()).resolves.toMatchObject({ versionCode: 38 });
    await expect(loader.load()).resolves.toMatchObject({ version: '1.0.37' });
    expect(fetcher).toHaveBeenCalledTimes(1);

    now = 1_501;
    await loader.load();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  test('does not cache invalid or unavailable metadata', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...metadata, apkUrl: 'http://unsafe.test/app.apk' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify(metadata), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));
    const loader = createReleaseMetadataLoader({
      sourceUrl: 'https://github.com/example/minaplay-release.json',
      ttlMs: 500,
      fetcher: fetcher as typeof fetch
    });

    await expect(loader.load()).rejects.toThrow(/HTTPS/);
    await expect(loader.load()).resolves.toMatchObject({ versionCode: 38 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
