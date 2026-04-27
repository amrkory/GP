import { Injectable }  from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth endpoints
    if (this.isAuthUrl(req.url)) return next.handle(req);

    // Attach token
    const token = this.auth.getAccessToken();
    const authed = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authed).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.auth.logout();
        }
        return throwError(() => err);
      })
    );
  }

  private isAuthUrl(url: string): boolean {
    const u = url.toLowerCase();
    return u.includes('/auth/login')
      || u.includes('/auth/register')
      || u.includes('/auth/forgot')
      || u.includes('/auth/reset');
  }
}
