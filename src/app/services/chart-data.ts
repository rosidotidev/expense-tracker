import { Expense } from '../models/expense.model';

export interface ChartFilters {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
  person: string; // '' = all
  category: string; // '' = all
  onlyRecurrent: boolean;
  onlyDebit: boolean;
}

export interface MonthBucket {
  key: string; // YYYY-MM
  label: string;
  total: number;
}

export interface StackedChart {
  months: MonthBucket[];
  series: { name: string; values: number[] }[];
}

export const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

// Local date parts, never toISOString (it converts to UTC and can shift the day).
function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function defaultFilters(today: Date = new Date()): ChartFilters {
  return {
    from: `${today.getFullYear()}-01-01`,
    to: toIsoDate(today),
    person: '',
    category: '',
    onlyRecurrent: false,
    onlyDebit: false
  };
}

export function isValidRange(from: string, to: string): boolean {
  return from !== '' && to !== '' && from <= to;
}

export function filterExpenses(expenses: Expense[], filters: ChartFilters): Expense[] {
  if (!isValidRange(filters.from, filters.to)) return [];
  return expenses.filter(
    (e) =>
      filters.from <= e.date &&
      e.date <= filters.to &&
      (filters.person === '' || e.who === filters.person) &&
      (filters.category === '' || e.category === filters.category) &&
      (!filters.onlyRecurrent || e.recurrent === true) &&
      (!filters.onlyDebit || e.debit === true)
  );
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Calendar months from the month of `from` to the month of `to`, as { year, month (1-12) }.
function monthsInRange(from: string, to: string): { year: number; month: number }[] {
  if (!isValidRange(from, to)) return [];
  const months: { year: number; month: number }[] = [];
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(5, 7));
  const endYear = Number(to.slice(0, 4));
  const endMonth = Number(to.slice(5, 7));
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ year, month });
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return months;
}

export function monthlyTotals(expenses: Expense[], from: string, to: string): MonthBucket[] {
  const months = monthsInRange(from, to);
  if (months.length === 0) return [];
  const spansYears = months[0].year !== months[months.length - 1].year;
  const sums = new Map<string, number>();
  for (const e of expenses) {
    const key = e.date.slice(0, 7);
    sums.set(key, (sums.get(key) ?? 0) + e.amount);
  }
  return months.map(({ year, month }) => {
    const key = `${year}-${pad2(month)}`;
    const name = MONTH_LABELS[month - 1];
    return { key, label: spansYears ? `${name} ${year}` : name, total: round2(sums.get(key) ?? 0) };
  });
}

export function monthlyTotalsBy(
  expenses: Expense[],
  from: string,
  to: string,
  key: 'category' | 'who'
): StackedChart {
  const months = monthlyTotals(expenses, from, to);
  if (months.length === 0) return { months, series: [] };
  const index = new Map(months.map((m, i) => [m.key, i]));
  const byName = new Map<string, number[]>();
  for (const e of expenses) {
    const i = index.get(e.date.slice(0, 7));
    if (i === undefined) continue;
    const values = byName.get(e[key]) ?? months.map(() => 0);
    values[i] += e.amount;
    byName.set(e[key], values);
  }
  const series = Array.from(byName, ([name, values]) => ({ name, values: values.map(round2) }));
  const overall = (values: number[]) => values.reduce((acc, v) => acc + v, 0);
  series.sort((a, b) => overall(b.values) - overall(a.values));
  return { months, series };
}

// Presentation helper: the same data as `stacked`, re-arranged in layers so that in every month
// the largest block is layer 0 (bottom of the bar) and the smallest is the last layer (top).
// Ties keep the overall order of `stacked.series`; zero values come last.
export function rankStacked(stacked: StackedChart): { names: string[]; values: number[] }[] {
  const layers = stacked.series.map(() => ({ names: [] as string[], values: [] as number[] }));
  stacked.months.forEach((_, i) => {
    const ranked = stacked.series
      .map((s, order) => ({ name: s.name, value: s.values[i], order }))
      .sort((a, b) => b.value - a.value || a.order - b.order);
    ranked.forEach((entry, k) => {
      layers[k].names.push(entry.name);
      layers[k].values.push(entry.value);
    });
  });
  return layers;
}

export interface BreakdownEntry {
  name: string;
  amount: number;
  percentage: number; // 0-100, not rounded
  isOther: boolean; // true only for the merged "Other" entry
}

