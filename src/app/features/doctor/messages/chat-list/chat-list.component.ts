import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { RouterLink }      from '@angular/router';
import { Subscription }    from 'rxjs';
import { ChatService }     from '../../../../core/services/chat.service';
import { DoctorService }   from '../../../../core/services/doctor.service';
import { SignalRService }  from '../../../../core/services/signalr.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-hdr">
        <h1>Messages</h1>
        <p class="sub">Patient conversations</p>
      </div>

      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input [(ngModel)]="search" placeholder="Search patients..." class="search-input" />
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <!-- Empty -->
      <div class="empty" *ngIf="!loading() && filtered().length === 0">
        <div class="empty-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p>No conversations yet</p>
        <p class="empty-sub">Your patients can start a chat from their appointments.</p>
      </div>

      <!-- List -->
      <div class="conv-list" *ngIf="!loading() && filtered().length > 0">
        <a class="conv-item" *ngFor="let c of filtered()"
           [routerLink]="['/doctor/chat', c.userId]">

          <!-- Avatar with online indicator -->
          <div class="av-wrap">
            <div class="conv-av" [style.background]="colorOf(c.name)">{{ ini(c.name) }}</div>
            <div class="online-dot" *ngIf="signalR.isUserOnline(c.userId)"></div>
          </div>

          <div class="conv-info">
            <div class="conv-name">{{ c.name }}</div>
            <div class="conv-preview" [class.unread]="c.unread > 0">
              {{ c.preview || 'Tap to open conversation' }}
            </div>
          </div>

          <div class="conv-right">
            <div class="conv-time" *ngIf="c.lastAt">{{ formatTime(c.lastAt) }}</div>
            <div class="unread-chip" *ngIf="c.unread > 0">{{ c.unread > 9 ? '9+' : c.unread }}</div>
          </div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { padding:20px; max-width:680px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:14px;} }
    h1 { font-size:22px; font-weight:800; color:#111; }
    .sub { font-size:13px; color:#888; margin-top:3px; margin-bottom:16px; }
    .search-wrap { display:flex; align-items:center; gap:10px; background:#fff; border:1.5px solid #e8e8e8; border-radius:12px; padding:10px 14px; margin-bottom:14px; }
    .search-input { border:none; outline:none; font-size:14px; font-family:inherit; flex:1; background:transparent; color:#111; }
    .loading { display:flex; justify-content:center; padding:48px; }
    .spinner { width:26px; height:26px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}
    .empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:56px 20px; background:#fff; border-radius:16px; text-align:center; }
    .empty-icon { width:72px; height:72px; background:#f5f5f5; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .empty p { font-size:15px; font-weight:700; color:#444; }
    .empty-sub { font-size:13px; color:#aaa !important; font-weight:400 !important; max-width:240px; line-height:1.5; }
    .conv-list { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 1px 8px rgba(0,0,0,.07); }
    .conv-item { display:flex; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid #f5f5f5; text-decoration:none; color:inherit; transition:background .15s; cursor:pointer; }
    .conv-item:last-child { border-bottom:none; }
    .conv-item:hover { background:#F7F8FA; }
    .av-wrap { position:relative; flex-shrink:0; }
    .conv-av { width:50px; height:50px; border-radius:50%; color:#fff; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .online-dot { position:absolute; bottom:1px; right:1px; width:12px; height:12px; background:#22c55e; border-radius:50%; border:2px solid #fff; }
    .conv-info { flex:1; min-width:0; }
    .conv-name { font-size:15px; font-weight:700; color:#111; margin-bottom:2px; }
    .conv-preview { font-size:13px; color:#888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .conv-preview.unread { color:#111; font-weight:600; }
    .conv-right { display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0; }
    .conv-time { font-size:11px; color:#aaa; }
    .unread-chip { background:#2D4A8A; color:#fff; font-size:11px; font-weight:700; min-width:20px; height:20px; border-radius:10px; display:flex; align-items:center; justify-content:center; padding:0 5px; }
  `]
})
export class ChatListComponent implements OnInit, OnDestroy {
  private chatSvc = inject(ChatService);
  private docSvc  = inject(DoctorService);
  readonly signalR = inject(SignalRService);

  loading       = signal(true);
  conversations = signal<any[]>([]);
  search        = '';
  private sub?: Subscription;

  filtered(): any[] {
    const q = this.search.toLowerCase();
    return q ? this.conversations().filter(c => c.name.toLowerCase().includes(q))
             : this.conversations();
  }

  ngOnInit(): void {
    this.signalR.startConnection();
    this.loadConversations();

    // Live update unread count when new message arrives
    this.sub = this.signalR.message$.subscribe((m: any) => {
      const senderId = m.senderId ?? m.fromUserId;
      this.conversations.update(list =>
        list.map(c => c.userId === String(senderId)
          ? { ...c, preview: m.body ?? m.messageContent ?? m.content ?? c.preview, lastAt: new Date().toISOString(), unread: (c.unread || 0) + 1 }
          : c
        )
      );
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  loadConversations(): void {
    this.chatSvc.getConversations().subscribe({
      next: (res: any) => {
        const raw: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        if (raw.length > 0) {
          this.conversations.set(raw.map((c: any) => ({
            userId:  String(c.userId ?? c.otherUserId ?? c.id),
            name:    c.userName ?? c.patientName ?? c.name ?? 'Patient',
            preview: c.lastMessage ?? c.lastMsg ?? '',
            lastAt:  c.lastMessageAt ?? c.updatedAt ?? null,
            unread:  c.unreadCount ?? 0,
          })));
          this.loading.set(false);
        } else {
          // Fallback: list patients so doctor can start a chat
          this.docSvc.getPatients().subscribe({
            next: (pr: any) => {
              const pts: any[] = pr?.data?.items ?? pr?.data ?? (Array.isArray(pr) ? pr : []);
              this.conversations.set(pts.map((p: any) => ({
                userId:  String(p.id ?? p.patientId),
                name:    `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Patient',
                preview: '',
                lastAt:  null,
                unread:  0,
              })));
              this.loading.set(false);
            },
            error: () => this.loading.set(false),
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    }
    return d.toLocaleDateString([], { month:'short', day:'numeric' });
  }

  ini(name: string): string { return (name||'?').split(' ').map((n:string)=>n[0]||'').join('').slice(0,2).toUpperCase()||'?'; }
  colorOf(name: string): string {
    const c=['#2D4A8A','#D84040','#0F6E56','#7C3AED','#0891B2','#d4a017'];
    return c[(name||'').charCodeAt(0)%c.length]||'#2D4A8A';
  }
}
