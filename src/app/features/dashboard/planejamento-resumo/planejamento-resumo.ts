import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { monthKey } from '../../../core/utils/date';
import { Icon } from '../../../shared/ui/icon/icon';
import { CategoriaBadge } from '../../categorias/components/categoria-badge/categoria-badge';
import { CategoriaStore } from '../../categorias/data-access/categoria.store';
import { Lancamento } from '../../lancamentos/lancamento.models';
import { CompromissoStore, OrcamentoStore } from '../../planejamento/data-access/planejamento.stores';
import { situacaoConta, situacaoOrcamento } from '../../planejamento/planejamento-calculos';

const MAX_CONTAS = 5;
const MAX_ORCAMENTOS = 4;

/** Cartões do dashboard com as próximas contas e os orçamentos do mês. */
@Component({
  selector: 'app-planejamento-resumo',
  imports: [CurrencyPipe, DatePipe, RouterLink, Icon, CategoriaBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planejamento-resumo.html',
  styleUrl: './planejamento-resumo.scss',
})
export class PlanejamentoResumo {
  private readonly contas = inject(CompromissoStore);
  private readonly orcamentos = inject(OrcamentoStore);
  private readonly categorias = inject(CategoriaStore);

  /** Despesas do mês corrente, para calcular o uso dos orçamentos. */
  readonly despesasDoMes = input.required<Lancamento[]>();

  protected readonly hoje = new Date();

  protected readonly proximasContas = computed(() =>
    this.contas
      .items()
      .filter((c) => !c.pagoEm)
      .slice(0, MAX_CONTAS)
      .map((conta) => ({ conta, situacao: situacaoConta(conta, this.hoje) })),
  );

  protected readonly orcamentosDoMes = computed(() =>
    this.orcamentos
      .items()
      .map((orcamento) => ({
        orcamento,
        categoria: this.categorias.porId().get(orcamento.categoriaId) ?? null,
        situacao: situacaoOrcamento(
          orcamento,
          this.despesasDoMes().filter((d) => monthKey(d.data) === monthKey(this.hoje)),
        ),
      }))
      .sort((a, b) => b.situacao.percentual - a.situacao.percentual)
      .slice(0, MAX_ORCAMENTOS),
  );

  protected categoriaDe(id: number | null) {
    return id == null ? null : this.categorias.porId().get(id);
  }
}
