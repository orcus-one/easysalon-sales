import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LeadListFacadeService } from '../../shared/_services/lead-list/lead-list-facade.service';
import { LeadsHelperService } from '../../shared/_services/leads/leads-helper.service';

@Component({
  selector: 'app-leads',
  imports: [DatePipe],
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.scss'
})
export class LeadsComponent {

  private readonly leadListFacade = inject(LeadListFacadeService);
  private readonly leadsHelper = inject(LeadsHelperService);

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

  constructor() {
    this.leadListFacade.ensureLoaded();
  }

  onSearch(event: Event): void {
    this.leadListFacade.setQuery((event.target as HTMLInputElement).value);
  }

  toggleStatus(status: string): void {
    this.leadListFacade.toggleStatus(status);
  }

  showMore(): void {
    this.leadListFacade.showMore();
  }

  refresh(): void {
    this.leadListFacade.refresh();
  }
}
