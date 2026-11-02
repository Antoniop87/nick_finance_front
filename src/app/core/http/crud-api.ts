import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

/**
 * Base para recursos REST no padrão da API: `GET /recurso`, `POST /recurso`,
 * `PUT /recurso/{id}` e `DELETE /recurso/{id}`. O usuário é sempre o do token.
 *
 * `T` é o modelo usado no front, `TReq` o que o formulário produz e `TRes` o JSON da API.
 */
export abstract class CrudApi<T, TReq, TRes> {
  protected readonly http = inject(HttpClient);

  /** Caminho do recurso, ex.: `despesa`. */
  protected abstract readonly resource: string;

  protected abstract fromResponse(response: TRes): T;

  protected toRequest(request: TReq): unknown {
    return request;
  }

  protected get url(): string {
    return `${environment.apiUrl}/${this.resource}`;
  }

  list(): Observable<T[]> {
    return this.http.get<TRes[]>(this.url).pipe(map((items) => items.map((item) => this.fromResponse(item))));
  }

  create(request: TReq): Observable<T> {
    return this.http.post<TRes>(this.url, this.toRequest(request)).pipe(map((item) => this.fromResponse(item)));
  }

  update(id: number, request: TReq): Observable<T> {
    return this.http
      .put<TRes>(`${this.url}/${id}`, this.toRequest(request))
      .pipe(map((item) => this.fromResponse(item)));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
