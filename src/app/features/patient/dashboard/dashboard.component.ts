import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { RouterLink }                 from '@angular/router';
import { PatientService }             from '../../../core/services/patient.service';
import { AppointmentService }         from '../../../core/services/appointment.service';
import { AuthService }                from '../../../core/services/auth.service';
import { Appointment, VitalReading, Checklist } from '../../../core/models/api.models';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">

      <div class="top-row">
      <!-- Greeting banner -->
      <div class="greeting-card">
        <div>
          <p class="greeting-sub">Good morning</p>
          <h2 class="greeting-name">{{ userName }}</h2>
          <p class="greeting-msg">How are you feeling today?</p>
        </div>
        <div class="greeting-icon">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
      </div>

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon-wrap blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <div class="stat-num">{{ upcomingCount }}</div>
            <div class="stat-lbl">Appointments</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div class="stat-num">{{ adherence }}%</div>
            <div class="stat-lbl">Adherence</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div>
            <div class="stat-num">{{ latestBP }}</div>
            <div class="stat-lbl">Blood Pressure</div>
          </div>
        </div>
      </div>
      </div><!-- end top-row -->

      <div class="content-grid">
      <div class="col-main">
      <!-- Next Appointment -->
      <div class="section">
        <div class="section-header">
          <h3>Next Appointment</h3>
          <a routerLink="/patient/appointments" class="see-all">See all</a>
        </div>
        <div class="appt-card" *ngIf="nextAppointment">
          <div class="appt-avatar">{{ doctorInitials(nextAppointment.doctorName) }}</div>
          <div class="appt-info">
            <div class="appt-doctor">{{ (nextAppointment.doctorName || 'Unknown Doctor') }}</div>
            <div class="appt-spec">{{ nextAppointment.specialtyName }}</div>
            <div class="appt-date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ (nextAppointment.appointmentTime || nextAppointment.scheduledAt) | date:'EEE, MMM d · h:mm a' }}
            </div>
          </div>
          <div class="appt-type-badge">
            <svg *ngIf="nextAppointment.type === 'video' || nextAppointment.type === 'Video'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            <svg *ngIf="nextAppointment.type !== 'Video'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            {{ nextAppointment.type }}
          </div>
        </div>
        <div class="empty-card" *ngIf="!nextAppointment">
          No upcoming appointments.
          <a routerLink="/patient/appointments/book">Book one →</a>
        </div>
      </div>

      <!-- Today's Tasks -->
      <div class="section">
        <div class="section-header">
          <h3>Today's Tasks</h3>
          <a routerLink="/patient/checklist" class="see-all">See all</a>
        </div>
        <div class="task-list" *ngIf="todayTasks.length > 0">
          <div class="task-item" *ngFor="let t of todayTasks"
               [class.done]="t.status === 'Completed'">
            <div class="task-check" [class.checked]="t.status === 'Completed'">
              <svg *ngIf="t.status === 'Completed'" width="12" height="12"
                   viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span class="task-title">{{ t.title }}</span>
          </div>
        </div>
        <div class="empty-card" *ngIf="todayTasks.length === 0">No tasks for today.</div>
      </div>

      <!-- Latest Vitals -->
      <div class="section">
        <div class="section-header">
          <h3>Latest Vitals</h3>
          <a routerLink="/patient/vitals" class="see-all">See all</a>
        </div>
        <div class="vitals-grid">
          <div class="vital-card" *ngFor="let v of latestVitals">
            <div class="vital-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="vitalColor(v.type)" stroke-width="2">
                <ng-container [ngSwitch]="v.type">
                  <ng-container *ngSwitchCase="'BloodPressure'"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></ng-container>
                  <ng-container *ngSwitchCase="'HeartRate'"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></ng-container>
                  <ng-container *ngSwitchCase="'BloodGlucose'"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></ng-container>
                  <ng-container *ngSwitchCase="'Temperature'"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></ng-container>
                  <ng-container *ngSwitchCase="'OxygenSaturation'"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></ng-container>
                  <ng-container *ngSwitchCase="'Weight'"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></ng-container>
                  <ng-container *ngSwitchDefault><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></ng-container>
                </ng-container>
              </svg>
            </div>
            <div class="vital-value">{{ v.value }}<span class="vital-unit"> {{ v.unit }}</span></div>
            <div class="vital-label">{{ vitalLabel(v.type) }}</div>
          </div>
        </div>
      </div>

      </div><!-- end col-main -->
      <div class="col-side">
      <!-- Quick Actions -->
      <div class="section">
        <h3 style="margin-bottom:10px;font-size:16px;font-weight:700;color:#111">Quick Actions</h3>
        <div class="actions-grid">
          <a routerLink="/patient/appointments/book" class="action-btn">
            <div class="action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
              </svg>
            </div>
            Book Appointment
          </a>
          <a routerLink="/patient/ai-assistant" class="action-btn red">
            <div class="action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            AI Assistant
          </a>
          <a routerLink="/patient/home-service" class="action-btn">
            <div class="action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            Home Service
          </a>
          <a routerLink="/patient/nutrition" class="action-btn">
            <div class="action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
                <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
              </svg>
            </div>
            Nutrition
          </a>
        </div>
      </div>
    </div><!-- end col-side -->
      </div><!-- end content-grid -->
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:1100px; }
    .top-row { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
    @media (max-width:768px) { .page { padding:16px; } .top-row { grid-template-columns:1fr; } }
    .greeting-card { background:#D84040; border-radius:18px; padding:24px; display:flex; align-items:center; justify-content:space-between; }
    .greeting-sub  { font-size:13px; color:rgba(255,255,255,0.8); margin-bottom:2px; }
    .greeting-name { font-size:20px; font-weight:700; color:#fff; margin-bottom:4px; }
    .greeting-msg  { font-size:13px; color:rgba(255,255,255,0.75); }
    .greeting-icon { width:64px; height:64px; background:rgba(255,255,255,0.15); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

    .stats-row   { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:0; }
    .stat-card   { background:#fff; border-radius:14px; padding:14px 10px; display:flex; align-items:center; gap:8px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .stat-icon-wrap { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stat-icon-wrap.blue  { background:#E6F1FB; }
    .stat-icon-wrap.green { background:#E1F5EE; }
    .stat-icon-wrap.red   { background:#FEF2F2; }
    .stat-num    { font-size:16px; font-weight:700; color:#111; }
    .stat-lbl    { font-size:10px; color:#888; }

    .section        { margin-bottom:20px; }
    .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .section-header h3 { font-size:16px; font-weight:700; color:#111; }
    .see-all        { font-size:13px; color:#D84040; text-decoration:none; font-weight:600; }

    .appt-card    { background:#fff; border-radius:14px; padding:14px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .appt-avatar  { width:44px; height:44px; border-radius:50%; background:#D84040; color:#fff; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .appt-info    { flex:1; }
    .appt-doctor  { font-size:15px; font-weight:600; color:#111; }
    .appt-spec    { font-size:12px; color:#888; margin:2px 0; }
    .appt-date    { display:flex; align-items:center; gap:4px; font-size:12px; color:#555; }
    .appt-type-badge { display:flex; align-items:center; gap:4px; font-size:11px; padding:4px 10px; border-radius:20px; background:#E1F5EE; color:#0F6E56; font-weight:500; white-space:nowrap; }

    .task-list  { background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .task-item  { display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid #f0f0f0; }
    .task-item:last-child { border-bottom:none; }
    .task-item.done .task-title { text-decoration:line-through; color:#bbb; }
    .task-check { width:20px; height:20px; border-radius:50%; border:2px solid #ddd; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .task-check.checked { background:#22c55e; border-color:#22c55e; }
    .task-title { flex:1; font-size:14px; color:#111; }

    .vitals-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; }
    .vital-card  { background:#fff; border-radius:12px; padding:14px 12px; text-align:center; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .vital-icon-wrap { width:40px; height:40px; border-radius:50%; background:#FEF2F2; display:flex; align-items:center; justify-content:center; margin:0 auto 8px; }
    .vital-value { font-size:16px; font-weight:700; color:#111; }
    .vital-unit  { font-size:11px; font-weight:400; color:#888; }
    .vital-label { font-size:11px; color:#888; margin-top:3px; }

    .actions-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
    .action-btn   { display:flex; align-items:center; gap:10px; background:#fff; border-radius:12px; padding:14px; text-decoration:none; color:#111; font-size:14px; font-weight:600; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .action-btn.red { background:#D84040; color:#fff; }
    .action-icon  { width:36px; height:36px; border-radius:10px; background:#f0f0f0; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .action-btn.red .action-icon { background:rgba(255,255,255,0.2); }

    .empty-card { background:#fff; border-radius:14px; padding:20px; text-align:center; color:#888; font-size:14px; }
    .content-grid { display:grid; grid-template-columns:1fr 360px; gap:20px; }
    .col-main { display:flex; flex-direction:column; gap:0; }
    .col-side  { display:flex; flex-direction:column; gap:0; }
    @media (max-width:900px) { .content-grid { grid-template-columns:1fr; } }
    .empty-card a { color:#D84040; font-weight:600; text-decoration:none; margin-left:4px; }
  `],
})
export class PatientDashboardComponent implements OnInit {
  private patientSvc     = inject(PatientService);
  private appointmentSvc = inject(AppointmentService);
  private auth           = inject(AuthService);

  userName        = '';
  nextAppointment: Appointment | null = null;
  upcomingCount   = 0;
  adherence       = 0;
  latestBP        = '---';
  todayTasks:     any[]          = [];
  latestVitals:   VitalReading[] = [];

  ngOnInit(): void {
    const u = this.auth.currentUser() as any;
    this.userName = ((u?.given_name ?? '') + ' ' + (u?.family_name ?? '')).trim();

    this.appointmentSvc.getMyAppointments().subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        // Normalize status: handles BOTH numeric (0,1,2,3,4) and string values
        const statusOf = (a: any): string => {
          const s = a.status;
          const num: Record<number,string> = { 0:'pending', 1:'confirmed', 2:'cancelled', 3:'completed', 4:'rescheduled' };
          if (typeof s === 'number') return num[s] ?? 'pending';
          return String(s ?? '').toLowerCase();
        };
        // Upcoming = pending, confirmed, rescheduled only
        const upcoming  = list.filter((a: any) => ['pending','confirmed','rescheduled'].includes(statusOf(a)));
        this.upcomingCount   = upcoming.length;
        this.nextAppointment = upcoming.sort((a: any, b: any) => {
          const ta = new Date(a.appointmentTime ?? a.scheduledAt ?? 0).getTime();
          const tb = new Date(b.appointmentTime ?? b.scheduledAt ?? 0).getTime();
          return ta - tb;
        })[0] ?? list[0] ?? null;
      },
      error: () => {},
    });

    this.patientSvc.getProfile().subscribe({
      next: (res: any) => {
        const d = res?.data ?? res ?? {};
        // Build vitals from profile fields
        const vitals: any[] = [];
        if (d.systolicPressure || d.diastolicPressure) {
          this.latestBP = `${d.systolicPressure ?? '?'}/${d.diastolicPressure ?? '?'}`;
          vitals.push({ type:'BloodPressure', value: this.latestBP, unit:'mmHg', label:'Blood Pressure' });
        }
        if (d.heartRate)  vitals.push({ type:'HeartRate',  value: d.heartRate,  unit:'bpm',   label:'Heart Rate' });
        if (d.sugar)      vitals.push({ type:'Glucose',    value: d.sugar,      unit:'mg/dL', label:'Glucose' });
        this.latestVitals = vitals;
        // Also set user name from profile if JWT didn't have it
        if (!this.userName && d.firstName) {
          this.userName = `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim();
        }
      },
      error: () => {}
    });

    this.patientSvc.getChecklists().subscribe((res: any) => {
      if (res.data.length > 0) {
        const cl: Checklist = res.data[0];
        this.adherence  = cl.adherence;
        this.todayTasks = cl.tasks.filter((t: any) => t.frequency === 'Daily').slice(0,4);
      }
    });
  }

  doctorInitials(name: string): string {
    return name.replace('Dr. ','').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase();
  }

  vitalColor(type: string): string {
    const m: Record<string,string> = {
      BloodPressure:'#D84040', HeartRate:'#D84040', BloodGlucose:'#185FA5',
      Temperature:'#d4a017', OxygenSaturation:'#0F6E56', Weight:'#6B5BAD',
    };
    return m[type] ?? '#888';
  }

  vitalLabel(type: string): string {
    const m: Record<string,string> = {
      BloodPressure:'Blood Pressure', HeartRate:'Heart Rate',
      BloodGlucose:'Glucose', Temperature:'Temperature',
      OxygenSaturation:'Oxygen', Weight:'Weight',
    };
    return m[type] ?? type;
  }
}
