import { Injectable, computed, inject, signal } from '@angular/core';
import { ILeadInput, ILeadListItem, IPipelineCount, ISource, ISourceCount } from '../../_interfaces/interface-leads';
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
    /** Kildens visningstekst slik den står på radene. Tom = alle kilder. */
    readonly source = signal('');
    readonly visibleCount = signal(LeadListFacadeService.PageSize);

    readonly isLoading = this.leadsFacade.isLoading;
    readonly error = this.leadsFacade.error;
    readonly hasLoaded = computed(() => this.stateService.leadsLoaded());

    readonly all = computed(() =>
        this.leadsHelper.leadList(this.stateService.leads(), this.stateService.pipelineSteps(), this.stateService.sources(),
            this.leadsFacade.loadedAt()));

    /** Stegene som faktisk har leads, med antall, i appens rekkefølge. Brukes som statusfilter. */
    readonly statusOptions = computed<Array<IPipelineCount>>(() =>
        this.leadsHelper.pipeline(this.stateService.leads(), this.stateService.pipelineSteps()).filter(p => p.count > 0));

    /** Kildene som faktisk har leads, med antall, største først. Brukes som kildefilter. */
    readonly sourceFilterOptions = computed<Array<ISourceCount>>(() => this.leadsHelper.sourceCounts(this.all()));

    readonly filtered = computed<Array<ILeadListItem>>(() => {
        const query = this.query().trim().toLowerCase();
        const status = this.status();
        const source = this.source();
        return this.all().filter(item =>
            (status === '' || item.lead.status === status)
            && (source === '' || item.source === source)
            && (query === '' || this.leadsHelper.leadMatches(item.lead, query)));
    });

    readonly visible = computed(() => this.filtered().slice(0, this.visibleCount()));
    readonly hasMore = computed(() => this.filtered().length > this.visibleCount());

    // Skjemaet «Opprett lead»
    readonly isFormOpen = this.stateService.isLeadFormOpen;
    readonly isSaving = signal(false);
    readonly saveError = signal('');
    /** Dagens dato som yyyy-MM-dd, satt når skjemaet åpnes. Forslag i feltet «Opprettet». */
    readonly formDefaultDate = signal('');
    /** De aktive kildene fra public.sources, i tabellens rekkefølge. */
    readonly sourceOptions = computed<Array<ISource>>(() => this.stateService.sources().filter(s => s.active));
    readonly stepOptions = computed(() => this.stateService.pipelineSteps());
    readonly defaultStatus = LeadListFacadeService.DefaultStatus;

    openForm(): void {
        this.saveError.set('');
        this.formDefaultDate.set(this.leadsHelper.toDateKey(new Date()));
        this.isFormOpen.set(true);
    }

    /** yyyy-MM-dd fra datofeltet til ISO-tidspunkt ved midnatt lokal tid, så datoen blir den samme ved visning. */
    toCreatedAt(dateKey: string): string {
        return new Date(`${dateKey}T00:00:00`).toISOString();
    }

    closeForm(): void {
        if (this.isSaving()) return;
        this.isFormOpen.set(false);
    }

    /**
     * Lagrer leadet knyttet til selgerens organisasjon, henter listen på nytt så det nye leadet vises øverst, og
     * lukker skjemaet. Med flere organisasjoner stopper vi i stedet for å gjette (Kenneth 2026-11-10).
     */
    async createLead(input: ILeadInput): Promise<void> {
        const organisations = this.stateService.organisations();
        if (organisations.length !== 1) {
            this.saveError.set(organisations.length === 0
                ? 'Fant ingen organisasjon å knytte leadet til.'
                : 'Fant flere organisasjoner, vet ikke hvilken leadet skal knyttes til.');
            return;
        }
        this.isSaving.set(true);
        this.saveError.set('');
        try {
            const source = this.stateService.sources().find(s => s.id === input.source_id);
            await this.leadsService.createLead({ ...input, org_id: organisations[0].id, kilde: source?.label ?? null });
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

    /** Samme kilde igjen slår filteret av. Virker sammen med statusfilteret og søket. */
    toggleSource(source: string): void {
        this.source.set(this.source() === source ? '' : source);
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
