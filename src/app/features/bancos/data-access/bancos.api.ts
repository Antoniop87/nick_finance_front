import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { BancosStatus, ConexaoBancaria, TransacaoBancaria } from './bancos.models';

/** Integração bancária (Pluggy) da conta logada. */
@Injectable({ providedIn: 'root' })
export class BancosApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/bancos`;

  status(): Observable<BancosStatus> {
    return this.http.get<BancosStatus>(this.baseUrl);
  }

  connectToken(): Observable<string> {
    return this.http
      .post<{ accessToken: string }>(`${this.baseUrl}/connect-token`, null)
      .pipe(map((resposta) => resposta.accessToken));
  }

  conectar(itemId: string): Observable<ConexaoBancaria> {
    return this.http.post<ConexaoBancaria>(`${this.baseUrl}/conexoes`, { itemId });
  }

  sincronizar(id: number): Observable<number> {
    return this.http
      .post<{ quantidade: number }>(`${this.baseUrl}/conexoes/${id}/sincronizar`, null)
      .pipe(map((r) => r.quantidade));
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/conexoes/${id}`);
  }

  pendentes(): Observable<TransacaoBancaria[]> {
    return this.http.get<TransacaoBancaria[]>(`${this.baseUrl}/transacoes`);
  }

  importar(id: number, categoriaId: number | null): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/transacoes/${id}/importar`, { categoriaId });
  }

  ignorar(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/transacoes/${id}/ignorar`, null);
  }

  importarTodas(): Observable<number> {
    return this.http
      .post<{ quantidade: number }>(`${this.baseUrl}/transacoes/importar-todas`, null)
      .pipe(map((r) => r.quantidade));
  }
}
