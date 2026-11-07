import { CurrencyPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { FORMAS_PAGAMENTO } from '../../../core/models/forma-pagamento';
import { Icon } from '../../../shared/ui/icon/icon';
import { resumoPagamento } from '../../lancamentos/lancamento-stats';
import { Lancamento } from '../../lancamentos/lancamento.models';

/** Cartão do dashboard: quanto das despesas do mês foi no crédito e quanto foi à vista. */
@Component({
  selector: 'app-pagamento-resumo',
  imports: [CurrencyPipe, PercentPipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagamento-resumo.html',
  styleUrl: './pagamento-resumo.scss',
})
export class PagamentoResumo {
  /** Despesas do mês corrente. */
  readonly despesas = input.required<Lancamento[]>();

  protected readonly resumo = computed(() => resumoPagamento(this.despesas()));
  protected readonly total = computed(() => {
    const r = this.resumo();
    return r.credito + r.aVista + r.naoInformado;
  });

  /** Fração de cada parte, para a barra e os percentuais. */
  protected readonly partes = computed(() => {
    const total = this.total() || 1;
    const r = this.resumo();
    return { credito: r.credito / total, aVista: r.aVista / total, naoInformado: r.naoInformado / total };
  });

  /** Pix, Débito e Dinheiro, para o detalhe do "à vista". */
  protected readonly formasAVista = FORMAS_PAGAMENTO.filter((f) => f.valor !== 'CREDITO');
}
