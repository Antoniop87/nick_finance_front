import { Injectable, computed, inject } from '@angular/core';

import { TipoLancamento } from '../../../core/models/tipo-lancamento';
import { CrudStore } from '../../../core/state/collection-store';
import { CategoriaApi } from './categoria.api';
import { Categoria, CategoriaRequest } from './categoria.models';

/** Categorias do usuário, em ordem alfabética ("Outros" sempre por último). */
@Injectable({ providedIn: 'root' })
export class CategoriaStore extends CrudStore<Categoria, CategoriaRequest> {
  protected readonly api = inject(CategoriaApi);
  protected readonly loadErrorMessage = 'Não foi possível carregar as categorias.';

  readonly porId = computed(() => new Map(this.items().map((categoria) => [categoria.id, categoria])));
  readonly despesas = computed(() => this.items().filter((c) => c.tipo === 'despesa'));
  readonly receitas = computed(() => this.items().filter((c) => c.tipo === 'receita'));

  doTipo(tipo: TipoLancamento): Categoria[] {
    return tipo === 'receita' ? this.receitas() : this.despesas();
  }

  protected override compare(a: Categoria, b: Categoria): number {
    const outrosA = a.nome === 'Outros' ? 1 : 0;
    const outrosB = b.nome === 'Outros' ? 1 : 0;
    return outrosA - outrosB || a.nome.localeCompare(b.nome, 'pt-BR');
  }
}
