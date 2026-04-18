import { Injectable }                        from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot,
         Router }                            from '@angular/router';
import { AuthService }                       from '../services/auth.service';
import { Role }                              from '../models/role.enum';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowed: Role[] = route.data?.['roles'] ?? [];
    const userRole = this.auth.role();

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    if (userRole && allowed.includes(userRole)) return true;

    this.router.navigate(['/unauthorized']);
    return false;
  }
}
