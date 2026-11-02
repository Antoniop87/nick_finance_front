import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { httpErrorMessage } from '../../../../core/http/http-error';
import { toIsoDate } from '../../../../core/utils/date';
import { CurrencyInput } from '../../../../shared/ui/currency-input/currency-input';
import { Icon } from '../../../../shared/ui/icon/icon';
import { CategoriaBadge } from '../../../categorias/components/categoria-badge/categoria-badge';
import { CategoriaStore } from '../../../categorias/data-access/categoria.store';
import { Lancamento, TIPO_INFO, TipoLancamento } from '../../lancamento.models';
import { LancamentosFacade } from '../../lancamentos.facade';

/**
 * Formulário de entrada ou despesa. Com `lancamento`, edita; sem, cria.
 * Emite `saved` com o tipo gravado.
 */
@Component({
  selector: 'app-lancamento-form',
  imports: [ReactiveFormsModule, Icon, CurrencyInput, CategoriaBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lancamento-form.html',
  styleUrl: './lancamento-form.scss',
})
export class LancamentoForm implements OnInit {
  private readonly facade = inject(LancamentosFacade);
  private readonly categoriaStore = inject(CategoriaStore);

  /** Tipo inicial do formulário. */
  readonly tipo = input<TipoLancamento>('despesa');
  /** Mostra o seletor Entrada/Despesa (somente ao criar). */
  readonly allowTipoChange = input(false);
  /** Lançamento a editar. */
  readonly lancamento = input<Lancamento | null>(null);

  readonly saved = output<TipoLancamento>();
  readonly cancelled = output<void>();

  protected readonly tipoAtual = linkedSignal(() => this.lancamento()?.tipo ?? this.tipo());
  protected readonly editando = computed(() => this.lancamento() !== null);
  protected readonly info = computed(() => TIPO_INFO[this.tipoAtual()]);
  protected readonly tipos: TipoLancamento[] = ['receita', 'despesa'];
  protected readonly tipoInfo = TIPO_INFO;
  protected readonly categorias = computed(() => this.categoriaStore.doTipo(this.tipoAtual()));

  protected readonly form = inject(NonNullableFormBuilder).group({
    descricao: ['', [Validators.required, Validators.maxLength(100)]],
    detalhe: ['', Validators.maxLength(100)],
    valor: [null as number | null, [Validators.required, Validators.min(0.01)]],
    data: [toIsoDate(new Date()), Validators.required],
    categoriaId: [null as number | null],
  });

  private readonly categoriaId = toSignal(this.form.controls.categoriaId.valueChanges, { initialValue: null });
  protected readonly categoriaSelecionada = computed(() => {
    const id = this.categoriaId();
    return id == null ? null : this.categoriaStore.porId().get(Number(id)) ?? null;
  });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.categoriaStore.load();
    const lancamento = this.lancamento();
    if (lancamento) {
      this.form.setValue({
        descricao: lancamento.descricao,
        detalhe: lancamento.detalhe ?? '',
        valor: lancamento.valor,
        data: toIsoDate(lancamento.data),
        categoriaId: lancamento.categoriaId,
      });
    }
  }

  protected selecionarTipo(tipo: TipoLancamento): void {
    if (tipo !== this.tipoAtual()) {
      this.tipoAtual.set(tipo);
      // Categoria de despesa não serve para entrada e vice-versa.
      this.form.controls.categoriaId.setValue(null);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { descricao, detalhe, valor, data, categoriaId } = this.form.getRawValue();
    const dados = {
      descricao,
      detalhe: detalhe || null,
      valor: valor!,
      data,
      categoriaId: categoriaId == null ? null : Number(categoriaId),
    };
    const tipo = this.tipoAtual();
    const existente = this.lancamento();

    this.submitting.set(true);
    this.error.set(null);

    (existente ? this.facade.update(tipo, existente.id, dados) : this.facade.create(tipo, dados))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.saved.emit(tipo),
        error: (err: unknown) =>
          this.error.set(
            httpErrorMessage(
              err,
              { 400: 'Confira os dados informados.', 404: 'Este lançamento não existe mais.' },
              `Não foi possível salvar a ${this.info().singular.toLowerCase()}.`,
            ),
          ),
      });
  }
}
