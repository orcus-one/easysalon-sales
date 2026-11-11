import { Injectable, inject, signal } from '@angular/core';
import { StateService } from '../__state/state.service';
import { LeadsHelperService } from './leads-helper.service';
import { LeadsService } from './leads.service';

/**
 * Henter leads, pipeline-steg og kontakthendelser inn i StateService. Felles for alle sidene,
 * så dataene lastes én gang og deles. Sidene avleder sine tall med computed fra StateService.
 */
@Injectable({
    providedIn: 'root'
})
export class LeadsFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsService = inject(LeadsService);
    private readonly leadsHelper = inject(LeadsHelperService);

    /** Vinduet for aktivitetstallene og loggen. */
    static readonly ActivityDays = 30;

    /** Hendelser hentes fra årsstart for månedsoversikten, minst 30 dager tilbake rett etter nyttår. */
    private eventsSince(now: Date): Date {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const thirtyDays = this.leadsHelper.addDays(now, -LeadsFacadeService.ActivityDays);
        return yearStart < thirtyDays ? yearStart : thirtyDays;
    }

    readonly isLoading = signal(false);
    readonly error = signal('');
    /** Tidspunktet dataene er hentet. Beregninger som «siste 30 dager» regnes fra denne. */
    readonly loadedAt = signal(new Date());

    /** Henter bare hvis ingenting er lastet ennå. Brukes når en side åpnes. */
    async ensureLoaded(): Promise<void> {
        if (this.stateService.leadsLoaded() || this.isLoading()) return;
        await this.load();
    }

    async load(): Promise<void> {
        this.isLoading.set(true);
        this.error.set('');
        try {
            const now = new Date();
            const [leads, steps, sources, events, organisations] = await Promise.all([
                this.leadsService.getLeads(),
                this.leadsService.getPipelineSteps(),
                this.leadsService.getSources(),
                this.leadsService.getEvents(this.eventsSince(now)),
                this.leadsService.getOrganisations()
            ]);
            this.stateService.leads.set(leads);
            this.stateService.pipelineSteps.set(steps);
            this.stateService.sources.set(sources);
            this.stateService.leadEvents.set(events);
            this.stateService.organisations.set(organisations);
            this.stateService.leadsLoaded.set(true);
            this.loadedAt.set(new Date());
        } catch {
            this.error.set('Fikk ikke hentet dataene. Prøv å oppdatere.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
