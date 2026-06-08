import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { AppointmentService } from '../../../../core/services/appointment.service';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">

      <div class="page-hdr">
        <h1>Appointments</h1>
        <p class="sub">Your patient bookings</p>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <button *ngFor="let f of filters" class="ftab"
                [class.active]="activeFilter() === f.key"
                (click)="activeFilter.set(f.key)">
          {{ f.label }}
          <span class="fc" *ngIf="countOf(f.key) > 0">{{ countOf(f.key) }}</span>
        </button>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading()">

        <div class="empty" *ngIf="filtered().length === 0">
          <div class="empty-ico">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p>No {{ activeFilter() === 'all' ? '' : activeFilter() }} appointments</p>
        </div>

        <div class="appt-grid" *ngIf="filtered().length > 0">
          <div class="appt-card" *ngFor="let a of filtered()">

            <!-- Date column -->
            <div class="date-col">
              <div class="date-day">{{ apptTime(a) | date:'d' }}</div>
              <div class="date-mon">{{ apptTime(a) | date:'MMM' }}</div>
              <div class="date-yr">{{ apptTime(a) | date:'yyyy' }}</div>
            </div>

            <div class="sep"></div>

            <!-- Body -->
            <div class="appt-body">
              <!-- Patient -->
              <div class="patient-row">
                <div class="pat-av" [style.background]="patBg(a)">{{ patIni(a) }}</div>
                <div>
                  <div class="pat-name">{{ patName(a) }}</div>
                  <div class="appt-time-str">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ apptTime(a) | date:'h:mm a' }}
                    <span *ngIf="a.durationMinutes"> · {{ a.durationMinutes }} min</span>
                  </div>
                </div>
              </div>

              <!-- Type + Status row -->
              <div class="tag-row">
                <span class="type-tag" [class]="typeKey(a)">{{ typeLabel(a) }}</span>
                <span class="status-tag" [class]="statusKey(a)">{{ statusLabel(a) }}</span>
                <!-- Calendly badge -->
                <span class="cal-tag" *ngIf="a.calendlyEventUri ?? a.calEventUri">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Calendly
                </span>
              </div>

              <!-- Notes -->
              <div class="appt-notes" *ngIf="a.notes">{{ a.notes }}</div>

              <!-- ── VIDEO JOIN LINK (Calendly auto-generates this) ── -->
              <div class="join-link-row" *ngIf="joinUrl(a)">
                <div class="jl-left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#006BFF" stroke-width="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                  <span>Video call link available</span>
                </div>
                <a [href]="joinUrl(a)" target="_blank" rel="noopener" class="btn-join">
                  Join Meeting →
                </a>
              </div>

              <!-- Calendly event link -->
              <div class="cal-event-row" *ngIf="(a.calendlyEventUri ?? a.calEventUri) && !joinUrl(a)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Booked via Calendly
              </div>

            </div>
          </div>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { width:100%; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:14px;} }
    h1 { font-size:22px; font-weight:800; color:#111; }
    .sub { font-size:13px; color:#888; margin-top:3px; margin-bottom:18px; }
    .filter-row { display:flex; gap:6px; margin-bottom:18px; flex-wrap:wrap; }
    .ftab { display:flex; align-items:center; gap:5px; padding:8px 14px; border-radius:20px; border:1.5px solid #e8e8e8; background:#fff; font-size:13px; cursor:pointer; color:#666; font-family:inherit; transition:all .15s; }
    .ftab.active { background:#2D4A8A; color:#fff; border-color:#2D4A8A; }
    .fc { background:rgba(255,255,255,.25); font-size:11px; font-weight:700; padding:1px 6px; border-radius:8px; }
    .ftab:not(.active) .fc { background:#e8e8e8; color:#555; }
    .loading { display:flex; justify-content:center; padding:48px; }
    .spinner { width:26px; height:26px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}
    .empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:56px; background:#fff; border-radius:16px; color:#888; font-size:14px; text-align:center; }
    .empty-ico { width:72px; height:72px; background:#f5f5f5; border-radius:50%; display:flex; align-items:center; justify-content:center; }

    /* Grid */
    .appt-grid { display:flex; flex-direction:column; gap:12px; }
    .appt-card { background:#fff; border-radius:16px; padding:16px; display:flex; align-items:stretch; gap:14px; box-shadow:0 1px 8px rgba(0,0,0,.07); border:1.5px solid #f0f0f0; transition:box-shadow .15s; }
    .appt-card:hover { box-shadow:0 4px 18px rgba(0,0,0,.1); }

    /* Date col */
    .date-col { display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; width:40px; }
    .date-day { font-size:22px; font-weight:800; color:#2D4A8A; line-height:1; }
    .date-mon { font-size:11px; color:#888; text-transform:uppercase; font-weight:600; }
    .date-yr  { font-size:10px; color:#ccc; }
    .sep { width:1px; background:#f0f0f0; flex-shrink:0; }

    /* Body */
    .appt-body { flex:1; min-width:0; }
    .patient-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .pat-av { width:42px; height:42px; border-radius:50%; color:#fff; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .pat-name { font-size:15px; font-weight:700; color:#111; }
    .appt-time-str { display:flex; align-items:center; gap:4px; font-size:12px; color:#888; margin-top:2px; }

    /* Tags */
    .tag-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:6px; }
    .type-tag { font-size:11px; padding:3px 10px; border-radius:8px; font-weight:600; background:#f0f0f0; color:#555; }
    .type-tag.video   { background:#E6F1FB; color:#185FA5; }
    .type-tag.in_person { background:#E1F5EE; color:#0F6E56; }
    .type-tag.message { background:#F3E8FF; color:#7C3AED; }
    .status-tag { font-size:11px; padding:3px 10px; border-radius:8px; font-weight:600; }
    .status-tag.confirmed  { background:#E1F5EE; color:#0F6E56; }
    .status-tag.pending    { background:#FEF9E7; color:#d4a017; }
    .status-tag.cancelled  { background:#FEF2F2; color:#D84040; }
    .status-tag.completed  { background:#f0f0f0; color:#555; }
    .status-tag.rescheduled { background:#F3E8FF; color:#7C3AED; }
    .cal-tag { display:inline-flex; align-items:center; gap:4px; font-size:11px; background:#E6F0FF; color:#006BFF; font-weight:600; padding:3px 8px; border-radius:8px; }

    .appt-notes { font-size:12px; color:#888; font-style:italic; margin-bottom:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

    /* Join link */
    .join-link-row { display:flex; align-items:center; justify-content:space-between; gap:10px; background:#E6F0FF; border-radius:10px; padding:10px 14px; border:1px solid #dde8ff; margin-top:4px; }
    .jl-left { display:flex; align-items:center; gap:7px; font-size:13px; color:#006BFF; font-weight:600; }
    .btn-join { padding:7px 14px; background:#006BFF; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; white-space:nowrap; }
    .btn-join:hover { background:#0056d6; }

    .cal-event-row { display:flex; align-items:center; gap:6px; font-size:12px; color:#888; margin-top:4px; }
  `]
})
export class AppointmentListComponent implements OnInit {
  private svc  = inject(AppointmentService);
  loading      = signal(true);
  all          = signal<any[]>([]);
  activeFilter = signal('all');

  filters = [
    { key:'all',        label:'All'        },
    { key:'upcoming',   label:'Upcoming'   },
    { key:'completed',  label:'Completed'  },
    { key:'cancelled',  label:'Cancelled'  },
  ];

  countOf(key: string): number {
    const now = new Date();
    if (key === 'all')       return this.all().length;
    if (key === 'upcoming')  return this.all().filter(a => ['confirmed','pending','rescheduled'].includes(this.statusKey(a)) && new Date(this.apptTime(a)).getTime() > now.getTime()).length;
    if (key === 'completed') return this.all().filter(a => this.statusKey(a) === 'completed').length;
    if (key === 'cancelled') return this.all().filter(a => this.statusKey(a) === 'cancelled').length;
    return 0;
  }

  filtered(): any[] {
    const f = this.activeFilter(), now = new Date();
    if (f === 'upcoming')  return this.all().filter(a => ['confirmed','pending','rescheduled'].includes(this.statusKey(a)) && new Date(this.apptTime(a)).getTime() > now.getTime());
    if (f === 'completed') return this.all().filter(a => this.statusKey(a) === 'completed');
    if (f === 'cancelled') return this.all().filter(a => this.statusKey(a) === 'cancelled');
    return this.all();
  }

  ngOnInit(): void {
    this.svc.getDoctorAppointments().subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        this.all.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Field helpers ────────────────────────────────────────────────────────
  apptTime(a: any): string { return a?.appointmentTime ?? a?.scheduledAt ?? new Date().toISOString(); }

  patName(a: any): string { return a?.patientName ?? a?.patientFullName ?? '—'; }

  patIni(a: any): string {
    const n = this.patName(a).split(' ');
    return ((n[0]?.[0]??'')+(n[1]?.[0]??'')).toUpperCase()||'?';
  }

  patBg(a: any): string {
    const c = ['#2D4A8A','#D84040','#0F6E56','#7C3AED','#0891B2'];
    return c[this.patName(a).charCodeAt(0)%c.length]||'#2D4A8A';
  }

  statusKey(a: any): string {
    const s = a?.status;
    if (s === null || s === undefined) return 'pending';
    if (typeof s === 'number') return (['pending','confirmed','cancelled','completed','rescheduled'][s]??'pending');
    return String(s).toLowerCase().trim();
  }

  statusLabel(a: any): string {
    const m: any = {pending:'Pending',confirmed:'Confirmed',cancelled:'Cancelled',completed:'Completed',rescheduled:'Rescheduled'};
    return m[this.statusKey(a)] ?? String(a?.status ?? '');
  }

  typeKey(a: any): string {
    const t = a?.type;
    if (typeof t === 'number') return ({0:'in_person',1:'video',2:'message'} as any)[t]??'in_person';
    return String(t??'').toLowerCase().replace(' ','_');
  }

  typeLabel(a: any): string {
    const m: any = {in_person:'In Person',video:'Video Call',message:'Message'};
    return m[this.typeKey(a)] ?? String(a?.type ?? '');
  }

  /** Video join URL — Calendly sets this on video appointments */
  joinUrl(a: any): string {
    return a?.videoCallLink ?? a?.calendlyJoinUrl ?? a?.joinUrl ?? a?.meetingLink ?? '';
  }
}
