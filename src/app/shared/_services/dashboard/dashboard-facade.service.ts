import { Injectable, inject, signal } from '@angular/core';
import { StateService } from '../__state/state.service';
import { LeadsService } from '../leads/leads.service';

/**
 * Henter tallene dashbordet viser og legger dem i StateService.
 */
@Injectable({
    providedIn: 'root'
})
export class DashboardFacadeService {

    private readonly stateService = inject(StateService);
    private readonly leadsService = inject(LeadsService);

    readonly isLoading = signal(false);
    readonly error = signal('');

    async load(): Promise<void> {
        this.isLoading.set(true);
        this.error.set('');
        try {
            this.stateService.leadsCount.set(await this.leadsService.getCount());
        } catch {
            this.error.set('Fikk ikke hentet tallene. Prøv å oppdatere.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
