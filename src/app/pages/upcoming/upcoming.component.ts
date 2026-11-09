import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UpcomingFacadeService } from '../../shared/_services/upcoming/upcoming-facade.service';

@Component({
  selector: 'app-upcoming',
  imports: [DatePipe],
  templateUrl: './upcoming.component.html',
  styleUrl: './upcoming.component.scss'
})
export class UpcomingComponent {

  private readonly upcomingFacade = inject(UpcomingFacadeService);

  readonly isLoading = this.upcomingFacade.isLoading;
  readonly error = this.upcomingFacade.error;
  readonly hasLoaded = this.upcomingFacade.hasLoaded;
  readonly days = this.upcomingFacade.days;
  readonly dayOptions = UpcomingFacadeService.DayOptions;
  readonly groups = this.upcomingFacade.groups;
  readonly followupCount = this.upcomingFacade.followupCount;
  readonly demoCount = this.upcomingFacade.demoCount;

  constructor() {
    this.upcomingFacade.ensureLoaded();
  }

  setDays(days: number): void {
    this.upcomingFacade.setDays(days);
  }

  refresh(): void {
    this.upcomingFacade.refresh();
  }
}
