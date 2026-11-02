/** `receita` = dinheiro que entrou; `despesa` = dinheiro que saiu. */
export type TipoLancamento = 'receita' | 'despesa';

/** Como a API representa o tipo. */
export type TipoLancamentoApi = 'RECEITA' | 'DESPESA';

export function fromApiTipo(tipo: TipoLancamentoApi): TipoLancamento {
  return tipo === 'RECEITA' ? 'receita' : 'despesa';
}

export function toApiTipo(tipo: TipoLancamento): TipoLancamentoApi {
  return tipo === 'receita' ? 'RECEITA' : 'DESPESA';
}
