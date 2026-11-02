import { TipoLancamento, TipoLancamentoApi } from '../../../core/models/tipo-lancamento';

// ---------- Orçamentos ----------

export interface OrcamentoResponse {
  id: number;
  categoriaId: number;
  valorLimite: number;
}

/** Limite mensal de gastos de uma categoria de despesa. */
export interface Orcamento {
  id: number;
  categoriaId: number;
  valorLimite: number;
}

export interface OrcamentoRequest {
  categoriaId: number;
  valorLimite: number;
}

// ---------- Recorrências ----------

export interface RecorrenciaResponse {
  id: number;
  tipo: TipoLancamentoApi;
  descricao: string;
  detalhe: string | null;
  valor: number;
  categoriaId: number | null;
  diaDoMes: number;
  ativa: boolean;
  /** `yyyy-MM-dd` ou null quando pausada. */
  proximaData: string | null;
}

/** Lançamento que se repete todo mês. */
export interface Recorrencia {
  id: number;
  tipo: TipoLancamento;
  descricao: string;
  detalhe: string | null;
  valor: number;
  categoriaId: number | null;
  diaDoMes: number;
  ativa: boolean;
  proximaData: Date | null;
}

export interface RecorrenciaRequest {
  tipo: TipoLancamento;
  descricao: string;
  detalhe: string | null;
  valor: number;
  categoriaId: number | null;
  diaDoMes: number;
  ativa: boolean;
}

// ---------- Contas a pagar e a receber ----------

export interface CompromissoResponse {
  id: number;
  tipo: TipoLancamentoApi;
  descricao: string;
  detalhe: string | null;
  valor: number;
  /** `yyyy-MM-dd`. */
  vencimento: string;
  categoriaId: number | null;
  pagoEm: string | null;
  lancamentoId: number | null;
}

/** Conta com vencimento. Despesa = a pagar; receita = a receber. */
export interface Compromisso {
  id: number;
  tipo: TipoLancamento;
  descricao: string;
  detalhe: string | null;
  valor: number;
  vencimento: Date;
  categoriaId: number | null;
  pagoEm: Date | null;
  lancamentoId: number | null;
}

export interface CompromissoRequest {
  tipo: TipoLancamento;
  descricao: string;
  detalhe: string | null;
  valor: number;
  /** `yyyy-MM-dd`. */
  vencimento: string;
  categoriaId: number | null;
}

// ---------- Metas ----------

export interface MetaResponse {
  id: number;
  nome: string;
  valorAlvo: number;
  valorGuardado: number;
  prazo: string | null;
  icone: string;
  cor: string;
  criadaEm: string;
}

/** Objetivo de economia. */
export interface Meta {
  id: number;
  nome: string;
  valorAlvo: number;
  valorGuardado: number;
  prazo: Date | null;
  icone: string;
  cor: string;
  criadaEm: Date;
}

export interface MetaRequest {
  nome: string;
  valorAlvo: number;
  /** `yyyy-MM-dd` ou null. */
  prazo: string | null;
  icone: string;
  cor: string;
}
