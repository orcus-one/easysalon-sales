import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { DashboardFacadeService } from '../../shared/_services/dashboard/dashboard-facade.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, PercentPipe],
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
  readonly upcomingDays = DashboardFacadeService.UpcomingDays;

  constructor() {
    this.dashboardFacade.load();
  }

  refresh(): void {
    this.dashboardFacade.load();
  }
}
