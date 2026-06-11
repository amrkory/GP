/**
 * PhotoStateService
 * Holds the current user's profile photo URL in memory for the session.
 * - Profile component sets it after upload
 * - Shell components subscribe to it
 * - Survives navigation (singleton service)
 * - Lost on full page refresh → shell re-fetches from API on init
 */
import { Injectable, signal } from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { environment }  from '../../../environments/environment';
import { AuthService }  from './auth.service';

@Injectable({ providedIn: 'root' })
export class PhotoStateService {
  /** Current photo URL — '' means show initials */
  readonly url = signal('');

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  /** Called once by the shell on app start */
  load(): void {
    const role = (this.auth.getRole() || '').toLowerCase();

    if (role.includes('doctor')) {
      this.http.get<any>(`${environment.apiUrl}/Profile/doctorData`).subscribe({
        next: (res: any) => {
          const d = res?.data ?? res;
          const pic = d?.profilePictureUrl ?? d?.avatarUrl ?? '';
          if (pic) this.url.set(pic);
        },
        error: () => {}
      });
    } else if (role.includes('nurse') || role.includes('provider')) {
      this.http.get<any>(`${environment.apiUrl}/Profile/nurseData`).subscribe({
        next: (res: any) => {
          const d = res?.data ?? res;
          const pic = d?.profilePictureUrl ?? d?.avatarUrl ?? '';
          if (pic) this.url.set(pic);
        },
        error: () => {}
      });
    } else {
      // Patient (default)
      this.http.get<any>(`${environment.apiUrl}/Profile/patientData`).subscribe({
        next: (res: any) => {
          const d = res?.data ?? res;
          const pic = d?.profilePictureUrl ?? d?.avatarUrl ?? '';
          if (pic) this.url.set(pic);
        },
        error: () => {}
      });
    }
  }

  /** Called by profile component after successful upload + save */
  set(url: string): void {
    this.url.set(url);
  }

  clear(): void {
    this.url.set('');
  }
}
