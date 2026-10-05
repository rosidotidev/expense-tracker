import { describe, expect, it } from 'vitest';
import { buildBackupDocument, countGroups, formatSummary, hasData } from '../summary.ts';

const userData = {
  expenses: { '-a1': { amount: 1 }, '-a2': { amount: 2 }, '-a3': { amount: 3 } },
  categories: { '-c1': 'Food', '-c2': 'Travel' },
  people: { '-p1': 'Mario' },
};

describe('countGroups', () => {
  it('counts the keys of each group', () => {
    expect(countGroups(userData)).toEqual({ expenses: 3, categories: 2, people: 1 });
  });

  it('counts an absent group as 0', () => {
    expect(countGroups({ people: { '-p1': 'Mario' } })).toEqual({
      expenses: 0,
      categories: 0,
      people: 1,
    });
  });

  it('counts everything as 0 for null data', () => {
    expect(countGroups(null)).toEqual({ expenses: 0, categories: 0, people: 0 });
  });
});

describe('hasData', () => {
  it('is false for null, empty and empty-group data', () => {
    expect(hasData(null)).toBe(false);
    expect(hasData({})).toBe(false);
    expect(hasData({ expenses: {}, categories: {}, people: {} })).toBe(false);
  });

  it('is true when at least one group has data', () => {
    expect(hasData({ people: { '-p1': 'Mario' } })).toBe(true);
    expect(hasData({ categories: { '-c1': 'Food' } })).toBe(true);
    expect(hasData({ expenses: { '-a1': { amount: 1 } } })).toBe(true);
  });
});

describe('buildBackupDocument', () => {
  it('wraps the data under users/<uid> with no extra fields', () => {
    expect(buildBackupDocument('abc123', userData)).toEqual({ users: { abc123: userData } });
    expect(Object.keys(buildBackupDocument('abc123', userData))).toEqual(['users']);
  });

  it('keeps an absent group absent', () => {
    const doc = buildBackupDocument('abc123', { people: { '-p1': 'Mario' } });
    expect(doc.users['abc123']).toEqual({ people: { '-p1': 'Mario' } });
    expect(doc.users['abc123']).not.toHaveProperty('expenses');
  });
});

describe('formatSummary', () => {
  it('prints path, account and the three counts on five lines', () => {
    const text = formatSummary('backup/bckp-20261003-1.json', 'user@example.com', {
      expenses: 123,
      categories: 8,
      people: 3,
    });
    expect(text).toBe(
      [
        'Backup created: backup/bckp-20261003-1.json',
        'Account: user@example.com',
        'Expenses: 123',
        'Categories: 8',
        'People: 3',
      ].join('\n'),
    );
  });
});
