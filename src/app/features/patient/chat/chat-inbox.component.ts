import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router }       from '@angular/router';
import { HttpClient }   from '@angular/common/http';
import { Subscription } from 'rxjs';
import { SignalRService } from '../../../core/services/signalr.service';
import { ChatService }    from '../../../core/services/chat.service';
import { AuthService }    from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { environment }    from '../../../../environments/environment';

interface Conv {
  userId:   string;
  name:     string;
  lastMsg:  string;
  lastAt:   string;
  unread:   number;
}

@Component({
  selector: 'app-patient-chat-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-hdr">
        <div>
          <h1>Chats</h1>
          <p class="sub">Chat with your doctors</p>
        </div>
        <!-- SignalR live indicator -->
        <div class="live-badge" [class.on]="signalR.connected()">
          <span class="live-dot"></span>
          {{ signalR.connected() ? 'Live' : 'Connecting...' }}
        </div>
      </div>

      <!-- Two-column grid: list left, info panel right on desktop -->
      <div class="chat-grid">
        <div class="chat-main">

      <!-- Search -->
      <div class="search-box">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input [(ngModel)]="q" placeholder="Search doctors..." />
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <!-- Empty -->
      <div class="empty" *ngIf="!loading() && shown().length === 0">
        <div class="empty-ico">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p>No conversations yet</p>
        <p class="empty-sub">Book an appointment and message your doctor from there.</p>
        <button class="btn-appts" (click)="router.navigate(['/patient/appointments'])">
          View Appointments →
        </button>
      </div>

      <!-- Conversation list -->
      <div class="conv-list" *ngIf="!loading() && shown().length > 0">
        <div class="conv-row" *ngFor="let c of shown()" (click)="open(c)">

          <div class="av-wrap">
            <div class="av" [style.background]="clr(c.name)">{{ ini(c.name) }}</div>
            <div class="online-dot" *ngIf="signalR.isOnline(c.userId)"></div>
          </div>

          <div class="ci">
            <div class="cn">Dr. {{ c.name }}</div>
            <div class="cl" [class.bold]="c.unread > 0">
              {{ c.lastMsg || 'Start a conversation' }}
            </div>
          </div>

          <div class="cr">
            <div class="ct" *ngIf="c.lastAt">{{ fmtTime(c.lastAt) }}</div>
            <div class="cbadge" *ngIf="c.unread > 0">{{ c.unread > 9 ? '9+' : c.unread }}</div>
            <svg *ngIf="!c.unread" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div><!-- /conv-list -->
        </div><!-- /chat-main -->

        <!-- Right panel: tips/info on desktop -->
        <div class="chat-side">
          <div class="side-card">
            <div class="side-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Your Care Team
            </div>
            <p class="side-desc">Message your doctors directly. Responses are usually within a few hours.</p>
            <div class="side-tip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              End-to-end secure messaging
            </div>
            <div class="side-tip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Real-time delivery via SignalR
            </div>
            <div class="side-tip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Message history always saved
            </div>
          </div>
        </div><!-- /chat-side -->

      </div><!-- /chat-grid -->
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { width:100%; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:14px;} }

    .page-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; gap:12px; }
    h1 { font-size:22px; font-weight:800; color:#111; }
    .sub { font-size:13px; color:#888; margin-top:2px; }

    .live-badge { display:inline-flex; align-items:center; gap:6px; font-size:12px; color:#aaa; font-weight:600; padding:6px 12px; background:#f5f5f5; border-radius:20px; white-space:nowrap; flex-shrink:0; }
    .live-badge.on { color:#22c55e; background:#E1F5EE; }
    .live-dot { width:7px; height:7px; border-radius:50%; background:currentColor; }

    .search-box { display:flex; align-items:center; gap:10px; background:#fff; border:1.5px solid #e8e8e8; border-radius:12px; padding:10px 14px; margin-bottom:16px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
    .search-box input { border:none; outline:none; font-size:14px; font-family:inherit; flex:1; background:transparent; }

    .loading { display:flex; justify-content:center; padding:48px; }
    .spinner { width:24px; height:24px; border:2px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}

    .empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:56px 20px; background:#fff; border-radius:18px; text-align:center; box-shadow:0 1px 8px rgba(0,0,0,.06); }
    .empty-ico { width:72px; height:72px; background:#f5f5f5; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .empty p { font-size:15px; font-weight:700; color:#444; }
    .empty-sub { font-size:13px; color:#aaa !important; font-weight:400 !important; max-width:240px; line-height:1.5; }
    .btn-appts { margin-top:4px; padding:10px 20px; background:#D84040; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }

    .conv-list { background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 1px 8px rgba(0,0,0,.07); }
    .conv-row { display:flex; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid #f5f5f5; cursor:pointer; transition:background .12s; }
    .conv-row:last-child { border-bottom:none; }
    .conv-row:hover { background:#FFF5F5; }

    .av-wrap { position:relative; flex-shrink:0; }
    .av { width:52px; height:52px; border-radius:50%; color:#fff; font-size:17px; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .online-dot { position:absolute; bottom:1px; right:1px; width:13px; height:13px; background:#22c55e; border-radius:50%; border:2.5px solid #fff; }

    .ci { flex:1; min-width:0; }
    .cn { font-size:15px; font-weight:700; color:#111; margin-bottom:2px; }
    .cl { font-size:13px; color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .cl.bold { color:#111; font-weight:600; }

    .cr { display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0; min-width:48px; }
    .ct { font-size:11px; color:#aaa; }
    .cbadge { background:#D84040; color:#fff; font-size:11px; font-weight:700; min-width:20px; height:20px; border-radius:10px; display:flex; align-items:center; justify-content:center; padding:0 5px; }

    /* Two-column layout */
    .chat-grid { display:grid; grid-template-columns:1fr 340px; gap:20px; align-items:start; }
    @media(max-width:1024px){ .chat-grid { grid-template-columns:1fr; } }
    .chat-main { min-width:0; }
    .chat-side { display:flex; flex-direction:column; gap:14px; }
    @media(max-width:1024px){ .chat-side { display:none; } }

    .side-card { background:#fff; border-radius:18px; padding:20px; border:1px solid #F0F2F5; box-shadow:0 1px 6px rgba(0,0,0,.06); }
    .side-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:#111; margin-bottom:10px; }
    .side-desc { font-size:13px; color:#6B7280; line-height:1.6; margin-bottom:14px; }
    .side-tip { display:flex; align-items:center; gap:8px; font-size:13px; color:#374151; padding:6px 0; border-bottom:1px solid #F8F9FC; }
    .side-tip:last-child { border-bottom:none; }
  `]
})
export class PatientChatInboxComponent implements OnInit, OnDestroy {
  private chatSvc  = inject(ChatService);
  private apptSvc  = inject(AppointmentService);
  private http     = inject(HttpClient);
  readonly signalR = inject(SignalRService);
  private auth     = inject(AuthService);
  readonly router  = inject(Router);

  loading = signal(true);
  convs   = signal<Conv[]>([]);
  q       = '';
  private sub?: Subscription;

  shown(): Conv[] {
    const s = this.q.toLowerCase();
    return s ? this.convs().filter(c => c.name.toLowerCase().includes(s)) : this.convs();
  }

  ngOnInit(): void {
    this.signalR.startConnection();
    this.loadConvs();

    // Live update when new message arrives
    this.sub = this.signalR.message$.subscribe(m => {
      this.convs.update(list => {
        const idx = list.findIndex(c => c.userId === m.senderId);
        if (idx >= 0) {
          const updated = { ...list[idx], lastMsg: m.messageContent, lastAt: m.sentAt, unread: list[idx].unread + 1 };
          return [updated, ...list.filter((_, i) => i !== idx)];
        }
        return list;
      });
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  loadConvs(): void {
    // Step 1: Try GET /api/Chat inbox
    this.chatSvc.inbox().subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res
          : res?.data?.items ?? res?.data ?? [];

        if (raw.length > 0) {
          this.convs.set(raw.map((c: any) => ({
            userId:  String(c.otherUserId ?? c.userId ?? c.id ?? ''),
            name:    c.otherUserName ?? c.doctorName ?? c.name ?? 'Doctor',
            lastMsg: c.lastMessage?.messageContent ?? c.lastMessage ?? '',
            lastAt:  c.lastMessage?.sentAt ?? c.lastMessageAt ?? '',
            unread:  c.unreadCount ?? 0,
          })));
          this.loading.set(false);
        } else {
          // Step 2: Fallback — extract unique doctors from appointments
          this.loadFromAppointments();
        }
      },
      error: () => this.loadFromAppointments(),
    });
  }

  /** Build conversation list from patient's appointments — always works */
  loadFromAppointments(): void {
    this.apptSvc.getMyAppointments().subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        // Deduplicate by doctorId
        const seen = new Set<string>();
        const convs: Conv[] = [];
        for (const a of list) {
          const did = a.doctorId ?? a.doctorUserId;
          if (!did || seen.has(did)) continue;
          seen.add(did);
          const fn = a.doctorFirstName ?? '';
          const ln = a.doctorLastName  ?? '';
          const name = (fn || ln) ? `${fn} ${ln}`.trim() : a.doctorName ?? a.doctorFullName ?? 'Doctor';
          convs.push({ userId: String(did), name, lastMsg: '', lastAt: '', unread: 0 });
        }

        // Then load last message for each (best-effort)
        if (convs.length > 0) {
          this.convs.set(convs);
          this.loading.set(false);
          // Load last message per conversation
          convs.forEach(c => {
            this.chatSvc.history(c.userId).subscribe({
              next: (hr: any) => {
                const msgs: any[] = Array.isArray(hr) ? hr : hr?.data?.items ?? hr?.data ?? [];
                if (msgs.length > 0) {
                  const last = msgs[msgs.length - 1];
                  const unread = msgs.filter((m: any) => !m.isRead && m.senderId !== this.auth.userId()).length;
                  this.convs.update(list =>
                    list.map(x => x.userId === c.userId
                      ? { ...x, lastMsg: last.messageContent ?? '', lastAt: last.sentAt ?? '', unread }
                      : x
                    )
                  );
                }
              },
              error: () => {}
            });
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  open(c: Conv): void {
    this.convs.update(list => list.map(x => x.userId === c.userId ? { ...x, unread: 0 } : x));
    this.router.navigate(['/patient/chat', c.userId], {
      state: { doctorName: c.name, from: '/patient/chat' }
    });
  }

  fmtTime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso); const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    return d.toLocaleDateString([], { month:'short', day:'numeric' });
  }

  ini(n: string): string { return (n || '?').split(' ').map((x:string) => x[0] || '').join('').slice(0,2).toUpperCase() || '?'; }
  clr(n: string): string {
    const c = ['#D84040','#2D4A8A','#0F6E56','#7C3AED','#0891B2','#d4a017'];
    return c[(n || '').charCodeAt(0) % c.length] || '#D84040';
  }
}
