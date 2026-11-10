import { Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { KpiFacadeService } from '../../shared/_services/kpi/kpi-facade.service';

@Component({
  selector: 'app-kpi',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './kpi.component.html',
  styleUrl: './kpi.component.scss'
})
export class KpiComponent {

  private readonly kpiFacade = inject(KpiFacadeService);

  readonly target = KpiFacadeService.CallTarget;
  readonly weekdays = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  readonly isLoading = this.kpiFacade.isLoading;
  readonly error = this.kpiFacade.error;
  readonly hasLoaded = this.kpiFacade.hasLoaded;
  readonly month = this.kpiFacade.month;
  readonly canGoBack = this.kpiFacade.canGoBack;
  readonly canGoForward = this.kpiFacade.canGoForward;
  readonly kpi = this.kpiFacade.kpi;
  /** Tomme celler foran den første, så rutenettet starter på riktig ukedag. */
  readonly blanks = computed(() => Array.from({ length: this.kpi().leadingBlanks }, (_, i) => i));

  constructor() {
    this.kpiFacade.ensureLoaded();
  }

  previousMonth(): void {
    this.kpiFacade.previousMonth();
  }

  nextMonth(): void {
    this.kpiFacade.nextMonth();
  }

  refresh(): void {
    this.kpiFacade.refresh();
  }
}
