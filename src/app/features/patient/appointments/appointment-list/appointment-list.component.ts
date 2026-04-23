import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { RouterLink }                          from '@angular/router';
import { AppointmentService }                  from '../../../../core/services/appointment.service';
import { Appointment }                         from '../../../../core/models/api.models';

type Filter = 'all' | 'upcoming' | 'completed' | 'cancelled';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>My Appointments</h1>
        <a routerLink="/patient/appointments/book" class="btn-add">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Book
        </a>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        <button *ngFor="let f of filters" class="tab" [class.active]="activeFilter() === f.key" (click)="activeFilter.set(f.key)">
          {{ f.label }}
        </button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading()">
        <div class="spinner-lg"></div>
      </div>

      <!-- List -->
      <div class="appt-list" *ngIf="!loading()">
        <div class="appt-card" *ngFor="let a of filtered()"
             [routerLink]="['/patient/appointments', a.id]">
          <div class="appt-left">
            <div class="doc-avatar">{{ initials(a.doctorName) }}</div>
          </div>
          <div class="appt-body">
            <div class="doc-name">{{ a.doctorName }}</div>
            <div class="doc-spec">{{ a.specialtyName }}</div>
            <div class="appt-date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ a.scheduledAt | date:'EEE, MMM d, y · h:mm a' }}
            </div>
            <div class="appt-type">
              <span class="type-pill" [class]="a.type.toLowerCase()">{{ a.type === 'Video' ? '📹' : a.type === 'HomeVisit' ? '🏠' : '🏥' }} {{ a.type }}</span>
            </div>
          </div>
          <div class="appt-right">
            <span class="status-badge" [class]="a.status.toLowerCase()">{{ a.status }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <div class="empty" *ngIf="filtered().length === 0">
          <div class="empty-icon">📅</div>
          <p>No {{ activeFilter() === 'all' ? '' : activeFilter() }} appointments</p>
          <a routerLink="/patient/appointments/book" class="btn-book">Book an appointment</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 16px; max-width: 640px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { font-size: 22px; font-weight: 700; color: #111; }
    .btn-add { display: flex; align-items: center; gap: 4px; background: #D84040; color: #fff; border: none; border-radius: 10px; padding: 8px 14px; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; }

    .filter-tabs { display: flex; gap: 6px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 4px; }
    .tab { padding: 7px 14px; border-radius: 20px; border: 1.5px solid #e8e8e8; background: #fff; font-size: 13px; cursor: pointer; white-space: nowrap; color: #666; transition: all .15s; }
    .tab.active { background: #D84040; color: #fff; border-color: #D84040; }

    .loading { display: flex; justify-content: center; padding: 40px; }
    .spinner-lg { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #D84040; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .appt-list { display: flex; flex-direction: column; gap: 12px; }
    .appt-card { background: #fff; border-radius: 14px; padding: 14px; display: flex; gap: 12px; align-items: center; box-shadow: 0 1px 8px rgba(0,0,0,0.06); cursor: pointer; transition: transform .1s; text-decoration: none; color: inherit; }
    .appt-card:active { transform: scale(0.99); }

    .doc-avatar { width: 46px; height: 46px; border-radius: 50%; background: #D84040; color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .appt-body  { flex: 1; }
    .doc-name   { font-size: 15px; font-weight: 600; color: #111; margin-bottom: 2px; }
    .doc-spec   { font-size: 12px; color: #888; margin-bottom: 4px; }
    .appt-date  { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #555; margin-bottom: 6px; }
    .type-pill  { font-size: 11px; padding: 3px 8px; border-radius: 10px; background: #f0f0f0; color: #555; }
    .type-pill.video { background: #E6F1FB; color: #185FA5; }
    .type-pill.homevisit { background: #E1F5EE; color: #0F6E56; }

    .appt-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .status-badge { font-size: 11px; padding: 3px 9px; border-radius: 10px; font-weight: 600; }
    .status-badge.confirmed { background: #E1F5EE; color: #0F6E56; }
    .status-badge.pending   { background: #FEF9E7; color: #d4a017; }
    .status-badge.cancelled { background: #FEF2F2; color: #D84040; }
    .status-badge.completed { background: #E6F1FB; color: #185FA5; }
    .status-badge.rescheduled { background: #FAEEDA; color: #854F0B; }

    .empty      { text-align: center; padding: 40px 20px; background: #fff; border-radius: 14px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty p    { color: #888; font-size: 15px; margin-bottom: 16px; }
    .btn-book   { background: #D84040; color: #fff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; }
  `],
})
export class AppointmentListComponent implements OnInit {
  private svc = inject(AppointmentService);

  loading      = signal(true);
  activeFilter = signal<Filter>('all');
  appointments = signal<Appointment[]>([]);

  filters = [
    { key: 'all'       as Filter, label: 'All' },
    { key: 'upcoming'  as Filter, label: 'Upcoming' },
    { key: 'completed' as Filter, label: 'Completed' },
    { key: 'cancelled' as Filter, label: 'Cancelled' },
  ];

  filtered(): Appointment[] {
    const f = this.activeFilter();
    const all = this.appointments();
    if (f === 'all')       return all;
    if (f === 'upcoming')  return all.filter(a => ['Confirmed','Pending'].includes(a.status) && new Date(a.scheduledAt) > new Date());
    if (f === 'completed') return all.filter(a => a.status === 'Completed');
    if (f === 'cancelled') return all.filter(a => a.status === 'Cancelled');
    return all;
  }

  ngOnInit(): void {
    this.svc.getMyAppointments().subscribe(res => {
      this.appointments.set(res.data);
      this.loading.set(false);
    });
  }

  initials(name: string): string {
    return name.replace('Dr. ','').split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
  }
}
