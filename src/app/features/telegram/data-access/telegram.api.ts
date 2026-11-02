import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { TelegramCodigo, TelegramStatus } from './telegram.models';

/** Integração com o Telegram da conta logada. */
@Injectable({ providedIn: 'root' })
export class TelegramApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/telegram`;

  status(): Observable<TelegramStatus> {
    return this.http.get<TelegramStatus>(this.baseUrl);
  }

  gerarCodigo(): Observable<TelegramCodigo> {
    return this.http.post<TelegramCodigo>(`${this.baseUrl}/codigo`, null);
  }

  desvincular(): Observable<void> {
    return this.http.delete<void>(this.baseUrl);
  }
}
