import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeBackup } from '../storage.ts';

const day = new Date(2026, 9, 3, 12, 0);
let root: string;
let dir: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'backup-test-'));
  dir = join(root, 'backup');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('writeBackup', () => {
  it('creates the folder and the first file', async () => {
    const path = await writeBackup(dir, '{"a":1}', day);
    expect(path).toBe(join(dir, 'bckp-20261003-1.json'));
    expect(await readFile(path, 'utf8')).toBe('{"a":1}');
  });

  it('creates -2 on a second run and leaves the first file unchanged', async () => {
    const first = await writeBackup(dir, 'first', day);
    const second = await writeBackup(dir, 'second', day);
    expect(second).toBe(join(dir, 'bckp-20261003-2.json'));
    expect(await readFile(first, 'utf8')).toBe('first');
    expect(await readFile(second, 'utf8')).toBe('second');
  });

  it('uses the highest existing version plus one', async () => {
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'bckp-20261003-1.json'), 'one');
    await writeFile(join(dir, 'bckp-20261003-3.json'), 'three');
    const path = await writeBackup(dir, 'new', day);
    expect(path).toBe(join(dir, 'bckp-20261003-4.json'));
  });

  it('retries with the next version when the chosen name appears meanwhile', async () => {
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'bckp-20261003-1.json'), 'taken');
    let calls = 0;
    // The first listing is stale (empty), as if another run created -1 just after it.
    const staleThenReal = async (d: string) => (calls++ === 0 ? [] : readdir(d));
    const path = await writeBackup(dir, 'mine', day, staleThenReal);
    expect(calls).toBe(2);
    expect(path).toBe(join(dir, 'bckp-20261003-2.json'));
    expect(await readFile(join(dir, 'bckp-20261003-1.json'), 'utf8')).toBe('taken');
  });

  it('leaves no temp file after a successful write', async () => {
    await writeBackup(dir, 'x', day);
    expect(await readdir(dir)).toEqual(['bckp-20261003-1.json']);
  });

  it('leaves no temp file and no new backup when every attempt fails', async () => {
    // A directory already holds the name the (always empty) listing makes us choose.
    await mkdir(join(dir, 'bckp-20261003-1.json'), { recursive: true });
    await expect(writeBackup(dir, 'x', day, async () => [])).rejects.toThrow();
    expect(await readdir(dir)).toEqual(['bckp-20261003-1.json']);
  });

  it('fails without creating anything when the destination is a file', async () => {
    await writeFile(dir, 'not a folder');
    await expect(writeBackup(dir, 'x', day)).rejects.toThrow();
    expect(await readdir(root)).toEqual(['backup']);
    expect(await readFile(dir, 'utf8')).toBe('not a folder');
  });
});
