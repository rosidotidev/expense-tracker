import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild
} from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  Legend,
  LinearScale,
  Tooltip
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-chart-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div class="chart-box"><canvas #canvas></canvas></div>',
  styles: ['.chart-box { position: relative; width: 100%; height: 100%; }']
})
export class ChartCanvasComponent implements AfterViewInit {
  config = input.required<ChartConfiguration<'bar'>>();

  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart<'bar'> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
    effect(() => {
      const config = this.config();
      if (!this.chart) return;
      this.chart.data = config.data;
      this.chart.options = { responsive: true, maintainAspectRatio: false, ...config.options };
      this.chart.update();
    });
  }

  ngAfterViewInit(): void {
    const config = this.config();
    this.chart = new Chart<'bar'>(this.canvas().nativeElement, {
      ...config,
      options: { responsive: true, maintainAspectRatio: false, ...config.options }
    });
  }
}
