import { Component, computed, input } from '@angular/core';
import { IAdBucket } from '../../_interfaces/interface-ads';

interface IAxisLine {
  y: number;
  label: string;
}

interface IColumn {
  key: string;
  center: number;
  slotX: number;
  slotWidth: number;
  label: string;
  title: string;
  spendPath: string;
  leadsPath: string;
  /** Tall over stolpen. Bare den høyeste i hvert felt får det, resten leses av aksen og verktøytipset. */
  spendLabel: string;
  spendLabelY: number;
  leadsLabel: string;
  leadsLabelY: number;
  demos: number;
  customers: number;
}

/**
 * Utviklingen i annonsene etter kalenderen: kroner brukt og leads inn som to stolpefelt over samme tidsakse, og
 * under dem antall demoer og kunder på de samme datoene. To felt med hver sin akse i stedet for to akser i ett
 * felt, så høydene ikke kan leses mot feil skala. Ren SVG, skalerer med bredden.
 */
@Component({
  selector: 'app-ad-trend-chart',
  imports: [],
  templateUrl: './ad-trend-chart.component.html',
  styleUrl: './ad-trend-chart.component.scss'
})
export class AdTrendChartComponent {

  readonly data = input.required<Array<IAdBucket>>();

  readonly width = 900;
  readonly height = 290;
  readonly padLeft = 48;

  /** Feltet for kroner brukt. */
  readonly spendCaptionY = 10;
  readonly spendTop = 22;
  readonly spendBase = 130;
  /** Feltet for leads. */
  readonly leadsCaptionY = 156;
  readonly leadsTop = 168;
  readonly leadsBase = 220;
  /** Tallradene og tidsaksen under feltene. */
  readonly demosY = 244;
  readonly customersY = 262;
  readonly labelY = 284;

  private static readonly MaxBarWidth = 24;

  /** Toppen av en akse: høyeste verdi rundet opp til et pent tall som deles i divisions like steg. */
  private niceMax(peak: number, divisions: number, minStep: number): number {
    if (peak <= 0) return minStep * divisions;
    const raw = peak / divisions;
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / power;
    const step = Math.max(minStep, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power);
    return step * divisions;
  }

  private format(value: number): string {
    return Math.round(value).toLocaleString('nb-NO');
  }

  private readonly spendMax = computed(() => this.niceMax(Math.max(0, ...this.data().map(b => b.spend)), 2, 1));
  private readonly leadsMax = computed(() => this.niceMax(Math.max(0, ...this.data().map(b => b.leads)), 2, 1));

  private axis(max: number, top: number, base: number): Array<IAxisLine> {
    return [0, max / 2, max].map(value => ({ y: base - (value / max) * (base - top), label: this.format(value) }));
  }

  readonly spendAxis = computed(() => this.axis(this.spendMax(), this.spendTop, this.spendBase));
  readonly leadsAxis = computed(() => this.axis(this.leadsMax(), this.leadsTop, this.leadsBase));

  /** Stolpe med avrundet topp og rett bunn mot grunnlinjen. Tom streng når verdien er null. */
  private barPath(center: number, barWidth: number, base: number, height: number): string {
    if (height <= 0) return '';
    const h = Math.max(height, 1.5);
    const r = Math.min(4, barWidth / 2, h);
    const x = center - barWidth / 2;
    const top = base - h;
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barWidth - r} Q${x + barWidth},${top} ${x + barWidth},${top + r} V${base} Z`;
  }

  readonly columns = computed<Array<IColumn>>(() => {
    const data = this.data();
    const slot = (this.width - this.padLeft) / (data.length || 1);
    const barWidth = Math.min(AdTrendChartComponent.MaxBarWidth, Math.max(2, slot * 0.62));
    const spendMax = this.spendMax();
    const leadsMax = this.leadsMax();
    const spendPeak = Math.max(0, ...data.map(b => b.spend));
    const leadsPeak = Math.max(0, ...data.map(b => b.leads));
    const spendPeakIndex = spendPeak > 0 ? data.findIndex(b => b.spend === spendPeak) : -1;
    const leadsPeakIndex = leadsPeak > 0 ? data.findIndex(b => b.leads === leadsPeak) : -1;

    return data.map((b, i) => {
      const center = this.padLeft + i * slot + slot / 2;
      const spendHeight = (b.spend / spendMax) * (this.spendBase - this.spendTop);
      const leadsHeight = (b.leads / leadsMax) * (this.leadsBase - this.leadsTop);
      return {
        key: b.key,
        center,
        slotX: this.padLeft + i * slot + 1,
        slotWidth: Math.max(1, slot - 2),
        label: b.label,
        title: `${b.title}: ${this.format(b.spend)} kr brukt, ${b.leads} leads, ${b.demos} demoer, ${b.customers} kunder`,
        spendPath: this.barPath(center, barWidth, this.spendBase, spendHeight),
        leadsPath: this.barPath(center, barWidth, this.leadsBase, leadsHeight),
        spendLabel: i === spendPeakIndex ? this.format(b.spend) : '',
        spendLabelY: this.spendBase - spendHeight - 4,
        leadsLabel: i === leadsPeakIndex ? `${b.leads}` : '',
        leadsLabelY: this.leadsBase - leadsHeight - 4,
        demos: b.demos,
        customers: b.customers
      };
    });
  });

  /** Dagnummer under hver stolpe blir for tett over en viss mengde; da merkes annenhver. */
  readonly labelEvery = computed(() => this.data().length > 34 ? 2 : 1);
}
