import { Injectable, computed, inject, signal } from '@angular/core';
import { IHistoryDay } from '../../_interfaces/interface-leads';
import { StateService } from '../__state/state.service';
import { LeadsFacadeService } from '../leads/leads-facade.service';
import { LeadsHelperService } from '../leads/leads-helper.service';

/**
 * Siden «Historikk»: hva som er gjort på leads bakover i tid, gruppert per dag med nyeste øverst.
 */
@Injectable({
    providedIn: 'root'
})
export class HistoryFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsFacade = inject(LeadsFacadeService);
    private readonly leadsHelper = inject(LeadsHelperService);

    static readonly DayOptions = [7, 14, 30];

    readonly days = signal(HistoryFacadeService.DayOptions[0]);
    readonly typeOptions = LeadsHelperService.EventTypes;
    /** Typene som vises. Alle på fra start. */
    readonly enabledTypes = signal<Set<string>>(new Set(LeadsHelperService.EventTypes.map(t => t.type)));

    readonly isLoading = this.leadsFacade.isLoading;
    readonly error = this.leadsFacade.error;
    readonly hasLoaded = computed(() => this.stateService.leadsLoaded());

    /** Alle hendelser i perioden, før typefilteret. Tellerne i boksene bruker denne. */
    readonly itemsInPeriod = computed(() => this.leadsHelper.history(
        this.stateService.leadEvents(), this.stateService.leads(), this.stateService.pipelineSteps(),
        this.leadsFacade.loadedAt(), this.days()));

    readonly items = computed(() => {
        const enabled = this.enabledTypes();
        return this.itemsInPeriod().filter(i => enabled.has(i.event.type));
    });

    readonly groups = computed<Array<IHistoryDay>>(() => {
        const groups: Array<IHistoryDay> = [];
        for (const item of this.items()) {
            const date = this.leadsHelper.toDateKey(new Date(item.event.opprettet_at));
            const last = groups[groups.length - 1];
            if (last && last.date === date) {
                last.items.push(item);
            } else {
                groups.push({ date, items: [item] });
            }
        }
        return groups;
    });

    readonly calledCount = computed(() => this.itemsInPeriod().filter(i => i.event.type === 'ringt_klikk').length);
    readonly smsCount = computed(() => this.itemsInPeriod().filter(i => i.event.type === 'sms_klikk').length);
    readonly statusCount = computed(() => this.itemsInPeriod().filter(i => i.event.type === 'status_endret').length);

    setDays(days: number): void {
        this.days.set(days);
    }

    toggleType(type: string): void {
        this.enabledTypes.update(current => {
            const next = new Set(current);
            if (next.has(type)) next.delete(type); else next.add(type);
            return next;
        });
    }

    isEnabled(type: string): boolean {
        return this.enabledTypes().has(type);
    }

    ensureLoaded(): void {
        this.leadsFacade.ensureLoaded();
    }

    refresh(): void {
        this.leadsFacade.load();
    }
}
