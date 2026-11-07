import { toDespesa } from '../../features/despesas/data-access/despesa.mapper';
import { infoFormaPagamento, parseFormaPagamento } from './forma-pagamento';

describe('forma-pagamento', () => {
  it('aceita só os valores conhecidos da API', () => {
    expect(parseFormaPagamento('CREDITO')).toBe('CREDITO');
    expect(parseFormaPagamento('PIX')).toBe('PIX');
    expect(parseFormaPagamento(null)).toBeNull();
    expect(parseFormaPagamento('BOLETO')).toBeNull();
  });

  it('traz o rótulo para exibir', () => {
    expect(infoFormaPagamento('CREDITO')?.rotulo).toBe('Cartão de crédito');
    expect(infoFormaPagamento(null)).toBeNull();
  });

  it('despesa antiga sem forma vira null no mapper', () => {
    const despesa = toDespesa({
      id: 1,
      descricao: 'Mercado',
      estabelecimento: null,
      valor: 10,
      data: '2026-11-06',
      categoriaId: null,
      formaPagamento: null,
    });
    expect(despesa.formaPagamento).toBeNull();
  });
});
