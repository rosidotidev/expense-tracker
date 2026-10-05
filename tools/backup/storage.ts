import { constants } from 'node:fs';
import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { nextBackupFileName } from './naming.ts';

const MAX_ATTEMPTS = 5;

type ListNames = (dir: string) => Promise<string[]>;

export async function writeBackup(
  dir: string,
  content: string,
  now = new Date(),
  listNames: ListNames = readdir,
): Promise<string> {
  await mkdir(dir, { recursive: true });

  // The temp name does not match bckp-YYYYMMDD-N.json, so it never counts as a backup.
  const temp = join(dir, `.bckp-${process.pid}-${Date.now()}.tmp`);
  try {
    await writeFile(temp, content, { flag: 'wx' });

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const path = join(dir, nextBackupFileName(now, await listNames(dir)));
      try {
        await copyFile(temp, path, constants.COPYFILE_EXCL);
        return path;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          // The copy failed midway: remove a possibly partial file we created at the final name.
          await rm(path, { force: true });
          throw error;
        }
      }
    }
    throw new Error(`no free backup name found after ${MAX_ATTEMPTS} attempts`);
  } finally {
    await rm(temp, { force: true });
  }
}
