import { Injectable, signal, computed } from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { Router }       from '@angular/router';
import { tap }          from 'rxjs/operators';
import { Observable }   from 'rxjs';
import { Role }         from '../models/role.enum';
import { environment }  from '../../../environments/environment';
import { LoginRequest, AuthResponse, TokenPayload } from '../models/api.models';

const ACCESS_KEY  = 'wateen_access';
const REFRESH_KEY = 'wateen_refresh';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  readonly currentUser = signal<TokenPayload | null>(this.decodeStoredToken());
  readonly isLoggedIn  = computed(() => !!this.currentUser());
  readonly role        = computed(() => this.currentUser()?.role ?? null);
  readonly userId      = computed(() => this.currentUser()?.sub  ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, body)
      .pipe(tap(res => this.storeAndDecode(res)));
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    return this.http.post<AuthResponse>(`${this.api}/auth/refresh`, { refreshToken })
      .pipe(tap(res => this.storeAndDecode(res)));
  }

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

  storeAndDecode(res: AuthResponse): void {
    localStorage.setItem(ACCESS_KEY,  res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    this.currentUser.set(this.decodeToken(res.accessToken));
  }

  private decodeStoredToken(): TokenPayload | null {
    return this.decodeToken(localStorage.getItem(ACCESS_KEY) ?? '');
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const b64     = token.split('.')[1];
      const decoded = JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded as TokenPayload;
    } catch { return null; }
  }
}
