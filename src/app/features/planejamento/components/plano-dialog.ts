import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, finalize } from 'rxjs';

import { httpErrorMessage } from '../../../core/http/http-error';
import { TipoLancamento } from '../../../core/models/tipo-lancamento';
import { toIsoDate } from '../../../core/utils/date';
import { CurrencyInput } from '../../../shared/ui/currency-input/currency-input';
import { Icon } from '../../../shared/ui/icon/icon';
import { Modal } from '../../../shared/ui/modal/modal';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CategoriaStore } from '../../categorias/data-access/categoria.store';
import { Compromisso, Recorrencia } from '../data-access/planejamento.models';
import { CompromissoStore, RecorrenciaStore } from '../data-access/planejamento.stores';

type Modo = 'recorrencia' | 'conta';

const TEXTOS: Record<Modo, { novo: string; editar: string; subtitulo: string; tipos: Record<TipoLancamento, string> }> = {
  recorrencia: {
    novo: 'Novo lançamento recorrente',
    editar: 'Editar recorrente',
    subtitulo: 'Será lançado automaticamente todo mês no dia escolhido.',
    tipos: { receita: 'Entrada', despesa: 'Despesa' },
  },
  conta: {
    novo: 'Nova conta',
    editar: 'Editar conta',
    subtitulo: 'Ao marcar como paga, o lançamento entra no seu extrato.',
    tipos: { receita: 'A receber', despesa: 'A pagar' },
  },
};

/**
 * Formulário compartilhado de lançamento recorrente e de conta a pagar/receber:
 * os dois têm tipo, descrição, valor, categoria e detalhe; muda só "dia do mês" x "vencimento".
 */
@Component({
  selector: 'app-plano-dialog',
  imports: [ReactiveFormsModule, Modal, Icon, CurrencyInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plano-dialog.html',
})
export class PlanoDialog implements OnInit {
  private readonly recorrencias = inject(RecorrenciaStore);
  private readonly contas = inject(CompromissoStore);
  private readonly categoriaStore = inject(CategoriaStore);
  private readonly toast = inject(ToastService);

  readonly modo = input.required<Modo>();
  readonly recorrencia = input<Recorrencia | null>(null);
  readonly conta = input<Compromisso | null>(null);
  readonly closed = output<void>();

  protected readonly tipos: TipoLancamento[] = ['despesa', 'receita'];
  protected readonly tipoAtual = signal<TipoLancamento>('despesa');
  protected readonly textos = computed(() => TEXTOS[this.modo()]);
  protected readonly editando = computed(() => !!(this.recorrencia() ?? this.conta()));
  protected readonly categorias = computed(() => this.categoriaStore.doTipo(this.tipoAtual()));

  protected readonly form = inject(NonNullableFormBuilder).group({
    descricao: ['', [Validators.required, Validators.maxLength(100)]],
    valor: [null as number | null, [Validators.required, Validators.min(0.01)]],
    diaDoMes: [new Date().getDate(), [Validators.required, Validators.min(1), Validators.max(31)]],
    vencimento: [toIsoDate(new Date()), Validators.required],
    categoriaId: [null as number | null],
    detalhe: ['', Validators.maxLength(100)],
  });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.categoriaStore.load();
    const item = this.recorrencia() ?? this.conta();
    if (!item) {
      return;
    }
    this.tipoAtual.set(item.tipo);
    this.form.patchValue({
      descricao: item.descricao,
      valor: item.valor,
      categoriaId: item.categoriaId,
      detalhe: item.detalhe ?? '',
      diaDoMes: this.recorrencia()?.diaDoMes ?? new Date().getDate(),
      vencimento: this.conta() ? toIsoDate(this.conta()!.vencimento) : toIsoDate(new Date()),
    });
  }

  protected selecionarTipo(tipo: TipoLancamento): void {
    if (tipo !== this.tipoAtual()) {
      this.tipoAtual.set(tipo);
      this.form.controls.categoriaId.setValue(null);
    }
  }

  protected submit(): void {
    const campoData = this.modo() === 'recorrencia' ? this.form.controls.diaDoMes : this.form.controls.vencimento;
    const campos = [this.form.controls.descricao, this.form.controls.valor, campoData];
    if (campos.some((c) => c.invalid)) {
      campos.forEach((c) => c.markAsTouched());
      return;
    }

    const v = this.form.getRawValue();
    const base = {
      tipo: this.tipoAtual(),
      descricao: v.descricao,
      detalhe: v.detalhe || null,
      valor: v.valor!,
      categoriaId: v.categoriaId == null ? null : Number(v.categoriaId),
    };

    let operacao: Observable<unknown>;
    if (this.modo() === 'recorrencia') {
      const dados = { ...base, diaDoMes: Number(v.diaDoMes), ativa: this.recorrencia()?.ativa ?? true };
      const existente = this.recorrencia();
      operacao = existente ? this.recorrencias.update(existente.id, dados) : this.recorrencias.create(dados);
    } else {
      const dados = { ...base, vencimento: v.vencimento };
      const existente = this.conta();
      operacao = existente ? this.contas.update(existente.id, dados) : this.contas.create(dados);
    }

    this.submitting.set(true);
    this.error.set(null);
    operacao.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => {
        this.toast.success(this.editando() ? 'Alterações salvas.' : 'Cadastrado com sucesso.');
        this.closed.emit();
      },
      error: (err: unknown) =>
        this.error.set(httpErrorMessage(err, { 400: 'Confira os dados informados.' }, 'Não foi possível salvar.')),
    });
  }
}
