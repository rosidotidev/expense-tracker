import { join } from 'node:path';
import { formatMissingMessage, readConfig } from './config.ts';
import { describeError, noDataMessage } from './errors.ts';
import { fetchUserData, type FetchedUser } from './firebase.ts';
import { writeBackup } from './storage.ts';
import { buildBackupDocument, countGroups, formatSummary, hasData } from './summary.ts';

function fail(message: string): number {
  console.error(message);
  return 1;
}

async function main(): Promise<number> {
  try {
    // The .env file lives next to this script, whatever the current working directory is.
    process.loadEnvFile(join(__dirname, '.env'));
  } catch {
    // No .env file: environment variables alone are fine.
  }

  const result = readConfig(process.env);
  if (!result.ok) {
    return fail(formatMissingMessage(result.missing));
  }
  const { config } = result;
  const secrets = [config.password, config.apiKey];

  let user: FetchedUser;
  try {
    user = await fetchUserData(config);
  } catch (error) {
    return fail(describeError('read', error, secrets));
  }
  if (!hasData(user.data)) {
    return fail(noDataMessage(user.email));
  }

  let path: string;
  try {
    const document = buildBackupDocument(user.uid, user.data ?? {});
    path = await writeBackup('backup', JSON.stringify(document, null, 2));
  } catch (error) {
    return fail(describeError('write', error, secrets));
  }

  console.log(formatSummary(path.replaceAll('\\', '/'), user.email, countGroups(user.data)));
  return 0;
}

main().then((code) => {
  process.exitCode = code;
  // The Firebase SDK leaves timers running after deleteApp, which would keep the process alive.
  // Exit explicitly, once pending output has been flushed.
  process.stderr.write('', () => process.stdout.write('', () => process.exit()));
});
