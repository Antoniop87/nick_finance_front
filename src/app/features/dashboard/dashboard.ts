import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { addMonths, monthKey } from '../../core/utils/date';
import { Icon } from '../../shared/ui/icon/icon';
import { CategoriaBadge } from '../categorias/components/categoria-badge/categoria-badge';
import { CategoriaStore } from '../categorias/data-access/categoria.store';
import { LancamentoDialog } from '../lancamentos/components/lancamento-dialog/lancamento-dialog';
import { filterByMonth, percentChange, resumo, sumValores } from '../lancamentos/lancamento-stats';
import { CompromissoStore, OrcamentoStore, RecorrenciaStore } from '../planejamento/data-access/planejamento.stores';
import { projecaoDoMes } from '../planejamento/planejamento-calculos';
import { CashflowChart } from './cashflow-chart/cashflow-chart';
import { CategoriaDonut } from './categoria-donut/categoria-donut';
import { PagamentoResumo } from './pagamento-resumo/pagamento-resumo';
import { PlanejamentoResumo } from './planejamento-resumo/planejamento-resumo';
import { Lancamento, TipoLancamento } from '../lancamentos/lancamento.models';
import { LancamentosFacade } from '../lancamentos/lancamentos.facade';

const ULTIMOS_LANCAMENTOS = 6;

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    RouterLink,
    Icon,
    LancamentoDialog,
    CashflowChart,
    CategoriaDonut,
    CategoriaBadge,
    PlanejamentoResumo,
    PagamentoResumo,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  protected readonly facade = inject(LancamentosFacade);
  protected readonly user = inject(AuthService).user;
  protected readonly categorias = inject(CategoriaStore);
  private readonly recorrencias = inject(RecorrenciaStore);
  private readonly contas = inject(CompromissoStore);
  private readonly orcamentos = inject(OrcamentoStore);

  protected readonly today = new Date();
  /** Tipo do modal aberto; `undefined` = fechado. */
  protected readonly dialogTipo = signal<TipoLancamento | undefined>(undefined);

  private readonly todos = this.facade.todos;
  private readonly doMes = computed(() => filterByMonth(this.todos(), monthKey(this.today)));
  private readonly doMesAnterior = computed(() =>
    filterByMonth(this.todos(), monthKey(addMonths(this.today, -1))),
  );
  protected readonly despesasDoMes = computed(() => this.doMes().filter((l) => l.tipo === 'despesa'));

  protected readonly isEmpty = computed(() => this.facade.loaded() && this.todos().length === 0);
  protected readonly showSkeleton = computed(() => this.facade.loading() && this.todos().length === 0);

  /** Totais de todo o histórico. */
  protected readonly geral = computed(() => resumo(this.todos()));
  protected readonly mes = computed(() => resumo(this.doMes()));
  protected readonly mesAnterior = computed(() => resumo(this.doMesAnterior()));

  protected readonly variacaoEntradas = computed(() =>
    percentChange(this.mes().entradas, this.mesAnterior().entradas),
  );
  protected readonly variacaoSaidas = computed(() =>
    percentChange(this.mes().saidas, this.mesAnterior().saidas),
  );

  /** Quanto das entradas do mês já foi gasto, em %; `null` sem entradas. */
  protected readonly comprometido = computed(() => {
    const { entradas, saidas } = this.mes();
    return entradas ? (saidas / entradas) * 100 : null;
  });

  protected readonly quantidadeMes = computed(() => this.doMes().length);
  protected readonly ticketMedio = computed(() => {
    const despesas = this.despesasDoMes();
    return despesas.length ? sumValores(despesas) / despesas.length : 0;
  });
  protected readonly maiorDespesa = computed(() =>
    this.despesasDoMes().reduce<Lancamento | null>(
      (maior, despesa) => (!maior || despesa.valor > maior.valor ? despesa : maior),
      null,
    ),
  );

  /** Saldo esperado no fim do mês, contando recorrências e contas ainda por vir. */
  protected readonly projecao = computed(() =>
    projecaoDoMes(this.todos(), this.recorrencias.items(), this.contas.items(), this.today),
  );
  protected readonly temPlanejamento = computed(
    () => this.recorrencias.items().length > 0 || this.contas.items().some((c) => !c.pagoEm),
  );

  protected readonly ultimos = computed(() => this.todos().slice(0, ULTIMOS_LANCAMENTOS));

  ngOnInit(): void {
    this.facade.load();
    this.recorrencias.load();
    this.contas.load();
    this.orcamentos.load();
  }

  protected categoriaDe(lancamento: Lancamento) {
    return lancamento.categoriaId == null ? null : this.categorias.porId().get(lancamento.categoriaId);
  }
}
