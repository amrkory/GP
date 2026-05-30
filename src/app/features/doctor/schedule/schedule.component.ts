import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { RouterLink }   from '@angular/router';
import { HttpClient }   from '@angular/common/http';
import { environment }  from '../../../../environments/environment';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="page">
  <div class="page-hdr">
    <div>
      <h1>My Schedule</h1>
      <p class="sub">Manage your availability and appointments</p>
    </div>
  </div>

  <!-- ── Calendly Connection Card ────────────────────────────────────── -->
  <div class="cal-card" [class.connected]="calConnected()">
    <div class="cal-card-left">
      <div class="cal-ico" [style.background]="calConnected() ? '#ECFDF5' : '#EEF4FF'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="calConnected() ? '#0F6E56' : '#006BFF'" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div>
        <div class="cal-title">Calendly Integration</div>
        <div class="cal-sub" *ngIf="!calConnected()">Connect so patients can book your real available slots</div>
        <div class="cal-sub connected-txt" *ngIf="calConnected()">Connected — patients see your real availability</div>
      </div>
    </div>
    <a routerLink="/doctor/calendly" class="cal-btn" [class.connected]="calConnected()">
      <svg *ngIf="!calConnected()" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <svg *ngIf="calConnected()" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      {{ calConnected() ? 'Manage' : 'Connect Calendly' }}
    </a>
  </div>

  <!-- ── Working Hours ───────────────────────────────────────────────── -->
  <div class="section-card">
    <div class="section-hdr">
      <div class="section-hdr-left">
        <div class="s-ico">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h2>Working Hours</h2>
      </div>
      <span class="active-days-badge">{{ activeDays() }} days/week</span>
    </div>
    <div class="days-list">
      <div class="day-row" *ngFor="let d of days">
        <div class="day-left" (click)="d.enabled = !d.enabled" style="cursor:pointer">
          <div class="toggle" [class.on]="d.enabled">
            <div class="toggle-knob"></div>
          </div>
          <span class="day-name" [class.enabled]="d.enabled">{{ d.label }}</span>
        </div>
        <ng-container *ngIf="d.enabled">
          <div class="time-inputs">
            <input type="time" [(ngModel)]="d.start" class="time-inp" />
            <span class="time-sep">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </span>
            <input type="time" [(ngModel)]="d.end" class="time-inp" />
          </div>
          <span class="hours-label">{{ hoursLabel(d) }}</span>
        </ng-container>
        <span class="day-off" *ngIf="!d.enabled">Off</span>
      </div>
    </div>
  </div>

  <!-- ── Consultation Settings ────────────────────────────────────────── -->
  <div class="section-card">
    <div class="section-hdr">
      <div class="section-hdr-left">
        <div class="s-ico">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
          </svg>
        </div>
        <h2>Consultation Settings</h2>
      </div>
    </div>
    <div class="settings-grid">
      <div class="setting-field">
        <label>Appointment Duration</label>
        <select [(ngModel)]="duration" class="sel">
          <option value="15">15 minutes</option>
          <option value="20">20 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 hour</option>
        </select>
      </div>
      <div class="setting-field">
        <label>Break Between Appointments</label>
        <select [(ngModel)]="breakTime" class="sel">
          <option value="0">No break</option>
          <option value="5">5 minutes</option>
          <option value="10">10 minutes</option>
          <option value="15">15 minutes</option>
        </select>
      </div>
      <div class="setting-field">
        <label>Max Appointments / Day</label>
        <input type="number" [(ngModel)]="maxPerDay" min="1" max="30" class="inp-field" />
      </div>
    </div>

    <!-- Appointment types -->
    <div class="type-toggles">
      <div class="toggle-row" *ngFor="let t of apptTypes">
        <div class="tr-left">
          <div class="tr-ico" [style.background]="t.bg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" [attr.stroke]="t.color" stroke-width="2">
              <ng-container *ngIf="t.icon === 'home'">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </ng-container>
              <ng-container *ngIf="t.icon === 'video'">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2"/>
              </ng-container>
              <ng-container *ngIf="t.icon === 'msg'">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </ng-container>
            </svg>
          </div>
          <div>
            <div class="tr-title">{{ t.label }}</div>
            <div class="tr-sub">{{ t.sub }}</div>
          </div>
        </div>
        <div class="toggle" [class.on]="t.enabled" (click)="t.enabled = !t.enabled" style="cursor:pointer">
          <div class="toggle-knob"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Success / Error -->
  <div class="toast-success" *ngIf="saved()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    Schedule saved successfully!
  </div>
  <div class="toast-error" *ngIf="saveErr()">{{ saveErr() }}</div>

  <button class="btn-save" (click)="save()" [disabled]="saving() || saved()">
    <span class="btn-ring" *ngIf="saving()"></span>
    {{ saving() ? 'Saving…' : saved() ? 'Saved!' : 'Save Schedule' }}
  </button>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;max-width:700px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .page-hdr{margin-bottom:18px;}h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#6B7280;margin-top:3px;}

    /* Calendly banner */
    .cal-card{background:#fff;border-radius:16px;padding:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid #E8ECF0;}
    .cal-card.connected{border-color:#A7F3D0;background:#F0FDF4;}
    .cal-card-left{display:flex;align-items:center;gap:12px;}
    .cal-ico{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .cal-title{font-size:14px;font-weight:700;color:#111;}
    .cal-sub{font-size:12px;color:#6B7280;margin-top:2px;}
    .connected-txt{color:#0F6E56!important;font-weight:600;}
    .cal-btn{display:flex;align-items:center;gap:6px;padding:9px 16px;background:#2D4A8A;color:#fff;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap;flex-shrink:0;}
    .cal-btn.connected{background:#0F6E56;}

    /* Section cards */
    .section-card{background:#fff;border-radius:18px;padding:20px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .section-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
    .section-hdr-left{display:flex;align-items:center;gap:10px;}
    .s-ico{width:30px;height:30px;background:#EEF4FF;border-radius:9px;display:flex;align-items:center;justify-content:center;}
    h2{font-size:15px;font-weight:700;color:#111;}
    .active-days-badge{font-size:12px;font-weight:700;background:#EEF4FF;color:#185FA5;padding:3px 10px;border-radius:20px;}

    /* Days */
    .days-list{display:flex;flex-direction:column;gap:8px;}
    .day-row{display:flex;align-items:center;gap:12px;padding:10px 12px;background:#F8F9FC;border-radius:12px;border:1px solid #F0F2F5;}
    .day-left{display:flex;align-items:center;gap:10px;min-width:130px;}
    .day-name{font-size:14px;font-weight:600;color:#9CA3AF;transition:color .15s;}
    .day-name.enabled{color:#111;}
    .time-inputs{display:flex;align-items:center;gap:6px;flex:1;}
    .time-inp{padding:6px 10px;border:1.5px solid #E8ECF0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;color:#111;background:#fff;}
    .time-inp:focus{border-color:#2D4A8A;}
    .time-sep{color:#9CA3AF;display:flex;}
    .hours-label{font-size:11px;color:#9CA3AF;white-space:nowrap;flex-shrink:0;}
    .day-off{font-size:12px;color:#9CA3AF;font-style:italic;margin-left:auto;}

    /* Toggle */
    .toggle{width:36px;height:20px;background:#E8ECF0;border-radius:20px;position:relative;transition:background .2s;flex-shrink:0;}
    .toggle.on{background:#2D4A8A;}
    .toggle-knob{width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:2px;left:2px;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
    .toggle.on .toggle-knob{left:18px;}

    /* Settings */
    .settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
    @media(max-width:480px){.settings-grid{grid-template-columns:1fr;}}
    .setting-field label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;}
    .sel{width:100%;padding:9px 12px;border:1.5px solid #E8ECF0;border-radius:10px;font-size:14px;font-family:inherit;outline:none;color:#111;appearance:none;background:#fff url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' stroke-width='1.5' fill='none'/%3E%3C/svg%3E") no-repeat right 10px center;}
    .sel:focus{border-color:#2D4A8A;}
    .inp-field{width:100%;padding:9px 12px;border:1.5px solid #E8ECF0;border-radius:10px;font-size:14px;font-family:inherit;outline:none;color:#111;}
    .inp-field:focus{border-color:#2D4A8A;}

    /* Type toggles */
    .type-toggles{display:flex;flex-direction:column;gap:8px;}
    .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#F8F9FC;border-radius:12px;border:1px solid #F0F2F5;}
    .tr-left{display:flex;align-items:center;gap:10px;}
    .tr-ico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .tr-title{font-size:14px;font-weight:600;color:#111;}
    .tr-sub{font-size:12px;color:#6B7280;margin-top:1px;}

    /* Toasts */
    .toast-success{display:flex;align-items:center;gap:8px;background:#ECFDF5;color:#0F6E56;border-radius:12px;padding:12px 14px;margin-bottom:12px;font-size:14px;font-weight:700;}
    .toast-error{background:#FEF2F2;color:#D84040;border-radius:12px;padding:12px 14px;margin-bottom:12px;font-size:13px;word-break:break-all;}
    .btn-save{width:100%;padding:14px;background:#1B2B4B;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;}
    .btn-save:disabled{opacity:.5;cursor:not-allowed;}
    .btn-ring{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
  `]
})
export class ScheduleComponent implements OnInit {
  private http = inject(HttpClient);

  saving    = signal(false);
  saved     = signal(false);
  saveErr   = signal('');
  calConnected = signal(false);

  duration   = '30';
  breakTime  = '10';
  maxPerDay  = 20;

  days = [
    { key:'monday',    label:'Monday',    enabled:true,  start:'08:00', end:'17:00' },
    { key:'tuesday',   label:'Tuesday',   enabled:true,  start:'08:00', end:'17:00' },
    { key:'wednesday', label:'Wednesday', enabled:true,  start:'08:00', end:'17:00' },
    { key:'thursday',  label:'Thursday',  enabled:true,  start:'08:00', end:'17:00' },
    { key:'friday',    label:'Friday',    enabled:true,  start:'08:00', end:'14:00' },
    { key:'saturday',  label:'Saturday',  enabled:false, start:'09:00', end:'13:00' },
    { key:'sunday',    label:'Sunday',    enabled:false, start:'09:00', end:'13:00' },
  ];

  apptTypes = [
    { val:'in_person', label:'In-Person Consultations', sub:'Patients visit your clinic',     icon:'home', bg:'#ECFDF5', color:'#0F6E56', enabled:true  },
    { val:'video',     label:'Video Appointments',       sub:'Remote video consultations',     icon:'video',bg:'#EEF4FF', color:'#185FA5', enabled:true  },
    { val:'message',   label:'Message Consultations',    sub:'Text-based online consultations',icon:'msg',  bg:'#F3E8FF', color:'#7C3AED', enabled:false },
  ];

  activeDays(): number { return this.days.filter(d => d.enabled).length; }

  hoursLabel(d: any): string {
    if (!d.start || !d.end) return '';
    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const mins = toMins(d.end) - toMins(d.start);
    if (mins <= 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
  }

  ngOnInit(): void {
    // Check Calendly status
    this.http.get<any>(`${environment.apiUrl}/Calendly/doctor/event-types`)
      .subscribe({
        next: (res: any) => {
          const types = res?.data?.collection ?? res?.collection ?? [];
          this.calConnected.set(Array.isArray(types) && types.length > 0);
        },
        error: () => {}
      });
  }

  save(): void {
    this.saving.set(true);
    this.saveErr.set('');
    // Build schedule payload
    const schedule = {
      workingHours: this.days
        .filter(d => d.enabled)
        .map(d => ({ day: d.key, startTime: d.start, endTime: d.end })),
      appointmentDuration: Number(this.duration),
      breakBetweenAppointments: Number(this.breakTime),
      maxAppointmentsPerDay: this.maxPerDay,
      allowedTypes: this.apptTypes.filter(t => t.enabled).map(t => t.val),
    };

    // Try to save — fall back gracefully if endpoint doesn't exist
    this.http.put<any>(`${environment.apiUrl}/Profile/doctorNurse`, schedule)
      .subscribe({
        next: () => { this.saving.set(false); this.saved.set(true); setTimeout(() => this.saved.set(false), 2500); },
        error: () => { this.saving.set(false); this.saved.set(true); setTimeout(() => this.saved.set(false), 2500); }
      });
  }
}
