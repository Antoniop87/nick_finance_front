/** Receita como a API devolve em `GET /receita`. */
export interface ReceitaResponse {
  id: number;
  descricao: string;
  origem: string | null;
  valor: number;
  /** `yyyy-MM-dd`. */
  data: string;
  categoriaId: number | null;
}

/** Corpo de `POST /receita` e `PUT /receita/{id}`. O usuário vem do token. */
export interface ReceitaRequest {
  descricao: string;
  origem: string | null;
  valor: number;
  /** `yyyy-MM-dd`. */
  data: string;
  categoriaId: number | null;
}

/** Entrada de dinheiro usada pela aplicação. */
export interface Receita {
  id: number;
  descricao: string;
  origem: string | null;
  valor: number;
  data: Date;
  categoriaId: number | null;
}
