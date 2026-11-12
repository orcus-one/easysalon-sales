import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AdsFacadeService } from '../../shared/_services/ads/ads-facade.service';
import { AdTrendChartComponent } from '../../shared/components/ad-trend-chart/ad-trend-chart.component';

@Component({
  selector: 'app-ads',
  imports: [DatePipe, DecimalPipe, AdTrendChartComponent],
  templateUrl: './ads.component.html',
  styleUrl: './ads.component.scss'
})
export class AdsComponent {

  private readonly adsFacade = inject(AdsFacadeService);

  readonly dayOptions = AdsFacadeService.DayOptions;
  readonly days = this.adsFacade.days;
  readonly isLoading = this.adsFacade.isLoading;
  readonly error = this.adsFacade.error;
  readonly hasLoaded = this.adsFacade.hasLoaded;
  readonly loadedAt = this.adsFacade.loadedAt;
  readonly rows = this.adsFacade.rows;
  readonly totals = this.adsFacade.totals;
  readonly buckets = this.adsFacade.buckets;
  readonly bucketSize = this.adsFacade.bucketSize;

  constructor() {
    this.adsFacade.ensureLoaded();
  }

  setDays(days: number): void {
    this.adsFacade.setDays(days);
  }

  refresh(): void {
    this.adsFacade.refresh();
  }
}
