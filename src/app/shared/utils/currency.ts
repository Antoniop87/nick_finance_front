/** Máximo de dígitos aceitos (99.999.999.999,99). */
export const MAX_CURRENCY_DIGITS = 13;

const formatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formata um valor como `1.234,56` (sem o símbolo da moeda). */
export function formatCurrencyValue(value: number): string {
  return formatter.format(value);
}

/**
 * Interpreta o texto digitado como centavos, no estilo "caixa eletrônico":
 * `1` → 0,01 · `123` → 1,23 · `123456` → 1.234,56.
 * Retorna `null` se não houver dígitos.
 */
export function parseCurrencyDigits(text: string): number | null {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '').slice(0, MAX_CURRENCY_DIGITS);
  return digits ? Number(digits) / 100 : null;
}

const compactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Formato curto para eixos e rótulos de gráfico: `R$ 5,2 mil`, `R$ 1,3 mi`. */
export function formatCompactCurrency(value: number): string {
  return compactFormatter.format(value);
}

/**
 * Arredonda `max` para cima até um valor "redondo" divisível em `steps` partes
 * (1; 1,5; 2; 2,5; 3; 4; 5; 6 ou 8 × 10ⁿ por passo), para escalas de gráfico legíveis.
 */
export function niceScaleMax(max: number, steps: number): number {
  if (max <= 0) {
    return steps;
  }
  const rawStep = max / steps;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * magnitude).find((s) => s >= rawStep)!;
  return step * steps;
}
