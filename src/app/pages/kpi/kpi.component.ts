import { Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { KpiView } from '../../shared/_interfaces/interface-leads';
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
  readonly demoTarget = KpiFacadeService.DemoTarget;
  readonly weekdays = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
  readonly viewOptions: Array<{ view: KpiView; label: string }> = [
    { view: 'calls', label: 'Telefon' },
    { view: 'demos', label: 'Demoer' }
  ];

  readonly isLoading = this.kpiFacade.isLoading;
  readonly error = this.kpiFacade.error;
  readonly hasLoaded = this.kpiFacade.hasLoaded;
  readonly view = this.kpiFacade.view;
  readonly year = this.kpiFacade.year;
  readonly demoKpi = this.kpiFacade.demoKpi;
  readonly month = this.kpiFacade.month;
  readonly canGoBack = this.kpiFacade.canGoBack;
  readonly canGoForward = this.kpiFacade.canGoForward;
  readonly kpi = this.kpiFacade.kpi;
  /** Tomme celler foran den første, så rutenettet starter på riktig ukedag. */
  readonly blanks = computed(() => Array.from({ length: this.kpi().leadingBlanks }, (_, i) => i));

  constructor() {
    this.kpiFacade.ensureLoaded();
  }

  setView(view: KpiView): void {
    this.kpiFacade.setView(view);
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
