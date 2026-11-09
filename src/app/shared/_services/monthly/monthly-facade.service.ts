import { Injectable, computed, inject } from '@angular/core';
import { IMonthlySummary } from '../../_interfaces/interface-leads';
import { StateService } from '../__state/state.service';
import { LeadsFacadeService } from '../leads/leads-facade.service';
import { LeadsHelperService } from '../leads/leads-helper.service';

/**
 * Siden «Hittil i år»: innsats og resultat per måned fra januar, med sum.
 */
@Injectable({
    providedIn: 'root'
})
export class MonthlyFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsFacade = inject(LeadsFacadeService);
    private readonly leadsHelper = inject(LeadsHelperService);

    readonly isLoading = this.leadsFacade.isLoading;
    readonly error = this.leadsFacade.error;
    readonly hasLoaded = computed(() => this.stateService.leadsLoaded());
    readonly year = computed(() => this.leadsFacade.loadedAt().getFullYear());

    readonly rows = computed(() =>
        this.leadsHelper.monthly(this.stateService.leads(), this.stateService.leadEvents(), this.leadsFacade.loadedAt()));

    readonly total = computed<IMonthlySummary>(() => this.rows().reduce((sum, r) => ({
        month: 'total',
        newLeads: sum.newLeads + r.newLeads,
        calls: sum.calls + r.calls,
        sms: sum.sms + r.sms,
        meetings: sum.meetings + r.meetings,
        demos: sum.demos + r.demos,
        won: sum.won + r.won,
        licenses: sum.licenses + r.licenses
    }), { month: 'total', newLeads: 0, calls: 0, sms: 0, meetings: 0, demos: 0, won: 0, licenses: 0 }));

    ensureLoaded(): void {
        this.leadsFacade.ensureLoaded();
    }

    refresh(): void {
        this.leadsFacade.load();
    }
}
