export type ReleaseChannel = 'stable';

export interface ReleaseIdentity {
  channel: ReleaseChannel;
  version: string;
  versionCode: number;
  metadataUrl: string;
}

export interface ReleaseMetadata {
  channel: ReleaseChannel;
  version: string;
  versionCode: number;
  apkUrl: string;
  sha256: string;
  publishedAt: string;
}

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const SHA256_PATTERN = /^[a-f\d]{64}$/i;

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Release payload must be an object');
  }
  return value as Record<string, unknown>;
}

function stableChannel(value: unknown): ReleaseChannel {
  if (value !== 'stable') {
    throw new Error('Only the stable release channel is supported');
  }
  return value;
}

function version(value: unknown): string {
  if (typeof value !== 'string' || !VERSION_PATTERN.test(value)) {
    throw new Error('Release version must use x.y.z format');
  }
  return value;
}

function versionCode(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new Error('Release versionCode must be a positive integer');
  }
  return value as number;
}

export function requireHttpsUrl(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be an HTTPS URL`);
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be an HTTPS URL`);
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error(`${fieldName} must be an HTTPS URL without credentials`);
  }
  return parsed.href;
}

export function parseReleaseIdentity(value: unknown): ReleaseIdentity {
  const payload = objectValue(value);
  return {
    channel: stableChannel(payload.channel),
    version: version(payload.version),
    versionCode: versionCode(payload.versionCode),
    metadataUrl: requireHttpsUrl(payload.metadataUrl, 'metadataUrl')
  };
}

export function parseReleaseMetadata(value: unknown): ReleaseMetadata {
  const payload = objectValue(value);
  const publishedAt = payload.publishedAt;
  if (typeof publishedAt !== 'string' || !Number.isFinite(Date.parse(publishedAt))) {
    throw new Error('publishedAt must be a valid ISO date');
  }
  if (typeof payload.sha256 !== 'string' || !SHA256_PATTERN.test(payload.sha256)) {
    throw new Error('sha256 must contain a 64-character SHA-256 digest');
  }
  return {
    channel: stableChannel(payload.channel),
    version: version(payload.version),
    versionCode: versionCode(payload.versionCode),
    apkUrl: requireHttpsUrl(payload.apkUrl, 'apkUrl'),
    sha256: payload.sha256.toLowerCase(),
    publishedAt: new Date(publishedAt).toISOString()
  };
}

export function isReleaseNewer(latest: Pick<ReleaseMetadata, 'versionCode'>, current: Pick<ReleaseIdentity, 'versionCode'>): boolean {
  return latest.versionCode > current.versionCode;
}
