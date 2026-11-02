import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Valida que dois campos do grupo têm o mesmo valor (ex.: senha e confirmação). */
export function matchFields(field: string, confirmation: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const value = group.get(field)?.value;
    const confirmationValue = group.get(confirmation)?.value;
    return value === confirmationValue ? null : { fieldsMismatch: true };
  };
}

/** Rejeita datas futuras em campos `yyyy-MM-dd`. */
export function notInFuture(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const [year, month, day] = control.value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getTime() > Date.now() ? { futureDate: true } : null;
}
