import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../../core/services/appointment.service';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/patient/appointments'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1>Appointment Details</h1>
        <span></span>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <div class="not-found" *ngIf="!loading() && !appt()">
        <p>Appointment not found.</p>
        <button class="btn-back" (click)="router.navigate(['/patient/appointments'])">← Go Back</button>
      </div>

      <ng-container *ngIf="!loading() && appt()">

        <!-- Status banner -->
        <div class="status-banner" [class]="normSt()">
          <div class="sb-icon">
            <svg *ngIf="normSt()==='confirmed'"   width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <svg *ngIf="normSt()==='pending'"     width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <svg *ngIf="normSt()==='cancelled'"   width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <svg *ngIf="normSt()==='completed'"   width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <svg *ngIf="normSt()==='rescheduled'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.17"/></svg>
          </div>
          {{ stLabel() }}
        </div>

        <!-- Doctor card -->
        <div class="doctor-card">
          <div class="doc-av" [style.background]="docBg()">{{ docIni() }}</div>
          <div class="doc-info">
            <div class="doc-name">Dr. {{ getDoctorName() }}</div>
            <div class="doc-spec">{{ getDoctorSpec() }}</div>
          </div>

          <!-- ── MESSAGE DOCTOR BUTTON (prominent) ── -->
          <button class="btn-msg-doc" (click)="messageDoctor()" title="Send a message to the doctor">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Message
          </button>
        </div>

        <!-- Info card -->
        <div class="info-card">
          <div class="info-row">
            <div class="ii b"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <div><div class="il">DATE</div><div class="iv">{{ getTime() | date:'EEEE, MMMM d, y' }}</div></div>
          </div>
          <div class="info-row">
            <div class="ii g"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <div><div class="il">TIME</div><div class="iv">{{ getTime() | date:'h:mm a' }}</div></div>
          </div>
          <div class="info-row">
            <div class="ii p"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>
            <div><div class="il">TYPE</div><div class="iv">{{ typeLabel() }}</div></div>
          </div>
          <div class="info-row" *ngIf="appt()?.notes">
            <div class="ii gray"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
            <div><div class="il">NOTES</div><div class="iv">{{ appt()?.notes }}</div></div>
          </div>
          <div class="info-row" *ngIf="joinUrl()">
            <div class="ii b"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
            <div>
              <div class="il">VIDEO CALL</div>
              <a [href]="joinUrl()" target="_blank" rel="noopener" class="join-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                Join Meeting →
              </a>
            </div>
          </div>
          <div class="info-row" *ngIf="appt()?.cancellationReason">
            <div class="ii r"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
            <div><div class="il">CANCELLATION REASON</div><div class="iv">{{ appt()?.cancellationReason }}</div></div>
          </div>
        </div>

        <!-- ── CHAT WITH DOCTOR CARD ── -->
        <div class="chat-card" (click)="messageDoctor()">
          <div class="chat-card-left">
            <div class="chat-card-av" [style.background]="docBg()">{{ docIni() }}</div>
            <div>
              <div class="chat-card-title">Message Dr. {{ getDoctorName() }}</div>
              <div class="chat-card-sub">Ask a question about your appointment</div>
            </div>
          </div>
          <div class="chat-card-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D4A8A" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
        </div>

        <!-- Toast feedback -->
        <div class="toast ok"        *ngIf="toast()==='confirmed'">✅ Appointment confirmed!</div>
        <div class="toast ok"        *ngIf="toast()==='completed'">✅ Marked as completed!</div>
        <div class="toast cancelled" *ngIf="toast()==='cancelled'">❌ Appointment cancelled.</div>

        <!-- Action buttons (patient perspective) -->
        <div class="actions" *ngIf="normSt()==='pending' || normSt()==='confirmed'">
          <button class="btn-reschedule" (click)="router.navigate(['/patient/appointments', appt()!.id, 'reschedule'])">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.17"/>
            </svg>
            Reschedule
          </button>
          <button class="btn-cancel-appt" (click)="promptCancel()" [disabled]="acting()==='cancel'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Cancel
          </button>
        </div>

      </ng-container>
    </div>

    <!-- Cancel dialog -->
    <div class="dlg-bg" *ngIf="showCancelDlg" (click)="showCancelDlg=false"></div>
    <div class="dlg"    *ngIf="showCancelDlg">
      <div class="dlg-ico">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3>Cancel Appointment?</h3>
      <p>Your appointment with <strong>Dr. {{ getDoctorName() }}</strong> on <strong>{{ getTime() | date:'MMM d · h:mm a' }}</strong> will be cancelled.</p>
      <div class="dlg-field">
        <label>Reason</label>
        <select [(ngModel)]="cancelReason" class="sel">
          <option value="">Select a reason</option>
          <option value="Schedule conflict">Schedule conflict</option>
          <option value="Feeling better">Feeling better</option>
          <option value="Found another doctor">Found another doctor</option>
          <option value="Emergency">Emergency</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="dlg-btns">
        <button class="dlg-keep" (click)="showCancelDlg=false">Keep It</button>
        <button class="dlg-confirm" (click)="doCancel()" [disabled]="!cancelReason || acting()==='cancel'">
          <span class="mspin" *ngIf="acting()==='cancel'"></span>
          Yes, Cancel
        </button>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { padding:24px; max-width:680px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:14px;} }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
    h1 { font-size:19px; font-weight:800; color:#111; }
    .back-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; display:flex; color:#555; }
    .back-btn:hover { background:#f5f5f5; }
    .loading { display:flex; justify-content:center; padding:48px; }
    .spinner { width:26px; height:26px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}
    .not-found { text-align:center; padding:40px; color:#888; }
    .btn-back { margin-top:12px; padding:10px 20px; background:#D84040; color:#fff; border:none; border-radius:10px; cursor:pointer; font-family:inherit; font-size:14px; }

    /* Status banner */
    .status-banner { display:flex; align-items:center; gap:8px; padding:12px 16px; border-radius:12px; font-size:14px; font-weight:700; margin-bottom:14px; }
    .status-banner .sb-icon { width:24px; height:24px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.4); flex-shrink:0; }
    .status-banner.pending    { background:#FEF9E7; color:#d4a017; }
    .status-banner.confirmed  { background:#E1F5EE; color:#0F6E56; }
    .status-banner.rescheduled{ background:#F3E8FF; color:#7C3AED; }
    .status-banner.completed  { background:#f0f0f0; color:#555; }
    .status-banner.cancelled  { background:#FEF2F2; color:#D84040; }

    /* Doctor card */
    .doctor-card { background:#fff; border-radius:16px; padding:16px; display:flex; align-items:center; gap:12px; margin-bottom:14px; box-shadow:0 1px 8px rgba(0,0,0,.07); }
    .doc-av { width:50px; height:50px; border-radius:50%; color:#fff; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .doc-info { flex:1; }
    .doc-name { font-size:16px; font-weight:800; color:#111; }
    .doc-spec { font-size:13px; color:#D84040; font-weight:600; margin-top:2px; }

    /* ── Message Doctor button (in doctor card) ── */
    .btn-msg-doc { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; background:#2D4A8A; color:#fff; border:none; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; transition:all .15s; flex-shrink:0; }
    .btn-msg-doc:hover { background:#1E3A6E; transform:translateY(-1px); }

    /* Info card */
    .info-card { background:#fff; border-radius:16px; margin-bottom:14px; box-shadow:0 1px 8px rgba(0,0,0,.07); overflow:hidden; }
    .info-row { display:flex; align-items:flex-start; gap:12px; padding:13px 16px; border-bottom:1px solid #f5f5f5; }
    .info-row:last-child { border-bottom:none; }
    .ii { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
    .ii.b { background:#E6F1FB; } .ii.g { background:#E1F5EE; } .ii.p { background:#F3E8FF; } .ii.gray { background:#f5f5f5; } .ii.r { background:#FEF2F2; }
    .il { font-size:10px; font-weight:700; color:#aaa; letter-spacing:.5px; margin-bottom:3px; }
    .iv { font-size:14px; color:#333; font-weight:500; }
    .join-link { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; background:#006BFF; color:#fff; border-radius:8px; font-size:13px; font-weight:700; text-decoration:none; margin-top:4px; }
    .join-link:hover { opacity:.88; }

    /* ── Chat card (full-width clickable) ── */
    .chat-card { background:linear-gradient(135deg,#EEF2FF,#E0E9FF); border:1.5px solid #C7D2FE; border-radius:16px; padding:16px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer; margin-bottom:14px; transition:all .15s; }
    .chat-card:hover { background:linear-gradient(135deg,#E0E9FF,#c7d8ff); transform:translateY(-1px); box-shadow:0 4px 14px rgba(45,74,138,.15); }
    .chat-card-left { display:flex; align-items:center; gap:12px; flex:1; }
    .chat-card-av { width:42px; height:42px; border-radius:50%; color:#fff; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .chat-card-title { font-size:15px; font-weight:700; color:#2D4A8A; margin-bottom:2px; }
    .chat-card-sub   { font-size:12px; color:#666; }
    .chat-card-arrow { width:40px; height:40px; background:#2D4A8A; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .chat-card-arrow svg { stroke:#fff !important; }

    /* Toast */
    .toast { padding:12px 16px; border-radius:12px; font-size:13px; font-weight:600; margin-bottom:14px; }
    .toast.ok        { background:#E1F5EE; color:#0F6E56; }
    .toast.cancelled { background:#FEF2F2; color:#D84040; }

    /* Actions */
    .actions { display:flex; gap:10px; margin-bottom:14px; }
    .btn-reschedule { flex:1; padding:13px; background:#F3E8FF; color:#7C3AED; border:1.5px solid #DDD6FE; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:6px; }
    .btn-cancel-appt{ flex:1; padding:13px; background:#FEF2F2; color:#D84040; border:1.5px solid #FBDCDC; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:6px; }
    .btn-cancel-appt:disabled { opacity:.5; cursor:not-allowed; }

    /* Dialog */
    .dlg-bg { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:100; }
    .dlg { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; border-radius:20px; padding:28px 24px; width:90%; max-width:400px; z-index:101; box-shadow:0 16px 48px rgba(0,0,0,.2); }
    .dlg-ico { width:52px; height:52px; background:#FEF2F2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .dlg h3 { font-size:17px; font-weight:800; color:#111; text-align:center; margin-bottom:8px; }
    .dlg p  { font-size:14px; color:#666; text-align:center; line-height:1.5; margin-bottom:16px; }
    .dlg p strong { color:#111; }
    .dlg-field { margin-bottom:16px; }
    .dlg-field label { display:block; font-size:13px; font-weight:600; color:#555; margin-bottom:6px; }
    .sel { width:100%; padding:10px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:inherit; outline:none; background:#fff; }
    .sel:focus { border-color:#D84040; }
    .dlg-btns { display:flex; gap:10px; }
    .dlg-keep    { flex:1; padding:12px; border:1.5px solid #e8e8e8; background:#fff; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; color:#555; }
    .dlg-confirm { flex:1; padding:12px; background:#D84040; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:6px; }
    .dlg-confirm:disabled { opacity:.5; cursor:not-allowed; }
    .mspin { width:13px; height:13px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
  `]
})
export class AppointmentDetailComponent implements OnInit {
  private apptSvc = inject(AppointmentService);
  readonly router = inject(Router);
  private route   = inject(ActivatedRoute);

  loading  = signal(true);
  acting   = signal('');
  toast    = signal('');
  appt     = signal<any>(null);

  showCancelDlg = false;
  cancelReason  = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.apptSvc.getMyAppointments().subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        const found = list.find((a: any) => String(a.id) === String(id));
        this.appt.set(found ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** ── Navigate to chat with the doctor ── */
  messageDoctor(): void {
    const a = this.appt();
    const doctorId = a?.doctorId ?? a?.doctorUserId ?? a?.userId;
    if (!doctorId) { alert('Doctor information not available for this appointment.'); return; }
    this.router.navigate(['/patient/chat', doctorId], {
      state: { doctorName: this.getDoctorName(), from: `/patient/appointments/${a.id}` }
    });
  }

  // ── Status helpers ──────────────────────────────────────────────
  normSt(): string {
    const s = this.appt()?.status;
    if (s === null || s === undefined) return 'pending';
    if (typeof s === 'number') return ({0:'pending',1:'confirmed',2:'cancelled',3:'completed',4:'rescheduled'} as any)[s] ?? 'pending';
    return String(s).toLowerCase().trim();
  }

  stLabel(): string {
    const m: any = {pending:'Pending — Awaiting Confirmation',confirmed:'Confirmed',cancelled:'Cancelled',completed:'Completed',rescheduled:'Rescheduled'};
    return m[this.normSt()] ?? String(this.appt()?.status ?? '');
  }

  // ── Field helpers ───────────────────────────────────────────────
  getDoctorName(): string {
    const a = this.appt();
    const fn = a?.doctorFirstName ?? '';
    const ln = a?.doctorLastName  ?? '';
    if (fn || ln) return `${fn} ${ln}`.trim();
    return a?.doctorName ?? a?.doctorFullName ?? 'Doctor';
  }

  getDoctorSpec(): string {
    const a = this.appt();
    return a?.specialtyName ?? a?.doctorSpecialty ?? a?.specialization ?? '';
  }

  getTime(): string {
    return this.appt()?.appointmentTime ?? this.appt()?.scheduledAt ?? new Date().toISOString();
  }

  joinUrl(): string {
    const a = this.appt();
    return a?.videoCallLink ?? a?.calendlyJoinUrl ?? a?.joinUrl ?? a?.meetingLink ?? '';
  }

  typeLabel(): string {
    const t = this.appt()?.type;
    if (typeof t === 'number') return ({0:'In Person',1:'Video Call',2:'Message Chat'} as any)[t] ?? 'In Person';
    return ({video:'Video Call', in_person:'In Person', message:'Message Chat'} as any)[String(t ?? '').toLowerCase()] ?? String(t ?? '');
  }

  docIni(): string {
    const n = this.getDoctorName().split(' ');
    return ((n[0]?.[0]??'') + (n[1]?.[0]??'')).toUpperCase() || 'DR';
  }

  docBg(): string {
    const c = ['#2D4A8A','#D84040','#0F6E56','#7C3AED','#0891B2'];
    return c[this.getDoctorName().charCodeAt(0) % c.length] || '#2D4A8A';
  }

  // ── Cancel ──────────────────────────────────────────────────────
  promptCancel(): void { this.cancelReason = ''; this.showCancelDlg = true; }

  doCancel(): void {
    if (!this.cancelReason) return;
    this.acting.set('cancel');
    this.apptSvc.cancelByPatient(this.appt()!.id).subscribe({
      next: () => {
        this.appt.update((a: any) => ({ ...a, status: 2 }));
        this.acting.set(''); this.showCancelDlg = false;
        this.toast.set('cancelled');
        setTimeout(() => { this.toast.set(''); this.router.navigate(['/patient/appointments']); }, 1800);
      },
      error: () => { this.acting.set(''); this.showCancelDlg = false; },
    });
  }
}
