import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked,
  signal, inject
} from '@angular/core';
import { HttpClient }    from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription }  from 'rxjs';
import { ChatService }   from '../../../../core/services/chat.service';
import { SignalRService }from '../../../../core/services/signalr.service';
import { AuthService }   from '../../../../core/services/auth.service';

interface Msg {
  id: string; senderId: string; receiverId: string;
  body: string; sentAt: string; isRead: boolean;
}

function getBody(raw: any): string {
  if (typeof raw.body === 'string' && raw.body)           return raw.body;
  if (typeof raw.content === 'string' && raw.content)     return raw.content;
  if (typeof raw.messageContent === 'string')              return raw.messageContent;
  return '';
}

function toMsg(raw: any): Msg {
  return {
    id:         raw.id ?? raw.messageId ?? `${Date.now()}-${Math.random()}`,
    senderId:   raw.senderId   ?? raw.sender?.id   ?? '',
    receiverId: raw.receiverId ?? raw.receiver?.id ?? '',
    body:       getBody(raw),
    sentAt:     raw.sentAt ?? raw.createdAt ?? new Date().toISOString(),
    isRead:     raw.isRead ?? false,
  };
}

@Component({
  selector: 'app-doctor-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="cw">
  <div class="hdr">
    <button class="back" (click)="router.navigate(['/doctor/chat'])">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="hmid">
      <div class="av" [style.background]="clr(pName())">{{ ini(pName()) }}</div>
      <div>
        <div class="hname">{{ pName() || 'Patient' }}</div>
        <div class="hsub">
          <span class="dot" [class.on]="online()"></span>
          {{ online() ? 'Online' : 'Patient' }}
        </div>
      </div>
    </div>
    <a [routerLink]="['/doctor/patients', otherId]" class="vpbtn">Profile</a>
  </div>

  <div class="msgs" #msgBox>
    <div class="sp-wrap" *ngIf="loading()"><div class="sp"></div></div>
    <div class="ec" *ngIf="!loading() && msgs().length===0">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <p>No messages yet. Start the conversation.</p>
    </div>

    <ng-container *ngFor="let g of grouped()">
      <div class="dsep"><span>{{ g.date }}</span></div>
      <div class="mr" *ngFor="let m of g.msgs" [class.mine]="isMine(m)">
        <div class="mav-wrap" *ngIf="!isMine(m)">
          <img *ngIf="otherPhotoUrl()" [src]="otherPhotoUrl()" class="mav-img" alt=""/>
          <div *ngIf="!otherPhotoUrl()" class="mav" [style.background]="clr(pName())">{{ ini(pName()) }}</div>
        </div>
        <div class="bw" [class.mine]="isMine(m)">
          <div class="b" [class.mine]="isMine(m)" [class.tmp]="isTmp(m)">
            <p>{{ m.body }}</p>
            <div class="bf">
              <span class="bt">{{ m.sentAt | date:'h:mm a' }}</span>
              <span class="tks" *ngIf="isMine(m)">
                <svg *ngIf="m.isRead" width="14" height="9" viewBox="0 0 22 14" fill="none">
                  <path d="M1 7L5 11L13 3" stroke="#93C5FD" stroke-width="2" stroke-linecap="round"/>
                  <path d="M9 7L13 11L21 3" stroke="#93C5FD" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg *ngIf="!m.isRead && !isTmp(m)" width="12" height="9" viewBox="0 0 16 12" fill="none">
                  <path d="M1 6L5 10L15 2" stroke="rgba(255,255,255,.6)" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg *ngIf="isTmp(m)" width="10" height="10" viewBox="0 0 24 24" fill="none"
                     stroke="rgba(255,255,255,.5)" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  </div>

  <div class="ibar">
    <div class="iw" [class.foc]="foc">
      <input #inp [(ngModel)]="draft" placeholder="Type a message…"
             class="ci" (keydown.enter)="send()"
             (focus)="foc=true" (blur)="foc=false" maxlength="2000"/>
    </div>
    <button class="sb" (click)="send()" [disabled]="!draft.trim()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none"/>
      </svg>
    </button>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .cw{display:flex;flex-direction:column;height:calc(100vh - 60px);background:#F0F2F5;font-family:'Cairo','Segoe UI',sans-serif;width:100%;}
    @media(max-width:768px){.cw{height:calc(100dvh - 56px);}}
    .hdr{display:flex;align-items:center;gap:10px;padding:10px 16px;background:#fff;border-bottom:1px solid #F0F2F5;flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,.04);}
    .back{background:none;border:none;cursor:pointer;color:#6B7280;padding:6px;border-radius:8px;display:flex;}
    .back:hover{background:#F4F6FA;}
    .hmid{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}
    .av{width:38px;height:38px;border-radius:50%;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .hname{font-size:15px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .hsub{display:flex;align-items:center;gap:5px;font-size:12px;color:#6B7280;}
    .dot{width:7px;height:7px;border-radius:50%;background:#D0D5DD;flex-shrink:0;}
    .dot.on{background:#22c55e;}
    .vpbtn{padding:6px 12px;border:1.5px solid #E8ECF0;border-radius:10px;text-decoration:none;font-size:12px;font-weight:700;color:#374151;white-space:nowrap;flex-shrink:0;}
    .msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:2px;scrollbar-width:none;-ms-overflow-style:none;}
    .msgs::-webkit-scrollbar{display:none;}
    .sp-wrap{display:flex;justify-content:center;padding:32px;}
    .sp{width:22px;height:22px;border:2.5px solid #E8ECF0;border-top-color:#2D4A8A;border-radius:50%;animation:sp .7s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    .ec{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px;color:#9CA3AF;font-size:14px;}
    .dsep{display:flex;align-items:center;gap:10px;margin:10px 0 6px;font-size:11px;color:#9CA3AF;}
    .dsep::before,.dsep::after{content:'';flex:1;height:1px;background:#E8ECF0;}
    .dsep span{white-space:nowrap;}
    .mr{display:flex;align-items:flex-end;gap:8px;margin-bottom:3px;}
    .mr.mine{flex-direction:row-reverse;}
    .mav-wrap{width:28px;height:28px;flex-shrink:0;}
    .mav{width:28px;height:28px;border-radius:50%;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .mav-img{width:28px;height:28px;border-radius:50%;object-fit:cover;}
    .bw{max-width:70%;}.bw.mine{margin-left:auto;}
    .b{padding:9px 13px;border-radius:16px;word-break:break-word;border-bottom-left-radius:3px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.07);}
    .b.mine{background:#2D4A8A;border-bottom-left-radius:16px;border-bottom-right-radius:3px;}
    .b.tmp{opacity:.65;}
    .b p{font-size:14px;line-height:1.5;white-space:pre-wrap;color:#111;}
    .b.mine p{color:#fff;}
    .bf{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:3px;}
    .bt{font-size:10px;opacity:.6;}
    .b.mine .bt{color:rgba(255,255,255,.7);}
    .tks{display:flex;align-items:center;}
    .ibar{display:flex;align-items:center;gap:10px;padding:10px 16px 14px;background:#fff;border-top:1px solid #F0F2F5;flex-shrink:0;}
    @media(max-width:768px){.ibar{padding:8px 12px 12px;}}
    .iw{flex:1;background:#F4F6FA;border:1.5px solid #E8ECF0;border-radius:22px;display:flex;align-items:center;transition:border-color .15s;}
    .iw.foc{border-color:#2D4A8A;background:#fff;}
    .ci{flex:1;padding:10px 16px;border:none;background:transparent;font-size:14px;font-family:inherit;outline:none;color:#111;}
    .sb{width:42px;height:42px;border-radius:50%;background:#2D4A8A;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
    .sb:hover:not(:disabled){background:#1E3A6E;}
    .sb:disabled{opacity:.4;cursor:not-allowed;}
  `]
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('msgBox') msgBox!: ElementRef<HTMLElement>;
  @ViewChild('inp')    inp!:    ElementRef<HTMLInputElement>;

  private http     = inject(HttpClient);
  private chatSvc  = inject(ChatService);
  readonly signalR = inject(SignalRService);
  private auth     = inject(AuthService);
  private route    = inject(ActivatedRoute);
  readonly router  = inject(Router);

  loading       = signal(true);
  msgs          = signal<Msg[]>([]);
  pName         = signal('');
  otherPhotoUrl = signal('');
  online  = signal(false);
  draft   = '';
  foc     = false;
  otherId = '';
  myId    = '';        // resolved after history loads

  // ── isMine: uses otherId NOT myId ─────────────────────────────────
  // A message is MINE if its senderId is NOT the other person.
  // This is 100% reliable — we always know otherId from the URL param.
  isMine(m: Msg): boolean {
    if (this.isTmp(m)) return true;               // tmp always mine
    return m.senderId !== this.otherId;            // not theirs = mine
  }
  isTmp(m: Msg): boolean { return m.id.startsWith('tmp_'); }

  ini(n: string): string {
    const p = (n||'').trim().split(' ');
    return ((p[0]?.[0]??'') + (p[1]?.[0]??'')).toUpperCase() || '?';
  }
  private C = ['#2D4A8A','#0F6E56','#D84040','#7C3AED','#0891B2'];
  clr(n: string): string { return this.C[(n?.charCodeAt(0)||0) % this.C.length]; }

  grouped(): {date:string;msgs:Msg[]}[] {
    const m = new Map<string,Msg[]>();
    for (const msg of this.msgs()) {
      const d = this.dl(msg.sentAt);
      if (!m.has(d)) m.set(d,[]);
      m.get(d)!.push(msg);
    }
    return [...m.entries()].map(([date,msgs]) => ({date,msgs}));
  }
  private dl(iso: string): string {
    const d = new Date(iso), now = new Date();
    const diff = Math.floor((now.getTime()-d.getTime())/86400000);
    if (diff===0) return 'Today';
    if (diff===1) return 'Yesterday';
    return d.toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'});
  }

  private subs: Subscription[] = [];
  private sp = false;

  /** Resolve myId using multiple fallbacks */
  private resolveMyId(msgs: Msg[]): void {
    // 1. JWT
    const jwt = this.auth.userId();
    if (jwt) { this.myId = jwt; console.log('[Chat] myId JWT:', jwt); return; }

    // 2. receiverId of messages sent BY other person → that's me
    const theirMsg = msgs.find(m => m.senderId === this.otherId && m.receiverId);
    if (theirMsg?.receiverId) {
      this.myId = theirMsg.receiverId;
      console.log('[Chat] myId from receiverId:', this.myId); return;
    }

    // 3. senderId of messages sent BY me (senderId !== otherId)
    const myMsg = msgs.find(m => m.senderId && m.senderId !== this.otherId);
    if (myMsg?.senderId) {
      this.myId = myMsg.senderId;
      console.log('[Chat] myId from senderId:', this.myId); return;
    }

    console.warn('[Chat] myId unknown — no history, JWT empty');
  }

  ngOnInit(): void {
    this.otherId = this.route.snapshot.paramMap.get('patientId') ?? '';
    this.myId    = this.auth.userId();
    console.log('[Chat] init — otherId:', this.otherId, 'myId:', this.myId || 'pending');

    // Load name
    this.chatSvc.getConversations().subscribe({
      next: (res: any) => {
        const list: any[] = Array.isArray(res)?res:res?.data?.items??res?.data??[];
        const c = list.find(x => (x.participantId??x.otherUserId??x.userId)===this.otherId);
        if (c) this.pName.set(c.participantName??c.otherUserName??'Patient');
      }
    });

    // Load history
    this.chatSvc.getHistory(this.otherId).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)?res:res?.data?.items??res?.data??[];
        const parsed = raw.map(toMsg).sort((a,b)=>
          new Date(a.sentAt).getTime()-new Date(b.sentAt).getTime());
        this.resolveMyId(parsed);
        console.log('[Chat] history:', parsed.length, 'myId:', this.myId);
        this.msgs.set(parsed);
        this.loading.set(false);
        this.sp = true;
        this.chatSvc.markRead(this.otherId).subscribe();
        this.signalR.markRead(this.otherId);
      },
      error: () => this.loading.set(false)
    });

    // Real-time
    this.subs.push(
      this.signalR.message$.subscribe((raw: any) => {
        const m   = toMsg(raw);
        const sid = m.senderId;
        const rid = m.receiverId;

        // Resolve myId from echo if still unknown
        if (!this.myId && rid && rid !== this.otherId) {
          this.myId = rid;
          console.log('[Chat] myId from echo receiverId:', this.myId);
        }
        if (!this.myId && sid && sid !== this.otherId) {
          this.myId = sid;
          console.log('[Chat] myId from echo senderId:', this.myId);
        }

        // Filter to this conversation only
        if (sid !== this.otherId && rid !== this.otherId) return;

        // Dedup
        if (this.msgs().some(x => x.id === m.id)) return;

        // Replace tmp
        const ti = this.msgs().findIndex(x => this.isTmp(x) && x.body === m.body);
        if (ti !== -1) {
          this.msgs.update(l => { const c=[...l]; c[ti]=m; return c; });
        } else {
          this.msgs.update(l => [...l, m]);
        }
        this.sp = true;
        if (sid === this.otherId) {
          this.chatSvc.markRead(this.otherId).subscribe();
          this.signalR.markRead(this.otherId);
        }
      }),
      this.signalR.read$out.subscribe((uid: string) => {
        if (uid===this.otherId)
          this.msgs.update(l=>l.map(m=>this.isMine(m)?{...m,isRead:true}:m));
      }),
      this.signalR.online$out.subscribe((id: string)  => { if(id===this.otherId) this.online.set(true); }),
      this.signalR.offline$out.subscribe((id: string) => { if(id===this.otherId) this.online.set(false); })
    );

    this.signalR.start();
    // Load other person's photo
    if (this.otherId) {
      this.http.get<any>(`${environment.apiUrl}/Profile/patientData`, {
        params: { userId: this.otherId }
      }).subscribe({
        next: (res: any) => {
          const d = res?.data ?? res;
          const pic = d?.profilePictureUrl ?? d?.avatarUrl ?? '';
          if (pic) this.otherPhotoUrl.set(pic);
        },
        error: () => {}
      });
    }
  }

  send(): void {
    const body = this.draft.trim();
    if (!body) return;
    this.draft = '';
    this.inp?.nativeElement.focus();
    // tmp message — isMine() returns true because id starts with 'tmp_'
    this.msgs.update(l => [...l, {
      id: 'tmp_'+Date.now(), senderId: this.myId||'me',
      receiverId: this.otherId, body,
      sentAt: new Date().toISOString(), isRead: false,
    }]);
    this.sp = true;
    this.signalR.sendMsg(this.otherId, body);
  }

  ngAfterViewChecked(): void {
    if (this.sp && this.msgBox?.nativeElement) {
      this.msgBox.nativeElement.scrollTop = this.msgBox.nativeElement.scrollHeight;
      this.sp = false;
    }
  }
  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }
}
