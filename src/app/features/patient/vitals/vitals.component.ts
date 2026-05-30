import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { HttpClient }   from '@angular/common/http';
import { environment }  from '../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))               return r;
  if (Array.isArray(r?.data?.items))  return r.data.items;
  if (Array.isArray(r?.data))         return r.data;
  if (Array.isArray(r?.items))        return r.items;
  return [];
}

@Component({
  selector: 'app-vitals',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">
  <div class="page-hdr">
    <div>
      <h1>Health Vitals</h1>
      <p class="sub">Track your health readings</p>
    </div>
    <a routerLink="/patient/vitals/add" class="btn-add">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Add Reading
    </a>
  </div>

  <!-- Loading -->
  <div class="loading" *ngIf="loading()">
    <div class="spinner"></div>
  </div>

  <!-- Empty -->
  <div class="empty" *ngIf="!loading() && history().length === 0">
    <div class="empty-ico">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    </div>
    <h3>No vitals recorded yet</h3>
    <p>Start tracking your health readings.</p>
    <a routerLink="/patient/vitals/add" class="btn-add-empty">Add First Reading</a>
  </div>

  <ng-container *ngIf="!loading() && history().length > 0">

    <!-- Latest reading header -->
    <div class="latest-bar">
      <div class="latest-lbl">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Latest reading: {{ (latest().recordedAt ?? latest().createdAt) | date:'MMM d, y · h:mm a' }}
      </div>
    </div>

    <!-- Latest vitals cards -->
    <div class="vitals-grid">

      <div class="vcard" *ngIf="latest().bloodPressure">
        <div class="vc-hdr">
          <div class="vc-ico" style="background:#FEF2F2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span class="vc-name">Blood Pressure</span>
          <span class="vc-badge" [class]="bpSt(latest().bloodPressure).cls">{{ bpSt(latest().bloodPressure).lbl }}</span>
        </div>
        <div class="vc-val">{{ latest().bloodPressure }}</div>
        <div class="vc-unit">mmHg</div>
        <div class="vc-bar"><div class="vc-fill" style="background:#D84040" [style.width]="bpPct(latest().bloodPressure)+'%'"></div></div>
        <div class="vc-range">Normal: 90/60 – 120/80</div>
      </div>

      <div class="vcard" *ngIf="latest().heartRate">
        <div class="vc-hdr">
          <div class="vc-ico" style="background:#EFF6FF">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span class="vc-name">Heart Rate</span>
          <span class="vc-badge" [class]="hrSt(latest().heartRate).cls">{{ hrSt(latest().heartRate).lbl }}</span>
        </div>
        <div class="vc-val">{{ latest().heartRate }}</div>
        <div class="vc-unit">bpm</div>
        <div class="vc-bar"><div class="vc-fill" style="background:#185FA5" [style.width]="(latest().heartRate/200*100)+'%'"></div></div>
        <div class="vc-range">Normal: 60 – 100 bpm</div>
      </div>

      <div class="vcard" *ngIf="latest().bloodSugarLevel">
        <div class="vc-hdr">
          <div class="vc-ico" style="background:#FFFBEB">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <span class="vc-name">Blood Sugar</span>
          <span class="vc-badge" [class]="bsSt(latest().bloodSugarLevel).cls">{{ bsSt(latest().bloodSugarLevel).lbl }}</span>
        </div>
        <div class="vc-val">{{ latest().bloodSugarLevel }}</div>
        <div class="vc-unit">mg/dL</div>
        <div class="vc-bar"><div class="vc-fill" style="background:#d4a017" [style.width]="(latest().bloodSugarLevel/300*100)+'%'"></div></div>
        <div class="vc-range">Normal fasting: 70 – 100 mg/dL</div>
      </div>

      <div class="vcard" *ngIf="latest().oxygenLevel">
        <div class="vc-hdr">
          <div class="vc-ico" style="background:#ECFDF5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
              <path d="M12 2a10 10 0 0 1 10 10c0 4.19-2.57 7.8-6.25 9.33"/>
              <path d="M12 2a10 10 0 0 0-10 10c0 4.19 2.57 7.8 6.25 9.33"/>
            </svg>
          </div>
          <span class="vc-name">Oxygen Level</span>
          <span class="vc-badge" [class]="o2St(latest().oxygenLevel).cls">{{ o2St(latest().oxygenLevel).lbl }}</span>
        </div>
        <div class="vc-val">{{ latest().oxygenLevel }}</div>
        <div class="vc-unit">%</div>
        <div class="vc-bar"><div class="vc-fill" style="background:#0F6E56" [style.width]="latest().oxygenLevel+'%'"></div></div>
        <div class="vc-range">Normal: 95 – 100%</div>
      </div>

      <div class="vcard" *ngIf="latest().temperature">
        <div class="vc-hdr">
          <div class="vc-ico" style="background:#FEF2F2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
            </svg>
          </div>
          <span class="vc-name">Temperature</span>
          <span class="vc-badge" [class]="tempSt(latest().temperature).cls">{{ tempSt(latest().temperature).lbl }}</span>
        </div>
        <div class="vc-val">{{ latest().temperature }}</div>
        <div class="vc-unit">°C</div>
        <div class="vc-bar"><div class="vc-fill" style="background:#D84040" [style.width]="((latest().temperature-34)/8*100)+'%'"></div></div>
        <div class="vc-range">Normal: 36 – 37.4°C</div>
      </div>

      <div class="vcard" *ngIf="latest().weight">
        <div class="vc-hdr">
          <div class="vc-ico" style="background:#F3E8FF">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2">
              <circle cx="12" cy="5" r="3"/>
              <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 17.5A2 2 0 0 0 4 20h16a2 2 0 0 0 1.9-2.5l-2.495-8.04A2 2 0 0 0 17.5 8Z"/>
            </svg>
          </div>
          <span class="vc-name">Weight</span>
          <span class="vc-badge vt-ok">Recorded</span>
        </div>
        <div class="vc-val">{{ latest().weight }}</div>
        <div class="vc-unit">kg</div>
        <div class="vc-bar"><div class="vc-fill" style="background:#7C3AED;width:55%"></div></div>
        <div class="vc-range">Log regularly to track changes</div>
      </div>

    </div>

    <!-- Health Tips -->
    <div class="tips-card">
      <div class="tips-hdr">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Health Tips
      </div>
      <div class="tip-row" *ngFor="let t of tips()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {{ t }}
      </div>
    </div>

    <!-- History -->
    <div class="hist-section" *ngIf="history().length > 1">
      <div class="hist-hdr">
        <h2>Reading History</h2>
        <span class="hist-count">{{ history().length }} readings</span>
      </div>
      <div class="hist-list">
        <div class="hist-row" *ngFor="let h of history().slice(1)">
          <div class="hist-date">
            <span class="hd-day">{{ (h.recordedAt ?? h.createdAt) | date:'d' }}</span>
            <span class="hd-mon">{{ (h.recordedAt ?? h.createdAt) | date:'MMM' }}</span>
          </div>
          <div class="hist-chips">
            <span class="chip" *ngIf="h.bloodPressure">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {{ h.bloodPressure }} mmHg
            </span>
            <span class="chip" *ngIf="h.heartRate">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              {{ h.heartRate }} bpm
            </span>
            <span class="chip" *ngIf="h.bloodSugarLevel">{{ h.bloodSugarLevel }} mg/dL</span>
            <span class="chip" *ngIf="h.oxygenLevel">{{ h.oxygenLevel }}% O₂</span>
            <span class="chip" *ngIf="h.temperature">{{ h.temperature }}°C</span>
            <span class="chip" *ngIf="h.weight">{{ h.weight }} kg</span>
          </div>
          <span class="hist-time">{{ (h.recordedAt ?? h.createdAt) | date:'h:mm a' }}</span>
        </div>
      </div>
    </div>

  </ng-container>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;max-width:900px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .page-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:12px;}
    h1{font-size:22px;font-weight:800;color:#111;}.sub{font-size:13px;color:#6B7280;margin-top:3px;}
    .btn-add{display:flex;align-items:center;gap:6px;padding:10px 16px;background:#D84040;color:#fff;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;font-family:inherit;white-space:nowrap;}
    .loading{display:flex;justify-content:center;padding:48px;}
    .spinner{width:26px;height:26px;border:3px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .empty{display:flex;flex-direction:column;align-items:center;gap:12px;padding:56px 24px;background:#fff;border-radius:20px;text-align:center;}
    .empty-ico{width:80px;height:80px;background:#FEF2F2;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty h3{font-size:18px;font-weight:800;color:#111;}
    .empty p{font-size:14px;color:#888;}
    .btn-add-empty{display:inline-flex;align-items:center;gap:7px;padding:12px 22px;background:#D84040;color:#fff;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;}
    .latest-bar{display:flex;align-items:center;margin-bottom:14px;}
    .latest-lbl{display:flex;align-items:center;gap:6px;font-size:12px;color:#6B7280;background:#F8F9FC;padding:7px 12px;border-radius:10px;border:1px solid #F0F2F5;}
    .vitals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-bottom:18px;}
    @media(max-width:600px){.vitals-grid{grid-template-columns:1fr 1fr;gap:10px;}}
    .vcard{background:#fff;border-radius:18px;padding:18px;box-shadow:0 1px 6px rgba(0,0,0,.07);border:1px solid #F0F2F5;}
    .vc-hdr{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
    .vc-ico{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .vc-name{flex:1;font-size:12px;font-weight:700;color:#555;}
    .vc-badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;}
    .vt-ok{background:#ECFDF5;color:#0F6E56;}
    .vt-warn{background:#FFFBEB;color:#d4a017;}
    .vt-bad{background:#FEF2F2;color:#D84040;}
    .vc-val{font-size:34px;font-weight:900;color:#111;line-height:1;margin-bottom:3px;}
    .vc-unit{font-size:12px;color:#9CA3AF;margin-bottom:10px;}
    .vc-bar{height:5px;background:#F0F2F5;border-radius:3px;overflow:hidden;margin-bottom:6px;}
    .vc-fill{height:100%;border-radius:3px;transition:width .4s;}
    .vc-range{font-size:11px;color:#9CA3AF;}
    .tips-card{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 1px 6px rgba(0,0,0,.06);margin-bottom:18px;border:1px solid #F0F2F5;}
    .tips-hdr{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:700;color:#185FA5;margin-bottom:12px;}
    .tip-row{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#555;padding:7px 0;border-bottom:1px solid #F8F9FC;line-height:1.5;}
    .tip-row:last-child{border-bottom:none;}
    .hist-section{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .hist-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
    h2{font-size:15px;font-weight:700;color:#111;}
    .hist-count{font-size:12px;color:#9CA3AF;background:#F4F6FA;padding:3px 10px;border-radius:10px;}
    .hist-list{display:flex;flex-direction:column;gap:6px;}
    .hist-row{display:flex;align-items:center;gap:12px;padding:10px 12px;background:#F8F9FC;border-radius:12px;border:1px solid #F0F2F5;}
    .hist-date{text-align:center;min-width:28px;flex-shrink:0;}
    .hd-day{display:block;font-size:16px;font-weight:800;color:#2D4A8A;line-height:1;}
    .hd-mon{display:block;font-size:10px;color:#9CA3AF;text-transform:uppercase;}
    .hist-chips{display:flex;flex-wrap:wrap;gap:5px;flex:1;}
    .chip{display:inline-flex;align-items:center;gap:4px;font-size:11px;background:#fff;border:1px solid #E8ECF0;border-radius:8px;padding:3px 9px;color:#374151;}
    .hist-time{font-size:11px;color:#9CA3AF;white-space:nowrap;flex-shrink:0;}
  `]
})
export class VitalsComponent implements OnInit {
  private http = inject(HttpClient);
  loading  = signal(true);
  history  = signal<any[]>([]);

  latest(): any { return this.history()[0] ?? {}; }

  ngOnInit(): void {
    // Use correct endpoint: GET /api/Vital/my
    this.http.get<any>(`${environment.apiUrl}/Vital/my`, {
      params: { pageNumber: '1', pageSize: '50' }
    }).subscribe({
      next: (res: any) => {
        const items = toArr(res);
        // Sort newest first
        this.history.set(
          [...items].sort((a: any, b: any) =>
            new Date(b.recordedAt ?? b.createdAt ?? 0).getTime() -
            new Date(a.recordedAt ?? a.createdAt ?? 0).getTime()
          )
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  /* Status helpers — bloodPressure is a string "120/80" */
  bpPct(bp: string): number {
    const sys = parseInt((bp ?? '').split('/')[0]) || 0;
    return Math.min(sys / 200 * 100, 100);
  }
  bpSt(bp: string): {cls:string;lbl:string} {
    const sys = parseInt((bp ?? '').split('/')[0]) || 0;
    if (sys < 90)   return {cls:'vt-warn', lbl:'Low'};
    if (sys <= 120) return {cls:'vt-ok',   lbl:'Normal'};
    if (sys <= 140) return {cls:'vt-warn', lbl:'Elevated'};
    return              {cls:'vt-bad',  lbl:'High'};
  }
  hrSt(hr: number): {cls:string;lbl:string} {
    if (hr < 60)  return {cls:'vt-warn', lbl:'Low'};
    if (hr <= 100) return {cls:'vt-ok',  lbl:'Normal'};
    return             {cls:'vt-bad',  lbl:'High'};
  }
  bsSt(bs: number): {cls:string;lbl:string} {
    if (bs < 70)   return {cls:'vt-bad',  lbl:'Low'};
    if (bs <= 100) return {cls:'vt-ok',   lbl:'Normal'};
    if (bs <= 125) return {cls:'vt-warn', lbl:'Pre-diabetic'};
    return              {cls:'vt-bad',  lbl:'High'};
  }
  o2St(o: number): {cls:string;lbl:string} {
    if (o >= 95) return {cls:'vt-ok',   lbl:'Normal'};
    if (o >= 90) return {cls:'vt-warn', lbl:'Low'};
    return            {cls:'vt-bad',  lbl:'Critical'};
  }
  tempSt(t: number): {cls:string;lbl:string} {
    if (t < 36)    return {cls:'vt-warn', lbl:'Low'};
    if (t <= 37.4) return {cls:'vt-ok',   lbl:'Normal'};
    if (t <= 38.4) return {cls:'vt-warn', lbl:'Mild fever'};
    return             {cls:'vt-bad',  lbl:'Fever'};
  }

  tips(): string[] {
    const v = this.latest();
    const t: string[] = [];
    const sys = parseInt((v.bloodPressure ?? '').split('/')[0]) || 0;
    if (sys > 140)        t.push('Blood pressure is high. Reduce salt intake and consult your doctor.');
    else if (sys > 0)     t.push('Blood pressure is in a healthy range. Keep up the good work!');
    const hr = v.heartRate ?? 0;
    if (hr > 100)         t.push('Heart rate is elevated. Rest and stay hydrated.');
    else if (hr > 0)      t.push('Heart rate is normal. Regular cardio keeps it healthy.');
    const bs = v.bloodSugarLevel ?? 0;
    if (bs > 125)         t.push('Blood sugar is high. Limit sugary foods and consult your doctor.');
    else if (bs > 0)      t.push('Blood sugar is in the normal range. Maintain a balanced diet.');
    const o2 = v.oxygenLevel ?? 0;
    if (o2 > 0 && o2 < 95) t.push('Oxygen level is below normal. Consult a doctor if this persists.');
    if (!t.length)        t.push('All readings look good. Keep up your healthy habits!');
    return t;
  }
}
