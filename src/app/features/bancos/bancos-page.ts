import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgZone, OnInit, computed, inject, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';

import { infoFormaPagamento } from '../../core/models/forma-pagamento';
import { fromApiTipo } from '../../core/models/tipo-lancamento';
import { httpErrorMessage } from '../../core/http/http-error';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '../../shared/ui/icon/icon';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { CategoriaStore } from '../categorias/data-access/categoria.store';
import { LancamentosFacade } from '../lancamentos/lancamentos.facade';
import { BancosApi } from './data-access/bancos.api';
import { BancosStatus, ConexaoBancaria, TransacaoBancaria } from './data-access/bancos.models';
import { abrirPluggyConnect } from './data-access/pluggy-connect';

type Tom = 'success' | 'warning' | 'danger' | 'muted';

/**
 * Conecta bancos pela Pluggy e mostra as transações que chegaram para o usuário
 * importar (vira lançamento) ou ignorar. Nada entra no extrato sem confirmação.
 */
@Component({
  selector: 'app-bancos-page',
  imports: [CurrencyPipe, DatePipe, Icon, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bancos-page.html',
  styleUrl: './bancos-page.scss',
})
export class BancosPage implements OnInit {
  private readonly api = inject(BancosApi);
  private readonly toast = inject(ToastService);
  private readonly zone = inject(NgZone);
  private readonly categoriaStore = inject(CategoriaStore);
  private readonly lancamentos = inject(LancamentosFacade);

  protected readonly status = signal<BancosStatus | null>(null);
  protected readonly transacoes = signal<TransacaoBancaria[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly conectando = signal(false);
  protected readonly sincronizando = signal<number | null>(null);
  protected readonly removendo = signal<ConexaoBancaria | null>(null);
  protected readonly removendoBusy = signal(false);
  protected readonly ocupadas = signal<ReadonlySet<number>>(new Set());
  protected readonly importandoTodas = signal(false);
  /** Categoria escolhida por transação; sem escolha, vale a sugerida. */
  private readonly escolhas = signal<ReadonlyMap<number, number | null>>(new Map());

  protected readonly temDuplicados = computed(() => this.transacoes().some((t) => t.possivelDuplicado));

  ngOnInit(): void {
    this.categoriaStore.load();
    this.carregar();
  }

  protected tipo(t: TransacaoBancaria) {
    return fromApiTipo(t.tipo);
  }

  protected forma(t: TransacaoBancaria) {
    return infoFormaPagamento(t.formaPagamento);
  }

  protected categoriasDe(t: TransacaoBancaria) {
    return this.categoriaStore.doTipo(fromApiTipo(t.tipo));
  }

  protected categoriaDe(t: TransacaoBancaria): number | null {
    const escolhas = this.escolhas();
    return escolhas.has(t.id) ? (escolhas.get(t.id) ?? null) : t.categoriaSugeridaId;
  }

  protected escolherCategoria(t: TransacaoBancaria, evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    const proximo = new Map(this.escolhas());
    proximo.set(t.id, valor ? Number(valor) : null);
    this.escolhas.set(proximo);
  }

  protected ocupada(t: TransacaoBancaria): boolean {
    return this.ocupadas().has(t.id);
  }

  protected situacao(c: ConexaoBancaria): { rotulo: string; tom: Tom } {
    switch (c.status) {
      case 'UPDATED':
        return { rotulo: 'Atualizado', tom: 'success' };
      case 'UPDATING':
      case 'CREATED':
        return { rotulo: 'Atualizando', tom: 'muted' };
      case 'LOGIN_ERROR':
        return { rotulo: 'Login inválido', tom: 'danger' };
      case 'WAITING_USER_INPUT':
        return { rotulo: 'Aguardando você', tom: 'warning' };
      case 'OUTDATED':
        return { rotulo: 'Desatualizado', tom: 'warning' };
      default:
        return { rotulo: 'Conectado', tom: 'muted' };
    }
  }

  protected conectar(): void {
    const status = this.status();
    if (!status) {
      return;
    }
    this.conectando.set(true);
    this.api.connectToken().subscribe({
      next: (connectToken) => {
        abrirPluggyConnect({
          connectToken,
          includeSandbox: status.incluirSandbox,
          // Os callbacks do widget rodam fora do Angular.
          onSuccess: ({ item }) => this.zone.run(() => this.registrar(item.id)),
          onError: () => this.zone.run(() => this.toast.error('Não foi possível conectar o banco.')),
          onClose: () => this.zone.run(() => this.conectando.set(false)),
        }).catch((err: Error) =>
          this.zone.run(() => {
            this.conectando.set(false);
            this.toast.error(err.message);
          }),
        );
      },
      error: (err: unknown) => {
        this.conectando.set(false);
        this.toast.error(httpErrorMessage(err, {}, 'Não foi possível iniciar a conexão.'));
      },
    });
  }

  protected sincronizar(c: ConexaoBancaria): void {
    this.sincronizando.set(c.id);
    this.api
      .sincronizar(c.id)
      .pipe(finalize(() => this.sincronizando.set(null)))
      .subscribe({
        next: (novas) => {
          this.toast.success(
            novas === 0 ? 'Nada novo por aqui.' : novas === 1 ? '1 transação nova para revisar.' : `${novas} transações novas para revisar.`,
          );
          this.carregar();
        },
        error: (err: unknown) => {
          this.toast.error(httpErrorMessage(err, {}, 'Não foi possível atualizar agora.'));
          this.carregar();
        },
      });
  }

  protected confirmarRemocao(): void {
    const conexao = this.removendo();
    if (!conexao) {
      return;
    }
    this.removendoBusy.set(true);
    this.api
      .remover(conexao.id)
      .pipe(finalize(() => this.removendoBusy.set(false)))
      .subscribe({
        next: () => {
          this.removendo.set(null);
          this.toast.info('Banco desconectado.');
          this.carregar();
        },
        error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível desconectar.')),
      });
  }

  protected importar(t: TransacaoBancaria): void {
    this.revisar(t, this.api.importar(t.id, this.categoriaDe(t)), true);
  }

  protected ignorar(t: TransacaoBancaria): void {
    this.revisar(t, this.api.ignorar(t.id), false);
  }

  protected importarTodas(): void {
    this.importandoTodas.set(true);
    this.api
      .importarTodas()
      .pipe(finalize(() => this.importandoTodas.set(false)))
      .subscribe({
        next: (quantidade) => {
          this.toast.success(quantidade === 1 ? '1 lançamento criado.' : `${quantidade} lançamentos criados.`);
          this.lancamentos.load(true);
          this.carregar();
        },
        error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível importar.')),
      });
  }

  private revisar(t: TransacaoBancaria, chamada: Observable<void>, importou: boolean): void {
    this.marcar(t.id, true);
    chamada.pipe(finalize(() => this.marcar(t.id, false))).subscribe({
      next: () => {
        this.transacoes.update((lista) => lista.filter((x) => x.id !== t.id));
        this.status.update((s) => (s ? { ...s, pendentes: Math.max(0, s.pendentes - 1) } : s));
        if (importou) {
          this.toast.success('Lançamento criado.');
          this.lancamentos.load(true);
        }
      },
      error: (err: unknown) => {
        this.toast.error(httpErrorMessage(err, {}, 'Não foi possível concluir.'));
        this.carregar();
      },
    });
  }

  private marcar(id: number, ocupada: boolean): void {
    const proximo = new Set(this.ocupadas());
    if (ocupada) {
      proximo.add(id);
    } else {
      proximo.delete(id);
    }
    this.ocupadas.set(proximo);
  }

  private registrar(itemId: string): void {
    this.conectando.set(true);
    this.toast.info('Banco conectado. Buscando suas transações...');
    this.api
      .conectar(itemId)
      .pipe(finalize(() => this.conectando.set(false)))
      .subscribe({
        next: () => this.carregar(),
        error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível registrar o banco.')),
      });
  }

  private carregar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.status().subscribe({
      next: (status) => {
        this.status.set(status);
        if (status.conexoes.length === 0) {
          this.transacoes.set([]);
          this.loading.set(false);
          return;
        }
        this.api
          .pendentes()
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: (lista) => this.transacoes.set(lista),
            error: (err: unknown) =>
              this.error.set(httpErrorMessage(err, {}, 'Não foi possível carregar as transações.')),
          });
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(httpErrorMessage(err, {}, 'Não foi possível carregar a integração.'));
      },
    });
  }
}
