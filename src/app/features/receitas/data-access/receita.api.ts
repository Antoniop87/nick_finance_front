import { Injectable } from '@angular/core';

import { CrudApi } from '../../../core/http/crud-api';
import { toReceita, toReceitaRequest } from './receita.mapper';
import { Receita, ReceitaRequest, ReceitaResponse } from './receita.models';

/** `/receita`: o usuário é identificado pelo token. */
@Injectable({ providedIn: 'root' })
export class ReceitaApi extends CrudApi<Receita, ReceitaRequest, ReceitaResponse> {
  protected readonly resource = 'receita';

  protected fromResponse(response: ReceitaResponse): Receita {
    return toReceita(response);
  }

  protected override toRequest(request: ReceitaRequest): ReceitaRequest {
    return toReceitaRequest(request);
  }
}
