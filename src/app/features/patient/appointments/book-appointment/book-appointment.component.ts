import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { FormsModule }                         from '@angular/forms';
import { Router, RouterLink }                  from '@angular/router';
import { AppointmentService }                  from '../../../../core/services/appointment.service';
import { DoctorProfile, TimeSlot }             from '../../../../core/models/api.models';

type Step = 'doctor' | 'slot' | 'confirm';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>{{ stepTitle() }}</h1>
        <span></span>
      </div>

      <!-- Step indicator -->
      <div class="steps">
        <div class="step" [class.active]="step() === 'doctor'" [class.done]="step() !== 'doctor'">1</div>
        <div class="step-line"></div>
        <div class="step" [class.active]="step() === 'slot'" [class.done]="step() === 'confirm'">2</div>
        <div class="step-line"></div>
        <div class="step" [class.active]="step() === 'confirm'">3</div>
      </div>

      <!-- STEP 1: Choose Doctor -->
      <ng-container *ngIf="step() === 'doctor'">
        <div class="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input [(ngModel)]="searchText" placeholder="Search doctors or specialty..." (input)="filterDoctors()" />
        </div>

        <div class="doctor-list">
          <div class="doctor-card" *ngFor="let d of filteredDoctors()"
               [class.selected]="selectedDoctor()?.id === d.id"
               (click)="selectDoctor(d)">
            <div class="doc-avatar">{{ initials(d.firstName + ' ' + d.lastName) }}</div>
            <div class="doc-info">
              <div class="doc-name">Dr. {{ d.firstName }} {{ d.lastName }}</div>
              <div class="doc-spec">{{ d.specialtyName }}</div>
              <div class="doc-meta">
                <span class="rating">⭐ {{ d.rating }}</span>
                <span class="review-count">({{ d.reviewCount }})</span>
