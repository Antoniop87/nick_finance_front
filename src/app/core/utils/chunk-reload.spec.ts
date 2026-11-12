import { NavigationError } from '@angular/router';

import { eChunkAusente, recarregarSeChunkAusente } from './chunk-reload';

describe('recarregarSeChunkAusente', () => {
  const ausente = () =>
    new NavigationError(1, '/bancos', new TypeError('Failed to fetch dynamically imported module: https://x/chunk-A.js'));

  function memoria() {
    const dados = new Map<string, string>();
    return { getItem: (k: string) => dados.get(k) ?? null, setItem: (k: string, v: string) => void dados.set(k, v) };
  }

  it('reconhece erro de chunk ausente', () => {
    expect(eChunkAusente(new TypeError('Failed to fetch dynamically imported module: x'))).toBeTrue();
    expect(eChunkAusente(new Error('Http failure response'))).toBeFalse();
  });

  it('recarrega no destino uma vez e não entra em loop', () => {
    const armazenamento = memoria();
    const destinos: string[] = [];
    const ir = (url: string) => destinos.push(url);

    expect(recarregarSeChunkAusente(ausente(), armazenamento, 100_000, ir)).toBeTrue();
    expect(recarregarSeChunkAusente(ausente(), armazenamento, 105_000, ir)).toBeFalse();
    expect(destinos).toEqual(['/bancos']);
  });

  it('ignora outros erros de navegação', () => {
    const ir = jasmine.createSpy('ir');
    const outro = new NavigationError(1, '/x', new Error('outra coisa'));
    expect(recarregarSeChunkAusente(outro, memoria(), 0, ir)).toBeFalse();
    expect(ir).not.toHaveBeenCalled();
  });
});
