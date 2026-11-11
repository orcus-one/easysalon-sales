import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { DashboardFacadeService } from '../../shared/_services/dashboard/dashboard-facade.service';
import { CallChartComponent } from '../../shared/components/call-chart/call-chart.component';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, PercentPipe, CallChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  private readonly dashboardFacade = inject(DashboardFacadeService);

  readonly isLoading = this.dashboardFacade.isLoading;
  readonly error = this.dashboardFacade.error;
  readonly hasLoaded = this.dashboardFacade.hasLoaded;
  readonly loadedAt = this.dashboardFacade.loadedAt;
  readonly kpis = this.dashboardFacade.kpis;
  readonly pipeline = this.dashboardFacade.pipeline;
  readonly bySource = this.dashboardFacade.bySource;
  readonly activity = this.dashboardFacade.activity;
  readonly dailyCalls = this.dashboardFacade.dailyCalls;
  readonly callTarget = DashboardFacadeService.CallTarget;
  readonly activityDays = DashboardFacadeService.ActivityDays;

  constructor() {
    this.dashboardFacade.ensureLoaded();
  }

  refresh(): void {
    this.dashboardFacade.refresh();
  }
}
