import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Largura ÷ altura do desenho de corpo inteiro. */
const PROPORCAO_CORPO = 409 / 520;

/**
 * O Nick, mascote do chat. Corpo inteiro na tela inicial e só o rosto, num círculo,
 * nos tamanhos pequenos. O PNG é usado como máscara, pintada com --mascote:
 * branco no tema escuro e verde no claro. Dá pulinhos enquanto procura a resposta.
 */
@Component({
  selector: 'app-nino-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.pensando]': 'pensando()',
    '[class.circulo]': '!corpoInteiro()',
    '[style.height.px]': 'size()',
    '[style.width.px]': 'largura()',
  },
  template: `<span class="desenho" [style.mask-image]="mascara()" [style.-webkit-mask-image]="mascara()"></span>`,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
    }

    :host(.circulo) {
      overflow: hidden;
      border-radius: 50%;
      background: var(--primary-soft);
    }

    .desenho {
      display: block;
      width: 100%;
      height: 100%;
      background: var(--mascote);
      mask-position: center;
      mask-repeat: no-repeat;
      mask-size: contain;
      -webkit-mask-position: center;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-size: contain;
    }

    :host(.circulo) .desenho {
      width: 90%;
      height: 90%;
    }

    :host(.pensando) .desenho {
      animation: pulinho-nick 0.9s ease-in-out infinite;
    }

    @keyframes pulinho-nick {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-2px);
      }
    }
  `,
})
export class NinoAvatar {
  /** Altura em pixels. */
  readonly size = input(36);
  readonly corpoInteiro = input(false);
  readonly pensando = input(false);

  protected readonly largura = computed(() =>
    this.corpoInteiro() ? Math.round(this.size() * PROPORCAO_CORPO) : this.size(),
  );
  protected readonly mascara = computed(() => `url(${this.corpoInteiro() ? 'nick.png' : 'nick-rosto.png'})`);
}
