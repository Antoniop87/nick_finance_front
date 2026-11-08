import { MensagemNino, historicoParaEnvio } from './nino.api';

describe('historicoParaEnvio', () => {
  const mensagens = (quantidade: number): MensagemNino[] =>
    Array.from({ length: quantidade }, (_, i) => ({ papel: 'user', texto: `m${i}` }));

  it('mantém conversas curtas inteiras', () => {
    expect(historicoParaEnvio(mensagens(3)).length).toBe(3);
  });

  it('envia só as 20 mensagens mais recentes', () => {
    const enviadas = historicoParaEnvio(mensagens(25));

    expect(enviadas.length).toBe(20);
    expect(enviadas[0].texto).toBe('m5');
    expect(enviadas[19].texto).toBe('m24');
  });
});
