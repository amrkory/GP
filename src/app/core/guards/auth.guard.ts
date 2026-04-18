import { Injectable }                          from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot,
         RouterStateSnapshot, Router }         from '@angular/router';
import { AuthService }                         from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.auth.isLoggedIn() && !this.auth.isTokenExpired()) return true;
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
