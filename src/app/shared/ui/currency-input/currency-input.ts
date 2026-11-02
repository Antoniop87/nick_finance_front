import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { formatCurrencyValue, parseCurrencyDigits } from '../../utils/currency';

/**
 * Máscara de moeda para inputs de formulário reativo.
 * Exibe `1.234,56` enquanto o usuário digita, mas o valor do controle é um
 * `number` (1234.56) ou `null` quando vazio.
 *
 * Uso: `<input appCurrencyInput formControlName="valor" />`
 */
@Directive({
  selector: 'input[appCurrencyInput]',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CurrencyInput), multi: true },
  ],
  host: {
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    '(input)': 'onInput()',
    '(blur)': 'onTouched()',
  },
})
export class CurrencyInput implements ControlValueAccessor {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private onChange: (value: number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.input.value = value == null ? '' : formatCurrencyValue(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.input.disabled = disabled;
  }

  protected onInput(): void {
    const value = parseCurrencyDigits(this.input.value);
    this.input.value = value == null ? '' : formatCurrencyValue(value);
    this.onChange(value);
  }
}
