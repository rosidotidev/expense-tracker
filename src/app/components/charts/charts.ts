import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import type { ChartConfiguration } from 'chart.js';
import { ExpenseService } from '../../services/expense.service';
import { PeopleService } from '../../services/people.service';
import { CategoryService } from '../../services/category.service';
import {
  ALL_TIME_FROM,
  ALL_TIME_TO,
  BreakdownEntry,
  ChartFilters,
  MONTH_LABELS,
  SMALL_SLICE_THRESHOLD,
  defaultFilters,
  filterExpenses,
  formatEuro,
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
} from '../../services/chart-data';
import { ChartCanvasComponent } from './chart-canvas';
import { BreakdownChartComponent } from './breakdown-chart/breakdown-chart';
import { YoyChartComponent } from './yoy-chart/yoy-chart';

type Mode = 'total' | 'category' | 'who';

// Palette taken from the app CSS variables, in series order; the last one is the neutral tone.
const PALETTE: { name: string; fallback: string }[] = [
  { name: '--coral', fallback: '#ff6b5b' },
  { name: '--teal', fallback: '#0fa88a' },
  { name: '--violet', fallback: '#8a5cf6' },
  { name: '--amber', fallback: '#ffb84d' },
  { name: '--pink', fallback: '#ff8fb1' },
  { name: '--ink-dim', fallback: '#8a6f5c' }
];

function paletteColors(): string[] {
  const style = getComputedStyle(document.documentElement);
  return PALETTE.map((c) => style.getPropertyValue(c.name).trim() || c.fallback);
}

@Component({
  selector: 'app-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ChartCanvasComponent, BreakdownChartComponent, YoyChartComponent],
  templateUrl: './charts.html',
  styleUrl: './charts.css'
})
export class ChartsComponent {
  private expenseService = inject(ExpenseService);
  private peopleService = inject(PeopleService);
  private categoryService = inject(CategoryService);

  readonly expenses = toSignal(this.expenseService.expenses$, { initialValue: [] });
  readonly people = toSignal(this.peopleService.people$, { initialValue: [] });
  readonly categories = toSignal(this.categoryService.categories$, { initialValue: [] });

  readonly filters = signal<ChartFilters>(defaultFilters());
  readonly mode = signal<Mode>('total');

  readonly modes: { key: Mode; label: string }[] = [
    { key: 'total', label: 'Totale' },
    { key: 'category', label: 'Per categoria' },
    { key: 'who', label: 'Per persona' }
  ];

  // While the dates are inverted or incomplete the chart keeps showing the last valid range.
  private readonly appliedRange = linkedSignal<{ from: string; to: string }, { from: string; to: string }>({
    source: () => ({ from: this.filters().from, to: this.filters().to }),
    computation: (range, previous) => (isValidRange(range.from, range.to) ? range : (previous?.value ?? range))
  });

  readonly rangeInverted = computed(() => {
    const { from, to } = this.filters();
    return from !== '' && to !== '' && from > to;
  });

  private readonly filtered = computed(() => {
    const { from, to } = this.appliedRange();
    return filterExpenses(this.expenses(), { ...this.filters(), from, to });
  });

  readonly hasData = computed(() => this.filtered().length > 0);

  readonly emptyMessage = 'Nessun dato per i filtri selezionati';

  // Rings: same filtered expenses as the monthly chart. A name keeps its color (hash of the name
  // into the accent colors); the last palette tone is the neutral one, reserved for "Other".
  readonly categoryEntries = computed(() =>
    groupSmallSlices(totalsBy(this.filtered(), 'category'), SMALL_SLICE_THRESHOLD)
  );
  readonly personEntries = computed(() => groupSmallSlices(totalsBy(this.filtered(), 'who'), SMALL_SLICE_THRESHOLD));
  readonly categoryColors = computed(() => this.ringColors(this.categoryEntries()));
  readonly personColors = computed(() => this.ringColors(this.personEntries()));

  private ringColors(entries: BreakdownEntry[]): string[] {
    const colors = paletteColors();
    return sliceColors(entries, colors.slice(0, -1), colors[colors.length - 1]);
  }

  readonly formatEuro = formatEuro;

  // Cards: all filters, dates included. The previous period only differs in the dates.
  readonly summary = computed(() => {
    const { from, to } = this.appliedRange();
    return rangeSummary(this.filtered(), from, to);
  });

  private readonly previousSummary = computed(() => {
    const { from, to } = this.appliedRange();
    const prev = previousPeriod(from, to);
    return rangeSummary(filterExpenses(this.expenses(), { ...this.filters(), ...prev }), prev.from, prev.to);
  });

  readonly change = computed(() => percentChange(this.summary().total, this.previousSummary().total));

  private readonly roundedChange = computed(() => {
    const change = this.change();
    return change === null ? null : Math.round(change);
  });

