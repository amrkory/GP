import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /** GET /api/Admin/pending/doctors */
  getPendingDoctors(): Observable<any> {
    return this.http.get<any>(`${this.api}/Admin/pending/doctors`);
  }

  /** GET /api/Admin/pending/nurses */
  getPendingNurses(): Observable<any> {
    return this.http.get<any>(`${this.api}/Admin/pending/nurses`);
  }

  /** POST /api/Auth/accept-reject — approve or reject doctor/nurse */
  acceptReject(userId: string, isAccepted: boolean): Observable<any> {
    return this.http.post<any>(`${this.api}/Auth/accept-reject`, { userId, isAccepted });
  }
}
