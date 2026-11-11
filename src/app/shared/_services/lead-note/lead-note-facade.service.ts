import { Injectable, computed, inject, signal } from '@angular/core';
import { INoteTarget } from '../../_interfaces/interface-leads';
import { StateService } from '../__state/state.service';
import { LeadsService } from '../leads/leads.service';

/**
 * Dialogen «Nytt notat»: legger et notat i lead_notes på leadet dialogen ble åpnet for. Åpnes fra leadlisten
 * og fra leadpanelet. Notatfeltet på selve leadet (leads.notater) er noe annet og røres ikke.
 */
@Injectable({
    providedIn: 'root'
})
export class LeadNoteFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsService = inject(LeadsService);

    readonly target = this.stateService.noteTarget;
    readonly isOpen = computed(() => this.target() !== null);
    readonly isSaving = signal(false);
    readonly saveError = signal('');

    open(target: INoteTarget): void {
        this.saveError.set('');
        this.target.set(target);
    }

    close(): void {
        if (this.isSaving()) return;
        this.target.set(null);
    }

    /**
     * Lagrer notatet knyttet til selgerens organisasjon og lukker dialogen. Er leadet åpent i panelet, hentes
     * notatene på nytt så det nye står i livsløpet. Med flere organisasjoner stopper vi i stedet for å gjette,
     * som ved oppretting av lead.
     */
    async save(body: string): Promise<void> {
        const target = this.target();
        const text = body.trim();
        if (!target || text === '') return;
        const organisations = this.stateService.organisations();
        if (organisations.length !== 1) {
            this.saveError.set(organisations.length === 0
                ? 'Fant ingen organisasjon å knytte notatet til.'
                : 'Fant flere organisasjoner, vet ikke hvilken notatet skal knyttes til.');
            return;
        }
        this.isSaving.set(true);
        this.saveError.set('');
        try {
            await this.leadsService.createLeadNote({ org_id: organisations[0].id, lead_id: target.id, body: text });
        } catch {
            this.saveError.set('Fikk ikke lagret notatet. Prøv igjen.');
            this.isSaving.set(false);
            return;
        }
        // Notatet er lagret. Feiler oppfriskingen, står det i livsløpet neste gang leadet hentes.
        try {
            if (this.stateService.curLead()?.id === target.id) {
                this.stateService.curLeadNotes.set(await this.leadsService.getLeadNotes(target.id));
            }
        } catch { /* se over */ }
        this.isSaving.set(false);
        this.target.set(null);
    }
}
