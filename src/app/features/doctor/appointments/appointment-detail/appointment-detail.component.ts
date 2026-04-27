import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';
import { ApiResponse, Appointment } from '../../../../core/models/api.models';

@Component({
  selector: 'app-doctor-appointment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/doctor/appointments'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Appointment Details</h1>
        <span></span>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading() && appt()">
        <!-- Patient card -->
        <div class="patient-card">
          <div class="pat-avatar">{{ patInitials(appt()!.patientName) }}</div>
          <div class="pat-info">
            <div class="pat-name">{{ appt()!.patientName }}</div>
            <div class="pat-spec">{{ appt()!.specialtyName }}</div>
          </div>
          <span class="status-badge" [class]="appt()!.status.toLowerCase()">{{ appt()!.status }}</span>
        </div>

        <!-- Info rows -->
        <div class="info-card">
          <div class="info-row">
            <div class="info-icon blue"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <div><div class="info-lbl">Date</div><div class="info-val">{{ appt()!.scheduledAt | date:'EEEE, MMMM d, y' }}</div></div>
          </div>
          <div class="info-row">
            <div class="info-icon green"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <div><div class="info-lbl">Time</div><div class="info-val">{{ appt()!.scheduledAt | date:'h:mm a' }} · {{ appt()!.durationMinutes }} min</div></div>
          </div>
          <div class="info-row">
            <div class="info-icon purple"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5BAD" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>
            <div><div class="info-lbl">Type</div><div class="info-val">{{ appt()!.type }}</div></div>
          </div>
          <div class="info-row" *ngIf="appt()!.notes">
            <div class="info-icon gray"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
            <div><div class="info-lbl">Notes</div><div class="info-val">{{ appt()!.notes }}</div></div>
          </div>
          <div class="info-row" *ngIf="appt()!.meetingLink">
            <div class="info-icon blue"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
            <div><div class="info-lbl">Meeting Link</div><a class="meeting-link" [href]="appt()!.meetingLink!">Join Video Call</a></div>
          </div>
          <div class="info-row" *ngIf="appt()!.cancellationReason">
            <div class="info-icon red"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
            <div><div class="info-lbl">Cancellation Reason</div><div class="info-val">{{ appt()!.cancellationReason }}</div></div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="actions" *ngIf="appt()!.status === 'Pending'">
          <button class="btn-confirm" (click)="confirmAppt()" [disabled]="!!acting()">
            <span class="mini-spinner" *ngIf="acting() === 'confirm'"></span>
            <svg *ngIf="acting() !== 'confirm'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Confirm Appointment
          </button>
          <button class="btn-cancel-appt" (click)="promptCancel()" [disabled]="!!acting()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Cancel
          </button>
        </div>

        <div class="actions" *ngIf="appt()!.status === 'Confirmed'">
          <a [routerLink]="['/doctor/patients', appt()!.patientId]" class="btn-view-patient">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            View Patient Profile
          </a>
          <button class="btn-cancel-appt" (click)="promptCancel()" [disabled]="!!acting()">
            Cancel Appointment
          </button>
        </div>

        <!-- Success toast -->
        <div class="toast success" *ngIf="toast() === 'confirmed'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Appointment confirmed successfully!
        </div>
        <div class="toast cancelled" *ngIf="toast() === 'cancelled'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Appointment cancelled.
        </div>
      </ng-container>
    </div>

    <!-- ── CANCEL CONFIRMATION DIALOG ─────────────────────────────── -->
    <div class="dialog-backdrop" *ngIf="showCancelDialog" (click)="showCancelDialog = false"></div>
    <div class="dialog" *ngIf="showCancelDialog">
      <div class="dialog-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3>Cancel Appointment?</h3>
      <p>This appointment with <strong>{{ appt()?.patientName }}</strong> on <strong>{{ appt()?.scheduledAt | date:'MMM d · h:mm a' }}</strong> will be cancelled. This action cannot be undone.</p>

      <div class="field">
        <label>Reason for cancellation</label>
        <select [(ngModel)]="cancelReason" class="select-input">
          <option value="">Select a reason</option>
          <option value="Doctor unavailable">Doctor unavailable</option>
          <option value="Patient requested cancellation">Patient requested</option>
          <option value="Emergency">Emergency</option>
          <option value="Schedule conflict">Schedule conflict</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div class="dialog-actions">
        <button class="dialog-btn-no" (click)="showCancelDialog = false">
          Keep Appointment
        </button>
        <button class="dialog-btn-yes" (click)="doCancel()" [disabled]="!cancelReason || acting() === 'cancel'">
          <span class="mini-spinner" *ngIf="acting() === 'cancel'"></span>
          Yes, Cancel It
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:760px; }
    @media (max-width:768px) { .page { padding:16px; } }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .top-bar h1 { font-size:18px; font-weight:700; color:#111; }
    .back-btn { background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; border-radius:8px; }
    .back-btn:hover { background:#f0f0f0; }
    .loading  { display:flex; justify-content:center; padding:40px; }
    .spinner  { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .patient-card { background:#fff; border-radius:14px; padding:16px; display:flex; align-items:center; gap:14px; margin-bottom:12px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .pat-avatar { width:50px; height:50px; border-radius:50%; background:#2D4A8A; color:#fff; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .pat-info  { flex:1; }
    .pat-name  { font-size:17px; font-weight:700; color:#111; }
    .pat-spec  { font-size:13px; color:#888; margin-top:2px; }
    .status-badge { font-size:12px; padding:5px 12px; border-radius:20px; font-weight:600; }
    .status-badge.confirmed { background:#E1F5EE; color:#0F6E56; }
    .status-badge.pending   { background:#FEF9E7; color:#d4a017; }
    .status-badge.cancelled { background:#FEF2F2; color:#D84040; }
    .status-badge.completed { background:#f0f0f0; color:#555; }

    .info-card { background:#fff; border-radius:14px; margin-bottom:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); overflow:hidden; }
    .info-row  { display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border-bottom:1px solid #f5f5f5; }
    .info-row:last-child { border-bottom:none; }
    .info-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .info-icon.blue   { background:#E6F1FB; }
    .info-icon.green  { background:#E1F5EE; }
    .info-icon.purple { background:#EDE9FF; }
    .info-icon.gray   { background:#f0f0f0; }
    .info-icon.red    { background:#FEF2F2; }
    .info-lbl  { font-size:11px; color:#888; margin-bottom:3px; }
    .info-val  { font-size:14px; color:#111; font-weight:500; }
    .meeting-link { color:#2D4A8A; font-weight:600; text-decoration:none; font-size:14px; }

    .actions { display:flex; gap:10px; margin-bottom:14px; }
    .btn-confirm { flex:2; padding:13px 16px; background:#2D4A8A; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:'Inter',sans-serif; transition:opacity .15s; }
    .btn-confirm:hover:not(:disabled) { opacity:.9; }
    .btn-confirm:disabled { opacity:.6; cursor:not-allowed; }
    .btn-cancel-appt { flex:1; padding:13px; background:#FEF2F2; color:#D84040; border:1.5px solid #FBDCDC; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; display:flex; align-items:center; justify-content:center; gap:6px; transition:background .15s; }
    .btn-cancel-appt:hover:not(:disabled) { background:#FEE2E2; }
    .btn-cancel-appt:disabled { opacity:.6; cursor:not-allowed; }
    .btn-view-patient { flex:2; padding:13px; background:#E6F1FB; color:#185FA5; border-radius:12px; text-decoration:none; font-size:14px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; }

    /* Toast */
    .toast { display:flex; align-items:center; gap:10px; padding:14px 16px; border-radius:12px; font-size:14px; font-weight:600; animation:fadeIn .3s ease; }
    .toast.success  { background:#E1F5EE; color:#0F6E56; }
    .toast.cancelled { background:#FEF2F2; color:#D84040; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

    /* Cancel dialog */
    .dialog-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:100; animation:fadeIn .2s; }
    .dialog { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; border-radius:20px; padding:28px 24px; width:90%; max-width:420px; z-index:101; box-shadow:0 16px 48px rgba(0,0,0,.18); animation:popIn .25s cubic-bezier(.34,1.56,.64,1); }
    @keyframes popIn { from { opacity:0; transform:translate(-50%,-50%) scale(.92); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
    .dialog-icon { width:56px; height:56px; background:#FEF2F2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .dialog h3 { font-size:18px; font-weight:700; color:#111; text-align:center; margin-bottom:8px; }
    .dialog p  { font-size:14px; color:#666; text-align:center; line-height:1.6; margin-bottom:18px; }
    .dialog p strong { color:#111; }
    .field { margin-bottom:18px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:6px; }
    .select-input { width:100%; padding:11px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Inter',sans-serif; outline:none; appearance:none; background:#fff; }
    .select-input:focus { border-color:#D84040; }
    .dialog-actions { display:flex; gap:10px; }
    .dialog-btn-no  { flex:1; padding:12px; border:1.5px solid #e8e8e8; background:#fff; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; color:#555; }
    .dialog-btn-no:hover { background:#f8f8f8; }
    .dialog-btn-yes { flex:1; padding:12px; background:#D84040; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; }
    .dialog-btn-yes:hover:not(:disabled) { background:#C03030; }
    .dialog-btn-yes:disabled { opacity:.55; cursor:not-allowed; }
  `],
})
export class DoctorAppointmentDetailComponent implements OnInit {
  private http  = inject(HttpClient);
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);

  loading         = signal(true);
  acting          = signal('');
  toast           = signal('');
  appt            = signal<Appointment | null>(null);
  showCancelDialog = false;
  cancelReason     = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    // Backend has no single-appointment GET; fetch list and find by id
    this.http.get<any>(`${environment.apiUrl}/Appointment/doctor`)
      .subscribe({
        next: (res: any) => {
          const list = res?.data?.items ?? res?.data ?? res ?? [];
          const found = Array.isArray(list) ? list.find((a: any) => a.id === id) : list;
          this.appt.set(found ?? null);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  confirmAppt(): void {
    this.acting.set('confirm');
    this.http.put<ApiResponse<Appointment>>(
      `${environment.apiUrl}/Appointment/respond/${this.appt()!.id}?accept=true`, {}
    ).subscribe({
      next: (res: any) => {
        this.appt.set(res.data);
        this.acting.set('');
        this.toast.set('confirmed');
        setTimeout(() => this.toast.set(''), 3000);
      },
      error: () => this.acting.set(''),
    });
  }

  promptCancel(): void {
    this.cancelReason = '';
    this.showCancelDialog = true;
  }

  doCancel(): void {
    if (!this.cancelReason) return;
    this.acting.set('cancel');
    this.http.put<ApiResponse<Appointment>>(
      `${environment.apiUrl}/Appointment/doctor/cancel/${this.appt()!.id}`,
      { reason: this.cancelReason }
    ).subscribe({
      next: (res: any) => {
        this.appt.set(res.data);
        this.acting.set('');
        this.showCancelDialog = false;
        this.toast.set('cancelled');
        setTimeout(() => this.toast.set(''), 3000);
      },
      error: () => {
        this.acting.set('');
        this.showCancelDialog = false;
      },
    });
  }

  patInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }
}
