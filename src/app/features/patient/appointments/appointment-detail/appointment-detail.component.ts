import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }         from '@angular/forms';
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Appointment Details</h1>
        <span></span>
      </div>

      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
      </div>

      <div class="not-found" *ngIf="!loading() && !appt()">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>Appointment not found.</p>
        <button class="btn-back" (click)="router.navigate(['/patient/appointments'])">Go Back</button>
      </div>

      <ng-container *ngIf="!loading() && appt()">

        <!-- Status banner -->
        <div class="status-banner" [class]="getStatusCls()">
          <div class="sb-dot"></div>
          {{ getStatusText() }}
        </div>

        <!-- Doctor card -->
        <div class="doctor-hero">
          <div class="doc-avatar" [style.background]="avatarBg()">{{ initials() }}</div>
          <div class="doc-info">
            <div class="doc-name">{{ getDoctorName() }}</div>
            <div class="doc-spec">{{ getDoctorSpec() }}</div>
          </div>
        </div>

        <!-- Details -->
        <div class="details-card">

          <!-- Date & Time -->
          <div class="detail-row">
            <div class="dicon cal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div class="dlabel">Date & Time</div>
              <div class="dval">{{ getTime() | date:'EEEE, MMMM d, y' }}</div>
              <div class="dval-sub">{{ getTime() | date:'h:mm a' }}</div>
            </div>
          </div>

          <!-- Type -->
          <div class="detail-row">
            <div class="dicon type">
              <svg *ngIf="isVideoType()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              <svg *ngIf="isMessageType()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <svg *ngIf="!isVideoType() && !isMessageType()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <div>
              <div class="dlabel">Appointment Type</div>
              <div class="dval">{{ getTypeLabel() }}</div>
            </div>
          </div>

          <!-- Duration -->
          <div class="detail-row" *ngIf="getDuration() > 0">
            <div class="dicon dur">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div class="dlabel">Duration</div>
              <div class="dval">{{ getDuration() }} minutes</div>
            </div>
          </div>

          <!-- Notes -->
          <div class="detail-row" *ngIf="appt()!.notes">
            <div class="dicon note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <div class="dlabel">Your Notes</div>
              <div class="dval">{{ appt()!.notes }}</div>
            </div>
          </div>

          <!-- Cancellation reason -->
          <div class="detail-row" *ngIf="appt()!.cancellationReason">
            <div class="dicon canc">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div>
              <div class="dlabel">Cancellation Reason</div>
              <div class="dval reason">{{ appt()!.cancellationReason }}</div>
            </div>
          </div>

        </div>

        <!-- Calendly / Video Join -->
        <div class="join-card" *ngIf="getMeetingLink() || (isVideoType() && isActive())">
          <div class="join-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#006BFF" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            Video Meeting Ready
          </div>
          <p *ngIf="getMeetingLink()">Your video meeting link is ready. Join at the scheduled time.</p>
          <p *ngIf="!getMeetingLink()">The doctor will share a video call link once they confirm the appointment.</p>
          <a *ngIf="getMeetingLink()" [href]="getMeetingLink()" target="_blank" class="btn-join">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            Join Video Call
          </a>
          <div class="join-note">Link opens in a new tab. Make sure you join at {{ getTime() | date:'h:mm a' }}.</div>
        </div>

        <!-- Calendly booking link if not yet confirmed -->
        <div class="calendly-card" *ngIf="appt()!.status === 'Pending' && !getMeetingLink()">
          <div class="cal-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Awaiting Doctor Confirmation
          </div>
          <p>Your appointment request has been sent. The doctor will confirm it shortly. You'll receive an email when it's confirmed.</p>
        </div>

        <!-- Email notification note -->
        <div class="email-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Email confirmation sent to your registered email address.
        </div>

        <!-- Actions -->
        <div class="actions" *ngIf="isActive()">
          <button class="btn-reschedule" (click)="router.navigate(['/patient/appointments', appt()!.id, 'reschedule'])">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-8.36"/></svg>
            Reschedule
          </button>
          <button class="btn-cancel" (click)="promptCancel()" [disabled]="cancelling()">
            <span class="mini-spinner" *ngIf="cancelling()"></span>
            <svg *ngIf="!cancelling()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {{ cancelling() ? 'Cancelling...' : 'Cancel Appointment' }}
          </button>
        </div>

      </ng-container>
    </div>

    <!-- Cancelled success toast -->
    <div class="cancelled-toast" *ngIf="cancelled()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      Appointment cancelled successfully. Redirecting...
    </div>

    <!-- Cancel confirm dialog -->
    <div class="backdrop" *ngIf="showCancel" (click)="showCancel=false"></div>
    <div class="dialog" *ngIf="showCancel">
      <div class="dialog-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </div>
      <h3>Cancel Appointment?</h3>
      <p>Cancel your appointment with <strong>{{ getDoctorName() }}</strong> on <strong>{{ getTime() | date:'MMM d, y' }}</strong>?</p>
      <div class="field">
        <label>Reason (optional)</label>
        <select [(ngModel)]="cancelReason" class="sel">
          <option value="">Select reason</option>
          <option value="Schedule conflict">Schedule conflict</option>
          <option value="Feeling better">Feeling better</option>
          <option value="Found another doctor">Found another doctor</option>
          <option value="Emergency">Emergency</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="dialog-actions">
        <button class="btn-keep" (click)="showCancel=false">Keep Appointment</button>
        <button class="btn-confirm-cancel" (click)="doCancel()" [disabled]="cancelling()">
          <span class="mini-spinner white" *ngIf="cancelling()"></span>
          Confirm Cancel
        </button>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; }
    .page { padding:20px; max-width:640px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page { padding:14px; } }

    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .top-bar h1 { font-size:18px; font-weight:800; color:#111; }
    .back-btn { background:none; border:none; cursor:pointer; color:#555; padding:6px; border-radius:8px; display:flex; }
    .back-btn:hover { background:#f0f0f0; }

    .loading { display:flex; justify-content:center; padding:48px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    .mini-spinner { display:inline-block; width:13px; height:13px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:5px; }
    .mini-spinner.white { border-color:rgba(255,255,255,.3); border-top-color:#fff; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .not-found { text-align:center; padding:48px; color:#888; }
    .not-found p { font-size:15px; margin:12px 0; }
    .btn-back { background:#f0f0f0; color:#555; border:none; padding:10px 20px; border-radius:10px; cursor:pointer; font-family:inherit; }

    /* Status banner */
    .status-banner { display:flex; align-items:center; gap:8px; padding:10px 16px; border-radius:12px; font-size:13px; font-weight:700; margin-bottom:14px; }
    .sb-dot { width:8px; height:8px; border-radius:50%; background:currentColor; flex-shrink:0; }
    .status-banner.confirmed { background:#E1F5EE; color:#0F6E56; }
    .status-banner.pending   { background:#FEF9E7; color:#d4a017; }
    .status-banner.cancelled { background:#FEF2F2; color:#D84040; }
    .status-banner.completed { background:#E6F1FB; color:#185FA5; }
    .status-banner.rescheduled { background:#F3E8FF; color:#7C3AED; }

    /* Doctor hero */
    .doctor-hero { background:#fff; border-radius:16px; padding:18px; display:flex; align-items:center; gap:14px; margin-bottom:12px; box-shadow:0 2px 10px rgba(0,0,0,.07); }
    .doc-avatar { width:56px; height:56px; border-radius:50%; color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .doc-name { font-size:17px; font-weight:800; color:#111; }
    .doc-spec { font-size:13px; color:#D84040; font-weight:600; margin-top:3px; }

    /* Details card */
    .details-card { background:#fff; border-radius:16px; overflow:hidden; margin-bottom:12px; box-shadow:0 2px 10px rgba(0,0,0,.07); }
    .detail-row { display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border-bottom:1px solid #f5f5f5; }
    .detail-row:last-child { border-bottom:none; }
    .dicon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .dicon.cal  { background:#E6F1FB; }
    .dicon.type { background:#FEF2F2; }
    .dicon.dur  { background:#E1F5EE; }
    .dicon.note { background:#F7F8FA; }
    .dicon.canc { background:#FEF2F2; }
    .dlabel { font-size:11px; font-weight:700; color:#aaa; text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px; }
    .dval { font-size:15px; font-weight:700; color:#111; }
    .dval-sub { font-size:13px; color:#888; margin-top:2px; }
    .dval.reason { color:#D84040; font-weight:500; font-size:14px; }

    /* Join video card */
    .join-card { background:linear-gradient(135deg,#E6F0FF,#fff); border-radius:16px; padding:18px; margin-bottom:12px; border:1.5px solid #C3D9FF; }
    .join-header { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:#006BFF; margin-bottom:8px; }
    .join-card p { font-size:13px; color:#555; margin-bottom:12px; line-height:1.5; }
    .btn-join { display:flex; align-items:center; gap:8px; background:#006BFF; color:#fff; border:none; border-radius:12px; padding:12px 18px; font-size:14px; font-weight:700; cursor:pointer; text-decoration:none; width:fit-content; font-family:inherit; }
    .btn-join:hover { background:#0052CC; }
    .join-note { font-size:12px; color:#888; margin-top:10px; }

    /* Pending Calendly card */
    .calendly-card { background:#FEF9E7; border-radius:16px; padding:16px; margin-bottom:12px; border:1.5px solid #FDE68A; }
    .cal-header { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:#d4a017; margin-bottom:6px; }
    .calendly-card p { font-size:13px; color:#666; line-height:1.5; margin:0; }

    /* Email note */
    .email-note { display:flex; align-items:center; gap:7px; font-size:12px; color:#888; margin-bottom:14px; padding:10px 14px; background:#F7F8FA; border-radius:10px; }

    /* Actions */
    .actions { display:flex; gap:10px; margin-bottom:12px; }
    .btn-reschedule { flex:1; display:flex; align-items:center; justify-content:center; gap:7px; padding:13px; border:1.5px solid #D84040; background:#fff; color:#D84040; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-cancel { flex:1; display:flex; align-items:center; justify-content:center; gap:7px; padding:13px; border:none; background:#FEF2F2; color:#D84040; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-cancel:disabled, .btn-reschedule:disabled { opacity:.55; cursor:not-allowed; }

    /* Dialog */
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:100; }
    .dialog { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; border-radius:20px; padding:28px 24px; width:90%; max-width:380px; z-index:101; box-shadow:0 16px 48px rgba(0,0,0,.18); }
    .dialog-icon { width:52px; height:52px; background:#FEF2F2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .dialog h3 { font-size:18px; font-weight:700; color:#111; text-align:center; margin-bottom:8px; }
    .dialog p { font-size:14px; color:#666; text-align:center; line-height:1.5; margin-bottom:16px; }
    .dialog p strong { color:#111; }
    .field { margin-bottom:14px; }
    .field label { display:block; font-size:12px; font-weight:600; color:#555; margin-bottom:6px; }
    .sel { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:inherit; outline:none; }
    .dialog-actions { display:flex; gap:10px; }
    .btn-keep { flex:1; padding:12px; border:1.5px solid #e8e8e8; background:#fff; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; color:#555; font-family:inherit; }
    .btn-confirm-cancel { flex:1; padding:12px; background:#D84040; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; font-family:inherit; }
    .btn-confirm-cancel:disabled { opacity:.55; cursor:not-allowed; }
    .cancelled-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#E1F5EE; color:#0F6E56; border-radius:12px; padding:14px 20px; font-size:14px; font-weight:600; display:flex; align-items:center; gap:8px; z-index:200; box-shadow:0 4px 20px rgba(0,0,0,.12); }
  `],
})
export class AppointmentDetailComponent implements OnInit {
  private svc    = inject(AppointmentService);
  readonly router = inject(Router);
  private route  = inject(ActivatedRoute);

  loading    = signal(true);
  cancelling = signal(false);
  appt       = signal<any>(null);
  showCancel = false;
  cancelReason = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getMyAppointments().subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        this.appt.set(list.find((a: any) => a.id === id) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getTime(): Date {
    return new Date(this.appt()?.appointmentTime ?? this.appt()?.scheduledAt ?? Date.now());
  }

  getDoctorName(): string {
    const a = this.appt();
    if (!a) return '';
    const name = a.doctorName ?? a.physicianName ?? '';
    // Skip if name is just "Doctor" or a number
    if (name && name !== 'Doctor' && isNaN(Number(name))) return 'Dr. ' + name;
    const f = String(a.doctorFirstName ?? a.firstName ?? '');
    const l = String(a.doctorLastName  ?? a.lastName  ?? '');
    const full = (f + ' ' + l).trim();
    if (full && full.toLowerCase() !== 'doctor' && full.trim() !== '') return 'Dr. ' + full;
    return a.doctorEmail?.split('@')[0] ? 'Dr. ' + a.doctorEmail.split('@')[0] : 'Doctor';
  }

  getDoctorSpec(): string {
    const a = this.appt();
    return a?.specialtyName ?? a?.specialization ?? a?.doctorSpecialty ?? '';
  }

  initials(): string {
    const name = this.getDoctorName().replace('Dr. ', '');
    const parts = name.split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'DR';
  }

  avatarBg(): string {
    const colors = ['#2D4A8A','#D84040','#0F6E56','#7C3AED','#0891B2'];
    const n = this.getDoctorName().charCodeAt(4) || 0;
    return colors[n % colors.length];
  }

  getTypeLabel(): string {
    const t = this.appt()?.type;
    const numMap: Record<number,string> = { 0:'In Person', 1:'Video Call', 2:'Message Chat' };
    const strMap: Record<string,string> = { 'video':'Video Call', 'in_person':'In Person', 'message':'Message Chat', 'Video':'Video Call', 'InPerson':'In Person', 'HomeVisit':'Home Visit' };
    if (typeof t === 'number') return numMap[t] ?? 'In Person';
    return strMap[String(t ?? '')] ?? String(t ?? 'In Person');
  }

  getDuration(): number {
    const d = this.appt()?.durationMinutes ?? this.appt()?.duration ?? 0;
    return typeof d === 'number' ? d : 0;
  }

  getMeetingLink(): string {
    return this.appt()?.meetingLink ?? this.appt()?.calendlyEventUrl ?? this.appt()?.videoLink ?? '';
  }

  statusOf(): string {
    const s = this.appt()?.status;
    const num: Record<number,string> = { 0:'pending', 1:'confirmed', 2:'cancelled', 3:'completed', 4:'rescheduled' };
    if (typeof s === 'number') return num[s] ?? 'pending';
    return String(s ?? '').toLowerCase();
  }

  getStatusText(): string {
    const map: Record<string,string> = {
      pending:'Pending', confirmed:'Confirmed', cancelled:'Cancelled',
      completed:'Completed', rescheduled:'Rescheduled'
    };
    return map[this.statusOf()] ?? 'Pending';
  }

  getStatusCls(): string { return this.statusOf(); }

  isVideoType(): boolean { const t = this.appt()?.type; return t === 'video' || t === 1; }
  isMessageType(): boolean { const t = this.appt()?.type; return t === 'message' || t === 2; }

  isActive(): boolean {
    return ['pending','confirmed','rescheduled'].includes(this.statusOf());
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  promptCancel(): void { this.cancelReason = ''; this.showCancel = true; }

  cancelled  = signal(false);

  doCancel(): void {
    this.cancelling.set(true);
    this.svc.cancelByPatient(this.appt()!.id).subscribe({
      next: (res: any) => {
        this.cancelling.set(false);
        this.showCancel = false;
        this.cancelled.set(true);
        // Set to both numeric and string so statusOf() handles either
        this.appt.update((a: any) => ({ ...a, status: 'Cancelled' }));
        this.svc.needsRefresh = true;
        setTimeout(() => this.router.navigate(['/patient/appointments']), 1800);
      },
      error: (err: any) => {
        this.cancelling.set(false);
        this.showCancel = false;
        const msg = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error ?? 'Unknown error');
        alert('Cancel failed: ' + msg);
      },
    });
  }
}
