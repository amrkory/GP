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
    if (userRole && allowed.includes(userRole as any)) return true;

    // Redirect to correct dashboard instead of /unauthorized
    const r = userRole.toLowerCase();
    if (r === 'admin')   { this.router.navigate(['/admin/dashboard']);    return false; }
    if (r === 'doctor')  { this.router.navigate(['/doctor/dashboard']);   return false; }
    if (r === 'nurse')   { this.router.navigate(['/provider/dashboard']); return false; }
    this.router.navigate(['/patient/dashboard']);
    return false;
  }
}