<span class="fee">EGP {{ d.consultationFee ?? 0 }}</span>              </div>
            </div>
            <div class="selected-dot" *ngIf="selectedDoctor()?.id === d.id">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#D84040" stroke="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
            </div>
          </div>
        </div>

        <button class="btn-next" [disabled]="!selectedDoctor()" (click)="nextStep()">
          Continue → Choose Time Slot
        </button>
      </ng-container>

      <!-- STEP 2: Choose Slot -->
      <ng-container *ngIf="step() === 'slot'">
        <div class="selected-doctor-mini">
          <div class="doc-avatar-sm">{{ initials(selectedDoctor()!.firstName + ' ' + selectedDoctor()!.lastName) }}</div>
          <div>
            <div style="font-weight:600;font-size:14px">Dr. {{ selectedDoctor()!.firstName }} {{ selectedDoctor()!.lastName }}</div>
            <div style="color:#888;font-size:12px">{{ selectedDoctor()!.specialtyName }}</div>
          </div>
        </div>

        <div class="field">
          <label>Select Date</label>
          <input type="date" [(ngModel)]="selectedDate" (change)="loadSlots()" class="date-input"
                 [min]="today()" />
        </div>

        <div class="type-row">
          <button *ngFor="let t of types" class="type-btn"
                  [class.active]="apptType === t.val" (click)="apptType = t.val">
            {{ t.icon }} {{ t.label }}
          </button>
        </div>

        <div class="slots-loading" *ngIf="slotsLoading()"><div class="spinner-sm"></div> Loading slots...</div>

        <div class="slots-grid" *ngIf="!slotsLoading() && slots().length > 0">
          <button *ngFor="let s of slots()" class="slot-btn"
                  [class.active]="selectedSlot()?.startTime === s.startTime"
                  [class.taken]="!s.available"
                  [disabled]="!s.available"
                  (click)="selectedSlot.set(s)">
            {{ s.startTime | date:'h:mm a' }}
          </button>
        </div>

        <div class="no-slots" *ngIf="!slotsLoading() && selectedDate && slots().length === 0">
          No available slots for this date. Try another day.
        </div>

        <div class="field" style="margin-top:16px">
          <label>Notes (optional)</label>
          <textarea [(ngModel)]="notes" placeholder="Describe your symptoms or reason for visit..." class="notes-input" rows="3"></textarea>
        </div>

        <button class="btn-next" [disabled]="!selectedSlot()" (click)="nextStep()">
          Continue → Confirm
        </button>
      </ng-container>

      <!-- STEP 3: Confirm -->
      <ng-container *ngIf="step() === 'confirm'">
        <div class="confirm-card">
          <div class="confirm-row">
            <span class="confirm-label">Doctor</span>
            <span class="confirm-val">Dr. {{ selectedDoctor()!.firstName }} {{ selectedDoctor()!.lastName }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Specialty</span>
            <span class="confirm-val">{{ selectedDoctor()!.specialtyName }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Date</span>
            <span class="confirm-val">{{ selectedSlot()!.startTime | date:'EEEE, MMMM d, y' }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Time</span>
            <span class="confirm-val">{{ selectedSlot()!.startTime | date:'h:mm a' }} – {{ selectedSlot()!.endTime | date:'h:mm a' }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Type</span>
            <span class="confirm-val">{{ apptType }}</span>
          </div>
          <div class="confirm-row" *ngIf="notes">
            <span class="confirm-label">Notes</span>
            <span class="confirm-val">{{ notes }}</span>
          </div>
        </div>

        <div class="fee-row">
          <span>Consultation fee</span>
<strong>EGP {{ selectedDoctor()!.consultationFee ?? 0 }}</strong>        </div>

        <div class="alert-success" *ngIf="booked()">
          ✅ Appointment booked successfully!
        </div>

        <button class="btn-next" (click)="confirm()" [disabled]="booking() || booked()">
          <span class="mini-spinner" *ngIf="booking()"></span>
          {{ booking() ? 'Booking...' : booked() ? 'Booked!' : 'Confirm Booking' }}
        </button>
      </ng-container>

    </div>
  `,
  styles: [`
    .page    { padding: 16px; max-width: 640px; margin: 0 auto; }
    .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .top-bar h1 { font-size: 18px; font-weight: 700; color: #111; }
    .back-btn { background: none; border: none; cursor: pointer; color: #555; padding: 4px; display: flex; }

    .steps { display: flex; align-items: center; margin-bottom: 20px; }
    .step  { width: 28px; height: 28px; border-radius: 50%; background: #e8e8e8; color: #888; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s; }
    .step.active { background: #D84040; color: #fff; }
    .step.done   { background: #22c55e; color: #fff; }
    .step-line   { flex: 1; height: 2px; background: #e8e8e8; }

    .search-wrap { display: flex; align-items: center; gap: 10px; background: #fff; border: 1.5px solid #e8e8e8; border-radius: 12px; padding: 10px 14px; margin-bottom: 14px; }
    .search-wrap input { flex: 1; border: none; outline: none; font-size: 14px; font-family: 'Cairo', sans-serif; }

    .doctor-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .doctor-card { background: #fff; border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 12px; border: 1.5px solid #e8e8e8; cursor: pointer; transition: border-color .15s; }
    .doctor-card.selected { border-color: #D84040; background: #fff8f8; }
    .doc-avatar  { width: 46px; height: 46px; border-radius: 50%; background: #D84040; color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .doc-info    { flex: 1; }
    .doc-name    { font-size: 15px; font-weight: 600; color: #111; }
    .doc-spec    { font-size: 12px; color: #888; margin: 2px 0; }
    .doc-meta    { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #555; }
    .rating      { color: #f59e0b; font-weight: 600; }
    .fee         { color: #D84040; font-weight: 600; margin-left: auto; }
    .selected-dot { flex-shrink: 0; }

    .selected-doctor-mini { display: flex; align-items: center; gap: 10px; background: #fff8f8; border: 1.5px solid #D84040; border-radius: 12px; padding: 12px 14px; margin-bottom: 16px; }
    .doc-avatar-sm { width: 38px; height: 38px; border-radius: 50%; background: #D84040; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

    .field { margin-bottom: 14px; label { display: block; font-size: 13px; font-weight: 600; color: #111; margin-bottom: 6px; } }
    .date-input  { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e8e8; border-radius: 10px; font-size: 14px; font-family: 'Cairo', sans-serif; outline: none; box-sizing: border-box; }
    .date-input:focus { border-color: #D84040; }
    .notes-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e8e8e8; border-radius: 10px; font-size: 14px; font-family: 'Cairo', sans-serif; outline: none; resize: none; box-sizing: border-box; }
    .notes-input:focus { border-color: #D84040; }

    .type-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .type-btn  { flex: 1; padding: 10px 8px; border: 1.5px solid #e8e8e8; border-radius: 10px; background: #fff; font-size: 13px; cursor: pointer; transition: all .15s; }
    .type-btn.active { border-color: #D84040; background: #FEF2F2; color: #D84040; font-weight: 600; }

    .slots-loading { display: flex; align-items: center; gap: 8px; color: #888; font-size: 13px; padding: 12px 0; }
    .spinner-sm    { width: 16px; height: 16px; border: 2px solid #f0f0f0; border-top-color: #D84040; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .slots-grid    { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
    .slot-btn      { padding: 10px; border: 1.5px solid #e8e8e8; border-radius: 10px; background: #fff; font-size: 13px; cursor: pointer; transition: all .15s; font-family: 'Cairo', sans-serif; }
    .slot-btn.active { border-color: #D84040; background: #FEF2F2; color: #D84040; font-weight: 600; }
    .slot-btn.taken  { background: #f8f8f8; color: #ccc; cursor: not-allowed; text-decoration: line-through; }
    .no-slots      { text-align: center; color: #888; font-size: 13px; padding: 20px 0; }

    .confirm-card  { background: #fff; border-radius: 14px; overflow: hidden; margin-bottom: 12px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
    .confirm-row   { display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
    .confirm-row:last-child { border-bottom: none; }
    .confirm-label { color: #888; }
    .confirm-val   { font-weight: 600; color: #111; text-align: right; max-width: 60%; }

    .fee-row   { display: flex; justify-content: space-between; padding: 12px 16px; background: #fff; border-radius: 12px; margin-bottom: 16px; font-size: 15px; }
    .fee-row strong { color: #D84040; }

    .alert-success { background: #E1F5EE; color: #0F6E56; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; font-size: 14px; font-weight: 600; }

    .btn-next { width: 100%; padding: 14px; background: #D84040; color: #fff; border: none; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Cairo', sans-serif; }
    .btn-next:disabled { opacity: 0.55; cursor: not-allowed; }
    .mini-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; margin-right: 6px; }
  `],
})
export class BookAppointmentComponent implements OnInit {
  private svc   = inject(AppointmentService);
  readonly router = inject(Router);

  step            = signal<Step>('doctor');
  loading         = signal(true);
  slotsLoading    = signal(false);
  booking         = signal(false);
  booked          = signal(false);

  allDoctors      = signal<DoctorProfile[]>([]);
  filteredDoctors = signal<DoctorProfile[]>([]);
  selectedDoctor  = signal<DoctorProfile | null>(null);
  slots           = signal<TimeSlot[]>([]);
  selectedSlot    = signal<TimeSlot | null>(null);

  searchText  = '';
  selectedDate = '';
  apptType     = 'InPerson';
  notes        = '';

  types = [
    { val: 'InPerson', label: 'In Person', icon: '🏥' },
    { val: 'Video',    label: 'Video Call', icon: '📹' },
    { val: 'HomeVisit',label: 'Home Visit', icon: '🏠' },
  ];

  ngOnInit(): void {
    this.svc.getDoctors().subscribe(res => {
      this.allDoctors.set(res.data.items);
      this.filteredDoctors.set(res.data.items);
      this.loading.set(false);
    });
  }

  filterDoctors(): void {
    const q = this.searchText.toLowerCase();
    this.filteredDoctors.set(
      this.allDoctors().filter(d =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        d.specialtyName.toLowerCase().includes(q)
      )
    );
  }

  selectDoctor(d: DoctorProfile): void { this.selectedDoctor.set(d); }

  loadSlots(): void {
    if (!this.selectedDate || !this.selectedDoctor()) return;
    this.slotsLoading.set(true);
    this.selectedSlot.set(null);
    this.svc.getSlots(this.selectedDoctor()!.id, this.selectedDate).subscribe(res => {
      this.slots.set(res.data);
      this.slotsLoading.set(false);
    });
  }

  nextStep(): void {
    if (this.step() === 'doctor') this.step.set('slot');
    else if (this.step() === 'slot') this.step.set('confirm');
  }

  goBack(): void {
    if (this.step() === 'slot')    this.step.set('doctor');
    else if (this.step() === 'confirm') this.step.set('slot');
    else this.router.navigate(['/patient/appointments']);
  }

  confirm(): void {
    this.booking.set(true);
    this.svc.book({
      doctorId: this.selectedDoctor()!.id,
      scheduledAt: this.selectedSlot()!.startTime,
      type: this.apptType as any,
      notes: this.notes || undefined,
    }).subscribe(() => {
      this.booking.set(false);
      this.booked.set(true);
      setTimeout(() => this.router.navigate(['/patient/appointments']), 1500);
    });
  }

  today(): string { return new Date().toISOString().split('T')[0]; }
  stepTitle(): string { return ['Choose Doctor', 'Choose Time', 'Confirm'][['doctor','slot','confirm'].indexOf(this.step())]; }
  initials(name: string): string { return name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase(); }
}