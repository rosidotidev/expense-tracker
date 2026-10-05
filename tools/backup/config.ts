export interface Config {
  email: string;
  password: string;
  apiKey: string;
  databaseUrl: string;
}

export type ConfigResult = { ok: true; config: Config } | { ok: false; missing: string[] };

type Env = Record<string, string | undefined>;

const NAMES = {
  email: 'BACKUP_EMAIL',
  password: 'BACKUP_PASSWORD',
  apiKey: 'FIREBASE_API_KEY',
  databaseUrl: 'FIREBASE_DATABASE_URL',
} as const;

export function readConfig(env: Env): ConfigResult {
  const values: Partial<Config> = {};
  const missing: string[] = [];

  for (const [field, name] of Object.entries(NAMES) as [keyof Config, string][]) {
    const value = env[name]?.trim();
    if (value) {
      values[field] = value;
    } else {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true, config: values as Config };
}

export function formatMissingMessage(names: string[]): string {
  return `Error: missing ${names.join(', ')}. Set them as environment variables or in tools/backup/.env.`;
}
