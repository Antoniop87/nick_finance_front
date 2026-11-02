import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Icon, IconName } from '../icon/icon';
import { ToastService, ToastType } from './toast.service';

const ICON_BY_TYPE: Record<ToastType, IconName> = {
  success: 'check',
  error: 'alert',
  info: 'alert',
};

@Component({
  selector: 'app-toast-container',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div [class]="'toast toast--' + toast.type" role="status">
          <app-icon [name]="icons[toast.type]" />
          <span class="toast__message">{{ toast.message }}</span>
          <button
            type="button"
            class="btn-icon"
            aria-label="Fechar notificação"
            (click)="toastService.dismiss(toast.id)"
          >
            <app-icon name="close" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: min(400px, calc(100vw - 32px));
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 12px 12px 14px;
      border: 1px solid var(--border);
      border-left: 4px solid var(--info);
      border-radius: var(--radius);
      background: var(--surface);
      box-shadow: var(--shadow-lg);
      color: var(--text);
      font-size: 0.9rem;
      font-weight: 500;
      animation: toast-in 0.25s var(--ease);
    }

    .toast--success { border-left-color: var(--success); }
    .toast--success app-icon { color: var(--success); }
    .toast--error { border-left-color: var(--danger); }
    .toast--error app-icon { color: var(--danger); }
    .toast--info app-icon { color: var(--info); }

    .toast__message {
      flex: 1;
    }

    @keyframes toast-in {
      from { opacity: 0; transform: translateX(16px); }
      to { opacity: 1; transform: none; }
    }
  `,
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
  protected readonly icons = ICON_BY_TYPE;
}
