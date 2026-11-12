import { Injectable, inject } from '@angular/core';
import { AdBucketSize, IAdBucket, IAdCampaignRow, IAdSummary, ICampaign, IDailyAdCost } from '../../_interfaces/interface-ads';
import { ILead } from '../../_interfaces/interface-leads';
import { LeadsHelperService } from '../leads/leads-helper.service';

/** Tellerne som summeres før forholdstallene regnes ut. */
interface IAdCounts {
    spend: number;
    impressions: number;
    metaLeads: number;
    leads: number;
    demos: number;
    customers: number;
}

/**
 * Rene beregninger på annonsekostnader og leadene som kom fra annonsene. Ingen tilstand, ingen kall.
 */
@Injectable({
    providedIn: 'root'
})
export class AdsHelperService {

    private readonly leadsHelper = inject(LeadsHelperService);

    /** Raden for kostnader og leads som peker på en kampanje som ikke finnes i kampanjer. */
    static readonly UnknownKey = 'unknown';

    /** Første dag i perioden som yyyy-MM-dd, i dag medregnet. days = 0 betyr alt, og gir tom streng. */
    fromKey(now: Date, days: number): string {
        return days > 0 ? this.leadsHelper.toDateKey(this.leadsHelper.addDays(now, -(days - 1))) : '';
    }

    private createdKey(lead: ILead): string {
        return this.leadsHelper.toDateKey(new Date(lead.opprettet_ekst));
    }

    private emptyCounts(): IAdCounts {
        return { spend: 0, impressions: 0, metaLeads: 0, leads: 0, demos: 0, customers: 0 };
    }

    private summary(counts: IAdCounts): IAdSummary {
        const per = (count: number) => count > 0 ? counts.spend / count : null;
        return { ...counts, costPerLead: per(counts.leads), costPerDemo: per(counts.demos), costPerCustomer: per(counts.customers) };
    }

    /**
     * Én rad per kampanje for leadene som kom inn fra og med fromKey: kroner brukt i perioden, og hvor mange av
     * akkurat de leadene som har fått demo (booket eller holdt) og er registrert som kunde. Kampanjer uten
     * forbruk og uten leads i perioden er ikke med. Størst forbruk først.
     */
    campaignRows(campaigns: Array<ICampaign>, costs: Array<IDailyAdCost>, leads: Array<ILead>, fromKey: string): Array<IAdCampaignRow> {
        const campaignById = new Map(campaigns.map(c => [c.id, c]));
        const idByMetaId = new Map(campaigns.filter(c => c.meta_kampanje_id !== null).map(c => [c.meta_kampanje_id as string, c.id]));
        const countsByKey = new Map<string, IAdCounts>();
        const countsFor = (key: string): IAdCounts => {
            let counts = countsByKey.get(key);
            if (!counts) {
                counts = this.emptyCounts();
                countsByKey.set(key, counts);
            }
            return counts;
        };

        for (const cost of costs) {
            if (cost.dato < fromKey) continue;
            const counts = countsFor(idByMetaId.get(cost.meta_kampanje_id) ?? AdsHelperService.UnknownKey);
            counts.spend += cost.kost_nok;
            counts.impressions += cost.visninger;
            counts.metaLeads += cost.leads_fb;
        }
        for (const lead of leads) {
            if (lead.kampanje_id === null || this.createdKey(lead) < fromKey) continue;
            const counts = countsFor(campaignById.has(lead.kampanje_id) ? lead.kampanje_id : AdsHelperService.UnknownKey);
            counts.leads += 1;
            if (lead.demo_dato !== null) counts.demos += 1;
            if (lead.registrert_dato !== null) counts.customers += 1;
        }

        return [...countsByKey.entries()]
            .map(([key, counts]) => {
                const campaign = campaignById.get(key);
                return { key, name: campaign?.navn ?? 'Ukjent kampanje', status: campaign?.status ?? null, ...this.summary(counts) };
            })
            .sort((a, b) => b.spend - a.spend || b.leads - a.leads);
    }

