import { Injectable, inject } from '@angular/core';
import { ILead, ILeadEvent, IPipelineStep } from '../../_interfaces/interface-leads';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Kall mot leads og pipeline_steg via Data API. RLS avgjør hva den innloggede får se.
 */
@Injectable({
    providedIn: 'root'
})
export class LeadsService {

    private readonly supabase = inject(SupabaseService);

    // PostgREST returnerer maks 1000 rader om ikke annet er sagt. Grensen her er romslig for
    // dagens volum (846), og må gjøres om til sidevis henting før den nås.
    private static readonly MaxRows = 5000;
    private static readonly PageSize = 1000;

    private static readonly LeadColumns =
        'id, navn, bedriftsnavn, orgnummer, telefon, epost, kilde, status, opprettet_ekst, neste_oppfolging, oppfolging_tid, ' +
        'demo_dato, demo_tid, registrert_dato, lisenser';

    async getLeads(): Promise<Array<ILead>> {
        const { data, error } = await this.supabase.client
            .from('leads')
            .select<string, ILead>(LeadsService.LeadColumns)
            .order('opprettet_ekst', { ascending: false })
            .limit(LeadsService.MaxRows);
        if (error) throw error;
        return data ?? [];
    }

    /** Alle hendelser fra og med since, nyeste først. Hentes sidevis, PostgREST gir maks 1000 per kall. */
    async getEvents(since: Date): Promise<Array<ILeadEvent>> {
        const all: Array<ILeadEvent> = [];
        for (let from = 0; ; from += LeadsService.PageSize) {
            const { data, error } = await this.supabase.client
                .from('lead_hendelser')
                .select<string, ILeadEvent>('id, lead_id, type, fra_status, til_status, opprettet_at')
                .gte('opprettet_at', since.toISOString())
                .order('opprettet_at', { ascending: false })
                .range(from, from + LeadsService.PageSize - 1);
            if (error) throw error;
            all.push(...(data ?? []));
            if (!data || data.length < LeadsService.PageSize) break;
        }
        return all;
    }

    async getPipelineSteps(): Promise<Array<IPipelineStep>> {
        const { data, error } = await this.supabase.client
            .from('pipeline_steg')
            .select<string, IPipelineStep>('nokkel, label, farge, rekkefolge, aktiv')
            .eq('aktiv', true)
            .order('rekkefolge', { ascending: true });
        if (error) throw error;
        return data ?? [];
    }
}
