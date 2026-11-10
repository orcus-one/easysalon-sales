import { Injectable, computed, inject, signal } from '@angular/core';
import { ILeadInput, ILeadListItem, IPipelineCount } from '../../_interfaces/interface-leads';
import { StateService } from '../__state/state.service';
import { LeadsFacadeService } from '../leads/leads-facade.service';
import { LeadsHelperService } from '../leads/leads-helper.service';
import { LeadsService } from '../leads/leads.service';

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
    private readonly leadsService = inject(LeadsService);

    /** Rader som vises fra start, og hvor mange «Vis flere» legger på. */
    static readonly PageSize = 100;
    /** Steget et nytt lead får når ingenting annet er valgt. */
    static readonly DefaultStatus = 'ny';

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

    // Skjemaet «Opprett lead»
    readonly isFormOpen = this.stateService.isLeadFormOpen;
    readonly isSaving = signal(false);
    readonly saveError = signal('');
    /** Kilder som ennå ikke finnes blant leadene, men som skal kunne velges (Kenneth 2026-11-10). */
    static readonly KnownSources = ['Kontaktskjema', 'Gatebesøk', 'organisk_registrering'];

    /** Kildene som finnes blant leadene pluss de kjente, alfabetisk. Selgerens app har en fast liste; dette speiler den. */
    readonly sourceOptions = computed(() => {
        const fromLeads = this.stateService.leads().map(l => l.kilde).filter((k): k is string => k !== null);
        return [...new Set([...fromLeads, ...LeadListFacadeService.KnownSources])].sort((a, b) => a.localeCompare(b, 'nb'));
    });
    readonly stepOptions = computed(() => this.stateService.pipelineSteps());
    readonly defaultStatus = LeadListFacadeService.DefaultStatus;

    openForm(): void {
        this.saveError.set('');
        this.isFormOpen.set(true);
    }

    closeForm(): void {
        if (this.isSaving()) return;
        this.isFormOpen.set(false);
    }

    /** Lagrer leadet, henter listen på nytt så det nye leadet vises øverst, og lukker skjemaet. */
    async createLead(input: ILeadInput): Promise<void> {
        this.isSaving.set(true);
        this.saveError.set('');
        try {
            await this.leadsService.createLead(input);
            await this.leadsFacade.load();
            this.isFormOpen.set(false);
        } catch {
            this.saveError.set('Fikk ikke lagret leadet. Prøv igjen.');
        } finally {
            this.isSaving.set(false);
        }
    }

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
