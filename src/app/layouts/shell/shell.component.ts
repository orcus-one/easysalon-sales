import { Component, HostListener, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthFacadeService } from '../../shared/_services/auth/auth-facade.service';
import { StateService } from '../../shared/_services/__state/state.service';
import { ThemeFacadeService } from '../../shared/_services/theme/theme-facade.service';
import { INavItem } from '../../shared/_interfaces/interface-nav';

/**
 * Skallet rundt alle innloggede sider: topplinje med meny på desktop, panel fra siden på mobil.
 * Sidene ligger som barneruter og rendres i router-outlet.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {

  private readonly stateService = inject(StateService);
  private readonly authFacade = inject(AuthFacadeService);
  private readonly router = inject(Router);
  private readonly themeFacade = inject(ThemeFacadeService);

  readonly isDark = this.themeFacade.isDark;
  readonly userEmail = this.stateService.userEmail;
  readonly isMenuOpen = this.stateService.isMenuOpen;

  readonly navItems: Array<INavItem> = [
    { path: '/dashboard', label: 'Oversikt' },
    { path: '/kpi', label: 'KPI' },
    { path: '/leads', label: 'Leads' },
    { path: '/kommende', label: 'Kommende' },
    { path: '/historikk', label: 'Løpende aktivitet' },
    { path: '/aar', label: 'Hittil i år' },
    { path: '/annonser', label: 'Annonser' }
  ];

  constructor() {
    // Lukk mobilmenyen når en lenke faktisk har navigert.
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.closeMenu());
  }

  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  toggleTheme(): void {
    this.themeFacade.toggle();
  }

  logout(): void {
    this.closeMenu();
    this.authFacade.logout();
  }
}
