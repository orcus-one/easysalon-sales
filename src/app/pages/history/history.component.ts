import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NoteDialogComponent } from '../../shared/components/note-dialog/note-dialog.component';
import { HistoryFacadeService } from '../../shared/_services/history/history-facade.service';

@Component({
  selector: 'app-history',
  imports: [DatePipe, RouterLink, RouterOutlet, NoteDialogComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent {

  private readonly historyFacade = inject(HistoryFacadeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = this.historyFacade.isLoading;
  readonly error = this.historyFacade.error;
  readonly hasLoaded = this.historyFacade.hasLoaded;
  readonly days = this.historyFacade.days;
  readonly dayOptions = HistoryFacadeService.DayOptions;
  readonly date = this.historyFacade.date;
  readonly minDate = this.historyFacade.minDate;
  readonly maxDate = this.historyFacade.maxDate;
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

  onDate(event: Event): void {
    this.historyFacade.setDate((event.target as HTMLInputElement).value);
  }

  /** Klikk hvor som helst på raden åpner leadet, som på Leads-siden. Navnelenken gjør sitt eget. */
  openLead(event: MouseEvent, id: string | undefined): void {
    if (!id || (event.target as HTMLElement).closest('a')) return;
    this.router.navigate([id], { relativeTo: this.route });
  }

  toggleType(type: string): void {
    this.historyFacade.toggleType(type);
  }

  refresh(): void {
    this.historyFacade.refresh();
  }
}
