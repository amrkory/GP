import { Injectable, signal, computed } from '@angular/core';
import { HttpClient }                    from '@angular/common/http';
import { tap }                           from 'rxjs/operators';
import { environment }                   from '../../../environments/environment';
import { Notification, ApiResponse, PagedResult } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = environment.apiUrl;
  private _list = signal<Notification[]>([]);

  readonly notifications = this._list.asReadonly();
  readonly unreadCount   = computed(() => this._list().filter(n => !n.isRead).length);

  constructor(private http: HttpClient) {}

  load() {
    return this.http
      .get<ApiResponse<PagedResult<Notification>>>(`${this.api}/notifications?pageSize=30`)
      .pipe(tap(r => this._list.set(r.data.items)));
  }

  addPush(n: Notification) { this._list.update(l => [n, ...l]); }

  markRead(id: string) {
    return this.http.put<ApiResponse<void>>(`${this.api}/notifications/${id}/read`, {})
      .pipe(tap(() => this._list.update(l => l.map(n => n.id === id ? { ...n, isRead: true } : n))));
  }

  markAllRead() {
    return this.http.put<ApiResponse<void>>(`${this.api}/notifications/read-all`, {})
      .pipe(tap(() => this._list.update(l => l.map(n => ({ ...n, isRead: true })))));
  }
}