  readonly changeDirection = computed<'up' | 'down' | 'none'>(() => {
    const rounded = this.roundedChange();
    if (rounded === null || rounded === 0) return 'none';
    return rounded > 0 ? 'up' : 'down';
  });

  readonly changeText = computed(() => {
    const rounded = this.roundedChange();
    if (rounded === null) return 'n/a';
    const arrow = rounded > 0 ? '▲ ' : rounded < 0 ? '▼ ' : '';
    return `${arrow}${Math.abs(rounded)}%`;
  });

  // Year over year: same filters but the dates, so it follows person, category and the two flags only.
  private readonly yearlyFiltered = computed(() =>
    filterExpenses(this.expenses(), { ...this.filters(), from: ALL_TIME_FROM, to: ALL_TIME_TO })
  );
  readonly yearlySeries = computed(() => yearlyMonthlySeries(this.yearlyFiltered(), new Date()));
  readonly hasYearly = computed(() => this.yearlySeries().length > 0);

  readonly yoyConfig = computed<ChartConfiguration<'line'>>(() => {
    const accents = paletteColors().slice(0, -1);
    return {
      type: 'line',
      data: {
        labels: MONTH_LABELS,
        datasets: this.yearlySeries().map((s) => ({
          label: String(s.year),
          data: s.months,
          borderColor: yearColor(s.year, accents),
          backgroundColor: yearColor(s.year, accents),
          borderWidth: 3,
          pointRadius: 3.5
        }))
      },
      options: {
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
          legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatEuro(ctx.parsed.y ?? 0)}` }
          }
        },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatEuro(Number(v)) } } }
      }
    };
  });

  readonly chartConfig = computed<ChartConfiguration<'bar'>>(() => {
    const { from, to } = this.appliedRange();
    const expenses = this.filtered();
    const colors = paletteColors();
    const mode = this.mode();

    if (mode === 'total') {
      const buckets = monthlyTotals(expenses, from, to);
      return {
        type: 'bar',
        data: {
          labels: buckets.map((b) => b.label),
          datasets: [
            { label: 'Totale', data: buckets.map((b) => b.total), backgroundColor: colors[0], borderRadius: 6 }
          ]
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => formatEuro(ctx.parsed.y ?? 0) } }
          },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatEuro(Number(v)) } } }
        }
      };
    }

    // In every bar the block with the largest amount of that month is the lowest one (rankStacked);
    // a name keeps the same color in every bar (color = position in the overall order).
    const stacked = monthlyTotalsBy(expenses, from, to, mode);
    const layers = rankStacked(stacked);
    const colorOf = new Map(stacked.series.map((s, i) => [s.name, colors[i % colors.length]]));
    return {
      type: 'bar',
      data: {
        labels: stacked.months.map((m) => m.label),
        datasets: layers.map((layer, k) => ({
          label: `Blocco ${k + 1}`,
          data: layer.values,
          backgroundColor: layer.names.map((name) => colorOf.get(name) ?? colors[colors.length - 1])
        }))
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            // Clicking a legend entry must not hide a layer: layers are not names.
            onClick: () => undefined,
            labels: {
              generateLabels: () =>
                stacked.series.map((s) => ({
                  text: s.name,
                  fillStyle: colorOf.get(s.name),
                  strokeStyle: colorOf.get(s.name),
                  lineWidth: 0,
                  hidden: false
                }))
            }
          },
          tooltip: {
            filter: (item) => (item.parsed.y ?? 0) > 0,
            callbacks: {
              label: (ctx) => `${layers[ctx.datasetIndex].names[ctx.dataIndex]}: ${formatEuro(ctx.parsed.y ?? 0)}`
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, ticks: { callback: (v) => formatEuro(Number(v)) } }
        }
      }
    };
  });

  setFrom(from: string): void {
    this.filters.update((f) => ({ ...f, from }));
  }

  setTo(to: string): void {
    this.filters.update((f) => ({ ...f, to }));
  }

  setPerson(person: string): void {
    this.filters.update((f) => ({ ...f, person }));
  }

  setCategory(category: string): void {
    this.filters.update((f) => ({ ...f, category }));
  }

  onCategorySlice(name: string): void {
    this.setCategory(name);
  }

  onPersonSlice(name: string): void {
    this.setPerson(name);
  }

  setOnlyRecurrent(onlyRecurrent: boolean): void {
    this.filters.update((f) => ({ ...f, onlyRecurrent }));
  }

  setOnlyDebit(onlyDebit: boolean): void {
    this.filters.update((f) => ({ ...f, onlyDebit }));
  }

  setMode(mode: Mode): void {
    this.mode.set(mode);
  }

  reset(): void {
    this.filters.set(defaultFilters());
    this.mode.set('total');
  }
}
