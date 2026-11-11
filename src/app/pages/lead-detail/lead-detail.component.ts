import { Component, HostListener, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LeadDetailFacadeService } from '../../shared/_services/lead-detail/lead-detail-facade.service';
import { LeadNoteFacadeService } from '../../shared/_services/lead-note/lead-note-facade.service';
import { LeadsHelperService } from '../../shared/_services/leads/leads-helper.service';

@Component({
  selector: 'app-lead-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './lead-detail.component.html',
  styleUrl: './lead-detail.component.scss'
})
export class LeadDetailComponent {

  private readonly leadDetailFacade = inject(LeadDetailFacadeService);
  private readonly leadNoteFacade = inject(LeadNoteFacadeService);
  private readonly leadsHelper = inject(LeadsHelperService);
  private readonly router = inject(Router);

  /** Rute-parameteren, bundet inn av ruteren (withComponentInputBinding). */
  readonly id = input.required<string>();

  formatOrgNumber = (orgnummer: string | null): string => this.leadsHelper.formatOrgNumber(orgnummer);

  readonly isLoading = this.leadDetailFacade.isLoading;
  readonly error = this.leadDetailFacade.error;
  readonly notFound = this.leadDetailFacade.notFound;
  readonly lead = this.leadDetailFacade.lead;
  readonly step = this.leadDetailFacade.step;
  readonly sourceLabel = this.leadDetailFacade.sourceLabel;
  readonly lifecycle = this.leadDetailFacade.lifecycle;
  readonly counts = this.leadDetailFacade.counts;
  readonly eventCount = this.leadDetailFacade.eventCount;
  readonly createdType = this.leadDetailFacade.createdType;

  constructor() {
    // Ny id i ruten åpner et nytt lead, også når komponenten gjenbrukes.
    effect(() => this.leadDetailFacade.open(this.id()));
  }

  /** Escape lukker panelet, som lukkeknappen. Står notatdialogen åpen, er det den som lukkes, ikke panelet. */
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (event.defaultPrevented || this.leadNoteFacade.isOpen()) return;
    this.router.navigate(['/leads']);
  }

  addNote(): void {
    const lead = this.lead();
    if (lead) this.leadNoteFacade.open({ id: lead.id, navn: lead.navn });
  }

  refresh(): void {
    this.leadDetailFacade.refresh();
  }
}
