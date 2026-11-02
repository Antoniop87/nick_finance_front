const pad = (value: number): string => String(value).padStart(2, '0');

/** Formata uma data local como `yyyy-MM-dd` (formato aceito pela API e por `<input type="date">`). */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Converte a data vinda da API em uma data local.
 *
 * A API devolve algo como `2025-03-10T00:00:00.000+00:00`. Usar `new Date()`
 * direto jogaria a data para o dia anterior no fuso do Brasil, então
 * consideramos apenas a parte `yyyy-MM-dd`.
 */
export function parseApiDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Chave de mês no formato `yyyy-MM`, usada para agrupar e filtrar. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** Primeiro dia do mês da chave `yyyy-MM`. */
export function monthKeyToDate(key: string): Date {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/** Desloca uma data em `months` meses, sempre retornando o dia 1. */
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}
