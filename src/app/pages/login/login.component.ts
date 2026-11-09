import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacadeService } from '../../shared/_services/auth/auth-facade.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private readonly authFacade = inject(AuthFacadeService);

  readonly isLoggingIn = this.authFacade.isLoggingIn;
  readonly loginError = this.authFacade.loginError;
  readonly today = new Date();

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.authFacade.login(this.form.getRawValue());
  }
}
