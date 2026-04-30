import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { DoctorService }  from '../../../core/services/doctor.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService }    from '../../../core/services/auth.service';
import { Appointment }    from '../../../core/models/api.models';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <!-- Greeting -->
      <div class="greeting-card">
        <div>
          <p class="greeting-sub">Good morning</p>
          <h2 class="greeting-name">Dr. {{ doctorName }}</h2>
          <p class="greeting-msg">{{ todayAppts }} appointments today</p>
        </div>
        <div class="greeting-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon-wrap blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div><div class="stat-num">{{ totalPatients }}</div><div class="stat-lbl">Patients</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div><div class="stat-num">{{ todayAppts }}</div><div class="stat-lbl">Today</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap yellow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div><div class="stat-num">{{ pendingAppts }}</div><div class="stat-lbl">Pending</div></div>
        </div>
      </div>

      <div class="dashboard-grid"><div class="dash-col">      <!-- Today's Appointments -->
      <div class="section">
        <div class="section-header">
          <h3>Today's Appointments</h3>
          <a routerLink="/doctor/appointments" class="see-all">See all</a>
        </div>
        <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
        <div class="appt-list" *ngIf="!loading()">
          <div class="appt-card" *ngFor="let a of todayList"
               [routerLink]="['/doctor/appointments', a.id]">
            <div class="appt-time">
              <div class="time-val">{{ a.scheduledAt | date:'h:mm' }}</div>
              <div class="time-ampm">{{ a.scheduledAt | date:'a' }}</div>
            </div>
            <div class="appt-divider"></div>
            <div class="appt-info">
              <div class="appt-patient">{{ a.patientName }}</div>
              <div class="appt-type-row">
                <span class="type-pill" [class]="a.type.toLowerCase()">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <ng-container *ngIf="a.type === 'Video'"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></ng-container>
                    <ng-container *ngIf="a.type !== 'Video'"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></ng-container>
                  </svg>
                  {{ a.type }}
                </span>
              </div>
            </div>
            <span class="status-badge" [class]="a.status.toLowerCase()">{{ a.status }}</span>
          </div>
          <div class="empty-mini" *ngIf="todayList.length === 0">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>No appointments today</p>
          </div>
        </div>
      </div>

      </div><div class="dash-col">      <!-- Quick Actions -->
      <div class="section">
        <h3 class="section-title">Quick Actions</h3>
        <div class="actions-grid">
          <a routerLink="/doctor/patients" class="action-btn">
            <div class="action-icon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span>My Patients</span>
          </a>
          <a routerLink="/doctor/schedule" class="action-btn">
            <div class="action-icon green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span>Schedule</span>
          </a>
          <a routerLink="/doctor/chat" class="action-btn">
            <div class="action-icon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B5BAD" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span>Messages</span>
          </a>
          <a routerLink="/doctor/profile" class="action-btn">
            <div class="action-icon red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>Profile</span>
          </a>
        </div>
      </div></div><!-- end dashboard-grid -->
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:1100px; }
    .dashboard-grid { display:grid; grid-template-columns:1fr 340px; gap:20px; }
    .dash-col { display:flex; flex-direction:column; gap:0; }
    @media (max-width:900px) { .dashboard-grid { grid-template-columns:1fr; } }
    @media (max-width:768px) { .page { padding:16px; } }
    @media (max-width:768px) { .page { padding:16px; } }
    .greeting-card { background:#2D4A8A; border-radius:18px; padding:20px; display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .greeting-sub  { font-size:13px; color:rgba(255,255,255,0.75); margin-bottom:2px; }
    .greeting-name { font-size:20px; font-weight:700; color:#fff; margin-bottom:4px; }
    .greeting-msg  { font-size:13px; color:rgba(255,255,255,0.75); }
    .greeting-icon { width:64px; height:64px; background:rgba(255,255,255,0.12); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stats-row     { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:20px; }
    .stat-card     { background:#fff; border-radius:14px; padding:14px 10px; display:flex; align-items:center; gap:8px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .stat-icon-wrap { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stat-icon-wrap.blue   { background:#E6F1FB; }
    .stat-icon-wrap.green  { background:#E1F5EE; }
    .stat-icon-wrap.yellow { background:#FEF9E7; }
    .stat-num { font-size:18px; font-weight:700; color:#111; }
    .stat-lbl { font-size:10px; color:#888; }
    .section { margin-bottom:20px; }
    .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .section-header h3,.section-title { font-size:16px; font-weight:700; color:#111; margin-bottom:10px; }
    .see-all { font-size:13px; color:#2D4A8A; text-decoration:none; font-weight:600; }
    .loading { display:flex; justify-content:center; padding:20px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .appt-list { display:flex; flex-direction:column; gap:10px; }
    .appt-card { background:#fff; border-radius:12px; padding:14px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 8px rgba(0,0,0,0.05); cursor:pointer; text-decoration:none; color:inherit; transition:transform .1s; }
    .appt-card:active { transform:scale(0.99); }
    .appt-time { text-align:center; flex-shrink:0; width:40px; }
    .time-val  { font-size:16px; font-weight:700; color:#111; }
    .time-ampm { font-size:10px; color:#888; text-transform:uppercase; }
    .appt-divider { width:1px; height:36px; background:#f0f0f0; flex-shrink:0; }
    .appt-info { flex:1; }
    .appt-patient { font-size:14px; font-weight:600; color:#111; margin-bottom:4px; }
    .type-pill { display:inline-flex; align-items:center; gap:4px; font-size:11px; padding:3px 8px; border-radius:10px; background:#f0f0f0; color:#555; }
    .type-pill.video { background:#E6F1FB; color:#185FA5; }
    .status-badge { font-size:11px; padding:3px 9px; border-radius:8px; font-weight:600; white-space:nowrap; }
    .status-badge.confirmed  { background:#E1F5EE; color:#0F6E56; }
    .status-badge.pending    { background:#FEF9E7; color:#d4a017; }
    .status-badge.cancelled  { background:#FEF2F2; color:#D84040; }
    .status-badge.completed  { background:#f0f0f0; color:#555; }
    .empty-mini { display:flex; flex-direction:column; align-items:center; gap:8px; padding:24px; background:#fff; border-radius:12px; color:#888; font-size:14px; }
    .actions-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
    .action-btn   { display:flex; align-items:center; gap:12px; background:#fff; border-radius:12px; padding:14px; text-decoration:none; color:#111; font-size:14px; font-weight:600; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .action-icon  { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .action-icon.blue   { background:#E6F1FB; }
    .action-icon.green  { background:#E1F5EE; }
    .action-icon.purple { background:#EDE9FF; }
    .action-icon.red    { background:#FEF2F2; }
  `],
})
export class DoctorDashboardComponent implements OnInit {
  private docSvc  = inject(DoctorService);
  private apptSvc = inject(AppointmentService);
  private auth    = inject(AuthService);

  loading       = signal(true);
  doctorName    = '';
  totalPatients = 0;
  todayAppts    = 0;
  pendingAppts  = 0;
  todayList:    Appointment[] = [];

  ngOnInit(): void {
    // Get name from JWT then update from profile
    const u = this.auth.currentUser() as any;
    const jwtName = (`${u?.given_name ?? ''} ${u?.family_name ?? ''}`).trim()
                 || u?.name || u?.email?.split('@')[0] || 'Doctor';
    this.doctorName = jwtName;

    // Load profile to get real name
    this.docSvc.getProfile().subscribe({
      next: (res: any) => {
        const d = res?.data ?? res;
        const name = (`${d?.firstName ?? ''} ${d?.lastName ?? ''}`).trim();
        if (name) this.doctorName = name;
      }
    });

    // Load appointments from real backend
    this.docSvc.getAppointments().subscribe({
      next: (res: any) => {
        const all: any[] = res?.data?.items ?? res?.data ?? res ?? [];
        const today = new Date().toDateString();
        this.todayList    = all.filter((a: any) =>
          new Date(a.appointmentTime ?? a.scheduledAt).toDateString() === today
          && ['Confirmed','Pending'].includes(a.status)
        );
        this.todayAppts   = this.todayList.length;
        this.pendingAppts = all.filter((a: any) => a.status === 'Pending').length;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Total patients from appointments list (no dedicated patients count endpoint)
    this.docSvc.getAppointments().subscribe({
      next: (res: any) => {
        const all: any[] = res?.data?.items ?? res?.data ?? res ?? [];
        const unique = new Set(all.map((a: any) => a.patientId));
        this.totalPatients = unique.size;
      }
    });
  }
}
