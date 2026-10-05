import { describe, expect, it } from 'vitest';
import { formatMissingMessage, readConfig } from '../config.ts';

const full = {
  BACKUP_EMAIL: 'user@example.com',
  BACKUP_PASSWORD: 'secret',
  FIREBASE_API_KEY: 'key',
  FIREBASE_DATABASE_URL: 'https://example.firebasedatabase.app',
};

describe('readConfig', () => {
  it('returns the config when all four values are set', () => {
    expect(readConfig(full)).toEqual({
      ok: true,
      config: {
        email: 'user@example.com',
        password: 'secret',
        apiKey: 'key',
        databaseUrl: 'https://example.firebasedatabase.app',
      },
    });
  });

  it('treats unset and empty-after-trim values as missing', () => {
    const result = readConfig({ ...full, BACKUP_PASSWORD: '   ', FIREBASE_API_KEY: undefined });
    expect(result).toEqual({ ok: false, missing: ['BACKUP_PASSWORD', 'FIREBASE_API_KEY'] });
  });

  it('lists every missing name, not just the first', () => {
    const result = readConfig({});
    expect(result).toEqual({
      ok: false,
      missing: ['BACKUP_EMAIL', 'BACKUP_PASSWORD', 'FIREBASE_API_KEY', 'FIREBASE_DATABASE_URL'],
    });
  });

  it('never puts values in the missing list', () => {
    const result = readConfig({ BACKUP_EMAIL: 'user@example.com', BACKUP_PASSWORD: 'secret' });
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(JSON.stringify(result)).not.toContain('user@example.com');
  });
});

describe('formatMissingMessage', () => {
  it('names the missing items and where to set them', () => {
    expect(formatMissingMessage(['BACKUP_EMAIL', 'FIREBASE_API_KEY'])).toBe(
      'Error: missing BACKUP_EMAIL, FIREBASE_API_KEY. Set them as environment variables or in tools/backup/.env.',
    );
  });
});
