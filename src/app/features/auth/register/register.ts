import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { httpErrorMessage } from '../../../core/http/http-error';
import { Icon } from '../../../shared/ui/icon/icon';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AuthLayout } from '../auth-layout/auth-layout';
import { matchFields, notInFuture } from '../validators';

const PASSWORD_MIN_LENGTH = 6;

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      nome: ['', [Validators.required, Validators.maxLength(60)]],
      sobrenome: ['', [Validators.required, Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email]],
      dataNascimento: ['', [Validators.required, notInFuture]],
      password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchFields('password', 'confirmPassword') },
  );

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { confirmPassword: _, ...data } = this.form.getRawValue();
    const credentials = { email: data.email.trim(), password: data.password };

    this.submitting.set(true);
    this.error.set(null);

    // Após criar a conta já autentica, para o usuário não digitar tudo de novo.
    this.auth
      .register({ ...data, nome: data.nome.trim(), sobrenome: data.sobrenome.trim(), email: credentials.email })
      .pipe(
        switchMap(() => this.auth.login(credentials)),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (user) => {
          this.toast.success(`Conta criada! Bem-vindo, ${user.nome}.`);
          void this.router.navigate(['/dashboard']);
        },
        error: (err: unknown) =>
          this.error.set(
            httpErrorMessage(
              err,
              {},
              'Não foi possível criar a conta. Verifique se este e-mail já está cadastrado.',
            ),
          ),
      });
  }
}
