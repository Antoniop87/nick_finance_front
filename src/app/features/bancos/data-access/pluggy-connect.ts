/**
 * Widget oficial da Pluggy, carregado só quando o usuário vai conectar um banco.
 * A documentação recomenda a versão `latest` (o antigo `/connect/v2/` saiu do ar).
 */
const SCRIPT_URL = 'https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js';

export interface PluggyConnectOpcoes {
  connectToken: string;
  includeSandbox?: boolean;
  onSuccess?: (dados: { item: { id: string } }) => void;
  onError?: (erro: unknown) => void;
  onClose?: () => void;
}

interface PluggyConnectWidget {
  init(): Promise<void>;
}

declare global {
  interface Window {
    PluggyConnect?: new (opcoes: PluggyConnectOpcoes) => PluggyConnectWidget;
  }
}

let carregando: Promise<void> | null = null;

function carregarScript(): Promise<void> {
  if (window.PluggyConnect) {
    return Promise.resolve();
  }
  carregando ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      carregando = null;
      script.remove();
      reject(new Error('Não foi possível carregar o widget da Pluggy.'));
    };
    document.head.appendChild(script);
  });
  return carregando;
}

export async function abrirPluggyConnect(opcoes: PluggyConnectOpcoes): Promise<void> {
  await carregarScript();
  if (!window.PluggyConnect) {
    throw new Error('Widget da Pluggy indisponível.');
  }
  await new window.PluggyConnect(opcoes).init();
}
