import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../../core/services/appointment.service';

@Component({
  selector: 'app-reschedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Reschedule Appointment</h1>
        <span></span>
      </div>

      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
      </div>

      <ng-container *ngIf="!loading() && appt()">

        <!-- Current appointment info -->
        <div class="current-card">
          <div class="current-label">Current Appointment</div>
          <div class="doc-name">{{ getDoctorName() }}</div>
          <div class="current-date">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ getTime() | date:'EEE, MMM d, y · h:mm a' }}
          </div>
        </div>

        <!-- New date -->
        <div class="field">
          <label>New Date</label>
          <input type="date" [(ngModel)]="newDate" [min]="today()" class="inp"
                 (change)="newTime=''" />
        </div>

        <!-- New time -->
        <div class="field" *ngIf="newDate">
          <label>New Time</label>
          <input type="time" [(ngModel)]="newTime" class="inp" />
        </div>

        <!-- Reason -->
        <div class="field" *ngIf="newDate && newTime">
          <label>Reason for rescheduling (optional)</label>
          <textarea [(ngModel)]="reason" class="notes-inp" rows="3"
                    placeholder="e.g. Schedule conflict, feeling better..."></textarea>
        </div>

        <!-- New summary -->
        <div class="new-summary" *ngIf="newDate && newTime">
          <div class="ns-label">New appointment will be:</div>
          <div class="ns-val">{{ getNewTime() | date:'EEEE, MMMM d, y · h:mm a' }}</div>
        </div>

        <!-- Success -->
        <div class="toast success" *ngIf="done()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Appointment rescheduled! Redirecting...
        </div>

        <!-- Error -->
        <div class="toast error" *ngIf="errMsg()">{{ errMsg() }}</div>

        <button class="btn-save" [disabled]="!newDate || !newTime || saving() || done()"
                (click)="save()">
          <span class="mini-spinner" *ngIf="saving()"></span>
          <svg *ngIf="!saving()" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-8.36"/></svg>
          {{ saving() ? 'Rescheduling...' : done() ? 'Done!' : 'Confirm Reschedule' }}
        </button>
      </ng-container>

      <div class="not-found" *ngIf="!loading() && !appt()">
        <p>Appointment not found.</p>
        <button class="btn-back-plain" (click)="nav.navigate(['/patient/appointments'])">Go Back</button>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; }
    .page { padding:24px; max-width:560px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:16px;} }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .top-bar h1 { font-size:18px; font-weight:800; color:#111; }
    .back-btn { background:none; border:none; cursor:pointer; color:#555; padding:6px; border-radius:8px; display:flex; }
    .back-btn:hover { background:#f0f0f0; }
    .loading { display:flex; justify-content:center; padding:48px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:5px; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .current-card { background:#FEF2F2; border:1.5px solid #FBDCDC; border-radius:14px; padding:16px; margin-bottom:20px; }
    .current-label { font-size:11px; font-weight:700; color:#D84040; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; }
    .doc-name { font-size:16px; font-weight:700; color:#111; margin-bottom:5px; }
    .current-date { display:flex; align-items:center; gap:6px; font-size:13px; color:#D84040; font-weight:600; }
    .field { margin-bottom:16px; }
    .field label { display:block; font-size:13px; font-weight:700; color:#555; margin-bottom:7px; }
    .inp { width:100%; padding:12px 14px; border:1.5px solid #e8e8e8; border-radius:12px; font-size:15px; outline:none; font-family:inherit; }
    .inp:focus { border-color:#D84040; }
    .notes-inp { width:100%; padding:12px 14px; border:1.5px solid #e8e8e8; border-radius:12px; font-size:14px; outline:none; font-family:inherit; resize:vertical; }
    .notes-inp:focus { border-color:#D84040; }
    .new-summary { background:#E1F5EE; border-radius:12px; padding:14px 16px; margin-bottom:16px; }
    .ns-label { font-size:11px; font-weight:700; color:#0F6E56; text-transform:uppercase; letter-spacing:.5px; margin-bottom:5px; }
    .ns-val { font-size:15px; font-weight:700; color:#111; }
    .toast { display:flex; align-items:center; gap:8px; padding:13px 16px; border-radius:12px; font-size:14px; font-weight:600; margin-bottom:14px; }
    .toast.success { background:#E1F5EE; color:#0F6E56; }
    .toast.error   { background:#FEF2F2; color:#D84040; }
    .btn-save { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; }
    .btn-save:disabled { opacity:.55; cursor:not-allowed; }
    .btn-save:hover:not(:disabled) { opacity:.88; }
    .not-found { text-align:center; padding:40px; color:#888; }
    .btn-back-plain { background:#f0f0f0; border:none; padding:10px 20px; border-radius:10px; cursor:pointer; font-family:inherit; color:#555; }
  `],
})
export class RescheduleComponent implements OnInit {
  private svc   = inject(AppointmentService);
  readonly nav  = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  saving  = signal(false);
  done    = signal(false);
  errMsg  = signal('');
  appt    = signal<any>(null);

  newDate = '';
  newTime = '';
  reason  = '';

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

  getDoctorName(): string {
    const a = this.appt();
    if (!a) return '';
    const name = a.doctorName ?? '';
    if (name && name !== 'Doctor' && isNaN(Number(name))) return 'Dr. ' + name;
    return 'Doctor';
  }

  getTime(): Date {
    return new Date(this.appt()?.appointmentTime || this.appt()?.scheduledAt || Date.now());
  }

  getNewTime(): Date {
    if (this.newDate && this.newTime) return new Date(this.newDate + 'T' + this.newTime + ':00');
    return new Date();
  }

  goBack(): void { window.history.back(); }
  today(): string { return new Date().toISOString().split('T')[0]; }

  save(): void {
    if (!this.newDate || !this.newTime) return;
    this.saving.set(true);
    this.errMsg.set('');
    const newDateTime = new Date(this.newDate + 'T' + this.newTime + ':00').toISOString();

    this.svc.reschedule(this.appt()!.id, newDateTime, this.reason || 'Patient requested reschedule')
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.done.set(true);
          this.svc.needsRefresh = true;
        setTimeout(() => this.nav.navigate(['/patient/appointments']), 1600);
        },
        error: (err: any) => {
          this.saving.set(false);
          this.errMsg.set(err?.error?.message ?? 'Reschedule failed. Please try again.');
        },
      });
  }
}
