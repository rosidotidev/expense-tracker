import { Expense } from '../models/expense.model';

const pad = (n: number): string => n.toString().padStart(2, '0');

/** Last day of the given month (month is 0-based), using local date parts. */
function lastDayOf(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** First day of the previous month and last day of the current month, as YYYY-MM-DD (local). */
export function recurringWindow(today: Date): { start: string; end: string } {
  const year = today.getFullYear();
  const month = today.getMonth();
  const prev = new Date(year, month - 1, 1);
  return {
    start: `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-01`,
    end: `${year}-${pad(month + 1)}-${pad(lastDayOf(year, month))}`
  };
}

/**
 * Pure rule for recurring expenses. `expenses` holds only the previous and the current month.
 * Returns the expenses to create in the current month: empty when the current month already
 * has a recurrent expense or the previous month has none.
 */
export function planRecurringCopies(expenses: Expense[], today: Date): Expense[] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const prev = new Date(year, month - 1, 1);

  const currentPrefix = `${year}-${pad(month + 1)}-`;
  const previousPrefix = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-`;

  const current = expenses.filter((e) => e.date.startsWith(currentPrefix));
  if (current.some((e) => e.recurrent === true)) return [];

  const sources = expenses
    .filter((e) => e.date.startsWith(previousPrefix) && e.recurrent === true)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.createdAt - b.createdAt || (a.id ?? '').localeCompare(b.id ?? '')
    );

  const existingIds = new Set(current.map((e) => e.id));
  const lastDay = lastDayOf(year, month);
  const idPrefix = `rec-${year}${pad(month + 1)}-`;

  const copies: Expense[] = [];
  sources.forEach((source, index) => {
    const id = `${idPrefix}${index}`;
    if (existingIds.has(id)) return;
    const day = Math.min(parseInt(source.date.slice(8, 10), 10), lastDay);
    copies.push({
      id,
      who: source.who,
      amount: source.amount,
      date: `${currentPrefix}${pad(day)}`,
      where: source.where,
      category: source.category,
      notes: source.notes,
      uid: source.uid,
      createdAt: today.getTime(),
      recurrent: true
    });
  });
  return copies;
}
