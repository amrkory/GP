import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /** Patient: GET /api/Prescription/my */
  getMyPrescriptions(): Observable<any> {
    return this.http.get<any>(`${this.api}/Prescription/my`).pipe(catchError(() => of([])));
  }

  /** Doctor: GET /api/Prescription/patient/{patientId} */
  getPatientPrescriptions(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Prescription/patient/${patientId}`).pipe(catchError(() => of([])));
  }

  /** Doctor: POST /api/Prescription/add */
  addPrescription(body: any): Observable<any> {
    return this.http.post<any>(`${this.api}/Prescription/add`, body);
  }

  /** Doctor: PUT /api/Prescription/{id} */
  updatePrescription(id: string, body: any): Observable<any> {
    return this.http.put<any>(`${this.api}/Prescription/${id}`, body);
  }

  /** Doctor: DELETE /api/Prescription/{id} */
  deletePrescription(id: string): Observable<any> {
    return this.http.delete<any>(`${this.api}/Prescription/${id}`);
  }

  static toArr(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }
}
