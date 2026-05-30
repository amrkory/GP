import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { HttpClient }   from '@angular/common/http';
import { AuthService }  from '../../../core/services/auth.service';
import { environment }  from '../../../../environments/environment';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="dash">

  <!-- ── Header ───────────────────────────────────────────────────────── -->
  <div class="dash-header">
    <div>
      <h1 class="dash-title">Good {{ greeting() }}, Dr. {{ firstName() }}</h1>
      <p class="dash-sub">{{ today | date:'EEEE, MMMM d, y' }}</p>
    </div>
    <a routerLink="/doctor/appointments" class="btn-primary-hdr">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      View Appointments
    </a>
  </div>

  <!-- ── KPI cards ─────────────────────────────────────────────────────── -->
  <div class="kpi-grid">

    <div class="kpi-card">
      <div class="kpi-icon" style="background:#EEF4FF">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">{{ totalPatients() }}</div>
        <div class="kpi-label">Total Patients</div>
      </div>
      <a routerLink="/doctor/patients" class="kpi-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </a>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon" style="background:#ECFDF5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">{{ todayAppts().length }}</div>
        <div class="kpi-label">Today's Appointments</div>
      </div>
      <a routerLink="/doctor/appointments" class="kpi-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </a>
    </div>

    <div class="kpi-card kpi-card--warn" *ngIf="pendingAppts().length > 0">
      <div class="kpi-icon" style="background:#FFFBEB">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">{{ pendingAppts().length }}</div>
        <div class="kpi-label">Pending Requests</div>
      </div>
      <a routerLink="/doctor/appointments" class="kpi-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </a>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon" style="background:#F0FDF4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">{{ completedAppts().length }}</div>
        <div class="kpi-label">Completed Today</div>
      </div>
      <span class="kpi-link kpi-link--muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </span>
    </div>

  </div>

  <!-- ── Body ──────────────────────────────────────────────────────────── -->
  <div class="dash-body">

    <!-- LEFT: Today's schedule -->
    <div class="dash-col dash-col--wide">

      <div class="section-card">
        <div class="section-hdr">
          <div class="section-hdr-left">
            <div class="section-icon" style="background:#EEF4FF">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h2>Today's Schedule</h2>
          </div>
          <a routerLink="/doctor/appointments" class="see-all">See all</a>
        </div>

        <div class="loading-row" *ngIf="loading()"><div class="loader-ring"></div></div>

        <div class="empty-state" *ngIf="!loading() && todayAppts().length === 0">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d0d5dd" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p>No appointments scheduled for today</p>
        </div>

        <div class="schedule-list" *ngIf="!loading()">
          <div class="schedule-row" *ngFor="let a of todayAppts().slice(0,6)">
            <div class="sch-time">
              <span class="sch-hr">{{ (a.appointmentTime??a.scheduledAt) | date:'h:mm' }}</span>
              <span class="sch-ampm">{{ (a.appointmentTime??a.scheduledAt) | date:'a' }}</span>
            </div>
            <div class="sch-divider"></div>
            <div class="sch-info">
              <p class="sch-patient">{{ a.patientName ?? a.patientFirstName + ' ' + a.patientLastName }}</p>
              <p class="sch-type">{{ a.type ?? 'Consultation' }}</p>
            </div>
            <span class="sch-badge" [class]="sCls(a.status)">{{ a.status }}</span>
            <a [routerLink]="['/doctor/appointments', a.id]" class="sch-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Pending requests -->
      <div class="section-card" *ngIf="!loading() && pendingAppts().length > 0">
        <div class="section-hdr">
          <div class="section-hdr-left">
            <div class="section-icon" style="background:#FFFBEB">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2>Pending Requests</h2>
          </div>
          <span class="badge-count">{{ pendingAppts().length }}</span>
        </div>
        <div class="pending-list">
          <div class="pending-row" *ngFor="let a of pendingAppts().slice(0,4)">
            <div class="pr-avatar">
              {{ (a.patientName ?? a.patientFirstName ?? 'P').charAt(0).toUpperCase() }}
            </div>
            <div class="pr-info">
              <p class="pr-patient">{{ a.patientName ?? a.patientFirstName + ' ' + a.patientLastName }}</p>
              <p class="pr-time">{{ (a.appointmentTime??a.scheduledAt) | date:'MMM d · h:mm a' }}</p>
            </div>
            <a [routerLink]="['/doctor/appointments', a.id]" class="pr-review">
              Review
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

    </div>

    <!-- RIGHT: Quick actions + recent patients -->
    <div class="dash-col">

      <!-- Quick actions -->
      <div class="section-card">
        <div class="section-hdr">
          <div class="section-hdr-left">
            <div class="section-icon" style="background:#F4F6FA">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <h2>Quick Actions</h2>
          </div>
        </div>
        <div class="qa-grid">
          <a routerLink="/doctor/patients" class="qa-item">
            <div class="qa-ico" style="background:#EEF4FF">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span>My Patients</span>
          </a>
          <a routerLink="/doctor/chat" class="qa-item">
            <div class="qa-ico" style="background:#FFF7ED">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span>Messages</span>
          </a>
          <a routerLink="/doctor/schedule" class="qa-item">
            <div class="qa-ico" style="background:#F3E8FF">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span>My Schedule</span>
          </a>
          <a routerLink="/doctor/profile" class="qa-item">
            <div class="qa-ico" style="background:#ECFDF5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>My Profile</span>
          </a>
        </div>
      </div>

      <!-- All appointments summary -->
      <div class="section-card">
        <div class="section-hdr">
          <div class="section-hdr-left">
            <div class="section-icon" style="background:#F4F6FA">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6"  y1="20" x2="6"  y2="14"/>
              </svg>
            </div>
            <h2>Appointments Summary</h2>
          </div>
        </div>
        <div class="summary-list">
          <div class="sum-row">
            <div class="sum-dot" style="background:#d4a017"></div>
            <span class="sum-label">Pending</span>
            <span class="sum-val">{{ pendingAppts().length }}</span>
          </div>
          <div class="sum-row">
            <div class="sum-dot" style="background:#0F6E56"></div>
            <span class="sum-label">Confirmed</span>
            <span class="sum-val">{{ confirmedAppts().length }}</span>
          </div>
          <div class="sum-row">
            <div class="sum-dot" style="background:#16a34a"></div>
            <span class="sum-label">Completed</span>
            <span class="sum-val">{{ allCompleted().length }}</span>
          </div>
          <div class="sum-row">
            <div class="sum-dot" style="background:#D84040"></div>
            <span class="sum-label">Cancelled</span>
            <span class="sum-val">{{ cancelledAppts().length }}</span>
          </div>
          <div class="sum-divider"></div>
          <div class="sum-row sum-row--total">
            <span class="sum-label">Total</span>
            <span class="sum-val">{{ allAppts().length }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .dash{padding:28px;max-width:1200px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.dash{padding:16px;}}

    /* Header */
    .dash-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;gap:12px;flex-wrap:wrap;}
    .dash-title{font-size:22px;font-weight:800;color:#111;letter-spacing:-.3px;}
    .dash-sub{font-size:13px;color:#6B7280;margin-top:3px;}
    .btn-primary-hdr{display:flex;align-items:center;gap:7px;padding:10px 18px;background:#1B2B4B;color:#fff;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;font-family:inherit;transition:background .15s;}
    .btn-primary-hdr:hover{background:#152236;}

    /* KPI */
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
    @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
    @media(max-width:480px){.kpi-grid{grid-template-columns:1fr 1fr;gap:10px;}}
    .kpi-card{background:#fff;border-radius:16px;padding:18px 16px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .kpi-card--warn{border-color:#FDE68A;}
    .kpi-icon{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .kpi-body{flex:1;}
    .kpi-value{font-size:24px;font-weight:800;color:#111;line-height:1;}
    .kpi-label{font-size:12px;color:#6B7280;margin-top:3px;}
    .kpi-link{width:28px;height:28px;background:#F4F6FA;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#6B7280;text-decoration:none;flex-shrink:0;}
    .kpi-link:hover{background:#E8ECF0;color:#111;}
    .kpi-link--muted{cursor:default;color:#d0d5dd;}

    /* Body */
    .dash-body{display:grid;grid-template-columns:1.4fr 1fr;gap:16px;}
    @media(max-width:900px){.dash-body{grid-template-columns:1fr;}}
    .dash-col{display:flex;flex-direction:column;gap:16px;}

    /* Section card */
    .section-card{background:#fff;border-radius:18px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .section-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
    .section-hdr-left{display:flex;align-items:center;gap:10px;}
    .section-icon{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .section-hdr h2{font-size:15px;font-weight:700;color:#111;}
    .see-all{font-size:13px;font-weight:600;color:#2D4A8A;text-decoration:none;}
    .see-all:hover{text-decoration:underline;}
    .badge-count{font-size:12px;font-weight:700;background:#FFFBEB;color:#d4a017;padding:3px 10px;border-radius:20px;border:1px solid #FDE68A;}

    /* Loading / empty */
    .loading-row{display:flex;justify-content:center;padding:24px 0;}
    .loader-ring{width:24px;height:24px;border:2.5px solid #F0F2F5;border-top-color:#2D4A8A;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .empty-state{display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px 0;text-align:center;}
    .empty-state p{font-size:13px;color:#9CA3AF;}

    /* Schedule */
    .schedule-list{display:flex;flex-direction:column;gap:8px;}
    .schedule-row{display:flex;align-items:center;gap:12px;padding:10px 12px;background:#F8F9FC;border-radius:12px;}
    .sch-time{text-align:center;min-width:40px;flex-shrink:0;}
    .sch-hr{display:block;font-size:16px;font-weight:800;color:#1B2B4B;line-height:1;}
    .sch-ampm{display:block;font-size:10px;color:#6B7280;text-transform:uppercase;}
    .sch-divider{width:1px;height:32px;background:#E8ECF0;flex-shrink:0;}
    .sch-info{flex:1;min-width:0;}
    .sch-patient{font-size:14px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .sch-type{font-size:12px;color:#6B7280;margin-top:2px;}
    .sch-badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;white-space:nowrap;flex-shrink:0;}
    .sch-badge.pending{background:#FFFBEB;color:#d4a017;}
    .sch-badge.confirmed{background:#ECFDF5;color:#0F6E56;}
    .sch-badge.completed{background:#F4F6FA;color:#6B7280;}
    .sch-badge.cancelled{background:#FEF2F2;color:#D84040;}
    .sch-arrow{width:28px;height:28px;background:#fff;border:1px solid #E8ECF0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#6B7280;text-decoration:none;flex-shrink:0;}
    .sch-arrow:hover{background:#F4F6FA;color:#111;}

    /* Pending requests */
    .pending-list{display:flex;flex-direction:column;gap:8px;}
    .pending-row{display:flex;align-items:center;gap:12px;padding:10px 12px;background:#FFFDF0;border-radius:12px;border:1px solid #FDE68A;}
    .pr-avatar{width:36px;height:36px;border-radius:50%;background:#1B2B4B;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .pr-info{flex:1;min-width:0;}
    .pr-patient{font-size:14px;font-weight:600;color:#111;}
    .pr-time{font-size:12px;color:#6B7280;margin-top:2px;}
    .pr-review{display:flex;align-items:center;gap:4px;padding:6px 12px;background:#1B2B4B;color:#fff;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700;flex-shrink:0;}
    .pr-review:hover{background:#152236;}

    /* Quick actions */
    .qa-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .qa-item{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 12px;background:#F8F9FC;border-radius:14px;text-decoration:none;color:#374151;font-size:12px;font-weight:600;text-align:center;border:1px solid #F0F2F5;transition:all .15s;}
    .qa-item:hover{background:#EEF2FF;border-color:#c7d2fe;color:#2D4A8A;transform:translateY(-1px);}
    .qa-ico{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;}

    /* Summary */
    .summary-list{display:flex;flex-direction:column;gap:10px;}
    .sum-row{display:flex;align-items:center;gap:10px;}
    .sum-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
    .sum-label{flex:1;font-size:13px;color:#374151;}
    .sum-val{font-size:15px;font-weight:700;color:#111;}
    .sum-divider{height:1px;background:#F0F2F5;}
    .sum-row--total .sum-label{font-weight:700;color:#111;font-size:14px;}
    .sum-row--total .sum-val{font-size:16px;}
  `]
})
export class DoctorDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  loading   = signal(true);
  allAppts  = signal<any[]>([]);
  today     = new Date();

  totalPatients   = signal(0);
  todayAppts()    { return this.allAppts().filter(a => this.isToday(a)); }
  pendingAppts()  { return this.allAppts().filter(a => a.status === 'Pending'); }
  confirmedAppts(){ return this.allAppts().filter(a => a.status === 'Confirmed'); }
  completedAppts(){ return this.allAppts().filter(a => a.status === 'Completed' && this.isToday(a)); }
  allCompleted()  { return this.allAppts().filter(a => a.status === 'Completed'); }
  cancelledAppts(){ return this.allAppts().filter(a => a.status === 'Cancelled'); }

  firstName(): string {
    const u = this.auth.currentUser() as any;
    return u?.given_name ?? u?.firstName ?? 'Doctor';
  }
  greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }
  sCls(s: string): string {
    const sl = (s ?? '').toLowerCase();
    if (sl.includes('confirm')) return 'confirmed';
    if (sl.includes('cancel'))  return 'cancelled';
    if (sl.includes('complet')) return 'completed';
    return 'pending';
  }
  isToday(a: any): boolean {
    const d = new Date(a.appointmentTime ?? a.scheduledAt ?? 0);
    const n = new Date();
    return d.getDate()===n.getDate() && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear();
  }

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/Appointment/doctor`, { params:{ pageNumber:'1', pageSize:'200' } })
      .subscribe({
        next: (res:any) => {
          const appts:any[] = Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? [];
          this.allAppts.set(appts);
          const pids = new Set(appts.map((a:any) => a.patientId).filter(Boolean));
          this.totalPatients.set(pids.size);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }
}
