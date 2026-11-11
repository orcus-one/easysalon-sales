import { Injectable, inject } from '@angular/core';
import { ILead, ILeadDetail, ILeadEvent, ILeadEventDetail, ILeadInsert, IOrganisation, IPipelineStep, ISource } from '../../_interfaces/interface-leads';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Kall mot leads, pipeline_steg og kilder via Data API. RLS avgjør hva den innloggede får se.
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
        'id, navn, bedriftsnavn, orgnummer, telefon, epost, kilde_id, kilde, status, opprettet_ekst, neste_oppfolging, oppfolging_tid, ' +
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

    private static readonly LeadDetailColumns = LeadsService.LeadColumns + ', notater, forst_kontakt_at, oppdatert_at';

    /** Ett lead med notat og tidspunkter, null når id-en ikke finnes. */
    async getLead(id: string): Promise<ILeadDetail | null> {
        const { data, error } = await this.supabase.client
            .from('leads')
            .select<string, ILeadDetail>(LeadsService.LeadDetailColumns)
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    /** Alle hendelser på ett lead uansett alder, nyeste først, med kommentar. Sidevis som getEvents. */
    async getLeadEvents(leadId: string): Promise<Array<ILeadEventDetail>> {
        const all: Array<ILeadEventDetail> = [];
        for (let from = 0; ; from += LeadsService.PageSize) {
            const { data, error } = await this.supabase.client
                .from('lead_hendelser')
                .select<string, ILeadEventDetail>('id, lead_id, type, fra_status, til_status, kommentar, opprettet_at')
                .eq('lead_id', leadId)
                .order('opprettet_at', { ascending: false })
                .range(from, from + LeadsService.PageSize - 1);
            if (error) throw error;
            all.push(...(data ?? []));
            if (!data || data.length < LeadsService.PageSize) break;
        }
        return all;
    }

    /** Oppretter et lead. Regelen «Authenticated users can insert» på leads er på plass (Kenneth 2026-11-10). */
    async createLead(row: ILeadInsert): Promise<void> {
        const { error } = await this.supabase.client.from('leads').insert(row);
        if (error) throw error;
    }

    /** Organisasjonene dashbordet kan skrive til. Forventet én rad. */
    async getOrganisations(): Promise<Array<IOrganisation>> {
        const { data, error } = await this.supabase.client
            .from('organisasjoner')
            .select<string, IOrganisation>('id');
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

    /** Alle kildene i rekkefølge, også de som ikke er aktive, siden eldre leads kan peke på dem. */
    async getSources(): Promise<Array<ISource>> {
        const { data, error } = await this.supabase.client
            .from('kilder')
            .select<string, ISource>('id, nokkel, label, rekkefolge, aktiv')
            .order('rekkefolge', { ascending: true });
        if (error) throw error;
        return data ?? [];
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
