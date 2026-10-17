import { describe, it, expect } from 'vitest';
import { Expense } from '../models/expense.model';
import {
  ALL_TIME_FROM,
  ALL_TIME_TO,
  BreakdownEntry,
  colorFor,
  defaultFilters,
  filterExpenses,
  groupSmallSlices,
  isValidRange,
  monthlyTotals,
  monthlyTotalsBy,
  percentChange,
  previousPeriod,
  rangeSummary,
  rankStacked,
  sliceColors,
  totalsBy,
  yearColor,
  yearlyMonthlySeries
} from './chart-data';

function exp(date: string, amount: number, extra: Partial<Expense> = {}): Expense {
  return { who: 'Anna', amount, date, where: 'Shop', category: 'Cibo', notes: '', uid: 'u', createdAt: 0, ...extra };
}

const filters = (over: Partial<ReturnType<typeof defaultFilters>> = {}) => ({
  ...defaultFilters(new Date(2026, 9, 17)),
  ...over
});

describe('defaultFilters', () => {
  it('starts on 1 January of the current year and ends today (local date parts)', () => {
    const f = defaultFilters(new Date(2026, 9, 17));
    expect(f.from).toBe('2026-01-01');
    expect(f.to).toBe('2026-10-17');
    expect(f.person).toBe('');
    expect(f.category).toBe('');
    expect(f.onlyRecurrent).toBe(false);
    expect(f.onlyDebit).toBe(false);
  });

  it('does not shift the day around midnight', () => {
    expect(defaultFilters(new Date(2026, 0, 1, 0, 5)).to).toBe('2026-01-01');
    expect(defaultFilters(new Date(2026, 11, 31, 23, 55)).to).toBe('2026-12-31');
  });
});

describe('isValidRange', () => {
  it('accepts equal dates and ordered ranges', () => {
    expect(isValidRange('2026-03-01', '2026-03-01')).toBe(true);
    expect(isValidRange('2026-01-01', '2026-10-17')).toBe(true);
  });

  it('rejects inverted ranges and empty values', () => {
    expect(isValidRange('2026-05-02', '2026-05-01')).toBe(false);
    expect(isValidRange('', '2026-05-01')).toBe(false);
    expect(isValidRange('2026-05-01', '')).toBe(false);
  });
});

describe('filterExpenses - date range', () => {
  const list = [
    exp('2026-02-28', 1),
    exp('2026-03-01', 2),
    exp('2026-03-15', 3),
    exp('2026-03-31', 4),
    exp('2026-04-01', 5)
  ];

  it('is inclusive on both ends', () => {
    const out = filterExpenses(list, filters({ from: '2026-03-01', to: '2026-03-31' }));
    expect(out.map((e) => e.date)).toEqual(['2026-03-01', '2026-03-15', '2026-03-31']);
  });

  it('returns an empty list for an inverted range', () => {
    expect(filterExpenses(list, filters({ from: '2026-04-01', to: '2026-03-01' }))).toEqual([]);
  });

  it('does not mutate the input', () => {
    const copy = JSON.parse(JSON.stringify(list));
    filterExpenses(list, filters({ from: '2026-03-01', to: '2026-03-31' }));
    expect(list).toEqual(copy);
  });
});

