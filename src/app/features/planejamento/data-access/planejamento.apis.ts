import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CrudApi } from '../../../core/http/crud-api';
import { fromApiTipo, toApiTipo } from '../../../core/models/tipo-lancamento';
import { parseApiDate } from '../../../core/utils/date';
import {
  Compromisso,
  CompromissoRequest,
  CompromissoResponse,
  Meta,
  MetaRequest,
  MetaResponse,
  Orcamento,
  OrcamentoRequest,
  OrcamentoResponse,
  Recorrencia,
  RecorrenciaRequest,
  RecorrenciaResponse,
} from './planejamento.models';

const dataOuNulo = (valor: string | null): Date | null => (valor ? parseApiDate(valor) : null);
const textoOuNulo = (valor: string | null): string | null => valor?.trim() || null;

@Injectable({ providedIn: 'root' })
export class OrcamentoApi extends CrudApi<Orcamento, OrcamentoRequest, OrcamentoResponse> {
  protected readonly resource = 'orcamento';

  protected fromResponse(r: OrcamentoResponse): Orcamento {
    return { ...r, valorLimite: Number(r.valorLimite) };
  }
}

@Injectable({ providedIn: 'root' })
export class RecorrenciaApi extends CrudApi<Recorrencia, RecorrenciaRequest, RecorrenciaResponse> {
  protected readonly resource = 'recorrencia';

  protected fromResponse(r: RecorrenciaResponse): Recorrencia {
    return { ...r, tipo: fromApiTipo(r.tipo), valor: Number(r.valor), proximaData: dataOuNulo(r.proximaData) };
  }

  protected override toRequest(r: RecorrenciaRequest): unknown {
    return { ...r, tipo: toApiTipo(r.tipo), descricao: r.descricao.trim(), detalhe: textoOuNulo(r.detalhe) };
  }
}

@Injectable({ providedIn: 'root' })
export class CompromissoApi extends CrudApi<Compromisso, CompromissoRequest, CompromissoResponse> {
  protected readonly resource = 'compromisso';

  protected fromResponse(r: CompromissoResponse): Compromisso {
    return {
      ...r,
      tipo: fromApiTipo(r.tipo),
      valor: Number(r.valor),
      vencimento: parseApiDate(r.vencimento),
      pagoEm: dataOuNulo(r.pagoEm),
    };
  }

  protected override toRequest(r: CompromissoRequest): unknown {
    return { ...r, tipo: toApiTipo(r.tipo), descricao: r.descricao.trim(), detalhe: textoOuNulo(r.detalhe) };
  }

  /** Marca como paga (gera o lançamento). Sem `data`, usa hoje. */
  pagar(id: number, data?: string): Observable<Compromisso> {
    return this.http
      .post<CompromissoResponse>(`${this.url}/${id}/pagar`, data ? { data } : null)
      .pipe(map((r) => this.fromResponse(r)));
  }

  /** Desfaz o pagamento (remove o lançamento gerado). */
  reabrir(id: number): Observable<Compromisso> {
    return this.http
      .post<CompromissoResponse>(`${this.url}/${id}/reabrir`, null)
      .pipe(map((r) => this.fromResponse(r)));
  }
}

@Injectable({ providedIn: 'root' })
export class MetaApi extends CrudApi<Meta, MetaRequest, MetaResponse> {
  protected readonly resource = 'meta';

  protected fromResponse(r: MetaResponse): Meta {
    return {
      ...r,
      valorAlvo: Number(r.valorAlvo),
      valorGuardado: Number(r.valorGuardado),
      prazo: dataOuNulo(r.prazo),
      criadaEm: parseApiDate(r.criadaEm),
    };
  }

  protected override toRequest(r: MetaRequest): unknown {
    return { ...r, nome: r.nome.trim() };
  }

  /** Guarda (positivo) ou retira (negativo). */
  movimentar(id: number, valor: number): Observable<Meta> {
    return this.http
      .post<MetaResponse>(`${this.url}/${id}/movimento`, { valor })
      .pipe(map((r) => this.fromResponse(r)));
  }
}
