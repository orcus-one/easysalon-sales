import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../../_config/supabase.config';

/**
 * Eier den ene Supabase-klienten. Alle tjenester som snakker med Supabase går via client.
 * supabase-js holder sesjonen i localStorage og fornyer token selv.
 */
@Injectable({
    providedIn: 'root'
})
export class SupabaseService {

    readonly client: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
