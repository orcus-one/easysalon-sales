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
    readonly demoType = LeadsHelperService.DemoCompletedType;

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
        this.deleteCandidateId.set(null);
        this.deleteError.set('');
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

    // Sletting av demoregistreringer. Bare hendelser av typen demo_completed kan slettes (Kenneth 2026-11-26).
    /** Hendelsen brukeren har bedt om å slette og må bekrefte. null = ingen. */
    readonly deleteCandidateId = signal<string | null>(null);
    readonly isDeleting = signal(false);
    readonly deleteError = signal('');

    askDeleteDemo(eventId: string): void {
        if (this.isDeleting()) return;
        this.deleteError.set('');
        this.deleteCandidateId.set(eventId);
    }

    cancelDeleteDemo(): void {
        if (this.isDeleting()) return;
        this.deleteCandidateId.set(null);
    }

    /**
     * Sletter demoregistreringen som er bekreftet. Status på leadet røres ikke: flyttet registreringen leadet
     * til «Demo gjennomført», står statusen og statusendringen igjen, og rettes i selgerens app.
     */
    async deleteDemo(): Promise<void> {
        const eventId = this.deleteCandidateId();
        const leadId = this.openId;
        if (!eventId || this.isDeleting()) return;
        this.isDeleting.set(true);
        this.deleteError.set('');
        try {
            await this.leadsService.deleteDemoEvent(eventId);
        } catch {
            this.deleteError.set('Fikk ikke slettet registreringen. Prøv igjen.');
            this.isDeleting.set(false);
            return;
        }
        // Registreringen er slettet. Feiler oppfriskingen, er den borte neste gang leadet hentes.
        try {
            const events = await this.leadsService.getLeadEvents(leadId);
            if (this.openId === leadId) this.stateService.curLeadEvents.set(events);
            await this.leadsFacade.load();
        } catch { /* se over */ }
        this.isDeleting.set(false);
        this.deleteCandidateId.set(null);
    }
}
