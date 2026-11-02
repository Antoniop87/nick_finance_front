import { addMonths, monthKey, monthKeyToDate, parseApiDate, toIsoDate } from './date';

describe('date utils', () => {
  it('parseApiDate ignora o fuso e mantém o dia informado', () => {
    const date = parseApiDate('2025-03-10T00:00:00.000+00:00');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(10);
  });

  it('toIsoDate formata com zeros à esquerda', () => {
    expect(toIsoDate(new Date(2025, 0, 5))).toBe('2025-01-05');
  });

  it('monthKey e monthKeyToDate são inversos', () => {
    const key = monthKey(new Date(2024, 11, 31));
    expect(key).toBe('2024-12');
    expect(monthKeyToDate(key)).toEqual(new Date(2024, 11, 1));
  });

  it('addMonths atravessa a virada de ano', () => {
    expect(addMonths(new Date(2025, 0, 20), -1)).toEqual(new Date(2024, 11, 1));
  });
});
