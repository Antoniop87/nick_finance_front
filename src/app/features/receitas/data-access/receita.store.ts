import { Injectable, inject } from '@angular/core';

import { CrudStore, byDateDesc } from '../../../core/state/collection-store';
import { ReceitaApi } from './receita.api';
import { Receita, ReceitaRequest } from './receita.models';

/** Entradas de dinheiro do usuário logado, compartilhadas entre as telas. */
@Injectable({ providedIn: 'root' })
export class ReceitaStore extends CrudStore<Receita, ReceitaRequest> {
  protected readonly api = inject(ReceitaApi);
  protected readonly loadErrorMessage = 'Não foi possível carregar suas entradas.';

  protected override compare(a: Receita, b: Receita): number {
    return byDateDesc(a, b);
  }
}
