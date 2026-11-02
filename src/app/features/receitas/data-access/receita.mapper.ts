import { parseApiDate } from '../../../core/utils/date';
import { Receita, ReceitaRequest, ReceitaResponse } from './receita.models';

export function toReceita(response: ReceitaResponse): Receita {
  return {
    id: response.id,
    descricao: response.descricao,
    origem: response.origem?.trim() || null,
    valor: Number(response.valor),
    data: parseApiDate(response.data),
    categoriaId: response.categoriaId ?? null,
  };
}

export function toReceitaRequest(receita: ReceitaRequest): ReceitaRequest {
  return {
    ...receita,
    descricao: receita.descricao.trim(),
    origem: receita.origem?.trim() || null,
  };
}
