import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Icon, IconName, isIconName } from '../../../../shared/ui/icon/icon';
import { Categoria } from '../../data-access/categoria.models';

/**
 * Ícone colorido da categoria, com ou sem o nome ao lado.
 * Sem categoria, mostra um ícone neutro.
 */
@Component({
  selector: 'app-categoria-badge',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="badge__icon"
      [class.badge__icon--sm]="size() === 'sm'"
      [style.color]="cor()"
      [style.background]="fundo()"
      [attr.title]="categoria()?.nome ?? 'Sem categoria'"
    >
      <app-icon [name]="icone()" [size]="size() === 'sm' ? 14 : 18" />
    </span>
    @if (showName()) {
      <span class="badge__name truncate">{{ categoria()?.nome ?? 'Sem categoria' }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .badge__icon {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 11px;

      &--sm {
        width: 26px;
        height: 26px;
        border-radius: 8px;
      }
    }

    .badge__name {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
  `,
})
export class CategoriaBadge {
  readonly categoria = input<Categoria | null | undefined>(null);
  readonly showName = input(false);
  readonly size = input<'sm' | 'md'>('md');

  protected readonly icone = computed<IconName>(() => {
    const icone = this.categoria()?.icone;
    return icone && isIconName(icone) ? icone : 'tag';
  });
  protected readonly cor = computed(() => this.categoria()?.cor ?? 'var(--text-subtle)');
  protected readonly fundo = computed(() => {
    const cor = this.categoria()?.cor;
    return cor ? `color-mix(in srgb, ${cor} 15%, transparent)` : 'var(--surface-hover)';
  });
}
