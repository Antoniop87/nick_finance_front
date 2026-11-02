import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { httpErrorMessage } from '../../../../core/http/http-error';
import { TipoLancamento } from '../../../../core/models/tipo-lancamento';
import { Icon } from '../../../../shared/ui/icon/icon';
import { Modal } from '../../../../shared/ui/modal/modal';
import { ColorPicker, IconPicker } from '../../../../shared/ui/pickers/pickers';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Categoria } from '../../data-access/categoria.models';
import { CategoriaStore } from '../../data-access/categoria.store';
import { CategoriaBadge } from '../categoria-badge/categoria-badge';

/** Criar (com `tipo`) ou editar (com `categoria`) uma categoria. */
@Component({
  selector: 'app-categoria-dialog',
  imports: [ReactiveFormsModule, Modal, Icon, IconPicker, ColorPicker, CategoriaBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [title]="categoria() ? 'Editar categoria' : 'Nova categoria'"
      [subtitle]="tipoAtual() === 'receita' ? 'Categoria de entradas' : 'Categoria de despesas'"
      icon="tag"
      (closed)="closed.emit()"
    >
      <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error(); as message) {
          <div class="alert alert-error" role="alert"><app-icon name="alert" /> {{ message }}</div>
        }

        <div class="preview">
          <app-categoria-badge [categoria]="preview()" [showName]="true" />
        </div>

        <div class="field">
          <label for="nome">Nome</label>
          <input id="nome" class="input" formControlName="nome" placeholder="Ex.: Pets" />
          @if (form.controls.nome.touched && form.controls.nome.invalid) {
            <span class="field-error">Informe o nome (até 60 caracteres).</span>
          }
        </div>

        <div class="field">
          <span class="label">Cor</span>
          <app-color-picker formControlName="cor" />
        </div>

        <div class="field">
          <span class="label">Ícone</span>
          <app-icon-picker formControlName="icone" [color]="valores().cor ?? '#6366f1'" />
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="closed.emit()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="submitting()">
            @if (submitting()) {
              <span class="spinner"></span>
            }
            {{ categoria() ? 'Salvar alterações' : 'Criar categoria' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
  styles: `
    .preview {
      display: flex;
      justify-content: center;
      padding: 14px;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius);
      background: var(--surface-muted);
    }

    .label {
      font-size: 0.82rem;
      font-weight: 600;
    }
  `,
})
export class CategoriaDialog implements OnInit {
  private readonly store = inject(CategoriaStore);
  private readonly toast = inject(ToastService);

  readonly tipo = input<TipoLancamento>('despesa');
  readonly categoria = input<Categoria | null>(null);
  readonly closed = output<void>();

  protected readonly tipoAtual = computed(() => this.categoria()?.tipo ?? this.tipo());

  protected readonly form = inject(NonNullableFormBuilder).group({
    nome: ['', [Validators.required, Validators.maxLength(60)]],
    cor: ['#6366f1', Validators.required],
    icone: ['tag', Validators.required],
  });

  protected readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly preview = computed<Categoria>(() => ({
    id: 0,
    tipo: this.tipoAtual(),
    nome: this.valores().nome?.trim() || 'Nova categoria',
    cor: this.valores().cor ?? '#6366f1',
    icone: this.valores().icone ?? 'tag',
  }));

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const categoria = this.categoria();
    if (categoria) {
      this.form.setValue({ nome: categoria.nome, cor: categoria.cor, icone: categoria.icone });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const dados = { ...this.form.getRawValue(), tipo: this.tipoAtual() };
    const existente = this.categoria();

    this.submitting.set(true);
    this.error.set(null);
    (existente ? this.store.update(existente.id, dados) : this.store.create(dados))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(existente ? 'Categoria atualizada.' : 'Categoria criada.');
          this.closed.emit();
        },
        error: (err: unknown) =>
          this.error.set(httpErrorMessage(err, { 400: 'Confira os dados informados.' }, 'Não foi possível salvar.')),
      });
  }
}
