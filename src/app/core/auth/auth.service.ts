import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { decodeJwtPayload } from '../utils/jwt';
import { AuthUser, LoginRequest, LoginResponse, RegisterRequest, Session } from './auth.models';
import { SessionPersistence } from './session-persistence.service';

/** Usado quando o token não informa `exp`. Mesmo prazo configurado na API. */
const FALLBACK_TOKEN_LIFETIME_MS = 4 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly persistence = inject(SessionPersistence);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  private readonly _session = signal<Session | null>(null);
  private expiryTimer?: ReturnType<typeof setTimeout>;

  readonly user = computed<AuthUser | null>(() => this._session()?.user ?? null);

  constructor() {
    const stored = this.persistence.load();
    if (stored && !isExpired(stored)) {
      this.startSession(stored);
    } else {
      this.persistence.clear();
    }
  }

  /** Token válido da sessão atual, ou `null` se não houver sessão ou ela expirou. */
  token(): string | null {
    const session = this._session();
    return session && !isExpired(session) ? session.token : null;
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }

  login(credentials: LoginRequest): Observable<AuthUser> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
      map((response) => toSession(response, credentials.email)),
      tap((session) => this.startSession(session)),
      map((session) => session.user),
    );
  }

  register(data: RegisterRequest): Observable<void> {
    return this.http.post<void>(this.baseUrl, data);
  }

  logout(options: { expired?: boolean } = {}): void {
    clearTimeout(this.expiryTimer);
    this._session.set(null);
    this.persistence.clear();
    void this.router.navigate(['/login'], {
      queryParams: options.expired ? { sessao: 'expirada' } : {},
    });
  }

  private startSession(session: Session): void {
    this._session.set(session);
    this.persistence.save(session);

    clearTimeout(this.expiryTimer);
    this.expiryTimer = setTimeout(
      () => this.logout({ expired: true }),
      session.expiresAt - Date.now(),
    );
  }
}

function toSession(response: LoginResponse, fallbackEmail: string): Session {
  const payload = decodeJwtPayload(response.token);
  return {
    token: response.token,
    expiresAt: payload?.exp ? payload.exp * 1000 : Date.now() + FALLBACK_TOKEN_LIFETIME_MS,
    user: {
      id: response.id,
      nome: response.nome,
      sobrenome: response.sobrenome,
      email: payload?.sub ?? fallbackEmail,
    },
  };
}

function isExpired(session: Session): boolean {
  return session.expiresAt <= Date.now();
}
