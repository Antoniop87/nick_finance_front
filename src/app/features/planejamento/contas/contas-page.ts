import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';

import { httpErrorMessage } from '../../../core/http/http-error';
import { monthKey } from '../../../core/utils/date';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../shared/ui/icon/icon';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CategoriaBadge } from '../../categorias/components/categoria-badge/categoria-badge';
import { CategoriaStore } from '../../categorias/data-access/categoria.store';
import { sumValores } from '../../lancamentos/lancamento-stats';
import { PlanoDialog } from '../components/plano-dialog';
import { Compromisso } from '../data-access/planejamento.models';
import { CompromissoStore } from '../data-access/planejamento.stores';
import { SituacaoConta, situacaoConta } from '../planejamento-calculos';

type Aba = 'abertas' | 'pagas';

interface Grupo {
  situacao: SituacaoConta;
  titulo: string;
  contas: Compromisso[];
}

const TITULOS: Record<Exclude<SituacaoConta, 'paga'>, string> = {
  atrasada: 'Atrasadas',
  hoje: 'Vencem hoje',
  semana: 'Próximos 7 dias',
  depois: 'Mais adiante',
};

@Component({
  selector: 'app-contas-page',
  imports: [CurrencyPipe, DatePipe, Icon, EmptyState, CategoriaBadge, PlanoDialog, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contas-page.html',
  styleUrl: '../planejamento-page.scss',
})
export class ContasPage implements OnInit {
  protected readonly store = inject(CompromissoStore);
  private readonly categorias = inject(CategoriaStore);
  private readonly toast = inject(ToastService);

  protected readonly hoje = new Date();
  protected readonly aba = signal<Aba>('abertas');

  private readonly abertas = computed(() => this.store.items().filter((c) => !c.pagoEm));
  protected readonly pagas = computed(() =>
    this.store
      .items()
      .filter((c) => !!c.pagoEm)
      .sort((a, b) => b.pagoEm!.getTime() - a.pagoEm!.getTime()),
  );

  protected readonly grupos = computed<Grupo[]>(() =>
    (Object.keys(TITULOS) as (keyof typeof TITULOS)[])
      .map((situacao) => ({
        situacao,
        titulo: TITULOS[situacao],
        contas: this.abertas().filter((c) => situacaoConta(c, this.hoje) === situacao),
      }))
      .filter((g) => g.contas.length > 0),
  );

  protected readonly resumo = computed(() => {
    const mes = monthKey(this.hoje);
    const doMes = this.abertas().filter((c) => monthKey(c.vencimento) <= mes);
    const atrasadas = this.abertas().filter((c) => situacaoConta(c, this.hoje) === 'atrasada');
    return {
      aPagar: sumValores(doMes.filter((c) => c.tipo === 'despesa')),
      aReceber: sumValores(doMes.filter((c) => c.tipo === 'receita')),
      atrasadas: atrasadas.length,
      valorAtrasado: sumValores(atrasadas),
    };
  });

  protected readonly nova = signal(false);
  protected readonly emEdicao = signal<Compromisso | null>(null);
  protected readonly paraExcluir = signal<Compromisso | null>(null);
  protected readonly ocupado = signal<number | null>(null);

  ngOnInit(): void {
    this.store.load();
    this.categorias.load();
  }

  protected categoria(c: Compromisso) {
    return c.categoriaId == null ? null : this.categorias.porId().get(c.categoriaId);
  }

  protected pagar(c: Compromisso): void {
    this.executar(c, this.store.pagar(c.id), c.tipo === 'despesa' ? 'Conta paga e lançada no extrato.' : 'Recebimento lançado no extrato.');
  }

  protected reabrir(c: Compromisso): void {
    this.executar(c, this.store.reabrir(c.id), 'Conta reaberta; o lançamento foi removido do extrato.');
  }

  protected excluir(c: Compromisso): void {
    this.executar(c, this.store.remove(c.id), 'Conta excluída.', () => this.paraExcluir.set(null));
  }

  private executar(c: Compromisso, operacao: Observable<unknown>, sucesso: string, depois?: () => void): void {
    this.ocupado.set(c.id);
    operacao.pipe(finalize(() => this.ocupado.set(null))).subscribe({
      next: () => {
        depois?.();
        this.toast.success(sucesso);
      },
      error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível concluir a ação.')),
    });
  }
}
