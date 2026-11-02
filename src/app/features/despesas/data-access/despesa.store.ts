import { Injectable, inject } from '@angular/core';

import { CrudStore, byDateDesc } from '../../../core/state/collection-store';
import { DespesaApi } from './despesa.api';
import { Despesa, DespesaRequest } from './despesa.models';

/** Despesas do usuário logado, compartilhadas entre as telas. */
@Injectable({ providedIn: 'root' })
export class DespesaStore extends CrudStore<Despesa, DespesaRequest> {
  protected readonly api = inject(DespesaApi);
  protected readonly loadErrorMessage = 'Não foi possível carregar suas despesas.';

  protected override compare(a: Despesa, b: Despesa): number {
    return byDateDesc(a, b);
  }
}
