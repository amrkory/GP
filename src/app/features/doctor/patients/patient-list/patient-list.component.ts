import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { RouterLink }    from '@angular/router';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../../../environments/environment';

interface Patient {
  id:                string;
  firstName:         string;
  lastName:          string;
  fullName:          string;
  email:             string;
  phone:             string;
  gender:            string;
  dateOfBirth:       string;
  bloodType:         string;
  profilePictureUrl: string;
  appointmentCount:  number;
  lastAppointment:   string;
}

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="page">
  <div class="ph">
    <div>
      <h1>My Patients</h1>
      <p class="sub" *ngIf="!loading()">{{ filtered().length }} patient{{ filtered().length!==1?'s':'' }} under your care</p>
    </div>
  </div>

  <!-- Search bar -->
  <div class="search-bar">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input [(ngModel)]="q" (ngModelChange)="doSearch()" placeholder="Search by name, email or phone…" />
    <button class="cl-btn" *ngIf="q" (click)="q=''; doSearch()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>

  <!-- Loading -->
  <div class="loading" *ngIf="loading()">
    <div class="sk-grid">
      <div class="sk-card" *ngFor="let i of [1,2,3,4,5,6]">
        <div class="sk-av"></div>
        <div class="sk-lines">
          <div class="sk-l w60"></div>
          <div class="sk-l w40 mt4"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty -->
  <div class="empty" *ngIf="!loading() && filtered().length===0">
    <div class="e-ico">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    </div>
    <p>{{ q ? 'No patients match your search' : 'No patients yet' }}</p>
    <span>Patients appear here after booking appointments</span>
  </div>

  <!-- Patient grid -->
  <div class="grid" *ngIf="!loading()">
    <a class="card" *ngFor="let p of filtered()" [routerLink]="['/doctor/patients', p.id]">
      <!-- Avatar: photo or initials -->
      <div class="card-top">
        <div class="av-wrap">
          <img *ngIf="p.profilePictureUrl" [src]="p.profilePictureUrl"
               class="av-img" alt="" (error)="p.profilePictureUrl=''" />
          <div *ngIf="!p.profilePictureUrl" class="av-ini"
               [style.background]="clr(p.firstName)">
            {{ ini(p) }}
          </div>
        </div>
        <div class="card-info">
          <div class="p-name">{{ p.fullName }}</div>
          <div class="p-meta">
            <span *ngIf="p.gender" class="chip">{{ p.gender | titlecase }}</span>
            <span *ngIf="p.dateOfBirth" class="chip">{{ age(p.dateOfBirth) }} yrs</span>
            <span *ngIf="p.bloodType" class="chip blood">{{ p.bloodType }}</span>
          </div>
        </div>
      </div>

      <div class="card-body">
        <div class="info-row" *ngIf="p.email">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>{{ p.email }}</span>
        </div>
        <div class="info-row" *ngIf="p.phone">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>{{ p.phone }}</span>
        </div>
        <div class="appt-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{{ p.appointmentCount }} appointment{{ p.appointmentCount!==1?'s':'' }}</span>
        </div>
      </div>

      <div class="card-footer">
        <span class="btn-view">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          View Profile
        </span>
        <a class="btn-msg" [routerLink]="['/doctor/chat', p.id]"
           (click)="$event.stopPropagation()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Message
        </a>
      </div>
    </a>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;max-width:1100px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .ph{margin-bottom:16px;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#6B7280;margin-top:3px;}
    /* Search */
    .search-bar{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #E8ECF0;border-radius:14px;padding:11px 16px;margin-bottom:18px;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .search-bar:focus-within{border-color:#2D4A8A;}
    .search-bar input{flex:1;border:none;outline:none;font-size:14px;font-family:inherit;color:#111;}
    .cl-btn{background:none;border:none;cursor:pointer;color:#9CA3AF;display:flex;padding:0;}
    /* Skeleton */
    @keyframes pk{0%,100%{opacity:1;}50%{opacity:.45;}}
    .sk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;}
    .sk-card{background:#fff;border-radius:16px;padding:16px;display:flex;align-items:center;gap:12px;border:1px solid #F0F2F5;}
    .sk-av{width:52px;height:52px;border-radius:50%;background:#F0F2F5;flex-shrink:0;animation:pk 1.4s infinite;}
    .sk-lines{flex:1;display:flex;flex-direction:column;gap:8px;}
    .sk-l{height:12px;border-radius:6px;background:#F0F2F5;animation:pk 1.4s infinite;}
    .sk-l.w60{width:60%;}.sk-l.w40{width:40%;}.mt4{margin-top:0;}
    /* Empty */
    .empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:60px 24px;background:#fff;border-radius:16px;text-align:center;}
    .e-ico{width:72px;height:72px;background:#F4F6FA;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty p{font-size:15px;font-weight:600;color:#374151;}
    .empty span{font-size:13px;color:#9CA3AF;}
    /* Grid */
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;}
    @media(max-width:640px){.grid{grid-template-columns:1fr;}}
    /* Card */
    .card{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06);border:1px solid #F0F2F5;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:box-shadow .15s,transform .1s;}
    .card:hover{box-shadow:0 4px 20px rgba(0,0,0,.1);transform:translateY(-2px);}
    .card-top{display:flex;align-items:center;gap:14px;padding:16px 16px 12px;}
    .av-wrap{flex-shrink:0;}
    .av-img{width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid #F0F2F5;}
    .av-ini{width:52px;height:52px;border-radius:50%;color:#fff;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;}
    .card-info{flex:1;min-width:0;}
    .p-name{font-size:15px;font-weight:700;color:#111;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .p-meta{display:flex;flex-wrap:wrap;gap:4px;}
    .chip{font-size:11px;background:#F4F6FA;color:#6B7280;padding:2px 8px;border-radius:20px;border:1px solid #E8ECF0;}
    .chip.blood{background:#FEF2F2;color:#D84040;border-color:#fecaca;}
    .card-body{padding:0 16px 12px;display:flex;flex-direction:column;gap:6px;flex:1;}
    .info-row{display:flex;align-items:center;gap:7px;font-size:13px;color:#6B7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .info-row span{overflow:hidden;text-overflow:ellipsis;}
    .appt-row{display:flex;align-items:center;gap:7px;font-size:12px;color:#9CA3AF;}
    .card-footer{display:flex;gap:8px;padding:10px 16px;background:#FAFBFC;border-top:1px solid #F0F2F5;margin-top:auto;}
    .btn-view{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px;border-radius:10px;border:1.5px solid #E8ECF0;font-size:13px;font-weight:600;color:#374151;background:#fff;cursor:pointer;}
    .btn-view:hover{background:#F4F6FA;}
    .btn-msg{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px;border-radius:10px;background:#ECFDF5;color:#0F6E56;font-size:13px;font-weight:600;text-decoration:none;border:1.5px solid #A7F3D0;}
    .btn-msg:hover{background:#D1FAE5;}
  `]
})
export class PatientListComponent implements OnInit {
  private http = inject(HttpClient);

  loading  = signal(true);
  all      = signal<Patient[]>([]);
  filtered = signal<Patient[]>([]);
  q        = '';

  ngOnInit(): void {
    // GET /api/Appointment/doctor — extract unique patients
    this.http.get<any>(`${environment.apiUrl}/Appointment/doctor`, {
      params: { pageNumber: '1', pageSize: '500' }
    }).subscribe({
      next: (res: any) => {
        const appts: any[] = Array.isArray(res) ? res
          : res?.data?.items ?? res?.data ?? [];

        // Deduplicate by patientId — take richest record per patient
        const map = new Map<string, Patient>();
        for (const a of appts) {
          const pid = String(a.patientId ?? a.patient?.id ?? '');
          if (!pid) continue;

          const fn  = a.patientFirstName ?? a.patient?.firstName ?? (a.patientName??'').split(' ')[0] ?? '';
          const ln  = a.patientLastName  ?? a.patient?.lastName  ?? (a.patientName??'').split(' ').slice(1).join(' ') ?? '';
          const full= `${fn} ${ln}`.trim() || a.patientName || 'Patient';

          const existing = map.get(pid);
          const apptCount = (existing?.appointmentCount ?? 0) + 1;

          // Take the richest version (most data filled)
          const candidate: Patient = {
            id:                pid,
            firstName:         fn  || existing?.firstName  || '',
            lastName:          ln  || existing?.lastName   || '',
            fullName:          full !== 'Patient' ? full : (existing?.fullName ?? full),
            email:             a.patientEmail   ?? a.patient?.email   ?? existing?.email   ?? '',
            phone:             a.patientPhone   ?? a.patient?.phone   ?? a.patient?.phoneNumber ?? existing?.phone ?? '',
            gender:            a.patientGender  ?? a.patient?.gender  ?? existing?.gender  ?? '',
            dateOfBirth:       a.patientDateOfBirth ?? a.patient?.dateOfBirth ?? existing?.dateOfBirth ?? '',
            bloodType:         a.patientBloodType   ?? a.patient?.bloodType   ?? existing?.bloodType   ?? '',
            profilePictureUrl: a.patientAvatar      ?? a.patient?.profilePictureUrl ?? a.patient?.avatarUrl ?? existing?.profilePictureUrl ?? '',
            appointmentCount:  apptCount,
            lastAppointment:   a.appointmentTime ?? a.scheduledAt ?? existing?.lastAppointment ?? '',
          };
          map.set(pid, candidate);
        }

        const patients = Array.from(map.values())
          .sort((a, b) => a.fullName.localeCompare(b.fullName));

        console.log('[PatientList]', patients.length, 'unique patients. Sample:', patients[0]);
        this.all.set(patients);
        this.filtered.set(patients);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  doSearch(): void {
    const q = this.q.toLowerCase().trim();
    if (!q) { this.filtered.set(this.all()); return; }
    this.filtered.set(this.all().filter(p =>
      p.fullName.toLowerCase().includes(q)  ||
      p.email.toLowerCase().includes(q)     ||
      p.phone.toLowerCase().includes(q)     ||
      p.bloodType.toLowerCase().includes(q)
    ));
  }

  ini(p: Patient): string {
    const f = p.firstName?.[0] ?? p.fullName?.[0] ?? 'P';
    const l = p.lastName?.[0]  ?? p.fullName?.[1]  ?? '';
    return (f + l).toUpperCase();
  }

  age(dob: string): number {
    return Math.floor((Date.now() - new Date(dob).getTime()) / 31_557_600_000);
  }

  private COLORS = ['#2D4A8A','#0F6E56','#D84040','#7C3AED','#0891B2','#d4a017','#be185d'];
  clr(name: string): string {
    return this.COLORS[(name?.charCodeAt(0) ?? 0) % this.COLORS.length];
  }
}
