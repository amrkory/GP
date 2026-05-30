import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  needsRefresh = false;
  private api = environment.apiUrl;

  // ── LOCAL OVERRIDE STORE ───────────────────────────────────────────────────
  // Because the backend cancel endpoint returns 200 but doesn't always update
  // the status immediately, we track overrides client-side.
  private localStatus = new Map<string, string>(); // id → 'Cancelled' | 'Completed' etc.

  setLocalStatus(id: string, status: string): void {
    this.localStatus.set(String(id), status);
  }

  // Apply local overrides to appointment list
  applyOverrides(list: any[]): any[] {
    if (this.localStatus.size === 0) return list;
    return list.map(a => {
      const override = this.localStatus.get(String(a.id));
      return override ? { ...a, status: override } : a;
    });
  }

  constructor(private http: HttpClient) {}

  // ── PATIENT ────────────────────────────────────────────────────────────────
  getMyAppointments(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get(`${this.api}/Appointment/Patient`, {
      params: { pageNumber: String(pageNumber), pageSize: String(pageSize) }
    });
  }

  book(dto: { doctorId: string; appointmentTime: string; type: string; notes?: string }): Observable<any> {
    return this.http.post(`${this.api}/Appointment/book`, dto);
  }

  cancelByPatient(appointmentId: string, reason?: string): Observable<any> {
    const body = reason ? { cancellationReason: reason } : {};
    return this.http.put(`${this.api}/Appointment/cancel/${appointmentId}`, body).pipe(
      tap(() => {
        // Always mark as cancelled locally regardless of what backend returns
        this.setLocalStatus(appointmentId, 'Cancelled');
        this.needsRefresh = true;
      })
    );
  }

  reschedule(appointmentId: string, newAppointmentTime: string, rescheduleReason = 'Patient requested'): Observable<any> {
    return this.http.put(`${this.api}/Appointment/reschedule/${appointmentId}`, {
      newAppointmentTime, rescheduleReason,
    });
  }

  // ── DOCTOR ─────────────────────────────────────────────────────────────────
  getDoctorAppointments(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get(`${this.api}/Appointment/doctor`, {
      params: { pageNumber: String(pageNumber), pageSize: String(pageSize) }
    });
  }

  respond(appointmentId: string, accept: boolean): Observable<any> {
    return this.http.put(`${this.api}/Appointment/respond/${appointmentId}`, null, {
      params: { accept: accept.toString() }
    });
  }

  cancelByDoctor(appointmentId: string): Observable<any> {
    return this.http.put(`${this.api}/Appointment/doctor/cancel/${appointmentId}`, {});
  }

  complete(appointmentId: string): Observable<any> {
    return this.http.put(`${this.api}/Appointment/complete/${appointmentId}`, {});
  }

  getDoctors(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get(`${this.api}/Appointment/Doctors`, {
      params: { pageNumber: String(pageNumber), pageSize: String(pageSize) }
    });
  }

  // ── CALENDLY ───────────────────────────────────────────────────────────────
  connectCalendly(): Observable<any> { return this.http.get<any>(`${this.api}/Calendly/connect`); }
  getDoctorOwnEventTypes(): Observable<any> { return this.http.get<any>(`${this.api}/Calendly/doctor/event-types`); }
  getDoctorEventTypes(): Observable<any> { return this.http.get<any>(`${this.api}/Calendly/doctor/event-types`); }
  getEventTypes(doctorId: string): Observable<any> { return this.http.get<any>(`${this.api}/Calendly/doctor/${doctorId}/event-types`); }

  getSlots(doctorId: string, date?: string, eventTypeUri?: string): Observable<any> {
    const params: any = {};
    if (date) {
      const d = new Date(date);
      params.from = d.toISOString();
      params.to   = new Date(d.getTime() + 86400000).toISOString();
    }
    if (eventTypeUri) params.eventTypeUri = eventTypeUri;
    return this.http.get<any>(`${this.api}/Calendly/slots/${doctorId}`, { params });
  }

  // ── LEGACY ALIASES ──────────────────────────────────────────────────────────
  getById(id: string): Observable<any> { return this.getMyAppointments(); }
  cancel(id: string, reason?: string): Observable<any> { return this.cancelByPatient(id, reason); }
  confirm(id: string): Observable<any> { return this.respond(id, true); }
  getAppointments(pageNumber = 1, pageSize = 50): Observable<any> { return this.getDoctorAppointments(pageNumber, pageSize); }
}
