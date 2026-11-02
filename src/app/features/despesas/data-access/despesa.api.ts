import { Injectable } from '@angular/core';

import { CrudApi } from '../../../core/http/crud-api';
import { toDespesa, toDespesaRequest } from './despesa.mapper';
import { Despesa, DespesaRequest, DespesaResponse } from './despesa.models';

/** `/despesa`: o usuário é identificado pelo token. */
@Injectable({ providedIn: 'root' })
export class DespesaApi extends CrudApi<Despesa, DespesaRequest, DespesaResponse> {
  protected readonly resource = 'despesa';

  protected fromResponse(response: DespesaResponse): Despesa {
    return toDespesa(response);
  }

  protected override toRequest(request: DespesaRequest): DespesaRequest {
    return toDespesaRequest(request);
  }
}
