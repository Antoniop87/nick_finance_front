import { FormaPagamento } from '../../../core/models/forma-pagamento';

/** Despesa como a API devolve em `GET /despesa`. */
export interface DespesaResponse {
  id: number;
  descricao: string;
  estabelecimento: string | null;
  valor: number;
  /** `yyyy-MM-dd`. */
  data: string;
  categoriaId: number | null;
  /** `null` nas despesas antigas. */
  formaPagamento: string | null;
}

/** Corpo de `POST /despesa` e `PUT /despesa/{id}`. O usuário vem do token. */
export interface DespesaRequest {
  descricao: string;
  estabelecimento: string | null;
  valor: number;
  /** `yyyy-MM-dd`. */
  data: string;
  categoriaId: number | null;
  formaPagamento: FormaPagamento | null;
}

/** Despesa usada pela aplicação, desacoplada do formato da API. */
export interface Despesa {
  id: number;
  descricao: string;
  estabelecimento: string | null;
  valor: number;
  data: Date;
  categoriaId: number | null;
  /** `null` = não informado (despesas antigas ou lançadas pelo app/bot sem a forma). */
  formaPagamento: FormaPagamento | null;
}
