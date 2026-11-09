import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacadeService } from '../_services/auth/auth-facade.service';
import { StateService } from '../_services/__state/state.service';

/**
 * Begge guardene venter på at første sesjonsoppslag er gjort, og leser deretter GJELDENDE
 * sesjon fra StateService. Svaret fra oppslaget kan ikke brukes direkte: det er null ved oppstart,
 * og etter innlogging er det StateService som har den nye sesjonen.
 */

/** Slipper bare innloggede inn, ellers til /login. */
export const authGuard: CanActivateFn = async () => {
    const authFacade = inject(AuthFacadeService);
    const stateService = inject(StateService);
    const router = inject(Router);
    await authFacade.whenReady();
    return stateService.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

/** Motsatt: en innlogget bruker skal ikke se innloggingssiden. */
export const guestGuard: CanActivateFn = async () => {
    const authFacade = inject(AuthFacadeService);
    const stateService = inject(StateService);
    const router = inject(Router);
    await authFacade.whenReady();
    return stateService.isLoggedIn() ? router.createUrlTree(['/dashboard']) : true;
};
