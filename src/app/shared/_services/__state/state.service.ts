import { Injectable, computed, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';

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

    // Dashbord
    /** undefined = ikke hentet ennå. */
    readonly leadsCount = signal<number | undefined>(undefined);
}
