import { Component, OnInit, OnDestroy, inject, signal,
         ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule }                            from '@angular/common';
import { FormsModule }                             from '@angular/forms';
import { ActivatedRoute }                          from '@angular/router';
import { Subscription }                            from 'rxjs';
import { SignalRService }                          from '../../../core/services/signalr.service';
import { AuthService }                             from '../../../core/services/auth.service';
import { ChatMessage }                             from '../../../core/models/api.models';

@Component({
  selector: 'app-patient-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">
      <!-- Header -->
      <div class="chat-header">
        <div class="doc-avatar">{{ doctorInitials }}</div>
        <div>
          <div class="doc-name">{{ doctorName }}</div>
          <div class="online-status" [class.online]="signalR.connected()">
            {{ signalR.connected() ? 'Online' : 'Offline' }}
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages" #msgContainer>
        <div class="date-divider">Today</div>

        <div class="msg-wrap" *ngFor="let m of messages()"
             [class.mine]="m.senderId === myId()">
          <div class="msg-bubble" [class.mine]="m.senderId === myId()">
            <p>{{ m.body }}</p>
            <div class="msg-meta">
              {{ m.sentAt | date:'h:mm a' }}
              <span *ngIf="m.senderId === myId()" class="read-tick" [class.read]="m.isRead">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            </div>
          </div>
        </div>

        <div class="empty-chat" *ngIf="messages().length === 0">
          <div class="empty-icon">💬</div>
          <p>Start a conversation with your doctor</p>
        </div>
      </div>

      <!-- Input -->
      <div class="input-bar">
        <button class="attach-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <input [(ngModel)]="text" placeholder="Type a message..." class="msg-input"
               (keydown.enter)="send()" />
        <button class="send-btn" [disabled]="!text.trim()" (click)="send()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-page { display:flex; flex-direction:column; height:calc(100vh - 68px); background:#F7F8FA; max-width:640px; margin:0 auto; }
    .chat-header { display:flex; align-items:center; gap:12px; padding:12px 16px; background:#fff; border-bottom:1px solid #f0f0f0; flex-shrink:0; }
    .doc-avatar  { width:40px; height:40px; border-radius:50%; background:#D84040; color:#fff; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .doc-name    { font-size:15px; font-weight:600; color:#111; }
    .online-status { font-size:12px; color:#888; }
    .online-status.online { color:#22c55e; }

    .messages    { flex:1; overflow-y:auto; padding:12px 16px; display:flex; flex-direction:column; gap:8px; }
    .date-divider { text-align:center; font-size:12px; color:#aaa; margin:4px 0 8px; }

    .msg-wrap    { display:flex; }
    .msg-wrap.mine { justify-content:flex-end; }

    .msg-bubble  { max-width:75%; padding:10px 13px; border-radius:16px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.07); border-bottom-left-radius:4px; }
    .msg-bubble.mine { background:#D84040; color:#fff; border-bottom-left-radius:16px; border-bottom-right-radius:4px; }
    .msg-bubble p    { font-size:14px; line-height:1.4; margin:0 0 4px; }
    .msg-bubble.mine p { color:#fff; }
    .msg-meta    { font-size:10px; color:#aaa; display:flex; align-items:center; gap:3px; justify-content:flex-end; }
    .msg-bubble.mine .msg-meta { color:rgba(255,255,255,0.6); }
    .read-tick.read { color:rgba(255,255,255,0.9); }

    .empty-chat  { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#aaa; gap:8px; }
    .empty-icon  { font-size:40px; }
    .empty-chat p { font-size:14px; }

    .input-bar   { display:flex; align-items:center; gap:8px; padding:10px 12px; background:#fff; border-top:1px solid #f0f0f0; flex-shrink:0; }
    .attach-btn  { width:36px; height:36px; border-radius:50%; border:none; background:#f0f0f0; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#888; flex-shrink:0; }
    .msg-input   { flex:1; padding:10px 14px; border:1.5px solid #e8e8e8; border-radius:20px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; background:#f8f8f8; }
    .msg-input:focus { border-color:#D84040; background:#fff; }
    .send-btn    { width:40px; height:40px; border-radius:50%; background:#D84040; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
    .send-btn:disabled { opacity:0.5; cursor:not-allowed; }
  `],
})
export class PatientChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('msgContainer') msgContainer!: ElementRef;

  readonly signalR = inject(SignalRService);
  private  auth    = inject(AuthService);
  private  route   = inject(ActivatedRoute);

  messages     = signal<ChatMessage[]>([]);
  text         = '';
  doctorId     = '';
  doctorName   = 'Doctor';
  doctorInitials = 'DR';
  private sub?: Subscription;
  private shouldScroll = false;

  myId() { return this.auth.userId(); }

  ngOnInit(): void {
    this.doctorId = this.route.snapshot.paramMap.get('doctorId') ?? '';
    // Subscribe to incoming messages
    this.sub = this.signalR.message$.subscribe(msg => {
      if (msg.senderId === this.doctorId || msg.receiverId === this.doctorId) {
        this.messages.update(m => [...m, msg]);
        this.shouldScroll = true;
      }
    });
  }

  send(): void {
    if (!this.text.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(), senderId: this.myId()!, senderName: '',
      receiverId: this.doctorId, body: this.text.trim(),
      sentAt: new Date().toISOString(), isRead: false, attachmentUrl: null,
    };
    this.messages.update(m => [...m, msg]);
    this.signalR.send('SendMessage', this.doctorId, this.text.trim());
    this.text = '';
    this.shouldScroll = true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.msgContainer) {
      const el = this.msgContainer.nativeElement as HTMLElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
