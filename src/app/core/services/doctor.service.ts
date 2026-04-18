import { Injectable }  from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { Observable }   from 'rxjs';
import { environment }  from '../../../environments/environment';
import {
  ApiResponse, PagedResult,
  DoctorProfile, PatientProfile, Prescription, Checklist, VitalReading, Appointment,
} from '../models/api.models';

export interface CreatePrescriptionDto {
  patientId: string; diagnosis: string;
  medicines: { name: string; dosage: string; frequency: string; duration: string; instructions?: string; }[];
  notes?: string; validUntil?: string;
}

export interface AssignChecklistDto {
  patientId: string; title: string;
  tasks: { title: string; description?: string; frequency: 'Once' | 'Daily' | 'Weekly'; dueDate?: string; }[];
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<DoctorProfile>> {
    return this.http.get<ApiResponse<DoctorProfile>>(`${this.api}/doctor/profile`);
  }
  updateProfile(data: Partial<DoctorProfile>): Observable<ApiResponse<DoctorProfile>> {
    return this.http.put<ApiResponse<DoctorProfile>>(`${this.api}/doctor/profile`, data);
  }
  getPatients(search?: string): Observable<ApiResponse<PagedResult<PatientProfile>>> {
    return this.http.get<ApiResponse<PagedResult<PatientProfile>>>(`${this.api}/doctor/patients`, { params: search ? { search } : {} });
  }
  getPatientById(id: string): Observable<ApiResponse<PatientProfile>> {
    return this.http.get<ApiResponse<PatientProfile>>(`${this.api}/doctor/patients/${id}`);
  }
  getPatientVitals(id: string): Observable<ApiResponse<VitalReading[]>> {
    return this.http.get<ApiResponse<VitalReading[]>>(`${this.api}/doctor/patients/${id}/vitals`);
  }
  getPatientPrescriptions(id: string): Observable<ApiResponse<Prescription[]>> {
    return this.http.get<ApiResponse<Prescription[]>>(`${this.api}/doctor/patients/${id}/prescriptions`);
  }
  getPatientChecklists(id: string): Observable<ApiResponse<Checklist[]>> {
    return this.http.get<ApiResponse<Checklist[]>>(`${this.api}/doctor/patients/${id}/checklists`);
  }
  createPrescription(dto: CreatePrescriptionDto): Observable<ApiResponse<Prescription>> {
    return this.http.post<ApiResponse<Prescription>>(`${this.api}/doctor/prescriptions`, dto);
  }
  assignChecklist(dto: AssignChecklistDto): Observable<ApiResponse<Checklist>> {
    return this.http.post<ApiResponse<Checklist>>(`${this.api}/doctor/checklists`, dto);
  }
  getAppointments(status?: string): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(`${this.api}/doctor/appointments`, { params: status ? { status } : {} });
  }
  updateSchedule(dto: any): Observable<ApiResponse<{ calendlyEventUrl: string }>> {
    return this.http.put<ApiResponse<{ calendlyEventUrl: string }>>(`${this.api}/doctor/schedule`, dto);
  }
}
