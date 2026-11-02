import { parseApiDate } from '../../../core/utils/date';
import { Despesa, DespesaRequest, DespesaResponse } from './despesa.models';

export function toDespesa(response: DespesaResponse): Despesa {
  return {
    id: response.id,
    descricao: response.descricao,
    estabelecimento: response.estabelecimento?.trim() || null,
    valor: Number(response.valor),
    data: parseApiDate(response.data),
    categoriaId: response.categoriaId ?? null,
  };
}

export function toDespesaRequest(despesa: DespesaRequest): DespesaRequest {
  return {
    ...despesa,
    descricao: despesa.descricao.trim(),
    estabelecimento: despesa.estabelecimento?.trim() || null,
  };
}
