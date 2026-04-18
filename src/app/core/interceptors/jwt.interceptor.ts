import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take }      from 'rxjs/operators';
import { AuthService }  from '../services/auth.service';
import { AuthResponse } from '../models/api.models';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  private refreshing  = false;
  private refreshDone = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isAuthEndpoint(req.url)) return next.handle(req);

    const authed = this.attachToken(req, this.auth.getAccessToken());

    return next.handle(authed).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status !== 401 || req.url.includes('/auth/refresh')) {
          return throwError(() => err);
        }
        if (this.refreshing) {
          return this.refreshDone.pipe(
            filter(t => t !== null), take(1),
            switchMap(token => next.handle(this.attachToken(req, token))),
          );
        }
        this.refreshing = true;
        this.refreshDone.next(null);
        return this.auth.refresh().pipe(
          switchMap((res: AuthResponse) => {
            this.refreshing = false;
            this.refreshDone.next(res.accessToken);
            return next.handle(this.attachToken(req, res.accessToken));
          }),
          catchError(refreshErr => {
            this.refreshing = false;
            this.auth.logout();
            return throwError(() => refreshErr);
          }),
        );
      }),
    );
  }

  private attachToken(req: HttpRequest<unknown>, token: string | null) {
    if (!token) return req;
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private isAuthEndpoint(url: string) {
    return ['/auth/login', '/auth/register', '/auth/forgot', '/auth/reset']
      .some(p => url.includes(p));
  }
}
