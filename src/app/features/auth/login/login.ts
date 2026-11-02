import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { httpErrorMessage } from '../../../core/http/http-error';
import { Icon } from '../../../shared/ui/icon/icon';
import { AuthLayout } from '../auth-layout/auth-layout';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Query params preenchidos pelo router (`withComponentInputBinding`). */
  readonly redirect = input<string>();
  readonly sessao = input<string>();
  readonly email = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly sessionExpired = computed(() => this.sessao() === 'expirada');

  ngOnInit(): void {
    const email = this.email();
    if (email) {
      this.form.controls.email.setValue(email);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.safeRedirect()),
        error: (err: unknown) =>
          this.error.set(
            httpErrorMessage(err, {
              401: 'E-mail ou senha incorretos.',
              403: 'E-mail ou senha incorretos.',
            }),
          ),
      });
  }

  /** Só aceita caminhos internos, para evitar redirecionamento para outro site. */
  private safeRedirect(): string {
    const redirect = this.redirect();
    return redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard';
  }
}
