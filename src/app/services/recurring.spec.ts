import { describe, it, expect } from 'vitest';
import { Expense } from '../models/expense.model';
import { planRecurringCopies } from './recurring';

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'id-1',
    who: 'Anna',
    amount: 50,
    date: '2026-09-10',
    where: 'Landlord',
    category: 'Casa',
    notes: 'Rent',
    uid: 'u1',
    createdAt: 1000,
    ...overrides
  };
}

// 15 October 2026 (local time)
const TODAY = new Date(2026, 9, 15, 12, 0, 0);

describe('planRecurringCopies', () => {
  it('returns nothing when the current month already has a recurrent expense', () => {
    const expenses = [
      makeExpense({ id: 'a', date: '2026-09-10', recurrent: true }),
      makeExpense({ id: 'b', date: '2026-10-02', recurrent: true })
    ];
    expect(planRecurringCopies(expenses, TODAY)).toEqual([]);
  });

  it('returns nothing when the previous month has no recurrent expenses', () => {
    const expenses = [
      makeExpense({ id: 'a', date: '2026-09-10' }),
      makeExpense({ id: 'b', date: '2026-10-02' })
    ];
    expect(planRecurringCopies(expenses, TODAY)).toEqual([]);
  });

  it('copies a recurrent expense into the current month keeping all fields', () => {
    const source = makeExpense({ id: 'a', date: '2026-09-10', recurrent: true, amount: 700.5, notes: 'n' });
    const [copy, ...rest] = planRecurringCopies([source], TODAY);
    expect(rest).toEqual([]);
    expect(copy).toEqual({
      id: 'rec-202610-0',
      who: 'Anna',
      amount: 700.5,
      date: '2026-10-10',
      where: 'Landlord',
      category: 'Casa',
      notes: 'n',
      uid: 'u1',
      createdAt: TODAY.getTime(),
      recurrent: true
    });
  });

  it('uses the last day of the month when the original day does not exist', () => {
    // 31 August -> September has 30 days
    const sept = new Date(2026, 8, 20);
    const fromAug = planRecurringCopies([makeExpense({ date: '2026-08-31', recurrent: true })], sept);
    expect(fromAug[0].date).toBe('2026-09-30');

    // February, non-leap (2026) and leap (2028)
    const feb2026 = new Date(2026, 1, 5);
    const jan = [
      makeExpense({ id: 'a', date: '2026-01-29', recurrent: true, createdAt: 1 }),
      makeExpense({ id: 'b', date: '2026-01-30', recurrent: true, createdAt: 2 }),
      makeExpense({ id: 'c', date: '2026-01-31', recurrent: true, createdAt: 3 })
    ];
    expect(planRecurringCopies(jan, feb2026).map((c) => c.date)).toEqual([
      '2026-02-28',
      '2026-02-28',
      '2026-02-28'
    ]);

    const feb2028 = new Date(2028, 1, 5);
    const jan2028 = jan.map((e) => ({ ...e, date: e.date.replace('2026', '2028') }));
    expect(planRecurringCopies(jan2028, feb2028).map((c) => c.date)).toEqual([
      '2028-02-29',
      '2028-02-29',
      '2028-02-29'
    ]);
  });

  it('looks at December of the previous year when today is in January', () => {
    const jan = new Date(2027, 0, 3);
    const copies = planRecurringCopies(
      [makeExpense({ date: '2026-12-15', recurrent: true }), makeExpense({ id: 'x', date: '2027-01-01' })],
      jan
    );
    expect(copies).toHaveLength(1);
    expect(copies[0].id).toBe('rec-202701-0');
    expect(copies[0].date).toBe('2027-01-15');
  });

  it('ignores non-recurrent expenses, including legacy ones without the field', () => {
    const expenses = [
      makeExpense({ id: 'a', date: '2026-09-01' }),
      makeExpense({ id: 'b', date: '2026-09-02', recurrent: false }),
      makeExpense({ id: 'c', date: '2026-09-03', recurrent: true, where: 'Gym' })
    ];
    const copies = planRecurringCopies(expenses, TODAY);
    expect(copies).toHaveLength(1);
    expect(copies[0].where).toBe('Gym');
  });

  it('copies again when the flag was removed from every current-month expense, without overwriting existing ids', () => {
    const expenses = [
      makeExpense({ id: 'a', date: '2026-09-10', recurrent: true, createdAt: 1 }),
      makeExpense({ id: 'b', date: '2026-09-12', recurrent: true, createdAt: 2 }),
      // copy of 'a' already in October, flag removed by the user and amount edited
      makeExpense({ id: 'rec-202610-0', date: '2026-10-10', amount: 99 })
    ];
    const copies = planRecurringCopies(expenses, TODAY);
    expect(copies.map((c) => c.id)).toEqual(['rec-202610-1']);
  });

  it('does not copy an expense unflagged in the month that is now the previous one', () => {
    const nov = new Date(2026, 10, 2);
    const expenses = [
      makeExpense({ id: 'rec-202610-0', date: '2026-10-10' }), // unflagged copy
      makeExpense({ id: 'rec-202610-1', date: '2026-10-12', recurrent: true, where: 'Gym' })
    ];
    const copies = planRecurringCopies(expenses, nov);
    expect(copies.map((c) => c.where)).toEqual(['Gym']);
  });

  it('builds deterministic ids ordered by date, createdAt and id', () => {
    const a = makeExpense({ id: 'z', date: '2026-09-20', createdAt: 5, recurrent: true, where: 'third' });
    const b = makeExpense({ id: 'b', date: '2026-09-05', createdAt: 9, recurrent: true, where: 'second' });
    const c = makeExpense({ id: 'a', date: '2026-09-05', createdAt: 9, recurrent: true, where: 'first' });
    const d = makeExpense({ id: 'q', date: '2026-09-05', createdAt: 1, recurrent: true, where: 'zero' });

    const one = planRecurringCopies([a, b, c, d], TODAY);
    const two = planRecurringCopies([d, c, b, a], TODAY);

    expect(one.map((x) => x.id)).toEqual([
      'rec-202610-0',
      'rec-202610-1',
      'rec-202610-2',
      'rec-202610-3'
    ]);
    expect(one.map((x) => x.where)).toEqual(['zero', 'first', 'second', 'third']);
    expect(two).toEqual(one);
  });

  it('does not mutate its input', () => {
    const expenses = [
      makeExpense({ id: 'b', date: '2026-09-20', recurrent: true }),
      makeExpense({ id: 'a', date: '2026-09-05', recurrent: true })
    ];
    const snapshot = JSON.parse(JSON.stringify(expenses));
    planRecurringCopies(expenses, TODAY);
    expect(expenses).toEqual(snapshot);
  });
});
