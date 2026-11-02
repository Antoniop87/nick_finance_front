export interface JwtPayload {
  sub?: string;
  iss?: string;
  iat?: number;
  exp?: number;
}

/**
 * Lê o payload de um JWT sem validar a assinatura.
 * A validação é responsabilidade da API; aqui só usamos os dados para a UI
 * (e-mail do usuário e data de expiração).
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}
