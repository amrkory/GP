import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  inbox(pageNumber = 1, pageSize = 50): Observable<any> {
    return this.http.get<any>(`${this.api}/Chat`, {
      params: { pageNumber: String(pageNumber), pageSize: String(pageSize) }
    }).pipe(catchError(() => of([])));
  }

  history(otherUserId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/Chat/${otherUserId}/history`)
      .pipe(catchError(() => of([])));
  }

  markRead(otherUserId: string): Observable<any> {
    return this.http.put<any>(`${this.api}/Chat/${otherUserId}/read`, {})
      .pipe(catchError(() => of({})));
  }

  // aliases used by older components
  getConversations = (p = 1, s = 50) => this.inbox(p, s);
  getHistory       = (id: string)    => this.history(id);
}