describe('monthlyTotals', () => {
  it('returns one bucket per month including empty months', () => {
    const out = monthlyTotals([exp('2026-01-10', 10), exp('2026-03-05', 5)], '2026-01-01', '2026-04-30');
    expect(out.map((b) => b.key)).toEqual(['2026-01', '2026-02', '2026-03', '2026-04']);
    expect(out.map((b) => b.total)).toEqual([10, 0, 5, 0]);
    expect(out.map((b) => b.label)).toEqual(['Gen', 'Feb', 'Mar', 'Apr']);
  });

  it('returns a single bucket for a range inside one month', () => {
    const out = monthlyTotals([exp('2026-05-10', 7)], '2026-05-03', '2026-05-20');
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ key: '2026-05', label: 'Mag', total: 7 });
  });

  it('adds the year to the labels when the range crosses a year boundary', () => {
    const out = monthlyTotals([], '2025-11-15', '2026-02-10');
    expect(out.map((b) => b.label)).toEqual(['Nov 2025', 'Dic 2025', 'Gen 2026', 'Feb 2026']);
    expect(out.map((b) => b.key)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  it('keeps plain labels when the range stays inside one year', () => {
    const out = monthlyTotals([], '2026-01-01', '2026-12-31');
    expect(out).toHaveLength(12);
    expect(out[0].label).toBe('Gen');
    expect(out[11].label).toBe('Dic');
  });

  it('sums decimal amounts exactly (rounded to 2 decimals)', () => {
    const out = monthlyTotals([exp('2026-01-01', 0.1), exp('2026-01-02', 0.2)], '2026-01-01', '2026-01-31');
    expect(out[0].total).toBe(0.3);
  });

  it('returns no buckets for an inverted range', () => {
    expect(monthlyTotals([exp('2026-01-01', 1)], '2026-02-01', '2026-01-01')).toEqual([]);
  });

  it('does not mutate the input', () => {
    const list = [exp('2026-01-01', 1)];
    const copy = JSON.parse(JSON.stringify(list));
    monthlyTotals(list, '2026-01-01', '2026-01-31');
    expect(list).toEqual(copy);
  });
});

describe('filterExpenses - person and category', () => {
  const list = [
    exp('2026-02-01', 1, { who: 'Anna', category: 'Cibo' }),
    exp('2026-02-02', 2, { who: 'Marco', category: 'Cibo' }),
    exp('2026-02-03', 3, { who: 'Anna', category: 'Casa' }),
    exp('2026-02-04', 4, { who: 'Ex Persona', category: 'Vecchia' })
  ];

  it('keeps only the selected person', () => {
    expect(filterExpenses(list, filters({ person: 'Anna' })).map((e) => e.amount)).toEqual([1, 3]);
  });

  it('keeps only the selected category', () => {
    expect(filterExpenses(list, filters({ category: 'Cibo' })).map((e) => e.amount)).toEqual([1, 2]);
  });

  it('combines person and category', () => {
    expect(filterExpenses(list, filters({ person: 'Anna', category: 'Cibo' })).map((e) => e.amount)).toEqual([1]);
  });

  it('keeps everything when person and category are empty, including names no longer in any list', () => {
    expect(filterExpenses(list, filters())).toHaveLength(4);
  });
});

describe('filterExpenses - recurring and debit flags', () => {
  const legacy = exp('2026-03-01', 1);
  const recurrent = exp('2026-03-02', 2, { recurrent: true });
  const debit = exp('2026-03-03', 3, { debit: true });
  const both = exp('2026-03-04', 4, { recurrent: true, debit: true });
  const list = [legacy, recurrent, debit, both];

  it('keeps flagged and unflagged expenses when both flags are off', () => {
    expect(filterExpenses(list, filters())).toHaveLength(4);
  });

  it('onlyRecurrent keeps only recurrent expenses', () => {
    expect(filterExpenses(list, filters({ onlyRecurrent: true })).map((e) => e.amount)).toEqual([2, 4]);
  });

  it('onlyDebit keeps only expenses on debit', () => {
    expect(filterExpenses(list, filters({ onlyDebit: true })).map((e) => e.amount)).toEqual([3, 4]);
  });

  it('both flags on keeps only expenses with both', () => {
    expect(filterExpenses(list, filters({ onlyRecurrent: true, onlyDebit: true })).map((e) => e.amount)).toEqual([4]);
  });

  it('a legacy expense without the flag keys is kept with the flags off and excluded with either on', () => {
    expect('recurrent' in legacy).toBe(false);
    expect('debit' in legacy).toBe(false);
    expect(filterExpenses([legacy], filters())).toHaveLength(1);
    expect(filterExpenses([legacy], filters({ onlyRecurrent: true }))).toHaveLength(0);
    expect(filterExpenses([legacy], filters({ onlyDebit: true }))).toHaveLength(0);
  });
});

describe('monthlyTotalsBy', () => {
  const list = [
    exp('2026-01-05', 10.1, { who: 'Anna', category: 'Cibo' }),
    exp('2026-01-20', 20.2, { who: 'Marco', category: 'Casa' }),
    exp('2026-03-03', 5.05, { who: 'Anna', category: 'Cibo' }),
    exp('2026-03-04', 100, { who: 'Ex Persona', category: 'Vecchia' })
  ];

  for (const key of ['category', 'who'] as const) {
    it(`series values add up to the monthly total (key ${key})`, () => {
      const out = monthlyTotalsBy(list, '2026-01-01', '2026-03-31', key);
      out.months.forEach((m, i) => {
        const sum = Math.round(out.series.reduce((acc, s) => acc + s.values[i], 0) * 100) / 100;
        expect(sum).toBe(m.total);
      });
    });
  }

  it('creates one series per distinct value found, ordered by overall total descending', () => {
    const out = monthlyTotalsBy(list, '2026-01-01', '2026-03-31', 'category');
    expect(out.series.map((s) => s.name)).toEqual(['Vecchia', 'Casa', 'Cibo']);
  });

  it('counts names that are not in any list', () => {
    const out = monthlyTotalsBy(list, '2026-01-01', '2026-03-31', 'who');
    expect(out.series.find((s) => s.name === 'Ex Persona')?.values).toEqual([0, 0, 100]);
  });

  it('gives 0 in every series for an empty month', () => {
    const out = monthlyTotalsBy(list, '2026-01-01', '2026-03-31', 'who');
    expect(out.months.map((m) => m.total)).toEqual([30.3, 0, 105.05]);
    out.series.forEach((s) => expect(s.values[1]).toBe(0));
  });

  it('uses the same months as monthlyTotals', () => {
    const out = monthlyTotalsBy(list, '2026-01-01', '2026-03-31', 'who');
    expect(out.months).toEqual(monthlyTotals(list, '2026-01-01', '2026-03-31'));
  });

  it('returns empty months and series for an inverted range', () => {
    expect(monthlyTotalsBy(list, '2026-03-01', '2026-01-01', 'who')).toEqual({ months: [], series: [] });
  });
});

describe('rankStacked', () => {
  // January: Casa is the biggest. March: Cibo is the biggest. Same names, different order.
  const list = [
    exp('2026-01-05', 10, { category: 'Cibo' }),
    exp('2026-01-06', 30, { category: 'Casa' }),
    exp('2026-01-07', 20, { category: 'Svago' }),
    exp('2026-03-05', 50, { category: 'Cibo' }),
    exp('2026-03-06', 5, { category: 'Casa' })
  ];
  const stacked = monthlyTotalsBy(list, '2026-01-01', '2026-03-31', 'category');

  it('orders the blocks of each month by that month value, largest first (bottom)', () => {
    const layers = rankStacked(stacked);
    expect(layers.map((l) => l.names[0])).toEqual(['Casa', 'Svago', 'Cibo']);
    expect(layers.map((l) => l.values[0])).toEqual([30, 20, 10]);
    expect(layers.map((l) => l.names[2])).toEqual(['Cibo', 'Casa', 'Svago']);
    expect(layers.map((l) => l.values[2])).toEqual([50, 5, 0]);
  });

  it('gives a different bottom block in months where the biggest name differs', () => {
    const layers = rankStacked(stacked);
    expect(layers[0].names[0]).not.toBe(layers[0].names[2]);
  });

  it('puts entries with value 0 after every entry above 0', () => {
    const layers = rankStacked(stacked);
    // February has no expenses: every value is 0
    expect(layers.map((l) => l.values[1])).toEqual([0, 0, 0]);
    // March: Svago is 0 and is last
    expect(layers[2].names[2]).toBe('Svago');
  });

  it('keeps the overall series order for equal values (stable tie-break)', () => {
    const tie = monthlyTotalsBy(
      [exp('2026-01-01', 10, { category: 'A' }), exp('2026-01-02', 10, { category: 'B' }), exp('2026-01-03', 40, { category: 'C' })],
      '2026-01-01',
      '2026-01-31',
      'category'
    );
    const overall = tie.series.map((s) => s.name); // C, A, B
    const layers = rankStacked(tie);
    expect(layers.map((l) => l.names[0])).toEqual(overall);
  });

  it('layer values add up to the month total, with one layer per series', () => {
    const layers = rankStacked(stacked);
    expect(layers).toHaveLength(stacked.series.length);
    stacked.months.forEach((m, i) => {
      const sum = Math.round(layers.reduce((acc, l) => acc + l.values[i], 0) * 100) / 100;
      expect(sum).toBe(m.total);
    });
  });

  it('returns no layers when there are no series', () => {
    expect(rankStacked({ months: [], series: [] })).toEqual([]);
  });

  it('does not mutate the input', () => {
    const copy = JSON.parse(JSON.stringify(stacked));
    rankStacked(stacked);
    expect(stacked).toEqual(copy);
  });
});

describe('totalsBy', () => {
  const sample = [
    exp('2026-01-05', 10, { category: 'Casa', who: 'Anna' }),
    exp('2026-01-06', 30, { category: 'Cibo', who: 'Marco' }),
    exp('2026-01-07', 20.5, { category: 'Cibo', who: 'Anna' }),
    exp('2026-01-08', 39.5, { category: 'Svago', who: 'Anna' })
  ];

  it('sorts by amount descending and sums amounts per name', () => {
    const entries = totalsBy(sample, 'category');
    expect(entries.map((e) => e.name)).toEqual(['Cibo', 'Svago', 'Casa']);
    expect(entries.map((e) => e.amount)).toEqual([50.5, 39.5, 10]);
  });

  it('percentages add up to about 100 and amounts to the input total', () => {
    const entries = totalsBy(sample, 'who');
    expect(entries.reduce((a, e) => a + e.percentage, 0)).toBeCloseTo(100, 6);
    expect(entries.reduce((a, e) => a + e.amount, 0)).toBeCloseTo(100, 6);
  });

  it('breaks ties by name', () => {
    const entries = totalsBy([exp('2026-01-01', 5, { category: 'B' }), exp('2026-01-02', 5, { category: 'A' })], 'category');
    expect(entries.map((e) => e.name)).toEqual(['A', 'B']);
  });

  it('keeps a single entry at 100%', () => {
    const entries = totalsBy([exp('2026-01-01', 12, { who: 'Anna' })], 'who');
    expect(entries).toHaveLength(1);
    expect(entries[0].percentage).toBeCloseTo(100, 6);
    expect(entries[0].isOther).toBe(false);
  });

  it('counts names missing from any list under the stored name', () => {
    expect(totalsBy([exp('2026-01-01', 7, { category: 'Vecchia categoria' })], 'category')[0].name).toBe('Vecchia categoria');
    expect(totalsBy([exp('2026-01-01', 7, { who: 'Ex persona' })], 'who')[0].name).toBe('Ex persona');
  });

  it('uses a fallback label for empty names', () => {
    expect(totalsBy([exp('2026-01-01', 7, { category: '' })], 'category')[0].name).toBe('Senza categoria');
    expect(totalsBy([exp('2026-01-01', 7, { who: '' })], 'who')[0].name).toBe('Senza persona');
  });

  it('returns an empty list for empty input and does not mutate it', () => {
    expect(totalsBy([], 'category')).toEqual([]);
    const copy = JSON.stringify(sample);
    totalsBy(sample, 'category');
    expect(JSON.stringify(sample)).toBe(copy);
  });
});

describe('groupSmallSlices', () => {
  const entriesOf = (amounts: number[]): BreakdownEntry[] =>
    totalsBy(
      amounts.map((a, i) => exp('2026-01-01', a, { category: `C${i}` })),
      'category'
    );

  it('merges entries below the threshold into one Other entry placed last', () => {
    const result = groupSmallSlices(entriesOf([50, 40, 6, 2, 2]), 3);
    expect(result.map((e) => e.name)).toEqual(['C0', 'C1', 'C2', 'Altro']);
    const other = result[3];
    expect(other.isOther).toBe(true);
    expect(other.amount).toBe(4);
    expect(other.percentage).toBeCloseTo(4, 6);
  });

  it('leaves the list unchanged when nothing is below the threshold', () => {
    const entries = entriesOf([50, 30, 20]);
    expect(groupSmallSlices(entries, 3)).toBe(entries);
  });

  it('does not merge when only Other would remain', () => {
    const entries = entriesOf(Array.from({ length: 40 }, () => 1));
    expect(groupSmallSlices(entries, 3)).toBe(entries);
  });

  it('does not merge an entry exactly at the threshold', () => {
    const entries = entriesOf([97, 3]);
    expect(groupSmallSlices(entries, 3)).toBe(entries);
  });

  it('turns a single small entry into Other', () => {
    const result = groupSmallSlices(entriesOf([60, 38, 2]), 3);
    expect(result.map((e) => e.name)).toEqual(['C0', 'C1', 'Altro']);
    expect(result[2].amount).toBe(2);
  });

  it('does not mutate the input and does not treat a real "Altro" as the merged entry', () => {
    const entries = totalsBy(
      [
        exp('2026-01-01', 90, { category: 'Altro' }),
        exp('2026-01-02', 8, { category: 'Casa' }),
        exp('2026-01-03', 2, { category: 'Svago' })
      ],
      'category'
    );
    const copy = JSON.stringify(entries);
    const result = groupSmallSlices(entries, 3);
    expect(JSON.stringify(entries)).toBe(copy);
    expect(result[0]).toMatchObject({ name: 'Altro', isOther: false });
    expect(result[2]).toMatchObject({ name: 'Altro', isOther: true });
  });
});

describe('colorFor and sliceColors', () => {
  const palette = ['#1', '#2', '#3', '#4', '#5'];
  const names = ['Cibo', 'Casa', 'Svago', 'Trasporti', 'Salute', 'Anna', 'Marco'];

  it('gives the same color to the same name regardless of order', () => {
    const first = names.map((n) => colorFor(n, palette));
    const reversed = [...names].reverse().map((n) => colorFor(n, palette)).reverse();
    expect(reversed).toEqual(first);
  });

  it('always returns a palette color', () => {
    for (const n of [...names, '', 'x'.repeat(200)]) expect(palette).toContain(colorFor(n, palette));
  });

  it('gives Other the neutral color and never gives it to a normal entry', () => {
    const entries = groupSmallSlices(
      totalsBy(
        [
          exp('2026-01-01', 90, { category: 'Cibo' }),
          exp('2026-01-02', 8, { category: 'Casa' }),
          exp('2026-01-03', 2, { category: 'Svago' })
        ],
        'category'
      ),
      3
    );
    const colors = sliceColors(entries, palette, '#neutral');
    expect(colors[colors.length - 1]).toBe('#neutral');
    expect(colors.slice(0, -1)).not.toContain('#neutral');
  });

  it('does not depend on the other entries of the list', () => {
    const all = totalsBy([exp('2026-01-01', 5, { category: 'Cibo' }), exp('2026-01-02', 9, { category: 'Casa' })], 'category');
    const only = totalsBy([exp('2026-01-01', 5, { category: 'Cibo' })], 'category');
    const cibo = sliceColors(all, palette, '#n')[all.findIndex((e) => e.name === 'Cibo')];
    expect(sliceColors(only, palette, '#n')[0]).toBe(cibo);
  });

  it('gives a real category named Altro a palette color, not the neutral one', () => {
    const entries = totalsBy([exp('2026-01-01', 5, { category: 'Altro' })], 'category');
    expect(palette).toContain(sliceColors(entries, palette, '#neutral')[0]);
  });
});

describe('yearlyMonthlySeries', () => {
  const today = new Date(2026, 9, 17); // October 2026

  it('gives one entry with 12 monthly totals for a single year', () => {
    const series = yearlyMonthlySeries([exp('2025-02-10', 10), exp('2025-02-20', 5), exp('2025-12-01', 7)], today);
    expect(series).toHaveLength(1);
    expect(series[0].year).toBe(2025);
    expect(series[0].months).toHaveLength(12);
    expect(series[0].months[1]).toBe(15);
    expect(series[0].months[11]).toBe(7);
  });

  it('gives one entry per year, sorted ascending', () => {
    const series = yearlyMonthlySeries([exp('2026-01-05', 1), exp('2024-03-05', 2), exp('2025-03-05', 3)], today);
    expect(series.map((s) => s.year)).toEqual([2024, 2025, 2026]);
  });

  it('uses 0, not null, for the empty months of a past year', () => {
    const [s] = yearlyMonthlySeries([exp('2025-03-05', 10)], today);
    expect(s.months.filter((m) => m === null)).toHaveLength(0);
    expect(s.months[0]).toBe(0);
    expect(s.months[2]).toBe(10);
    expect(s.months[11]).toBe(0);
  });

  it('stops the current year at the current month with null, never 0', () => {
    const [s] = yearlyMonthlySeries([exp('2026-01-05', 10)], today);
    expect(s.months.slice(0, 10).every((m) => typeof m === 'number')).toBe(true);
    expect(s.months[9]).toBe(0);
    expect(s.months[10]).toBeNull();
    expect(s.months[11]).toBeNull();
  });

  it('does not count expenses dated after the current month of the current year', () => {
    const [s] = yearlyMonthlySeries([exp('2026-10-01', 4), exp('2026-12-25', 99)], today);
    expect(s.months[9]).toBe(4);
    expect(s.months[11]).toBeNull();
  });

  it('rounds the totals to cents', () => {
    const [s] = yearlyMonthlySeries([exp('2025-01-01', 0.1), exp('2025-01-02', 0.2)], today);
    expect(s.months[0]).toBe(0.3);
  });

  it('counts legacy expenses without recurrent or debit keys', () => {
    const legacy = exp('2025-05-05', 12);
    delete legacy.recurrent;
    delete legacy.debit;
    expect(yearlyMonthlySeries([legacy], today)[0].months[4]).toBe(12);
  });

  it('returns [] for empty input and does not mutate it', () => {
    expect(yearlyMonthlySeries([], today)).toEqual([]);
    const input = [exp('2025-05-05', 12), exp('2024-05-05', 3)];
    const copy = JSON.parse(JSON.stringify(input));
    yearlyMonthlySeries(input, today);
    expect(input).toEqual(copy);
  });
});

describe('yearColor', () => {
  const palette = ['#a', '#b', '#c', '#d', '#e'];

  it('is palette[year % length]', () => {
    expect(yearColor(2026, palette)).toBe(palette[2026 % palette.length]);
  });

  it('never shares a color between years closer than the palette length', () => {
    for (let y = 2020; y < 2030; y++) {
      for (let d = 1; d < palette.length; d++) {
        expect(yearColor(y, palette)).not.toBe(yearColor(y + d, palette));
      }
    }
  });
});

describe('yearly series with filters (dates ignored)', () => {
  const today = new Date(2026, 9, 17);
  const build = (over: Partial<ReturnType<typeof filters>>, data: Expense[]) =>
    yearlyMonthlySeries(filterExpenses(data, { ...filters(over), from: ALL_TIME_FROM, to: ALL_TIME_TO }), today);
  const data = [
    exp('2025-02-01', 10, { who: 'Anna', category: 'Cibo', recurrent: true, debit: true }),
    exp('2025-02-02', 20, { who: 'Luca', category: 'Casa', recurrent: true }),
    exp('2026-03-02', 40, { who: 'Anna', category: 'Casa', debit: true }),
    exp('2026-04-02', 80, { who: 'Anna', category: 'Cibo' }),
    exp('2024-06-02', 5, { who: 'Anna', category: 'Cibo' })
  ];
  const sum = (s: ReturnType<typeof build>) => s.map((y) => y.months.reduce<number>((a, m) => a + (m ?? 0), 0));

  it('gives the same series whatever the dates are', () => {
    const base = build({}, data);
    expect(build({ from: '2026-10-01', to: '2026-10-01' }, data)).toEqual(base);
    expect(build({ from: '2026-12-31', to: '2026-01-01' }, data)).toEqual(base);
    expect(build({ from: '', to: '' }, data)).toEqual(base);
  });

  it('applies the person filter in every year', () => {
    expect(sum(build({ person: 'Luca' }, data))).toEqual([20]);
    expect(sum(build({ person: 'Anna' }, data))).toEqual([5, 10, 120]);
  });

  it('applies the category filter', () => {
    expect(sum(build({ category: 'Casa' }, data))).toEqual([20, 40]);
  });

  it('applies the recurring and debit flags, alone and together', () => {
    expect(sum(build({ onlyRecurrent: true }, data))).toEqual([30]);
    expect(sum(build({ onlyDebit: true }, data))).toEqual([10, 40]);
    expect(sum(build({ onlyRecurrent: true, onlyDebit: true }, data))).toEqual([10]);
  });

  it('excludes legacy expenses without flags only when a flag filter is on', () => {
    const legacy = exp('2025-05-05', 12);
    delete legacy.recurrent;
    delete legacy.debit;
    expect(sum(build({}, [legacy]))).toEqual([12]);
    expect(build({ onlyRecurrent: true }, [legacy])).toEqual([]);
    expect(build({ onlyDebit: true }, [legacy])).toEqual([]);
  });

  it('gives [] when nothing matches', () => {
    expect(build({ person: 'Nobody' }, data)).toEqual([]);
  });
});

describe('rangeSummary', () => {
  it('equals the total for a range of one full month', () => {
    const r = rangeSummary([exp('2026-03-05', 100)], '2026-03-01', '2026-03-31');
    expect(r).toEqual({ total: 100, monthlyAverage: 100 });
  });

  it('counts a partial month as one month (15 Jan - 3 Mar = 3 months)', () => {
    const r = rangeSummary([exp('2026-01-20', 100), exp('2026-03-02', 50)], '2026-01-15', '2026-03-03');
    expect(r.total).toBe(150);
    expect(r.monthlyAverage).toBe(50);
  });

  it('counts both months of a range crossing a year boundary', () => {
    const r = rangeSummary([exp('2025-12-10', 90), exp('2026-01-10', 30)], '2025-12-01', '2026-01-31');
    expect(r.monthlyAverage).toBe(60);
  });

  it('counts a range inside one month, even one day, as one month', () => {
    expect(rangeSummary([exp('2026-03-05', 10)], '2026-03-05', '2026-03-05').monthlyAverage).toBe(10);
  });

  it('rounds to cents', () => {
    const r = rangeSummary([exp('2026-01-05', 10)], '2026-01-01', '2026-03-31');
    expect(r.monthlyAverage).toBe(3.33);
  });

  it('gives zeros for an invalid range', () => {
    expect(rangeSummary([exp('2026-01-05', 10)], '', '')).toEqual({ total: 0, monthlyAverage: 0 });
    expect(rangeSummary([exp('2026-01-05', 10)], '2026-02-01', '2026-01-01')).toEqual({ total: 0, monthlyAverage: 0 });
  });

  it('gives zeros for empty input', () => {
    expect(rangeSummary([], '2026-01-01', '2026-10-17')).toEqual({ total: 0, monthlyAverage: 0 });
  });
});

describe('previousPeriod', () => {
  it('handles a range of 1 day', () => {
    expect(previousPeriod('2026-03-15', '2026-03-15')).toEqual({ from: '2026-03-14', to: '2026-03-14' });
  });

  it('handles a range of 30 days', () => {
    expect(previousPeriod('2026-04-01', '2026-04-30')).toEqual({ from: '2026-03-02', to: '2026-03-31' });
  });

  it('handles a full year', () => {
    expect(previousPeriod('2026-01-01', '2026-12-31')).toEqual({ from: '2025-01-01', to: '2025-12-31' });
  });

  it('crosses a year boundary backwards', () => {
    expect(previousPeriod('2026-01-01', '2026-01-10')).toEqual({ from: '2025-12-22', to: '2025-12-31' });
  });

  it('keeps the same length in days across 29 February', () => {
    expect(previousPeriod('2025-03-01', '2025-03-31')).toEqual({ from: '2025-01-29', to: '2025-02-28' });
    expect(previousPeriod('2024-03-01', '2024-03-31')).toEqual({ from: '2024-01-30', to: '2024-02-29' });
  });
});

describe('percentChange', () => {
  it('is null when the previous total is 0', () => {
    expect(percentChange(100, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
  });

  it('is positive for an increase and negative for a decrease', () => {
    expect(percentChange(120, 100)).toBeCloseTo(20, 9);
    expect(percentChange(80, 100)).toBeCloseTo(-20, 9);
  });

  it('is -100 when the current period is empty and the previous is not', () => {
    expect(percentChange(0, 100)).toBe(-100);
  });

  it('is 0 for equal totals', () => {
    expect(percentChange(100, 100)).toBe(0);
  });
});
