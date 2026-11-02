import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { formatCompactCurrency, niceScaleMax } from '../../../shared/utils/currency';
import { monthlyResumo } from '../../lancamentos/lancamento-stats';
import { Lancamento } from '../../lancamentos/lancamento.models';

const STEPS = 4;

/** Gráfico de barras de entradas x saídas por mês, com eixo, grade e tooltip. */
@Component({
  selector: 'app-cashflow-chart',
  imports: [CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cashflow-chart.html',
  styleUrl: './cashflow-chart.scss',
})
export class CashflowChart {
  readonly lancamentos = input.required<Lancamento[]>();
  /** Último mês exibido. */
  readonly reference = input(new Date());
  readonly months = input(6);

  protected readonly data = computed(() => {
    const meses = monthlyResumo(this.lancamentos(), this.reference(), this.months());
    const scaleMax = niceScaleMax(Math.max(...meses.flatMap((m) => [m.entradas, m.saidas])), STEPS);
    return {
      ticks: Array.from({ length: STEPS + 1 }, (_, i) =>
        formatCompactCurrency((scaleMax / STEPS) * (STEPS - i)),
      ),
      bars: meses.map((m, index) => ({
        ...m,
        current: index === meses.length - 1,
        entradasPercent: (m.entradas / scaleMax) * 100,
        saidasPercent: (m.saidas / scaleMax) * 100,
      })),
    };
  });
}
