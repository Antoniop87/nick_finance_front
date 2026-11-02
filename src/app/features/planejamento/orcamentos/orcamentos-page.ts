import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { httpErrorMessage } from '../../../core/http/http-error';
import { monthKey } from '../../../core/utils/date';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CategoriaBadge } from '../../categorias/components/categoria-badge/categoria-badge';
import { CategoriaStore } from '../../categorias/data-access/categoria.store';
import { sumValores } from '../../lancamentos/lancamento-stats';
import { LancamentosFacade } from '../../lancamentos/lancamentos.facade';
import { Orcamento } from '../data-access/planejamento.models';
import { OrcamentoStore } from '../data-access/planejamento.stores';
import { situacaoOrcamento } from '../planejamento-calculos';
import { OrcamentoDialog } from './orcamento-dialog';

@Component({
  selector: 'app-orcamentos-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, Icon, EmptyState, CategoriaBadge, OrcamentoDialog, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orcamentos-page.html',
  styleUrl: '../planejamento-page.scss',
})
export class OrcamentosPage implements OnInit {
  protected readonly store = inject(OrcamentoStore);
  private readonly categorias = inject(CategoriaStore);
  private readonly lancamentos = inject(LancamentosFacade);
  private readonly toast = inject(ToastService);

  protected readonly hoje = new Date();
  private readonly despesasDoMes = computed(() =>
    this.lancamentos.despesas().filter((d) => monthKey(d.data) === monthKey(this.hoje)),
  );

  protected readonly linhas = computed(() =>
    this.store
      .items()
      .map((orcamento) => ({
        orcamento,
        categoria: this.categorias.porId().get(orcamento.categoriaId) ?? null,
        situacao: situacaoOrcamento(orcamento, this.despesasDoMes()),
      }))
      .sort((a, b) => b.situacao.percentual - a.situacao.percentual),
  );

  protected readonly totais = computed(() => {
    const orcado = sumValores(this.store.items().map((o) => ({ valor: o.valorLimite })));
    const gasto = sumValores(this.linhas().map((l) => ({ valor: l.situacao.gasto })));
    return { orcado, gasto, restante: Math.round((orcado - gasto) * 100) / 100 };
  });

  /** Categorias com gastos no mês e sem orçamento: sugestões rápidas. */
  protected readonly sugestoes = computed(() => {
    const comOrcamento = new Set(this.store.items().map((o) => o.categoriaId));
    const gastos = new Map<number, number>();
    for (const d of this.despesasDoMes()) {
      if (d.categoriaId != null && !comOrcamento.has(d.categoriaId)) {
        gastos.set(d.categoriaId, (gastos.get(d.categoriaId) ?? 0) + d.valor);
      }
    }
    return [...gastos.entries()]
      .map(([id, gasto]) => ({ categoria: this.categorias.porId().get(id), gasto }))
      .filter((s) => !!s.categoria)
      .sort((a, b) => b.gasto - a.gasto)
      .slice(0, 4);
  });

  protected readonly novo = signal<{ categoriaId: number | null } | null>(null);
  protected readonly emEdicao = signal<Orcamento | null>(null);
  protected readonly paraExcluir = signal<Orcamento | null>(null);
  protected readonly excluindo = signal(false);

  ngOnInit(): void {
    this.store.load();
    this.lancamentos.load();
  }

  protected nomeCategoria(orcamento: Orcamento): string {
    return this.categorias.porId().get(orcamento.categoriaId)?.nome ?? 'esta categoria';
  }

  protected excluir(orcamento: Orcamento): void {
    this.excluindo.set(true);
    this.store
      .remove(orcamento.id)
      .pipe(finalize(() => this.excluindo.set(false)))
      .subscribe({
        next: () => {
          this.paraExcluir.set(null);
          this.toast.success('Orçamento removido.');
        },
        error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível excluir.')),
      });
  }
}
