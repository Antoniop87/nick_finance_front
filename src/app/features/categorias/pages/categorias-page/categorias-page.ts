import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { httpErrorMessage } from '../../../../core/http/http-error';
import { TipoLancamento } from '../../../../core/models/tipo-lancamento';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { LancamentosFacade } from '../../../lancamentos/lancamentos.facade';
import { CategoriaBadge } from '../../components/categoria-badge/categoria-badge';
import { CategoriaDialog } from '../../components/categoria-dialog/categoria-dialog';
import { Categoria } from '../../data-access/categoria.models';
import { CategoriaStore } from '../../data-access/categoria.store';

interface Grupo {
  tipo: TipoLancamento;
  titulo: string;
  descricao: string;
  categorias: Categoria[];
}

/** Gerencia as categorias de despesas e de entradas. */
@Component({
  selector: 'app-categorias-page',
  imports: [Icon, CategoriaBadge, CategoriaDialog, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categorias-page.html',
  styleUrl: './categorias-page.scss',
})
export class CategoriasPage implements OnInit {
  protected readonly store = inject(CategoriaStore);
  private readonly lancamentos = inject(LancamentosFacade);
  private readonly toast = inject(ToastService);

  /** Quantos lançamentos usam cada categoria. */
  protected readonly uso = computed(() => {
    const contagem = new Map<number, number>();
    for (const l of this.lancamentos.todos()) {
      if (l.categoriaId != null) {
        contagem.set(l.categoriaId, (contagem.get(l.categoriaId) ?? 0) + 1);
      }
    }
    return contagem;
  });

  protected readonly grupos = computed<Grupo[]>(() => [
    {
      tipo: 'despesa',
      titulo: 'Despesas',
      descricao: 'Para onde vai o seu dinheiro.',
      categorias: this.store.despesas(),
    },
    {
      tipo: 'receita',
      titulo: 'Entradas',
      descricao: 'De onde vem o seu dinheiro.',
      categorias: this.store.receitas(),
    },
  ]);

  protected readonly novaDoTipo = signal<TipoLancamento | null>(null);
  protected readonly emEdicao = signal<Categoria | null>(null);
  protected readonly paraExcluir = signal<Categoria | null>(null);
  protected readonly excluindo = signal(false);

  ngOnInit(): void {
    this.lancamentos.load();
  }

  protected mensagemExclusao(categoria: Categoria): string {
    const quantidade = this.uso().get(categoria.id) ?? 0;
    const lancamentos =
      quantidade === 0
        ? 'Nenhum lançamento usa esta categoria.'
        : `${quantidade} ${quantidade === 1 ? 'lançamento ficará' : 'lançamentos ficarão'} sem categoria.`;
    return `${lancamentos} Se ela tiver orçamento, ele também será removido.`;
  }

  protected excluir(categoria: Categoria): void {
    this.excluindo.set(true);
    this.store
      .remove(categoria.id)
      .pipe(finalize(() => this.excluindo.set(false)))
      .subscribe({
        next: () => {
          this.paraExcluir.set(null);
          this.toast.success('Categoria excluída.');
          // A API desvinculou lançamentos e planos; recarrega para refletir.
          this.lancamentos.load(true);
        },
        error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível excluir.')),
      });
  }
}
