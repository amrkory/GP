import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { DoctorService }  from '../../../../core/services/doctor.service';
import { Appointment }    from '../../../../core/models/api.models';

@Component({
  selector: 'app-doctor-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header"><h1>Appointments</h1></div>
      <div class="filter-tabs">
        <button *ngFor="let f of filters" class="tab" [class.active]="activeFilter() === f.key" (click)="activeFilter.set(f.key)">{{ f.label }}</button>
      </div>
      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
      <div class="appt-list" *ngIf="!loading()">
        <a class="appt-card" *ngFor="let a of filtered()" [routerLink]="['/doctor/appointments', a.id]">
          <div class="appt-date-col">
            <div class="appt-day">{{ a.appointmentTime || a.scheduledAt | date:'d' }}</div>
            <div class="appt-mon">{{ a.appointmentTime || a.scheduledAt | date:'MMM' }}</div>
          </div>
          <div class="appt-divider"></div>
          <div class="appt-body">
            <div class="appt-patient">{{ a.patientName }}</div>
            <div class="appt-time">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ a.appointmentTime || a.scheduledAt | date:'h:mm a' }} · {{ a.durationMinutes }} min
            </div>
            <span class="type-pill" [class]="a.type.toLowerCase()">{{ a.type }}</span>
          </div>
          <div class="appt-right">
            <span class="status-badge" [class]="a.status.toLowerCase()">{{ a.status }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </a>
        <div class="empty" *ngIf="filtered().length === 0">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p>No {{ activeFilter() }} appointments</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:900px; }
    @media (max-width:768px) { .page { padding:16px; } }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; margin-bottom:14px; }
    .filter-tabs { display:flex; gap:6px; margin-bottom:14px; overflow-x:auto; padding-bottom:4px; }
    .tab { padding:7px 14px; border-radius:20px; border:1.5px solid #e8e8e8; background:#fff; font-size:13px; cursor:pointer; white-space:nowrap; color:#666; }
    .tab.active { background:#2D4A8A; color:#fff; border-color:#2D4A8A; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .appt-list { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:12px; }
    @media (max-width:600px) { .appt-list { grid-template-columns:1fr; } }
    .appt-card { background:#fff; border-radius:14px; padding:14px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 8px rgba(0,0,0,0.05); text-decoration:none; color:inherit; }
    .appt-date-col { text-align:center; flex-shrink:0; width:36px; }
    .appt-day { font-size:20px; font-weight:700; color:#2D4A8A; line-height:1; }
    .appt-mon { font-size:11px; color:#888; text-transform:uppercase; }
    .appt-divider { width:1px; height:40px; background:#f0f0f0; flex-shrink:0; }
    .appt-body { flex:1; }
    .appt-patient { font-size:14px; font-weight:600; color:#111; margin-bottom:3px; }
    .appt-time { display:flex; align-items:center; gap:4px; font-size:12px; color:#888; margin-bottom:4px; }
    .type-pill { font-size:11px; padding:2px 8px; border-radius:8px; background:#f0f0f0; color:#555; }
    .type-pill.video { background:#E6F1FB; color:#185FA5; }
    .appt-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
    .status-badge { font-size:11px; padding:3px 9px; border-radius:8px; font-weight:600; }
    .status-badge.confirmed { background:#E1F5EE; color:#0F6E56; }
    .status-badge.pending   { background:#FEF9E7; color:#d4a017; }
    .status-badge.cancelled { background:#FEF2F2; color:#D84040; }
    .status-badge.completed { background:#f0f0f0; color:#555; }
    .empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:32px; background:#fff; border-radius:14px; color:#888; font-size:14px; }
  `],
})
export class DoctorAppointmentListComponent implements OnInit {
  private svc = inject(DoctorService);
  loading      = signal(true);
  all          = signal<Appointment[]>([]);
  activeFilter = signal('all');
  filters = [
    { key:'all', label:'All' }, { key:'upcoming', label:'Upcoming' },
    { key:'completed', label:'Completed' }, { key:'cancelled', label:'Cancelled' },
  ];
  filtered(): Appointment[] {
    const f = this.activeFilter(), now = new Date();
    if (f === 'upcoming')  return this.all().filter(a => ['Confirmed','Pending'].includes(a.status) && new Date((a.appointmentTime || a.scheduledAt) ?? Date.now()) > now);
    if (f === 'completed') return this.all().filter(a => a.status === 'Completed');
    if (f === 'cancelled') return this.all().filter(a => a.status === 'Cancelled');
    return this.all();
  }
  ngOnInit(): void { this.svc.getAppointments().subscribe((res: any) => { const list = res?.data?.items ?? res?.data ?? res ?? []; this.all.set(list); this.loading.set(false); }); }
}
