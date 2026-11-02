import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { httpErrorMessage } from '../../../core/http/http-error';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CategoriaBadge } from '../../categorias/components/categoria-badge/categoria-badge';
import { CategoriaStore } from '../../categorias/data-access/categoria.store';
import { sumValores } from '../../lancamentos/lancamento-stats';
import { PlanoDialog } from '../components/plano-dialog';
import { Recorrencia } from '../data-access/planejamento.models';
import { RecorrenciaStore } from '../data-access/planejamento.stores';

@Component({
  selector: 'app-recorrentes-page',
  imports: [CurrencyPipe, DatePipe, Icon, EmptyState, CategoriaBadge, PlanoDialog, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recorrentes-page.html',
  styleUrl: '../planejamento-page.scss',
})
export class RecorrentesPage implements OnInit {
  protected readonly store = inject(RecorrenciaStore);
  private readonly categorias = inject(CategoriaStore);
  private readonly toast = inject(ToastService);

  protected readonly totais = computed(() => {
    const ativas = this.store.items().filter((r) => r.ativa);
    const entradas = sumValores(ativas.filter((r) => r.tipo === 'receita'));
    const saidas = sumValores(ativas.filter((r) => r.tipo === 'despesa'));
    return { entradas, saidas, saldo: Math.round((entradas - saidas) * 100) / 100 };
  });

  protected readonly novo = signal(false);
  protected readonly emEdicao = signal<Recorrencia | null>(null);
  protected readonly paraExcluir = signal<Recorrencia | null>(null);
  protected readonly ocupado = signal<number | null>(null);

  ngOnInit(): void {
    this.store.load();
    this.categorias.load();
  }

  protected categoria(r: Recorrencia) {
    return r.categoriaId == null ? null : this.categorias.porId().get(r.categoriaId);
  }

  protected alternar(r: Recorrencia): void {
    this.ocupado.set(r.id);
    this.store
      .update(r.id, {
        tipo: r.tipo,
        descricao: r.descricao,
        detalhe: r.detalhe,
        valor: r.valor,
        categoriaId: r.categoriaId,
        diaDoMes: r.diaDoMes,
        ativa: !r.ativa,
      })
      .pipe(finalize(() => this.ocupado.set(null)))
      .subscribe({
        next: () => this.toast.info(r.ativa ? 'Recorrência pausada.' : 'Recorrência retomada.'),
        error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível alterar.')),
      });
  }

  protected excluir(r: Recorrencia): void {
    this.ocupado.set(r.id);
    this.store
      .remove(r.id)
      .pipe(finalize(() => this.ocupado.set(null)))
      .subscribe({
        next: () => {
          this.paraExcluir.set(null);
          this.toast.success('Recorrência excluída.');
        },
        error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível excluir.')),
      });
  }
}
