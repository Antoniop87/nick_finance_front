import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Largura ÷ altura do desenho de corpo inteiro. */
const PROPORCAO_CORPO = 310 / 480;

/**
 * O Nino, mascote do chat. Corpo inteiro na tela inicial e só a cabeça, num círculo,
 * nos tamanhos pequenos. O PNG é usado como máscara, então o traço segue a cor do tema.
 * Dá pulinhos enquanto procura a resposta.
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
      background: var(--primary);
      mask-position: center;
      mask-repeat: no-repeat;
      mask-size: contain;
      -webkit-mask-position: center;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-size: contain;
    }

    :host(.circulo) .desenho {
      width: 86%;
      height: 86%;
    }

    :host(.pensando) .desenho {
      animation: pulinho-nino 0.9s ease-in-out infinite;
    }

    @keyframes pulinho-nino {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-3px);
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
  protected readonly mascara = computed(() => `url(${this.corpoInteiro() ? 'nino.png' : 'nino-rosto.png'})`);
}
