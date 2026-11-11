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
    /** Typene som vises fra start (Kenneth 2026-11-09). Resten kan skrus på med filteret. */
    static readonly DefaultTypes = ['ringt_klikk', 'sms_klikk', 'mote_klikk'];

    readonly enabledTypes = signal<Set<string>>(new Set(HistoryFacadeService.DefaultTypes));

    readonly isLoading = this.leadsFacade.isLoading;
    readonly error = this.leadsFacade.error;
    readonly hasLoaded = computed(() => this.stateService.leadsLoaded());

    /** Én bestemt dag som yyyy-MM-dd. Tom = perioden i days. Valgt dag går foran perioden (Kenneth 2026-11-11). */
    readonly date = signal('');
    /** Hendelsene er hentet fra årsstart, så dagen kan velges fra 1. januar til og med i dag. */
    readonly minDate = computed(() => `${this.leadsFacade.loadedAt().getFullYear()}-01-01`);
    readonly maxDate = computed(() => this.leadsHelper.toDateKey(this.leadsFacade.loadedAt()));

    /** Alle hendelser i perioden eller på den valgte dagen, før typefilteret. Tellerne i boksene bruker denne. */
    readonly itemsInPeriod = computed(() => {
        const date = this.date();
        const events = this.stateService.leadEvents();
        const leads = this.stateService.leads();
        const steps = this.stateService.pipelineSteps();
        return date !== ''
            ? this.leadsHelper.historyForDay(events, leads, steps, date)
            : this.leadsHelper.history(events, leads, steps, this.leadsFacade.loadedAt(), this.days());
    });

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

    /** Å velge en periode går tilbake fra dagvisningen. */
    setDays(days: number): void {
        this.days.set(days);
        this.date.set('');
    }

    /** Tom streng (feltet er tømt) går tilbake til perioden. Datoer utenfor det som er hentet avvises. */
    setDate(date: string): void {
        this.date.set(date !== '' && (date < this.minDate() || date > this.maxDate()) ? '' : date);
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