export const OTHER_NAME = 'Altro';
export const SMALL_SLICE_THRESHOLD = 3; // percent

const MISSING_NAME = { category: 'Senza categoria', who: 'Senza persona' };

export function totalsBy(expenses: Expense[], key: 'category' | 'who'): BreakdownEntry[] {
  const sums = new Map<string, number>();
  for (const e of expenses) {
    const name = e[key] || MISSING_NAME[key];
    sums.set(name, (sums.get(name) ?? 0) + e.amount);
  }
  const groups = Array.from(sums, ([name, sum]) => ({ name, amount: round2(sum) })).filter((g) => g.amount > 0);
  const total = groups.reduce((acc, g) => acc + g.amount, 0);
  if (total <= 0) return [];
  return groups
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name))
    .map((g) => ({ ...g, percentage: (g.amount / total) * 100, isOther: false }));
}

// Merges the entries strictly below `threshold` (percent) into one "Other" entry placed last.
// The list is returned unchanged when nothing is small or when only "Other" would remain.
export function groupSmallSlices(entries: BreakdownEntry[], threshold: number): BreakdownEntry[] {
  const isSmall = (e: BreakdownEntry) => e.percentage < threshold - 1e-9;
  const small = entries.filter(isSmall);
  const kept = entries.filter((e) => !isSmall(e));
  if (small.length === 0 || kept.length === 0) return entries;
  const other: BreakdownEntry = {
    name: OTHER_NAME,
    amount: round2(small.reduce((acc, e) => acc + e.amount, 0)),
    percentage: small.reduce((acc, e) => acc + e.percentage, 0),
    isOther: true
  };
  return [...kept, other];
}

// 32-bit FNV-1a of the name: the color depends only on the name and the palette.
export function colorFor(name: string, palette: string[]): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return palette[(hash >>> 0) % palette.length];
}

export function sliceColors(entries: BreakdownEntry[], palette: string[], neutral: string): string[] {
  return entries.map((e) => (e.isOther ? neutral : colorFor(e.name, palette)));
}

// Bounds that make filterExpenses ignore the dates (it returns [] for an empty range).
export const ALL_TIME_FROM = '0000-01-01';
export const ALL_TIME_TO = '9999-12-31';

export interface YearSeries {
  year: number;
  months: (number | null)[]; // 12 entries; null only after the current month of the current year
}

export interface DateRange {
  from: string;
  to: string;
}

export interface RangeSummary {
  total: number;
  monthlyAverage: number;
}

export function yearlyMonthlySeries(expenses: Expense[], today: Date): YearSeries[] {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const byYear = new Map<number, number[]>();
  for (const e of expenses) {
    const year = Number(e.date.slice(0, 4));
    const month = Number(e.date.slice(5, 7));
    const sums = byYear.get(year) ?? new Array<number>(12).fill(0);
    sums[month - 1] += e.amount;
    byYear.set(year, sums);
  }
  return Array.from(byYear, ([year, sums]) => ({
    year,
    months: sums.map((sum, i): number | null => (year === currentYear && i + 1 > currentMonth ? null : round2(sum)))
  })).sort((a, b) => a.year - b.year);
}

export function yearColor(year: number, palette: string[]): string {
  return palette[year % palette.length];
}

export function rangeSummary(expenses: Expense[], from: string, to: string): RangeSummary {
  if (!isValidRange(from, to)) return { total: 0, monthlyAverage: 0 };
  const total = round2(expenses.reduce((acc, e) => acc + e.amount, 0));
  const months = Math.max(
    1,
    (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 + Number(to.slice(5, 7)) - Number(from.slice(5, 7)) + 1
  );
  return { total, monthlyAverage: round2(total / months) };
}

function dayNumber(date: string): number {
  return Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) / 86400000;
}

function fromDayNumber(day: number): string {
  const d = new Date(day * 86400000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

// Same length in days (both ends included), ending the day before `from`. Calendar arithmetic only.
export function previousPeriod(from: string, to: string): DateRange {
  const length = dayNumber(to) - dayNumber(from) + 1;
  const prevTo = dayNumber(from) - 1;
  return { from: fromDayNumber(prevTo - (length - 1)), to: fromDayNumber(prevTo) };
}

export function percentChange(current: number, previous: number): number | null {
  return previous === 0 ? null : ((current - previous) / previous) * 100;
}

export function formatEuro(value: number): string {
  return `€${value.toFixed(2)}`;
}
