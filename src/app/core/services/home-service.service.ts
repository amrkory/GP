// src/app/core/services/home-service.service.ts
import { Injectable }   from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment }  from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HomeServiceService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  book(dto: { serviceDescription: string; requestedTime: string; address: string; nurseId: string }): Observable<any> {
    return this.http.post<any>(`${this.api}/HomeService/book`, dto).pipe(
      catchError(e => of({ success: false, message: e?.error?.message ?? 'Booking failed' }))
    );
  }
  getPatientRequests(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/PatientRequests`, { params: { pageNumber, pageSize } }).pipe(
      catchError(() => of({ success: true, data: [] }))
    );
  }
  getNurseRequests(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/NurseRequests`, { params: { pageNumber, pageSize } }).pipe(
      catchError(() => of({ success: true, data: [] }))
    );
  }
  getProviderRequests(pageNumber = 1, pageSize = 50): Observable<any> { return this.getNurseRequests(pageNumber, pageSize); }
  updateStatus(requestId: string, accept: boolean): Observable<any> {
    return this.http.put<any>(`${this.api}/HomeService/UpdateStatus/${requestId}`, null,
      { params: { accept: accept.toString() } }
    ).pipe(catchError(e => of({ success: false, message: e?.error?.message ?? 'Failed' })));
  }
  completeRequest(requestId: string): Observable<any> {
    return this.http.put<any>(`${this.api}/HomeService/CompleteRequest/${requestId}`, null,
      { params: { complete: 'true' } }
    ).pipe(catchError(e => of({ success: false, message: e?.error?.message ?? 'Failed' })));
  }
  getNurses(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/Nurses`, { params: { pageNumber, pageSize } }).pipe(catchError(() => of({ success: true, data: [] })));
  }
  getMyPatients(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/MyPatients`, { params: { pageNumber, pageSize } }).pipe(catchError(() => of({ success: true, data: [] })));
  }
  getRequestById(_id: string): Observable<any> { return this.getNurseRequests(); }
}
