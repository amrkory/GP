import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))              return r;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.data))        return r.data;
  if (Array.isArray(r?.items))       return r.items;
  return [];
}

@Component({
  selector: 'app-patient-prescriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="wrap">
  <div class="loading" *ngIf="loading()"><div class="sp"></div></div>

  <div class="empty" *ngIf="!loading() && meds().length===0">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
    <p>No medications prescribed yet</p>
  </div>

  <div class="med-card" *ngFor="let m of meds()">
    <div class="med-hdr">
      <div class="med-ico">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      </div>
      <div class="med-info">
        <div class="med-name">{{ m.name ?? m.medicationName }}</div>
        <div class="med-sub">{{ m.dosage }} · {{ m.frequency }}</div>
      </div>
      <span class="med-badge" [class.active]="isActive(m)">{{ isActive(m) ? 'Active' : 'Inactive' }}</span>
    </div>
    <div class="med-body">
      <div class="mr" *ngIf="m.duration"><span>Duration</span><strong>{{ m.duration }}</strong></div>
      <div class="mr" *ngIf="m.startDate || m.endDate">
        <span>Period</span>
        <strong>{{ m.startDate | date:'MMM d, y' }} → {{ m.endDate | date:'MMM d, y' }}</strong>
      </div>
      <div class="mr" *ngIf="m.instructions"><span>Instructions</span><strong>{{ m.instructions }}</strong></div>
    </div>
  </div>

  <a [routerLink]="['/doctor/prescriptions/new', patientId]" class="btn-add">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    Add Medication
  </a>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .wrap{font-family:'Cairo','Segoe UI',sans-serif;}
    .loading{display:flex;justify-content:center;padding:40px;}
    .sp{width:24px;height:24px;border:3px solid #f0f0f0;border-top-color:#2D4A8A;border-radius:50%;animation:sp .7s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    .empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:40px;background:#fff;border-radius:12px;text-align:center;color:#9CA3AF;font-size:14px;}
    .med-card{background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 6px rgba(0,0,0,.05);border-left:3px solid #0F6E56;}
    .med-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
    .med-ico{width:36px;height:36px;background:#ECFDF5;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .med-info{flex:1;}
    .med-name{font-size:14px;font-weight:700;color:#111;}
    .med-sub{font-size:12px;color:#6B7280;margin-top:2px;}
    .med-badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;background:#F4F6FA;color:#9CA3AF;}
    .med-badge.active{background:#ECFDF5;color:#0F6E56;}
    .med-body{display:flex;flex-direction:column;gap:5px;}
    .mr{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-top:1px solid #F8F9FC;}
    .mr span{color:#888;}.mr strong{color:#111;}
    .btn-add{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;padding:12px;background:#ECFDF5;color:#0F6E56;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;margin-top:4px;}
    .btn-add:hover{background:#D1FAE5;}
  `]
})
export class PatientPrescriptionsComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);

  loading   = signal(true);
  meds      = signal<any[]>([]);
  patientId = '';

  ngOnInit(): void {
    this.patientId = this.route.parent?.snapshot.paramMap.get('patientId') ?? '';
    // GET /api/Medication/patient/{patientId}
    this.http.get<any>(`${environment.apiUrl}/Medication/patient/${this.patientId}`)
      .subscribe({
        next: (res: any) => { this.meds.set(toArr(res)); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  isActive(m: any): boolean {
    if (m.isActive === false) return false;
    if (m.endDate && new Date(m.endDate).getTime() < Date.now()) return false;
    return true;
  }
}
