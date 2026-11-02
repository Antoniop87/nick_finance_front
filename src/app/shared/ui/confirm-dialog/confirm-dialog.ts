import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Modal } from '../modal/modal';

/** Confirmação para ações destrutivas (excluir). Quem usa controla abertura e o estado `busy`. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="title()" icon="trash" tone="danger" (closed)="cancelled.emit()">
      <p class="message">{{ message() }}</p>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" (click)="cancelled.emit()">Cancelar</button>
        <button type="button" class="btn btn-danger" [disabled]="busy()" (click)="confirmed.emit()">
          @if (busy()) {
            <span class="spinner"></span>
          }
          {{ confirmLabel() }}
        </button>
      </div>
    </app-modal>
  `,
  styles: `
    .message {
      margin: 0 0 6px;
      color: var(--text-muted);
    }
  `,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Excluir');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
