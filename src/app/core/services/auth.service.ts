// ─────────────────────────────────────────────────────────────────────────────
//  MOCK AUTH SERVICE
//  Drop this file into:  src/app/core/services/auth.service.ts
//  Replaces the real auth service completely.
//  Remove and restore the real one when the backend is ready.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, signal, computed } from '@angular/core';
import { Router }                        from '@angular/router';
import { Observable, of, throwError }    from 'rxjs';
import { delay }                         from 'rxjs/operators';
import { Role }                          from '../models/role.enum';

export interface LoginRequest  { email: string; password: string; }
export interface AuthResponse  { accessToken: string; refreshToken: string; }

export interface TokenPayload {
  sub:              string;
  email:            string;
  role:             Role;
  given_name:       string;
  family_name:      string;
  profileCompleted: boolean;
  exp:              number;
  iat:              number;
}

// ── Storage keys ──────────────────────────────────────────────────────────────
const ACCESS_KEY  = 'wateen_access';
const REFRESH_KEY = 'wateen_refresh';

// ── Mock users — add as many as you need ─────────────────────────────────────
const MOCK_USERS: {
  email: string; password: string;
  role: Role; firstName: string; lastName: string;
  profileCompleted: boolean;
}[] = [
  { email: 'patient@test.com',  password: '123456', role: Role.Patient,     firstName: 'Ahmed',   lastName: 'Ali',      profileCompleted: true  },
  { email: 'doctor@test.com',   password: '123456', role: Role.Doctor,      firstName: 'Dr. Sara',lastName: 'Hassan',   profileCompleted: true  },
  { email: 'nurse@test.com',    password: '123456', role: Role.HomeService, firstName: 'Fatma',   lastName: 'Mohamed',  profileCompleted: true  },
  { email: 'admin@test.com',    password: '123456', role: Role.Admin,       firstName: 'Admin',   lastName: 'Wateen',   profileCompleted: true  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {

  readonly currentUser = signal<TokenPayload | null>(this.decodeStoredToken());
  readonly isLoggedIn  = computed(() => !!this.currentUser());
  readonly role        = computed(() => this.currentUser()?.role ?? null);
  readonly userId      = computed(() => this.currentUser()?.sub  ?? null);

  constructor(private router: Router) {}

  // ── LOGIN — finds mock user, creates fake JWT ─────────────────────────────
  login(body: LoginRequest): Observable<AuthResponse> {
    const user = MOCK_USERS.find(
      u => u.email.toLowerCase() === body.email.toLowerCase()
           && u.password === body.password
    );

    if (!user) {
      // Simulate 401 from backend
      return throwError(() => ({ status: 401, error: { message: 'Incorrect email or password.' } }))
        .pipe(delay(600));
    }

    const res = this.buildFakeTokens(user);
    this.storeAndDecode(res);
    return of(res).pipe(delay(800));   // simulate network delay
  }

  // ── REFRESH — always succeeds in mock mode ────────────────────────────────
  refresh(): Observable<AuthResponse> {
    const payload = this.currentUser();
    if (!payload) return throwError(() => ({ status: 401 }));
    const user = MOCK_USERS.find(u => u.email === payload.email);
    if (!user)  return throwError(() => ({ status: 401 }));
    const res = this.buildFakeTokens(user);
    this.storeAndDecode(res);
    return of(res).pipe(delay(200));
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null { return localStorage.getItem(ACCESS_KEY); }

  isTokenExpired(): boolean {
    const p = this.currentUser();
    return !p || Date.now() >= p.exp * 1000;
  }

  hasRole(...roles: Role[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
  }

  homeRouteForRole(): string {
    switch (this.role()) {
      case Role.Patient:     return '/patient/dashboard';
      case Role.Doctor:      return '/doctor/dashboard';
      case Role.HomeService: return '/provider/dashboard';
      case Role.Admin:       return '/admin/dashboard';
      default:               return '/auth/login';
    }
  }

  // ── Called by register components after successful registration ───────────
  storeAndDecode(res: AuthResponse): void {
    localStorage.setItem(ACCESS_KEY,  res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    this.currentUser.set(this.decodeToken(res.accessToken));
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private buildFakeTokens(user: typeof MOCK_USERS[0]): AuthResponse {
    const payload: TokenPayload = {
      sub:              Math.random().toString(36).slice(2),
      email:            user.email,
      role:             user.role,
      given_name:       user.firstName,
      family_name:      user.lastName,
      profileCompleted: user.profileCompleted,
      exp:              Math.floor(Date.now() / 1000) + 86400,  // 24h
      iat:              Math.floor(Date.now() / 1000),
    };

    // Build a fake but decodable JWT (header.payload.signature)
    const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
                      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const body    = btoa(JSON.stringify(payload))
                      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const sig     = 'mock-signature';

    return {
      accessToken:  `${header}.${body}.${sig}`,
      refreshToken: `mock-refresh-${user.email}`,
    };
  }

  private decodeStoredToken(): TokenPayload | null {
    return this.decodeToken(localStorage.getItem(ACCESS_KEY) ?? '');
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const b64     = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(b64));
      return decoded as TokenPayload;
    } catch { return null; }
  }
}
