import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  needsRefresh = false; // set true after cancel/reschedule to force list reload
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ── PATIENT ────────────────────────────────────────────────────────────────
  /** GET /api/Appointment/Patient */
  getMyAppointments(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get(`${this.api}/Appointment/Patient`, {
      params: { pageNumber, pageSize }
    });
  }

  /** POST /api/Appointment/book */
  book(dto: {
    doctorId: string;
    appointmentTime: string;  // ISO datetime
    type: 'video' | 'in_person' | 'message';
    notes?: string;
  }): Observable<any> {
    return this.http.post(`${this.api}/Appointment/book`, dto);
  }

  /** PUT /api/Appointment/cancel/{appointmentId} — patient cancels */
  cancelByPatient(appointmentId: string): Observable<any> {
    return this.http.put(`${this.api}/Appointment/cancel/${appointmentId}`, {});
  }

  /** PUT /api/Appointment/reschedule/{appointmentId} */
  reschedule(appointmentId: string, newAppointmentTime: string, rescheduleReason = 'Patient requested'): Observable<any> {
    return this.http.put(`${this.api}/Appointment/reschedule/${appointmentId}`, {
      newAppointmentTime,
      rescheduleReason,
    });
  }

  // ── DOCTOR ─────────────────────────────────────────────────────────────────
  /** GET /api/Appointment/doctor */
  getDoctorAppointments(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get(`${this.api}/Appointment/doctor`, {
      params: { pageNumber, pageSize }
    });
  }

  /** PUT /api/Appointment/respond/{appointmentId}?accept=true|false */
  respond(appointmentId: string, accept: boolean): Observable<any> {
    return this.http.put(`${this.api}/Appointment/respond/${appointmentId}`, null, {
      params: { accept: accept.toString() }
    });
  }

  /** PUT /api/Appointment/doctor/cancel/{appointmentId} — doctor cancels */
  cancelByDoctor(appointmentId: string): Observable<any> {
    return this.http.put(`${this.api}/Appointment/doctor/cancel/${appointmentId}`, {});
  }

  /** PUT /api/Appointment/complete/{appointmentId} */
  complete(appointmentId: string): Observable<any> {
    return this.http.put(`${this.api}/Appointment/complete/${appointmentId}`, {});
  }

  // ── BOOK APPOINTMENT HELPERS ───────────────────────────────────────────────
  /** GET /api/Appointment/Doctors — doctors list for booking */
  getDoctors(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get(`${this.api}/Appointment/Doctors`, {
      params: { pageNumber, pageSize }
    });
  }

  // ── CALENDLY SLOTS ──────────────────────────────────────────────────────────
  /** GET /api/Calendly/connect — initiate Calendly OAuth */
  connectCalendly(): Observable<any> {
    return this.http.get<any>(`${this.api}/Calendly/connect`);
  }

  /** GET /api/Calendly/doctor/event-types — for logged-in doctor */
  getDoctorOwnEventTypes(): Observable<any> {
    return this.http.get<any>(`${this.api}/Calendly/doctor/event-types`);
  }

  /** GET /api/Calendly/slots/{doctorId}?eventTypeUri=...&from=...&to=... */
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

  /** GET /api/Calendly/doctor/{doctorId}/event-types */
  getEventTypes(doctorId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Calendly/doctor/${doctorId}/event-types`);
  }

  /** GET /api/Calendly/doctor/event-types — for logged-in doctor */
  getDoctorEventTypes(): Observable<any> {
    return this.http.get<any>(`${this.api}/Calendly/doctor/event-types`);
  }

  // ── LEGACY COMPAT — keep old method names used in components ───────────────
  getById(id: string): Observable<any> {
    // No single-appointment endpoint in backend — use list and filter on client
    return this.getMyAppointments();
  }

  cancel(id: string, reason?: string): Observable<any> {
    return this.cancelByPatient(id);
  }

  confirm(id: string): Observable<any> {
    return this.respond(id, true);
  }
}
