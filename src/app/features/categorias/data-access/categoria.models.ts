import { TipoLancamento, TipoLancamentoApi } from '../../../core/models/tipo-lancamento';

export interface CategoriaResponse {
  id: number;
  nome: string;
  icone: string;
  cor: string;
  tipo: TipoLancamentoApi;
}

export interface Categoria {
  id: number;
  nome: string;
  /** Nome de um ícone do `app-icon`. */
  icone: string;
  /** Hexadecimal, ex.: `#f97316`. */
  cor: string;
  tipo: TipoLancamento;
}

export interface CategoriaRequest {
  nome: string;
  icone: string;
  cor: string;
  tipo: TipoLancamento;
}
