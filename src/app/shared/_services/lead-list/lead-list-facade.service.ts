import { Injectable, computed, inject, signal } from '@angular/core';
import { ILeadListItem, IPipelineCount } from '../../_interfaces/interface-leads';
import { StateService } from '../__state/state.service';
import { LeadsFacadeService } from '../leads/leads-facade.service';
import { LeadsHelperService } from '../leads/leads-helper.service';

/**
 * Siden «Leads»: alle leads nyeste først, med kilde, steg og planlagt dato. Alt ligger allerede i
 * StateService, så søk og filter er rene computed. Listen vises i porsjoner for å holde siden lett.
 */
@Injectable({
    providedIn: 'root'
})
export class LeadListFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsFacade = inject(LeadsFacadeService);
    private readonly leadsHelper = inject(LeadsHelperService);

    /** Rader som vises fra start, og hvor mange «Vis flere» legger på. */
    static readonly PageSize = 100;

    readonly query = signal('');
    /** Nøkkel i pipeline_steg. Tom = alle steg. */
    readonly status = signal('');
    readonly visibleCount = signal(LeadListFacadeService.PageSize);

    readonly isLoading = this.leadsFacade.isLoading;
    readonly error = this.leadsFacade.error;
    readonly hasLoaded = computed(() => this.stateService.leadsLoaded());

    readonly all = computed(() =>
        this.leadsHelper.leadList(this.stateService.leads(), this.stateService.pipelineSteps(), this.leadsFacade.loadedAt()));

    /** Stegene som faktisk har leads, med antall, i appens rekkefølge. Brukes som statusfilter. */
    readonly statusOptions = computed<Array<IPipelineCount>>(() =>
        this.leadsHelper.pipeline(this.stateService.leads(), this.stateService.pipelineSteps()).filter(p => p.count > 0));

    readonly filtered = computed<Array<ILeadListItem>>(() => {
        const query = this.query().trim().toLowerCase();
        const status = this.status();
        return this.all().filter(item =>
            (status === '' || item.lead.status === status)
            && (query === '' || this.leadsHelper.leadMatches(item.lead, query)));
    });

    readonly visible = computed(() => this.filtered().slice(0, this.visibleCount()));
    readonly hasMore = computed(() => this.filtered().length > this.visibleCount());

    setQuery(query: string): void {
        this.query.set(query);
        this.visibleCount.set(LeadListFacadeService.PageSize);
    }

    /** Samme steg igjen slår filteret av. */
    toggleStatus(status: string): void {
        this.status.set(this.status() === status ? '' : status);
        this.visibleCount.set(LeadListFacadeService.PageSize);
    }

    showMore(): void {
        this.visibleCount.update(count => count + LeadListFacadeService.PageSize);
    }

    ensureLoaded(): void {
        this.leadsFacade.ensureLoaded();
    }

    refresh(): void {
        this.leadsFacade.load();
    }
}
