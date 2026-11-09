import { Injectable, inject } from '@angular/core';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { ILoginRequest } from '../../_interfaces/interface-auth';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Rene kall mot Supabase Auth. Ingen tilstand, den ligger i StateService via AuthFacadeService.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly supabase = inject(SupabaseService);

    async getSession(): Promise<Session | null> {
        const { data, error } = await this.supabase.client.auth.getSession();
        if (error) throw error;
        return data.session;
    }

    onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): void {
        this.supabase.client.auth.onAuthStateChange(callback);
    }

    async signIn(request: ILoginRequest): Promise<Session> {
        const { data, error } = await this.supabase.client.auth.signInWithPassword(request);
        if (error || !data.session) throw error ?? new Error("Ingen sesjon");
        return data.session;
    }

    async signOut(): Promise<void> {
        const { error } = await this.supabase.client.auth.signOut();
        if (error) throw error;
    }
}
