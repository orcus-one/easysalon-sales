import { Injectable, computed, inject, signal } from '@angular/core';
import { KpiView } from '../../_interfaces/interface-leads';
import { StateService } from '../__state/state.service';
import { LeadsFacadeService } from '../leads/leads-facade.service';
import { LeadsHelperService } from '../leads/leads-helper.service';

/**
 * Siden «KPI» med to nivåer: telefoner per dag i én måned målt mot dagsmålet, med bladring måned for måned
 * innenfor inneværende år, og demoer per ISO-uke i året målt mot ukemålet. Alt ligger allerede i StateService,
 * så visningen er ren computed.
 */
@Injectable({
    providedIn: 'root'
})
export class KpiFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsFacade = inject(LeadsFacadeService);
    private readonly leadsHelper = inject(LeadsHelperService);

    /** Telefoner per arbeidsdag (Kenneth 2026-11-10). */
    static readonly CallTarget = 25;
    /** Demoer per uke (Kenneth 2026-11-10). Justeres når effekten av telefonene har satt seg. */
    static readonly DemoTarget = 5;

    readonly isLoading = this.leadsFacade.isLoading;
    readonly error = this.leadsFacade.error;
    readonly hasLoaded = computed(() => this.stateService.leadsLoaded());

    /** Nivået som vises. Telefon er standard, og valget huskes mellom sidebytter. */
    readonly view = signal<KpiView>('calls');

    readonly year = computed(() => this.leadsFacade.loadedAt().getFullYear());

    readonly demoKpi = computed(() =>
        this.leadsHelper.demoKpiYear(this.stateService.leads(), this.year(), KpiFacadeService.DemoTarget, this.leadsFacade.loadedAt()));

    /** Den første i måneden som vises. Starter på inneværende måned. */
    readonly month = signal(this.firstOfMonth(new Date()));

    /** Bakover stopper på januar i år, siden hendelser bare hentes fra årsstart. Fremover stopper på inneværende måned. */
    readonly canGoBack = computed(() => this.month().getMonth() > 0);
    readonly canGoForward = computed(() => this.month() < this.firstOfMonth(this.leadsFacade.loadedAt()));

    readonly kpi = computed(() => {
        const month = this.month();
        return this.leadsHelper.callKpiMonth(
            this.stateService.leadEvents(), month.getFullYear(), month.getMonth(), KpiFacadeService.CallTarget, this.leadsFacade.loadedAt());
    });

    setView(view: KpiView): void {
        this.view.set(view);
    }

    previousMonth(): void {
        if (this.canGoBack()) this.month.update(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    }

    nextMonth(): void {
        if (this.canGoForward()) this.month.update(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    }

    ensureLoaded(): void {
        this.leadsFacade.ensureLoaded();
    }

    refresh(): void {
        this.leadsFacade.load();
    }

    private firstOfMonth(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }
}
