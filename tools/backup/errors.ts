const AUTH_CODES = new Set([
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
  'auth/invalid-email',
]);

export type Stage = 'read' | 'write';

function redact(text: string, secrets: readonly string[]): string {
  return secrets.reduce((result, secret) => (secret ? result.split(secret).join('***') : result), text);
}

export function describeError(stage: Stage, error: unknown, secrets: readonly string[] = []): string {
  const code = (error as { code?: unknown } | null)?.code;
  if (stage === 'read' && typeof code === 'string' && AUTH_CODES.has(code)) {
    return 'Error: authentication failed. Check BACKUP_EMAIL and BACKUP_PASSWORD.';
  }

  const reason = redact(error instanceof Error ? error.message : String(error), secrets);
  return stage === 'read'
    ? `Error: could not read data: ${reason}.`
    : `Error: could not write backup: ${reason}.`;
}

export function noDataMessage(email: string): string {
  return `Error: no data to back up for ${email}.`;
}
