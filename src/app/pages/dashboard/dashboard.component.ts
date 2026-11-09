import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { DashboardFacadeService } from '../../shared/_services/dashboard/dashboard-facade.service';
import { ActivityChartComponent } from '../../shared/components/activity-chart/activity-chart.component';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, PercentPipe, ActivityChartComponent],
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
  readonly upcoming = this.dashboardFacade.upcoming;
  readonly activity = this.dashboardFacade.activity;
  readonly dailyActivity = this.dashboardFacade.dailyActivity;
  readonly activityDays = DashboardFacadeService.ActivityDays;
  readonly upcomingDays = DashboardFacadeService.UpcomingDays;

  constructor() {
    this.dashboardFacade.load();
  }

  refresh(): void {
    this.dashboardFacade.load();
  }
}
