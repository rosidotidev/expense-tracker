import { Expense } from '../models/expense.model';

// '' = all, 'debit' = only on debit, 'settled' = only not on debit
export type DebitFilter = '' | 'debit' | 'settled';

export function matchesDebitFilter(expense: Pick<Expense, 'debit'>, filter: DebitFilter): boolean {
  if (filter === 'debit') return expense.debit === true;
  if (filter === 'settled') return expense.debit !== true;
  return true;
}
