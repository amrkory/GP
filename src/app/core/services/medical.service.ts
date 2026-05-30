/**
 * MedicalService — single service for Records, Tasks, Medications
 *
 * Medical Records:
 *   POST   /api/MedicalRecord/add                     Doctor adds record for patient
 *   POST   /api/MedicalRecord/my-history              Patient adds own history
 *   GET    /api/MedicalRecord/my?recordType=Lab Result Patient gets own records
 *   GET    /api/MedicalRecord/patient/{patientId}?recordType=Doctor Note  Doctor views patient
 *   DELETE /api/MedicalRecord/delete/{recordId}
 *
 * Medical Tasks:
 *   POST   /api/MedicalTask/add
 *   GET    /api/MedicalTask/patient/{patientId}       Doctor views
 *   GET    /api/MedicalTask/my?isCompleted=false      Patient views
 *   PUT    /api/MedicalTask/complete/{taskId}         Patient marks done
 *   DELETE /api/MedicalTask/delete/{taskId}           Doctor deletes
 *
 * Medications:
 *   POST   /api/Medication/add
 *   PUT    /api/Medication/update/{medicationId}
 *   GET    /api/Medication/my?isActive=true           Patient views
 *   GET    /api/Medication/patient/{patientId}        Doctor views
 *   DELETE /api/Medication/delete/{medicationId}
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MedicalService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ── Medical Records ──────────────────────────────────────────────────────

  /** Patient: GET /api/MedicalRecord/my */
  getMyRecords(recordType?: string): Observable<any> {
    const params: any = {};
    if (recordType && recordType !== 'All') params.recordType = recordType;
    return this.http.get<any>(`${this.api}/MedicalRecord/my`, { params }).pipe(catchError(() => of([])));
  }

  /** Doctor: GET /api/MedicalRecord/patient/{patientId} */
  getPatientRecords(patientId: string, recordType?: string): Observable<any> {
    const params: any = {};
    if (recordType && recordType !== 'All') params.recordType = recordType;
    return this.http.get<any>(`${this.api}/MedicalRecord/patient/${patientId}`, { params }).pipe(catchError(() => of([])));
  }

  /** Doctor: POST /api/MedicalRecord/add */
  addRecord(body: any): Observable<any> {
    return this.http.post<any>(`${this.api}/MedicalRecord/add`, body);
  }

  /** Patient: POST /api/MedicalRecord/my-history */
  addMyHistory(body: any): Observable<any> {
    return this.http.post<any>(`${this.api}/MedicalRecord/my-history`, body);
  }

  deleteRecord(id: string): Observable<any> {
    return this.http.delete<any>(`${this.api}/MedicalRecord/delete/${id}`);
  }

  // ── Medical Tasks ─────────────────────────────────────────────────────────

  /** Doctor: POST /api/MedicalTask/add */
  addTask(body: { patientId:string; title:string; description?:string; dueDate?:string }): Observable<any> {
    return this.http.post<any>(`${this.api}/MedicalTask/add`, body);
  }

  /** Doctor: GET /api/MedicalTask/patient/{patientId} */
  getPatientTasks(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/MedicalTask/patient/${patientId}`).pipe(catchError(() => of([])));
  }

  /** Patient: GET /api/MedicalTask/my */
  getMyTasks(isCompleted?: boolean): Observable<any> {
    const params: any = {};
    if (isCompleted !== undefined) params.isCompleted = String(isCompleted);
    return this.http.get<any>(`${this.api}/MedicalTask/my`, { params }).pipe(catchError(() => of([])));
  }

  /** Patient: PUT /api/MedicalTask/complete/{taskId} */
  completeTask(taskId: string): Observable<any> {
    return this.http.put<any>(`${this.api}/MedicalTask/complete/${taskId}`, {});
  }

  /** Doctor: DELETE /api/MedicalTask/delete/{taskId} */
  deleteTask(taskId: string): Observable<any> {
    return this.http.delete<any>(`${this.api}/MedicalTask/delete/${taskId}`);
  }

  // ── Medications ───────────────────────────────────────────────────────────

  /** Doctor: POST /api/Medication/add */
  addMedication(body: any): Observable<any> {
    return this.http.post<any>(`${this.api}/Medication/add`, body);
  }

  /** Doctor: PUT /api/Medication/update/{medicationId} */
  updateMedication(id: string, body: any): Observable<any> {
    return this.http.put<any>(`${this.api}/Medication/update/${id}`, body);
  }

  /** Doctor: GET /api/Medication/patient/{patientId} */
  getPatientMedications(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Medication/patient/${patientId}`).pipe(catchError(() => of([])));
  }

  /** Patient: GET /api/Medication/my */
  getMyMedications(isActive?: boolean): Observable<any> {
    const params: any = {};
    if (isActive !== undefined) params.isActive = String(isActive);
    return this.http.get<any>(`${this.api}/Medication/my`, { params }).pipe(catchError(() => of([])));
  }

  deleteMedication(id: string): Observable<any> {
    return this.http.delete<any>(`${this.api}/Medication/delete/${id}`);
  }
}
