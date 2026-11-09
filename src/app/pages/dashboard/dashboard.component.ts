import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DashboardFacadeService } from '../../shared/_services/dashboard/dashboard-facade.service';
import { StateService } from '../../shared/_services/__state/state.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  private readonly stateService = inject(StateService);
  private readonly dashboardFacade = inject(DashboardFacadeService);

  readonly leadsCount = this.stateService.leadsCount;
  readonly isLoading = this.dashboardFacade.isLoading;
  readonly error = this.dashboardFacade.error;
  readonly today = new Date();

  constructor() {
    this.dashboardFacade.load();
  }

  refresh(): void {
    this.dashboardFacade.load();
  }
}
