import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ── GET ──────────────────────────────────────────────────────────────────────
  getPatientData(): Observable<any>  { return this.http.get<any>(`${this.api}/Profile/patientData`); }
  getDoctorData(): Observable<any>   { return this.http.get<any>(`${this.api}/Profile/doctorData`); }
  getNurseData(): Observable<any>    { return this.http.get<any>(`${this.api}/Profile/nurseData`); }
  getGenericProfile(): Observable<any> { return this.http.get<any>(`${this.api}/Profile`); }

  // ── PUT patient — exact fields from Swagger ───────────────────────────────
  // { firstName, lastName, email, profilePictureUrl, gender, dateOfBirth,
  //   address, systolicPressure, diastolicPressure, heartRate, sugar }
  updatePatient(dto: {
    firstName?: string; lastName?: string; email?: string;
    profilePictureUrl?: string; gender?: string; dateOfBirth?: string;
    address?: string; systolicPressure?: number; diastolicPressure?: number;
    heartRate?: number; sugar?: number;
  }): Observable<any> {
    return this.http.put<any>(`${this.api}/Profile/patient`, dto);
  }

  // ── PUT doctorNurse — exact fields from Swagger ───────────────────────────
  // { firstName, lastName, email, profilePictureUrl }
  updateDoctorNurse(dto: {
    firstName?: string; lastName?: string;
    email?: string; profilePictureUrl?: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.api}/Profile/doctorNurse`, dto);
  }

  // ── PUT profile-picture — multipart/form-data ─────────────────────────────
  uploadPicture(file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.put<any>(`${this.api}/Profile/profile-picture`, form);
  }
}
