import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../../environments/environment';

interface ChatMessage {
  role:      'user' | 'assistant';
  text:      string;
  time:      Date;
  results?:  DiagResult[];
  redFlags?: string[];
}
interface DiagResult {
  predicted_disease: string; doctor: string; overview: string;
  treatment: string; when_to_see_doctor: string; score: number;
}
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
    <div class="ai-info">
      <div class="ai-name">Wateen AI</div>
      <div class="ai-status">● Health Assistant</div>
    </div>

  </div>

  <!-- Disclaimer -->
  <div class="disclaimer">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
AI provides general guidance only. Not a substitute for professional medical advice.
  </div>

  <!-- Messages -->
  <div class="messages" #msgContainer>

    <!-- Welcome -->
    <ng-container *ngIf="messages().length === 0">
      <div class="welcome-card">
        <div class="welcome-avatar">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="1.8">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </div>
        <h3>Hello! I'm Wateen AI 👋</h3>
        <p>Describe your symptoms and I'll suggest possible conditions and next steps.</p>
      </div>
      <div class="quick-chips">
        <button class="chip" *ngFor="let q of quickPrompts" (click)="inputText = q">{{ q }}</button>
      </div>
    </ng-container>

    <!-- Message bubbles -->
    <div *ngFor="let m of messages()" class="msg-group" [class.user-group]="m.role==='user'">

      <div class="bubble user" *ngIf="m.role==='user'">
        {{ m.text }}
        <div class="time">{{ m.time | date:'h:mm a' }}</div>
      </div>

      <!-- Plain assistant text -->
      <div class="bubble assistant" *ngIf="m.role==='assistant' && !m.results">
        <span [innerHTML]="fmt(m.text)"></span>
        <div class="time">{{ m.time | date:'h:mm a' }}</div>
      </div>

      <!-- Diagnosis results -->
      <div class="diagnosis-wrap" *ngIf="m.role==='assistant' && m.results">
        <div class="diag-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          AI Diagnosis Results
          <span class="diag-time">{{ m.time | date:'h:mm a' }}</span>
        </div>
        <div class="red-flags" *ngIf="m.redFlags && m.redFlags.length > 0">
          <div class="rf-title">⚠️ Important Warning Signs</div>
          <div class="rf-item" *ngFor="let rf of m.redFlags">{{ rf }}</div>
        </div>
        <div class="result-card" *ngFor="let r of m.results; let i = index" [class.top-result]="i===0">
          <div class="result-header">
            <div class="result-rank">{{ i===0 ? '🥇' : i===1 ? '🥈' : '🥉' }}</div>
            <div class="result-main">
              <div class="disease-name">{{ r.predicted_disease }}</div>
              <div class="confidence-row">
                <div class="conf-bar"><div class="conf-fill" [style.width]="r.score + '%'"></div></div>
                <span class="conf-pct">{{ r.score.toFixed(1) }}% match</span>
              </div>
            </div>
            <div class="specialist-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              {{ r.doctor }}
            </div>
          </div>
          <div class="result-details" *ngIf="expandedResult===i">
            <div class="detail-section"><div class="detail-label">Overview</div><div class="detail-text">{{ r.overview }}</div></div>
            <div class="detail-section"><div class="detail-label">Treatment</div><div class="detail-text">{{ r.treatment }}</div></div>
            <div class="detail-section warning-section"><div class="detail-label">⚕️ When to See a Doctor</div><div class="detail-text">{{ r.when_to_see_doctor }}</div></div>
          </div>
          <button class="toggle-btn" (click)="toggleResult(i)">{{ expandedResult===i ? 'Hide Details ▲' : 'See Details ▼' }}</button>
        </div>
        <div class="diag-note">ℹ️ This is a preliminary AI assessment, not a final medical diagnosis.</div>
      </div>
    </div>

    <!-- Thinking -->
    <div class="msg-group" *ngIf="thinking()">
      <div class="bubble assistant typing">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    </div>
  </div>

  <!-- Symptoms input bar -->
  <div class="input-bar">
    <input [(ngModel)]="inputText"
           placeholder="Describe your symptoms..."
           class="msg-input"
           (keydown.enter)="onEnter($event)"
           [disabled]="thinking()" />
    <button class="send-btn" (click)="send()" [disabled]="!inputText.trim() || thinking()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
      </svg>
    </button>
  </div>

