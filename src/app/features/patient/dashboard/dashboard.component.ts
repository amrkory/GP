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

      <!-- Greeting banner -->
      <div class="greeting-card">
        <div>
          <p class="greeting-sub">Good morning 👋</p>
          <h2 class="greeting-name">{{ userName }}</h2>
          <p class="greeting-msg">How are you feeling today?</p>
        </div>
        <div class="greeting-ilu">🏥</div>
      </div>

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-icon">📅</span>
          <div>
            <div class="stat-num">{{ upcomingCount }}</div>
            <div class="stat-lbl">Appointments</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <div>
            <div class="stat-num">{{ adherence }}%</div>
            <div class="stat-lbl">Adherence</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🩸</span>
          <div>
            <div class="stat-num">{{ latestBP }}</div>
            <div class="stat-lbl">Blood Pressure</div>
          </div>
        </div>
      </div>

      <!-- Next Appointment -->
      <div class="section">
        <div class="section-header">
          <h3>Next Appointment</h3>
          <a routerLink="/patient/appointments" class="see-all">See all</a>
        </div>
        <div class="appt-card" *ngIf="nextAppointment">
          <div class="appt-avatar">{{ doctorInitials(nextAppointment.doctorName) }}</div>
          <div class="appt-info">
            <div class="appt-doctor">{{ nextAppointment.doctorName }}</div>
            <div class="appt-spec">{{ nextAppointment.specialtyName }}</div>
            <div class="appt-date">{{ nextAppointment.scheduledAt | date:'EEE, MMM d · h:mm a' }}</div>
          </div>
          <div class="appt-type-badge">{{ nextAppointment.type }}</div>
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
            <div class="vital-icon">{{ vitalIcon(v.type) }}</div>
            <div class="vital-value">{{ v.value }}<span class="vital-unit"> {{ v.unit }}</span></div>
            <div class="vital-label">{{ v.type }}</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section">
        <h3 style="margin-bottom:10px">Quick Actions</h3>
        <div class="actions-grid">
          <a routerLink="/patient/appointments/book" class="action-btn">
            <span>📅</span> Book Appointment
          </a>
          <a routerLink="/patient/ai-assistant" class="action-btn red">
            <span>🤖</span> AI Assistant
          </a>
          <a routerLink="/patient/home-service" class="action-btn">
            <span>🏠</span> Home Service
          </a>
          <a routerLink="/patient/nutrition" class="action-btn">
            <span>🥗</span> Nutrition
          </a>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 16px; max-width: 640px; margin: 0 auto; }

    .greeting-card { background: #D84040; border-radius: 18px; padding: 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .greeting-sub  { font-size: 13px; color: rgba(255,255,255,0.8); margin-bottom: 2px; }
    .greeting-name { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
    .greeting-msg  { font-size: 13px; color: rgba(255,255,255,0.75); }
    .greeting-ilu  { font-size: 48px; }

    .stats-row  { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 20px; }
    .stat-card  { background: #fff; border-radius: 14px; padding: 14px 10px; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 8px rgba(0,0,0,0.05); }
    .stat-icon  { font-size: 22px; }
    .stat-num   { font-size: 17px; font-weight: 700; color: #111; }
    .stat-lbl   { font-size: 10px; color: #888; }

    .section        { margin-bottom: 20px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .section-header h3 { font-size: 16px; font-weight: 700; color: #111; }
    .see-all        { font-size: 13px; color: #D84040; text-decoration: none; font-weight: 600; }

    .appt-card    { background: #fff; border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 8px rgba(0,0,0,0.05); }
    .appt-avatar  { width: 44px; height: 44px; border-radius: 50%; background: #D84040; color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .appt-info    { flex: 1; }
    .appt-doctor  { font-size: 15px; font-weight: 600; color: #111; }
    .appt-spec    { font-size: 12px; color: #888; margin: 2px 0; }
    .appt-date    { font-size: 12px; color: #555; }
    .appt-type-badge { font-size: 12px; padding: 4px 10px; border-radius: 20px; background: #E1F5EE; color: #0F6E56; font-weight: 500; }

    .task-list  { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.05); }
    .task-item  { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f0f0f0; }
    .task-item:last-child { border-bottom: none; }
    .task-item.done .task-title { text-decoration: line-through; color: #bbb; }
    .task-check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #ddd; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s; }
    .task-check.checked { background: #22c55e; border-color: #22c55e; }
    .task-title { flex: 1; font-size: 14px; color: #111; }

    .vitals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px,1fr)); gap: 10px; }
    .vital-card  { background: #fff; border-radius: 12px; padding: 14px 12px; text-align: center; box-shadow: 0 1px 8px rgba(0,0,0,0.05); }
    .vital-icon  { font-size: 22px; margin-bottom: 6px; }
    .vital-value { font-size: 16px; font-weight: 700; color: #111; }
    .vital-unit  { font-size: 11px; font-weight: 400; color: #888; }
    .vital-label { font-size: 11px; color: #888; margin-top: 3px; }

    .actions-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
    .action-btn   { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 12px; padding: 14px; text-decoration: none; color: #111; font-size: 14px; font-weight: 600; box-shadow: 0 1px 8px rgba(0,0,0,0.05); }
    .action-btn.red { background: #D84040; color: #fff; }
    .action-btn span { font-size: 20px; }

    .empty-card { background: #fff; border-radius: 14px; padding: 20px; text-align: center; color: #888; font-size: 14px; }
    .empty-card a { color: #D84040; font-weight: 600; text-decoration: none; margin-left: 4px; }
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
    const u = this.auth.currentUser();
    this.userName = ((u?.given_name ?? '') + ' ' + (u?.family_name ?? '')).trim();

    // Appointments
    this.appointmentSvc.getMyAppointments().subscribe(res => {
      const upcoming = res.data.filter((a: Appointment) =>
        ['Confirmed', 'Pending'].includes(a.status) &&
        new Date(a.scheduledAt) > new Date()
      );
      this.upcomingCount   = upcoming.length;
      this.nextAppointment = upcoming.sort((a: Appointment, b: Appointment) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )[0] ?? null;
    });

    // Vitals
    this.patientSvc.getVitals().subscribe(res => {
      this.latestVitals = res.data.slice(0, 4);
      const bp = res.data.find((v: VitalReading) => v.type === 'BloodPressure');
      this.latestBP = bp?.value ?? '---';
    });

    // Checklists
    this.patientSvc.getChecklists().subscribe(res => {
      if (res.data.length > 0) {
        const cl: Checklist = res.data[0];
        this.adherence  = cl.adherence;
        this.todayTasks = cl.tasks
          .filter((t: any) => t.frequency === 'Daily')
          .slice(0, 4);
      }
    });
  }

  doctorInitials(name: string): string {
    return name.replace('Dr. ', '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  vitalIcon(type: string): string {
    const map: Record<string, string> = {
      BloodPressure: '🩸', HeartRate: '❤️', BloodGlucose: '💉',
      Temperature: '🌡️', OxygenSaturation: '🫁', Weight: '⚖️', Height: '📏',
    };
    return map[type] ?? '📊';
  }
}
