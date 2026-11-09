import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Kall mot tabellen leads via Data API. RLS avgjør hva den innloggede får se.
 */
@Injectable({
    providedIn: 'root'
})
export class LeadsService {

    private readonly supabase = inject(SupabaseService);

    async getCount(): Promise<number> {
        const { count, error } = await this.supabase.client
            .from('leads')
            .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
    }
}
