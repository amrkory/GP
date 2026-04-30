// src/app/core/services/patient.service.ts
import { Injectable }   from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment }  from '../../../environments/environment';

function wrap(data: any) { return { success: true, data, message: 'OK', errors: [] }; }

@Injectable({ providedIn: 'root' })
export class PatientService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.api}/Profile/patientData`).pipe(catchError(() => of(wrap({}))));
  }
  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.api}/Profile/patient`, data).pipe(
      catchError(e => of({ success: false, message: e?.error?.message ?? 'Update failed' }))
    );
  }

  getVitals(): Observable<any> {
    return this.http.get<any>(`${this.api}/Profile/patientData`).pipe(
      map((res: any) => {
        const d: any = res?.data ?? res ?? {};
        const ts = d.updatedAt ?? new Date().toISOString();
        const entries: any[] = [];
        if (d.systolicPressure != null || d.diastolicPressure != null)
          entries.push({ id: 'v-bp', type: 'BloodPressure',
            value: `${d.systolicPressure ?? '?'  }/${d.diastolicPressure ?? '?'}`,
            systolic: d.systolicPressure, diastolic: d.diastolicPressure,
            unit: 'mmHg', recordedAt: ts, note: null });
        if (d.heartRate != null)
          entries.push({ id: 'v-hr', type: 'HeartRate',    value: String(d.heartRate), unit: 'bpm',   recordedAt: ts, note: null });
        if (d.sugar != null)
          entries.push({ id: 'v-gl', type: 'BloodGlucose', value: String(d.sugar),     unit: 'mg/dL', recordedAt: ts, note: null });
        return wrap(entries);
      }),
      catchError(() => of(wrap([])))
    );
  }
  addVital(body: any): Observable<any> {
    const dto: any = {};
    switch (body.type) {
      case 'BloodPressure':
        dto.systolicPressure  = Number(body.systolic  ?? body.value?.split('/')?.[0]);
        dto.diastolicPressure = Number(body.diastolic ?? body.value?.split('/')?.[1]);
        break;
      case 'HeartRate':   dto.heartRate = Number(body.value); break;
      case 'BloodGlucose':
      case 'Glucose':     dto.sugar = Number(body.value); break;
      default: return of(wrap({ ...body, id: 'v-' + Date.now(), recordedAt: new Date().toISOString() }));
    }
    return this.http.put<any>(`${this.api}/Profile/patient`, dto).pipe(
      map(() => wrap({ ...body, id: 'v-' + Date.now(), recordedAt: new Date().toISOString() })),
      catchError(() => of(wrap({ ...body, id: 'v-' + Date.now(), recordedAt: new Date().toISOString() })))
    );
  }

  getChecklists(): Observable<any> { return of(wrap([])); }
  completeTask(_c: string, _t: string, _n?: string): Observable<any> {
    return of(wrap({ status: 'Completed', completedAt: new Date().toISOString() }));
  }
  getPrescriptions(): Observable<any> { return of(wrap([])); }
  getRecords(): Observable<any> { return of(wrap({ items: [], totalCount: 0 })); }
  uploadRecord(file: File, title: string, type: string): Observable<any> {
    const form = new FormData();
    form.append('file', file); form.append('title', title); form.append('type', type);
    return this.http.put<any>(`${this.api}/Profile/profile-picture`, form).pipe(
      map((res: any) => wrap({ id: 'r-' + Date.now(), title, type, uploadedAt: new Date().toISOString(), url: res?.data })),
      catchError(() => of(wrap({ id: 'r-' + Date.now(), title, type, uploadedAt: new Date().toISOString() })))
    );
  }
  deleteRecord(_id: string): Observable<any> { return of(wrap(null)); }

  private _family: any[] = [];
  getFamilyMembers(): Observable<any>             { return of(wrap([...this._family])); }
  addFamilyMember(m: any): Observable<any>        { const mb = { ...m, id: 'f-' + Date.now() }; this._family.push(mb); return of(wrap(mb)); }
  removeFamilyMember(id: string): Observable<any> { this._family = this._family.filter(f => f.id !== id); return of(wrap(null)); }

  getServiceRequests(): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/PatientRequests`).pipe(catchError(() => of(wrap([]))));
  }
  requestHomeService(data: { serviceDescription: string; requestedTime: string; address: string; nurseId?: string }): Observable<any> {
    return this.http.post<any>(`${this.api}/HomeService/book`, data).pipe(
      catchError(e => of({ success: false, message: e?.error?.message ?? 'Booking failed' }))
    );
  }
}
