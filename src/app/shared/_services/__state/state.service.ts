import { Injectable, computed, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { ILead, ILeadDetail, ILeadEvent, ILeadEventDetail, IOrganisation, IPipelineStep, ISource } from '../../_interfaces/interface-leads';

/**
 * All delt tilstand i appen, som i eris-fe. Komponentene leser signals herfra og
 * skriver via facade-tjenestene, aldri direkte.
 */
@Injectable({
    providedIn: 'root'
})
export class StateService {

    // Auth
    /** Innlogget sesjon fra Supabase Auth. undefined = ikke avklart ennå, null = ikke innlogget. */
    readonly session = signal<Session | null | undefined>(undefined);
    readonly isLoggedIn = computed(() => !!this.session());
    readonly userEmail = computed(() => this.session()?.user.email ?? '');

    // Skall
    /** Mobilmenyen (panelet fra siden). Lukkes ved navigasjon og klikk utenfor. */
    readonly isMenuOpen = signal(false);

    // Leads
    readonly leads = signal<Array<ILead>>([]);
    readonly pipelineSteps = signal<Array<IPipelineStep>>([]);
    /** Kildene fra public.kilder i rekkefølge, også de som ikke er aktive. */
    readonly sources = signal<Array<ISource>>([]);
    /** Selgerens organisasjoner, normalt én. Nye leads knyttes til den. */
    readonly organisations = signal<Array<IOrganisation>>([]);
    /** Hendelser fra årsstart, alle typer, nyeste først. */
    readonly leadEvents = signal<Array<ILeadEvent>>([]);
    /** false til første vellykkede henting, så visningen kan skille tomt fra ikke lastet. */
    readonly leadsLoaded = signal(false);
    /** Dialogen «Opprett lead» på Leads-siden. */
    readonly isLeadFormOpen = signal(false);

    // Detaljvisningen av ett lead
    /** Leadet som er åpnet, null før det er hentet eller når id-en ikke finnes. */
    readonly curLead = signal<ILeadDetail | null>(null);
    /** Alle hendelsene på leadet som er åpnet, nyeste først. */
    readonly curLeadEvents = signal<Array<ILeadEventDetail>>([]);
}
