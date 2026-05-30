/**
 * VitalsService — connects to /api/Vital endpoints
 *
 * API fields: { bloodPressure, bloodSugarLevel, heartRate, temperature, weight, oxygenLevel }
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VitalPayload {
  bloodPressure:  string;
  bloodSugarLevel: number;
  heartRate:      number;
  temperature:    number;
  weight:         number;
  oxygenLevel:    number;
}

@Injectable({ providedIn: 'root' })
export class VitalsService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /** Patient: GET /api/Vital/my */
  getMyVitals(pageNumber = 1, pageSize = 10): Observable<any> {
    return this.http.get<any>(`${this.api}/Vital/my`, {
      params: { pageNumber: String(pageNumber), pageSize: String(pageSize) }
    }).pipe(catchError(() => of({ data: { items: [] } })));
  }

  /** Patient: POST /api/Vital/my */
  addMyVitals(body: Partial<VitalPayload>): Observable<any> {
    return this.http.post<any>(`${this.api}/Vital/my`, body);
  }

  /** Doctor: GET /api/Vital/patient/{patientId} */
  getPatientVitals(patientId: string, pageNumber = 1, pageSize = 10): Observable<any> {
    return this.http.get<any>(`${this.api}/Vital/patient/${patientId}`, {
      params: { pageNumber: String(pageNumber), pageSize: String(pageSize) }
    }).pipe(catchError(() => of({ data: { items: [] } })));
  }

  /** Doctor: POST /api/Vital/patient/{patientId} */
  addPatientVitals(patientId: string, body: Partial<VitalPayload>): Observable<any> {
    return this.http.post<any>(`${this.api}/Vital/patient/${patientId}`, body);
  }

  /** Doctor: GET /api/Vital/trend/{patientId} */
  getPatientTrend(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Vital/trend/${patientId}`)
      .pipe(catchError(() => of({})));
  }

  /** Helper: extract array from any response shape */
  static toArr(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }
}
