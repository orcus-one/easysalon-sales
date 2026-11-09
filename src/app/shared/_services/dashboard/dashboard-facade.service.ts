import { Injectable, computed, inject, signal } from '@angular/core';
import { StateService } from '../__state/state.service';
import { LeadsHelperService } from '../leads/leads-helper.service';
import { LeadsService } from '../leads/leads.service';

/**
 * Henter det oversikten trenger og avleder tallene med computed fra StateService.
 */
@Injectable({
    providedIn: 'root'
})
export class DashboardFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsService = inject(LeadsService);
    private readonly leadsHelper = inject(LeadsHelperService);

    static readonly UpcomingDays = 7;
    static readonly ActivityDays = 30;

    readonly isLoading = signal(false);
    readonly error = signal('');
    /** Tidspunktet tallene er regnet fra. Settes ved hver lasting så «siste 30 dager» følger med. */
    readonly loadedAt = signal(new Date());

    readonly kpis = computed(() => this.leadsHelper.kpis(this.stateService.leads(), this.loadedAt()));
    readonly pipeline = computed(() => this.leadsHelper.pipeline(this.stateService.leads(), this.stateService.pipelineSteps()));
    readonly bySource = computed(() => this.leadsHelper.bySource(this.stateService.leads()));
    readonly upcoming = computed(() =>
        this.leadsHelper.upcoming(this.stateService.leads(), this.loadedAt(), DashboardFacadeService.UpcomingDays));
    readonly activity = computed(() => this.leadsHelper.activity(this.stateService.leadEvents(), this.loadedAt()));
    readonly hasLoaded = computed(() => this.stateService.leadsLoaded());

    async load(): Promise<void> {
        this.isLoading.set(true);
        this.error.set('');
        try {
            const now = new Date();
            const [leads, steps, events] = await Promise.all([
                this.leadsService.getLeads(),
                this.leadsService.getPipelineSteps(),
                this.leadsService.getContactEvents(this.leadsHelper.addDays(now, -DashboardFacadeService.ActivityDays))
            ]);
            this.stateService.leads.set(leads);
            this.stateService.pipelineSteps.set(steps);
            this.stateService.leadEvents.set(events);
            this.stateService.leadsLoaded.set(true);
            this.loadedAt.set(new Date());
        } catch {
            this.error.set('Fikk ikke hentet tallene. Prøv å oppdatere.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
