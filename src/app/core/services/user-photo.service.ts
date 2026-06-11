/**
 * UserPhotoService
 * Single source of truth for the logged-in user's profile photo.
 * Used by: patient-shell, doctor-shell, provider-shell,
 *          patient-profile, doctor-profile, nurse-profile,
 *          chat rooms (to show own avatar on sent messages)
 *
 * Flow:
 *  1. Shell calls load() on app start → fetches from API
 *  2. Profile component calls set(url) after upload → instant update everywhere
 *  3. Chat rooms read photo$ to show own avatar on sent bubbles
 */
import { Injectable, signal } from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { environment }  from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserPhotoService {

  /** Current user's photo URL — '' = show initials */
  readonly url = signal('');

  private _role = '';

  constructor(private http: HttpClient) {
    // Listen for photo updates from profile pages
    window.addEventListener('wateen:photo', (e: any) => {
      if (e?.detail) this.url.set(e.detail);
    });
  }

  /** Load photo from the correct API based on role */
  load(role: string): void {
    this._role = (role || '').toLowerCase();
    let endpoint = '';

    if (this._role.includes('doctor'))                        endpoint = '/Profile/doctorData';
    else if (this._role.includes('nurse') ||
             this._role.includes('provider'))                 endpoint = '/Profile/nurseData';
    else                                                      endpoint = '/Profile/patientData';

    this.http.get<any>(`${environment.apiUrl}${endpoint}`).subscribe({
      next: (res: any) => {
        const d   = res?.data ?? res;
        const pic = d?.profilePictureUrl ?? d?.avatarUrl ?? d?.photoUrl ?? '';
        if (pic) this.url.set(pic);
      },
      error: () => {}
    });
  }

  /** Called after successful photo upload */
  set(url: string): void {
    this.url.set(url);
    // Also broadcast so any window listener picks it up
    window.dispatchEvent(new CustomEvent('wateen:photo', { detail: url }));
  }

  clear(): void { this.url.set(''); }
}
