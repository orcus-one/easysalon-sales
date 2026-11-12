import { Injectable, computed, effect, inject } from '@angular/core';
import { Theme } from '../../_interfaces/interface-nav';
import { StateService } from '../__state/state.service';

/**
 * Lyst eller mørkt utseende. Brukerens eget valg med bryteren i skallet går foran og huskes i nettleseren.
 * Uten valg følges operativsystemet, også når det endres mens siden står åpen. Fargene henger på
 * data-theme på <html> (styles.scss), som skriptet i index.html setter første gang etter samme regel.
 */
@Injectable({
    providedIn: 'root'
})
export class ThemeFacadeService {

    private static readonly StorageKey = 'hermes-theme';

    private readonly stateService = inject(StateService);

    readonly theme = computed<Theme>(() =>
        this.stateService.chosenTheme() ?? (this.stateService.systemPrefersDark() ? 'dark' : 'light'));
    readonly isDark = computed(() => this.theme() === 'dark');

    constructor() {
        this.stateService.chosenTheme.set(this.readStored());
        const system = window.matchMedia('(prefers-color-scheme: dark)');
        this.stateService.systemPrefersDark.set(system.matches);
        system.addEventListener('change', event => this.stateService.systemPrefersDark.set(event.matches));
        effect(() => document.documentElement.setAttribute('data-theme', this.theme()));
    }

    /** Bytter til det motsatte av det som vises nå, og husker valget. */
    toggle(): void {
        const next: Theme = this.isDark() ? 'light' : 'dark';
        this.stateService.chosenTheme.set(next);
        try {
            localStorage.setItem(ThemeFacadeService.StorageKey, next);
        } catch { /* Uten lagring gjelder valget til siden lastes på nytt. */ }
    }

    private readStored(): Theme | null {
        try {
            const stored = localStorage.getItem(ThemeFacadeService.StorageKey);
            return stored === 'light' || stored === 'dark' ? stored : null;
        } catch {
            return null;
        }
    }
}
