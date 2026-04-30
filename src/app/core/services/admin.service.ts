// src/app/core/services/admin.service.ts
// KEY FIX: GET /Admin/pending/nurses and /Admin/pending/doctors return a raw array []
// NOT a wrapped { data: [...] } object. All parsing updated accordingly.
import { Injectable }    from '@angular/core';
import { HttpClient }    from '@angular/common/http';
import { Observable, forkJoin, of, catchError, map } from 'rxjs';
import { environment }   from '../../../environments/environment';

// Normalize any backend response shape to a plain array
function toArr(res: any): any[] {
  if (Array.isArray(res))             return res;            // raw array  ← actual backend format
  if (Array.isArray(res?.data?.items)) return res.data.items; // paged wrapper
  if (Array.isArray(res?.data))        return res.data;       // simple wrapper
  return [];
}

// Normalize a count response (backend returns plain number or { data: number })
function toNum(res: any): number {
  if (typeof res === 'number') return res;
  if (typeof res?.data === 'number') return res.data;
  return 0;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ── PENDING APPROVALS ──────────────────────────────────────────────────────
  /** GET /api/Admin/pending/doctors → returns raw array of doctor objects */
  getPendingDoctors(): Observable<any[]> {
    return this.http.get<any>(`${this.api}/Admin/pending/doctors`).pipe(
      map(res => toArr(res)),
      catchError(() => of([]))
    );
  }

  /** GET /api/Admin/pending/nurses → returns raw array of nurse objects */
  getPendingNurses(): Observable<any[]> {
    return this.http.get<any>(`${this.api}/Admin/pending/nurses`).pipe(
      map(res => toArr(res)),
      catchError(() => of([]))
    );
  }

  // ── COUNTS ─────────────────────────────────────────────────────────────────
  getUsersCount(): Observable<number> {
    return this.http.get<any>(`${this.api}/Admin/users/count`).pipe(
      map(res => toNum(res)), catchError(() => of(0))
    );
  }
  getDoctorsCount(): Observable<number> {
    return this.http.get<any>(`${this.api}/Admin/doctors/count`).pipe(
      map(res => toNum(res)), catchError(() => of(0))
    );
  }
  getNursesCount(): Observable<number> {
    return this.http.get<any>(`${this.api}/Admin/nurses/count`).pipe(
      map(res => toNum(res)), catchError(() => of(0))
    );
  }
  getPatientsCount(): Observable<number> {
    return this.http.get<any>(`${this.api}/Admin/patients/count`).pipe(
      map(res => toNum(res)), catchError(() => of(0))
    );
  }

  /** Load all dashboard stats in one parallel call */
  getDashboardStats(): Observable<any> {
    return forkJoin({
      users:         this.getUsersCount(),
      doctors:       this.getDoctorsCount(),
      nurses:        this.getNursesCount(),
      patients:      this.getPatientsCount(),
      pendingDocs:   this.getPendingDoctors(),
      pendingNurses: this.getPendingNurses(),
    }).pipe(
      map(({ users, doctors, nurses, patients, pendingDocs, pendingNurses }) => ({
        success: true,
        data: {
          totalUsers:       users,
          totalDoctors:     doctors,
          totalNurses:      nurses,
          totalPatients:    patients,
          pendingDoctors:   pendingDocs.length,
          pendingProviders: pendingNurses.length,
          totalAppointments: 0,
          appointmentsToday: 0,
        }
      }))
    );
  }

  // ── ACCEPT / REJECT ────────────────────────────────────────────────────────
  /** POST /api/Admin/accept-reject  body: { userId, isAccepted } */
  acceptReject(userId: string, isAccepted: boolean): Observable<any> {
    return this.http.post<any>(`${this.api}/Admin/accept-reject`, { userId, isAccepted }).pipe(
      catchError(e => of({ success: false, message: e?.error?.message ?? 'Action failed' }))
    );
  }
  approveDoctor(id: string): Observable<any>  { return this.acceptReject(id, true);  }
  rejectDoctor(id: string): Observable<any>   { return this.acceptReject(id, false); }
  approveNurse(id: string): Observable<any>   { return this.acceptReject(id, true);  }
  rejectNurse(id: string): Observable<any>    { return this.acceptReject(id, false); }

  // ── DELETE ACCOUNT ─────────────────────────────────────────────────────────
  /** DELETE /api/Admin/delete-account  body: { id } */
  deleteAccount(id: string): Observable<any> {
    return this.http.delete<any>(`${this.api}/Admin/delete-account`, { body: { id } }).pipe(
      catchError(e => of({ success: false, message: e?.error?.message ?? 'Delete failed' }))
    );
  }
}
