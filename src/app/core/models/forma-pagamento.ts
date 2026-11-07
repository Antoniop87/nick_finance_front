import type { IconName } from '../../shared/ui/icon/icon';

/** Como uma despesa foi paga. Mesmo enum da API. */
export type FormaPagamento = 'PIX' | 'DEBITO' | 'DINHEIRO' | 'CREDITO';

export interface FormaPagamentoInfo {
  valor: FormaPagamento;
  rotulo: string;
  /** Rótulo curto, para chips e tabelas. */
  curto: string;
  icone: IconName;
}

/** Na ordem em que aparecem no formulário; Pix é o padrão de uma despesa nova. */
export const FORMAS_PAGAMENTO: readonly FormaPagamentoInfo[] = [
  { valor: 'PIX', rotulo: 'Pix', curto: 'Pix', icone: 'pix' },
  { valor: 'DEBITO', rotulo: 'Débito', curto: 'Débito', icone: 'wallet' },
  { valor: 'DINHEIRO', rotulo: 'Dinheiro', curto: 'Dinheiro', icone: 'banknote' },
  { valor: 'CREDITO', rotulo: 'Cartão de crédito', curto: 'Crédito', icone: 'creditCard' },
];

export const FORMA_PAGAMENTO_PADRAO: FormaPagamento = 'PIX';

const POR_VALOR = new Map(FORMAS_PAGAMENTO.map((forma) => [forma.valor, forma]));

export function infoFormaPagamento(forma: FormaPagamento | null | undefined): FormaPagamentoInfo | null {
  return forma ? (POR_VALOR.get(forma) ?? null) : null;
}

/** A API devolve `null` nas despesas antigas e o app Android ainda não envia o campo. */
export function parseFormaPagamento(valor: unknown): FormaPagamento | null {
  return typeof valor === 'string' && POR_VALOR.has(valor as FormaPagamento) ? (valor as FormaPagamento) : null;
}
