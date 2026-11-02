import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { httpErrorMessage } from '../../../core/http/http-error';
import { toIsoDate } from '../../../core/utils/date';
import { CurrencyInput } from '../../../shared/ui/currency-input/currency-input';
import { Icon } from '../../../shared/ui/icon/icon';
import { Modal } from '../../../shared/ui/modal/modal';
import { ColorPicker, IconPicker } from '../../../shared/ui/pickers/pickers';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { Meta } from '../data-access/planejamento.models';
import { MetaStore } from '../data-access/planejamento.stores';

/** Criar ou editar uma meta de economia. */
@Component({
  selector: 'app-meta-dialog',
  imports: [ReactiveFormsModule, Modal, Icon, CurrencyInput, IconPicker, ColorPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [title]="meta() ? 'Editar meta' : 'Nova meta'"
      subtitle="Um objetivo para guardar dinheiro."
      icon="target"
      tone="success"
      (closed)="closed.emit()"
    >
      <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error(); as message) {
          <div class="alert alert-error" role="alert"><app-icon name="alert" /> {{ message }}</div>
        }

        <div class="field">
          <label for="nome">Nome</label>
          <input id="nome" class="input" formControlName="nome" placeholder="Ex.: Viagem para a praia" />
          @if (form.controls.nome.touched && form.controls.nome.invalid) {
            <span class="field-error">Informe o nome.</span>
          }
        </div>

        <div class="form-row">
          <div class="field">
            <label for="alvo">Quanto quer juntar</label>
            <div class="input-prefix">
              <span>R$</span>
              <input id="alvo" class="input tabular" appCurrencyInput formControlName="valorAlvo" placeholder="0,00" />
            </div>
            @if (form.controls.valorAlvo.touched && form.controls.valorAlvo.invalid) {
              <span class="field-error">Informe um valor maior que zero.</span>
            }
          </div>
          <div class="field">
            <label for="prazo">Até quando <span class="muted">(opcional)</span></label>
            <input id="prazo" class="input" type="date" formControlName="prazo" [min]="hoje" />
          </div>
        </div>

        <div class="field">
          <span class="label">Cor</span>
          <app-color-picker formControlName="cor" />
        </div>
        <div class="field">
          <span class="label">Ícone</span>
          <app-icon-picker formControlName="icone" [color]="cor()" />
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="closed.emit()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="submitting()">
            @if (submitting()) {
              <span class="spinner"></span>
            }
            {{ meta() ? 'Salvar alterações' : 'Criar meta' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
  styles: `
    .label {
      font-size: 0.82rem;
      font-weight: 600;
    }
  `,
})
export class MetaDialog implements OnInit {
  private readonly store = inject(MetaStore);
  private readonly toast = inject(ToastService);

  readonly meta = input<Meta | null>(null);
  readonly closed = output<void>();

  protected readonly hoje = toIsoDate(new Date());
  protected readonly form = inject(NonNullableFormBuilder).group({
    nome: ['', [Validators.required, Validators.maxLength(80)]],
    valorAlvo: [null as number | null, [Validators.required, Validators.min(0.01)]],
    prazo: [''],
    cor: ['#10b981', Validators.required],
    icone: ['target', Validators.required],
  });
  protected readonly cor = toSignal(this.form.controls.cor.valueChanges, { initialValue: '#10b981' });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const meta = this.meta();
    if (meta) {
      this.form.setValue({
        nome: meta.nome,
        valorAlvo: meta.valorAlvo,
        prazo: meta.prazo ? toIsoDate(meta.prazo) : '',
        cor: meta.cor,
        icone: meta.icone,
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dados = { nome: v.nome, valorAlvo: v.valorAlvo!, prazo: v.prazo || null, cor: v.cor, icone: v.icone };
    const existente = this.meta();

    this.submitting.set(true);
    this.error.set(null);
    (existente ? this.store.update(existente.id, dados) : this.store.create(dados))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(existente ? 'Meta atualizada.' : 'Meta criada. Bora juntar!');
          this.closed.emit();
        },
        error: (err: unknown) => this.error.set(httpErrorMessage(err, {}, 'Não foi possível salvar.')),
      });
  }
}

/** Guardar ou retirar dinheiro de uma meta. */
@Component({
  selector: 'app-movimento-dialog',
  imports: [ReactiveFormsModule, Modal, Icon, CurrencyInput, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [title]="retirar() ? 'Retirar da meta' : 'Guardar na meta'"
      [subtitle]="meta().nome + ' · guardado: ' + (meta().valorGuardado | currency)"
      [icon]="retirar() ? 'minus' : 'piggyBank'"
      [tone]="retirar() ? 'warning' : 'success'"
      (closed)="closed.emit()"
    >
      <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error(); as message) {
          <div class="alert alert-error" role="alert"><app-icon name="alert" /> {{ message }}</div>
        }
        <div class="field">
          <label for="valor">Valor</label>
          <div class="input-prefix">
            <span>R$</span>
            <input id="valor" class="input tabular" appCurrencyInput formControlName="valor" placeholder="0,00" />
          </div>
          @if (form.controls.valor.touched && form.controls.valor.invalid) {
            <span class="field-error">
              {{ retirar() ? 'Informe um valor até ' + (meta().valorGuardado | currency) + '.' : 'Informe um valor maior que zero.' }}
            </span>
          }
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="closed.emit()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="submitting()">
            @if (submitting()) {
              <span class="spinner"></span>
            }
            {{ retirar() ? 'Retirar' : 'Guardar' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class MovimentoDialog implements OnInit {
  private readonly store = inject(MetaStore);
  private readonly toast = inject(ToastService);

  readonly meta = input.required<Meta>();
  readonly retirar = input(false);
  readonly closed = output<void>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    valor: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    if (this.retirar()) {
      this.form.controls.valor.addValidators(Validators.max(this.meta().valorGuardado));
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valor = this.form.getRawValue().valor!;
    this.submitting.set(true);
    this.error.set(null);
    this.store
      .movimentar(this.meta().id, this.retirar() ? -valor : valor)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (meta) => {
          const concluiu = !this.retirar() && meta.valorGuardado >= meta.valorAlvo;
          this.toast.success(concluiu ? 'Meta alcançada! Parabéns!' : this.retirar() ? 'Valor retirado.' : 'Valor guardado.');
          this.closed.emit();
        },
        error: (err: unknown) => this.error.set(httpErrorMessage(err, {}, 'Não foi possível concluir.')),
      });
  }
}
