import { Injectable }  from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { Observable }   from 'rxjs';
import { environment }  from '../../../environments/environment';
import {
  ApiResponse, PagedResult,
  AdminDoctorRecord, PatientProfile, ProviderProfile, DashboardStats,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.api}/admin/stats`);
  }
  getDoctors(status?: string, search?: string): Observable<ApiResponse<PagedResult<AdminDoctorRecord>>> {
    const params: any = {}; if (status) params.status = status; if (search) params.search = search;
    return this.http.get<ApiResponse<PagedResult<AdminDoctorRecord>>>(`${this.api}/admin/doctors`, { params });
  }
  approveDoctor(id: string): Observable<ApiResponse<AdminDoctorRecord>> {
    return this.http.put<ApiResponse<AdminDoctorRecord>>(`${this.api}/admin/doctors/${id}/approve`, {});
  }
  rejectDoctor(id: string, reason: string): Observable<ApiResponse<AdminDoctorRecord>> {
    return this.http.put<ApiResponse<AdminDoctorRecord>>(`${this.api}/admin/doctors/${id}/reject`, { reason });
  }
  getPatients(search?: string): Observable<ApiResponse<PagedResult<PatientProfile>>> {
    return this.http.get<ApiResponse<PagedResult<PatientProfile>>>(`${this.api}/admin/patients`, { params: search ? { search } : {} });
  }
  getProviders(status?: string): Observable<ApiResponse<PagedResult<ProviderProfile>>> {
    return this.http.get<ApiResponse<PagedResult<ProviderProfile>>>(`${this.api}/admin/providers`, { params: status ? { status } : {} });
  }
  approveProvider(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.api}/admin/providers/${id}/approve`, {});
  }
  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/admin/users/${id}`);
  }
}
