import { Injectable, computed, inject } from '@angular/core';
import { StateService } from '../__state/state.service';
import { KpiFacadeService } from '../kpi/kpi-facade.service';
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
    private readonly kpiFacade = inject(KpiFacadeService);
    private readonly leadsFacade = inject(LeadsFacadeService);
    private readonly leadsHelper = inject(LeadsHelperService);

    static readonly ActivityDays = LeadsFacadeService.ActivityDays;

    /**
     * Bolkene under nøkkeltallene på Oversikt. active styrer om bolken vises. Pipeline, kilder og aktivitet er
     * slått av (Kenneth 2026-11-26), men koden står, så de slås på igjen ved å sette active til true.
     */
    static readonly Sections = {
        calls: { active: true },
        demos: { active: true },
        pipeline: { active: false },
        sources: { active: false },
        activity: { active: false }
    };

    readonly isLoading = this.leadsFacade.isLoading;
    readonly error = this.leadsFacade.error;
    readonly loadedAt = this.leadsFacade.loadedAt;
    readonly hasLoaded = computed(() => this.stateService.leadsLoaded());

    readonly kpis = computed(() => this.leadsHelper.kpis(this.stateService.leads(), this.loadedAt()));
    readonly pipeline = computed(() => this.leadsHelper.pipeline(this.stateService.leads(), this.stateService.pipelineSteps()));
    readonly bySource = computed(() => this.leadsHelper.bySource(this.stateService.leads(), this.stateService.sources()));
    readonly activity = computed(() => this.leadsHelper.activity(this.stateService.leadEvents(), this.loadedAt()));
    /** Samme dagsmål som KPI-siden, så grafen og KPI-kortene sier det samme om en dag. */
    static readonly CallTarget = KpiFacadeService.CallTarget;
    readonly dailyCalls = computed(() => this.leadsHelper.dailyCalls(
        this.stateService.leadEvents(), this.loadedAt(), DashboardFacadeService.ActivityDays, DashboardFacadeService.CallTarget));

    /** Telefonene denne uken mot ukemålet, med hva som mangler og om han ligger foran eller etter skjema. */
    readonly callWeek = computed(() =>
        this.leadsHelper.callWeek(this.stateService.leadEvents(), this.loadedAt(), DashboardFacadeService.CallTarget));

    /** Demoer registrert som holdt de siste 30 dagene, som nøkkeltall. Samme vindu som «Nye» og «Vunnet». */
    readonly completedDemosLast30 = computed(() =>
        this.leadsHelper.completedDemosSince(this.stateService.leadEvents(), this.loadedAt(), 30));

    /** Samme ukemål som KPI-siden. */
    static readonly DemoTarget = KpiFacadeService.DemoTarget;
    /** Antall uker i demografen, til og med denne. */
    static readonly DemoWeeks = 12;
    /**
     * Ukene i demografen: de siste ukene til og med denne, pluss neste uke som viser det som er booket. Hentet
     * fra samme utregning som KPI-siden, så grafen og ukekortene sier det samme. Utregningen gjelder inneværende
     * år, så tidlig i året er det færre uker, og i årets siste uke mangler neste uke.
     */
    readonly weeklyDemos = computed(() => {
        const weeks = this.kpiFacade.demoKpi().weeks;
        const passed = weeks.filter(w => !w.isFuture).slice(-DashboardFacadeService.DemoWeeks);
        const next = weeks.find(w => w.isFuture);
        return next ? [...passed, next] : passed;
    });

    ensureLoaded(): void {
        this.leadsFacade.ensureLoaded();
    }

    refresh(): void {
        this.leadsFacade.load();
    }
}
