import { Injectable, signal, computed } from '@angular/core';
import { HttpClient }                    from '@angular/common/http';
import { tap, catchError }               from 'rxjs/operators';
import { of, Observable }                from 'rxjs';
import { environment }                   from '../../../environments/environment';

export interface Notification { id: string; message: string; isRead: boolean; createdAt: string; }

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api   = environment.apiUrl;
  private _list = signal<Notification[]>([]);

  readonly notifications = this._list.asReadonly();
  readonly unreadCount   = computed(() => this._list().filter(n => !n.isRead).length);

  constructor(private http: HttpClient) {}

  load(): Observable<any> {
    return this.http.get<any>(`${this.api}/notifications?pageSize=30`).pipe(
      tap((r: any) => {
        const items = r?.data?.items ?? r?.data ?? r?.items ?? [];
        if (Array.isArray(items)) this._list.set(items);
      }),
      catchError(() => of(null))   // silently ignore 404 — endpoint not implemented yet
    );
  }

  addPush(n: Notification) { this._list.update(l => [n, ...l]); }

  markRead(id: string): Observable<any> {
    return this.http.put<any>(`${this.api}/notifications/${id}/read`, {}).pipe(
      tap(() => this._list.update(l => l.map(n => n.id === id ? { ...n, isRead: true } : n))),
      catchError(() => of(null))
    );
  }

  markAllRead(): Observable<any> {
    return this.http.put<any>(`${this.api}/notifications/read-all`, {}).pipe(
      tap(() => this._list.update(l => l.map(n => ({ ...n, isRead: true })))),
      catchError(() => of(null))
    );
  }
}
