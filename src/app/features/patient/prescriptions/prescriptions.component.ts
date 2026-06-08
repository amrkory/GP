import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { HttpClient }   from '@angular/common/http';
import { environment }  from '../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))              return r;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.data))        return r.data;
  if (Array.isArray(r?.items))       return r.items;
  return [];
}

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">
  <div class="pg-hdr">
    <div>
      <h1>Prescriptions</h1>
      <p class="sub" *ngIf="!loading()">{{ meds().length }} medication(s)</p>
    </div>
    <div class="filter-row">
      <button class="ftab" [class.active]="showActive" (click)="showActive=true; load()">Active</button>
      <button class="ftab" [class.active]="!showActive" (click)="showActive=false; load()">All</button>
    </div>
  </div>

  <!-- Loading -->
  <div class="loading" *ngIf="loading()">
    <div class="skel-list">
      <div class="skel-card" *ngFor="let i of [1,2,3]">
        <div class="skel-top">
          <div class="skel-ico"></div>
          <div class="skel-lines">
            <div class="skel-line w65"></div>
            <div class="skel-line w40 mt5"></div>
          </div>
          <div class="skel-badge"></div>
        </div>
        <div class="skel-body">
          <div class="skel-line w80"></div>
          <div class="skel-line w55 mt5"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty -->
  <div class="empty" *ngIf="!loading() && meds().length === 0">
    <div class="empty-ico">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d0d5dd" stroke-width="1.5">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    </div>
    <h3>No {{ showActive ? 'active ' : '' }}prescriptions</h3>
    <p>Your doctor will prescribe medications here</p>
  </div>

  <!-- Medication cards — each medication from API is one prescription item -->
  <div class="med-list" *ngIf="!loading()">
    <div class="med-card" *ngFor="let m of meds()" [class.inactive]="!isActive(m)">

      <div class="med-hdr">
        <div class="med-hdr-ico" [style.background]="isActive(m) ? '#ECFDF5' : '#F4F6FA'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               [attr.stroke]="isActive(m) ? '#0F6E56' : '#9CA3AF'" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </div>
        <div class="med-hdr-info">
          <div class="med-name">{{ m.name ?? m.medicationName }}</div>
          <div class="med-dosage-freq">
            <span *ngIf="m.dosage">{{ m.dosage }}</span>
            <span class="dot" *ngIf="m.dosage && m.frequency"> · </span>
            <span *ngIf="m.frequency">{{ m.frequency }}</span>
          </div>
        </div>
        <span class="med-badge" [class.active]="isActive(m)" [class.inactive]="!isActive(m)">
          {{ isActive(m) ? 'Active' : 'Inactive' }}
        </span>
      </div>

      <div class="med-body">
        <div class="med-row" *ngIf="m.duration">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span class="med-row-lbl">Duration</span>
          <span class="med-row-val">{{ m.duration }}</span>
        </div>
        <div class="med-row" *ngIf="m.startDate || m.endDate">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span class="med-row-lbl">Period</span>
          <span class="med-row-val">
            <span *ngIf="m.startDate">{{ m.startDate | date:'MMM d, y' }}</span>
            <span *ngIf="m.startDate && m.endDate"> → </span>
            <span *ngIf="m.endDate" [class.expired-date]="isExpired(m.endDate)">
              {{ m.endDate | date:'MMM d, y' }}
            </span>
          </span>
        </div>
        <div class="med-row" *ngIf="m.doctorName">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="med-row-lbl">Doctor</span>
          <span class="med-row-val">Dr. {{ m.doctorName }}</span>
        </div>
      </div>

      <div class="med-instr" *ngIf="m.instructions">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ m.instructions }}
      </div>

    </div>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .pg-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;gap:12px;flex-wrap:wrap;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#6B7280;margin-top:3px;}
    .filter-row{display:flex;gap:6px;}
    .ftab{padding:7px 16px;border-radius:20px;border:1.5px solid #E8ECF0;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit;transition:all .15s;}
    .ftab.active{background:#2D4A8A;color:#fff;border-color:#2D4A8A;}

    /* Skeletons */
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
    .loading{padding:4px 0;}
    .skel-list{display:flex;flex-direction:column;gap:12px;}
    .skel-card{background:#fff;border-radius:16px;padding:18px;border:1px solid #F0F2F5;}
    .skel-top{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
    .skel-ico{width:44px;height:44px;border-radius:12px;background:#F0F2F5;flex-shrink:0;animation:pulse 1.4s ease-in-out infinite;}
    .skel-lines{flex:1;display:flex;flex-direction:column;gap:7px;}
    .skel-line{height:11px;border-radius:6px;background:#F0F2F5;animation:pulse 1.4s ease-in-out infinite;}
    .skel-line.w80{width:80%;}.skel-line.w65{width:65%;}.skel-line.w55{width:55%;}.skel-line.w40{width:40%;}
    .mt5{margin-top:2px;}
    .skel-badge{width:60px;height:22px;border-radius:12px;background:#F0F2F5;flex-shrink:0;animation:pulse 1.4s ease-in-out infinite;}
    .skel-body{display:flex;flex-direction:column;gap:7px;}

    /* Empty */
    .empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:52px 24px;background:#fff;border-radius:18px;text-align:center;border:1px solid #F0F2F5;}
    .empty-ico{width:76px;height:76px;background:#F4F6FA;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty h3{font-size:17px;font-weight:700;color:#111;}
    .empty p{font-size:13px;color:#9CA3AF;}

    /* Cards */
    .med-list{display:flex;flex-direction:column;gap:12px;}
    .med-card{background:#fff;border-radius:18px;padding:18px;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid #F0F2F5;border-left:4px solid #0F6E56;}
    .med-card.inactive{border-left-color:#E8ECF0;opacity:.72;}

    .med-hdr{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
    .med-hdr-ico{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .med-hdr-info{flex:1;min-width:0;}
    .med-name{font-size:16px;font-weight:700;color:#111;}
    .med-dosage-freq{font-size:13px;color:#6B7280;margin-top:3px;}
    .dot{color:#D0D5DD;}
    .med-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;flex-shrink:0;}
    .med-badge.active{background:#ECFDF5;color:#0F6E56;}
    .med-badge.inactive{background:#F4F6FA;color:#9CA3AF;}

    .med-body{display:flex;flex-direction:column;gap:7px;margin-bottom:10px;}
    .med-row{display:flex;align-items:flex-start;gap:8px;font-size:13px;}
    .med-row-lbl{color:#9CA3AF;min-width:60px;font-weight:500;}
    .med-row-val{color:#374151;font-weight:500;flex:1;}
    .expired-date{color:#D84040;font-weight:600;}

    .med-instr{display:flex;align-items:flex-start;gap:7px;font-size:13px;color:#6B7280;background:#F8F9FC;border-radius:10px;padding:10px 12px;border:1px solid #F0F2F5;font-style:italic;}
  `]
})
export class PrescriptionsComponent implements OnInit {
  private http = inject(HttpClient);
  loading    = signal(true);
  meds       = signal<any[]>([]);
  showActive = true;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    // Real API: GET /api/Medication/my
    // (There is no /api/Prescription endpoint in this backend)
    const params: any = { pageNumber: '1', pageSize: '100' };
    if (this.showActive) params.isActive = 'true';

    this.http.get<any>(`${environment.apiUrl}/Medication/my`, { params })
      .subscribe({
        next: (res: any) => {
          const all = toArr(res);
          // Client-side filter: also remove expired by endDate when showing active
          const now = Date.now();
          this.meds.set(
            this.showActive
              ? all.filter((m: any) => {
                  if (m.isActive === false) return false;
                  if (m.endDate && new Date(m.endDate).getTime() < now) return false;
                  return true;
                })
              : all
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  isActive(m: any): boolean {
    if (m.isActive === false) return false;
    if (m.endDate && new Date(m.endDate).getTime() < Date.now()) return false;
    return true;
  }

  isExpired(dateStr: string): boolean {
    return !!dateStr && new Date(dateStr).getTime() < Date.now();
  }
}
