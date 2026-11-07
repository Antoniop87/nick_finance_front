import { Lancamento } from '../lancamentos/lancamento.models';
import { Compromisso, Meta, Recorrencia } from './data-access/planejamento.models';
import { planoMeta, projecaoDoMes, situacaoConta, situacaoOrcamento } from './planejamento-calculos';

const HOJE = new Date(2026, 10, 15);

const lancamento = (tipo: 'receita' | 'despesa', valor: number, data: Date, categoriaId: number | null = null): Lancamento => ({
  key: `${tipo}-${valor}`,
  id: valor,
  tipo,
  descricao: 'x',
  detalhe: null,
  valor,
  data,
  categoriaId,
  formaPagamento: null,
});

const conta = (tipo: 'receita' | 'despesa', valor: number, vencimento: Date, pagoEm: Date | null = null): Compromisso => ({
  id: valor,
  tipo,
  descricao: 'x',
  detalhe: null,
  valor,
  vencimento,
  categoriaId: null,
  pagoEm,
  lancamentoId: null,
});

describe('planejamento-calculos', () => {
  it('situacaoOrcamento soma só a categoria e classifica o status', () => {
    const despesas = [
      lancamento('despesa', 150, HOJE, 1),
      lancamento('despesa', 40, HOJE, 1),
      lancamento('despesa', 999, HOJE, 2),
    ];
    const situacao = situacaoOrcamento({ id: 1, categoriaId: 1, valorLimite: 200 }, despesas);

    expect(situacao.gasto).toBe(190);
    expect(situacao.restante).toBe(10);
    expect(situacao.status).toBe('alerta');
    expect(situacaoOrcamento({ id: 1, categoriaId: 2, valorLimite: 500 }, despesas).status).toBe('estourado');
  });

  it('situacaoConta separa atrasadas, hoje, semana e depois', () => {
    expect(situacaoConta(conta('despesa', 1, new Date(2026, 10, 10)), HOJE)).toBe('atrasada');
    expect(situacaoConta(conta('despesa', 1, new Date(2026, 10, 15)), HOJE)).toBe('hoje');
    expect(situacaoConta(conta('despesa', 1, new Date(2026, 10, 20)), HOJE)).toBe('semana');
    expect(situacaoConta(conta('despesa', 1, new Date(2026, 11, 20)), HOJE)).toBe('depois');
    expect(situacaoConta(conta('despesa', 1, new Date(2026, 10, 1), HOJE), HOJE)).toBe('paga');
  });

  it('projecaoDoMes soma o que falta entrar e sair até o fim do mês', () => {
    const lancamentos = [lancamento('receita', 3000, new Date(2026, 10, 5)), lancamento('despesa', 500, HOJE)];
    const recorrencias: Recorrencia[] = [
      { id: 1, tipo: 'despesa', descricao: 'Aluguel', detalhe: null, valor: 1200, categoriaId: null, diaDoMes: 20, ativa: true, proximaData: new Date(2026, 10, 20) },
      { id: 2, tipo: 'receita', descricao: 'Salário', detalhe: null, valor: 3000, categoriaId: null, diaDoMes: 5, ativa: true, proximaData: new Date(2026, 11, 5) },
    ];
    const contas = [
      conta('despesa', 100, new Date(2026, 10, 2)), // atrasada, ainda conta
      conta('receita', 250, new Date(2026, 10, 28)),
      conta('despesa', 80, new Date(2026, 11, 3)), // mês que vem
      conta('despesa', 70, new Date(2026, 10, 1), new Date(2026, 10, 1)), // paga
    ];

    expect(projecaoDoMes(lancamentos, recorrencias, contas, HOJE)).toEqual({
      atual: 2500,
      aEntrar: 250,
      aSair: 1300,
      projetado: 1450,
    });
  });

  it('planoMeta calcula quanto guardar por mês até o prazo', () => {
    const meta: Meta = {
      id: 1, nome: 'Viagem', valorAlvo: 5000, valorGuardado: 1000,
      prazo: new Date(2027, 2, 1), icone: 'plane', cor: '#14b8a6', criadaEm: HOJE,
    };
    const plano = planoMeta(meta, HOJE);

    expect(plano.percentual).toBe(20);
    expect(plano.falta).toBe(4000);
    expect(plano.mesesRestantes).toBe(4);
    expect(plano.porMes).toBe(1000);
    expect(planoMeta({ ...meta, valorGuardado: 5000 }, HOJE).concluida).toBeTrue();
  });
});
