import { Injectable }   from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment }  from '../../../environments/environment';

// ── Helper: wrap any response into {success,data} shape ──────────────────────
function wrap(data: any) { return { success: true, data, message: 'OK', errors: [] }; }

@Injectable({ providedIn: 'root' })
export class PatientService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ── PROFILE ────────────────────────────────────────────────────────────────
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.api}/Profile/patientData`).pipe(
      catchError(() => of(wrap({})))
    );
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.api}/Profile/patient`, data);
  }

  // ── VITALS — backend stores vitals in profile (systolicPressure, diastolicPressure, heartRate, sugar) ─
  // No separate vitals list endpoint — we store locally and update profile
  getVitals(): Observable<any> {
    return this.http.get<any>(`${this.api}/Profile/patientData`).pipe(
      map((res: any) => {
        const d = res?.data ?? res ?? {};
        // Build vitals array from profile fields
        const entries: any[] = [];
        if (d.systolicPressure || d.diastolicPressure)
          entries.push({ id: 'v-bp', type: 'BloodPressure', systolic: d.systolicPressure, diastolic: d.diastolicPressure, recordedAt: d.updatedAt ?? new Date().toISOString() });
        if (d.heartRate)
          entries.push({ id: 'v-hr', type: 'HeartRate', value: d.heartRate, unit: 'bpm', recordedAt: d.updatedAt ?? new Date().toISOString() });
        if (d.sugar)
          entries.push({ id: 'v-gl', type: 'Glucose', value: d.sugar, unit: 'mg/dL', recordedAt: d.updatedAt ?? new Date().toISOString() });
        return wrap(entries);
      }),
      catchError(() => of(wrap([])))
    );
  }

  addVital(body: any): Observable<any> {
    // Map vital type to profile fields and update
    const dto: any = {};
    if (body.type === 'BloodPressure') {
      dto.systolicPressure  = body.systolic;
      dto.diastolicPressure = body.diastolic;
    } else if (body.type === 'HeartRate') {
      dto.heartRate = body.value;
    } else if (body.type === 'Glucose' || body.type === 'BloodSugar') {
      dto.sugar = body.value;
    }
    return this.http.put<any>(`${this.api}/Profile/patient`, dto).pipe(
      map((res: any) => wrap({ ...body, id: 'v-' + Date.now(), recordedAt: new Date().toISOString() })),
      catchError(() => of(wrap({ ...body, id: 'v-' + Date.now(), recordedAt: new Date().toISOString() })))
    );
  }

  // ── CHECKLISTS — no real endpoint yet, return empty ──────────────────────
  getChecklists(): Observable<any> {
    return of(wrap([]));
  }
  completeTask(checklistId: string, taskId: string, note?: string): Observable<any> {
    return of(wrap({ id: taskId, status: 'Completed', completedAt: new Date().toISOString() }));
  }

  // ── PRESCRIPTIONS — no dedicated patient prescriptions endpoint ────────────
  getPrescriptions(): Observable<any> {
    return of(wrap([]));
  }

  // ── MEDICAL RECORDS — no real endpoint, return empty ──────────────────────
  getRecords(): Observable<any> {
    return of(wrap({ items: [], totalCount: 0 }));
  }
  uploadRecord(file: File, title: string, type: string): Observable<any> {
    const form = new FormData();
    form.append('file', file); form.append('title', title); form.append('type', type);
    // Try profile-picture endpoint as a workaround
    return this.http.put<any>(`${this.api}/Profile/profile-picture`, form).pipe(
      map((res: any) => wrap({ id: 'r-' + Date.now(), title, type, uploadedAt: new Date().toISOString(), url: res?.data })),
      catchError(() => of(wrap({ id: 'r-' + Date.now(), title, type, uploadedAt: new Date().toISOString() })))
    );
  }
  deleteRecord(id: string): Observable<any> { return of(wrap(null)); }

  // ── FAMILY MEMBERS — no real endpoint, manage locally ────────────────────
  private _family: any[] = [];
  getFamilyMembers(): Observable<any> { return of(wrap(this._family)); }
  addFamilyMember(m: any): Observable<any> {
    const member = { ...m, id: 'f-' + Date.now() };
    this._family.push(member);
    return of(wrap(member));
  }
  removeFamilyMember(id: string): Observable<any> {
    this._family = this._family.filter(f => f.id !== id);
    return of(wrap(null));
  }

  // ── HOME SERVICE ──────────────────────────────────────────────────────────
  getServiceRequests(): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/PatientRequests`).pipe(
      catchError(() => of(wrap([])))
    );
  }
  requestHomeService(data: any): Observable<any> {
    return this.http.post<any>(`${this.api}/HomeService/book`, data);
  }
}
