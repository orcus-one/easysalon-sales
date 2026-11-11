import { Component, computed, input } from '@angular/core';
import { IKpiDay } from '../../_interfaces/interface-leads';

/** På mål, under mål, eller en dag som ikke måles (helg og helligdag). */
type BarStatus = 'met' | 'missed' | 'off';

interface IBar {
  date: string;
  x: number;
  slotX: number;
  slotWidth: number;
  status: BarStatus;
  isToday: boolean;
  calls: number;
  y: number;
  height: number;
  /** Antallet skrives over stolpen. Dager som ikke måles får det bare når det ble ringt. */
  showCount: boolean;
  label: string;
  title: string;
}

interface IGridLine {
  y: number;
  value: number;
}

/**
 * Telefoner per dag som stolper målt mot dagsmålet, med samme regler og farger som kortene på KPI-siden:
 * grønn på mål, rød under, dempet for helg og helligdag. Ren SVG, skalerer med bredden.
 */
@Component({
  selector: 'app-call-chart',
  imports: [],
  templateUrl: './call-chart.component.html',
  styleUrl: './call-chart.component.scss'
})
export class CallChartComponent {

  readonly data = input.required<Array<IKpiDay>>();
  readonly target = input.required<number>();

  readonly width = 900;
  readonly height = 220;
  /** Plass til antallet over den høyeste stolpen. */
  readonly padTop = 18;
  private readonly padBottom = 22;
  readonly padLeft = 26;
  private readonly plotHeight = this.height - this.padTop - this.padBottom;

  readonly baseline = this.padTop + this.plotHeight;
  readonly labelY = this.height - 6;

  /** Toppen av aksen: høyeste dag eller målet, rundet opp til et pent tall så rutenettet treffer hele verdier. */
  readonly max = computed(() => {
    const peak = Math.max(this.target(), ...this.data().map(d => d.calls));
    const step = peak <= 20 ? 5 : peak <= 50 ? 10 : 25;
    return Math.ceil(peak / step) * step;
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
  readonly barWidth = computed(() => Math.max(2, this.slot() * 0.62));

  readonly bars = computed<Array<IBar>>(() => {
    const max = this.max();
    const slot = this.slot();
    const barWidth = this.barWidth();
    const target = this.target();

    return this.data().map((d, i) => {
      const date = new Date(d.date + 'T00:00:00');
      const status: BarStatus = d.kind !== 'workday' ? 'off' : d.met ? 'met' : 'missed';
      const height = (d.calls / max) * this.plotHeight;
      // Dagnummer på alle, måned i tillegg på første dag og ved månedsskifte.
      const monthStart = i === 0 || d.dayOfMonth === 1;
      const day = date.toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' });
      const measure = status === 'off'
        ? `${d.calls} telefoner, ${d.holidayName ?? 'helg'}`
        : `${d.calls} av ${target} telefoner`;
      return {
        date: d.date,
        x: this.padLeft + i * slot + (slot - barWidth) / 2,
        slotX: this.padLeft + i * slot + 1,
        slotWidth: Math.max(1, slot - 2),
        status,
        isToday: d.isToday,
        calls: d.calls,
        y: this.baseline - height,
        height,
        showCount: status !== 'off' || d.calls > 0,
        label: monthStart ? `${d.dayOfMonth}.${date.getMonth() + 1}` : `${d.dayOfMonth}`,
        title: `${day}: ${measure}`
      };
    });
  });
}
