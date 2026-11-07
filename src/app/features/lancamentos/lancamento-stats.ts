import { FormaPagamento } from '../../core/models/forma-pagamento';
import { addMonths, monthKey } from '../../core/utils/date';
import { Lancamento } from './lancamento.models';

interface Valorado {
  valor: number;
}

interface Datado {
  data: Date;
}

export interface Resumo {
  entradas: number;
  saidas: number;
  /** Entradas menos saídas. */
  saldo: number;
}

export interface MonthlyResumo extends Resumo {
  /** `yyyy-MM`. */
  key: string;
  /** Primeiro dia do mês. */
  month: Date;
}

export interface DetalheTotal {
  nome: string;
  total: number;
  quantidade: number;
}

/** Despesas separadas pela forma de pagamento. */
export interface ResumoPagamento {
  /** Cartão de crédito: vai para a fatura. */
  credito: number;
  /** Débito, Pix e dinheiro somados: saiu da conta na hora. */
  aVista: number;
  /** Despesas antigas ou lançadas sem a forma. */
  naoInformado: number;
  porForma: Record<FormaPagamento, number>;
}

/** Soma em centavos para não acumular erro de ponto flutuante. */
export function sumValores(items: readonly Valorado[]): number {
  const cents = items.reduce((sum, item) => sum + Math.round(item.valor * 100), 0);
  return cents / 100;
}

export function filterByMonth<T extends Datado>(items: readonly T[], key: string): T[] {
  return items.filter((item) => monthKey(item.data) === key);
}

/** Quanto entrou, quanto saiu e o saldo de um conjunto de lançamentos. */
export function resumo(lancamentos: readonly Lancamento[]): Resumo {
  const entradas = sumValores(lancamentos.filter((l) => l.tipo === 'receita'));
  const saidas = sumValores(lancamentos.filter((l) => l.tipo === 'despesa'));
  return { entradas, saidas, saldo: Math.round((entradas - saidas) * 100) / 100 };
}

/** Quanto das despesas foi no crédito e quanto foi à vista (débito, Pix e dinheiro). Entradas são ignoradas. */
export function resumoPagamento(lancamentos: readonly Lancamento[]): ResumoPagamento {
  const despesas = lancamentos.filter((l) => l.tipo === 'despesa');
  const da = (forma: FormaPagamento) => sumValores(despesas.filter((d) => d.formaPagamento === forma));
  const porForma: Record<FormaPagamento, number> = {
    PIX: da('PIX'),
    DEBITO: da('DEBITO'),
    DINHEIRO: da('DINHEIRO'),
    CREDITO: da('CREDITO'),
  };
  return {
    credito: porForma.CREDITO,
    aVista: sumValores([{ valor: porForma.PIX }, { valor: porForma.DEBITO }, { valor: porForma.DINHEIRO }]),
    naoInformado: sumValores(despesas.filter((d) => d.formaPagamento === null)),
    porForma,
  };
}

/** Resumo dos últimos `months` meses até `reference` (inclusive), do mais antigo ao mais recente. */
export function monthlyResumo(
  lancamentos: readonly Lancamento[],
  reference: Date,
  months: number,
): MonthlyResumo[] {
  return Array.from({ length: months }, (_, index) => {
    const month = addMonths(reference, index - months + 1);
    const key = monthKey(month);
    return { key, month, ...resumo(filterByMonth(lancamentos, key)) };
  });
}

/** Agrupa pelo detalhe (estabelecimento/origem) e ordena pelo maior total. */
export function topDetalhes(
  lancamentos: readonly Lancamento[],
  limit: number,
  semDetalhe: string,
): DetalheTotal[] {
  const groups = new Map<string, Lancamento[]>();
  for (const lancamento of lancamentos) {
    const nome = lancamento.detalhe ?? semDetalhe;
    groups.set(nome, [...(groups.get(nome) ?? []), lancamento]);
  }

  return [...groups.entries()]
    .map(([nome, items]) => ({ nome, total: sumValores(items), quantidade: items.length }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/** Variação percentual de `previous` para `current`; `null` quando não há base de comparação. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

/** Meses (`yyyy-MM`) que têm lançamentos, do mais recente ao mais antigo. */
export function availableMonths(items: readonly Datado[]): string[] {
  return [...new Set(items.map((item) => monthKey(item.data)))].sort().reverse();
}
