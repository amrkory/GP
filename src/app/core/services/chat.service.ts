// src/app/core/services/chat.service.ts
import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}
  getConversations(pageNumber = 1, pageSize = 20): Observable<any> {
    return this.http.get<any>(`${this.api}/Chat`, { params: { pageNumber, pageSize } }).pipe(catchError(() => of({ success: true, data: [] })));
  }
  getHistory(otherUserId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Chat/${otherUserId}/history`).pipe(catchError(() => of({ success: true, data: [] })));
  }
  markRead(otherUserId: string): Observable<any> {
    return this.http.put<any>(`${this.api}/Chat/${otherUserId}/read`, {}).pipe(catchError(() => of({ success: true })));
  }
}
