import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { HttpClient }   from '@angular/common/http';
import { environment }  from '../../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))              return r;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.data))        return r.data;
  if (Array.isArray(r?.items))       return r.items;
  return [];
}
const SM: Record<number,string> = { 0:'Pending',1:'Confirmed',2:'Completed',3:'Cancelled',4:'Rescheduled' };
function sStr(s: any): string { return typeof s==='number' ? SM[s]??'Pending' : (s??'Pending').toString(); }

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">
  <div class="pg-hdr">
    <div>
      <h1>My Appointments</h1>
      <p class="sub" *ngIf="!loading()">{{ all().length }} appointment{{ all().length!==1?'s':'' }}</p>
    </div>
    <a routerLink="/patient/appointments/book" class="btn-book">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Book Appointment
    </a>
  </div>

  <div class="ftabs">
    <button *ngFor="let f of FILTERS" class="ftab"
            [class.active]="tab()===f.k" (click)="tab.set(f.k)">
      {{ f.l }}
      <span class="fcnt" *ngIf="f.k!=='all'&&cnt(f.k)>0">{{ cnt(f.k) }}</span>
    </button>
  </div>

  <!-- Skeleton -->
  <div class="sk-list" *ngIf="loading()">
    <div class="sk-row" *ngFor="let i of [1,2,3,4]">
      <div class="sk-date"></div>
      <div class="sk-lines"><div class="sk-l w65"></div><div class="sk-l w40"></div></div>
    </div>
  </div>

  <!-- Empty -->
  <div class="empty" *ngIf="!loading()&&filtered().length===0">
    <div class="e-ico">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </div>
    <p>No appointments yet</p>
    <a routerLink="/patient/appointments/book" class="btn-empty">Book now</a>
  </div>

  <!-- List -->
  <div class="appt-list" *ngIf="!loading()">
    <div class="appt-card" *ngFor="let a of filtered()">
      <div class="date-col">
        <div class="dc-day">{{ (a.appointmentTime??a.scheduledAt) | date:'d' }}</div>
        <div class="dc-mon">{{ (a.appointmentTime??a.scheduledAt) | date:'MMM' }}</div>
        <div class="dc-yr" >{{ (a.appointmentTime??a.scheduledAt) | date:'y' }}</div>
      </div>
      <div class="sep"></div>
      <div class="appt-body">
        <div class="appt-doc">Dr. {{ a.doctorName || a.doctorFirstName || '—' }}</div>
        <div class="appt-spec" *ngIf="a.doctorSpecialty||a.specialization">
          {{ a.doctorSpecialty||a.specialization }}
        </div>
        <div class="appt-time">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {{ (a.appointmentTime??a.scheduledAt) | date:'h:mm a' }}
          <span *ngIf="a.durationMinutes"> · {{ a.durationMinutes }} min</span>
        </div>
      </div>
      <div class="appt-right">
        <span class="sb" [class]="sCls(a.status)">{{ sStr(a.status) }}</span>
        <!-- Reschedule button only for upcoming appointments -->
        <button class="btn-reschedule" *ngIf="isUpcoming(a)" (click)="openReschedule(a)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 2v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>
          </svg>
          Reschedule
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ── RESCHEDULE MODAL ──────────────────────────────────────────────────── -->
<div class="overlay" *ngIf="modal()" (click)="closeModal()">
  <div class="modal" (click)="$event.stopPropagation()">

    <div class="modal-hdr">
      <div>
        <h3>Reschedule Appointment</h3>
        <p class="modal-sub">
          Dr. {{ target()?.doctorName || target()?.doctorFirstName }}
          <span class="dot-sep">·</span>
          {{ (target()?.appointmentTime??target()?.scheduledAt) | date:'EEE, MMM d' }}
        </p>
      </div>
      <button class="close-btn" (click)="closeModal()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Loading slots -->
    <div class="slots-loading" *ngIf="slotsLoading()">
      <div class="sp-sm"></div>
      <span>Loading available slots from Calendly…</span>
    </div>

    <!-- No Calendly -->
    <div class="no-slots-msg" *ngIf="!slotsLoading() && !hasCalendly()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span>This doctor hasn't set up online scheduling yet</span>
    </div>

    <!-- No slots available -->
    <div class="no-slots-msg" *ngIf="!slotsLoading() && hasCalendly() && slots().length===0">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
      </svg>
      <span>No available slots in the next 14 days</span>
    </div>

    <!-- Slots grouped by day -->
    <div class="slots-wrap" *ngIf="!slotsLoading() && slots().length>0">
      <p class="slots-hint">Select a new time slot:</p>
      <div class="slots-day" *ngFor="let day of slotsByDay()">
        <div class="day-label">{{ day.date | date:'EEEE, MMMM d' }}</div>
        <div class="slots-row">
          <button class="slot-btn"
                  *ngFor="let s of day.slots"
                  [class.sel]="selectedSlot()?.startTime===s.startTime"
                  (click)="selectedSlot.set(s)">
            {{ s.startTime | date:'h:mm a' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Selected slot summary -->
    <div class="sel-summary" *ngIf="selectedSlot()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      New time: <strong>{{ selectedSlot()!.startTime | date:'EEE, MMM d · h:mm a' }}</strong>
    </div>

    <div class="err-box" *ngIf="reschedErr()">{{ reschedErr() }}</div>
    <div class="ok-box" *ngIf="reschedOk()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Rescheduled successfully!
    </div>

    <div class="modal-btns">
      <button class="btn-close" (click)="closeModal()" [disabled]="saving()">Close</button>
      <button class="btn-confirm" (click)="confirm()"
              [disabled]="saving() || !selectedSlot()">
        <span class="ring" *ngIf="saving()"></span>
        {{ saving() ? 'Saving…' : 'Confirm Reschedule' }}
      </button>
    </div>

  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;max-width:760px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .pg-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;gap:12px;}
    h1{font-size:22px;font-weight:800;color:#111;}.sub{font-size:13px;color:#6B7280;margin-top:3px;}
    .btn-book{display:flex;align-items:center;gap:6px;padding:10px 18px;background:#2D4A8A;color:#fff;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;flex-shrink:0;}
    .ftabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;}
    .ftab{padding:7px 14px;border:1.5px solid #E8ECF0;border-radius:20px;background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit;display:flex;align-items:center;gap:5px;}
    .ftab.active{background:#2D4A8A;color:#fff;border-color:#2D4A8A;}
    .fcnt{background:rgba(0,0,0,.12);font-size:10px;padding:1px 5px;border-radius:10px;}
    @keyframes pk{0%,100%{opacity:1;}50%{opacity:.45;}}
    .sk-list{display:flex;flex-direction:column;gap:10px;}
    .sk-row{display:flex;align-items:center;gap:14px;background:#fff;border-radius:14px;padding:16px;border:1px solid #F0F2F5;}
    .sk-date{width:42px;height:50px;border-radius:10px;background:#F0F2F5;flex-shrink:0;animation:pk 1.4s infinite;}
    .sk-lines{flex:1;display:flex;flex-direction:column;gap:9px;}
    .sk-l{height:11px;border-radius:6px;background:#F0F2F5;animation:pk 1.4s infinite;}
    .sk-l.w65{width:65%;}.sk-l.w40{width:40%;}
    .empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:56px 24px;background:#fff;border-radius:18px;text-align:center;border:1px solid #F0F2F5;}
    .e-ico{width:68px;height:68px;background:#F4F6FA;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty p{font-size:14px;color:#9CA3AF;}
    .btn-empty{padding:10px 22px;background:#2D4A8A;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;}
    .appt-list{display:flex;flex-direction:column;gap:10px;}
    .appt-card{background:#fff;border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 6px rgba(0,0,0,.05);border:1px solid #F0F2F5;}
    .date-col{text-align:center;flex-shrink:0;min-width:40px;}
    .dc-day{font-size:24px;font-weight:800;color:#2D4A8A;line-height:1;}
    .dc-mon{font-size:10px;color:#6B7280;text-transform:uppercase;font-weight:700;letter-spacing:.5px;}
    .dc-yr{font-size:10px;color:#9CA3AF;}
    .sep{width:1px;height:50px;background:#F0F2F5;flex-shrink:0;}
    .appt-body{flex:1;min-width:0;}
    .appt-doc{font-size:15px;font-weight:700;color:#111;margin-bottom:2px;}
    .appt-spec{font-size:12px;color:#2D4A8A;font-weight:600;margin-bottom:4px;}
    .appt-time{display:flex;align-items:center;gap:5px;font-size:12px;color:#6B7280;}
    .appt-right{display:flex;flex-direction:column;align-items:flex-end;gap:7px;flex-shrink:0;}
    .sb{display:inline-block;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;}
    .sb.pending{background:#FFFBEB;color:#d4a017;}
    .sb.confirmed{background:#ECFDF5;color:#0F6E56;}
    .sb.completed{background:#F0F2F5;color:#6B7280;}
    .sb.cancelled{background:#FEF2F2;color:#D84040;}
    .sb.rescheduled{background:#EFF6FF;color:#185FA5;}
    .btn-reschedule{display:flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px solid #E8ECF0;border-radius:8px;background:#fff;font-size:11px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit;white-space:nowrap;}
    .btn-reschedule:hover{border-color:#2D4A8A;color:#2D4A8A;background:#EEF2FF;}
    /* Modal */
    @keyframes sp{to{transform:rotate(360deg);}}
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;backdrop-filter:blur(2px);}
    .modal{background:#fff;border-radius:20px;padding:24px;max-width:500px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);}
    .modal-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;}
    .modal-hdr h3{font-size:17px;font-weight:800;color:#111;margin-bottom:3px;}
    .modal-sub{font-size:13px;color:#6B7280;}
    .dot-sep{margin:0 4px;}
    .close-btn{background:none;border:none;cursor:pointer;color:#9CA3AF;padding:2px;display:flex;flex-shrink:0;}
    .close-btn:hover{color:#374151;}
    .slots-loading{display:flex;align-items:center;gap:8px;font-size:13px;color:#6B7280;padding:20px 0;}
    .sp-sm{width:16px;height:16px;border:2px solid #f0f0f0;border-top-color:#2D4A8A;border-radius:50%;animation:sp .7s linear infinite;flex-shrink:0;}
    .no-slots-msg{display:flex;align-items:center;gap:8px;font-size:13px;color:#9CA3AF;padding:20px 0;}
    .slots-wrap{max-height:280px;overflow-y:auto;padding-right:4px;margin-bottom:14px;}
    .slots-hint{font-size:12px;font-weight:600;color:#374151;margin-bottom:10px;}
    .slots-day{margin-bottom:14px;}
    .day-label{font-size:12px;font-weight:700;color:#374151;padding:6px 0;border-bottom:1px solid #F0F2F5;margin-bottom:8px;}
    .slots-row{display:flex;flex-wrap:wrap;gap:7px;}
    .slot-btn{padding:7px 14px;border:1.5px solid #E8ECF0;border-radius:20px;background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:#374151;font-family:inherit;transition:all .15s;}
    .slot-btn:hover{border-color:#2D4A8A;color:#2D4A8A;background:#EEF2FF;}
    .slot-btn.sel{background:#2D4A8A;color:#fff;border-color:#2D4A8A;}
    .sel-summary{display:flex;align-items:center;gap:7px;background:#ECFDF5;border-radius:10px;padding:10px 13px;font-size:13px;color:#0F6E56;margin-bottom:12px;}
    .sel-summary strong{color:#0F6E56;}
    .err-box{background:#FEF2F2;color:#D84040;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:13px;}
    .ok-box{display:flex;align-items:center;gap:7px;background:#ECFDF5;color:#0F6E56;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:13px;font-weight:600;}
    .modal-btns{display:flex;gap:10px;margin-top:16px;}
    .btn-close{flex:1;padding:12px;border:1.5px solid #E8ECF0;background:#fff;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;color:#555;}
    .btn-confirm{flex:2;padding:12px;background:#2D4A8A;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;}
    .btn-confirm:disabled{opacity:.5;cursor:not-allowed;}
    .ring{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite;}
  `]
})
export class AppointmentListComponent implements OnInit {
  private http = inject(HttpClient);

  loading     = signal(true);
  saving      = signal(false);
  slotsLoading= signal(false);
  modal       = signal(false);
  tab         = signal('all');

  all          = signal<any[]>([]);
  target       = signal<any>(null);
  slots        = signal<any[]>([]);
  selectedSlot = signal<any>(null);
  hasCalendly  = signal(false);
  reschedErr   = signal('');
  reschedOk    = signal(false);
  private eventTypeUri = '';

  readonly FILTERS = [
    { k:'all',       l:'All'       },
    { k:'upcoming',  l:'Upcoming'  },
    { k:'completed', l:'Completed' },
  ];

  filtered(): any[] {
    const t = this.tab();
    if (t==='all')      return this.all();
    if (t==='upcoming') return this.all().filter(a => this.isUpcoming(a));
    return this.all().filter(a => sStr(a.status).toLowerCase() === t);
  }
  cnt(k: string): number {
    if (k==='upcoming') return this.all().filter(a => this.isUpcoming(a)).length;
    return this.all().filter(a => sStr(a.status).toLowerCase()===k).length;
  }
  isUpcoming(a: any): boolean {
    const t = new Date(a.appointmentTime??a.scheduledAt??0).getTime();
    const s = sStr(a.status).toLowerCase();
    return t > Date.now() && s!=='cancelled' && s!=='completed';
  }
  sStr(s: any): string { return sStr(s); }
  sCls(s: any): string { return sStr(s).toLowerCase(); }

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/Appointment/Patient`, {
      params: { pageNumber:'1', pageSize:'200' }
    }).subscribe({
      next: (res:any) => {
        this.all.set(toArr(res).sort((a,b) =>
          new Date(b.appointmentTime??b.scheduledAt??0).getTime() -
          new Date(a.appointmentTime??a.scheduledAt??0).getTime()
        ));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openReschedule(a: any): void {
    this.target.set(a);
    this.slots.set([]);
    this.selectedSlot.set(null);
    this.hasCalendly.set(false);
    this.reschedErr.set('');
    this.reschedOk.set(false);
    this.modal.set(true);
    this.loadSlots(a.doctorId ?? a.doctor?.id ?? '');
  }

  closeModal(): void { if (!this.saving()) this.modal.set(false); }

  private loadSlots(doctorId: string): void {
    if (!doctorId) return;
    this.slotsLoading.set(true);

    this.http.get<any>(`${environment.apiUrl}/Calendly/doctor/${doctorId}/event-types`).subscribe({
      next: (res:any) => {
        const types = res?.data?.collection ?? res?.collection ?? res?.data ?? [];
        const list  = Array.isArray(types) ? types : [];
        if (!list.length) { this.slotsLoading.set(false); return; }

        this.hasCalendly.set(true);
        this.eventTypeUri = list[0]?.uri ?? '';
        const from = new Date().toISOString();
        const to   = new Date(Date.now() + 14*86400000).toISOString();

        this.http.get<any>(`${environment.apiUrl}/Calendly/slots/${doctorId}`, {
          params: { from, to, eventTypeUri: this.eventTypeUri }
        }).subscribe({
          next: (r:any) => {
            const raw = r?.data?.slots ?? r?.slots ?? r?.data ?? r ?? [];
            this.slots.set(Array.isArray(raw) ? raw : []);
            this.slotsLoading.set(false);
          },
          error: () => { this.slots.set([]); this.slotsLoading.set(false); }
        });
      },
      error: () => this.slotsLoading.set(false)
    });
  }

  slotsByDay(): { date:Date; slots:any[] }[] {
    const map = new Map<string,{date:Date;slots:any[]}>();
    for (const s of this.slots()) {
      const d = new Date(s.startTime);
      const k = d.toDateString();
      if (!map.has(k)) map.set(k, { date:d, slots:[] });
      map.get(k)!.slots.push(s);
    }
    return [...map.values()];
  }

  confirm(): void {
    const slot  = this.selectedSlot();
    const appt  = this.target();
    if (!slot || !appt) return;
    this.saving.set(true);
    this.reschedErr.set('');

    // PUT /api/Appointment/reschedule/{id}
    this.http.put(`${environment.apiUrl}/Appointment/reschedule/${appt.id}`, {
      newAppointmentTime: slot.startTime,
      rescheduleReason:   'Patient requested',
    }).subscribe({
      next: () => {
        this.all.update(l => l.map(x =>
          x.id===appt.id ? {...x, status:4, appointmentTime:slot.startTime} : x
        ));
        this.saving.set(false);
        this.reschedOk.set(true);
        setTimeout(() => this.modal.set(false), 1500);
      },
      error: (e:any) => {
        this.saving.set(false);
        this.reschedErr.set(e?.error?.message ?? e?.error?.title ?? `Error ${e?.status}`);
      }
    });
  }
}
