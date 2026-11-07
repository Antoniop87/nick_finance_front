import { Lancamento, TipoLancamento } from './lancamento.models';
import {
  availableMonths,
  monthlyResumo,
  percentChange,
  resumo,
  sumValores,
  topDetalhes,
  resumoPagamento,
} from './lancamento-stats';

let nextId = 0;
const lancamento = (
  tipo: TipoLancamento,
  valor: number,
  data: Date,
  detalhe: string | null = null,
): Lancamento => {
  const id = ++nextId;
  return {
    key: `${tipo}-${id}`,
    id,
    tipo,
    descricao: `Item ${id}`,
    detalhe,
    valor,
    data,
    categoriaId: null,
    formaPagamento: null,
  };
};

describe('lancamento-stats', () => {
  const lancamentos: Lancamento[] = [
    lancamento('despesa', 0.1, new Date(2025, 0, 5), 'Mercado'),
    lancamento('despesa', 0.2, new Date(2025, 0, 20), 'Mercado'),
    lancamento('receita', 3000, new Date(2025, 0, 5), 'Empresa'),
    lancamento('despesa', 50, new Date(2025, 1, 3), 'Posto'),
    lancamento('despesa', 10, new Date(2025, 2, 1)),
  ];

  it('sumValores soma sem erro de ponto flutuante', () => {
    expect(sumValores(lancamentos.slice(0, 2))).toBe(0.3);
  });

  it('resumo separa entradas, saídas e calcula o saldo', () => {
    expect(resumo(lancamentos)).toEqual({
      entradas: 3000,
      saidas: 60.3,
      saldo: 2939.7,
    });
  });

  it('resumoPagamento separa crédito de débito, Pix e dinheiro', () => {
    const comForma = (
      valor: number,
      formaPagamento: Lancamento['formaPagamento'],
    ): Lancamento => ({
      ...lancamento('despesa', valor, new Date(2026, 10, 1)),
      formaPagamento,
    });
    const r = resumoPagamento([
      comForma(100.1, 'CREDITO'),
      comForma(0.2, 'PIX'),
      comForma(30, 'DEBITO'),
      comForma(5, 'DINHEIRO'),
      comForma(7, null),
      lancamento('receita', 999, new Date(2026, 10, 1)),
    ]);

    expect(r.credito).toBe(100.1);
    expect(r.aVista).toBe(35.2);
    expect(r.naoInformado).toBe(7);
    expect(r.porForma.PIX).toBe(0.2);
  });

  it('resumo aceita saldo negativo', () => {
    expect(resumo(lancamentos.slice(3)).saldo).toBe(-60);
  });

  it('monthlyResumo inclui meses sem lançamentos zerados', () => {
    const meses = monthlyResumo(lancamentos, new Date(2025, 3, 15), 4);
    expect(meses.map((m) => m.key)).toEqual([
      '2025-01',
      '2025-02',
      '2025-03',
      '2025-04',
    ]);
    expect(meses.map((m) => m.saidas)).toEqual([0.3, 50, 10, 0]);
    expect(meses.map((m) => m.entradas)).toEqual([3000, 0, 0, 0]);
  });

  it('topDetalhes agrupa e ordena pelo total', () => {
    const despesas = lancamentos.filter((l) => l.tipo === 'despesa');
    expect(topDetalhes(despesas, 2, 'Não informado')).toEqual([
      { nome: 'Posto', total: 50, quantidade: 1 },
      { nome: 'Não informado', total: 10, quantidade: 1 },
    ]);
  });

  it('percentChange retorna null sem base de comparação', () => {
    expect(percentChange(100, 0)).toBeNull();
    expect(percentChange(150, 100)).toBe(50);
  });

  it('availableMonths lista meses distintos do mais recente ao mais antigo', () => {
    expect(availableMonths(lancamentos)).toEqual([
      '2025-03',
      '2025-02',
      '2025-01',
    ]);
  });
});
