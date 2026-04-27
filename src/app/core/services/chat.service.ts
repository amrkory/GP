import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /** GET /api/Chat — conversations list */
  getConversations(pageNumber = 1, pageSize = 20): Observable<any> {
    return this.http.get<any>(`${this.api}/Chat`, { params: { pageNumber, pageSize } });
  }

  /** GET /api/Chat/{otherUserId}/history */
  getHistory(otherUserId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Chat/${otherUserId}/history`);
  }

  /** PUT /api/Chat/{otherUserId}/read */
  markRead(otherUserId: string): Observable<any> {
    return this.http.put<any>(`${this.api}/Chat/${otherUserId}/read`, {});
  }
}
