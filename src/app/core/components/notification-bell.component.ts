/**
 * NotificationBellComponent
 * A standalone bell icon + dropdown panel used in the header of all 3 shells.
 * Usage in template:
 *   <app-notification-bell></app-notification-bell>
 *
 * Features:
 * - Bell icon with unread badge
 * - Click opens dropdown with notification list
 * - Mark individual as read (PUT /api/Notification/read/{id})
 * - Mark all as read (PUT /api/Notification/read-all)
 * - Click outside closes dropdown
 * - Loads on mount + listens for SignalR push
 */
import {
  Component, OnInit, OnDestroy, inject, signal,
  HostListener, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../services/notification.service';
import { SignalRService } from '../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="nb-wrap" #wrap>

  <!-- Bell button -->
  <button class="bell-btn" (click)="toggle()" [class.active]="open()">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    <span class="bell-badge" *ngIf="svc.unreadCount() > 0">
      {{ svc.unreadCount() > 9 ? '9+' : svc.unreadCount() }}
    </span>
  </button>

  <!-- Dropdown -->
  <div class="nb-panel" *ngIf="open()">
    <div class="nb-hdr">
      <span class="nb-title">Notifications</span>
      <div class="nb-hdr-right">
        <span class="nb-count" *ngIf="svc.unreadCount() > 0">
          {{ svc.unreadCount() }} unread
        </span>
        <button class="mark-all-btn" *ngIf="svc.unreadCount() > 0"
                (click)="markAll()">
          Mark all read
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div class="nb-loading" *ngIf="loading()">
      <div class="nb-spin"></div>
    </div>

    <!-- Empty -->
    <div class="nb-empty" *ngIf="!loading() && svc.notifications().length === 0">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <p>No notifications yet</p>
    </div>

    <!-- List -->
    <div class="nb-list" *ngIf="!loading()">
      <div class="nb-item" *ngFor="let n of svc.notifications()"
           [class.unread]="!n.isRead"
           (click)="markOne(n)">
        <div class="nb-dot" *ngIf="!n.isRead"></div>
        <div class="nb-content">
          <div class="nb-msg">{{ n.title || n.message }}</div>
          <div class="nb-sub" *ngIf="n.title && n.message">{{ n.message }}</div>
          <div class="nb-time">{{ fmtTime(n.createdAt) }}</div>
        </div>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}

    .nb-wrap { position:relative; }

    /* Bell button */
    .bell-btn {
      position: relative;
      width: 38px; height: 38px;
      background: none; border: none;
      cursor: pointer; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #6B7280;
      transition: background .12s, color .12s;
    }
    .bell-btn:hover, .bell-btn.active { background: #F4F6FA; color: #111; }

    .bell-badge {
      position: absolute; top: 2px; right: 2px;
      min-width: 17px; height: 17px;
      background: #D84040; color: #fff;
      font-size: 9px; font-weight: 700;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 4px;
      border: 2px solid #fff;
    }

    /* Dropdown panel */
    .nb-panel {
      position: absolute; top: calc(100% + 8px); right: 0;
      width: 340px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,.12);
      border: 1px solid #F0F2F5;
      z-index: 1000;
      overflow: hidden;
    }
    @media(max-width: 400px) { .nb-panel { width: calc(100vw - 24px); right: -12px; } }

    /* Header */
    .nb-hdr {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #F0F2F5;
    }
    .nb-title { font-size: 15px; font-weight: 700; color: #111; }
    .nb-hdr-right { display: flex; align-items: center; gap: 10px; }
    .nb-count { font-size: 12px; color: #D84040; font-weight: 600; }
    .mark-all-btn {
      font-size: 12px; font-weight: 600; color: #2D4A8A;
      background: none; border: none; cursor: pointer;
      font-family: inherit; padding: 0;
    }
    .mark-all-btn:hover { text-decoration: underline; }

    /* Loading */
    @keyframes spin { to { transform: rotate(360deg); } }
    .nb-loading { display: flex; justify-content: center; padding: 24px; }
    .nb-spin {
      width: 20px; height: 20px;
      border: 2.5px solid #F0F2F5;
      border-top-color: #D84040;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    /* Empty */
    .nb-empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 32px 16px;
      color: #9CA3AF; font-size: 13px;
    }

    /* List */
    .nb-list {
      max-height: 360px;
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .nb-list::-webkit-scrollbar { display: none; }

    .nb-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid #F8F9FC;
      cursor: pointer;
      transition: background .1s;
      position: relative;
    }
    .nb-item:last-child { border-bottom: none; }
    .nb-item:hover { background: #FAFBFC; }
    .nb-item.unread { background: #FEFAF5; }
    .nb-item.unread:hover { background: #FEF3E7; }

    .nb-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #D84040; flex-shrink: 0;
      margin-top: 5px;
    }

    .nb-content { flex: 1; min-width: 0; }
    .nb-msg { font-size: 13px; font-weight: 600; color: #111; line-height: 1.4; }
    .nb-sub { font-size: 12px; color: #6B7280; margin-top: 2px; line-height: 1.4; }
    .nb-time { font-size: 11px; color: #9CA3AF; margin-top: 4px; }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly svc     = inject(NotificationService);
  private signalR  = inject(SignalRService);
  private elRef    = inject(ElementRef);

  open    = signal(false);
  loading = signal(false);

  private sub?: Subscription;

  ngOnInit(): void {
    // Load notifications
    this.loading.set(true);
    this.svc.load().subscribe(() => this.loading.set(false));

    // Listen for real-time push notifications from SignalR
    this.sub = this.signalR.notification$.subscribe((raw: any) => {
      if (!raw) return;
      this.svc.addPush({
        id:        raw.id        ?? `push-${Date.now()}`,
        title:     raw.title     ?? '',
        message:   raw.message   ?? raw.body ?? raw.content ?? '',
        isRead:    false,
        createdAt: raw.createdAt ?? new Date().toISOString(),
        type:      raw.type      ?? '',
      });
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  toggle(): void { this.open.update(v => !v); }

  markOne(n: Notification): void {
    if (!n.isRead) this.svc.markRead(n.id).subscribe();
  }

  markAll(): void { this.svc.markAllRead().subscribe(); }

  // Close on outside click
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.open.set(false);
    }
  }

  fmtTime(iso: string): string {
    if (!iso) return '';
    const src = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
    const d   = new Date(src);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000)     return 'Just now';
    if (diff < 3_600_000)  return Math.floor(diff / 60_000) + 'm ago';
    if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago';
    if (diff < 604_800_000) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Africa/Cairo'
    }).format(d);
  }
}
