import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router }     from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

function jwtDecode(token: string): any {
  try {
    const b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b);
    return JSON.parse(json);
  } catch { return {}; }
}

// Exact role values the backend JWT contains
const ROLE_CLAIM_KEYS = [
  'role', 'Role', 'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role',
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'wateen_token';
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  // ── AUTH ─────────────────────────────────────────────────────────────────
  login(dto: { email: string; password: string } | string, pw?: string): Observable<any> {
    const body = typeof dto === 'string' ? { email: dto, password: pw } : dto;
    return this.http.post<any>(`${this.api}/Auth/login`, body).pipe(
      tap((res: any) => {
        const token = res?.token ?? res?.accessToken
          ?? res?.data?.token ?? res?.data?.accessToken;
        if (token && typeof token === 'string') {
          this.saveToken(token);
          // Log JWT for debugging
          const decoded = jwtDecode(token);
          console.log('[Auth] JWT decoded:', decoded);
          console.log('[Auth] Role detected:', this.extractRole(decoded));
        }
      })
    );
  }

  registerPatient(dto: any): Observable<any>  { return this.http.post(`${this.api}/Auth/register/Patient`, dto); }
  registerDoctor(dto: any): Observable<any>   { return this.http.post(`${this.api}/Auth/register/doctor`, dto); }
  registerNurse(dto: any): Observable<any>    { return this.http.post(`${this.api}/Auth/register/nurse`, dto); }
  forgotPassword(email: string): Observable<any> { return this.http.post(`${this.api}/Auth/forgot-password`, { email }); }
  resetPassword(dto: any): Observable<any>    { return this.http.post(`${this.api}/Auth/reset-password`, dto); }
  changePassword(dto: any): Observable<any>   { return this.http.post(`${this.api}/Auth/change/password`, dto); }
  acceptReject(userId: string, ok: boolean): Observable<any> {
    return this.http.post(`${this.api}/Admin/accept-reject`, { userId, isAccepted: ok });
  }
  refresh(): Observable<any> { return this.http.post<any>(`${this.api}/Auth/refresh`, {}); }

  // ── TOKEN ─────────────────────────────────────────────────────────────────
  saveToken(token: string): void { localStorage.setItem(this.TOKEN_KEY, token); }
  getAccessToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    const t = this.getAccessToken();
    if (!t) return false;
    try {
      const d = jwtDecode(t);
      return (d.exp ?? 0) * 1000 > Date.now();
    } catch { return false; }
  }
  isTokenExpired(): boolean { return !this.isLoggedIn(); }

  // ── USER ──────────────────────────────────────────────────────────────────
  currentUser(): any {
    const t = this.getAccessToken();
    if (!t) return null;
    try { return jwtDecode(t); } catch { return null; }
  }

  userId(): string {
    const u = this.currentUser();
    return u?.sub ?? u?.nameid
      ?? u?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      ?? '';
  }

  private extractRole(u: any): string {
    if (!u) return '';
    for (const key of ROLE_CLAIM_KEYS) {
      const val = u[key];
      if (val) return Array.isArray(val) ? val[0] : String(val);
    }
    return '';
  }

  getRole(): string { return this.extractRole(this.currentUser()); }
  role(): string    { return this.getRole(); }

  homeRouteForRole(): string {
    const r = this.getRole().toLowerCase().trim();
    console.log('[Auth] homeRouteForRole — role:', r);
    if (r === 'admin')   return '/admin/dashboard';
    if (r === 'doctor')  return '/doctor/dashboard';
    if (r === 'nurse')   return '/provider/dashboard';
    if (r === 'patient') return '/patient/dashboard';
    // contains fallback
    if (r.includes('admin'))  return '/admin/dashboard';
    if (r.includes('doctor')) return '/doctor/dashboard';
    if (r.includes('nurse'))  return '/provider/dashboard';
    return '/patient/dashboard';
  }
}
