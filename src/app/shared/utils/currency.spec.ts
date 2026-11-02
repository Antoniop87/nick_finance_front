import { formatCurrencyValue, niceScaleMax, parseCurrencyDigits } from './currency';

describe('currency utils', () => {
  it('interpreta os dígitos como centavos', () => {
    expect(parseCurrencyDigits('1')).toBe(0.01);
    expect(parseCurrencyDigits('123')).toBe(1.23);
    expect(parseCurrencyDigits('1.234,56')).toBe(1234.56);
  });

  it('ignora zeros à esquerda e retorna null sem dígitos', () => {
    expect(parseCurrencyDigits('0,05')).toBe(0.05);
    expect(parseCurrencyDigits('')).toBeNull();
    expect(parseCurrencyDigits('0,00')).toBeNull();
  });

  it('limita a quantidade de dígitos', () => {
    expect(parseCurrencyDigits('99999999999999999')).toBe(99999999999.99);
  });

  it('formata com separador de milhar e vírgula decimal', () => {
    expect(formatCurrencyValue(1234567.8)).toBe('1.234.567,80');
    expect(formatCurrencyValue(0.5)).toBe('0,50');
  });
});

describe('niceScaleMax', () => {
  it('arredonda para uma escala legível', () => {
    expect(niceScaleMax(5200, 4)).toBe(6000);
    expect(niceScaleMax(682.75, 4)).toBe(800);
    expect(niceScaleMax(0, 4)).toBe(4);
  });
});
