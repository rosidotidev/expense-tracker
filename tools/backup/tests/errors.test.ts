import { describe, expect, it } from 'vitest';
import { describeError, noDataMessage } from '../errors.ts';

const authFailure = 'Error: authentication failed. Check BACKUP_EMAIL and BACKUP_PASSWORD.';

function firebaseError(code: string, message = `Firebase: Error (${code}).`) {
  return Object.assign(new Error(message), { code });
}

describe('describeError (read stage)', () => {
  it.each(['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-email'])(
    'maps %s to the authentication message',
    (code) => {
      expect(describeError('read', firebaseError(code))).toBe(authFailure);
    },
  );

  it('maps other errors to a read failure with the reason', () => {
    expect(describeError('read', new Error('Permission denied'))).toBe(
      'Error: could not read data: Permission denied.',
    );
    expect(describeError('read', firebaseError('auth/network-request-failed', 'Network down'))).toBe(
      'Error: could not read data: Network down.',
    );
  });

  it('handles values that are not Error objects', () => {
    expect(describeError('read', 'boom')).toBe('Error: could not read data: boom.');
  });
});

describe('describeError (write stage)', () => {
  it('maps errors to a write failure with the reason', () => {
    expect(describeError('write', new Error('ENOSPC: no space left'))).toBe(
      'Error: could not write backup: ENOSPC: no space left.',
    );
  });
});

describe('secrets', () => {
  it('never shows the password or the API key', () => {
    const error = new Error('bad request key=KEY123 with pass=PASS456');
    const text = describeError('read', error, ['KEY123', 'PASS456']);
    expect(text).not.toContain('KEY123');
    expect(text).not.toContain('PASS456');
  });
});

describe('noDataMessage', () => {
  it('names the account', () => {
    expect(noDataMessage('user@example.com')).toBe('Error: no data to back up for user@example.com.');
  });
});
