import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HomeServiceService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // POST /api/HomeService/book
  // Body: { serviceDescription, requestedTime (ISO), address, nurseId }
  book(dto: { serviceDescription: string; requestedTime: string; address: string; nurseId: string }): Observable<any> {
    return this.http.post<any>(`${this.api}/HomeService/book`, dto);
  }

  // GET /api/HomeService/PatientRequests?pageNumber=1&pageSize=10
  getPatientRequests(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/PatientRequests`, { params: { pageNumber, pageSize } });
  }

  // GET /api/HomeService/NurseRequests?pageNumber=1&pageSize=10
  getNurseRequests(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/NurseRequests`, { params: { pageNumber, pageSize } });
  }

  // PUT /api/HomeService/UpdateStatus/{requestId}?accept=true|false
  updateStatus(requestId: string, accept: boolean): Observable<any> {
    return this.http.put<any>(
      `${this.api}/HomeService/UpdateStatus/${requestId}`, null,
      { params: { accept: accept.toString() } }
    );
  }

  // PUT /api/HomeService/CompleteRequest/{requestId}?complete=true
  completeRequest(requestId: string): Observable<any> {
    return this.http.put<any>(
      `${this.api}/HomeService/CompleteRequest/${requestId}`, null,
      { params: { complete: 'true' } }
    );
  }

  // GET /api/HomeService/Nurses?pageNumber=1&pageSize=10
  getNurses(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/Nurses`, { params: { pageNumber, pageSize } });
  }

  // GET /api/HomeService/MyPatients?pageNumber=1&pageSize=10
  getMyPatients(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/MyPatients`, { params: { pageNumber, pageSize } });
  }

  // GET single request by id (no dedicated endpoint — fetch list and filter)
  getRequestById(requestId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/HomeService/NurseRequests`);
  }
}
