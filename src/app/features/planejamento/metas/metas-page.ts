import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { httpErrorMessage } from '../../../core/http/http-error';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Icon, IconName, isIconName } from '../../../shared/ui/icon/icon';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { sumValores } from '../../lancamentos/lancamento-stats';
import { Meta } from '../data-access/planejamento.models';
import { MetaStore } from '../data-access/planejamento.stores';
import { planoMeta } from '../planejamento-calculos';
import { MetaDialog, MovimentoDialog } from './meta-dialogs';

@Component({
  selector: 'app-metas-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, Icon, EmptyState, MetaDialog, MovimentoDialog, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metas-page.html',
  styleUrls: ['../planejamento-page.scss', './metas-page.scss'],
})
export class MetasPage implements OnInit {
  protected readonly store = inject(MetaStore);
  private readonly toast = inject(ToastService);

  private readonly hoje = new Date();

  protected readonly cartoes = computed(() =>
    this.store.items().map((meta) => ({ meta, plano: planoMeta(meta, this.hoje), icone: icone(meta) })),
  );

  protected readonly totais = computed(() => ({
    guardado: sumValores(this.store.items().map((m) => ({ valor: m.valorGuardado }))),
    alvo: sumValores(this.store.items().map((m) => ({ valor: m.valorAlvo }))),
    concluidas: this.cartoes().filter((c) => c.plano.concluida).length,
  }));

  protected readonly nova = signal(false);
  protected readonly emEdicao = signal<Meta | null>(null);
  protected readonly movimento = signal<{ meta: Meta; retirar: boolean } | null>(null);
  protected readonly paraExcluir = signal<Meta | null>(null);
  protected readonly excluindo = signal(false);

  ngOnInit(): void {
    this.store.load();
  }

  protected corDeFundo(cor: string): string {
    return `color-mix(in srgb, ${cor} 15%, transparent)`;
  }

  protected excluir(meta: Meta): void {
    this.excluindo.set(true);
    this.store
      .remove(meta.id)
      .pipe(finalize(() => this.excluindo.set(false)))
      .subscribe({
        next: () => {
          this.paraExcluir.set(null);
          this.toast.success('Meta excluída.');
        },
        error: (err: unknown) => this.toast.error(httpErrorMessage(err, {}, 'Não foi possível excluir.')),
      });
  }
}

function icone(meta: Meta): IconName {
  return isIconName(meta.icone) ? meta.icone : 'target';
}
