import { Component, HostListener, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ILeadInput } from '../../shared/_interfaces/interface-leads';
import { LeadListFacadeService } from '../../shared/_services/lead-list/lead-list-facade.service';
import { LeadsHelperService } from '../../shared/_services/leads/leads-helper.service';

@Component({
  selector: 'app-leads',
  imports: [DatePipe, RouterLink, RouterOutlet],
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.scss'
})
export class LeadsComponent {

  private readonly leadListFacade = inject(LeadListFacadeService);
  private readonly leadsHelper = inject(LeadsHelperService);
  private readonly router = inject(Router);

  formatOrgNumber = (orgnummer: string | null): string => this.leadsHelper.formatOrgNumber(orgnummer);

  readonly isLoading = this.leadListFacade.isLoading;
  readonly error = this.leadListFacade.error;
  readonly hasLoaded = this.leadListFacade.hasLoaded;
  readonly query = this.leadListFacade.query;
  readonly status = this.leadListFacade.status;
  readonly statusOptions = this.leadListFacade.statusOptions;
  readonly all = this.leadListFacade.all;
  readonly filtered = this.leadListFacade.filtered;
  readonly visible = this.leadListFacade.visible;
  readonly hasMore = this.leadListFacade.hasMore;
  readonly isFormOpen = this.leadListFacade.isFormOpen;
  readonly isSaving = this.leadListFacade.isSaving;
  readonly saveError = this.leadListFacade.saveError;
  readonly sourceOptions = this.leadListFacade.sourceOptions;
  readonly stepOptions = this.leadListFacade.stepOptions;
  readonly defaultStatus = this.leadListFacade.defaultStatus;
  readonly formDefaultDate = this.leadListFacade.formDefaultDate;

  constructor() {
    this.leadListFacade.ensureLoaded();
  }

  onSearch(event: Event): void {
    this.leadListFacade.setQuery((event.target as HTMLInputElement).value);
  }

  toggleStatus(status: string): void {
    this.leadListFacade.toggleStatus(status);
  }

  /** Klikk hvor som helst på raden åpner leadet. Lenkene i raden (navn, telefon, e-post) gjør sitt eget. */
  openLead(event: MouseEvent, id: string): void {
    if ((event.target as HTMLElement).closest('a')) return;
    this.router.navigate(['/leads', id]);
  }

  showMore(): void {
    this.leadListFacade.showMore();
  }

  refresh(): void {
    this.leadListFacade.refresh();
  }

  openForm(): void {
    this.leadListFacade.openForm();
  }

  closeForm(): void {
    this.leadListFacade.closeForm();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeForm();
  }

  /** Leser skjemaet som det står; tomme felt blir null. Nettleseren har allerede stoppet innsending uten navn. */
  onSubmit(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const field = (name: string): string | null => {
      const value = String(data.get(name) ?? '').trim();
      return value === '' ? null : value;
    };
    const input: ILeadInput = {
      navn: field('navn') ?? '',
      opprettet_ekst: this.leadListFacade.toCreatedAt(field('opprettet_ekst') ?? this.formDefaultDate()),
      bedriftsnavn: field('bedriftsnavn'),
      orgnummer: field('orgnummer'),
      telefon: field('telefon'),
      epost: field('epost'),
      source_id: field('source_id') === null ? null : Number(field('source_id')),
      status: field('status') ?? this.defaultStatus,
      notater: field('notater'),
      neste_oppfolging: field('neste_oppfolging'),
      oppfolging_tid: field('oppfolging_tid')
    };
    this.leadListFacade.createLead(input);
  }
}
