import { Injectable }    from '@angular/core';
import { HttpClient }    from '@angular/common/http';
import { Observable }    from 'rxjs';
import { environment }   from '../../../environments/environment';

export interface CreatePrescriptionDto {
  patientId: string;
  diagnosis: string;
  medicines: any[];
  notes?: string;
  validUntil?: string;
}

export interface AssignChecklistDto {
  patientId: string;
  title: string;
  tasks: any[];
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // Profile
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.api}/Profile/doctorData`);
  }
  updateProfile(dto: any): Observable<any> {
    return this.http.put<any>(`${this.api}/Profile/doctorNurse`, dto);
  }
  updateSchedule(dto: any): Observable<any> {
    return this.http.put<any>(`${this.api}/Profile/doctorNurse`, dto);
  }

  // Patients
  getPatients(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/Appointment/Doctors`, { params: { pageNumber, pageSize } });
  }
  getPatientById(id: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Appointment/doctor`, { params: { pageNumber: '1', pageSize: '200' } });
  }

  // Patient vitals/prescriptions/checklists — no dedicated endpoints in backend yet
  getPatientVitals(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Vital/patient/${patientId}`);
  }
  getPatientPrescriptions(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Medication/patient/${patientId}`);
  }
  getPatientChecklists(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/MedicalTask/patient/${patientId}`);
  }

  // Appointments
  getAppointments(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/Appointment/doctor`, { params: { pageNumber, pageSize } });
  }

  // Prescriptions
  createPrescription(dto: CreatePrescriptionDto): Observable<any> {
    return this.http.post<any>(`${this.api}/Appointment/book`, dto); // placeholder
  }

  // Checklists
  assignChecklist(dto: AssignChecklistDto): Observable<any> {
    return this.http.post<any>(`${this.api}/Appointment/book`, dto); // placeholder
  }
}
