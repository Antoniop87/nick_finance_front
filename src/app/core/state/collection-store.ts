import { computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { CrudApi } from '../http/crud-api';
import { httpErrorMessage } from '../http/http-error';

type Status = 'idle' | 'loading' | 'loaded' | 'error';

interface CollectionState<T> {
  /** Usuário a quem os dados pertencem. */
  ownerId: number | null;
  items: T[];
  status: Status;
  error: string | null;
}

export interface Identified {
  id: number;
}

/**
 * Base para stores que guardam uma lista de registros do usuário logado.
 * Cuida de carregamento, cache, erro e de limpar os dados ao sair.
 * As telas leem os signals; só o store fala com a API.
 */
export abstract class CollectionStore<T extends Identified> {
  protected readonly auth = inject(AuthService);
  private readonly state = signal<CollectionState<T>>(emptyState());

  /** Itens na ordem definida por {@link compare}. */
  readonly items = computed(() => [...this.state().items].sort((a, b) => this.compare(a, b)));
  readonly loading = computed(() => this.state().status === 'loading');
  readonly loaded = computed(() => this.state().status === 'loaded');
  readonly error = computed(() => this.state().error);

  protected abstract readonly loadErrorMessage: string;
  protected abstract fetchAll(): Observable<T[]>;

  /** Ordem dos itens; por padrão, a da API. */
  protected compare(_a: T, _b: T): number {
    return 0;
  }

  constructor() {
    // Ao sair, descarta os dados do usuário anterior.
    effect(() => {
      if (!this.auth.user()) {
        untracked(() => this.state.set(emptyState()));
      }
    });
  }

  /** Carrega os itens. Sem `force`, reaproveita o que já foi carregado. */
  load(force = false): void {
    const user = this.auth.user();
    if (!user) {
      return;
    }

    const { ownerId, status } = this.state();
    const sameOwner = ownerId === user.id;
    if (sameOwner && (status === 'loading' || (status === 'loaded' && !force))) {
      return;
    }

    this.state.update((state) => ({
      ownerId: user.id,
      items: sameOwner ? state.items : [],
      status: 'loading',
      error: null,
    }));

    this.fetchAll().subscribe({
      next: (items) => this.updateIfOwner(user.id, (state) => ({ ...state, items, status: 'loaded' })),
      error: (err: unknown) =>
        this.updateIfOwner(user.id, (state) => ({
          ...state,
          status: 'error',
          error: httpErrorMessage(err, {}, this.loadErrorMessage),
        })),
    });
  }

  protected addItem(item: T): void {
    this.mutate((items) => [...items, item]);
  }

  protected replaceItem(item: T): void {
    this.mutate((items) => items.map((current) => (current.id === item.id ? item : current)));
  }

  protected removeItem(id: number): void {
    this.mutate((items) => items.filter((current) => current.id !== id));
  }

  private mutate(change: (items: T[]) => T[]): void {
    const userId = this.auth.user()?.id;
    if (userId != null) {
      this.updateIfOwner(userId, (state) => ({ ...state, items: change(state.items) }));
    }
  }

  /** Ignora respostas que chegam depois de o usuário ter saído ou trocado de conta. */
  private updateIfOwner(
    ownerId: number,
    change: (state: CollectionState<T>) => CollectionState<T>,
  ): void {
    this.state.update((state) => (state.ownerId === ownerId ? change(state) : state));
  }
}

/**
 * Store com criar/editar/excluir sobre uma {@link CrudApi}. O estado local é atualizado
 * com o registro devolvido pela API, sem recarregar a lista inteira.
 */
export abstract class CrudStore<T extends Identified, TReq> extends CollectionStore<T> {
  protected abstract readonly api: CrudApi<T, TReq, unknown>;

  protected fetchAll(): Observable<T[]> {
    return this.api.list();
  }

  create(request: TReq): Observable<T> {
    return this.api.create(request).pipe(tap((item) => this.addItem(item)));
  }

  update(id: number, request: TReq): Observable<T> {
    return this.api.update(id, request).pipe(tap((item) => this.replaceItem(item)));
  }

  remove(id: number): Observable<void> {
    return this.api.remove(id).pipe(
      tap(() => this.removeItem(id)),
      map(() => undefined),
    );
  }
}

/** Mais recente primeiro; empate pelo maior id. */
export function byDateDesc<T extends Identified & { data: Date }>(a: T, b: T): number {
  return b.data.getTime() - a.data.getTime() || b.id - a.id;
}

function emptyState<T>(): CollectionState<T> {
  return { ownerId: null, items: [], status: 'idle', error: null };
}
