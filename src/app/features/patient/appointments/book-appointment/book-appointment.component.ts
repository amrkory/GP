import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { Router }             from '@angular/router';
import { HttpClient }         from '@angular/common/http';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { environment }        from '../../../../../environments/environment';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>{{ stepTitle() }}</h1>
        <span></span>
      </div>

      <!-- Steps indicator -->
      <div class="steps-row">
        <div class="step-item" [class.active]="step()==='doctor'" [class.done]="step()==='slot'||step()==='confirm'">
          <div class="step-circle">{{ step()==='slot'||step()==='confirm' ? '✓' : '1' }}</div>
          <span>Doctor</span>
        </div>
        <div class="step-line"></div>
        <div class="step-item" [class.active]="step()==='slot'" [class.done]="step()==='confirm'">
          <div class="step-circle">{{ step()==='confirm' ? '✓' : '2' }}</div>
          <span>Time</span>
        </div>
        <div class="step-line"></div>
        <div class="step-item" [class.active]="step()==='confirm'">
          <div class="step-circle">3</div>
          <span>Confirm</span>
        </div>
      </div>

      <!-- STEP 1: Choose Doctor -->
      <div *ngIf="step()==='doctor'">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input [(ngModel)]="searchText" (input)="filterDoctors()" placeholder="Search doctors or specialty..." />
        </div>

        <div class="loading-box" *ngIf="loading()">
          <div class="spinner"></div><p>Loading doctors...</p>
        </div>

        <div class="empty-box" *ngIf="!loading() && filteredDoctors().length === 0">
          <div class="empty-icon">👨‍⚕️</div>
          <h3>No doctors available yet</h3>
          <p>Doctors need to register and be approved by admin first.</p>
        </div>

        <div class="doctor-list" *ngIf="!loading()">
          <div class="doctor-card" *ngFor="let d of filteredDoctors()"
               [class.selected]="selectedDoctor()?.id === d.id"
               (click)="selectDoctor(d)">
            <div class="doc-avatar" [style.background]="docAvatarBg(d)">{{ getInitials(d) }}</div>
            <div class="doc-info">
              <div class="doc-name">Dr. {{ getName(d) }}</div>
              <div class="doc-spec">{{ getSpec(d) }}</div>
              <div class="doc-workplace" *ngIf="getWorkplace(d)">{{ getWorkplace(d) }}</div>
            </div>
            <div class="check-icon" *ngIf="selectedDoctor()?.id === d.id">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
        </div>

        <button class="btn-next" [disabled]="!selectedDoctor()" (click)="step.set('slot')">
          Continue → Choose Time
        </button>
      </div>

      <!-- STEP 2: Choose Time -->
      <div *ngIf="step()==='slot'">
        <div class="selected-doc-banner">
          <div class="sdb-avatar" [style.background]="docAvatarBg(selectedDoctor())">{{ getInitials(selectedDoctor()) }}</div>
          <div>
            <div class="sdb-name">Dr. {{ getName(selectedDoctor()) }}</div>
            <div class="sdb-spec">{{ getSpec(selectedDoctor()) }}</div>
          </div>
        </div>

        <!-- Appointment type -->
        <div class="section-title">Appointment Type</div>
        <div class="type-row">
          <button class="type-btn" *ngFor="let t of apptTypes"
                  [class.active]="apptType===t.val" (click)="apptType=t.val">
            <svg *ngIf="t.val==='in_person'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <svg *ngIf="t.val==='video'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            <svg *ngIf="t.val==='message'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {{ t.label }}
          </button>
        </div>

        <!-- Calendly slots -->
        <ng-container *ngIf="hasCalendly()">
          <div class="section-title">Available Slots (via Calendly)</div>
          <div class="slots-loading" *ngIf="slotsLoading()">
            <div class="spinner-sm"></div> Loading available slots...
          </div>
          <div class="slots-grid" *ngIf="!slotsLoading() && calendlySlots().length > 0">
            <button class="slot-btn" *ngFor="let s of calendlySlots()"
                    [class.selected]="selectedSlot()?.startTime === s.startTime"
                    (click)="selectSlot(s)">
              <div class="slot-date">{{ s.startTime | date:'EEE, MMM d' }}</div>
              <div class="slot-time">{{ s.startTime | date:'h:mm a' }}</div>
            </button>
          </div>
          <div class="no-slots" *ngIf="!slotsLoading() && calendlySlots().length === 0">
            No slots in next 7 days. Use manual booking below.
          </div>
        </ng-container>

        <!-- Manual date/time -->
        <div class="section-title">{{ hasCalendly() ? 'Or Enter Manually' : 'Date & Time' }}</div>
        <div class="datetime-row">
          <div class="field">
            <label>Date</label>
            <input type="date" [(ngModel)]="selectedDate" [min]="today()" class="inp" />
          </div>
          <div class="field">
            <label>Time</label>
            <input type="time" [(ngModel)]="selectedTime" class="inp" />
          </div>
        </div>

        <div class="section-title">Notes (optional)</div>
        <textarea [(ngModel)]="notes" class="notes-inp" rows="3"
                  placeholder="Any specific concerns for the doctor..."></textarea>

        <button class="btn-next" [disabled]="!canProceed()" (click)="step.set('confirm')">
          Continue → Review
        </button>
      </div>

      <!-- STEP 3: Confirm -->
      <div *ngIf="step()==='confirm'">
        <div class="confirm-card">
          <div class="confirm-row">
            <span class="confirm-lbl">Doctor</span>
            <span class="confirm-val">Dr. {{ getName(selectedDoctor()) }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-lbl">Specialty</span>
            <span class="confirm-val">{{ getSpec(selectedDoctor()) }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-lbl">Type</span>
            <span class="confirm-val">{{ getTypeLabel(apptType) }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-lbl">Date & Time</span>
            <span class="confirm-val">{{ getConfirmTime() | date:'EEE, MMM d, y · h:mm a' }}</span>
          </div>
          <div class="confirm-row" *ngIf="notes">
            <span class="confirm-lbl">Notes</span>
            <span class="confirm-val">{{ notes }}</span>
          </div>
        </div>

        <div class="email-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          A confirmation email will be sent to you and the doctor after booking.
        </div>

        <div class="toast-error" *ngIf="bookError()">{{ bookError() }}</div>
        <div class="toast-success" *ngIf="booked()">✅ Appointment booked! Redirecting...</div>

        <button class="btn-confirm" (click)="confirm()" [disabled]="booking() || booked()">
          <span class="mini-spinner" *ngIf="booking()"></span>
          {{ booking() ? 'Booking...' : booked() ? 'Booked!' : 'Confirm Appointment' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; }
    .page{padding:24px;max-width:620px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
    .top-bar h1{font-size:18px;font-weight:700;color:#111;}
    .back-btn{background:none;border:none;cursor:pointer;color:#555;padding:6px;border-radius:8px;display:flex;}
    .steps-row{display:flex;align-items:center;margin-bottom:20px;}
    .step-item{display:flex;flex-direction:column;align-items:center;gap:4px;}
    .step-circle{width:28px;height:28px;border-radius:50%;background:#e8e8e8;color:#999;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;}
    .step-item.active .step-circle{background:#D84040;color:#fff;}
    .step-item.done .step-circle{background:#0F6E56;color:#fff;}
    .step-item span{font-size:11px;color:#888;}
    .step-item.active span{color:#D84040;font-weight:600;}
    .step-line{flex:1;height:2px;background:#e8e8e8;margin:0 8px 14px;}
    .search-box{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #e8e8e8;border-radius:12px;padding:10px 14px;margin-bottom:14px;}
    .search-box input{border:none;outline:none;flex:1;font-size:14px;font-family:inherit;}
    .loading-box{display:flex;flex-direction:column;align-items:center;padding:40px;gap:10px;color:#888;}
    .spinner{width:28px;height:28px;border:3px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;}
    .spinner-sm{width:16px;height:16px;border:2px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .mini-spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px;}
    .empty-box{text-align:center;padding:40px;background:#fff;border-radius:14px;margin-bottom:14px;}
    .empty-icon{font-size:48px;margin-bottom:10px;}
    .empty-box h3{font-size:16px;font-weight:700;color:#111;margin-bottom:6px;}
    .empty-box p{font-size:13px;color:#888;}
    .doctor-list{display:flex;flex-direction:column;gap:10px;margin-bottom:16px;}
    .doctor-card{display:flex;align-items:center;gap:14px;background:#fff;border-radius:14px;padding:14px;border:2px solid transparent;cursor:pointer;box-shadow:0 1px 6px rgba(0,0,0,.06);transition:all .15s;}
    .doctor-card:hover{border-color:#D84040;background:#fff9f9;}
    .doctor-card.selected{border-color:#D84040;background:#FEF2F2;}
    .doc-avatar{width:48px;height:48px;border-radius:50%;color:#fff;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .doc-info{flex:1;}
    .doc-name{font-size:15px;font-weight:700;color:#111;}
    .doc-spec{font-size:13px;color:#D84040;font-weight:600;}
    .doc-workplace{font-size:12px;color:#888;margin-top:2px;}
    .check-icon{flex-shrink:0;}
    .btn-next{width:100%;padding:14px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;font-family:inherit;}
    .btn-next:disabled{opacity:.45;cursor:not-allowed;}
    .selected-doc-banner{display:flex;align-items:center;gap:12px;background:#FEF2F2;border-radius:14px;padding:14px 16px;margin-bottom:16px;}
    .sdb-avatar{width:42px;height:42px;border-radius:50%;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .sdb-name{font-size:15px;font-weight:700;color:#111;}
    .sdb-spec{font-size:12px;color:#D84040;font-weight:600;}
    .section-title{font-size:13px;font-weight:700;color:#555;margin:14px 0 8px;}
    .type-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px;}
    .type-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border:1.5px solid #e8e8e8;border-radius:20px;background:#fff;font-size:13px;cursor:pointer;font-family:inherit;}
    .type-btn.active{background:#D84040;color:#fff;border-color:#D84040;}
    .slots-loading{display:flex;align-items:center;gap:8px;color:#888;font-size:13px;padding:12px 0;}
    .slots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:14px;}
    .slot-btn{padding:10px 8px;border:1.5px solid #e8e8e8;border-radius:10px;background:#fff;cursor:pointer;font-family:inherit;transition:all .15s;text-align:center;}
    .slot-btn:hover{border-color:#D84040;background:#FEF2F2;}
    .slot-btn.selected{border-color:#D84040;background:#D84040;color:#fff;}
    .slot-date{font-size:11px;font-weight:600;margin-bottom:3px;}
    .slot-time{font-size:14px;font-weight:700;}
    .no-slots{display:flex;align-items:center;gap:8px;font-size:13px;color:#888;padding:10px 0;margin-bottom:10px;}
    .datetime-row{display:flex;gap:12px;margin-bottom:4px;}
    @media(max-width:480px){.datetime-row{flex-direction:column;}}
    .field{flex:1;}.field label{display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:5px;}
    .inp{width:100%;padding:10px 12px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;outline:none;font-family:inherit;box-sizing:border-box;}
    .inp:focus{border-color:#D84040;}
    .notes-inp{width:100%;padding:10px 12px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;outline:none;font-family:inherit;resize:vertical;box-sizing:border-box;}
    .confirm-card{background:#fff;border-radius:14px;overflow:hidden;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .confirm-row{display:flex;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f5f5f5;font-size:14px;}
    .confirm-row:last-child{border-bottom:none;}
    .confirm-lbl{color:#888;}.confirm-val{font-weight:600;color:#111;text-align:right;max-width:60%;}
    .email-note{display:flex;align-items:center;gap:7px;font-size:12px;color:#888;margin-bottom:14px;padding:10px 14px;background:#F7F8FA;border-radius:10px;}
    .toast-error{background:#FEF2F2;color:#D84040;border-radius:10px;padding:12px;font-size:14px;margin-bottom:12px;}
    .toast-success{background:#E1F5EE;color:#0F6E56;border-radius:10px;padding:12px;font-size:14px;margin-bottom:12px;font-weight:600;}
    .btn-confirm{width:100%;padding:14px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;}
    .btn-confirm:disabled{opacity:.55;cursor:not-allowed;}
  `],
})
export class BookAppointmentComponent implements OnInit {
  private svc    = inject(AppointmentService);
  private http   = inject(HttpClient);
  private router = inject(Router);

  step      = signal<'doctor'|'slot'|'confirm'>('doctor');
  loading   = signal(true);
  booking   = signal(false);
  booked    = signal(false);
  bookError = signal('');

  allDoctors      = signal<any[]>([]);
  filteredDoctors = signal<any[]>([]);
  selectedDoctor  = signal<any>(null);

  // Calendly
  calendlySlots = signal<any[]>([]);
  slotsLoading  = signal(false);
  selectedSlot  = signal<any>(null);
  hasCalendly   = signal(false);

  searchText   = '';
  apptType     = 'in_person';
  selectedDate = '';
  selectedTime = '09:00';
  notes        = '';

  apptTypes = [
    { val: 'in_person', label: 'In Person' },
    { val: 'video',     label: 'Video Call' },
    { val: 'message',   label: 'Message'    },
  ];

  private avatarColors = ['#2D4A8A','#D84040','#0F6E56','#7C3AED','#0891B2','#d4a017'];

  ngOnInit(): void {
    this.svc.getDoctors().subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        this.allDoctors.set(list);
        this.filteredDoctors.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterDoctors(): void {
    const q = this.searchText.toLowerCase();
    this.filteredDoctors.set(
      this.allDoctors().filter((d: any) =>
        this.getName(d).toLowerCase().includes(q) ||
        this.getSpec(d).toLowerCase().includes(q)
      )
    );
  }

  selectDoctor(d: any): void {
    this.selectedDoctor.set(d);
    this.calendlySlots.set([]);
    this.selectedSlot.set(null);
    this.hasCalendly.set(false);
    this.slotsLoading.set(true);

    const apiUrl = environment.apiUrl;
    this.http.get<any>(apiUrl + '/Calendly/doctor/' + d.id + '/event-types').subscribe({
      next: (res: any) => {
        const types = res?.data?.collection ?? res?.collection ?? res?.data ?? [];
        if (Array.isArray(types) && types.length > 0) {
          this.hasCalendly.set(true);
          const from = new Date().toISOString();
          const to   = new Date(Date.now() + 7 * 86400000).toISOString();
          const uri  = types[0]?.uri ?? '';
          this.http.get<any>(apiUrl + '/Calendly/slots/' + d.id, {
            params: { from, to, eventTypeUri: uri }
          }).subscribe({
            next: (sRes: any) => {
              const slots = sRes?.data?.slots ?? sRes?.slots ?? sRes?.data ?? [];
              this.calendlySlots.set(Array.isArray(slots) ? slots : []);
              this.slotsLoading.set(false);
            },
            error: () => { this.calendlySlots.set([]); this.slotsLoading.set(false); }
          });
        } else {
          this.slotsLoading.set(false);
        }
      },
      error: () => { this.hasCalendly.set(false); this.slotsLoading.set(false); }
    });
  }

  selectSlot(s: any): void {
    this.selectedSlot.set(s);
    const d = new Date(s.startTime);
    this.selectedDate = d.toISOString().split('T')[0];
    this.selectedTime = d.toTimeString().slice(0, 5);
  }

  canProceed(): boolean {
    return !!(this.selectedDate && this.selectedTime) || !!this.selectedSlot();
  }

  getName(d: any): string {
    if (!d) return '';
    if (d.fullName && d.fullName !== 'Doctor') return d.fullName;
    const f = d.firstName ?? d.first_name ?? '';
    const l = d.lastName  ?? d.last_name  ?? '';
    const full = (f + ' ' + l).trim();
    if (full && full.toLowerCase() !== 'doctor') return full;
    if (d.name && d.name.toLowerCase() !== 'doctor') return d.name;
    return d.email?.split('@')[0] ?? 'Doctor';
  }

  getInitials(d: any): string {
    const name = this.getName(d);
    const parts = name.split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'DR';
  }

  getSpec(d: any): string {
    return d?.specialtyName ?? d?.specialization ?? d?.specialty ?? 'General';
  }

  getWorkplace(d: any): string {
    return d?.clinicName ?? d?.workPlace ?? '';
  }

  docAvatarBg(d: any): string {
    if (!d) return '#2D4A8A';
    const idx = (d.firstName?.charCodeAt(0) ?? 0) % this.avatarColors.length;
    return this.avatarColors[idx];
  }

  getTypeLabel(type: string): string {
    const map: Record<string,string> = { video:'Video Call', in_person:'In Person', message:'Message Chat' };
    return map[type] ?? type;
  }

  getConfirmTime(): Date {
    const slot = this.selectedSlot();
    if (slot?.startTime) return new Date(slot.startTime);
    if (this.selectedDate && this.selectedTime) {
      return new Date(this.selectedDate + 'T' + this.selectedTime + ':00');
    }
    return new Date();
  }

  today(): string { return new Date().toISOString().split('T')[0]; }

  stepTitle(): string {
    const map: Record<string,string> = { doctor:'Choose Doctor', slot:'Choose Time', confirm:'Confirm Booking' };
    return map[this.step()] ?? '';
  }

  goBack(): void {
    if (this.step() === 'doctor') this.router.navigate(['/patient/appointments']);
    else if (this.step() === 'slot') this.step.set('doctor');
    else this.step.set('slot');
  }

  confirm(): void {
    this.booking.set(true);
    this.bookError.set('');
    const doc = this.selectedDoctor();
    const apptTime = this.getConfirmTime().toISOString();

    this.svc.book({
      doctorId:        doc.id,
      appointmentTime: apptTime,
      type:            this.apptType as any, // swagger: "message"|"video"|"in_person"
      notes:           this.notes || undefined,
    }).subscribe({
      next: () => {
        this.booking.set(false);
        this.booked.set(true);
        setTimeout(() => this.router.navigate(['/patient/appointments']), 1500);
      },
      error: (err: any) => {
        this.booking.set(false);
        this.bookError.set(err?.error?.message ?? 'Booking failed. Please try again.');
      }
    });
  }
}
