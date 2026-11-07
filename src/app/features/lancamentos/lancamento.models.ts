import { FormaPagamento } from '../../core/models/forma-pagamento';
import { TipoLancamento } from '../../core/models/tipo-lancamento';

export type { TipoLancamento } from '../../core/models/tipo-lancamento';

/**
 * Visão unificada de receitas e despesas, usada pelas telas que mostram
 * as duas coisas juntas (extrato, dashboard, formulário).
 */
export interface Lancamento {
  /** Único entre tipos (ex.: `despesa-3`), para uso em `track`. */
  key: string;
  id: number;
  tipo: TipoLancamento;
  descricao: string;
  /** Estabelecimento (despesa) ou origem (receita). */
  detalhe: string | null;
  valor: number;
  data: Date;
  categoriaId: number | null;
  /** Só despesas; `null` em entradas e em despesas sem a forma informada. */
  formaPagamento: FormaPagamento | null;
}

/** Dados do formulário de lançamento (criar ou editar). */
export interface NovoLancamento {
  descricao: string;
  detalhe: string | null;
  valor: number;
  /** Formato `yyyy-MM-dd`. */
  data: string;
  categoriaId: number | null;
  /** Ignorado em entradas. */
  formaPagamento: FormaPagamento | null;
}

export interface TipoInfo {
  singular: string;
  plural: string;
  detalheLabel: string;
  detalhePlaceholder: string;
  descricaoPlaceholder: string;
}

export const TIPO_INFO: Record<TipoLancamento, TipoInfo> = {
  receita: {
    singular: 'Entrada',
    plural: 'Entradas',
    detalheLabel: 'Origem',
    detalhePlaceholder: 'Ex.: Empresa X, Cliente Y',
    descricaoPlaceholder: 'Ex.: Salário',
  },
  despesa: {
    singular: 'Despesa',
    plural: 'Despesas',
    detalheLabel: 'Estabelecimento',
    detalhePlaceholder: 'Ex.: Supermercado',
    descricaoPlaceholder: 'Ex.: Compras do mês',
  },
};
