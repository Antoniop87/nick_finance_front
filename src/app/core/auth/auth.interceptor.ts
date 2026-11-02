import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Anexa o JWT às requisições para a API e encerra a sessão quando a API
 * recusa o token (expirado ou inválido).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const authorized = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        auth.logout({ expired: true });
      }
      return throwError(() => error);
    }),
  );
};
