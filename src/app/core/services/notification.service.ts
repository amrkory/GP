/**
 * NotificationService
 * Real endpoints:
 *   GET  /api/Notification/my?isRead=&pageNumber=&pageSize=
 *   PUT  /api/Notification/read/{notificationId}
 *   PUT  /api/Notification/read-all
 *   POST /api/Notification/test-send
 */
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { environment }    from '../../../environments/environment';

export interface Notification {
  id:        string;
  title?:    string;
  message:   string;
  isRead:    boolean;
  createdAt: string;
  type?:     string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = environment.apiUrl;

  private _list = signal<Notification[]>([]);

  readonly notifications = this._list.asReadonly();
  readonly unreadCount   = computed(() => this._list().filter(n => !n.isRead).length);

  constructor(private http: HttpClient) {}

  /** GET /api/Notification/my */
  load(isRead?: boolean): Observable<any> {
    const params: any = { pageNumber: '1', pageSize: '50' };
    if (isRead !== undefined) params['isRead'] = String(isRead);

    return this.http.get<any>(`${this.api}/Notification/my`, { params }).pipe(
      tap((res: any) => {
        const items: Notification[] =
          Array.isArray(res)              ? res :
          Array.isArray(res?.data?.items) ? res.data.items :
          Array.isArray(res?.data)        ? res.data :
          Array.isArray(res?.items)       ? res.items : [];
        this._list.set(items);
      }),
      catchError(() => of(null))
    );
  }

  /** PUT /api/Notification/read/{notificationId} */
  markRead(id: string): Observable<any> {
    return this.http.put<any>(`${this.api}/Notification/read/${id}`, {}).pipe(
      tap(() => this._list.update(l =>
        l.map(n => n.id === id ? { ...n, isRead: true } : n)
      )),
      catchError(() => of(null))
    );
  }

  /** PUT /api/Notification/read-all */
  markAllRead(): Observable<any> {
    return this.http.put<any>(`${this.api}/Notification/read-all`, {}).pipe(
      tap(() => this._list.update(l => l.map(n => ({ ...n, isRead: true })))),
      catchError(() => of(null))
    );
  }

  /** POST /api/Notification/test-send — dev use */
  testSend(): Observable<any> {
    return this.http.post<any>(`${this.api}/Notification/test-send`, {});
  }

  /** Called by SignalR when a push arrives */
  addPush(n: Notification): void {
    this._list.update(l => [n, ...l]);
  }

  /** Clear all locally */
  clear(): void { this._list.set([]); }
}
