import { Injectable, computed, inject } from '@angular/core';
import { StateService } from '../__state/state.service';
import { LeadsFacadeService } from '../leads/leads-facade.service';
import { LeadsHelperService } from '../leads/leads-helper.service';

/**
 * Tallene på oversikten, avledet med computed fra StateService. Hentingen ligger i LeadsFacadeService.
 */
@Injectable({
    providedIn: 'root'
})
export class DashboardFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsFacade = inject(LeadsFacadeService);
    private readonly leadsHelper = inject(LeadsHelperService);

    static readonly ActivityDays = LeadsFacadeService.ActivityDays;

    readonly isLoading = this.leadsFacade.isLoading;
    readonly error = this.leadsFacade.error;
    readonly loadedAt = this.leadsFacade.loadedAt;
    readonly hasLoaded = computed(() => this.stateService.leadsLoaded());

    readonly kpis = computed(() => this.leadsHelper.kpis(this.stateService.leads(), this.loadedAt()));
    readonly pipeline = computed(() => this.leadsHelper.pipeline(this.stateService.leads(), this.stateService.pipelineSteps()));
    readonly bySource = computed(() => this.leadsHelper.bySource(this.stateService.leads()));
    readonly activity = computed(() => this.leadsHelper.activity(this.stateService.leadEvents(), this.loadedAt()));
    readonly dailyActivity = computed(() =>
        this.leadsHelper.dailyActivity(this.stateService.leadEvents(), this.loadedAt(), DashboardFacadeService.ActivityDays));

    ensureLoaded(): void {
        this.leadsFacade.ensureLoaded();
    }

    refresh(): void {
        this.leadsFacade.load();
    }
}
