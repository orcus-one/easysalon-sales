import { Injectable, computed, inject, signal } from '@angular/core';
import { StateService } from '../__state/state.service';
import { LeadsFacadeService } from '../leads/leads-facade.service';
import { LeadsHelperService } from '../leads/leads-helper.service';
import { LeadsService } from '../leads/leads.service';

/**
 * Detaljvisningen av ett lead: opplysningene om leadet og livsløpet, alle hendelsene og notatene siden det ble
 * opprettet. Leadet, hendelsene og notatene hentes per lead, siden den felles lasten bare har hendelser fra årsstart og ikke
 * notat eller kommentar.
 */
@Injectable({
    providedIn: 'root'
})
export class LeadDetailFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsFacade = inject(LeadsFacadeService);
    private readonly leadsHelper = inject(LeadsHelperService);
    private readonly leadsService = inject(LeadsService);

    readonly createdType = LeadsHelperService.CreatedType;
    readonly noteType = LeadsHelperService.NoteType;

    readonly isLoading = signal(false);
    readonly error = signal('');
    /** true når hentingen gikk bra, men id-en ikke ga noe lead. */
    readonly notFound = signal(false);
    /** Id-en som sist ble åpnet. Svar på en eldre henting forkastes. */
    private openId = '';

    readonly lead = this.stateService.curLead;

    readonly step = computed(() => {
        const lead = this.lead();
        if (!lead) return null;
        return this.stateService.pipelineSteps().find(s => s.nokkel === lead.status) ?? this.leadsHelper.unknownStep(lead.status);
    });

    readonly sourceLabel = computed(() => {
        const lead = this.lead();
        return lead ? this.leadsHelper.sourceLabel(lead, this.stateService.sources()) : '';
    });

    readonly lifecycle = computed(() => {
        const lead = this.lead();
        return lead
            ? this.leadsHelper.lifecycle(lead, this.stateService.curLeadEvents(), this.stateService.curLeadNotes(), this.stateService.pipelineSteps())
            : [];
    });

    readonly counts = computed(() => this.leadsHelper.lifecycleCounts(this.stateService.curLeadEvents(), this.stateService.curLeadNotes()));
    /** Hendelser og notater til sammen. */
    readonly eventCount = computed(() => this.stateService.curLeadEvents().length + this.stateService.curLeadNotes().length);

    /** Åpner leadet: tømmer forrige, og henter leadet og hendelsene. Stegene og kildene kommer fra den felles lasten. */
    async open(id: string): Promise<void> {
        this.openId = id;
        this.stateService.curLead.set(null);
        this.stateService.curLeadEvents.set([]);
        this.stateService.curLeadNotes.set([]);
        this.notFound.set(false);
        this.error.set('');
        this.demoError.set('');
        this.isLoading.set(true);
        try {
            const [lead, events, notes] = await Promise.all([
                this.leadsService.getLead(id),
                this.leadsService.getLeadEvents(id),
                this.leadsService.getLeadNotes(id),
                this.leadsFacade.ensureLoaded()
            ]);
            if (this.openId !== id) return;
            this.stateService.curLead.set(lead);
            this.stateService.curLeadEvents.set(events);
            this.stateService.curLeadNotes.set(notes);
            this.notFound.set(lead === null);
        } catch {
            if (this.openId === id) this.error.set('Fikk ikke hentet leadet. Prøv å oppdatere.');
        } finally {
            if (this.openId === id) this.isLoading.set(false);
        }
    }

    refresh(): void {
        if (this.openId) this.open(this.openId);
    }

    readonly isRegisteringDemo = signal(false);
    readonly demoError = signal('');

    /**
     * Registrerer at demoen er holdt på leadet som er åpent: en demo_completed-hendelse, og når leadet står på
     * et steg før «Demo gjennomført», flyttes status dit med egen status_endret-hendelse, som i selgerens app.
     * Status leses på nytt først, siden den kan være endret i selgerens app etter at panelet ble åpnet.
     * Kallene går etter hverandre uten transaksjon. Feiler et av dem, blir det som alt er skrevet stående.
     */
    async registerDemoCompleted(): Promise<void> {
        const id = this.lead()?.id;
        if (!id || this.isRegisteringDemo()) return;
        const organisations = this.stateService.organisations();
        if (organisations.length !== 1) {
            this.demoError.set(organisations.length === 0
                ? 'Fant ingen organisasjon å knytte hendelsen til.'
                : 'Fant flere organisasjoner, vet ikke hvilken hendelsen skal knyttes til.');
            return;
        }
        const orgId = organisations[0].id;
        const target = LeadsHelperService.DemoCompletedStatus;
        this.isRegisteringDemo.set(true);
        this.demoError.set('');
        try {
            const current = await this.leadsService.getLead(id);
            if (!current) throw new Error('Lead not found');
            await this.leadsService.createLeadEvent({ org_id: orgId, lead_id: id, type: LeadsHelperService.DemoCompletedType });
            if (this.leadsHelper.isBeforeStep(current.status, target, this.stateService.pipelineSteps())) {
                await this.leadsService.updateLeadStatus(id, target);
                await this.leadsService.createLeadEvent({
                    org_id: orgId, lead_id: id, type: LeadsHelperService.StatusChangedType, fra_status: current.status, til_status: target
                });
            }
        } catch {
            this.demoError.set('Fikk ikke registrert demoen fullt ut. Se i livsløpet hva som ble lagret.');
        }
        // Hentes på nytt også etter feil, så panelet viser det som faktisk står i basen.
        try {
            const [lead, events] = await Promise.all([this.leadsService.getLead(id), this.leadsService.getLeadEvents(id)]);
            if (this.openId === id) {
                this.stateService.curLead.set(lead);
                this.stateService.curLeadEvents.set(events);
            }
            await this.leadsFacade.load();
        } catch { /* panelet viser forrige tilstand til neste oppdatering */ }
        this.isRegisteringDemo.set(false);
    }
}
