import { describe, expect, it } from 'vitest';
import { nextBackupFileName } from '../naming.ts';

const day = new Date(2026, 9, 3, 15, 30); // 2026-10-03 local time

describe('nextBackupFileName', () => {
  it('starts at 1 when there are no files', () => {
    expect(nextBackupFileName(day, [])).toBe('bckp-20261003-1.json');
  });

  it('adds one to the existing version', () => {
    expect(nextBackupFileName(day, ['bckp-20261003-1.json'])).toBe('bckp-20261003-2.json');
  });

  it('uses the highest existing version plus one when there are gaps', () => {
    const existing = ['bckp-20261003-1.json', 'bckp-20261003-3.json'];
    expect(nextBackupFileName(day, existing)).toBe('bckp-20261003-4.json');
  });

  it('starts again at 1 when only other dates exist', () => {
    expect(nextBackupFileName(day, ['bckp-20261002-5.json'])).toBe('bckp-20261003-1.json');
  });

  it('ignores names that do not match the backup pattern', () => {
    const existing = ['notes.txt', '.bckp-20261003-9.json.tmp', 'bckp-20261003-x.json', 'bckp-20261003-7.json.bak'];
    expect(nextBackupFileName(day, existing)).toBe('bckp-20261003-1.json');
  });

  it('zero-pads month and day', () => {
    expect(nextBackupFileName(new Date(2026, 2, 5), [])).toBe('bckp-20260305-1.json');
  });

  it('uses the local date of the given Date', () => {
    expect(nextBackupFileName(new Date(2026, 11, 31, 23, 59), [])).toBe('bckp-20261231-1.json');
  });
});
