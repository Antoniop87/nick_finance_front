import { CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { monthKey, monthKeyToDate, toIsoDate } from '../../../../core/utils/date';
import { downloadCsv } from '../../../../shared/utils/csv';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../../shared/ui/icon/icon';
import { finalize } from 'rxjs';

import { httpErrorMessage } from '../../../../core/http/http-error';
import { FORMAS_PAGAMENTO, FormaPagamentoInfo, infoFormaPagamento } from '../../../../core/models/forma-pagamento';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { CategoriaBadge } from '../../../categorias/components/categoria-badge/categoria-badge';
import { Categoria } from '../../../categorias/data-access/categoria.models';
import { CategoriaStore } from '../../../categorias/data-access/categoria.store';
import { LancamentoDialog } from '../../components/lancamento-dialog/lancamento-dialog';
import { availableMonths, resumo, resumoPagamento, sumValores } from '../../lancamento-stats';
import { Lancamento, TIPO_INFO, TipoLancamento } from '../../lancamento.models';
import { LancamentosFacade } from '../../lancamentos.facade';

export type ListaTipo = TipoLancamento | 'todos';

type SortField = 'data' | 'descricao' | 'valor';
type SortDirection = 'asc' | 'desc';

interface Sort {
  field: SortField;
  direction: SortDirection;
}

interface PageCopy {
  title: string;
  subtitle: string;
  detalheLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

const PAGE_SIZE = 10;

const COPY: Record<ListaTipo, PageCopy> = {
  todos: {
    title: 'Extrato',
    subtitle: 'Tudo o que entrou e saiu da sua conta.',
    detalheLabel: 'Origem / Estabelecimento',
    emptyTitle: 'Nenhum lançamento ainda',
    emptyDescription: 'Registre entradas e despesas para acompanhar seu saldo.',
  },
  receita: {
    title: 'Entradas',
    subtitle: 'Salários, vendas e todo dinheiro que entrou.',
    detalheLabel: 'Origem',
    emptyTitle: 'Você ainda não registrou entradas',
    emptyDescription: 'Registre seu salário ou outras entradas para calcular o saldo.',
  },
  despesa: {
    title: 'Despesas',
    subtitle: 'Todas as suas despesas registradas.',
    detalheLabel: 'Estabelecimento',
    emptyTitle: 'Você ainda não registrou despesas',
    emptyDescription: 'Comece registrando um gasto para acompanhar suas finanças.',
  },
};

const COMPARATORS: Record<SortField, (a: Lancamento, b: Lancamento) => number> = {
  data: (a, b) => a.data.getTime() - b.data.getTime() || a.id - b.id,
  descricao: (a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'),
  valor: (a, b) => signedValue(a) - signedValue(b),
};

/**
 * Lista de lançamentos. A mesma tela atende Extrato, Entradas e Despesas,
 * conforme o `tipo` definido na rota.
 */
@Component({
  selector: 'app-lancamento-list',
  imports: [CurrencyPipe, DatePipe, Icon, EmptyState, LancamentoDialog, ConfirmDialog, CategoriaBadge],
  providers: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lancamento-list.html',
  styleUrl: './lancamento-list.scss',
})
export class LancamentoList implements OnInit {
  protected readonly facade = inject(LancamentosFacade);
  private readonly categoriaStore = inject(CategoriaStore);
  private readonly toast = inject(ToastService);
  private readonly currency = inject(CurrencyPipe);
  private readonly locale = inject(LOCALE_ID);

  /** Vem de `data.tipo` na rota. */
  readonly tipo = input.required<ListaTipo>();

  protected readonly copy = computed(() => COPY[this.tipo()]);
  protected readonly isTodos = computed(() => this.tipo() === 'todos');
  protected readonly dialogTipo = computed<TipoLancamento | null>(() =>
    this.tipo() === 'todos' ? null : (this.tipo() as TipoLancamento),
  );
  protected readonly novoLabel = computed(() => {
    const tipo = this.dialogTipo();
    return tipo ? `Nova ${TIPO_INFO[tipo].singular.toLowerCase()}` : 'Novo lançamento';
  });

  protected readonly dialogOpen = signal(false);
  protected readonly emEdicao = signal<Lancamento | null>(null);
  protected readonly paraExcluir = signal<Lancamento | null>(null);
  protected readonly excluindo = signal(false);
  /** Id da categoria, `sem` (sem categoria) ou vazio (todas). */
  protected readonly categoriaFiltro = signal('');
  /** Forma de pagamento, `sem` (não informada) ou vazio (todas). Filtrar por ela mostra só despesas. */
  protected readonly formaFiltro = signal('');
  protected readonly formasPagamento = FORMAS_PAGAMENTO;
  protected readonly mostraFormaPagamento = computed(() => this.tipo() !== 'receita');

  protected readonly categoriasDisponiveis = computed(() => {
    const tipo = this.tipo();
    return tipo === 'todos' ? this.categoriaStore.items() : this.categoriaStore.doTipo(tipo);
  });
  protected readonly search = signal('');
  /** `yyyy-MM`, ou vazio para todos os meses. */
  protected readonly month = signal('');
  protected readonly sort = signal<Sort>({ field: 'data', direction: 'desc' });
  protected readonly page = signal(1);

  private readonly lancamentos = computed(() => this.facade.byTipo(this.tipo())());

  protected readonly months = computed(() => {
    const keys = availableMonths(this.lancamentos());
    const current = monthKey(new Date());
    return keys.includes(current) ? keys : [current, ...keys];
  });

  protected readonly filtered = computed(() => {
    const term = normalize(this.search());
    const month = this.month();
    const categoria = this.categoriaFiltro();
    const forma = this.formaFiltro();
    return this.lancamentos().filter(
      (lancamento) =>
        (!month || monthKey(lancamento.data) === month) &&
        (!forma ||
          (lancamento.tipo === 'despesa' &&
            (forma === 'sem' ? lancamento.formaPagamento === null : lancamento.formaPagamento === forma))) &&
        (!categoria ||
          (categoria === 'sem' ? lancamento.categoriaId === null : lancamento.categoriaId === Number(categoria))) &&
        (!term ||
          normalize(lancamento.descricao).includes(term) ||
          normalize(lancamento.detalhe ?? '').includes(term)),
    );
  });

  protected readonly sorted = computed(() => {
    const { field, direction } = this.sort();
    const factor = direction === 'asc' ? 1 : -1;
    return [...this.filtered()].sort((a, b) => COMPARATORS[field](a, b) * factor);
  });

  protected readonly total = computed(() => sumValores(this.filtered()));
  /** Crédito x débito/Pix/dinheiro, dentro dos filtros aplicados. */
  protected readonly pagamento = computed(() => resumoPagamento(this.filtered()));
  protected readonly resumo = computed(() => resumo(this.filtered()));
  protected readonly media = computed(() =>
    this.filtered().length ? this.total() / this.filtered().length : 0,
  );
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.sorted().length / PAGE_SIZE)));
  protected readonly pageItems = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.sorted().slice(start, start + PAGE_SIZE);
  });
  protected readonly rangeLabel = computed(() => {
    const count = this.sorted().length;
    const start = (this.page() - 1) * PAGE_SIZE + 1;
    return `${start}–${Math.min(start + PAGE_SIZE - 1, count)} de ${count}`;
  });

  protected readonly hasFilters = computed(
    () => !!this.search() || !!this.month() || !!this.categoriaFiltro() || !!this.formaFiltro(),
  );
  protected readonly showSkeleton = computed(
    () => this.facade.loading() && this.lancamentos().length === 0,
  );

  ngOnInit(): void {
    this.facade.load();
  }

  protected monthLabel(key: string): string {
    const label = formatDate(monthKeyToDate(key), 'MMMM yyyy', this.locale);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected onMonthChange(event: Event): void {
    this.month.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  protected onCategoriaChange(event: Event): void {
    this.categoriaFiltro.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  protected onFormaChange(event: Event): void {
    this.formaFiltro.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  protected formaDe(lancamento: Lancamento): FormaPagamentoInfo | null {
    return infoFormaPagamento(lancamento.formaPagamento);
  }

  protected categoriaDe(lancamento: Lancamento): Categoria | null {
    return lancamento.categoriaId == null ? null : (this.categoriaStore.porId().get(lancamento.categoriaId) ?? null);
  }

  protected rotuloCategoria(categoria: Categoria): string {
    if (!this.isTodos()) {
      return categoria.nome;
    }
    return `${categoria.nome} (${categoria.tipo === 'receita' ? 'entrada' : 'despesa'})`;
  }

  protected tituloExclusao(lancamento: Lancamento): string {
    return `Excluir ${TIPO_INFO[lancamento.tipo].singular.toLowerCase()}?`;
  }

  protected mensagemExclusao(lancamento: Lancamento): string {
    const valor = this.currency.transform(lancamento.valor, 'BRL');
    return `"${lancamento.descricao}" (${valor}) será removida do seu extrato. Essa ação não pode ser desfeita.`;
  }

  protected excluir(lancamento: Lancamento): void {
    this.excluindo.set(true);
    this.facade
      .remove(lancamento)
      .pipe(finalize(() => this.excluindo.set(false)))
      .subscribe({
        next: () => {
          this.paraExcluir.set(null);
          this.toast.success(`${TIPO_INFO[lancamento.tipo].singular} excluída.`);
          this.goToPage(this.page());
        },
        error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível excluir.')),
      });
  }

  protected clearFilters(): void {
    this.search.set('');
    this.month.set('');
    this.categoriaFiltro.set('');
    this.formaFiltro.set('');
    this.page.set(1);
  }

  protected toggleSort(field: SortField): void {
    this.sort.update((current) =>
      current.field === field
        ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: field === 'descricao' ? 'asc' : 'desc' },
    );
  }

  protected ariaSort(field: SortField): 'ascending' | 'descending' | 'none' {
    const sort = this.sort();
    if (sort.field !== field) {
      return 'none';
    }
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected goToPage(page: number): void {
    this.page.set(Math.min(Math.max(page, 1), this.pageCount()));
  }

  protected exportCsv(): void {
    const suffix = this.month() || toIsoDate(new Date());
    const slug = this.copy().title.toLowerCase();
    downloadCsv(
      `nick-finance-${slug}-${suffix}.csv`,
      ['Data', 'Tipo', 'Descrição', 'Categoria', this.copy().detalheLabel, 'Pagamento', 'Valor'],
      this.sorted().map((lancamento) => [
        formatDate(lancamento.data, 'dd/MM/yyyy', this.locale),
        TIPO_INFO[lancamento.tipo].singular,
        lancamento.descricao,
        this.categoriaDe(lancamento)?.nome ?? '',
        lancamento.detalhe ?? '',
        this.formaDe(lancamento)?.rotulo ?? '',
        signedValue(lancamento).toFixed(2).replace('.', ','),
      ]),
    );
  }
}

/** Entradas positivas, despesas negativas. */
function signedValue(lancamento: Lancamento): number {
  return lancamento.tipo === 'receita' ? lancamento.valor : -lancamento.valor;
}

/** Minúsculas e sem acento, para a busca ignorar "Café" x "cafe". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
