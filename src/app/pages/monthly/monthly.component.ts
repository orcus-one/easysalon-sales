import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MonthlyFacadeService } from '../../shared/_services/monthly/monthly-facade.service';

@Component({
  selector: 'app-monthly',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './monthly.component.html',
  styleUrl: './monthly.component.scss'
})
export class MonthlyComponent {

  private readonly monthlyFacade = inject(MonthlyFacadeService);

  readonly isLoading = this.monthlyFacade.isLoading;
  readonly error = this.monthlyFacade.error;
  readonly hasLoaded = this.monthlyFacade.hasLoaded;
  readonly year = this.monthlyFacade.year;
  readonly rows = this.monthlyFacade.rows;
  readonly total = this.monthlyFacade.total;

  constructor() {
    this.monthlyFacade.ensureLoaded();
  }

  refresh(): void {
    this.monthlyFacade.refresh();
  }
}
