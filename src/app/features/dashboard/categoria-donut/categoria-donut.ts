import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Categoria } from '../../categorias/data-access/categoria.models';
import { sumValores } from '../../lancamentos/lancamento-stats';
import { Lancamento } from '../../lancamentos/lancamento.models';

const MAX_FATIAS = 6;
const RAIO = 15.915; // circunferência ≈ 100, então cada % vira 1 unidade de traço
const COR_SEM_CATEGORIA = '#94a3b8';

interface Fatia {
  nome: string;
  cor: string;
  total: number;
  percentual: number;
  /** Onde a fatia começa no traço (em %). */
  inicio: number;
}

/** Rosca de gastos por categoria, com legenda. As menores viram "Outras". */
@Component({
  selector: 'app-categoria-donut',
  imports: [CurrencyPipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (fatias().length) {
      <div class="donut">
        <svg viewBox="0 0 42 42" role="img" [attr.aria-label]="'Gastos por categoria, total ' + (total() | currency)">
          <circle class="donut__trilho" cx="21" cy="21" [attr.r]="raio" />
          @for (fatia of fatias(); track fatia.nome) {
            <circle
              class="donut__fatia"
              cx="21"
              cy="21"
              [attr.r]="raio"
              [attr.stroke]="fatia.cor"
              [attr.stroke-dasharray]="fatia.percentual + ' ' + (100 - fatia.percentual)"
              [attr.stroke-dashoffset]="25 - fatia.inicio"
            >
              <title>{{ fatia.nome }}: {{ fatia.total | currency }}</title>
            </circle>
          }
        </svg>
        <div class="donut__centro">
          <span>Total</span>
          <strong class="display-number">{{ total() | currency: 'BRL' : 'symbol' : '1.0-0' }}</strong>
        </div>
      </div>
      <ul class="legenda">
        @for (fatia of fatias(); track fatia.nome) {
          <li>
            <span class="legenda__cor" [style.background]="fatia.cor"></span>
            <span class="legenda__nome truncate">{{ fatia.nome }}</span>
            <span class="legenda__pct">{{ fatia.percentual | number: '1.0-0' }}%</span>
            <strong class="tabular">{{ fatia.total | currency }}</strong>
          </li>
        }
      </ul>
    } @else {
      <p class="vazio">Nenhuma despesa neste mês.</p>
    }
  `,
  styleUrl: './categoria-donut.scss',
})
export class CategoriaDonut {
  readonly despesas = input.required<Lancamento[]>();
  readonly categorias = input.required<Map<number, Categoria>>();

  protected readonly raio = RAIO;
  protected readonly total = computed(() => sumValores(this.despesas()));

  protected readonly fatias = computed<Fatia[]>(() => {
    const total = this.total();
    if (!total) {
      return [];
    }
    const grupos = new Map<number | null, number>();
    for (const d of this.despesas()) {
      grupos.set(d.categoriaId, (grupos.get(d.categoriaId) ?? 0) + d.valor);
    }

    const ordenadas = [...grupos.entries()]
      .map(([id, valor]) => {
        const categoria = id == null ? undefined : this.categorias().get(id);
        return {
          nome: categoria?.nome ?? 'Sem categoria',
          cor: categoria?.cor ?? COR_SEM_CATEGORIA,
          total: Math.round(valor * 100) / 100,
        };
      })
      .sort((a, b) => b.total - a.total);

    const principais = ordenadas.slice(0, MAX_FATIAS - 1);
    const resto = ordenadas.slice(MAX_FATIAS - 1);
    if (resto.length === 1) {
      principais.push(resto[0]);
    } else if (resto.length > 1) {
      principais.push({ nome: 'Outras', cor: COR_SEM_CATEGORIA, total: sumValores(resto.map((r) => ({ valor: r.total }))) });
    }

    let acumulado = 0;
    return principais.map((fatia) => {
      const percentual = (fatia.total / total) * 100;
      const resultado = { ...fatia, percentual, inicio: acumulado };
      acumulado += percentual;
      return resultado;
    });
  });
}
