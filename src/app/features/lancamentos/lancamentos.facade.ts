import { Injectable, computed, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CategoriaStore } from '../categorias/data-access/categoria.store';
import { Despesa } from '../despesas/data-access/despesa.models';
import { DespesaStore } from '../despesas/data-access/despesa.store';
import { Receita } from '../receitas/data-access/receita.models';
import { ReceitaStore } from '../receitas/data-access/receita.store';
import { Lancamento, NovoLancamento, TipoLancamento } from './lancamento.models';

/**
 * Ponto único de acesso a receitas e despesas para as telas.
 * Converte os dois modelos em `Lancamento` e delega a gravação ao store certo.
 */
@Injectable({ providedIn: 'root' })
export class LancamentosFacade {
  private readonly despesaStore = inject(DespesaStore);
  private readonly receitaStore = inject(ReceitaStore);
  private readonly categoriaStore = inject(CategoriaStore);

  readonly despesas = computed(() => this.despesaStore.items().map(fromDespesa));
  readonly receitas = computed(() => this.receitaStore.items().map(fromReceita));
  /** Receitas e despesas juntas, da mais recente para a mais antiga. */
  readonly todos = computed(() =>
    [...this.receitas(), ...this.despesas()].sort(
      (a, b) => b.data.getTime() - a.data.getTime() || b.id - a.id,
    ),
  );

  readonly loading = computed(
    () => this.despesaStore.loading() || this.receitaStore.loading() || this.categoriaStore.loading(),
  );
  readonly loaded = computed(() => this.despesaStore.loaded() && this.receitaStore.loaded());
  readonly error = computed(
    () => this.despesaStore.error() ?? this.receitaStore.error() ?? this.categoriaStore.error(),
  );

  /** Carrega lançamentos e categorias (necessárias para exibi-los). */
  load(force = false): void {
    this.despesaStore.load(force);
    this.receitaStore.load(force);
    this.categoriaStore.load(force);
  }

  byTipo(tipo: TipoLancamento | 'todos') {
    return tipo === 'todos' ? this.todos : tipo === 'receita' ? this.receitas : this.despesas;
  }

  create(tipo: TipoLancamento, lancamento: NovoLancamento): Observable<void> {
    const operacao: Observable<unknown> =
      tipo === 'receita'
        ? this.receitaStore.create(toReceita(lancamento))
        : this.despesaStore.create(toDespesa(lancamento));
    return operacao.pipe(map(() => undefined));
  }

  update(tipo: TipoLancamento, id: number, lancamento: NovoLancamento): Observable<void> {
    const operacao: Observable<unknown> =
      tipo === 'receita'
        ? this.receitaStore.update(id, toReceita(lancamento))
        : this.despesaStore.update(id, toDespesa(lancamento));
    return operacao.pipe(map(() => undefined));
  }

  remove(lancamento: Lancamento): Observable<void> {
    return lancamento.tipo === 'receita'
      ? this.receitaStore.remove(lancamento.id)
      : this.despesaStore.remove(lancamento.id);
  }
}

function toDespesa({ descricao, detalhe, valor, data, categoriaId, formaPagamento }: NovoLancamento) {
  return { descricao, estabelecimento: detalhe, valor, data, categoriaId, formaPagamento };
}

function toReceita({ descricao, detalhe, valor, data, categoriaId }: NovoLancamento) {
  return { descricao, origem: detalhe, valor, data, categoriaId };
}

function fromDespesa(despesa: Despesa): Lancamento {
  return {
    key: `despesa-${despesa.id}`,
    id: despesa.id,
    tipo: 'despesa',
    descricao: despesa.descricao,
    detalhe: despesa.estabelecimento,
    valor: despesa.valor,
    data: despesa.data,
    categoriaId: despesa.categoriaId,
    formaPagamento: despesa.formaPagamento,
  };
}

function fromReceita(receita: Receita): Lancamento {
  return {
    key: `receita-${receita.id}`,
    id: receita.id,
    tipo: 'receita',
    descricao: receita.descricao,
    detalhe: receita.origem,
    valor: receita.valor,
    data: receita.data,
    categoriaId: receita.categoriaId,
    formaPagamento: null,
  };
}
