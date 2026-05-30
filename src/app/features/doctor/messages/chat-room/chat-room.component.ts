import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  inject, signal, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription }        from 'rxjs';
import { ChatService }         from '../../../../core/services/chat.service';
import { SignalRService }      from '../../../../core/services/signalr.service';
import { AuthService }         from '../../../../core/services/auth.service';
import { DoctorService }       from '../../../../core/services/doctor.service';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">

      <!-- ── Header ── -->
      <div class="chat-header">
        <button class="back-btn" (click)="router.navigate(['/doctor/chat'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="hdr-info">
          <div class="hdr-av" [style.background]="colorOf(pName())">{{ ini(pName()) }}</div>
          <div>
            <div class="hdr-name">{{ pName() || 'Loading...' }}</div>
            <div class="hdr-status" [class.online]="isOnline()">
              <span class="status-dot"></span>
              {{ isOnline() ? 'Online' : 'Offline' }}
            </div>
          </div>
        </div>
        <button class="btn-view" (click)="router.navigate(['/doctor/patients', patientId])">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profile
        </button>
      </div>

      <!-- ── Messages ── -->
      <div class="messages" #msgContainer>

        <div class="msgs-loading" *ngIf="loadingMsgs()">
          <div class="spinner"></div>
        </div>

        <div class="chat-empty" *ngIf="!loadingMsgs() && msgs().length === 0">
          <div class="chat-empty-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p>No messages yet</p>
          <p class="chat-empty-sub">Send a message to start the conversation</p>
        </div>

        <!-- Date separators + bubbles -->
        <ng-container *ngFor="let item of groupedMsgs(); let i = index">
          <div class="date-sep" *ngIf="item.showDate">
            <span>{{ item.dateLabel }}</span>
          </div>
          <div class="bubble-row" [class.mine]="item.mine">
            <div class="bubble" [class.mine]="item.mine" [class.theirs]="!item.mine">
              <p>{{ msgBody(item.msg) }}</p>
              <div class="bubble-meta">
                <span class="bubble-time">{{ msgTime(item.msg) | date:'h:mm a' }}</span>
                <!-- Read receipt for my messages -->
                <ng-container *ngIf="item.mine">
                  <svg *ngIf="item.msg.isRead" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg *ngIf="!item.msg.isRead" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </ng-container>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Typing indicator -->
        <div class="typing-indicator" *ngIf="patientTyping">
          <div class="typing-av" [style.background]="colorOf(pName())">{{ ini(pName()) }}</div>
          <div class="typing-bubble">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>

      </div>

      <!-- ── Input bar ── -->
      <div class="input-bar">
        <button class="icon-btn" title="Attach">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <input
          [(ngModel)]="text"
          placeholder="Type a message..."
          class="msg-input"
          (keydown.enter)="send()"
          [disabled]="sending()"
          #inputEl
        />
        <button class="send-btn" (click)="send()" [disabled]="!text.trim() || sending()">
          <span class="mini-spin" *ngIf="sending()"></span>
          <svg *ngIf="!sending()" width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }

    .chat-page {
      display:flex; flex-direction:column;
      height:calc(100vh - 68px); max-width:720px; margin:0 auto;
      background:#F0F2F5; font-family:'Cairo','Segoe UI',sans-serif;
    }

    /* Header */
    .chat-header { display:flex; align-items:center; gap:10px; padding:12px 16px; background:#fff; border-bottom:1px solid #f0f0f0; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,.06); }
    .back-btn { background:none; border:none; cursor:pointer; padding:6px; display:flex; border-radius:8px; color:#555; }
    .back-btn:hover { background:#f5f5f5; }
    .hdr-info { flex:1; display:flex; align-items:center; gap:10px; }
    .hdr-av { width:40px; height:40px; border-radius:50%; color:#fff; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .hdr-name { font-size:15px; font-weight:700; color:#111; }
    .hdr-status { font-size:11px; color:#aaa; display:flex; align-items:center; gap:4px; margin-top:1px; }
    .hdr-status.online { color:#22c55e; }
    .status-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
    .btn-view { display:flex; align-items:center; gap:5px; font-size:12px; color:#2D4A8A; font-weight:600; padding:6px 12px; border:1.5px solid #2D4A8A; border-radius:8px; background:#fff; cursor:pointer; font-family:inherit; white-space:nowrap; flex-shrink:0; }
    .btn-view:hover { background:#EEF2FF; }

    /* Messages */
    .messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:2px; }
    .msgs-loading { display:flex; justify-content:center; padding:32px; }
    .spinner { width:24px; height:24px; border:2px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}

    .chat-empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:48px 20px; margin:auto; text-align:center; }
    .chat-empty-icon { width:64px; height:64px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 6px rgba(0,0,0,.07); }
    .chat-empty p { font-size:15px; font-weight:700; color:#444; }
    .chat-empty-sub { font-size:13px; color:#aaa !important; font-weight:400 !important; }

    /* Date separator */
    .date-sep { display:flex; align-items:center; justify-content:center; margin:10px 0 6px; }
    .date-sep span { background:#e0e0e0; color:#666; font-size:11px; font-weight:600; padding:3px 12px; border-radius:12px; }

    /* Bubble */
    .bubble-row { display:flex; margin-bottom:4px; }
    .bubble-row.mine { justify-content:flex-end; }
    .bubble-row:not(.mine) { justify-content:flex-start; }
    .bubble { max-width:72%; padding:10px 14px; border-radius:18px; word-break:break-word; }
    .bubble.theirs { background:#fff; border-radius:4px 18px 18px 18px; box-shadow:0 1px 4px rgba(0,0,0,.07); }
    .bubble.mine   { background:#2D4A8A; color:#fff; border-radius:18px 18px 4px 18px; }
    .bubble p { font-size:14px; line-height:1.55; }
    .bubble.theirs p { color:#111; }
    .bubble.mine   p { color:#fff; }
    .bubble-meta { display:flex; align-items:center; justify-content:flex-end; gap:4px; margin-top:4px; }
    .bubble-time { font-size:10px; opacity:.7; }
    .bubble.theirs .bubble-time { color:#888; }
    .bubble.mine   .bubble-time { color:rgba(255,255,255,.8); }

    /* Typing */
    .typing-indicator { display:flex; align-items:flex-end; gap:8px; margin-top:4px; }
    .typing-av { width:28px; height:28px; border-radius:50%; color:#fff; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .typing-bubble { background:#fff; border-radius:4px 18px 18px 18px; padding:12px 14px; display:flex; gap:4px; box-shadow:0 1px 4px rgba(0,0,0,.07); }
    .dot { width:7px; height:7px; background:#aaa; border-radius:50%; animation:bounce 1.4s infinite; }
    .dot:nth-child(2){ animation-delay:.2s; }
    .dot:nth-child(3){ animation-delay:.4s; }
    @keyframes bounce{ 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    /* Input bar */
    .input-bar { display:flex; align-items:center; gap:8px; padding:10px 14px; background:#fff; border-top:1px solid #f0f0f0; flex-shrink:0; box-shadow:0 -1px 4px rgba(0,0,0,.04); }
    .icon-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; display:flex; flex-shrink:0; }
    .icon-btn:hover { background:#f5f5f5; }
    .msg-input { flex:1; padding:10px 16px; border:1.5px solid #e8e8e8; border-radius:22px; font-size:14px; font-family:inherit; outline:none; background:#F7F8FA; transition:border-color .15s; }
    .msg-input:focus { border-color:#2D4A8A; background:#fff; }
    .msg-input:disabled { opacity:.6; }
    .send-btn { width:44px; height:44px; background:#2D4A8A; border:none; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .15s; }
    .send-btn:hover:not(:disabled) { background:#1E3A6E; transform:scale(1.05); }
    .send-btn:disabled { opacity:.45; cursor:not-allowed; }
    .mini-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
  `]
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('msgContainer') private msgContainer!: ElementRef;

  readonly router  = inject(Router);
  private route    = inject(ActivatedRoute);
  readonly signalR = inject(SignalRService);
  private auth     = inject(AuthService);
  private chatSvc  = inject(ChatService);
  private docSvc   = inject(DoctorService);

  loadingMsgs  = signal(true);
  sending      = signal(false);
  msgs         = signal<any[]>([]);
  pName        = signal('');

  text         = '';
  patientId    = '';
  patientTyping = false;
  private subs: Subscription[] = [];
  private shouldScroll = false;

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadPatientName();
    this.loadHistory();
    this.signalR.startConnection();

    // Incoming real-time message
    this.subs.push(this.signalR.message$.subscribe((m: any) => {
      const sid = String(m.senderId ?? m.fromUserId ?? '');
      if (sid === this.patientId) {
        this.msgs.update(ms => [...ms, m]);
        this.shouldScroll = true;
        this.signalR.markAsRead(this.patientId);
      }
    }));

    // Read receipts — mark our messages as read
    this.subs.push(this.signalR.messagesRead$.subscribe((byUserId: string) => {
      if (byUserId === this.patientId) {
        this.msgs.update(ms => ms.map(m => ({ ...m, isRead: true })));
      }
    }));
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) { this.scrollBottom(); this.shouldScroll = false; }
  }

  private loadPatientName(): void {
    this.docSvc.getPatients().subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        const p = list.find((x: any) => String(x.id ?? x.patientId) === this.patientId);
        this.pName.set(p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : 'Patient');
      }
    });
  }

  loadHistory(): void {
    this.loadingMsgs.set(true);
    this.chatSvc.getHistory(this.patientId).subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        this.msgs.set(list);
        this.loadingMsgs.set(false);
        this.shouldScroll = true;
        this.signalR.markAsRead(this.patientId);
      },
      error: () => this.loadingMsgs.set(false),
    });
  }

  /** Group messages with date separators */
  groupedMsgs(): Array<{msg:any, mine:boolean, showDate:boolean, dateLabel:string}> {
    const result: any[] = [];
    let lastDate = '';
    for (const msg of this.msgs()) {
      const d = new Date(this.msgTime(msg));
      const dateStr = d.toDateString();
      const showDate = dateStr !== lastDate;
      lastDate = dateStr;
      result.push({ msg, mine: this.isMe(msg), showDate, dateLabel: this.dateLabel(d) });
    }
    return result;
  }

  send(): void {
    const body = this.text.trim();
    if (!body || this.sending()) return;
    this.text = '';
    this.sending.set(true);

    const optimistic = { senderId: this.myId(), body, messageContent: body, sentAt: new Date().toISOString(), isRead: false, isOptimistic: true };
    this.msgs.update(ms => [...ms, optimistic]);
    this.shouldScroll = true;

    // Send via SignalR (matches Flutter exactly)
    this.signalR.sendMessage(this.patientId, body)
      .then(() => this.sending.set(false))
      .catch(() => this.sending.set(false));
  }

  isMe(m: any): boolean { return String(m.senderId ?? m.fromUserId) === String(this.myId()); }
  myId(): string {
    const u = this.auth.currentUser() as any;
    return u?.sub ?? u?.nameid ?? u?.id ?? '';
  }
  isOnline(): boolean { return this.signalR.isUserOnline(this.patientId); }
  msgBody(m: any): string { return m.body ?? m.messageContent ?? m.content ?? m.message ?? ''; }
  msgTime(m: any): string | Date { return m.sentAt ?? m.createdAt ?? m.timestamp ?? new Date(); }
  ini(n: string): string { return (n||'?').split(' ').map((x:string)=>x[0]||'').join('').slice(0,2).toUpperCase()||'?'; }
  colorOf(n: string): string { const c=['#2D4A8A','#D84040','#0F6E56','#7C3AED','#0891B2','#d4a017']; return c[(n||'').charCodeAt(0)%c.length]||'#2D4A8A'; }

  private dateLabel(d: Date): string {
    const today = new Date(); const yesterday = new Date(); yesterday.setDate(today.getDate()-1);
    if (d.toDateString()===today.toDateString()) return 'Today';
    if (d.toDateString()===yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'});
  }
  private scrollBottom(): void {
    try { this.msgContainer.nativeElement.scrollTop = this.msgContainer.nativeElement.scrollHeight; } catch{}
  }
}
