import { Injectable, computed, inject, signal } from '@angular/core';
import { IDemoTarget } from '../../_interfaces/interface-leads';
import { StateService } from '../__state/state.service';
import { LeadsFacadeService } from '../leads/leads-facade.service';
import { LeadsHelperService } from '../leads/leads-helper.service';
import { LeadsService } from '../leads/leads.service';

/**
 * Dialogen «Demo gjennomført»: registrerer at en demo er holdt på leadet dialogen ble åpnet for, på datoen som
 * velges. Dagens dato er standard; en eldre dato er etterregistrering av en demo som ble glemt. Åpnes fra
 * leadpanelet.
 */
@Injectable({
    providedIn: 'root'
})
export class LeadDemoFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsFacade = inject(LeadsFacadeService);
    private readonly leadsHelper = inject(LeadsHelperService);
    private readonly leadsService = inject(LeadsService);

    readonly target = this.stateService.demoTarget;
    readonly isOpen = computed(() => this.target() !== null);
    readonly isSaving = signal(false);
    readonly saveError = signal('');
    /** true når demoen er registrert, men statusflyttingen feilet. Da kan det ikke lagres på nytt. */
    readonly isSavedWithError = signal(false);
    /** Dagens dato (yyyy-MM-dd) da dialogen ble åpnet: standardverdi og seneste tillatte dato. */
    readonly today = signal('');

    open(target: IDemoTarget): void {
        this.saveError.set('');
        this.isSavedWithError.set(false);
        this.today.set(this.leadsHelper.toDateKey(new Date()));
        this.target.set(target);
    }

    close(): void {
        if (this.isSaving()) return;
        this.target.set(null);
    }

    /**
     * Skriver en demo_completed-hendelse på valgt dato, og når leadet står på et steg før «Demo gjennomført»,
     * flyttes status dit med egen status_endret-hendelse, som i selgerens app. Status leses på nytt først, siden
     * den kan være endret i selgerens app etter at panelet ble åpnet. Statusendringen får tidspunktet for
     * lagringen, ikke demodatoen, siden det er da statusen byttes.
     * Kallene går etter hverandre uten transaksjon. Feiler statusflyttingen, står demoen registrert, og dialogen
     * blir stående med melding i stedet for å la brukeren lagre en gang til.
     */
    async save(dateKey: string): Promise<void> {
        const target = this.target();
        if (!target || this.isSaving() || this.isSavedWithError()) return;
        const now = new Date();
        const todayKey = this.leadsHelper.toDateKey(now);
        if (!this.leadsHelper.isDateKey(dateKey)) {
            this.saveError.set('Velg datoen demoen ble holdt.');
            return;
        }
        if (dateKey > todayKey) {
            this.saveError.set('Datoen kan ikke være frem i tid.');
            return;
        }
        const organisations = this.stateService.organisations();
        if (organisations.length !== 1) {
            this.saveError.set(organisations.length === 0
                ? 'Fant ingen organisasjon å knytte hendelsen til.'
                : 'Fant flere organisasjoner, vet ikke hvilken hendelsen skal knyttes til.');
            return;
        }
        const orgId = organisations[0].id;
        const status = LeadsHelperService.DemoCompletedStatus;
        this.isSaving.set(true);
        this.saveError.set('');
        let isRegistered = false;
        try {
            const current = await this.leadsService.getLead(target.id);
            if (!current) throw new Error('Lead not found');
            await this.leadsService.createLeadEvent({
                org_id: orgId, lead_id: target.id, type: LeadsHelperService.DemoCompletedType,
                // Dagens dato får tidspunktet basen setter. En eldre dato sendes med, midt på dagen.
                ...(dateKey === todayKey ? {} : { opprettet_at: this.leadsHelper.noonIso(dateKey) })
            });
            isRegistered = true;
            if (this.leadsHelper.isBeforeStep(current.status, status, this.stateService.pipelineSteps())) {
                await this.leadsService.updateLeadStatus(target.id, status);
                await this.leadsService.createLeadEvent({
                    org_id: orgId, lead_id: target.id, type: LeadsHelperService.StatusChangedType, fra_status: current.status, til_status: status
                });
            }
        } catch {
            if (!isRegistered) {
                this.saveError.set('Fikk ikke registrert demoen. Prøv igjen.');
                this.isSaving.set(false);
                return;
            }
            this.saveError.set('Demoen er registrert, men status ble ikke flyttet. Se i livsløpet hva som ble lagret.');
            this.isSavedWithError.set(true);
        }
        // Hentes på nytt også etter feil i statusflyttingen, så panelet viser det som faktisk står i basen.
        try {
            const [lead, events] = await Promise.all([this.leadsService.getLead(target.id), this.leadsService.getLeadEvents(target.id)]);
            if (this.stateService.curLead()?.id === target.id) {
                this.stateService.curLead.set(lead);
                this.stateService.curLeadEvents.set(events);
            }
            await this.leadsFacade.load();
        } catch { /* panelet viser forrige tilstand til neste oppdatering */ }
        this.isSaving.set(false);
        if (!this.isSavedWithError()) this.target.set(null);
    }
}
