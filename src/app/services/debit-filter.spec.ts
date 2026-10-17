import { describe, it, expect } from 'vitest';
import { Expense } from '../models/expense.model';
import { matchesDebitFilter } from './debit-filter';

// Legacy expense: no "debit" key at all
const legacy: Pick<Expense, 'debit'> = {};
const onDebit: Pick<Expense, 'debit'> = { debit: true };

describe('matchesDebitFilter', () => {
  it("default filter ('') matches every expense", () => {
    expect(matchesDebitFilter(legacy, '')).toBe(true);
    expect(matchesDebitFilter(onDebit, '')).toBe(true);
  });

  it("'debit' matches only expenses with debit true, never legacy ones", () => {
    expect(matchesDebitFilter(onDebit, 'debit')).toBe(true);
    expect(matchesDebitFilter(legacy, 'debit')).toBe(false);
  });

  it("'settled' matches legacy expenses and never expenses on debit", () => {
    expect(matchesDebitFilter(legacy, 'settled')).toBe(true);
    expect(matchesDebitFilter(onDebit, 'settled')).toBe(false);
  });

  it('keeps the whole legacy list unchanged with the default filter', () => {
    const list = [legacy, legacy, onDebit];
    expect(list.filter((e) => matchesDebitFilter(e, ''))).toEqual(list);
  });
});
