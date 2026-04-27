import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription }   from 'rxjs';
import { SignalRService } from '../../../../core/services/signalr.service';
import { AuthService }    from '../../../../core/services/auth.service';
import { DoctorService }  from '../../../../core/services/doctor.service';
import { ChatMessage, PatientProfile } from '../../../../core/models/api.models';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="chat-page">
      <div class="chat-header">
        <button class="back-btn" (click)="router.navigate(['/doctor/chat'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="header-patient" *ngIf="patient()">
          <div class="pat-avatar">{{ initials() }}</div>
          <div>
            <div class="pat-name">{{ patient()!.firstName }} {{ patient()!.lastName }}</div>
            <div class="online-dot" [class.online]="signalR.connected()">{{ signalR.connected() ? 'Online' : 'Offline' }}</div>
          </div>
        </div>
        <a [routerLink]="['/doctor/patients', patientId]" class="view-btn">View Profile</a>
      </div>
      <div class="messages" #msgContainer>
        <div class="msg-wrap" *ngFor="let m of messages()" [class.mine]="m.senderId === myId()">
          <div class="msg-bubble" [class.mine]="m.senderId === myId()">
            <p>{{ m.body }}</p>
            <div class="msg-time">{{ m.sentAt | date:'h:mm a' }}</div>
          </div>
        </div>
        <div class="empty-chat" *ngIf="messages().length === 0">
          <div class="empty-icon-wrap"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
          <p>Start the conversation</p>
        </div>
      </div>
      <div class="input-bar">
        <input [(ngModel)]="text" placeholder="Type a message..." class="msg-input" (keydown.enter)="send()" />
        <button class="send-btn" [disabled]="!text.trim()" (click)="send()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-page { display:flex; flex-direction:column; height:calc(100vh - 68px); background:#F7F8FA; max-width:640px; margin:0 auto; }
    .chat-header { display:flex; align-items:center; gap:10px; padding:12px 16px; background:#fff; border-bottom:1px solid #f0f0f0; flex-shrink:0; }
    .back-btn { background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; }
    .header-patient { flex:1; display:flex; align-items:center; gap:10px; }
    .pat-avatar { width:38px; height:38px; border-radius:50%; background:#2D4A8A; color:#fff; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .pat-name   { font-size:14px; font-weight:600; color:#111; }
    .online-dot { font-size:11px; color:#888; }
    .online-dot.online { color:#22c55e; }
    .view-btn   { font-size:12px; color:#2D4A8A; font-weight:600; text-decoration:none; padding:4px 10px; border:1px solid #2D4A8A; border-radius:8px; white-space:nowrap; }
    .messages   { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; }
    .msg-wrap   { display:flex; }
    .msg-wrap.mine { justify-content:flex-end; }
    .msg-bubble { max-width:78%; padding:10px 14px; border-radius:16px; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.07); border-bottom-left-radius:4px; }
    .msg-bubble.mine { background:#2D4A8A; color:#fff; border-bottom-left-radius:16px; border-bottom-right-radius:4px; }
    .msg-bubble p { font-size:14px; line-height:1.4; margin:0 0 3px; }
    .msg-time   { font-size:10px; opacity:0.6; text-align:right; }
    .empty-chat { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:#888; }
    .empty-icon-wrap { width:56px; height:56px; background:#f0f0f0; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .empty-chat p { font-size:14px; }
    .input-bar  { display:flex; align-items:center; gap:8px; padding:10px 12px; background:#fff; border-top:1px solid #f0f0f0; flex-shrink:0; }
    .msg-input  { flex:1; padding:10px 14px; border:1.5px solid #e8e8e8; border-radius:20px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; background:#f8f8f8; }
    .msg-input:focus { border-color:#2D4A8A; background:#fff; }
    .send-btn   { width:40px; height:40px; border-radius:50%; background:#2D4A8A; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
    .send-btn:disabled { opacity:0.5; cursor:not-allowed; }
  `],
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('msgContainer') msgContainer!: ElementRef;
  readonly signalR = inject(SignalRService);
  private auth     = inject(AuthService);
  private svc      = inject(DoctorService);
  readonly router  = inject(Router);
  private route    = inject(ActivatedRoute);
  messages  = signal<ChatMessage[]>([]);
  patient   = signal<PatientProfile | null>(null);
  text      = ''; patientId = '';
  private sub?: Subscription;
  private shouldScroll = false;
  myId() { return this.auth.userId(); }
  initials(): string { const p = this.patient()!; return p ? (p.firstName[0] + p.lastName[0]).toUpperCase() : ''; }
  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('patientId')!;
    this.svc.getPatientById(this.patientId).subscribe(res => this.patient.set(res.data));
    this.sub = this.signalR.message$.subscribe(msg => {
      if (msg.senderId === this.patientId || msg.receiverId === this.patientId) {
        this.messages.update(m => [...m, msg]);
        this.shouldScroll = true;
      }
    });
  }
  send(): void {
    if (!this.text.trim()) return;
    const msg: ChatMessage = { id: Date.now().toString(), senderId: this.myId()!, senderName: '', receiverId: this.patientId, body: this.text.trim(), sentAt: new Date().toISOString(), isRead: false, attachmentUrl: null };
    this.messages.update(m => [...m, msg]);
    this.signalR.send('SendMessage', this.patientId, this.text.trim());
    this.text = ''; this.shouldScroll = true;
  }
  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.msgContainer) { const el = this.msgContainer.nativeElement as HTMLElement; el.scrollTop = el.scrollHeight; this.shouldScroll = false; }
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
