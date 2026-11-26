import { Injectable, inject } from '@angular/core';
import { ILead, ILeadDetail, ILeadEvent, ILeadEventDetail, ILeadEventInsert, ILeadInsert, ILeadNote, ILeadNoteInsert, IOrganisation, IPipelineStep, ISource } from '../../_interfaces/interface-leads';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Kall mot leads, pipeline_steg og sources via Data API. RLS avgjør hva den innloggede får se.
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
        'id, navn, bedriftsnavn, orgnummer, telefon, epost, source_id, kilde, kampanje_id, status, opprettet_ekst, neste_oppfolging, oppfolging_tid, ' +
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

    /** Notatene på ett lead, nyeste først. */
    async getLeadNotes(leadId: string): Promise<Array<ILeadNote>> {
        const { data, error } = await this.supabase.client
            .from('lead_notes')
            .select<string, ILeadNote>('id, lead_id, body, created_at, created_by_email')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .limit(LeadsService.PageSize);
        if (error) throw error;
        return data ?? [];
    }

    /** Legger til et notat. Tidspunkt og forfatter settes av basen. Regelen «Authenticated users can insert» (2026-11-11). */
    async createLeadNote(row: ILeadNoteInsert): Promise<void> {
        const { error } = await this.supabase.client.from('lead_notes').insert(row);
        if (error) throw error;
    }

    /** Legger en hendelse på et lead. Tidspunktet settes av basen når opprettet_at ikke er med. Krever regelen «Authenticated users can insert» på lead_hendelser (2026-11-25). */
    async createLeadEvent(row: ILeadEventInsert): Promise<void> {
        const { error } = await this.supabase.client.from('lead_hendelser').insert(row);
        if (error) throw error;
    }

    /**
     * Sletter én demoregistrering (hendelse av typen demo_completed). Krever regelen «Authenticated users can
     * delete demo completed» på lead_hendelser (2026-11-26), som bare slipper gjennom den typen. Typen står også
     * i spørringen, så andre hendelser aldri forsøkes slettet. En sletting som RLS stopper gir ingen feil, bare
     * null rader, så raden leses tilbake og null rader regnes som feil.
     */
    async deleteDemoEvent(id: string): Promise<void> {
        const { data, error } = await this.supabase.client
            .from('lead_hendelser')
            .delete()
            .eq('id', id)
            .eq('type', 'demo_completed')
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Event was not deleted');
    }

    /**
     * Setter status på et lead og oppdatert_at til nå. Krever regelen «Authenticated users can update» på leads
     * (2026-11-25). En oppdatering som RLS stopper gir ingen feil, bare null rader, så raden leses tilbake og
     * null rader regnes som feil.
     */
    async updateLeadStatus(id: string, status: string): Promise<void> {
        const { data, error } = await this.supabase.client
            .from('leads')
            .update({ status, oppdatert_at: new Date().toISOString() })
            .eq('id', id)
            .select('id');
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Lead was not updated');
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
            .from('sources')
            .select<string, ISource>('id, key, label, sort_order, active')
            .order('sort_order', { ascending: true });
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
