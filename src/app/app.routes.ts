import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guards';

/** Extrato, Entradas e Despesas usam a mesma tela; o `data.tipo` da rota define o filtro. */
const loadLancamentoList = () =>
  import('./features/lancamentos/pages/lancamento-list/lancamento-list').then((m) => m.LancamentoList);

export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar · Nick Finance',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'cadastro',
    title: 'Criar conta · Nick Finance',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Visão geral · Nick Finance',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'extrato',
        title: 'Extrato · Nick Finance',
        data: { tipo: 'todos' },
        loadComponent: loadLancamentoList,
      },
      {
        path: 'entradas',
        title: 'Entradas · Nick Finance',
        data: { tipo: 'receita' },
        loadComponent: loadLancamentoList,
      },
      {
        path: 'despesas',
        title: 'Despesas · Nick Finance',
        data: { tipo: 'despesa' },
        loadComponent: loadLancamentoList,
      },
      {
        path: 'categorias',
        title: 'Categorias · Nick Finance',
        loadComponent: () =>
          import('./features/categorias/pages/categorias-page/categorias-page').then((m) => m.CategoriasPage),
      },
      {
        path: 'orcamentos',
        title: 'Orçamentos · Nick Finance',
        loadComponent: () =>
          import('./features/planejamento/orcamentos/orcamentos-page').then((m) => m.OrcamentosPage),
      },
      {
        path: 'recorrentes',
        title: 'Recorrentes · Nick Finance',
        loadComponent: () =>
          import('./features/planejamento/recorrentes/recorrentes-page').then((m) => m.RecorrentesPage),
      },
      {
        path: 'contas',
        title: 'Contas · Nick Finance',
        loadComponent: () => import('./features/planejamento/contas/contas-page').then((m) => m.ContasPage),
      },
      {
        path: 'metas',
        title: 'Metas · Nick Finance',
        loadComponent: () => import('./features/planejamento/metas/metas-page').then((m) => m.MetasPage),
      },
      {
        path: 'telegram',
        title: 'Telegram · Nick Finance',
        loadComponent: () => import('./features/telegram/telegram-page').then((m) => m.TelegramPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
