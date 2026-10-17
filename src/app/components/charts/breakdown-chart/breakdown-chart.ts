import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild
} from '@angular/core';
import { ArcElement, Chart, ChartConfiguration, DoughnutController, Tooltip } from 'chart.js';
import { BreakdownEntry, formatEuro } from '../../../services/chart-data';

Chart.register(DoughnutController, ArcElement, Tooltip);

@Component({
  selector: 'app-breakdown-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breakdown-chart.html',
  styleUrl: './breakdown-chart.css'
})
export class BreakdownChartComponent {
  readonly title = input.required<string>();
  readonly entries = input.required<BreakdownEntry[]>();
  readonly colors = input.required<string[]>();
  readonly emptyMessage = input.required<string>();
  readonly sliceClick = output<string>();

  readonly formatEuro = formatEuro;

  readonly total = computed(() => Math.round(this.entries().reduce((acc, e) => acc + e.amount, 0) * 100) / 100);

  private canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart<'doughnut'> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destroyChart());
    effect(() => {
      const config = this.buildConfig();
      const canvas = this.canvas();
      if (!canvas) {
        // The ring is not rendered (empty state): drop the instance, it is rebuilt when data returns.
        this.destroyChart();
        return;
      }
      if (this.chart && this.chart.canvas !== canvas.nativeElement) this.destroyChart();
      if (!this.chart) {
        this.chart = new Chart<'doughnut'>(canvas.nativeElement, config);
        return;
      }
      this.chart.data = config.data;
      this.chart.update();
    });
  }

  percent(entry: BreakdownEntry): number {
    return Math.round(entry.percentage);
  }

  legendClick(entry: BreakdownEntry): void {
    if (!entry.isOther) this.sliceClick.emit(entry.name);
  }

  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private entryAt(event: Event | null | undefined): BreakdownEntry | undefined {
    if (!this.chart || !event) return undefined;
    const hit = this.chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true)[0];
    return hit ? this.entries()[hit.index] : undefined;
  }

  private buildConfig(): ChartConfiguration<'doughnut'> {
    const entries = this.entries();
    return {
      type: 'doughnut',
      data: {
        labels: entries.map((e) => e.name),
        datasets: [
          {
            data: entries.map((e) => e.amount),
            backgroundColor: this.colors(),
            borderColor: '#ffffff',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.label}: ${formatEuro(ctx.parsed)}` }
          }
        },
        onClick: (event) => {
          const entry = this.entryAt(event.native);
          if (entry) this.legendClick(entry);
        },
        onHover: (event, elements) => {
          const target = event.native?.target as HTMLElement | null;
          if (!target) return;
          const entry = elements.length ? this.entries()[elements[0].index] : undefined;
          target.style.cursor = entry && !entry.isOther ? 'pointer' : 'default';
        }
      }
    };
  }
}
