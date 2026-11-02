import { Injectable } from '@angular/core';

import { CrudApi } from '../../../core/http/crud-api';
import { fromApiTipo, toApiTipo } from '../../../core/models/tipo-lancamento';
import { Categoria, CategoriaRequest, CategoriaResponse } from './categoria.models';

/** `/categoria`. Na primeira listagem a API cria as categorias padrão do usuário. */
@Injectable({ providedIn: 'root' })
export class CategoriaApi extends CrudApi<Categoria, CategoriaRequest, CategoriaResponse> {
  protected readonly resource = 'categoria';

  protected fromResponse(response: CategoriaResponse): Categoria {
    return { ...response, tipo: fromApiTipo(response.tipo) };
  }

  protected override toRequest(request: CategoriaRequest): unknown {
    return { ...request, nome: request.nome.trim(), tipo: toApiTipo(request.tipo) };
  }
}
