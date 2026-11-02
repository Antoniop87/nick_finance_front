import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { httpErrorMessage } from '../../../core/http/http-error';
import { CurrencyInput } from '../../../shared/ui/currency-input/currency-input';
import { Icon } from '../../../shared/ui/icon/icon';
import { Modal } from '../../../shared/ui/modal/modal';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CategoriaStore } from '../../categorias/data-access/categoria.store';
import { Orcamento } from '../data-access/planejamento.models';
import { OrcamentoStore } from '../data-access/planejamento.stores';

/** Criar ou editar o orçamento mensal de uma categoria de despesa. */
@Component({
  selector: 'app-orcamento-dialog',
  imports: [ReactiveFormsModule, Modal, Icon, CurrencyInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [title]="orcamento() ? 'Editar orçamento' : 'Novo orçamento'"
      subtitle="Defina quanto quer gastar por mês nesta categoria."
      icon="pieChart"
      tone="warning"
      (closed)="closed.emit()"
    >
      <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error(); as message) {
          <div class="alert alert-error" role="alert"><app-icon name="alert" /> {{ message }}</div>
        }

        <div class="field">
          <label for="categoria">Categoria</label>
          <select id="categoria" class="input" formControlName="categoriaId">
            <option [ngValue]="null" disabled>Escolha uma categoria</option>
            @for (categoria of opcoes(); track categoria.id) {
              <option [ngValue]="categoria.id">{{ categoria.nome }}</option>
            }
          </select>
          @if (form.controls.categoriaId.touched && form.controls.categoriaId.invalid) {
            <span class="field-error">Escolha a categoria.</span>
          }
        </div>

        <div class="field">
          <label for="limite">Limite por mês</label>
          <div class="input-prefix">
            <span>R$</span>
            <input id="limite" class="input tabular" appCurrencyInput formControlName="valorLimite" placeholder="0,00" />
          </div>
          @if (form.controls.valorLimite.touched && form.controls.valorLimite.invalid) {
            <span class="field-error">Informe um valor maior que zero.</span>
          }
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="closed.emit()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="submitting()">
            @if (submitting()) {
              <span class="spinner"></span>
            }
            Salvar orçamento
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class OrcamentoDialog implements OnInit {
  private readonly store = inject(OrcamentoStore);
  private readonly categorias = inject(CategoriaStore);
  private readonly toast = inject(ToastService);

  readonly orcamento = input<Orcamento | null>(null);
  /** Categoria pré-selecionada ao criar. */
  readonly categoriaId = input<number | null>(null);
  readonly closed = output<void>();

  /** Categorias de despesa que ainda não têm orçamento (mais a atual, ao editar). */
  protected readonly opcoes = computed(() => {
    const usadas = new Set(this.store.items().map((o) => o.categoriaId));
    const atual = this.orcamento()?.categoriaId;
    return this.categorias.despesas().filter((c) => c.id === atual || !usadas.has(c.id));
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    categoriaId: [null as number | null, Validators.required],
    valorLimite: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const orcamento = this.orcamento();
    this.form.setValue({
      categoriaId: orcamento?.categoriaId ?? this.categoriaId(),
      valorLimite: orcamento?.valorLimite ?? null,
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { categoriaId, valorLimite } = this.form.getRawValue();
    const dados = { categoriaId: Number(categoriaId), valorLimite: valorLimite! };
    const existente = this.orcamento();

    this.submitting.set(true);
    this.error.set(null);
    (existente ? this.store.update(existente.id, dados) : this.store.create(dados))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Orçamento salvo.');
          this.closed.emit();
        },
        error: (err: unknown) =>
          this.error.set(
            httpErrorMessage(err, { 409: 'Essa categoria já tem orçamento.' }, 'Não foi possível salvar.'),
          ),
      });
  }
}
