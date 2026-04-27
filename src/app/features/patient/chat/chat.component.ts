import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { AuthService }    from '../../../core/services/auth.service';
import { ChatService }    from '../../../core/services/chat.service';
import { environment }    from '../../../../environments/environment';

interface ChatMsg { id: string; senderId: string; text: string; sentAt: string; isRead: boolean; }

@Component({
  selector: 'app-patient-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-shell">

      <!-- Header -->
      <div class="chat-header">
        <div class="hdr-avatar">{{ initials(otherName()) }}</div>
        <div class="hdr-info">
          <div class="hdr-name">{{ otherName() }}</div>
          <div class="hdr-sub">Doctor</div>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages" #msgBox>
        <div class="loading-msg" *ngIf="loading()">
          <div class="spinner"></div>
        </div>
        <div *ngFor="let m of messages()" class="msg-row" [class.mine]="m.senderId === myId()">
          <div class="bubble" [class.mine]="m.senderId === myId()">
            <span>{{ m.text }}</span>
            <div class="time">{{ m.sentAt | date:'h:mm a' }}</div>
          </div>
        </div>
        <div class="empty-chat" *ngIf="!loading() && messages().length === 0">
          <p>No messages yet. Say hello!</p>
        </div>
      </div>

      <!-- Input -->
      <div class="input-bar">
        <input [(ngModel)]="draft" placeholder="Type a message..."
               class="chat-input" (keydown.enter)="send()" />
        <button class="send-btn" (click)="send()" [disabled]="!draft.trim()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-shell{display:flex;flex-direction:column;height:calc(100vh - 60px);max-width:700px;}
    .chat-header{display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border-bottom:1px solid #f0f0f0;flex-shrink:0;}
    .hdr-avatar{width:42px;height:42px;border-radius:50%;background:#D84040;color:#fff;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .hdr-name{font-size:15px;font-weight:700;color:#111;}.hdr-sub{font-size:12px;color:#888;}
    .messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;background:#F7F8FA;}
    .loading-msg{display:flex;justify-content:center;padding:20px;}
    .spinner{width:24px;height:24px;border:3px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .msg-row{display:flex;}.msg-row.mine{justify-content:flex-end;}
    .bubble{max-width:72%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;background:#fff;color:#111;box-shadow:0 1px 3px rgba(0,0,0,.06);}
    .bubble.mine{background:#D84040;color:#fff;}
    .time{font-size:10px;opacity:.6;margin-top:4px;text-align:right;}
    .empty-chat{text-align:center;color:#aaa;font-size:14px;padding:40px 0;}
    .input-bar{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-top:1px solid #f0f0f0;flex-shrink:0;}
    .chat-input{flex:1;padding:10px 14px;border:1.5px solid #e8e8e8;border-radius:20px;font-size:14px;outline:none;font-family:'Cairo',sans-serif;}
    .chat-input:focus{border-color:#D84040;}
    .send-btn{width:40px;height:40px;border-radius:50%;background:#D84040;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
    .send-btn:disabled{opacity:.5;cursor:not-allowed;}
  `],
})
export class PatientChatComponent implements OnInit, OnDestroy {
  @ViewChild('msgBox') msgBox?: ElementRef;

  private chatSvc = inject(ChatService);
  private auth    = inject(AuthService);
  private route   = inject(ActivatedRoute);
  private http    = inject(HttpClient);

  messages  = signal<ChatMsg[]>([]);
  loading   = signal(true);
  draft     = '';
  otherName = signal('Doctor');
  otherUserId = '';

  myId(): string { return this.auth.userId(); }

  initials(name: string): string {
    return name.split(' ').map((n: string) => n[0] ?? '').join('').slice(0,2).toUpperCase();
  }

  ngOnInit(): void {
    this.otherUserId = this.route.snapshot.paramMap.get('doctorId') ?? '';
    this.loadHistory();
    // Mark as read
    if (this.otherUserId) {
      this.chatSvc.markRead(this.otherUserId).subscribe();
    }
  }

  loadHistory(): void {
    if (!this.otherUserId) { this.loading.set(false); return; }
    this.chatSvc.getHistory(this.otherUserId).subscribe({
      next: (res: any) => {
        const list = res?.data?.items ?? res?.data ?? res ?? [];
        this.messages.set(list);
        this.loading.set(false);
        this.scrollBottom();
      },
      error: () => this.loading.set(false),
    });
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || !this.otherUserId) return;
    // Optimistic update
    const msg: ChatMsg = {
      id: Date.now().toString(), senderId: this.myId(),
      text, sentAt: new Date().toISOString(), isRead: false,
    };
    this.messages.update((m: ChatMsg[]) => [...m, msg]);
    this.draft = '';
    this.scrollBottom();
    // Send via HTTP (no SignalR send endpoint in swagger - backend may use SignalR hub)
    this.http.post<any>(`${environment.apiUrl}/Chat/send`, {
      receiverId: this.otherUserId, message: text
    }).subscribe({ error: () => {} }); // fail silently - msg already shown optimistically
  }

  scrollBottom(): void {
    setTimeout(() => {
      if (this.msgBox) {
        const el = this.msgBox.nativeElement as HTMLElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  ngOnDestroy(): void {}
}
