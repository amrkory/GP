import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { FormsModule }                         from '@angular/forms';
import { ActivatedRoute, Router }              from '@angular/router';
import { AppointmentService }                  from '../../../../core/services/appointment.service';
import { TimeSlot, Appointment }               from '../../../../core/models/api.models';

@Component({
  selector: 'app-reschedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.back()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Reschedule</h1>
        <span></span>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner-lg"></div></div>

      <ng-container *ngIf="!loading() && appt()">
        <!-- Current appointment info -->
        <div class="current-card">
          <p class="current-label">Current appointment</p>
          <div class="current-info">
            <span class="doc-name">{{ appt()!.doctorName }}</span>
            <span class="current-date">{{ appt()!.scheduledAt | date:'EEE, MMM d · h:mm a' }}</span>
          </div>
        </div>

        <!-- Date picker -->
        <div class="field">
          <label>Select new date</label>
          <input type="date" [(ngModel)]="selectedDate" (change)="loadSlots()"
                 class="date-input" [min]="today()" />
        </div>

        <!-- Slots -->
        <div class="slots-loading" *ngIf="slotsLoading()">
          <div class="spinner-sm"></div> Loading available slots…
        </div>

        <div *ngIf="!slotsLoading() && slots().length > 0">
          <label class="field-label">Available time slots</label>
          <div class="slots-grid">
            <button *ngFor="let s of slots()" class="slot-btn"
                    [class.active]="selectedSlot()?.startTime === s.startTime"
                    [class.taken]="!s.available"
                    [disabled]="!s.available"
                    (click)="selectedSlot.set(s)">
              {{ s.startTime | date:'h:mm a' }}
            </button>
          </div>
        </div>

        <div class="no-slots" *ngIf="!slotsLoading() && selectedDate && slots().length === 0">
          No available slots for this date. Please try another day.
        </div>

        <!-- Reason -->
        <div class="field" style="margin-top:16px" *ngIf="selectedSlot()">
          <label>Reason for rescheduling (optional)</label>
          <textarea [(ngModel)]="reason" class="notes-input" rows="3"
                    placeholder="E.g. schedule conflict, feeling better..."></textarea>
        </div>

        <div class="alert-success" *ngIf="done()">✅ Appointment rescheduled successfully!</div>

        <button class="btn-primary" [disabled]="!selectedSlot() || saving() || done()" (click)="save()">
          <span class="mini-spinner" *ngIf="saving()"></span>
          {{ saving() ? 'Rescheduling...' : done() ? 'Done!' : 'Confirm Reschedule' }}
        </button>
      </ng-container>
    </div>
  `,
  styles: [`
    .page    { padding:16px; max-width:640px; margin:0 auto; }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .top-bar h1 { font-size:18px; font-weight:700; color:#111; }
    .back-btn   { background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; }
    .loading    { display:flex; justify-content:center; padding:40px; }
    .spinner-lg { width:32px; height:32px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    .spinner-sm { width:16px; height:16px; border:2px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .current-card  { background:#FEF2F2; border:1.5px solid #FBDCDC; border-radius:12px; padding:14px 16px; margin-bottom:16px; }
    .current-label { font-size:12px; color:#888; margin-bottom:4px; }
    .current-info  { display:flex; flex-direction:column; gap:2px; }
    .doc-name      { font-size:15px; font-weight:600; color:#111; }
    .current-date  { font-size:13px; color:#D84040; }

    .field       { margin-bottom:14px; }
    .field label,.field-label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:6px; }
    .date-input  { width:100%; padding:10px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .date-input:focus { border-color:#D84040; }
    .notes-input { width:100%; padding:10px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; resize:none; box-sizing:border-box; }
    .notes-input:focus { border-color:#D84040; }

    .slots-loading { display:flex; align-items:center; gap:8px; color:#888; font-size:13px; padding:12px 0; }
    .slots-grid    { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:8px; }
    .slot-btn      { padding:10px; border:1.5px solid #e8e8e8; border-radius:10px; background:#fff; font-size:13px; cursor:pointer; transition:all .15s; font-family:'Cairo',sans-serif; }
    .slot-btn.active { border-color:#D84040; background:#FEF2F2; color:#D84040; font-weight:600; }
    .slot-btn.taken  { background:#f8f8f8; color:#ccc; cursor:not-allowed; }
    .no-slots      { text-align:center; color:#888; font-size:13px; padding:20px 0; }

    .alert-success { background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:14px; font-weight:600; }
    .btn-primary   { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; margin-top:8px; }
    .btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
  `],
})
export class RescheduleComponent implements OnInit {
  private svc   = inject(AppointmentService);
  readonly router = { back: () => window.history.back() };
  private route = inject(ActivatedRoute);
  private nav   = inject(Router);

  loading      = signal(true);
  slotsLoading = signal(false);
  saving       = signal(false);
  done         = signal(false);
  appt         = signal<Appointment | null>(null);
  slots        = signal<TimeSlot[]>([]);
  selectedSlot = signal<TimeSlot | null>(null);
  selectedDate = '';
  reason       = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getMyAppointments().subscribe((res: any) => { const list = res?.data?.items ?? res?.data ?? []; this.appt.set(list.find((a: any) => a.id === id) ?? list[0] ?? null); this.loading.set(false); });
  }

  loadSlots(): void {
    if (!this.selectedDate || !this.appt()) return;
    this.slotsLoading.set(true);
    this.selectedSlot.set(null);
    this.svc.getSlots(this.appt()!.doctorId, this.selectedDate).subscribe((res: any) => {
      this.slots.set(res.data);
      this.slotsLoading.set(false);
    });
  }

  save(): void {
    this.saving.set(true);
    this.svc.reschedule(this.appt()!.id, this.selectedSlot()!.startTime, 'Patient rescheduled').subscribe(() => {
      this.saving.set(false);
      this.done.set(true);
      setTimeout(() => this.nav.navigate(['/patient/appointments']), 1500);
    });
  }

  today(): string { return new Date().toISOString().split('T')[0]; }
}
