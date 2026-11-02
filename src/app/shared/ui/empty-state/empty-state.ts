import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon, IconName } from '../icon/icon';

@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty__ring">
      <div class="empty__icon"><app-icon [name]="icon()" [size]="24" /></div>
    </div>
    <p class="empty__title">{{ title() }}</p>
    @if (description()) {
      <p class="empty__description">{{ description() }}</p>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 48px 16px;
      text-align: center;
    }

    .empty__ring {
      display: grid;
      place-items: center;
      width: 84px;
      height: 84px;
      margin-bottom: 10px;
      border: 1px dashed var(--border-strong);
      border-radius: 50%;
    }

    .empty__icon {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--primary-soft);
      color: var(--primary);
    }

    .empty__title {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 700;
    }

    .empty__description {
      max-width: 360px;
      margin: 0 0 14px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
  `,
})
export class EmptyState {
  readonly icon = input<IconName>('inbox');
  readonly title = input.required<string>();
  readonly description = input<string>();
}
