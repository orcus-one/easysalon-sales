import { Component, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeadDetailFacadeService } from '../../shared/_services/lead-detail/lead-detail-facade.service';
import { LeadsHelperService } from '../../shared/_services/leads/leads-helper.service';

@Component({
  selector: 'app-lead-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './lead-detail.component.html',
  styleUrl: './lead-detail.component.scss'
})
export class LeadDetailComponent {

  private readonly leadDetailFacade = inject(LeadDetailFacadeService);
  private readonly leadsHelper = inject(LeadsHelperService);

  /** Rute-parameteren, bundet inn av ruteren (withComponentInputBinding). */
  readonly id = input.required<string>();

  formatOrgNumber = (orgnummer: string | null): string => this.leadsHelper.formatOrgNumber(orgnummer);
  sourceLabel = (kilde: string | null): string => this.leadsHelper.sourceLabel(kilde);

  readonly isLoading = this.leadDetailFacade.isLoading;
  readonly error = this.leadDetailFacade.error;
  readonly notFound = this.leadDetailFacade.notFound;
  readonly lead = this.leadDetailFacade.lead;
  readonly step = this.leadDetailFacade.step;
  readonly lifecycle = this.leadDetailFacade.lifecycle;
  readonly counts = this.leadDetailFacade.counts;
  readonly eventCount = this.leadDetailFacade.eventCount;
  readonly createdType = this.leadDetailFacade.createdType;

  constructor() {
    // Ny id i ruten åpner et nytt lead, også når komponenten gjenbrukes.
    effect(() => this.leadDetailFacade.open(this.id()));
  }

  refresh(): void {
    this.leadDetailFacade.refresh();
  }
}
