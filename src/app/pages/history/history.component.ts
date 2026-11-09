import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HistoryFacadeService } from '../../shared/_services/history/history-facade.service';

@Component({
  selector: 'app-history',
  imports: [DatePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent {

  private readonly historyFacade = inject(HistoryFacadeService);

  readonly isLoading = this.historyFacade.isLoading;
  readonly error = this.historyFacade.error;
  readonly hasLoaded = this.historyFacade.hasLoaded;
  readonly days = this.historyFacade.days;
  readonly dayOptions = HistoryFacadeService.DayOptions;
  readonly typeOptions = this.historyFacade.typeOptions;
  readonly enabledTypes = this.historyFacade.enabledTypes;
  readonly groups = this.historyFacade.groups;
  readonly calledCount = this.historyFacade.calledCount;
  readonly smsCount = this.historyFacade.smsCount;
  readonly statusCount = this.historyFacade.statusCount;

  constructor() {
    this.historyFacade.ensureLoaded();
  }

  setDays(days: number): void {
    this.historyFacade.setDays(days);
  }

  toggleType(type: string): void {
    this.historyFacade.toggleType(type);
  }

  refresh(): void {
    this.historyFacade.refresh();
  }
}
