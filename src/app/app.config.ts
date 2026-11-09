import { registerLocaleData } from '@angular/common';
import localeNb from '@angular/common/locales/nb';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';

registerLocaleData(localeNb);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Norsk formatering av dato og tall i hele appen.
    { provide: LOCALE_ID, useValue: 'nb' },
    // Hash-ruting: GitHub Pages kjenner ikke rutene våre, så /#/dashboard virker uten omveier.
    provideRouter(routes, withHashLocation())
  ]
};
