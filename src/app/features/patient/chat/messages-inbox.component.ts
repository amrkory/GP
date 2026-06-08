/**
 * patient/messages/messages-inbox.component.ts
 * Route: /patient/messages  (also /patient/chat  if you kept the old route)
 *
 * Strategy:
 *  1. GET /api/Chat  → conversation list
 *  2. If empty, fall back to GET /api/Appointment/Patient and build convs from doctors
 *  3. Live: update lastMsg / unread via SignalR ReceiveMessage
 *
 * Navigation target: /patient/messages/{doctorId}
 */
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router }       from '@angular/router';
import { HttpClient }   from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ChatService, ConvRow, toConvRow, toArr } from '../../../../core/services/chat.service';
import { SignalRService }   from '../../../../core/services/signalr.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { AuthService }     from '../../../../core/services/auth.service';
import { environment }     from '../../../../../environments/environment';

@Component({
  selector: 'app-messages-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">

  <!-- Header -->
  <div class="page-hdr">
    <div>
      <h1>Messages</h1>
      <p class="sub">Chat with your care team</p>
    </div>
    <div class="live-badge" [class.on]="signalR.connected()">
      <span class="live-dot"></span>
      {{ signalR.connected() ? 'Live' : 'Connecting…' }}
    </div>
  </div>

  <!-- Search -->
  <div class="search-row">
    <div class="search-box">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input [(ngModel)]="q" placeholder="Search doctors…" />
    </div>
  </div>

  <!-- Skeleton -->
  <div class="sk-list" *ngIf="loading()">
    <div class="sk-row" *ngFor="let i of [1,2,3,4]">
      <div class="sk-av"></div>
      <div class="sk-lines">
        <div class="sk-l w55"></div>
        <div class="sk-l w75"></div>
      </div>
    </div>
  </div>

  <!-- Empty -->
  <div class="empty" *ngIf="!loading() && shown().length === 0">
    <div class="empty-ico">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
    <p>No conversations yet</p>
    <p class="empty-sub">Book an appointment to start chatting with your doctor.</p>
    <button class="btn-cta" (click)="router.navigate(['/patient/appointments'])">
      Book Appointment →
    </button>
  </div>

  <!-- List -->
  <div class="conv-list" *ngIf="!loading() && shown().length > 0">
    <div class="conv-row" *ngFor="let c of shown()" (click)="open(c)">
      <div class="av-wrap">
        <div class="av" [style.background]="clr(c.name)">{{ ini(c.name) }}</div>
        <div class="online-dot" *ngIf="signalR.isOnline(c.userId)"></div>
      </div>
      <div class="ci">
        <div class="ctop">
          <span class="cname">Dr. {{ c.name }}</span>
          <span class="ctime">{{ fmtTime(c.lastAt) }}</span>
        </div>
        <div class="cbot">
          <span class="clast" [class.bold]="c.unread > 0">
            {{ c.lastMsg || 'Start a conversation' }}
          </span>
          <span class="ubadge" *ngIf="c.unread > 0">{{ c.unread > 9 ? '9+' : c.unread }}</span>
        </div>
      </div>
      <svg *ngIf="!c.unread" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  </div>

</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:22px;max-width:680px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:14px;}}

    .page-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;gap:12px;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#888;margin-top:2px;}

    .live-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#aaa;font-weight:600;padding:6px 12px;background:#f5f5f5;border-radius:20px;white-space:nowrap;flex-shrink:0;}
    .live-badge.on{color:#22c55e;background:#E1F5EE;}
    .live-dot{width:7px;height:7px;border-radius:50%;background:currentColor;}

    .search-row{margin-bottom:16px;}
    .search-box{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #e8e8e8;border-radius:12px;padding:10px 14px;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .search-box input{border:none;outline:none;font-size:14px;font-family:inherit;flex:1;background:transparent;color:#111;}

    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
    .sk-list{display:flex;flex-direction:column;gap:1px;}
    .sk-row{display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border-radius:14px;margin-bottom:4px;}
    .sk-av{width:50px;height:50px;border-radius:50%;background:#F0F2F5;flex-shrink:0;animation:pulse 1.4s ease-in-out infinite;}
    .sk-lines{flex:1;display:flex;flex-direction:column;gap:8px;}
    .sk-l{height:11px;border-radius:6px;background:#F0F2F5;animation:pulse 1.4s ease-in-out infinite;}
    .sk-l.w55{width:55%;}.sk-l.w75{width:75%;}

    .empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:60px 20px;background:#fff;border-radius:20px;text-align:center;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .empty-ico{width:76px;height:76px;background:#f5f5f5;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty p{font-size:15px;font-weight:700;color:#444;}
    .empty-sub{font-size:13px;color:#aaa!important;font-weight:400!important;max-width:240px;line-height:1.5;}
    .btn-cta{margin-top:4px;padding:10px 22px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
    .btn-cta:hover{background:#b93030;}

    .conv-list{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.07);}
    .conv-row{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .12s;}
    .conv-row:last-child{border-bottom:none;}
    .conv-row:hover{background:#FFF5F5;}
    .av-wrap{position:relative;flex-shrink:0;}
    .av{width:50px;height:50px;border-radius:50%;color:#fff;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;}
    .online-dot{position:absolute;bottom:1px;right:1px;width:13px;height:13px;background:#22c55e;border-radius:50%;border:2.5px solid #fff;}
    .ci{flex:1;min-width:0;}
    .ctop{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;}
    .cname{font-size:15px;font-weight:700;color:#111;}
    .ctime{font-size:11px;color:#aaa;flex-shrink:0;}
    .cbot{display:flex;align-items:center;justify-content:space-between;gap:8px;}
    .clast{font-size:13px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;}
    .clast.bold{color:#111;font-weight:600;}
    .ubadge{background:#D84040;color:#fff;font-size:11px;font-weight:700;min-width:20px;height:20px;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:0 5px;flex-shrink:0;}
  `],
})
export class MessagesInboxComponent implements OnInit, OnDestroy {
  private chatSvc  = inject(ChatService);
  private apptSvc  = inject(AppointmentService);
  readonly signalR = inject(SignalRService);
  private auth     = inject(AuthService);
  readonly router  = inject(Router);

  loading = signal(true);
  convs   = signal<ConvRow[]>([]);
  q = '';
  private sub?: Subscription;

  shown(): ConvRow[] {
    const s = this.q.toLowerCase();
    return s ? this.convs().filter(c => c.name.toLowerCase().includes(s)) : this.convs();
  }

  ngOnInit(): void {
    this.signalR.start();
    this.load();

    // Live: bump last message & unread in list
    this.sub = this.signalR.message$.subscribe((raw: any) => {
      const sid = raw.senderId ?? '';
      const body = raw.body ?? raw.messageContent ?? raw.content ?? '';
      const at   = raw.sentAt ?? new Date().toISOString();
      this.convs.update(list => {
        const idx = list.findIndex(c => c.userId === sid);
        if (idx < 0) return list;
        const updated = { ...list[idx], lastMsg: body, lastAt: at, unread: list[idx].unread + 1 };
        return [updated, ...list.filter((_, i) => i !== idx)];
      });
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private load(): void {
    this.chatSvc.getConversations().subscribe({
      next: (res: any) => {
        const raw = toArr(res);
        if (raw.length > 0) {
          this.convs.set(raw.map(toConvRow));
          this.loading.set(false);
        } else {
          // Fallback: build from appointment doctor list
          this.loadFromAppointments();
        }
      },
      error: () => this.loadFromAppointments(),
    });
  }

  private loadFromAppointments(): void {
    this.apptSvc.getMyAppointments(1, 100).subscribe({
      next: (res: any) => {
        const list = toArr(res);
        const seen = new Set<string>();
        const convs: ConvRow[] = [];
        for (const a of list) {
          const did = String(a.doctorId ?? a.doctorUserId ?? '');
          if (!did || seen.has(did)) continue;
          seen.add(did);
          convs.push({
            userId:  did,
            name:    a.doctorName ?? `${a.doctorFirstName ?? ''} ${a.doctorLastName ?? ''}`.trim() || 'Doctor',
            lastMsg: '',
            lastAt:  '',
            unread:  0,
          });
        }
        this.convs.set(convs);
        this.loading.set(false);

        // Best-effort: load last message per conversation
        for (const c of convs) {
          this.chatSvc.getHistory(c.userId).subscribe({
            next: (hr: any) => {
              const msgs = toArr(hr);
              if (!msgs.length) return;
              const last   = msgs[msgs.length - 1];
              const myId   = this.auth.userId();
              const unread = msgs.filter((m: any) => !m.isRead && m.senderId !== myId).length;
              this.convs.update(l => l.map(x =>
                x.userId === c.userId
                  ? { ...x, lastMsg: last.body ?? last.messageContent ?? '', lastAt: last.sentAt ?? '', unread }
                  : x
              ));
            },
            error: () => {},
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  open(c: ConvRow): void {
    // Clear local unread counter immediately
    this.convs.update(l => l.map(x => x.userId === c.userId ? { ...x, unread: 0 } : x));
    this.router.navigate(['/patient/messages', c.userId], {
      state: { name: c.name }
    });
  }

  fmtTime(iso: string): string {
    if (!iso) return '';
    const d    = new Date(iso);
    const now  = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000)    return 'now';
    if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm';
    if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604_800_000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  ini(n: string): string {
    const p = (n || '?').split(' ');
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase().slice(0, 2) || '?';
  }
  clr(n: string): string {
    const c = ['#D84040', '#2D4A8A', '#0F6E56', '#7C3AED', '#0891B2'];
    return c[(n || '').charCodeAt(0) % c.length] || '#D84040';
  }
}
