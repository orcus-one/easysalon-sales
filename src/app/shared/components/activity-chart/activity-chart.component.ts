import { Component, computed, input } from '@angular/core';
import { IDailyActivity } from '../../_interfaces/interface-leads';

interface IBar {
  x: number;
  ringtY: number;
  ringtH: number;
  smsY: number;
  smsH: number;
  label: string;
  title: string;
  showLabel: boolean;
}

interface IGridLine {
  y: number;
  value: number;
}

/**
 * Stablede stolper per dag: ringt nederst, SMS oppå. Ren SVG, skalerer med bredden.
 */
@Component({
  selector: 'app-activity-chart',
  imports: [],
  templateUrl: './activity-chart.component.html',
  styleUrl: './activity-chart.component.scss'
})
export class ActivityChartComponent {

  readonly data = input.required<Array<IDailyActivity>>();

  readonly width = 600;
  readonly height = 170;
  private readonly padTop = 8;
  private readonly padBottom = 22;
  private readonly padLeft = 26;
  private readonly plotHeight = this.height - this.padTop - this.padBottom;

  readonly max = computed(() => {
    const peak = Math.max(0, ...this.data().map(d => d.ringt + d.sms));
    // Rund opp til et pent tall så rutenettet treffer hele verdier.
    if (peak <= 5) return 5;
    const step = peak <= 20 ? 5 : peak <= 50 ? 10 : 25;
    return Math.ceil(peak / step) * step;
  });

  readonly gridLines = computed<Array<IGridLine>>(() => {
    const max = this.max();
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const value = (max / steps) * i;
      return { value, y: this.padTop + this.plotHeight - (value / max) * this.plotHeight };
    });
  });

  readonly bars = computed<Array<IBar>>(() => {
    const data = this.data();
    if (data.length === 0) return [];
    const max = this.max();
    const slot = (this.width - this.padLeft) / data.length;
    const barWidth = Math.max(2, slot * 0.62);
    const labelEvery = data.length > 14 ? 5 : 1;

    return data.map((d, i) => {
      const ringtH = (d.ringt / max) * this.plotHeight;
      const smsH = (d.sms / max) * this.plotHeight;
      const base = this.padTop + this.plotHeight;
      const date = new Date(d.date + 'T00:00:00');
      return {
        x: this.padLeft + i * slot + (slot - barWidth) / 2,
        ringtY: base - ringtH,
        ringtH,
        smsY: base - ringtH - smsH,
        smsH,
        label: `${date.getDate()}.${date.getMonth() + 1}`,
        title: `${date.toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })}: ${d.ringt} ringt, ${d.sms} SMS`,
        showLabel: (data.length - 1 - i) % labelEvery === 0
      };
    });
  });

  readonly barWidth = computed(() => {
    const n = this.data().length || 1;
    return Math.max(2, ((this.width - this.padLeft) / n) * 0.62);
  });

  readonly baseline = this.padTop + this.plotHeight;
  readonly labelY = this.height - 6;
}
