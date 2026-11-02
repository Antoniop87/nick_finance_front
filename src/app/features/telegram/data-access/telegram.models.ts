/** Resposta de `GET /telegram`. */
export interface TelegramStatus {
  /** O bot está configurado e rodando no servidor. */
  botAtivo: boolean;
  botUsername: string | null;
  vinculado: boolean;
  vinculadoEm: string | null;
}

/** Resposta de `POST /telegram/codigo`. */
export interface TelegramCodigo {
  codigo: string;
  /** ISO 8601. */
  expiraEm: string;
  /** Link `t.me` que já envia o código ao bot; `null` se o bot não estiver configurado. */
  link: string | null;
}
