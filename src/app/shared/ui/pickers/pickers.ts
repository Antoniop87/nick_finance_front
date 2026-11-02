import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ICONES_ESCOLHIVEIS, Icon, IconName } from '../icon/icon';

/** Paleta oferecida para categorias e metas. */
export const CORES_ESCOLHIVEIS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b',
];

/** Base dos seletores: guarda o valor e repassa ao formulário reativo. */
abstract class PickerBase implements ControlValueAccessor {
  protected readonly value = signal<string | null>(null);
  protected readonly disabled = signal(false);
  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected select(value: string): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}

/** Grade de ícones. Uso: `<app-icon-picker formControlName="icone" [color]="cor" />`. */
@Component({
  selector: 'app-icon-picker',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IconPicker), multi: true }],
  template: `
    <div class="grid" role="radiogroup" aria-label="Ícone">
      @for (icone of icones; track icone) {
        <button
          type="button"
          role="radio"
          class="option"
          [class.option--active]="value() === icone"
          [attr.aria-checked]="value() === icone"
          [attr.aria-label]="icone"
          [disabled]="disabled()"
          [style.color]="value() === icone ? color() : null"
          (click)="select(icone)"
        >
          <app-icon [name]="icone" [size]="18" />
        </button>
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 6px;
    }

    .option {
      display: grid;
      place-items: center;
      height: 40px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface);
      color: var(--text-muted);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;

      &:hover {
        background: var(--surface-hover);
      }

      &--active {
        border-color: currentColor;
        background: var(--surface-hover);
        box-shadow: 0 0 0 1px currentColor;
      }
    }
  `,
})
export class IconPicker extends PickerBase {
  readonly color = input<string>('var(--primary)');
  protected readonly icones: IconName[] = ICONES_ESCOLHIVEIS;
}

/** Paleta de cores. Uso: `<app-color-picker formControlName="cor" />`. */
@Component({
  selector: 'app-color-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ColorPicker), multi: true }],
  template: `
    <div class="swatches" role="radiogroup" aria-label="Cor">
      @for (cor of cores; track cor) {
        <button
          type="button"
          role="radio"
          class="swatch"
          [class.swatch--active]="value() === cor"
          [attr.aria-checked]="value() === cor"
          [attr.aria-label]="cor"
          [disabled]="disabled()"
          [style.background]="cor"
          [style.color]="cor"
          (click)="select(cor)"
        ></button>
      }
    </div>
  `,
  styles: `
    .swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .swatch {
      width: 28px;
      height: 28px;
      padding: 0;
      border: 2px solid var(--surface);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 0 1px var(--border);
      transition: transform 0.15s;

      &:hover {
        transform: scale(1.1);
      }

      &--active {
        box-shadow: 0 0 0 2px currentColor;
      }
    }
  `,
})
export class ColorPicker extends PickerBase {
  protected readonly cores = CORES_ESCOLHIVEIS;
}
