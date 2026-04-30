import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ProfileCompletedGuard implements CanActivate {
  // Profile completion check removed — doctors can access dashboard immediately after approval
  canActivate(): boolean { return true; }
}
