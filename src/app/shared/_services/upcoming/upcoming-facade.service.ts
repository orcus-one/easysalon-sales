import { Injectable, computed, inject, signal } from '@angular/core';
import { IUpcomingDay } from '../../_interfaces/interface-leads';
import { StateService } from '../__state/state.service';
import { LeadsFacadeService } from '../leads/leads-facade.service';
import { LeadsHelperService } from '../leads/leads-helper.service';

/**
 * Siden «Kommende»: oppfølginger og demoer de neste dagene, gruppert per dag.
 */
@Injectable({
    providedIn: 'root'
})
export class UpcomingFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsFacade = inject(LeadsFacadeService);
    private readonly leadsHelper = inject(LeadsHelperService);

    static readonly DayOptions = [7, 14, 30];

    readonly days = signal(UpcomingFacadeService.DayOptions[0]);
    readonly isLoading = this.leadsFacade.isLoading;
    readonly error = this.leadsFacade.error;
    readonly hasLoaded = computed(() => this.stateService.leadsLoaded());

    readonly items = computed(() =>
        this.leadsHelper.upcoming(this.stateService.leads(), this.leadsFacade.loadedAt(), this.days()));

    readonly groups = computed<Array<IUpcomingDay>>(() => {
        const groups: Array<IUpcomingDay> = [];
        for (const item of this.items()) {
            const last = groups[groups.length - 1];
            if (last && last.date === item.date) {
                last.items.push(item);
            } else {
                groups.push({ date: item.date, items: [item] });
            }
        }
        return groups;
    });

    readonly followupCount = computed(() => this.items().filter(i => i.kind === 'followup').length);
    readonly demoCount = computed(() => this.items().filter(i => i.kind === 'demo').length);

    setDays(days: number): void {
        this.days.set(days);
    }

    ensureLoaded(): void {
        this.leadsFacade.ensureLoaded();
    }

    refresh(): void {
        this.leadsFacade.load();
    }
}
