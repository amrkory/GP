import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { Subscription, filter } from 'rxjs';

type Filter = 'all'|'upcoming'|'completed'|'cancelled';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>My Appointments</h1><p class="sub">Manage your bookings</p></div>
        <a routerLink="/patient/appointments/book" class="btn-book">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Book
        </a>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <button *ngFor="let f of filters" class="filter-btn"
                [class.active]="activeFilter()===f.key"
                (click)="setFilter(f.key)">
          {{ f.label }}
          <span class="filter-count" *ngIf="countByFilter(f.key) > 0">{{ countByFilter(f.key) }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Loading appointments...</p>
      </div>

      <!-- Empty -->
      <div class="empty" *ngIf="!loading() && filtered().length === 0">
        <div class="empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <h3>No {{ activeFilter() === 'all' ? '' : activeFilter() }} appointments</h3>
        <p *ngIf="activeFilter()==='all' || activeFilter()==='upcoming'">Book your first appointment with a doctor.</p>
        <a routerLink="/patient/appointments/book" class="btn-book-empty">Book Appointment →</a>
      </div>

      <!-- Appointments -->
      <div class="appt-list" *ngIf="!loading()">
        <div class="appt-card" *ngFor="let a of filtered()"
             [routerLink]="['/patient/appointments', a.id]">

          <!-- Status bar -->
          <div class="status-bar" [class]="getStatus(a).cls"></div>

          <div class="appt-body">
            <!-- Doctor info -->
            <div class="doc-row">
              <div class="doc-avatar" [style.background]="avatarBg(a)">
                {{ getDoctorInitials(a) }}
              </div>
              <div class="doc-details">
                <div class="doc-name">{{ getDoctorName(a) }}</div>
                <div class="doc-spec">{{ getDoctorSpec(a) }}</div>
              </div>
              <div class="status-pill" [class]="getStatus(a).cls">{{ getStatus(a).label }}</div>
            </div>

            <!-- Time -->
            <div class="appt-time">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ getTime(a) | date:'EEE, MMM d, y · h:mm a' }}
            </div>

            <!-- Type -->
            <div class="appt-meta">
              <div class="appt-type">
                <ng-container [ngSwitch]="a.type">
                  <svg *ngSwitchCase="'video'" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  <svg *ngSwitchCase="'in_person'" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  <svg *ngSwitchDefault width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </ng-container>
                {{ getTypeLabel(a.type) }}
              </div>
              <div class="arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; }
    .page { padding:24px; max-width:720px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page { padding:16px; } }

    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
    .page-header h1 { font-size:22px; font-weight:800; color:#111; margin:0 0 2px; }
    .sub { font-size:13px; color:#888; margin:0; }

    .btn-book { display:flex; align-items:center; gap:6px; background:#D84040; color:#fff; border:none; border-radius:12px; padding:10px 16px; font-size:13px; font-weight:700; text-decoration:none; white-space:nowrap; }

    .filter-row { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
    .filter-btn { display:flex; align-items:center; gap:5px; padding:7px 14px; border:1.5px solid #e8e8e8; border-radius:20px; background:#fff; font-size:13px; color:#555; cursor:pointer; font-family:inherit; }
    .filter-btn.active { background:#D84040; color:#fff; border-color:#D84040; }
    .filter-count { background:rgba(255,255,255,.3); color:inherit; font-size:10px; padding:1px 6px; border-radius:10px; }
    .filter-btn:not(.active) .filter-count { background:#f0f0f0; color:#888; }

    .loading { display:flex; flex-direction:column; align-items:center; padding:48px; gap:10px; color:#888; font-size:14px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .empty { text-align:center; padding:48px 24px; background:#fff; border-radius:16px; }
    .empty-icon { width:72px; height:72px; background:#f0f0f0; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .empty h3 { font-size:18px; font-weight:700; color:#111; margin-bottom:6px; text-transform:capitalize; }
    .empty p { font-size:14px; color:#888; margin-bottom:16px; }
    .btn-book-empty { display:inline-block; padding:11px 22px; background:#D84040; color:#fff; border-radius:12px; font-size:14px; font-weight:700; text-decoration:none; }

    .appt-list { display:flex; flex-direction:column; gap:12px; }
    .appt-card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,.06); cursor:pointer; display:flex; transition:box-shadow .15s; }
    .appt-card:hover { box-shadow:0 4px 18px rgba(0,0,0,.1); }

    .status-bar { width:5px; flex-shrink:0; }
    .status-bar.confirmed { background:#0F6E56; }
    .status-bar.pending   { background:#d4a017; }
    .status-bar.completed { background:#185FA5; }
    .status-bar.cancelled { background:#aaa; }

    .appt-body { flex:1; padding:14px 16px; }
    .doc-row { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
    .doc-avatar { width:44px; height:44px; border-radius:50%; color:#fff; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .doc-details { flex:1; }
    .doc-name { font-size:15px; font-weight:700; color:#111; }
    .doc-spec { font-size:12px; color:#D84040; font-weight:600; margin-top:1px; }

    .status-pill { font-size:11px; padding:4px 10px; border-radius:20px; font-weight:700; flex-shrink:0; }
    .status-pill.confirmed { background:#E1F5EE; color:#0F6E56; }
    .status-pill.pending   { background:#FEF9E7; color:#d4a017; }
    .status-pill.completed { background:#E6F1FB; color:#185FA5; }
    .status-pill.cancelled   { background:#f0f0f0; color:#888; }
    .status-pill.rescheduled { background:#F3E8FF; color:#7C3AED; }
    .status-bar.rescheduled  { background:#7C3AED; }

    .appt-time { display:flex; align-items:center; gap:6px; font-size:13px; color:#555; margin-bottom:8px; font-weight:500; }

    .appt-meta { display:flex; align-items:center; justify-content:space-between; }
    .appt-type { display:flex; align-items:center; gap:6px; font-size:12px; color:#888; background:#F7F8FA; padding:5px 10px; border-radius:8px; }
    .arrow { display:flex; }
  `],
})
export class AppointmentListComponent implements OnInit, OnDestroy {
  private routerSub?: Subscription;
  private svc    = inject(AppointmentService);
  private router2 = inject(Router);

  loading      = signal(true);
  allAppts     = signal<any[]>([]);
  activeFilter = signal<Filter>('all');

  filters = [
    { key: 'all',       label: 'All' },
    { key: 'upcoming',  label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  setFilter(f: string): void { this.activeFilter.set(f as Filter); }

  ngOnInit(): void {
    this.loadAppts();
    // ALWAYS reload when we navigate back to appointments list
    this.routerSub = this.router2.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      if (e.urlAfterRedirects.includes('/patient/appointments') &&
          !e.urlAfterRedirects.includes('/patient/appointments/')) {
        this.svc.needsRefresh = false;
        this.loadAppts();
      }
    });
  }

  ngOnDestroy(): void { this.routerSub?.unsubscribe(); }

  loadAppts(): void {
    this.loading.set(true);
    this.svc.getMyAppointments().subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        this.allAppts.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // Normalize status: handles numeric (0,1,2,3,4) AND string values
  statusOf(a: any): string {
    const s = a.status;
    const num: Record<number,string> = { 0:'pending', 1:'confirmed', 2:'cancelled', 3:'completed', 4:'rescheduled' };
    if (typeof s === 'number') return num[s] ?? 'pending';
    return String(s ?? '').toLowerCase();
  }

  filtered(): any[] {
    const f = this.activeFilter(); const all = this.allAppts();
    if (f === 'all')       return all;
    if (f === 'upcoming')  return this.getUpcoming(all);
    if (f === 'completed') return all.filter((a: any) => this.statusOf(a) === 'completed');
    if (f === 'cancelled') return all.filter((a: any) => this.statusOf(a) === 'cancelled');
    return all;
  }

  getUpcoming(all: any[]): any[] {
    return all.filter((a: any) => {
      const s = this.statusOf(a);
      // Upcoming = pending, confirmed, rescheduled — NOT cancelled or completed
      return ['pending','confirmed','rescheduled'].includes(s);
    });
  }

  countByFilter(f: string): number {
    const all = this.allAppts();
    if (f === 'all')       return all.length;
    if (f === 'upcoming')  return this.getUpcoming(all).length;
    if (f === 'completed') return all.filter((a: any) => this.statusOf(a) === 'completed').length;
    if (f === 'cancelled') return all.filter((a: any) => this.statusOf(a) === 'cancelled').length;
    return 0;
  }

  getTime(a: any): Date { return new Date(a.appointmentTime ?? a.scheduledAt); }

  getDoctorName(a: any): string {
    const name = a.doctorName ?? '';
    if (name && name !== 'Doctor' && isNaN(Number(name))) return name;
    const f = String(a.doctorFirstName ?? a.firstName ?? '');
    const l = String(a.doctorLastName  ?? a.lastName  ?? '');
    const full = (f + ' ' + l).trim();
    if (full && full.toLowerCase() !== 'doctor') return full;
    return a.doctorEmail?.split('@')[0] ?? 'Doctor';
  }

  getDoctorSpec(a: any): string {
    return a.specialtyName ?? a.specialization ?? a.specialty ?? a.doctorSpecialty ?? '';
  }

  getDoctorInitials(a: any): string {
    const name = this.getDoctorName(a);
    const parts = name.split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'DR';
  }

  avatarBg(a: any): string {
    const colors = ['#2D4A8A','#D84040','#0F6E56','#7C3AED','#0891B2','#d4a017'];
    const idx = (a.doctorName?.charCodeAt(0) ?? 0) % colors.length;
    return colors[idx];
  }

  getTypeLabel(type: string): string {
    return { video:'Video Call', in_person:'In Person', message:'Message' }[type] ?? type;
  }

  getStatus(a: any): { label: string; cls: string } {
    const map: Record<string,{label:string;cls:string}> = {
      'Confirmed': { label:'Confirmed', cls:'confirmed' },
      'Pending':   { label:'Pending',   cls:'pending'   },
      'Completed': { label:'Completed', cls:'completed' },
      'Cancelled': { label:'Cancelled', cls:'cancelled' },
    };
    return map[String(String(a.status ?? '') ?? '')] ?? { label: String(String(a.status ?? '') ?? ''), cls:'pending' };
  }
}
