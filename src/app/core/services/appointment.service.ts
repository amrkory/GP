import { Injectable }   from '@angular/core';
import { HttpClient }    from '@angular/common/http';
import { Observable }    from 'rxjs';
import { environment }   from '../../../environments/environment';
import {
  ApiResponse, PagedResult,
  Appointment, BookAppointmentRequest, TimeSlot, DoctorProfile,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getDoctors(params?: any): Observable<ApiResponse<PagedResult<DoctorProfile>>> {
    return this.http.get<ApiResponse<PagedResult<DoctorProfile>>>(`${this.api}/doctors`, { params });
  }

  getSlots(doctorId: string, date: string): Observable<ApiResponse<TimeSlot[]>> {
    return this.http.get<ApiResponse<TimeSlot[]>>(`${this.api}/doctors/${doctorId}/slots?date=${date}`);
  }

  book(body: BookAppointmentRequest): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(`${this.api}/appointments`, body);
  }

  getMyAppointments(status?: string): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(`${this.api}/appointments`, { params: status ? { status } : {} });
  }

  getById(id: string): Observable<ApiResponse<Appointment>> {
    return this.http.get<ApiResponse<Appointment>>(`${this.api}/appointments/${id}`);
  }

  cancel(id: string, reason: string): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.api}/appointments/${id}/cancel`, { reason });
  }

  reschedule(id: string, newSlot: string): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.api}/appointments/${id}/reschedule`, { newScheduledAt: newSlot });
  }
}
