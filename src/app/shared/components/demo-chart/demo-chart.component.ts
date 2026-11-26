import { Component, computed, input } from '@angular/core';
import { IKpiWeek } from '../../_interfaces/interface-leads';

interface IWeekBars {
  week: number;
  slotX: number;
  slotWidth: number;
  /** Midt i uken, der ukenummeret står. */
  centerX: number;
  met: boolean;
  isCurrent: boolean;
  demos: number;
  bookedX: number;
  bookedY: number;
  bookedHeight: number;
  completed: number;
  completedX: number;
  completedY: number;
  completedHeight: number;
  title: string;
}

interface IGridLine {
  y: number;
  value: number;
}

/**
 * Demoer per uke som to stolper side om side: booket målt mot ukemålet, med samme regler og farger som kortene
 * på KPI-siden (grønn på mål, rød under), og gjennomført i egen farge uten mål. Ren SVG, skalerer med bredden.
 */
@Component({
  selector: 'app-demo-chart',
  imports: [],
  templateUrl: './demo-chart.component.html',
  styleUrl: './demo-chart.component.scss'
})
export class DemoChartComponent {

  readonly data = input.required<Array<IKpiWeek>>();
  readonly target = input.required<number>();

  readonly width = 900;
  readonly height = 220;
  /** Plass til antallet over den høyeste stolpen. */
  readonly padTop = 18;
  private readonly padBottom = 22;
  readonly padLeft = 26;
  private readonly plotHeight = this.height - this.padTop - this.padBottom;
  /** Toppen av aksen velges blant disse, så de fire rutenettlinjene treffer hele tall. */
  private static readonly AxisTops = [8, 12, 20, 40, 60, 100];

  readonly baseline = this.padTop + this.plotHeight;
  readonly labelY = this.height - 6;

  readonly max = computed(() => {
    const peak = Math.max(this.target(), ...this.data().map(w => Math.max(w.demos, w.completed)));
    return DemoChartComponent.AxisTops.find(top => top >= peak) ?? Math.ceil(peak / 100) * 100;
  });

  readonly gridLines = computed<Array<IGridLine>>(() => {
    const max = this.max();
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const value = (max / steps) * i;
      return { value, y: this.baseline - (value / max) * this.plotHeight };
    });
  });

  readonly targetY = computed(() => this.baseline - (this.target() / this.max()) * this.plotHeight);

  private readonly slot = computed(() => (this.width - this.padLeft) / (this.data().length || 1));
  readonly barWidth = computed(() => Math.max(2, this.slot() * 0.3));

  readonly weeks = computed<Array<IWeekBars>>(() => {
    const max = this.max();
    const slot = this.slot();
    const barWidth = this.barWidth();
    const gap = Math.max(1, slot * 0.04);
    const target = this.target();

    return this.data().map((w, i) => {
      const centerX = this.padLeft + i * slot + slot / 2;
      const bookedHeight = (w.demos / max) * this.plotHeight;
      const completedHeight = (w.completed / max) * this.plotHeight;
      return {
        week: w.week,
        slotX: this.padLeft + i * slot + 1,
        slotWidth: Math.max(1, slot - 2),
        centerX,
        met: w.met,
        isCurrent: w.isCurrent,
        demos: w.demos,
        bookedX: centerX - gap / 2 - barWidth,
        bookedY: this.baseline - bookedHeight,
        bookedHeight,
        completed: w.completed,
        completedX: centerX + gap / 2,
        completedY: this.baseline - completedHeight,
        completedHeight,
        title: `Uke ${w.week} (${this.dayMonth(w.start)}–${this.dayMonth(w.end)}): ${w.demos} av ${target} booket, ${w.completed} gjennomført`
      };
    });
  });

  /** yyyy-MM-dd som d.M. */
  private dayMonth(dateKey: string): string {
    const [, month, day] = dateKey.split('-').map(Number);
    return `${day}.${month}.`;
  }
}
