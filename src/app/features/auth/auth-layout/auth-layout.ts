import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '../../../shared/ui/icon/icon';

/** Moldura comum das telas de login e cadastro. */
@Component({
  selector: 'app-auth-layout',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();

  /** Alturas (%) das barras da ilustração. */
  protected readonly bars = [38, 55, 42, 70, 58, 86];
}
