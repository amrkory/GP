import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, Router } from '@angular/router';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../../../environments/environment';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
<div class="page">
  <div class="top-bar">
    <button class="back-btn" (click)="router.navigate(['/doctor/patients'])">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="top-info">
      <div class="top-av">{{ ini() }}</div>
      <div>
        <div class="top-name">{{ name() }}</div>
        <div class="top-sub">Patient Profile</div>
      </div>
    </div>
    <a [routerLink]="['/doctor/chat', pid]" class="top-msg">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </a>
  </div>

  <div class="tabs">
    <a class="tab" [routerLink]="['overview']"      routerLinkActive="active">Overview</a>
    <a class="tab" [routerLink]="['vitals']"        routerLinkActive="active">Vitals</a>
    <a class="tab" [routerLink]="['prescriptions']" routerLinkActive="active">Prescriptions</a>
    <a class="tab" [routerLink]="['checklist']"     routerLinkActive="active">Checklist</a>
  </div>

  <div class="tab-body">
    <router-outlet></router-outlet>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{max-width:900px;font-family:'Cairo','Segoe UI',sans-serif;}
    .top-bar{display:flex;align-items:center;gap:12px;padding:14px 20px;background:#fff;border-bottom:1px solid #F0F2F5;position:sticky;top:0;z-index:10;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    @media(max-width:768px){.top-bar{padding:12px 14px;}}
    .back-btn{background:none;border:none;cursor:pointer;color:#6B7280;padding:6px;border-radius:8px;display:flex;flex-shrink:0;}
    .back-btn:hover{background:#F4F6FA;}
    .top-info{display:flex;align-items:center;gap:10px;flex:1;min-width:0;}
    .top-av{width:38px;height:38px;border-radius:50%;background:#2D4A8A;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .top-name{font-size:15px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .top-sub{font-size:12px;color:#6B7280;}
    .top-msg{width:36px;height:36px;border-radius:10px;background:#F4F6FA;border:1.5px solid #E8ECF0;display:flex;align-items:center;justify-content:center;text-decoration:none;color:#374151;flex-shrink:0;}
    .top-msg:hover{background:#EEF2FF;color:#2D4A8A;}
    .tabs{display:flex;background:#fff;border-bottom:1px solid #F0F2F5;overflow-x:auto;scrollbar-width:none;padding:0 20px;}
    @media(max-width:768px){.tabs{padding:0 14px;}}
    .tab{padding:13px 16px;font-size:13px;font-weight:600;color:#6B7280;text-decoration:none;border-bottom:2.5px solid transparent;white-space:nowrap;transition:all .15s;}
    .tab:hover{color:#2D4A8A;}
    .tab.active{color:#2D4A8A;border-bottom-color:#2D4A8A;}
    .tab-body{padding:16px 20px;}
    @media(max-width:768px){.tab-body{padding:14px;}}
  `]
})
export class PatientDetailComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);

  name = signal('Patient');
  pid  = '';

  ini(): string {
    const p = this.name().split(' ');
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'P';
  }

  ngOnInit(): void {
    this.pid = this.route.snapshot.paramMap.get('patientId') ?? '';

    // Get patient name from doctor's appointments list
    this.http.get<any>(`${environment.apiUrl}/Appointment/doctor`, {
      params: { pageNumber: '1', pageSize: '200' }
    }).subscribe({
      next: (res: any) => {
        const list: any[] = Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? [];
        const a = list.find(x => String(x.patientId ?? x.patient?.id) === this.pid);
        if (a) {
          const fn = a.patientFirstName ?? a.patient?.firstName ?? (a.patientName ?? '').split(' ')[0] ?? '';
          const ln = a.patientLastName  ?? a.patient?.lastName  ?? (a.patientName ?? '').split(' ').slice(1).join(' ') ?? '';
          const full = `${fn} ${ln}`.trim();
          if (full) this.name.set(full);
        }
      },
      error: () => {}
    });
  }
}
