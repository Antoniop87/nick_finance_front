import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { IconName } from '../../../../shared/ui/icon/icon';
import { Modal } from '../../../../shared/ui/modal/modal';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Lancamento, TIPO_INFO, TipoLancamento } from '../../lancamento.models';
import { LancamentoForm } from '../lancamento-form/lancamento-form';

/**
 * Modal de lançamento, reutilizado em várias telas.
 * - `lancamento`: edita esse lançamento;
 * - `tipo`: cria um lançamento desse tipo;
 * - nenhum dos dois: o usuário escolhe entre entrada e despesa.
 */
@Component({
  selector: 'app-lancamento-dialog',
  imports: [Modal, LancamentoForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [title]="title()"
      [subtitle]="subtitle()"
      [icon]="icon()"
      [tone]="tipoEfetivo() === 'despesa' ? 'danger' : tipoEfetivo() === 'receita' ? 'success' : 'info'"
      (closed)="closed.emit()"
    >
      <app-lancamento-form
        [tipo]="tipoEfetivo() ?? 'despesa'"
        [allowTipoChange]="tipoEfetivo() === null"
        [lancamento]="lancamento()"
        (saved)="onSaved($event)"
        (cancelled)="closed.emit()"
      />
    </app-modal>
  `,
})
export class LancamentoDialog {
  private readonly toast = inject(ToastService);

  readonly tipo = input<TipoLancamento | null>(null);
  readonly lancamento = input<Lancamento | null>(null);
  readonly closed = output<void>();

  protected readonly tipoEfetivo = computed(() => this.lancamento()?.tipo ?? this.tipo());

  protected readonly title = computed(() => {
    const tipo = this.tipoEfetivo();
    if (!tipo) {
      return 'Novo lançamento';
    }
    const nome = TIPO_INFO[tipo].singular.toLowerCase();
    return this.lancamento() ? `Editar ${nome}` : `Nova ${nome}`;
  });

  protected readonly subtitle = computed(() => {
    if (this.lancamento()) {
      return 'Altere o que precisar e salve.';
    }
    const tipo = this.tipoEfetivo();
    if (tipo === 'receita') {
      return 'Registre um dinheiro que entrou na sua conta.';
    }
    return tipo === 'despesa' ? 'Registre um gasto que saiu da sua conta.' : 'Registre uma entrada ou uma despesa.';
  });

  protected readonly icon = computed<IconName>(() => {
    if (this.lancamento()) {
      return 'pencil';
    }
    const tipo = this.tipoEfetivo();
    return tipo === 'receita' ? 'arrowUpRight' : tipo === 'despesa' ? 'arrowDownRight' : 'receipt';
  });

  protected onSaved(tipo: TipoLancamento): void {
    const nome = TIPO_INFO[tipo].singular;
    this.toast.success(this.lancamento() ? `${nome} atualizada.` : `${nome} registrada.`);
    this.closed.emit();
  }
}
