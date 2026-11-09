# easysalon-sales

Internt salgsverktøy for EasySalon: leads, pipeline, kampanjer og kostnader. Angular-app på GitHub Pages
som leser og skriver rett mot Supabase via Data API. Ingen egen server. Helt adskilt fra EasySalon-plattformen.

Full kontekst: `ES-Context/internverktoy/SALGSDASHBORD.md`.

## Slik henger det sammen
- **Hosting:** GitHub Pages. Push til `main` kjører `.github/workflows/pages.yml`, som bygger og legger ut
  `dist/easysalon-sales/browser`. Siden ligger på `https://orcus-one.github.io/easysalon-sales/`.
- **Data og innlogging:** Supabase-prosjektet `gmxagiafwuluhzfdumqm`. supabase-js holder sesjonen og
  fornyer token. Tilgang styres av Row Level Security i basen, ikke av koden her.
- **Nøkler:** anon-nøkkelen ligger i `src/app/shared/_config/supabase.config.ts` og er offentlig.
  Service-nøkkelen skal aldri inn i repoet.
- **Brukere:** opprettes manuelt i Supabase under Authentication, Users. Selvregistrering er av.

## Oppsett (én gang)
1. Lim inn anon-nøkkelen i `supabase.config.ts` der det står `LIM_INN_ANON_KEY`.
2. Repo, Settings, Pages, Source: **GitHub Actions**.
3. Push til `main`. Første kjøring ses under Actions.

## Lokalt
```
npm install
npm start          # http://localhost:4200
npm run build
```

## Struktur
Samme organisering som eris-fe: lette komponenter, tilstand i `StateService`, kall i `*.service.ts`,
orkestrering i `*-facade.service.ts`, signals og computed.
```
src/app/
  pages/login/                 innlogging
  pages/dashboard/             oversikt
  shared/_config/              Supabase-URL og anon-nøkkel
  shared/_guards/              authGuard, guestGuard
  shared/_interfaces/
  shared/_services/__state/    StateService
  shared/_services/supabase/   den ene Supabase-klienten
  shared/_services/auth/       AuthService (kall), AuthFacadeService (sesjon, navigasjon)
  shared/_services/leads/      LeadsService
  shared/_services/dashboard/  DashboardFacadeService
```
Ruting er hash-basert (`/#/dashboard`) fordi Pages ikke kjenner rutene.
