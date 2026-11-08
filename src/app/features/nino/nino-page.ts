import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { httpErrorMessage } from '../../core/http/http-error';
import { Icon, IconName } from '../../shared/ui/icon/icon';
import { MensagemNino, NinoApi, StatusNino } from './data-access/nino.api';
import { NinoAvatar } from './nino-avatar';

const TAMANHO_MAXIMO = 1000;

/** Conversa com o Nick. O histórico vive só nesta tela e some ao sair dela. */
@Component({
  selector: 'app-nino-page',
  imports: [NgTemplateOutlet, Icon, NinoAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nino-page.html',
  styleUrl: './nino-page.scss',
})
export class NinoPage implements OnInit {
  private readonly api = inject(NinoApi);
  private readonly usuario = inject(AuthService).user;
  private readonly injector = inject(Injector);
  private readonly lista = viewChild<ElementRef<HTMLElement>>('lista');

  protected readonly tamanhoMaximo = TAMANHO_MAXIMO;
  protected readonly sugestoes: { texto: string; icone: IconName }[] = [
    { texto: 'Quanto gastei este mês?', icone: 'receipt' },
    { texto: 'Em qual categoria gastei mais?', icone: 'pieChart' },
    { texto: 'Quanto foi no cartão de crédito?', icone: 'creditCard' },
    { texto: 'Tenho contas para pagar?', icone: 'calendar' },
  ];

  protected readonly status = signal<StatusNino | null>(null);
  protected readonly carregandoStatus = signal(true);
  protected readonly mensagens = signal<MensagemNino[]>([]);
  protected readonly texto = signal('');
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly saudacao = computed(() => {
    const nome = this.usuario()?.nome;
    return nome ? `Oi, ${nome}. Como posso ajudar?` : 'Oi! Como posso ajudar?';
  });

  protected readonly semCota = computed(() => this.status()?.restantesHoje === 0);
  protected readonly podeEnviar = computed(
    () => !!this.texto().trim() && !this.enviando() && !this.semCota() && !!this.status()?.ativo,
  );

  ngOnInit(): void {
    this.api
      .status()
      .pipe(finalize(() => this.carregandoStatus.set(false)))
      .subscribe({
        next: (status) => this.status.set(status),
        error: (err: unknown) =>
          this.erro.set(httpErrorMessage(err, {}, 'Não foi possível falar com o Nick.')),
      });
  }

  protected digitar(evento: Event): void {
    this.texto.set((evento.target as HTMLTextAreaElement).value);
  }

  /** Enter envia; Shift+Enter quebra a linha. */
  protected aoTeclar(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      this.enviar();
    }
  }

  protected perguntar(sugestao: string): void {
    this.texto.set(sugestao);
    this.enviar();
  }

  protected enviar(): void {
    if (!this.podeEnviar()) {
      return;
    }
    const texto = this.texto().trim();
    const conversa: MensagemNino[] = [...this.mensagens(), { papel: 'user', texto }];

    this.mensagens.set(conversa);
    this.texto.set('');
    this.erro.set(null);
    this.enviando.set(true);
    this.rolarParaOFim();

    this.api
      .enviar(conversa)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: ({ resposta, restantesHoje }) => {
          this.mensagens.update((atuais) => [...atuais, { papel: 'assistant', texto: resposta }]);
          this.status.update((s) => (s ? { ...s, restantesHoje } : s));
          this.rolarParaOFim();
        },
        error: (err: unknown) => {
          // Devolve a pergunta ao campo para o usuário tentar de novo sem redigitar.
          this.mensagens.set(conversa.slice(0, -1));
          this.texto.set(texto);
          this.erro.set(
            httpErrorMessage(
              err,
              {
                429: 'O Nick já correu demais por hoje. Amanhã ele volta com mais fôlego.',
                503: 'O Nick saiu para passear por um instante. Tente de novo em alguns segundos.',
              },
              'Não foi possível enviar a mensagem.',
            ),
          );
        },
      });
  }

  protected limpar(): void {
    this.mensagens.set([]);
    this.erro.set(null);
  }

  private rolarParaOFim(): void {
    afterNextRender(
      () => {
        const elemento = this.lista()?.nativeElement;
        if (elemento) {
          elemento.scrollTop = elemento.scrollHeight;
        }
      },
      { injector: this.injector },
    );
  }
}
