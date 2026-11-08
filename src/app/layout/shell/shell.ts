import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { Icon, IconName } from '../../shared/ui/icon/icon';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/** Layout da área logada: menu lateral, barra superior (mobile) e conteúdo. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  protected readonly navSections: NavSection[] = [
    {
      title: 'Geral',
      items: [
        { label: 'Visão geral', path: '/dashboard', icon: 'dashboard' },
        { label: 'Nino', path: '/nino', icon: 'messageCircle' },
      ],
    },
    {
      title: 'Movimentações',
      items: [
        { label: 'Extrato', path: '/extrato', icon: 'receipt' },
        { label: 'Entradas', path: '/entradas', icon: 'arrowUpRight' },
        { label: 'Despesas', path: '/despesas', icon: 'arrowDownRight' },
        { label: 'Categorias', path: '/categorias', icon: 'tag' },
      ],
    },
    {
      title: 'Planejamento',
      items: [
        { label: 'Orçamentos', path: '/orcamentos', icon: 'pieChart' },
        { label: 'Recorrentes', path: '/recorrentes', icon: 'repeat' },
        { label: 'Contas', path: '/contas', icon: 'calendar' },
        { label: 'Metas', path: '/metas', icon: 'target' },
      ],
    },
    {
      title: 'Integrações',
      items: [{ label: 'Telegram', path: '/telegram', icon: 'send' }],
    },
  ];

  protected readonly menuOpen = signal(false);
  protected readonly user = this.auth.user;
  protected readonly initials = computed(() => {
    const user = this.user();
    return user ? `${user.nome.charAt(0)}${user.sobrenome.charAt(0)}`.toUpperCase() : '';
  });
  protected readonly isDark = computed(() => this.themeService.theme() === 'dark');

  protected logout(): void {
    this.auth.logout();
  }
}
