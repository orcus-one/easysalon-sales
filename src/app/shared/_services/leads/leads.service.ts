import { Injectable, inject } from '@angular/core';
import { ILead, IPipelineStep } from '../../_interfaces/interface-leads';
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

    private static readonly LeadColumns =
        'id, navn, bedriftsnavn, kilde, status, opprettet_ekst, neste_oppfolging, oppfolging_tid, ' +
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
