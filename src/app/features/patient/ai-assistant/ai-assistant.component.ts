import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { HttpClient }    from '@angular/common/http';
import { AiService }     from '../../../core/services/ai.service';
import { environment }   from '../../../../environments/environment';

interface ChatMessage { role: 'user' | 'assistant'; text: string; time: Date; results?: DiagResult[]; redFlags?: string[]; }
interface DiagResult  { predicted_disease: string; doctor: string; overview: string; treatment: string; when_to_see_doctor: string; score: number; }

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">

      <!-- Header -->
      <div class="chat-header">
        <div class="ai-avatar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </div>
        <div>
          <div class="ai-name">Wateen AI</div>
          <div class="ai-status">● Health Assistant</div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        This AI provides general guidance only and does not replace professional medical advice.
      </div>

      <!-- Messages -->
      <div class="messages" #msgContainer>

        <!-- Welcome -->
        <ng-container *ngIf="messages().length === 0">
          <div class="welcome-card">
            <div class="welcome-avatar">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            </div>
            <h3>Hello! I'm Wateen AI 👋</h3>
            <p>Describe your symptoms and I'll suggest possible conditions, recommended specialists, and what to do next.</p>
          </div>
          <div class="quick-chips">
            <button class="chip" *ngFor="let q of quickPrompts" (click)="send(q)">{{ q }}</button>
          </div>
        </ng-container>

        <!-- Message bubbles -->
        <div *ngFor="let m of messages()" class="msg-group" [class.user-group]="m.role==='user'">

          <!-- User message -->
          <div class="bubble user" *ngIf="m.role==='user'">
            {{ m.text }}
            <div class="time">{{ m.time | date:'h:mm a' }}</div>
          </div>

          <!-- AI text message -->
          <div class="bubble assistant" *ngIf="m.role==='assistant' && !m.results">
            <span [innerHTML]="fmt(m.text)"></span>
            <div class="time">{{ m.time | date:'h:mm a' }}</div>
          </div>

          <!-- AI diagnosis results -->
          <div class="diagnosis-wrap" *ngIf="m.role==='assistant' && m.results">
            <div class="diag-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              AI Diagnosis Results
              <span class="diag-time">{{ m.time | date:'h:mm a' }}</span>
            </div>

            <!-- Red flags -->
            <div class="red-flags" *ngIf="m.redFlags && m.redFlags.length > 0">
              <div class="rf-title">⚠️ Important Warning Signs</div>
              <div class="rf-item" *ngFor="let rf of m.redFlags">{{ rf }}</div>
            </div>

            <!-- Results cards -->
            <div class="result-card" *ngFor="let r of m.results; let i = index" [class.top-result]="i===0">
              <div class="result-header">
                <div class="result-rank" [class.rank-1]="i===0" [class.rank-2]="i===1" [class.rank-3]="i===2">
                  {{ i===0 ? '🥇' : i===1 ? '🥈' : '🥉' }}
                </div>
                <div class="result-main">
                  <div class="disease-name">{{ r.predicted_disease }}</div>
                  <div class="confidence-row">
                    <div class="conf-bar"><div class="conf-fill" [style.width]="r.score + '%'"></div></div>
                    <span class="conf-pct">{{ r.score.toFixed(1) }}% match</span>
                  </div>
                </div>
                <div class="specialist-badge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {{ r.doctor }}
                </div>
              </div>

              <!-- Expandable details -->
              <div class="result-details" *ngIf="expandedResult===i">
                <div class="detail-section">
                  <div class="detail-label">Overview</div>
                  <div class="detail-text">{{ r.overview }}</div>
                </div>
                <div class="detail-section">
                  <div class="detail-label">Treatment</div>
                  <div class="detail-text">{{ r.treatment }}</div>
                </div>
                <div class="detail-section warning-section">
                  <div class="detail-label">⚕️ When to See a Doctor</div>
                  <div class="detail-text">{{ r.when_to_see_doctor }}</div>
                </div>
              </div>

              <button class="toggle-btn" (click)="toggleResult(i)">
                {{ expandedResult===i ? 'Hide Details ▲' : 'See Details ▼' }}
              </button>
            </div>

            <div class="diag-note">
              ℹ️ This is a preliminary AI assessment, not a final medical diagnosis.
            </div>
          </div>
        </div>

        <!-- Thinking indicator -->
        <div class="msg-group" *ngIf="thinking()">
          <div class="bubble assistant typing">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>

      </div>

      <!-- Input -->
      <div class="input-bar">
        <!-- Image upload for food calorie detection -->
        <label class="img-btn" title="Upload food image for calorie analysis">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <input type="file" accept="image/*" (change)="onImage($event)" hidden [disabled]="thinking()" />
        </label>
        <input [(ngModel)]="inputText"
               placeholder="Describe symptoms or upload food image..."
               class="msg-input"
               (keydown.enter)="onEnter($event)"
               [disabled]="thinking()" />
        <button class="send-btn" (click)="send()" [disabled]="!inputText.trim() || thinking()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .chat-page { display:flex; flex-direction:column; height:calc(100vh - 60px); background:#F7F8FA; max-width:680px; margin:0 auto; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .chat-page { height:calc(100vh - 56px); } }

    /* Header */
    .chat-header { display:flex; align-items:center; gap:12px; padding:14px 16px; background:#fff; border-bottom:1px solid #f0f0f0; flex-shrink:0; }
    .ai-avatar { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#D84040,#b03030); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 2px 8px rgba(216,64,64,.3); }
    .ai-name { font-size:15px; font-weight:700; color:#111; }
    .ai-status { font-size:12px; color:#22c55e; font-weight:600; }

    /* Disclaimer */
    .disclaimer { display:flex; align-items:flex-start; gap:7px; background:#FFFBEB; border-bottom:1px solid #FDE68A; padding:8px 16px; font-size:12px; color:#92400E; flex-shrink:0; line-height:1.4; }

    /* Messages */
    .messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; }

    /* Welcome */
    .welcome-card { background:#fff; border-radius:16px; padding:20px; text-align:center; box-shadow:0 1px 6px rgba(0,0,0,.06); }
    .welcome-avatar { width:56px; height:56px; background:#FEF2F2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
    .welcome-card h3 { font-size:16px; font-weight:700; color:#111; margin-bottom:6px; }
    .welcome-card p { font-size:13px; color:#888; line-height:1.6; }
    .quick-chips { display:flex; flex-direction:column; gap:7px; }
    .chip { background:#fff; border:1.5px solid #e8e8e8; border-radius:20px; padding:9px 16px; font-size:13px; color:#555; cursor:pointer; text-align:left; font-family:inherit; transition:all .15s; }
    .chip:hover { border-color:#D84040; color:#D84040; background:#FEF2F2; }

    /* Message groups */
    .msg-group { display:flex; flex-direction:column; }
    .user-group { align-items:flex-end; }

    /* Bubbles */
    .bubble { max-width:82%; padding:10px 14px; border-radius:16px; font-size:14px; line-height:1.6; }
    .bubble.user { background:#D84040; color:#fff; border-bottom-right-radius:4px; }
    .bubble.assistant { background:#fff; color:#111; border-bottom-left-radius:4px; box-shadow:0 1px 5px rgba(0,0,0,.07); }
    .time { font-size:10px; opacity:.55; margin-top:4px; text-align:right; }
    .bubble.user .time { color:rgba(255,255,255,.7); }

    /* Typing */
    .bubble.typing { display:flex; align-items:center; gap:4px; padding:14px 18px; }
    .dot { width:7px; height:7px; border-radius:50%; background:#D84040; animation:bounce .9s infinite; }
    .dot:nth-child(2){ animation-delay:.15s; } .dot:nth-child(3){ animation-delay:.3s; }
    @keyframes bounce { 0%,80%,100%{ transform:scale(.8); opacity:.5 } 40%{ transform:scale(1.1); opacity:1 } }

    /* Diagnosis wrap */
    .diagnosis-wrap { background:#fff; border-radius:16px; box-shadow:0 1px 8px rgba(0,0,0,.07); overflow:hidden; max-width:95%; }
    .diag-header { display:flex; align-items:center; gap:8px; padding:12px 16px; background:linear-gradient(135deg,#FEF2F2,#fff); font-size:13px; font-weight:700; color:#D84040; border-bottom:1px solid #f5f5f5; }
    .diag-time { margin-left:auto; font-size:11px; color:#aaa; font-weight:400; }

    /* Red flags */
    .red-flags { background:#FEF2F2; padding:10px 14px; border-bottom:1px solid #FBDCDC; }
    .rf-title { font-size:12px; font-weight:700; color:#D84040; margin-bottom:5px; }
    .rf-item { font-size:12px; color:#555; padding:2px 0; }

    /* Result cards */
    .result-card { padding:12px 16px; border-bottom:1px solid #f5f5f5; }
    .result-card.top-result { background:linear-gradient(135deg,#FFFBF2,#fff); }
    .result-card:last-of-type { border-bottom:none; }
    .result-header { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .result-rank { font-size:20px; flex-shrink:0; }
    .result-main { flex:1; }
    .disease-name { font-size:14px; font-weight:700; color:#111; margin-bottom:4px; }
    .confidence-row { display:flex; align-items:center; gap:8px; }
    .conf-bar { flex:1; height:5px; background:#f0f0f0; border-radius:3px; overflow:hidden; }
    .conf-fill { height:100%; background:linear-gradient(90deg,#D84040,#f87171); border-radius:3px; transition:width .4s; }
    .specialist-badge { display:flex; align-items:center; gap:4px; background:#E6F1FB; color:#185FA5; font-size:11px; font-weight:600; padding:4px 10px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
    .conf-pct { font-size:11px; color:#888; white-space:nowrap; }

    /* Details */
    .result-details { background:#F7F8FA; border-radius:10px; padding:12px; margin-bottom:8px; display:flex; flex-direction:column; gap:8px; }
    .detail-section { display:flex; flex-direction:column; gap:3px; }
    .detail-label { font-size:11px; font-weight:700; color:#555; text-transform:uppercase; letter-spacing:.5px; }
    .detail-text { font-size:13px; color:#333; line-height:1.6; }
    .warning-section .detail-label { color:#D84040; }
    .warning-section .detail-text { color:#555; }

    .toggle-btn { background:none; border:1.5px solid #e8e8e8; border-radius:8px; padding:5px 12px; font-size:12px; color:#888; cursor:pointer; font-family:inherit; width:100%; }
    .toggle-btn:hover { border-color:#D84040; color:#D84040; }

    /* Diagnosis note */
    .diag-note { padding:10px 16px; font-size:11px; color:#999; background:#FAFAFA; border-top:1px solid #f5f5f5; line-height:1.5; }

    /* Image upload button */
    .img-btn { width:38px; height:38px; border-radius:10px; background:#F4F6FA; border:1.5px solid #E8ECF0; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#6B7280; flex-shrink:0; transition:all .15s; }
    .img-btn:hover { background:#EEF2FF; color:#2D4A8A; border-color:#2D4A8A; }

    /* Input */
    .input-bar { display:flex; align-items:center; gap:8px; padding:10px 12px; background:#fff; border-top:1px solid #f0f0f0; flex-shrink:0; }
    .msg-input { flex:1; padding:11px 16px; border:1.5px solid #e8e8e8; border-radius:24px; font-size:14px; outline:none; font-family:inherit; background:#F7F8FA; }
    .msg-input:focus { border-color:#D84040; background:#fff; }
    .msg-input:disabled { opacity:.6; }
    .send-btn { width:42px; height:42px; border-radius:50%; background:#D84040; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; box-shadow:0 2px 8px rgba(216,64,64,.3); }
    .send-btn:disabled { opacity:.5; cursor:not-allowed; box-shadow:none; }
    .send-btn:hover:not(:disabled) { background:#b03030; }
  `],
})
export class AiAssistantComponent implements AfterViewChecked {
  @ViewChild('msgContainer') msgContainer?: ElementRef;

  private http   = inject(HttpClient);
  private aiSvc  = inject(AiService);

  messages     = signal<ChatMessage[]>([]);
  thinking     = signal(false);
  inputText    = '';
  expandedResult = -1;
  private shouldScroll = false;

  quickPrompts = [
    'I have a headache and fever',
    'I have chest pain and shortness of breath',
    'I feel dizzy and nauseous',
    'I have lower back pain',
    'I have a sore throat and cough',
    'I feel tired all the time',
  ];

  onEnter(e: Event): void { e.preventDefault(); this.send(); }

  toggleResult(i: number): void { this.expandedResult = this.expandedResult === i ? -1 : i; }

  send(text?: string): void {
    const msg = (text ?? this.inputText).trim();
    if (!msg) return;

    this.messages.update(m => [...m, { role: 'user', text: msg, time: new Date() }]);
    this.inputText     = '';
    this.expandedResult = -1;
    this.thinking.set(true);
    this.shouldScroll  = true;

    // Call real backend: GET /api/AI/GetAiDiagnose?symptoms=...
    this.http.get<any>(`${environment.apiUrl}/AI/GetAiDiagnose`, {
      params: { symptoms: msg }
    }).subscribe({
      next: (res: any) => {
        this.thinking.set(false);
        this.shouldScroll = true;

        const results: DiagResult[] = res?.results ?? [];
        const redFlags: string[]    = res?.red_flags ?? [];
        const note: string          = res?.note ?? '';

        if (results.length > 0) {
          // Show structured diagnosis results
          this.messages.update(m => [...m, {
            role: 'assistant',
            text: note || 'Here are the possible conditions based on your symptoms:',
            time: new Date(),
            results,
            redFlags,
          }]);
        } else {
          // Fallback text response
          const text = res?.message ?? res?.data?.reply ?? 'I could not find matching conditions. Please describe your symptoms in more detail.';
          this.messages.update(m => [...m, { role: 'assistant', text, time: new Date() }]);
        }
      },
      error: () => {
        this.thinking.set(false);
        this.shouldScroll = true;
        this.messages.update(m => [...m, {
          role: 'assistant',
          text: 'Sorry, I had trouble analyzing your symptoms. Please try again.',
          time: new Date(),
        }]);
      },
    });
  }

  fmt(text: string): string {
    return text.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  onImage(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Add user message showing the image name
    this.messages.update(m => [...m, {
      role: 'user',
      text: `📷 Food image: ${file.name}`,
      time: new Date()
    }]);
    this.thinking.set(true);
    this.shouldScroll = true;

    // POST /api/AI/GetAICaloriesByImage
    this.aiSvc.getCaloriesByImage(file).subscribe({
      next: (res: any) => {
        this.thinking.set(false);
        const text = res?.result ?? res?.message ?? res?.data ?? res?.calories
          ?? (typeof res === 'string' ? res : null)
          ?? 'Could not analyze the image. Please try again.';
        this.messages.update(m => [...m, {
          role: 'assistant',
          text: typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text),
          time: new Date()
        }]);
        this.shouldScroll = true;
      },
      error: (err: any) => {
        this.thinking.set(false);
        this.messages.update(m => [...m, {
          role: 'assistant',
          text: err?.error?.message ?? 'Image analysis failed. Please try again.',
          time: new Date()
        }]);
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.msgContainer) {
      const el = this.msgContainer.nativeElement as HTMLElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }
}
