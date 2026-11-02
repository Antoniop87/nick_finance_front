import { HttpErrorResponse } from '@angular/common/http';

const DEFAULT_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';

/**
 * Traduz um erro HTTP em uma mensagem amigável.
 *
 * A API ainda não devolve um corpo de erro padronizado, então a mensagem é
 * escolhida pelo status. Cada tela pode sobrescrever as mensagens por status.
 */
export function httpErrorMessage(
  error: unknown,
  messagesByStatus: Partial<Record<number, string>> = {},
  fallback = DEFAULT_MESSAGE,
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 0) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão ou se a API está no ar.';
  }

  const custom = messagesByStatus[error.status];
  if (custom) {
    return custom;
  }

  if (error.status >= 500) {
    return 'O servidor encontrou um problema. Tente novamente em instantes.';
  }

  return fallback;
}
