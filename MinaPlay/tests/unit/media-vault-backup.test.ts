import { describe, expect, test } from 'vitest';
import {
  MEDIA_VAULT_BACKUP_FORMAT,
  createMediaVaultBackup,
  mediaVaultBackupFileName,
  parseMediaVaultBackup,
  type EncryptedMediaVaultPayload
} from '../../src/modules/media-vault-backup';

const encryptedVault: EncryptedMediaVaultPayload = {
  version: 1,
  salt: 'c2FsdC1zYWx0LXNhbHQ=',
  iv: 'aXYtaXYtaXYtaXYt',
  data: 'ZW5jcnlwdGVkLW1lZGlh'
};

describe('media vault encrypted backup', () => {
  test('exports only the encrypted vault envelope', () => {
    const backup = createMediaVaultBackup(encryptedVault, '2026-08-03T12:00:00.000Z');
    expect(backup).toEqual({
      format: MEDIA_VAULT_BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-08-03T12:00:00.000Z',
      vault: encryptedVault
    });
    expect(JSON.stringify(backup)).not.toContain('passphrase');
    expect(JSON.stringify(backup)).not.toContain('audioDataUrl');
  });

  test('accepts a valid backup and rejects malformed or plain payloads', () => {
    const backup = createMediaVaultBackup(encryptedVault, '2026-08-03T12:00:00.000Z');
    expect(parseMediaVaultBackup(JSON.stringify(backup))).toEqual(backup);
    expect(() => parseMediaVaultBackup('{"format":"minaplay-media-vault-backup"}')).toThrow('invalid-media-vault-backup');
    expect(() => parseMediaVaultBackup({ ...backup, vault: { version: 1, salt: '', iv: '', data: 'plain text' } })).toThrow(
      'invalid-media-vault-backup'
    );
  });

  test('uses a stable dated backup file name', () => {
    expect(mediaVaultBackupFileName(new Date('2026-08-03T23:59:00.000Z'))).toBe('minaplay-medya-kasasi-2026-08-03.json');
  });
});
