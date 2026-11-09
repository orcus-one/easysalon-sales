import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { ILoginRequest } from '../../_interfaces/interface-auth';
import { StateService } from '../__state/state.service';
import { AuthService } from './auth.service';

/**
 * Orkestrerer innlogging: holder StateService.session oppdatert og navigerer.
 * Komponentene kaller login() og logout(), og leser status fra signals.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthFacadeService {

    private readonly stateService = inject(StateService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly isLoggingIn = signal(false);
    readonly loginError = signal('');

    /** Løses når første sesjonsoppslag er gjort. Guardene venter på denne og leser så StateService. */
    private readonly ready: Promise<void>;

    constructor() {
        this.ready = this.authService.getSession()
            .catch(() => null)
            .then(session => {
                this.stateService.session.set(session);
            });

        // Holder tilstanden i synk ved tokenfornyelse, utlogging i annen fane osv.
        this.authService.onAuthStateChange((_event, session) => {
            this.stateService.session.set(session);
        });
    }

    whenReady(): Promise<void> {
        return this.ready;
    }

    async login(request: ILoginRequest): Promise<void> {
        this.isLoggingIn.set(true);
        this.loginError.set('');
        try {
            const session = await this.authService.signIn(request);
            this.stateService.session.set(session);
            await this.router.navigate(['/dashboard']);
        } catch {
            // Supabase skiller ikke på feil e-post og feil passord, og det skal heller ikke vi.
            this.loginError.set('Feil e-post eller passord.');
        } finally {
            this.isLoggingIn.set(false);
        }
    }

    async logout(): Promise<void> {
        await this.authService.signOut();
        this.stateService.session.set(null);
        await this.router.navigate(['/login']);
    }
}