</div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .chat-page { display:flex; flex-direction:column; height:calc(100vh - 60px); background:#F7F8FA; max-width:760px; margin:0 auto; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .chat-page { height:calc(100vh - 56px); } }
    @keyframes blink { 0%,80%,100% { opacity:.2; } 40% { opacity:1; } }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Header */
    .chat-header { display:flex; align-items:center; gap:12px; padding:12px 16px; background:#fff; border-bottom:1px solid #F0F2F5; flex-shrink:0; }
    .ai-avatar { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,#D84040,#b03030); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 2px 8px rgba(216,64,64,.3); }
    .ai-info { flex:1; }
    .ai-name { font-size:15px; font-weight:700; color:#111; }
    .ai-status { font-size:12px; color:#22c55e; font-weight:600; }

    /* Disclaimer */
    .disclaimer { display:flex; align-items:flex-start; gap:7px; background:#FFFBEB; border-bottom:1px solid #FDE68A; padding:7px 16px; font-size:12px; color:#92400E; flex-shrink:0; line-height:1.4; }

    /* Messages */
    .messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; scrollbar-width:none; -ms-overflow-style:none; }
    .messages::-webkit-scrollbar { display:none; }

    /* Welcome */
    .welcome-card { background:#fff; border-radius:16px; padding:20px; text-align:center; box-shadow:0 1px 6px rgba(0,0,0,.06); }
    .welcome-avatar { width:56px; height:56px; background:#FEF2F2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
    .welcome-card h3 { font-size:16px; font-weight:700; color:#111; margin-bottom:6px; }
    .welcome-card p { font-size:13px; color:#888; line-height:1.6; }
    .quick-chips { display:flex; flex-direction:column; gap:7px; }
    .chip { background:#fff; border:1.5px solid #E8ECF0; border-radius:20px; padding:9px 16px; font-size:13px; color:#555; cursor:pointer; text-align:left; font-family:inherit; transition:all .15s; }
    .chip:hover { border-color:#D84040; color:#D84040; background:#FEF2F2; }

    /* Bubbles */
    .msg-group { display:flex; flex-direction:column; }
    .user-group { align-items:flex-end; }
    .bubble { max-width:82%; padding:10px 14px; border-radius:16px; font-size:14px; line-height:1.6; }
    .bubble.user { background:#D84040; color:#fff; border-bottom-right-radius:4px; }
    .bubble.assistant { background:#fff; color:#111; border-bottom-left-radius:4px; box-shadow:0 1px 5px rgba(0,0,0,.07); }
    .bubble.typing { display:flex; gap:4px; align-items:center; width:60px; }
    .dot { width:7px; height:7px; border-radius:50%; background:#ccc; animation:blink 1.4s infinite both; }
    .dot:nth-child(2) { animation-delay:.2s; }
    .dot:nth-child(3) { animation-delay:.4s; }
    .time { font-size:10px; opacity:.6; margin-top:4px; text-align:right; }

    /* Calorie card */
    .calorie-card { background:#fff; border-radius:18px; padding:18px; box-shadow:0 2px 12px rgba(15,110,86,.1); border:1.5px solid #A7F3D0; max-width:90%; }
    .cal-header { display:flex; align-items:center; gap:6px; font-size:14px; font-weight:700; color:#0F6E56; margin-bottom:6px; }
    .cal-time { margin-left:auto; font-size:11px; color:#9CA3AF; font-weight:400; }
    .cal-grams-note { font-size:12px; color:#9CA3AF; margin-bottom:12px; }
    .cal-main { display:flex; align-items:baseline; gap:4px; margin-bottom:2px; }
    .cal-total { font-size:44px; font-weight:900; color:#0F6E56; line-height:1; }
    .cal-unit { font-size:16px; font-weight:700; color:#0F6E56; }
    .cal-per100 { font-size:12px; color:#9CA3AF; margin-bottom:14px; }
    .macros-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    @media(max-width:400px) { .macros-grid { grid-template-columns:repeat(2,1fr); } }
    .macro-item { background:#F8FFF8; border-radius:10px; padding:8px; text-align:center; }
    .macro-item.protein { background:#EFF6FF; }
    .macro-item.carbs   { background:#FFFBEB; }
    .macro-item.fat     { background:#FEF2F2; }
    .macro-item.fiber   { background:#F0FDF4; }
    .macro-val { font-size:15px; font-weight:800; color:#111; }
    .macro-lbl { font-size:10px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:.3px; margin-top:2px; }

    /* Diagnosis */
    .diagnosis-wrap { background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.07); max-width:95%; }
    .diag-header { display:flex; align-items:center; gap:7px; padding:12px 16px; background:#FEF2F2; font-size:14px; font-weight:700; color:#D84040; border-bottom:1px solid #FECACA; }
    .diag-time { margin-left:auto; font-size:11px; color:#9CA3AF; font-weight:400; }
    .red-flags { background:#FFFBEB; padding:12px 16px; border-bottom:1px solid #FDE68A; }
    .rf-title { font-size:12px; font-weight:700; color:#92400E; margin-bottom:6px; }
    .rf-item { font-size:12px; color:#92400E; padding:3px 0; }
    .result-card { padding:14px 16px; border-bottom:1px solid #F8F9FC; }
    .top-result { background:#FEFAF5; }
    .result-header { display:flex; align-items:flex-start; gap:10px; }
    .result-rank { font-size:20px; flex-shrink:0; }
    .result-main { flex:1; }
    .disease-name { font-size:14px; font-weight:700; color:#111; margin-bottom:4px; }
    .confidence-row { display:flex; align-items:center; gap:8px; }
    .conf-bar { flex:1; height:6px; background:#F0F2F5; border-radius:3px; overflow:hidden; }
    .conf-fill { height:100%; background:linear-gradient(90deg,#D84040,#ff6b6b); border-radius:3px; }
    .conf-pct { font-size:11px; color:#888; font-weight:600; white-space:nowrap; }
    .specialist-badge { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:#2D4A8A; background:#EEF2FF; padding:4px 10px; border-radius:20px; flex-shrink:0; white-space:nowrap; }
    .result-details { background:#F7F8FA; border-radius:10px; padding:12px; margin-top:10px; display:flex; flex-direction:column; gap:10px; }
    .detail-section { }
    .detail-label { font-size:11px; font-weight:800; color:#aaa; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
    .detail-text { font-size:13px; color:#444; line-height:1.6; }
    .warning-section .detail-text { color:#92400E; }
    .toggle-btn { display:flex; align-items:center; justify-content:center; width:100%; padding:8px; border:none; background:transparent; font-size:12px; color:#D84040; cursor:pointer; font-family:inherit; margin-top:8px; }
    .diag-note { padding:10px 16px; font-size:12px; color:#aaa; text-align:center; border-top:1px solid #F0F2F5; }
    /* Symptoms input bar */
    .input-bar { display:flex; align-items:center; gap:8px; padding:12px 16px; background:#fff; border-top:1px solid #F0F2F5; flex-shrink:0; }
    .msg-input { flex:1; padding:11px 16px; border:1.5px solid #E8ECF0; border-radius:24px; font-size:14px; font-family:inherit; outline:none; }
    .msg-input:focus { border-color:#D84040; }

    /* Send button */
    .send-btn { width:42px; height:42px; border-radius:50%; background:#D84040; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:opacity .15s; }
    .send-btn:hover:not(:disabled) { opacity:.85; }
    .send-btn:disabled { opacity:.45; cursor:not-allowed; }
  `]
})
export class AiAssistantComponent implements AfterViewChecked {
  private http = inject(HttpClient);

  @ViewChild('msgContainer') msgContainer?: ElementRef;
  private shouldScroll = false;

  messages     = signal<ChatMessage[]>([]);
  thinking     = signal(false);
  inputText = '';
  expandedResult = -1;

  quickPrompts = [
    'I have a headache and fever for 2 days',
    'I feel chest pain and shortness of breath',
    'I have stomach pain after eating',
    'I feel dizzy and tired all the time',
  ];



  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.msgContainer) {
      const el = this.msgContainer.nativeElement as HTMLElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  scroll(): void { this.shouldScroll = true; }

  onEnter(e: Event): void {
    const ke = e as KeyboardEvent; if (!ke.shiftKey) { ke.preventDefault(); this.send(); }
  }

  // ── SYMPTOMS MODE ──────────────────────────────────────────────────────────
  send(preset?: string): void {
    const text = (preset ?? this.inputText).trim();
    if (!text || this.thinking()) return;

    this.messages.update(m => [...m, { role:'user', text, time: new Date() }]);
    this.inputText = '';
    this.thinking.set(true);
    this.scroll();

    this.http.get<any>(`${environment.apiUrl}/AI/GetAiDiagnose`, {
      params: { symptoms: text }
    }).subscribe({
      next: (res: any) => {
        this.thinking.set(false);
        console.log('[AI Diagnose] raw response:', res);

        // Handle all possible response shapes
        const data = res?.data ?? res;

        // Shape 1: { predicted_diseases: [...] }
        const diseases = data?.predicted_diseases ?? data?.diseases
                      ?? data?.results ?? data?.predictions;

        if (Array.isArray(diseases) && diseases.length > 0) {
          this.messages.update(m => [...m, {
            role:     'assistant',
            text:     '',
            time:     new Date(),
            results:  diseases,
            redFlags: data?.red_flags ?? data?.redFlags ?? data?.warnings ?? [],
          }]);
          this.scroll();
          return;
        }

        // Shape 2: plain text / message
        const txt =
          data?.message ?? data?.result ?? data?.text ?? data?.response ??
          data?.answer  ?? data?.diagnosis ??
          (typeof data === 'string' ? data : null);

        if (txt) {
          this.messages.update(m => [...m, { role:'assistant', text: txt, time: new Date() }]);
          this.scroll();
          return;
        }

        // Fallback: show raw JSON for debugging
        console.warn('[AI Diagnose] unknown response shape:', data);
        this.messages.update(m => [...m, {
          role: 'assistant',
          text: 'AI response received but in unexpected format. Raw: ' + JSON.stringify(data).slice(0, 200),
          time: new Date()
        }]);
        this.scroll();
      },
      error: (err: any) => {
        this.thinking.set(false);
        console.error('[AI Diagnose] error:', err);
        const msg = err?.error?.message ?? err?.error?.title ?? err?.message
               ?? `HTTP ${err?.status ?? 'error'} — please try again.`;
        this.messages.update(m => [...m, { role:'assistant', text: msg, time: new Date() }]);
      }
    });
  }

  // ── IMAGE (removed) ──


  toggleResult(i: number): void { this.expandedResult = this.expandedResult === i ? -1 : i; }

  fmt(text: string): string {
    return (text ?? '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
}
