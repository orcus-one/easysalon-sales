import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './shared/_guards/auth.guard';
import { ShellComponent } from './layouts/shell/shell.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LeadsComponent } from './pages/leads/leads.component';
import { LeadDetailComponent } from './pages/lead-detail/lead-detail.component';
import { KpiComponent } from './pages/kpi/kpi.component';
import { UpcomingComponent } from './pages/upcoming/upcoming.component';
import { HistoryComponent } from './pages/history/history.component';
import { MonthlyComponent } from './pages/monthly/monthly.component';
import { AdsComponent } from './pages/ads/ads.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  {
    // Alle innloggede sider ligger under skallet (topplinje og meny).
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      // Leadet er barnerute av listen: det vises som panel oppå den, og listen beholder rulleposisjonen.
      { path: 'leads', component: LeadsComponent, children: [{ path: ':id', component: LeadDetailComponent }] },
      { path: 'kpi', component: KpiComponent },
      { path: 'kommende', component: UpcomingComponent },
      // Samme panel som på Leads-siden, åpnet fra navnet i en hendelse.
      { path: 'historikk', component: HistoryComponent, children: [{ path: ':id', component: LeadDetailComponent }] },
      { path: 'aar', component: MonthlyComponent },
      { path: 'annonser', component: AdsComponent },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
