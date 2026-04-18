import { Injectable }                        from '@angular/core';
import { CanActivate, Router }               from '@angular/router';
import { AuthService }                       from '../services/auth.service';
import { Role }                              from '../models/role.enum';

@Injectable({ providedIn: 'root' })
export class ProfileCompletedGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.auth.currentUser();
    if (user?.role === Role.Doctor && !user.profileCompleted) {
      this.router.navigate(['/auth/doctor-registration']);
      return false;
    }
    return true;
  }
}
