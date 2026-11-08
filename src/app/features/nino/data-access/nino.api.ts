import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export type PapelNino = 'user' | 'assistant';

export interface MensagemNino {
  papel: PapelNino;
  texto: string;
}

export interface StatusNino {
  ativo: boolean;
  restantesHoje: number;
  limiteDiario: number;
}

export interface RespostaNino {
  resposta: string;
  restantesHoje: number;
}

/** Máximo de mensagens que a API aceita por chamada. */
const MAX_HISTORICO = 20;

/** A conversa fica só no navegador; cada envio leva as mensagens mais recentes. */
export function historicoParaEnvio(mensagens: readonly MensagemNino[]): MensagemNino[] {
  return mensagens.slice(-MAX_HISTORICO);
}

/** Assistente Nino da conta logada. */
@Injectable({ providedIn: 'root' })
export class NinoApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/nino`;

  status(): Observable<StatusNino> {
    return this.http.get<StatusNino>(this.baseUrl);
  }

  enviar(mensagens: readonly MensagemNino[]): Observable<RespostaNino> {
    return this.http.post<RespostaNino>(`${this.baseUrl}/mensagem`, {
      mensagens: historicoParaEnvio(mensagens),
    });
  }
}
