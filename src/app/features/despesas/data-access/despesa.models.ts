/** Despesa como a API devolve em `GET /despesa`. */
export interface DespesaResponse {
  id: number;
  descricao: string;
  estabelecimento: string | null;
  valor: number;
  /** `yyyy-MM-dd`. */
  data: string;
  categoriaId: number | null;
}

/** Corpo de `POST /despesa` e `PUT /despesa/{id}`. O usuário vem do token. */
export interface DespesaRequest {
  descricao: string;
  estabelecimento: string | null;
  valor: number;
  /** `yyyy-MM-dd`. */
  data: string;
  categoriaId: number | null;
}

/** Despesa usada pela aplicação, desacoplada do formato da API. */
export interface Despesa {
  id: number;
  descricao: string;
  estabelecimento: string | null;
  valor: number;
  data: Date;
  categoriaId: number | null;
}
