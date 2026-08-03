import { parseReleaseMetadata, requireHttpsUrl, type ReleaseMetadata } from '../modules/release';

interface ReleaseMetadataLoaderOptions {
  sourceUrl: string;
  ttlMs: number;
  fetcher?: typeof fetch;
  now?: () => number;
}

export interface ReleaseMetadataLoader {
  load(): Promise<ReleaseMetadata>;
}

export function createReleaseMetadataLoader(options: ReleaseMetadataLoaderOptions): ReleaseMetadataLoader {
  const sourceUrl = requireHttpsUrl(options.sourceUrl, 'RELEASE_METADATA_URL');
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  const ttlMs = Math.max(0, options.ttlMs);
  let cached: { value: ReleaseMetadata; expiresAt: number } | undefined;

  return {
    async load() {
      const currentTime = now();
      if (cached && cached.expiresAt > currentTime) {
        return cached.value;
      }

      const response = await fetcher(sourceUrl, {
        headers: { Accept: 'application/json' },
        redirect: 'follow',
        signal: AbortSignal.timeout(8_000)
      });
      if (!response.ok) {
        throw new Error(`Release metadata returned HTTP ${response.status}`);
      }
      if (response.url) {
        requireHttpsUrl(response.url, 'Resolved release metadata URL');
      }
      const contentType = response.headers.get('content-type') ?? '';
      const normalizedContentType = contentType.toLowerCase();
      if (!normalizedContentType.includes('application/json') && !normalizedContentType.includes('application/octet-stream')) {
        throw new Error('Release metadata has an unsupported content type');
      }

      const value = parseReleaseMetadata(await response.json());
      cached = { value, expiresAt: currentTime + ttlMs };
      return value;
    }
  };
}
