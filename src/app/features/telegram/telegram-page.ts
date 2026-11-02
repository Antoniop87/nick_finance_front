import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, filter, finalize, interval, switchMap, take } from 'rxjs';

import { httpErrorMessage } from '../../core/http/http-error';
import { Icon } from '../../shared/ui/icon/icon';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { TelegramApi } from './data-access/telegram.api';
import { TelegramCodigo, TelegramStatus } from './data-access/telegram.models';

/** Intervalo de verificação enquanto o usuário conecta pelo Telegram. */
const POLL_MS = 3000;

interface Exemplo {
  mensagem: string;
  resultado: string;
  tipo: 'receita' | 'despesa';
}

/** Conecta a conta ao bot do Telegram e explica como registrar lançamentos por mensagem. */
@Component({
  selector: 'app-telegram-page',
  imports: [DatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './telegram-page.html',
  styleUrl: './telegram-page.scss',
})
export class TelegramPage implements OnInit {
  private readonly api = inject(TelegramApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly status = signal<TelegramStatus | null>(null);
  protected readonly codigo = signal<TelegramCodigo | null>(null);
  protected readonly loading = signal(true);
  protected readonly gerando = signal(false);
  protected readonly desvinculando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly agora = signal(Date.now());

  /** Segundos até o código expirar. */
  protected readonly segundosRestantes = computed(() => {
    const codigo = this.codigo();
    return codigo ? Math.max(0, Math.round((Date.parse(codigo.expiraEm) - this.agora()) / 1000)) : 0;
  });
  protected readonly expirado = computed(() => !!this.codigo() && this.segundosRestantes() === 0);
  protected readonly tempoRestante = computed(() => {
    const total = this.segundosRestantes();
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  });

  protected readonly exemplos: Exemplo[] = [
    { mensagem: 'gastei 45,90 com almoço no Restaurante Sabor', resultado: 'Despesa · R$ 45,90', tipo: 'despesa' },
    { mensagem: 'recebi 5200 de salário da Empresa X', resultado: 'Entrada · R$ 5.200,00', tipo: 'receita' },
    { mensagem: 'uber 32,40 ontem', resultado: 'Despesa · data de ontem', tipo: 'despesa' },
    { mensagem: '+150 venda 05/10', resultado: 'Entrada · em 05/10', tipo: 'receita' },
  ];

  private polling?: Subscription;

  ngOnInit(): void {
    this.carregarStatus();
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.agora.set(Date.now()));
  }

  protected gerarCodigo(): void {
    this.gerando.set(true);
    this.error.set(null);
    this.api
      .gerarCodigo()
      .pipe(finalize(() => this.gerando.set(false)))
      .subscribe({
        next: (codigo) => {
          this.codigo.set(codigo);
          this.aguardarVinculo();
        },
        error: (err: unknown) => this.error.set(httpErrorMessage(err, {}, 'Não foi possível gerar o código.')),
      });
  }

  protected async copiarCodigo(): Promise<void> {
    const codigo = this.codigo();
    if (!codigo) {
      return;
    }
    try {
      await navigator.clipboard.writeText(`/vincular ${codigo.codigo}`);
      this.toast.success('Comando copiado. Cole no chat do bot.');
    } catch {
      this.toast.error('Não foi possível copiar. Selecione o código manualmente.');
    }
  }

  protected desvincular(): void {
    this.desvinculando.set(true);
    this.api
      .desvincular()
      .pipe(finalize(() => this.desvinculando.set(false)))
      .subscribe({
        next: () => {
          this.toast.info('Telegram desconectado.');
          this.codigo.set(null);
          this.carregarStatus();
        },
        error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível desconectar.')),
      });
  }

  private carregarStatus(): void {
    this.loading.set(true);
    this.api
      .status()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (status) => this.status.set(status),
        error: (err: unknown) => this.error.set(httpErrorMessage(err, {}, 'Não foi possível carregar a integração.')),
      });
  }

  /** Consulta o status até a conta ser vinculada no Telegram ou o código expirar. */
  private aguardarVinculo(): void {
    this.polling?.unsubscribe();
    this.polling = interval(POLL_MS)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.api.status()),
        filter((status) => status.vinculado || this.expirado()),
        take(1),
      )
      .subscribe((status) => {
        this.status.set(status);
        if (status.vinculado) {
          this.codigo.set(null);
          this.toast.success('Telegram conectado! Já pode mandar seus lançamentos.');
        }
      });
  }
}
