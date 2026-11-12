import { FormaPagamento } from '../../../core/models/forma-pagamento';
import { TipoLancamentoApi } from '../../../core/models/tipo-lancamento';

export interface ConexaoBancaria {
  id: number;
  nomeBanco: string | null;
  /** Status do item na Pluggy: UPDATED, UPDATING, LOGIN_ERROR, OUTDATED... */
  status: string | null;
  ultimaSincronizacao: string | null;
  erro: string | null;
}

export interface BancosStatus {
  /** A API tem as chaves da Pluggy configuradas. */
  ativo: boolean;
  incluirSandbox: boolean;
  conexoes: ConexaoBancaria[];
  pendentes: number;
}

/** Transação do banco esperando o usuário importar ou ignorar. */
export interface TransacaoBancaria {
  id: number;
  data: string;
  descricao: string;
  conta: string | null;
  valor: number;
  tipo: TipoLancamentoApi;
  formaPagamento: FormaPagamento | null;
  categoriaSugeridaId: number | null;
  /** Já existe um lançamento com o mesmo valor em data próxima. */
  possivelDuplicado: boolean;
}
