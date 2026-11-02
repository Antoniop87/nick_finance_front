import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Icon, IconName } from '../icon/icon';

export type ModalTone = 'success' | 'danger' | 'info' | 'warning';

/**
 * Janela modal simples. O conteúdo é projetado; quem usa controla a abertura
 * renderizando o componente com `@if`.
 */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="backdrop" (click)="closed.emit()"></div>
    <section class="modal" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <header class="modal__header">
        @if (icon(); as icon) {
          <span [class]="'chip-icon chip-icon--' + tone()"><app-icon [name]="icon" /></span>
        }
        <div class="modal__titles">
          <h2>{{ title() }}</h2>
          @if (subtitle()) {
            <p>{{ subtitle() }}</p>
          }
        </div>
        <button type="button" class="btn-icon" aria-label="Fechar" (click)="closed.emit()">
          <app-icon name="close" />
        </button>
      </header>
      <ng-content />
    </section>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 900;
      display: grid;
      place-items: center;
      padding: 16px;
    }

    .backdrop {
      position: absolute;
      inset: 0;
      background: rgb(8 12 22 / 0.55);
      backdrop-filter: blur(4px);
      animation: fade-in 0.2s ease-out;
    }

    .modal {
      position: relative;
      width: min(520px, 100%);
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      padding: 26px;
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      background: var(--surface);
      box-shadow: var(--shadow-lg);
      animation: modal-in 0.22s var(--ease);
    }

    .modal__header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 22px;

      > .btn-icon {
        margin: -4px -6px 0 auto;
      }
    }

    .modal__titles {
      h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
      }

      p {
        margin: 4px 0 0;
        color: var(--text-muted);
        font-size: 0.875rem;
      }
    }

    @keyframes fade-in {
      from { opacity: 0; }
    }

    @keyframes modal-in {
      from { opacity: 0; transform: scale(0.97) translateY(6px); }
      to { opacity: 1; transform: none; }
    }
  `,
})
export class Modal {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  /** Ícone opcional exibido ao lado do título. */
  readonly icon = input<IconName>();
  readonly tone = input<ModalTone>('info');
  readonly closed = output<void>();
}
