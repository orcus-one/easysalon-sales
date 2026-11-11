import { Component, ElementRef, HostListener, effect, inject, viewChild } from '@angular/core';
import { LeadNoteFacadeService } from '../../_services/lead-note/lead-note-facade.service';

/**
 * Dialogen «Nytt notat». Står én gang på Leads-siden og styres av StateService.noteTarget. Åpnes fra
 * leadpanelet.
 */
@Component({
  selector: 'app-note-dialog',
  templateUrl: './note-dialog.component.html',
  styleUrl: './note-dialog.component.scss'
})
export class NoteDialogComponent {

  private readonly leadNoteFacade = inject(LeadNoteFacadeService);

  readonly target = this.leadNoteFacade.target;
  readonly isSaving = this.leadNoteFacade.isSaving;
  readonly saveError = this.leadNoteFacade.saveError;

  private readonly bodyField = viewChild<ElementRef<HTMLTextAreaElement>>('bodyField');

  constructor() {
    // Markøren settes i tekstfeltet hver gang dialogen åpnes.
    effect(() => this.bodyField()?.nativeElement.focus());
  }

  close(): void {
    this.leadNoteFacade.close();
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
    const body = String(new FormData(event.target as HTMLFormElement).get('body') ?? '');
    this.leadNoteFacade.save(body);
  }
}
