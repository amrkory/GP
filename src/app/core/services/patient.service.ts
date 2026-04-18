import { Injectable }          from '@angular/core';
import { HttpClient }           from '@angular/common/http';
import { Observable }           from 'rxjs';
import { environment }          from '../../../environments/environment';
import {
  ApiResponse, PagedResult,
  PatientProfile, VitalReading, AddVitalRequest,
  Checklist, ChecklistTask, Prescription,
  MedicalRecord, FamilyMember, ServiceRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<PatientProfile>> {
    return this.http.get<ApiResponse<PatientProfile>>(`${this.api}/patients/me`);
  }
  updateProfile(data: Partial<PatientProfile>): Observable<ApiResponse<PatientProfile>> {
    return this.http.put<ApiResponse<PatientProfile>>(`${this.api}/patients/me`, data);
  }
  getVitals(type?: string): Observable<ApiResponse<VitalReading[]>> {
    return this.http.get<ApiResponse<VitalReading[]>>(`${this.api}/patients/me/vitals`, { params: type ? { type } : {} });
  }
  addVital(body: AddVitalRequest): Observable<ApiResponse<VitalReading>> {
    return this.http.post<ApiResponse<VitalReading>>(`${this.api}/patients/me/vitals`, body);
  }
  getChecklists(): Observable<ApiResponse<Checklist[]>> {
    return this.http.get<ApiResponse<Checklist[]>>(`${this.api}/patients/me/checklists`);
  }
  completeTask(checklistId: string, taskId: string, note?: string): Observable<ApiResponse<ChecklistTask>> {
    return this.http.put<ApiResponse<ChecklistTask>>(`${this.api}/patients/me/checklists/${checklistId}/tasks/${taskId}/complete`, { note });
  }
  getPrescriptions(): Observable<ApiResponse<Prescription[]>> {
    return this.http.get<ApiResponse<Prescription[]>>(`${this.api}/patients/me/prescriptions`);
  }
  getRecords(): Observable<ApiResponse<PagedResult<MedicalRecord>>> {
    return this.http.get<ApiResponse<PagedResult<MedicalRecord>>>(`${this.api}/patients/me/records`);
  }
  uploadRecord(file: File, title: string, type: string): Observable<ApiResponse<MedicalRecord>> {
    const f = new FormData(); f.append('file', file); f.append('title', title); f.append('type', type);
    return this.http.post<ApiResponse<MedicalRecord>>(`${this.api}/patients/me/records`, f);
  }
  deleteRecord(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/patients/me/records/${id}`);
  }
  getFamilyMembers(): Observable<ApiResponse<FamilyMember[]>> {
    return this.http.get<ApiResponse<FamilyMember[]>>(`${this.api}/patients/me/family`);
  }
  addFamilyMember(m: Omit<FamilyMember, 'id'>): Observable<ApiResponse<FamilyMember>> {
    return this.http.post<ApiResponse<FamilyMember>>(`${this.api}/patients/me/family`, m);
  }
  removeFamilyMember(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/patients/me/family/${id}`);
  }
  requestHomeService(data: any): Observable<ApiResponse<ServiceRequest>> {
    return this.http.post<ApiResponse<ServiceRequest>>(`${this.api}/home-service/requests`, data);
  }
}