    /** Summen av radene, med forholdstallene regnet på summene. */
    totals(rows: Array<IAdCampaignRow>): IAdSummary {
        const counts = this.emptyCounts();
        for (const row of rows) {
            counts.spend += row.spend;
            counts.impressions += row.impressions;
            counts.metaLeads += row.metaLeads;
            counts.leads += row.leads;
            counts.demos += row.demos;
            counts.customers += row.customers;
        }
        return this.summary(counts);
    }

    /** Dager opp til en måned, uker opp til et kvartal, ellers måneder. */
    bucketSize(days: number): AdBucketSize {
        return days > 0 && days <= 31 ? 'day' : days > 0 ? 'week' : 'month';
    }

    private toDate(dateKey: string): Date {
        return new Date(dateKey + 'T00:00:00');
    }

    /** Nøkkelen til stolpen en dato hører til: dagen selv, mandagen i uken, eller yyyy-MM. */
    private bucketKey(dateKey: string, size: AdBucketSize): string {
        if (size === 'day') return dateKey;
        if (size === 'month') return dateKey.slice(0, 7);
        const date = this.toDate(dateKey);
        return this.leadsHelper.toDateKey(this.leadsHelper.addDays(date, -((date.getDay() + 6) % 7)));
    }

    private emptyBucket(key: string, size: AdBucketSize, isFirst: boolean): IAdBucket {
        const date = this.toDate(size === 'month' ? key + '-01' : key);
        const dayAndMonth = `${date.getDate()}.${date.getMonth() + 1}`;
        let label: string;
        let title: string;
        if (size === 'day') {
            label = isFirst || date.getDate() === 1 ? dayAndMonth : `${date.getDate()}`;
            title = date.toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' });
        } else if (size === 'week') {
            label = dayAndMonth;
            title = 'Uken fra ' + date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long' });
        } else {
            const month = date.toLocaleDateString('nb-NO', { month: 'short' }).replace('.', '');
            label = isFirst || date.getMonth() === 0 ? `${month} ${String(date.getFullYear()).slice(2)}` : month;
            title = date.toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' });
        }
        return { key, label, title, spend: 0, leads: 0, demos: 0, customers: 0 };
    }

    /**
     * Utviklingen etter kalenderen fra fromKey til og med i dag: kroner brukt, leads som kom inn, demoer etter
     * demodato og kunder etter registreringsdato, hver på sin egen dato. Bare leads fra annonsene teller.
     * Med fromKey tom begynner den på første dato som finnes.
     */
    buckets(costs: Array<IDailyAdCost>, leads: Array<ILead>, now: Date, fromKey: string, size: AdBucketSize): Array<IAdBucket> {
        const todayKey = this.leadsHelper.toDateKey(now);
        const adLeads = leads.filter(l => l.kampanje_id !== null);

        let startKey = fromKey;
        if (startKey === '') {
            startKey = todayKey;
            for (const cost of costs) if (cost.dato < startKey) startKey = cost.dato;
            for (const lead of adLeads) {
                const created = this.createdKey(lead);
                if (created < startKey) startKey = created;
            }
        }

        const buckets = new Map<string, IAdBucket>();
        for (let date = this.toDate(startKey); this.leadsHelper.toDateKey(date) <= todayKey; date = this.leadsHelper.addDays(date, 1)) {
            const key = this.bucketKey(this.leadsHelper.toDateKey(date), size);
            if (!buckets.has(key)) buckets.set(key, this.emptyBucket(key, size, buckets.size === 0));
        }
        const bucketFor = (dateKey: string | null): IAdBucket | undefined =>
            dateKey === null || dateKey < startKey || dateKey > todayKey ? undefined : buckets.get(this.bucketKey(dateKey, size));

        for (const cost of costs) {
            const bucket = bucketFor(cost.dato);
            if (bucket) bucket.spend += cost.kost_nok;
        }
        for (const lead of adLeads) {
            const created = bucketFor(this.createdKey(lead));
            if (created) created.leads += 1;
            const demo = bucketFor(lead.demo_dato);
            if (demo) demo.demos += 1;
            const customer = bucketFor(lead.registrert_dato);
            if (customer) customer.customers += 1;
        }
        return [...buckets.values()];
    }
}
