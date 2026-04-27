import { Component, inject, signal,
         ViewChild, ElementRef,
         AfterViewChecked }            from '@angular/core';
import { CommonModule }                from '@angular/common';
import { FormsModule }                 from '@angular/forms';
import { AiService }                   from '../../../core/services/ai.service';

interface Message { role: 'user'|'assistant'; text: string; time: Date; }

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">
      <div class="chat-header">
        <div class="ai-avatar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </div>
        <div>
          <div class="ai-name">Wateen AI</div>
          <div class="ai-status">Health assistant</div>
        </div>
      </div>

      <div class="disclaimer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        This AI provides general health guidance only and does not replace professional medical advice.
      </div>

      <div class="messages" #msgContainer>
        <div class="msg-wrap assistant" *ngIf="messages().length === 0">
          <div class="msg-bubble assistant">
            Hello! I'm your Wateen health assistant 👋<br><br>
            I can help with symptom guidance, medication questions, and finding the right specialist.
          </div>
        </div>
        <div class="quick-prompts" *ngIf="messages().length === 0">
          <button *ngFor="let q of quickPrompts" class="quick-btn" (click)="sendMessage(q)">{{ q }}</button>
        </div>
        <div class="msg-wrap" *ngFor="let m of messages()" [class]="m.role">
          <div class="msg-bubble" [class]="m.role">
            <span [innerHTML]="fmtText(m.text)"></span>
            <div class="msg-time">{{ m.time | date:'h:mm a' }}</div>
          </div>
        </div>
        <div class="msg-wrap assistant" *ngIf="thinking()">
          <div class="msg-bubble assistant typing">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>

      <div class="input-bar">
        <input [(ngModel)]="inputText"
               placeholder="Ask about symptoms, medications..."
               class="msg-input"
               (keydown.enter)="onEnter($event)"
               [disabled]="thinking()" />
        <button class="send-btn" (click)="sendMessage()" [disabled]="!inputText.trim() || thinking()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-page{display:flex;flex-direction:column;height:calc(100vh - 60px);background:#F7F8FA;max-width:640px;margin:0 auto;}
    .chat-header{display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border-bottom:1px solid #f0f0f0;flex-shrink:0;}
    .ai-avatar{width:42px;height:42px;border-radius:50%;background:#D84040;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .ai-name{font-size:15px;font-weight:700;color:#111;}.ai-status{font-size:12px;color:#22c55e;}
    .disclaimer{display:flex;align-items:flex-start;gap:6px;background:#FEF9E7;border-bottom:1px solid #FDE68A;padding:8px 16px;font-size:12px;color:#92400E;flex-shrink:0;line-height:1.4;}
    .messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}
    .msg-wrap{display:flex;}.msg-wrap.user{justify-content:flex-end;}.msg-wrap.assistant{justify-content:flex-start;}
    .msg-bubble{max-width:80%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;}
    .msg-bubble.user{background:#D84040;color:#fff;border-bottom-right-radius:4px;}
    .msg-bubble.assistant{background:#fff;color:#111;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.07);}
    .msg-time{font-size:10px;opacity:.6;margin-top:4px;text-align:right;}
    .typing{display:flex;align-items:center;gap:4px;padding:12px 16px;}
    .dot{width:7px;height:7px;border-radius:50%;background:#D84040;animation:bounce .9s infinite;}
    .dot:nth-child(2){animation-delay:.15s;}.dot:nth-child(3){animation-delay:.3s;}
    @keyframes bounce{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1.1);opacity:1}}
    .quick-prompts{display:flex;flex-direction:column;gap:6px;align-self:flex-start;margin-top:4px;}
    .quick-btn{background:#fff;border:1.5px solid #e8e8e8;border-radius:20px;padding:8px 14px;font-size:13px;color:#555;cursor:pointer;text-align:left;}
    .quick-btn:hover{border-color:#D84040;color:#D84040;background:#FEF2F2;}
    .input-bar{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-top:1px solid #f0f0f0;flex-shrink:0;}
    .msg-input{flex:1;padding:10px 14px;border:1.5px solid #e8e8e8;border-radius:20px;font-size:14px;outline:none;background:#f8f8f8;}
    .msg-input:focus{border-color:#D84040;background:#fff;}.msg-input:disabled{opacity:.6;}
    .send-btn{width:40px;height:40px;border-radius:50%;background:#D84040;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
    .send-btn:disabled{opacity:.5;cursor:not-allowed;}
  `],
})
export class AiAssistantComponent implements AfterViewChecked {
  @ViewChild('msgContainer') msgContainer?: ElementRef;

  private ai = inject(AiService);

  messages   = signal<Message[]>([]);
  thinking   = signal(false);
  inputText  = '';
  private conversationId = '';
  private shouldScroll   = false;

  quickPrompts = [
    'I have a headache and fever',
    'What foods should I avoid with diabetes?',
    'How often should I check my blood pressure?',
    'What does a high glucose reading mean?',
  ];

  onEnter(e: Event): void { e.preventDefault(); this.sendMessage(); }

  sendMessage(text?: string): void {
    const msg = (text ?? this.inputText).trim();
    if (!msg) return;
    this.messages.update((m: Message[]) => [...m, { role: 'user', text: msg, time: new Date() }]);
    this.inputText = '';
    this.thinking.set(true);
    this.shouldScroll = true;
    this.ai.chat({ message: msg, conversationId: this.conversationId || undefined })
      .subscribe({
        next: (res: any) => {
          const d = res?.data ?? res;
          this.conversationId = d?.conversationId ?? '';
          const reply = d?.reply ?? d?.message ?? 'Here is what I found.';
          const disc  = d?.disclaimer ? `\n\n_${d.disclaimer}_` : '';
          this.messages.update((m: Message[]) => [...m, { role: 'assistant', text: reply + disc, time: new Date() }]);
          this.thinking.set(false);
          this.shouldScroll = true;
        },
        error: () => {
          this.messages.update((m: Message[]) => [...m, { role: 'assistant', text: 'Sorry, I had trouble responding. Please try again.', time: new Date() }]);
          this.thinking.set(false);
          this.shouldScroll = true;
        },
      });
  }

  fmtText(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.msgContainer) {
      const el = this.msgContainer.nativeElement as HTMLElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }
}
