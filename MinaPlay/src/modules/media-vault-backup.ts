export const MEDIA_VAULT_BACKUP_FORMAT = 'minaplay-media-vault-backup';
export const MEDIA_VAULT_BACKUP_VERSION = 1;

export interface EncryptedMediaVaultPayload {
  version: 1;
  salt: string;
  iv: string;
  data: string;
}

export interface MediaVaultBackup {
  format: typeof MEDIA_VAULT_BACKUP_FORMAT;
  version: typeof MEDIA_VAULT_BACKUP_VERSION;
  exportedAt: string;
  vault: EncryptedMediaVaultPayload;
}

function isBase64(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export function isEncryptedMediaVaultPayload(value: unknown): value is EncryptedMediaVaultPayload {
  const payload = value as Partial<EncryptedMediaVaultPayload> | undefined;
  return payload?.version === 1 && isBase64(payload.salt) && isBase64(payload.iv) && isBase64(payload.data);
}

export function createMediaVaultBackup(vault: EncryptedMediaVaultPayload, exportedAt = new Date().toISOString()): MediaVaultBackup {
  if (!isEncryptedMediaVaultPayload(vault)) {
    throw new Error('invalid-media-vault');
  }

  return {
    format: MEDIA_VAULT_BACKUP_FORMAT,
    version: MEDIA_VAULT_BACKUP_VERSION,
    exportedAt,
    vault: { ...vault }
  };
}

export function parseMediaVaultBackup(value: string | unknown): MediaVaultBackup {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  const backup = parsed as Partial<MediaVaultBackup> | undefined;
  if (
    backup?.format !== MEDIA_VAULT_BACKUP_FORMAT
    || backup.version !== MEDIA_VAULT_BACKUP_VERSION
    || typeof backup.exportedAt !== 'string'
    || Number.isNaN(Date.parse(backup.exportedAt))
    || !isEncryptedMediaVaultPayload(backup.vault)
  ) {
    throw new Error('invalid-media-vault-backup');
  }

  return {
    format: MEDIA_VAULT_BACKUP_FORMAT,
    version: MEDIA_VAULT_BACKUP_VERSION,
    exportedAt: backup.exportedAt,
    vault: { ...backup.vault }
  };
}

export function mediaVaultBackupFileName(date = new Date()): string {
  const datePart = date.toISOString().slice(0, 10);
  return `minaplay-medya-kasasi-${datePart}.json`;
}
