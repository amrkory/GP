import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))              return r;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.data))        return r.data;
  if (Array.isArray(r?.items))       return r.items;
  return [];
}

@Component({
  selector: 'app-patient-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="ov">
  <div class="loading" *ngIf="loading()"><div class="sp"></div></div>

  <ng-container *ngIf="!loading()">

    <!-- Profile card -->
    <div class="profile-card">
      <div class="pav-wrap">
        <img *ngIf="p.profilePictureUrl" [src]="p.profilePictureUrl"
             class="pav-img" alt="" (error)="p.profilePictureUrl=''" />
        <div *ngIf="!p.profilePictureUrl" class="pav-ini" [style.background]="clr(p.firstName)">
          {{ ini() }}
        </div>
      </div>
      <div class="pav-info">
        <div class="pav-name">{{ p.firstName }} {{ p.lastName }}</div>
        <div class="pav-chips">
          <span class="chip" *ngIf="p.gender">{{ p.gender | titlecase }}</span>
          <span class="chip" *ngIf="p.dateOfBirth">{{ age() }} yrs</span>
          <span class="chip blood" *ngIf="p.bloodType">{{ p.bloodType }}</span>
        </div>
        <div class="pav-email" *ngIf="p.email">{{ p.email }}</div>
      </div>
    </div>

    <!-- Personal Information -->
    <div class="info-card">
      <div class="card-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        Personal Information
      </div>
      <div class="ir"><span>Full Name</span><strong>{{ p.firstName || '—' }} {{ p.lastName }}</strong></div>
      <div class="ir"><span>Email</span><strong>{{ p.email || '—' }}</strong></div>
      <div class="ir"><span>Phone</span><strong>{{ p.phone || p.phoneNumber || '—' }}</strong></div>
      <div class="ir"><span>Date of Birth</span>
        <strong>{{ p.dateOfBirth ? (p.dateOfBirth | date:'MMMM d, y') : '—' }}</strong>
      </div>
      <div class="ir"><span>Age</span><strong>{{ p.dateOfBirth ? age() + ' years' : '—' }}</strong></div>
      <div class="ir"><span>Gender</span><strong>{{ p.gender || '—' }}</strong></div>
      <div class="ir" *ngIf="p.address"><span>Address</span><strong>{{ p.address }}</strong></div>
    </div>

    <!-- Medical Information -->
    <div class="info-card">
      <div class="card-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        Medical Information
      </div>
      <div class="ir"><span>Blood Type</span>
        <strong>
          <span class="blood-badge" *ngIf="p.bloodType">{{ p.bloodType }}</span>
          <span *ngIf="!p.bloodType">—</span>
        </strong>
      </div>
      <div class="ir"><span>Weight</span><strong>{{ p.weight ? p.weight + ' kg' : '—' }}</strong></div>
      <div class="ir"><span>Height</span><strong>{{ p.height ? p.height + ' cm' : '—' }}</strong></div>
      <div class="ir">
        <span>BMI</span>
        <strong *ngIf="p.weight && p.height">
          {{ bmi() }}
          <span class="bmi-label" [class]="bmiClass()">{{ bmiLabel() }}</span>
        </strong>
        <strong *ngIf="!p.weight || !p.height">—</strong>
      </div>
      <div class="ir">
        <span>Allergies</span>
        <strong>
          <span *ngIf="!p.allergies?.length">—</span>
          <span class="allergy-chip" *ngFor="let a of (p.allergies || [])">{{ a }}</span>
        </strong>
      </div>
      <div class="ir">
        <span>Chronic Diseases</span>
        <strong>
          <span *ngIf="!p.chronicDiseases?.length">—</span>
          <span class="disease-chip" *ngFor="let d of (p.chronicDiseases || [])">{{ d }}</span>
        </strong>
      </div>
    </div>

    <!-- Health Baseline (from profile) -->
    <div class="info-card"
         *ngIf="p.systolicPressure || p.heartRate || p.sugar">
      <div class="card-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        Health Baseline
      </div>
      <div class="vitals-mini">
        <div class="vm-item" *ngIf="p.systolicPressure">
          <div class="vm-val">{{ p.systolicPressure }}/{{ p.diastolicPressure }}</div>
          <div class="vm-lbl">Blood Pressure <small>mmHg</small></div>
        </div>
        <div class="vm-item" *ngIf="p.heartRate">
          <div class="vm-val">{{ p.heartRate }}</div>
          <div class="vm-lbl">Heart Rate <small>bpm</small></div>
        </div>
        <div class="vm-item" *ngIf="p.sugar">
          <div class="vm-val">{{ p.sugar }}</div>
          <div class="vm-lbl">Blood Sugar <small>mg/dL</small></div>
        </div>
      </div>
    </div>

    <!-- Latest Vitals from Vital API -->
    <div class="info-card" *ngIf="vitals().length > 0">
      <div class="card-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        Latest Vitals
        <span class="vt-date">{{ (vitals()[0].recordedAt ?? vitals()[0].createdAt) | date:'MMM d, y' }}</span>
      </div>
      <div class="vitals-mini">
        <div class="vm-item" *ngIf="vitals()[0].bloodPressure">
          <div class="vm-val">{{ vitals()[0].bloodPressure }}</div>
          <div class="vm-lbl">Blood Pressure</div>
        </div>
        <div class="vm-item" *ngIf="vitals()[0].heartRate">
          <div class="vm-val">{{ vitals()[0].heartRate }}</div>
          <div class="vm-lbl">Heart Rate <small>bpm</small></div>
        </div>
        <div class="vm-item" *ngIf="vitals()[0].bloodSugarLevel">
          <div class="vm-val">{{ vitals()[0].bloodSugarLevel }}</div>
          <div class="vm-lbl">Blood Sugar <small>mg/dL</small></div>
        </div>
        <div class="vm-item" *ngIf="vitals()[0].oxygenLevel">
          <div class="vm-val">{{ vitals()[0].oxygenLevel }}</div>
          <div class="vm-lbl">Oxygen <small>%</small></div>
        </div>
        <div class="vm-item" *ngIf="vitals()[0].temperature">
          <div class="vm-val">{{ vitals()[0].temperature }}</div>
          <div class="vm-lbl">Temperature <small>°C</small></div>
        </div>
        <div class="vm-item" *ngIf="vitals()[0].weight">
          <div class="vm-val">{{ vitals()[0].weight }}</div>
          <div class="vm-lbl">Weight <small>kg</small></div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="qa-grid">
      <a [routerLink]="['../prescriptions']" class="qa blue">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
        Medications
      </a>
      <a [routerLink]="['/doctor/chat', pid]" class="qa green">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Message
      </a>
      <a [routerLink]="['/doctor/checklist/assign', pid]" class="qa yellow">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        Assign Task
      </a>
    </div>

  </ng-container>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .ov{font-family:'Cairo','Segoe UI',sans-serif;}
    .loading{display:flex;justify-content:center;padding:40px;}
    .sp{width:24px;height:24px;border:3px solid #f0f0f0;border-top-color:#2D4A8A;border-radius:50%;animation:sp .7s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    /* Profile card */
    .profile-card{display:flex;align-items:center;gap:14px;background:#fff;border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:0 1px 8px rgba(0,0,0,.05);border:1px solid #F0F2F5;}
    .pav-wrap{flex-shrink:0;}
    .pav-img{width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #F0F2F5;}
    .pav-ini{width:64px;height:64px;border-radius:50%;color:#fff;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;}
    .pav-name{font-size:18px;font-weight:700;color:#111;margin-bottom:5px;}
    .pav-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:5px;}
    .chip{font-size:11px;background:#F4F6FA;color:#6B7280;padding:2px 8px;border-radius:20px;border:1px solid #E8ECF0;}
    .chip.blood{background:#FEF2F2;color:#D84040;border-color:#fecaca;}
    .pav-email{font-size:13px;color:#6B7280;}
    /* Info cards */
    .info-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 1px 8px rgba(0,0,0,.05);}
    .card-title{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;}
    .vt-date{margin-left:auto;font-size:11px;color:#9CA3AF;text-transform:none;font-weight:500;letter-spacing:0;}
    .ir{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-bottom:1px solid #F8F9FC;font-size:13px;gap:12px;}
    .ir:last-child{border-bottom:none;}
    .ir span{color:#888;flex-shrink:0;}
    .ir strong{color:#111;text-align:right;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:4px;}
    .blood-badge{background:#FEF2F2;color:#D84040;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:700;}
    .allergy-chip{background:#FEF2F2;color:#D84040;padding:2px 7px;border-radius:6px;font-size:11px;}
    .disease-chip{background:#FFF7ED;color:#c2410c;padding:2px 7px;border-radius:6px;font-size:11px;}
    .bmi-label{margin-left:6px;font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px;}
    .bmi-label.normal{background:#ECFDF5;color:#0F6E56;}
    .bmi-label.underweight{background:#EFF6FF;color:#185FA5;}
    .bmi-label.overweight,.bmi-label.obese{background:#FEF2F2;color:#D84040;}
    /* Mini vitals grid */
    .vitals-mini{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;}
    .vm-item{background:#F8F9FC;border-radius:10px;padding:10px;text-align:center;}
    .vm-val{font-size:18px;font-weight:800;color:#111;line-height:1;}
    .vm-lbl{font-size:11px;color:#6B7280;margin-top:3px;}
    .vm-lbl small{color:#9CA3AF;}
    /* Quick actions */
    .qa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px;}
    @media(max-width:480px){.qa-grid{grid-template-columns:1fr;}}
    .qa{display:flex;align-items:center;justify-content:center;gap:7px;padding:12px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;}
    .qa.blue{background:#E6F1FB;color:#185FA5;}
    .qa.green{background:#E1F5EE;color:#0F6E56;}
    .qa.yellow{background:#FEF9E7;color:#d4a017;}
  `]
})
export class PatientOverviewComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  vitals  = signal<any[]>([]);
  p: any  = {};
  pid     = '';

  ini(): string {
    return ((this.p.firstName?.[0]??'')+(this.p.lastName?.[0]??'')).toUpperCase()||'P';
  }
  age(): number {
    return Math.floor((Date.now()-new Date(this.p.dateOfBirth).getTime())/31_557_600_000);
  }
  bmi(): string {
    const b = this.p.weight / ((this.p.height/100)**2);
    return isNaN(b) ? '—' : b.toFixed(1);
  }
  bmiClass(): string {
    const b = this.p.weight / ((this.p.height/100)**2);
    if (b<18.5) return 'underweight';
    if (b<25)   return 'normal';
    if (b<30)   return 'overweight';
    return 'obese';
  }
  bmiLabel(): string {
    const b = this.p.weight / ((this.p.height/100)**2);
    if (b<18.5) return 'Underweight';
    if (b<25)   return 'Normal';
    if (b<30)   return 'Overweight';
    return 'Obese';
  }
  private COLORS = ['#2D4A8A','#0F6E56','#D84040','#7C3AED','#0891B2'];
  clr(n: string): string { return this.COLORS[(n?.charCodeAt(0)||0)%this.COLORS.length]; }

  ngOnInit(): void {
    this.pid = this.route.parent?.snapshot.paramMap.get('patientId') ?? '';

    // Get patient data from appointments
    this.http.get<any>(`${environment.apiUrl}/Appointment/doctor`, {
      params: { pageNumber:'1', pageSize:'200' }
    }).subscribe({
      next: (res:any) => {
        const appts = toArr(res);
        const a = appts.find(x => String(x.patientId ?? x.patient?.id) === this.pid);
        if (a) {
          this.p = {
            id:           this.pid,
            firstName:    a.patientFirstName ?? a.patient?.firstName ?? (a.patientName??'').split(' ')[0] ?? '',
            lastName:     a.patientLastName  ?? a.patient?.lastName  ?? (a.patientName??'').split(' ').slice(1).join(' ') ?? '',
            email:        a.patientEmail     ?? a.patient?.email     ?? '',
            phone:        a.patientPhone     ?? a.patient?.phone     ?? a.patient?.phoneNumber ?? '',
            gender:       a.patientGender    ?? a.patient?.gender    ?? '',
            dateOfBirth:  a.patientDateOfBirth ?? a.patient?.dateOfBirth ?? null,
            address:      a.patient?.address ?? '',
            profilePictureUrl: a.patientAvatar ?? a.patient?.profilePictureUrl ?? a.patient?.avatarUrl ?? '',
            bloodType:    a.patient?.bloodType ?? a.patientBloodType ?? '',
            weight:       a.patient?.weight ?? null,
            height:       a.patient?.height ?? null,
            allergies:    a.patient?.allergies ?? [],
            chronicDiseases: a.patient?.chronicDiseases ?? [],
            systolicPressure:  a.patient?.systolicPressure  ?? null,
            diastolicPressure: a.patient?.diastolicPressure ?? null,
            heartRate:         a.patient?.heartRate ?? null,
            sugar:             a.patient?.sugar     ?? null,
          };
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // Load latest vitals
    this.http.get<any>(`${environment.apiUrl}/Vital/patient/${this.pid}`, {
      params: { pageNumber:'1', pageSize:'5' }
    }).subscribe({
      next: (res:any) => {
        const items = toArr(res).sort((a:any,b:any) =>
          new Date(b.recordedAt??b.createdAt??0).getTime() -
          new Date(a.recordedAt??a.createdAt??0).getTime()
        );
        this.vitals.set(items);
      },
      error: () => {}
    });
  }
}
