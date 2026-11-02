import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { CrudStore } from '../../../core/state/collection-store';
import { LancamentosFacade } from '../../lancamentos/lancamentos.facade';
import { CompromissoApi, MetaApi, OrcamentoApi, RecorrenciaApi } from './planejamento.apis';
import {
  Compromisso,
  CompromissoRequest,
  Meta,
  MetaRequest,
  Orcamento,
  OrcamentoRequest,
  Recorrencia,
  RecorrenciaRequest,
} from './planejamento.models';

@Injectable({ providedIn: 'root' })
export class OrcamentoStore extends CrudStore<Orcamento, OrcamentoRequest> {
  protected readonly api = inject(OrcamentoApi);
  protected readonly loadErrorMessage = 'Não foi possível carregar os orçamentos.';
}

@Injectable({ providedIn: 'root' })
export class RecorrenciaStore extends CrudStore<Recorrencia, RecorrenciaRequest> {
  protected readonly api = inject(RecorrenciaApi);
  private readonly lancamentos = inject(LancamentosFacade);
  protected readonly loadErrorMessage = 'Não foi possível carregar os lançamentos recorrentes.';

  // Salvar pode gerar o lançamento do dia; recarrega o extrato para refletir.
  override create(request: RecorrenciaRequest): Observable<Recorrencia> {
    return super.create(request).pipe(tap(() => this.lancamentos.load(true)));
  }

  override update(id: number, request: RecorrenciaRequest): Observable<Recorrencia> {
    return super.update(id, request).pipe(tap(() => this.lancamentos.load(true)));
  }

  protected override compare(a: Recorrencia, b: Recorrencia): number {
    return Number(b.ativa) - Number(a.ativa) || a.diaDoMes - b.diaDoMes || a.id - b.id;
  }
}

@Injectable({ providedIn: 'root' })
export class CompromissoStore extends CrudStore<Compromisso, CompromissoRequest> {
  protected readonly api = inject(CompromissoApi);
  private readonly lancamentos = inject(LancamentosFacade);
  protected readonly loadErrorMessage = 'Não foi possível carregar as contas.';

  /** Pagar cria uma despesa/receita: recarrega o extrato. */
  pagar(id: number, data?: string): Observable<Compromisso> {
    return this.api.pagar(id, data).pipe(
      tap((item) => {
        this.replaceItem(item);
        this.lancamentos.load(true);
      }),
    );
  }

  reabrir(id: number): Observable<Compromisso> {
    return this.api.reabrir(id).pipe(
      tap((item) => {
        this.replaceItem(item);
        this.lancamentos.load(true);
      }),
    );
  }

  protected override compare(a: Compromisso, b: Compromisso): number {
    return a.vencimento.getTime() - b.vencimento.getTime() || a.id - b.id;
  }
}

@Injectable({ providedIn: 'root' })
export class MetaStore extends CrudStore<Meta, MetaRequest> {
  protected readonly api = inject(MetaApi);
  protected readonly loadErrorMessage = 'Não foi possível carregar as metas.';

  movimentar(id: number, valor: number): Observable<Meta> {
    return this.api.movimentar(id, valor).pipe(tap((item) => this.replaceItem(item)));
  }
}
