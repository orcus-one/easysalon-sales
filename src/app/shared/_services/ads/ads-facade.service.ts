import { Injectable, computed, inject, signal } from '@angular/core';
import { StateService } from '../__state/state.service';
import { LeadsFacadeService } from '../leads/leads-facade.service';
import { AdsHelperService } from './ads-helper.service';
import { AdsService } from './ads.service';

/**
 * Siden «Annonser»: hva annonsene på Meta har kostet, og hva som har skjedd med leadene de ga. Kampanjer og
 * dagkostnader hentes første gang siden åpnes; leadene deles med resten av appen via LeadsFacadeService.
 */
@Injectable({
    providedIn: 'root'
})
export class AdsFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsFacade = inject(LeadsFacadeService);
    private readonly adsService = inject(AdsService);
    private readonly adsHelper = inject(AdsHelperService);

    /**
     * Periodene i dager, 0 = alt. Lengre enn ellers i appen (Kenneth 2026-11-12): et lead bruker tid på å bli
     * kunde, så korte perioder får annonsene til å se dårligere ut enn de er.
     */
    static readonly DayOptions = [30, 90, 0];

    readonly days = signal(AdsFacadeService.DayOptions[1]);

    private readonly isLoadingAds = signal(false);
    private readonly adsError = signal('');

    readonly isLoading = computed(() => this.isLoadingAds() || this.leadsFacade.isLoading());
    readonly error = computed(() => this.adsError() || this.leadsFacade.error());
    readonly hasLoaded = computed(() => this.stateService.adsLoaded() && this.stateService.leadsLoaded());
    readonly loadedAt = this.leadsFacade.loadedAt;

    private readonly fromKey = computed(() => this.adsHelper.fromKey(this.loadedAt(), this.days()));
    readonly bucketSize = computed(() => this.adsHelper.bucketSize(this.days()));

    /** Regnestykket per kampanje for leadene som kom inn i perioden. */
    readonly rows = computed(() => this.adsHelper.campaignRows(
        this.stateService.campaigns(), this.stateService.dailyAdCosts(), this.stateService.leads(), this.fromKey()));
    readonly totals = computed(() => this.adsHelper.totals(this.rows()));

    /** Utviklingen etter kalenderen i samme periode. */
    readonly buckets = computed(() => this.adsHelper.buckets(
        this.stateService.dailyAdCosts(), this.stateService.leads(), this.loadedAt(), this.fromKey(), this.bucketSize()));

    setDays(days: number): void {
        this.days.set(days);
    }

    ensureLoaded(): void {
        this.leadsFacade.ensureLoaded();
        if (!this.stateService.adsLoaded() && !this.isLoadingAds()) this.loadAds();
    }

    refresh(): void {
        this.leadsFacade.load();
        this.loadAds();
    }

    private async loadAds(): Promise<void> {
        this.isLoadingAds.set(true);
        this.adsError.set('');
        try {
            const [campaigns, costs] = await Promise.all([this.adsService.getCampaigns(), this.adsService.getDailyCosts()]);
            this.stateService.campaigns.set(campaigns);
            this.stateService.dailyAdCosts.set(costs);
            this.stateService.adsLoaded.set(true);
        } catch {
            this.adsError.set('Fikk ikke hentet annonsetallene. Prøv å oppdatere.');
        } finally {
            this.isLoadingAds.set(false);
        }
    }
}
