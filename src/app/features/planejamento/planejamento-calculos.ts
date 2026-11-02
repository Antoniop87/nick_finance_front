import { monthKey } from '../../core/utils/date';
import { Lancamento } from '../lancamentos/lancamento.models';
import { resumo, sumValores } from '../lancamentos/lancamento-stats';
import { Compromisso, Meta, Orcamento, Recorrencia } from './data-access/planejamento.models';

/** A partir de quanto do orçamento o status vira alerta (mesmo valor do bot). */
export const ALERTA_ORCAMENTO = 80;

export type StatusOrcamento = 'ok' | 'alerta' | 'estourado';

export interface SituacaoOrcamento {
  gasto: number;
  restante: number;
  /** 0 a 100+ */
  percentual: number;
  status: StatusOrcamento;
}

/** Quanto do orçamento já foi usado, considerando as despesas do mês informadas. */
export function situacaoOrcamento(orcamento: Orcamento, despesasDoMes: readonly Lancamento[]): SituacaoOrcamento {
  const gasto = sumValores(despesasDoMes.filter((d) => d.tipo === 'despesa' && d.categoriaId === orcamento.categoriaId));
  const percentual = orcamento.valorLimite > 0 ? (gasto / orcamento.valorLimite) * 100 : 0;
  return {
    gasto,
    restante: Math.round((orcamento.valorLimite - gasto) * 100) / 100,
    percentual,
    status: percentual > 100 ? 'estourado' : percentual >= ALERTA_ORCAMENTO ? 'alerta' : 'ok',
  };
}

export type SituacaoConta = 'paga' | 'atrasada' | 'hoje' | 'semana' | 'depois';

/** Classifica a conta para agrupar na tela. */
export function situacaoConta(conta: Compromisso, hoje: Date): SituacaoConta {
  if (conta.pagoEm) {
    return 'paga';
  }
  const dia = inicioDoDia(hoje).getTime();
  const vencimento = inicioDoDia(conta.vencimento).getTime();
  if (vencimento < dia) {
    return 'atrasada';
  }
  if (vencimento === dia) {
    return 'hoje';
  }
  return vencimento - dia <= 7 * DIA_MS ? 'semana' : 'depois';
}

export interface Projecao {
  /** Saldo do mês até agora (entradas - saídas já lançadas). */
  atual: number;
  /** O que ainda deve entrar este mês (recorrências e contas a receber). */
  aEntrar: number;
  /** O que ainda deve sair este mês (recorrências e contas a pagar, inclusive atrasadas). */
  aSair: number;
  /** Saldo esperado no fim do mês. */
  projetado: number;
}

/**
 * Saldo projetado para o fim do mês de `hoje`: o que já foi lançado mais as recorrências
 * que ainda vão gerar lançamento neste mês e as contas em aberto que vencem até o fim do mês.
 */
export function projecaoDoMes(
  lancamentos: readonly Lancamento[],
  recorrencias: readonly Recorrencia[],
  contas: readonly Compromisso[],
  hoje: Date,
): Projecao {
  const mes = monthKey(hoje);
  const atual = resumo(lancamentos.filter((l) => monthKey(l.data) === mes)).saldo;

  const pendentes = [
    ...recorrencias
      .filter((r) => r.ativa && r.proximaData && monthKey(r.proximaData) === mes)
      .map((r) => ({ tipo: r.tipo, valor: r.valor })),
    ...contas
      .filter((c) => !c.pagoEm && monthKey(c.vencimento) <= mes)
      .map((c) => ({ tipo: c.tipo, valor: c.valor })),
  ];
  const aEntrar = sumValores(pendentes.filter((p) => p.tipo === 'receita'));
  const aSair = sumValores(pendentes.filter((p) => p.tipo === 'despesa'));

  return { atual, aEntrar, aSair, projetado: Math.round((atual + aEntrar - aSair) * 100) / 100 };
}

export interface PlanoMeta {
  percentual: number;
  falta: number;
  concluida: boolean;
  /** Meses até o prazo (mínimo 1), ou null sem prazo. */
  mesesRestantes: number | null;
  /** Quanto guardar por mês para chegar no prazo, ou null sem prazo. */
  porMes: number | null;
  prazoVencido: boolean;
}

export function planoMeta(meta: Meta, hoje: Date): PlanoMeta {
  const falta = Math.max(0, Math.round((meta.valorAlvo - meta.valorGuardado) * 100) / 100);
  const concluida = falta === 0;
  const percentual = meta.valorAlvo > 0 ? Math.min(100, (meta.valorGuardado / meta.valorAlvo) * 100) : 0;

  if (!meta.prazo) {
    return { percentual, falta, concluida, mesesRestantes: null, porMes: null, prazoVencido: false };
  }
  const meses =
    (meta.prazo.getFullYear() - hoje.getFullYear()) * 12 + (meta.prazo.getMonth() - hoje.getMonth());
  const prazoVencido = inicioDoDia(meta.prazo) < inicioDoDia(hoje);
  const mesesRestantes = Math.max(1, meses);
  return {
    percentual,
    falta,
    concluida,
    mesesRestantes,
    porMes: concluida ? 0 : Math.ceil((falta / mesesRestantes) * 100) / 100,
    prazoVencido: prazoVencido && !concluida,
  };
}

const DIA_MS = 24 * 60 * 60 * 1000;

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}
