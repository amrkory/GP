import {
  Component, OnInit, OnDestroy, inject, signal,
  ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { Subscription }   from 'rxjs';
import { SignalRService } from '../../../core/services/signalr.service';
import { AuthService }    from '../../../core/services/auth.service';
import { environment }    from '../../../../environments/environment';

interface Msg {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

@Component({
  selector: 'app-patient-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="chat-wrap">

  <!-- Header -->
  <div class="chat-hdr">
    <button class="back-btn" (click)="router.navigate(['/patient/messages'])">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="hdr-info">
      <div class="hdr-av" [style.background]="avatarColor()">{{ initials() }}</div>
      <div class="hdr-texts">
        <div class="hdr-name">Dr. {{ otherName() }}</div>
        <div class="hdr-status">
          <span class="status-dot" [class.online]="otherOnline()"></span>
          {{ otherOnline() ? 'Online' : 'Doctor' }}
        </div>
      </div>
    </div>
  </div>

  <!-- Messages -->
  <div class="msgs" #msgBox>
    <div class="loading-msgs" *ngIf="loading()"><div class="mini-spin"></div></div>

    <div class="no-msgs" *ngIf="!loading() && msgs().length === 0">
      <div class="no-msgs-ico">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <p>No messages yet</p>
      <p class="no-msgs-sub">Send a message to your doctor</p>
    </div>

    <ng-container *ngFor="let group of grouped()">
      <div class="date-sep"><span>{{ group.date }}</span></div>
      <div class="msg-row" *ngFor="let m of group.msgs" [class.mine]="isMine(m)">
        <div class="msg-av" *ngIf="!isMine(m)" [style.background]="avatarColor()">
          {{ initials() }}
        </div>
        <div class="bubble-wrap" [class.mine]="isMine(m)">
          <div class="bubble" [class.mine]="isMine(m)" [class.sending]="m.id.startsWith('tmp_')">
            <p>{{ m.content }}</p>
            <div class="bubble-footer">
              <span class="btime">{{ m.sentAt | date:'h:mm a' }}</span>
              <span class="ticks" *ngIf="isMine(m)">
                <svg *ngIf="m.isRead" width="14" height="10" viewBox="0 0 22 16" fill="none">
                  <path d="M1 9L5 13L13 5" stroke="#93C5FD" stroke-width="2" stroke-linecap="round"/>
                  <path d="M9 9L13 13L21 5" stroke="#93C5FD" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg *ngIf="!m.isRead && !m.id.startsWith('tmp_')" width="14" height="10" viewBox="0 0 22 16" fill="none">
                  <path d="M9 9L13 13L21 5" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg *ngIf="m.id.startsWith('tmp_')" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  </div>

  <!-- Input -->
  <div class="input-bar">
    <div class="input-wrap">
      <input #inputRef [(ngModel)]="draft" placeholder="Type a message…"
             class="chat-inp" (keydown.enter)="send()" maxlength="2000" />
    </div>
    <button class="send-btn" (click)="send()" [disabled]="!draft.trim()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    </button>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 60px);background:#F0F2F5;font-family:'Cairo','Segoe UI',sans-serif;width:100%;}
    @media(max-width:768px){.chat-wrap{height:calc(100dvh - 56px);}}
    .chat-hdr{display:flex;align-items:center;gap:10px;padding:10px 16px;background:#fff;border-bottom:1px solid #F0F2F5;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .back-btn{background:none;border:none;cursor:pointer;color:#6B7280;padding:6px;border-radius:8px;display:flex;flex-shrink:0;}
    .back-btn:hover{background:#F4F6FA;}
    .hdr-info{display:flex;align-items:center;gap:10px;flex:1;}
    .hdr-av{width:38px;height:38px;border-radius:50%;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .hdr-name{font-size:15px;font-weight:700;color:#111;}
    .hdr-status{display:flex;align-items:center;gap:5px;font-size:12px;color:#6B7280;}
    .status-dot{width:7px;height:7px;border-radius:50%;background:#D0D5DD;flex-shrink:0;}
    .status-dot.online{background:#22c55e;}
    .msgs{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:2px;scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none;}
    @media(max-width:768px){.msgs{padding:12px;}} .msgs::-webkit-scrollbar{display:none;}
    .loading-msgs{display:flex;justify-content:center;padding:32px;}
    .mini-spin{width:22px;height:22px;border:2.5px solid #E8ECF0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .no-msgs{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px 24px;text-align:center;color:#9CA3AF;font-size:14px;}
    .no-msgs-ico{width:64px;height:64px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 6px rgba(0,0,0,.06);}
    .no-msgs-sub{font-size:12px;color:#C9CDD4;}
    .date-sep{display:flex;align-items:center;gap:10px;margin:12px 0 8px;font-size:11px;color:#9CA3AF;}
    .date-sep::before,.date-sep::after{content:'';flex:1;height:1px;background:#E8ECF0;}
    .date-sep span{white-space:nowrap;}
    .msg-row{display:flex;align-items:flex-end;gap:8px;margin-bottom:4px;}
    .msg-row.mine{flex-direction:row-reverse;}
    .msg-av{width:30px;height:30px;border-radius:50%;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .bubble-wrap{display:flex;flex-direction:column;max-width:68%;}
    .bubble-wrap.mine{align-items:flex-end;}
    .bubble{padding:10px 14px;border-radius:18px;word-break:break-word;border-bottom-left-radius:4px;}
    .bubble.mine{background:#D84040;color:#fff;border-bottom-left-radius:18px;border-bottom-right-radius:4px;}
    .bubble:not(.mine){background:#fff;color:#111;box-shadow:0 1px 4px rgba(0,0,0,.07);}
    .bubble.sending{opacity:.7;}
    .bubble p{font-size:14px;line-height:1.5;white-space:pre-wrap;}
    .bubble-footer{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:4px;}
    .btime{font-size:10px;opacity:.65;}
    .ticks{display:flex;align-items:center;}
    .input-bar{display:flex;align-items:flex-end;gap:10px;padding:10px 16px 14px;background:#fff;border-top:1px solid #F0F2F5;flex-shrink:0;}
    @media(max-width:768px){.input-bar{padding:8px 12px 12px;}}
    .input-wrap{flex:1;background:#F4F6FA;border:1.5px solid #E8ECF0;border-radius:22px;display:flex;align-items:center;overflow:hidden;transition:border-color .15s;}
    .input-wrap:focus-within{border-color:#D84040;background:#fff;}
    .chat-inp{flex:1;padding:10px 16px;border:none;background:transparent;font-size:14px;font-family:inherit;outline:none;color:#111;}
    .send-btn{width:42px;height:42px;border-radius:50%;background:#D84040;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
    .send-btn:hover:not(:disabled){background:#b93030;}
    .send-btn:disabled{opacity:.4;cursor:not-allowed;}
  `]
})
export class PatientChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('msgBox')   msgBox!:   ElementRef<HTMLElement>;
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  private http     = inject(HttpClient);
  readonly signalR = inject(SignalRService);
  private auth     = inject(AuthService);
  private route    = inject(ActivatedRoute);
  readonly router  = inject(Router);

  loading     = signal(true);
  msgs        = signal<Msg[]>([]);
  otherName   = signal('');
  otherOnline = signal(false);
  draft       = '';
  otherId     = '';   // doctor's userId
  private subs: Subscription[] = [];
  private scrollPending = false;

  myId(): string { return this.auth.userId?.() ?? (this.auth as any).currentUser?.()?.sub ?? ''; }
  isMine(m: Msg): boolean { return m.senderId === this.myId(); }
  initials(): string {
    const n = this.otherName().trim().split(' ');
    return ((n[0]?.[0] ?? '') + (n[1]?.[0] ?? '')).toUpperCase() || 'DR';
  }
  private COLORS = ['#2D4A8A','#0F6E56','#D84040','#7C3AED','#0891B2'];
  avatarColor(): string {
    return this.COLORS[(this.otherName().charCodeAt(0) ?? 0) % this.COLORS.length];
  }

  grouped(): { date: string; msgs: Msg[] }[] {
    const map = new Map<string, Msg[]>();
    for (const m of this.msgs()) {
      const d = this.dayLabel(m.sentAt);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(m);
    }
    return [...map.entries()].map(([date, msgs]) => ({ date, msgs }));
  }

  private dayLabel(iso: string): string {
    if (!iso) return 'Today';
    const d   = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString([], { weekday:'long', month:'short', day:'numeric' });
  }

  private parseMsg(raw: any): Msg {
    return {
      id:       raw.id           ?? String(Date.now() + Math.random()),
      senderId: raw.senderId     ?? '',
      content:  raw.content      ?? raw.messageContent ?? raw.body ?? raw.text ?? '',
      sentAt:   raw.sentAt       ?? raw.createdAt ?? new Date().toISOString(),
      isRead:   raw.isRead       ?? raw.read ?? false,
    };
  }

  ngOnInit(): void {
    this.otherId = this.route.snapshot.paramMap.get('doctorId') ?? '';

    // Get doctor name from appointments
    this.http.get<any>(`${environment.apiUrl}/Appointment/Patient`, {
      params: { pageNumber:'1', pageSize:'20' }
    }).subscribe({
      next: (res: any) => {
        const all: any[] = Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? [];
        const a = all.find(x => String(x.doctorId) === this.otherId || String(x.doctorUserId) === this.otherId);
        if (a) this.otherName.set(a.doctorName ?? '');
      }
    });

    // Load history
    this.http.get<any>(`${environment.apiUrl}/Chat/${this.otherId}/history`)
      .subscribe({
        next: (res: any) => {
          const raw = Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? [];
          const parsed = raw.map((m: any) => this.parseMsg(m))
            .sort((a: Msg, b: Msg) =>
              new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            );
          this.msgs.set(parsed);
          this.loading.set(false);
          this.scrollPending = true;
          this.http.put(`${environment.apiUrl}/Chat/${this.otherId}/read`, {}).subscribe();
          this.signalR.markRead(this.otherId);
        },
        error: () => this.loading.set(false)
      });

    // Incoming messages via SignalR
    this.subs.push(
      this.signalR.message$.subscribe((raw: any) => {
        const m   = this.parseMsg(raw);
        const sid = m.senderId;
        const rid = raw.receiverId ?? raw.toUserId ?? '';
        const myId = this.myId();
        if (sid !== this.otherId && sid !== myId) return;
        if (rid !== this.otherId && rid !== myId) return;
        if (this.msgs().some(x => x.id === m.id)) return;
        const temp = this.msgs().find(x => x.id.startsWith('tmp_') && x.content === m.content && sid === myId);
        if (temp) {
          this.msgs.update(l => l.map(x => x.id === temp.id ? m : x));
        } else {
          this.msgs.update(l => [...l, m]);
        }
        this.scrollPending = true;
        if (sid === this.otherId) {
          this.http.put(`${environment.apiUrl}/Chat/${this.otherId}/read`, {}).subscribe();
          this.signalR.markRead(this.otherId);
        }
      })
    );

    this.subs.push(
      this.signalR.read$out.subscribe((userId: string) => {
        if (userId === this.otherId)
          this.msgs.update(l => l.map(m => this.isMine(m) ? { ...m, isRead: true } : m));
      }),
      this.signalR.online$out.subscribe(id  => { if (id === this.otherId) this.otherOnline.set(true);  }),
      this.signalR.offline$out.subscribe(id => { if (id === this.otherId) this.otherOnline.set(false); })
    );

    this.signalR.start();
  }

  send(): void {
    const txt = this.draft.trim();
    if (!txt) return;
    this.draft = '';
    this.inputRef?.nativeElement.focus();

    const tempId = 'tmp_' + Date.now();
    this.msgs.update(l => [...l, {
      id: tempId, senderId: this.myId(), content: txt,
      sentAt: new Date().toISOString(), isRead: false,
    }]);
    this.scrollPending = true;
    this.signalR.sendMessage(this.otherId, txt);
  }

  ngAfterViewChecked(): void {
    if (this.scrollPending && this.msgBox?.nativeElement) {
      const el = this.msgBox.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.scrollPending = false;
    }
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}
