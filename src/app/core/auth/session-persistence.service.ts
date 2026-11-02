import { Injectable } from '@angular/core';

import { Session } from './auth.models';

const STORAGE_KEY = 'nick-finance.session';

/** Guarda a sessão no `localStorage`, tolerando navegadores que bloqueiam o acesso. */
@Injectable({ providedIn: 'root' })
export class SessionPersistence {
  load(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const session = JSON.parse(raw) as Partial<Session>;
      return isSession(session) ? session : null;
    } catch {
      return null;
    }
  }

  save(session: Session): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Sem storage disponível a sessão vale só enquanto a aba estiver aberta.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nada a limpar.
    }
  }
}

function isSession(value: Partial<Session>): value is Session {
  return (
    typeof value.token === 'string' &&
    typeof value.expiresAt === 'number' &&
    typeof value.user?.id === 'number'
  );
}
