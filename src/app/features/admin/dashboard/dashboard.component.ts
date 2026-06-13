import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Admin Dashboard</h1>
        <p class="page-sub">System overview and key metrics</p>
      </div>

      <!-- Stats grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <div class="stat-num">{{ stats().totalPatients | number }}</div>
            <div class="stat-lbl">Total Patients</div>
          </div>
          <a routerLink="/admin/patients" class="stat-link">View →</a>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg>
          </div>
          <div>
            <div class="stat-num">{{ stats().totalDoctors | number }}</div>
            <div class="stat-lbl">Active Doctors</div>
          </div>
          <a routerLink="/admin/doctors" class="stat-link">View →</a>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B5BAD" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <div class="stat-num">{{ stats().totalAppointments | number }}</div>
            <div class="stat-lbl">Total Appointments</div>
          </div>
          <span class="stat-link muted">All time</span>
        </div>
        <div class="stat-card highlight">
          <div class="stat-icon yellow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div class="stat-num">{{ stats().pendingDoctors }}</div>
            <div class="stat-lbl">Pending Approvals</div>
          </div>
          <a routerLink="/admin/doctors/pending" class="stat-link urgent">Review →</a>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div>
            <div class="stat-num">{{ stats().pendingProviders }}</div>
            <div class="stat-lbl">Pending Providers</div>
          </div>
          <a routerLink="/admin/doctors/pending" class="stat-link urgent">Review →</a>
        </div>
        <div class="stat-card">
          <div class="stat-icon teal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <div class="stat-num">{{ stats().totalProviders | number }}</div>
            <div class="stat-lbl">Total Providers</div>
          </div>
          <a routerLink="/admin/providers" class="stat-link">View →</a>
        </div>
      </div>

      <!-- Quick nav -->
      <div class="quick-grid">
        <a routerLink="/admin/doctors/pending" class="quick-card pending">
          <div class="qc-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div class="qc-title">Doctor Approvals</div>
            <div class="qc-sub">{{ stats().pendingDoctors }} doctors waiting for review</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
        <a routerLink="/admin/patients" class="quick-card">
          <div class="qc-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <div class="qc-title">Manage Patients</div>
            <div class="qc-sub">View and manage all patients</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
        <a routerLink="/admin/doctors" class="quick-card">
          <div class="qc-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg>
          </div>
          <div>
            <div class="qc-title">Manage Doctors</div>
            <div class="qc-sub">View all registered doctors</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
        <a routerLink="/admin/categories" class="quick-card">
          <div class="qc-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </div>
          <div>
            <div class="qc-title">Specialties</div>
            <div class="qc-sub">Manage doctor specialties</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:1200px; }
    @media(max-width:768px){.page{padding:16px;}}
    .page-header { margin-bottom:24px; }
    .page-header h1 { font-size:24px; font-weight:800; color:#111; margin-bottom:4px; }
    .page-sub { font-size:14px; color:#888; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; margin-bottom:24px; }
    .stat-card { background:#fff; border-radius:14px; padding:18px; display:flex; align-items:center; gap:14px; box-shadow:0 1px 8px rgba(0,0,0,.05); }
    .stat-card.highlight { border:1.5px solid #FDE68A; }
    .stat-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stat-icon.blue   { background:#E6F1FB; }
    .stat-icon.green  { background:#E1F5EE; }
    .stat-icon.purple { background:#EDE9FF; }
    .stat-icon.yellow { background:#FEF9E7; }
    .stat-icon.red    { background:#FEF2F2; }
    .stat-icon.teal   { background:#E0F7FA; }
    .stat-num { font-size:24px; font-weight:800; color:#111; }
    .stat-lbl { font-size:12px; color:#888; margin-top:2px; }
    .stat-link { margin-left:auto; font-size:12px; color:#1E293B; font-weight:600; text-decoration:none; white-space:nowrap; }
    .stat-link.urgent { color:#D84040; }
    .stat-link.muted  { color:#aaa; }
    .quick-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
    .quick-card { background:#fff; border-radius:14px; padding:18px; display:flex; align-items:center; gap:14px; box-shadow:0 1px 8px rgba(0,0,0,.05); text-decoration:none; color:inherit; cursor:pointer; transition:transform .15s,box-shadow .15s; }
    .quick-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.09); }
    .quick-card.pending { border-left:4px solid #d4a017; }
    .qc-icon { width:52px; height:52px; background:#F4F6FA; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#1E293B; }
    .qc-title { font-size:15px; font-weight:700; color:#111; margin-bottom:3px; }
    .qc-sub   { font-size:13px; color:#888; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  stats = signal({ totalPatients:0, totalDoctors:0, totalProviders:0, totalAppointments:0, pendingDoctors:0, pendingProviders:0, appointmentsToday:0 });
  ngOnInit(): void {
    const num = (res: any): number => {
      const v = res?.data ?? res;
      if (typeof v === 'number') return v;
      if (typeof v === 'object' && v !== null) {
        return v.count ?? v.total ?? v.value ?? v.patientCount ?? v.doctorCount ?? v.nurseCount ?? 0;
      }
      return Number(v) || 0;
    };
    const arr = (res: any): any[] => {
      const d = res?.data ?? res;
      return Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
    };

    this.http.get<any>(`${environment.apiUrl}/Admin/patients/count`).subscribe({
      next: r => this.stats.update(s => ({ ...s, totalPatients: num(r) })),
      error: () => {}
    });
    this.http.get<any>(`${environment.apiUrl}/Admin/doctors/count`).subscribe({
      next: r => this.stats.update(s => ({ ...s, totalDoctors: num(r) })),
      error: () => {}
    });
    this.http.get<any>(`${environment.apiUrl}/Admin/nurses/count`).subscribe({
      next: r => this.stats.update(s => ({ ...s, totalProviders: num(r) })),
      error: () => {}
    });
    this.http.get<any>(`${environment.apiUrl}/Admin/pending/doctors`).subscribe({
      next: r => this.stats.update(s => ({ ...s, pendingDoctors: arr(r).length })),
      error: () => {}
    });
    this.http.get<any>(`${environment.apiUrl}/Admin/pending/nurses`).subscribe({
      next: r => this.stats.update(s => ({ ...s, pendingProviders: arr(r).length })),
      error: () => {}
    });
  }
}
