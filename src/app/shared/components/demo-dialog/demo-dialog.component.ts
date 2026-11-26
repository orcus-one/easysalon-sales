import { Component, ElementRef, HostListener, effect, inject, viewChild } from '@angular/core';
import { LeadDemoFacadeService } from '../../_services/lead-demo/lead-demo-facade.service';

/**
 * Dialogen «Demo gjennomført». Står én gang på sidene som har leadpanelet og styres av StateService.demoTarget.
 * Åpnes fra leadpanelet.
 */
@Component({
  selector: 'app-demo-dialog',
  templateUrl: './demo-dialog.component.html',
  styleUrl: './demo-dialog.component.scss'
})
export class DemoDialogComponent {

  private readonly leadDemoFacade = inject(LeadDemoFacadeService);

  readonly target = this.leadDemoFacade.target;
  readonly isSaving = this.leadDemoFacade.isSaving;
  readonly saveError = this.leadDemoFacade.saveError;
  readonly isSavedWithError = this.leadDemoFacade.isSavedWithError;
  readonly today = this.leadDemoFacade.today;

  private readonly dateField = viewChild<ElementRef<HTMLInputElement>>('dateField');

  constructor() {
    // Markøren settes i datofeltet hver gang dialogen åpnes.
    effect(() => this.dateField()?.nativeElement.focus());
  }

  close(): void {
    this.leadDemoFacade.close();
  }

  /** Escape lukker dialogen. Hendelsen merkes som brukt, så leadpanelet under ikke lukkes av samme tastetrykk. */
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.target()) return;
    event.preventDefault();
    this.close();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const date = String(new FormData(event.target as HTMLFormElement).get('date') ?? '');
    this.leadDemoFacade.save(date);
  }
}
