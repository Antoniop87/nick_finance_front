import { NavigationError } from '@angular/router';

/** Evita recarregar em loop se o arquivo continuar faltando depois do reload. */
const CHAVE = 'nick-finance:recarregou-por-chunk';
const INTERVALO_MINIMO_MS = 10_000;

/**
 * Depois de um deploy, uma aba aberta com a versão antiga pede telas (chunks) que não
 * existem mais no servidor. Nesse caso recarrega a página no destino, para baixar a versão nova.
 */
export function eChunkAusente(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : String(erro ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .* failed/i.test(
    mensagem,
  );
}

export function recarregarSeChunkAusente(
  evento: NavigationError,
  armazenamento: Pick<Storage, 'getItem' | 'setItem'> | null = sessaoSegura(),
  agora = Date.now(),
  ir: (url: string) => void = (url) => window.location.assign(url),
): boolean {
  if (!eChunkAusente(evento.error)) {
    return false;
  }
  const ultima = Number(armazenamento?.getItem(CHAVE) ?? 0);
  if (agora - ultima < INTERVALO_MINIMO_MS) {
    return false;
  }
  armazenamento?.setItem(CHAVE, String(agora));
  ir(evento.url);
  return true;
}

function sessaoSegura(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
