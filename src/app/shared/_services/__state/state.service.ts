import { Injectable, computed, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { ILead, ILeadEvent, IPipelineStep } from '../../_interfaces/interface-leads';

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
    /** Hendelser fra årsstart, alle typer, nyeste først. */
    readonly leadEvents = signal<Array<ILeadEvent>>([]);
    /** false til første vellykkede henting, så visningen kan skille tomt fra ikke lastet. */
    readonly leadsLoaded = signal(false);
    /** Dialogen «Opprett lead» på Leads-siden. */
    readonly isLeadFormOpen = signal(false);
}
