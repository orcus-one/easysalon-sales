import { Injectable, inject } from '@angular/core';
import { ICampaign, IDailyAdCost } from '../../_interfaces/interface-ads';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Kall mot kampanjer og kostnad_daglig via Data API. Begge fylles av selgerens import fra Meta; Hermes bare leser.
 */
@Injectable({
    providedIn: 'root'
})
export class AdsService {

    private readonly supabase = inject(SupabaseService);

    private static readonly PageSize = 1000;

    async getCampaigns(): Promise<Array<ICampaign>> {
        const { data, error } = await this.supabase.client
            .from('kampanjer')
            .select<string, ICampaign>('id, meta_kampanje_id, navn, status')
            .limit(AdsService.PageSize);
        if (error) throw error;
        return data ?? [];
    }

    /** Alle dagradene, eldste først. Hentes sidevis, PostgREST gir maks 1000 per kall. */
    async getDailyCosts(): Promise<Array<IDailyAdCost>> {
        const all: Array<IDailyAdCost> = [];
        for (let from = 0; ; from += AdsService.PageSize) {
            const { data, error } = await this.supabase.client
                .from('kostnad_daglig')
                .select<string, IDailyAdCost>('dato, meta_kampanje_id, kost_nok, visninger, leads_fb')
                .order('dato', { ascending: true })
                .order('id', { ascending: true })
                .range(from, from + AdsService.PageSize - 1);
            if (error) throw error;
            all.push(...(data ?? []));
            if (!data || data.length < AdsService.PageSize) break;
        }
        return all;
    }
}
