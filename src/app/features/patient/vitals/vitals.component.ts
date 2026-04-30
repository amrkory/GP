import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterLink }      from '@angular/router';
import { ProfileService }  from '../../../core/services/profile.service';

@Component({
  selector: 'app-vitals',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Health Vitals</h1>
          <p class="sub">Track your health readings</p>
        </div>
        <a routerLink="/patient/vitals/add" class="btn-add">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Vitals
        </a>
      </div>

      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Loading vitals...</p>
      </div>

      <ng-container *ngIf="!loading()">

        <!-- No vitals yet -->
        <div class="empty-state" *ngIf="!hasAnyVital()">
          <div class="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <h3>No vitals recorded yet</h3>
          <p>Start tracking your health by adding your first readings.</p>
          <a routerLink="/patient/vitals/add" class="btn-add-empty">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add First Reading
          </a>
        </div>

        <!-- Vitals grid -->
        <div class="vitals-grid" *ngIf="hasAnyVital()">

          <!-- Blood Pressure -->
          <div class="vital-card bp-card" *ngIf="p().systolicPressure">
            <div class="card-top">
              <div class="vicon bp-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div class="vlabel">Blood Pressure</div>
              <div class="vstatus" [class]="bpClass()">{{ bpStatus() }}</div>
            </div>
            <div class="vvalue">{{ p().systolicPressure }}<span class="vsep">/</span>{{ p().diastolicPressure ?? '—' }}</div>
            <div class="vunit">mmHg</div>
            <div class="vbar"><div class="vbar-fill bp-fill" [style.width]="bpPct() + '%'"></div></div>
            <div class="vrange">Normal: 90/60 – 120/80</div>
          </div>

          <!-- Heart Rate -->
          <div class="vital-card hr-card" *ngIf="p().heartRate">
            <div class="card-top">
              <div class="vicon hr-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div class="vlabel">Heart Rate</div>
              <div class="vstatus" [class]="hrClass()">{{ hrStatus() }}</div>
            </div>
            <div class="vvalue">{{ p().heartRate }}</div>
            <div class="vunit">beats / min</div>
            <div class="vbar"><div class="vbar-fill hr-fill" [style.width]="hrPct() + '%'"></div></div>
            <div class="vrange">Normal: 60 – 100 bpm</div>
          </div>

          <!-- Blood Glucose -->
          <div class="vital-card gl-card" *ngIf="p().sugar">
            <div class="card-top">
              <div class="vicon gl-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="4"/></svg>
              </div>
              <div class="vlabel">Blood Glucose</div>
              <div class="vstatus" [class]="glClass()">{{ glStatus() }}</div>
            </div>
            <div class="vvalue">{{ p().sugar }}</div>
            <div class="vunit">mg / dL</div>
            <div class="vbar"><div class="vbar-fill gl-fill" [style.width]="glPct() + '%'"></div></div>
            <div class="vrange">Normal: 70 – 140 mg/dL</div>
          </div>

        </div>

        <!-- Tips -->
        <div class="tips" *ngIf="hasAnyVital()">
          <div class="tips-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Health Tips
          </div>
          <div class="tip" *ngFor="let t of tips()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {{ t }}
          </div>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; }
    .page { padding:24px; max-width:800px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page { padding:16px; } }

    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
    .page-header h1 { font-size:22px; font-weight:800; color:#111; margin:0 0 2px; }
    .sub { font-size:13px; color:#888; margin:0; }
    .btn-add { display:flex; align-items:center; gap:6px; background:#D84040; color:#fff; border:none; border-radius:12px; padding:10px 16px; font-size:13px; font-weight:700; text-decoration:none; white-space:nowrap; }

    .loading { display:flex; flex-direction:column; align-items:center; padding:48px; gap:10px; color:#888; font-size:14px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .empty-state { text-align:center; padding:56px 24px; background:#fff; border-radius:20px; box-shadow:0 2px 12px rgba(0,0,0,.06); }
    .empty-icon { width:80px; height:80px; background:#FEF2F2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .empty-state h3 { font-size:20px; font-weight:800; color:#111; margin-bottom:8px; }
    .empty-state p { font-size:14px; color:#888; margin-bottom:20px; line-height:1.6; }
    .btn-add-empty { display:inline-flex; align-items:center; gap:7px; padding:13px 24px; background:#D84040; color:#fff; border-radius:14px; font-size:15px; font-weight:700; text-decoration:none; }

    .vitals-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; margin-bottom:16px; }

    .vital-card { background:#fff; border-radius:20px; padding:20px; box-shadow:0 2px 12px rgba(0,0,0,.07); }
    .card-top { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
    .vicon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .bp-icon { background:#FEF2F2; }
    .hr-icon { background:#E6F1FB; }
    .gl-icon { background:#E1F5EE; }
    .vlabel { flex:1; font-size:13px; font-weight:700; color:#555; }
    .vstatus { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
    .vstatus.normal    { background:#E1F5EE; color:#0F6E56; }
    .vstatus.high      { background:#FEF2F2; color:#D84040; }
    .vstatus.low       { background:#FEF9E7; color:#d4a017; }

    .vvalue { font-size:36px; font-weight:900; color:#111; line-height:1; margin-bottom:4px; }
    .vsep   { color:#bbb; margin:0 4px; }
    .vunit  { font-size:13px; color:#888; margin-bottom:12px; }

    .vbar   { height:6px; background:#f0f0f0; border-radius:3px; overflow:hidden; margin-bottom:8px; }
    .vbar-fill { height:100%; border-radius:3px; transition:width .4s; }
    .bp-fill { background:linear-gradient(90deg,#D84040,#f87171); }
    .hr-fill { background:linear-gradient(90deg,#185FA5,#60A5FA); }
    .gl-fill { background:linear-gradient(90deg,#0F6E56,#34D399); }

    .vrange { font-size:11px; color:#aaa; }

    .tips { background:#fff; border-radius:16px; padding:16px; box-shadow:0 2px 10px rgba(0,0,0,.06); }
    .tips-header { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:#185FA5; margin-bottom:12px; }
    .tip { display:flex; align-items:flex-start; gap:8px; font-size:13px; color:#555; padding:7px 0; border-bottom:1px solid #f5f5f5; line-height:1.5; }
    .tip:last-child { border-bottom:none; }
    .tip svg { flex-shrink:0; margin-top:2px; color:#0F6E56; }
  `],
})
export class VitalsComponent implements OnInit {
  private profileSvc = inject(ProfileService);
  loading = signal(true);
  profile = signal<any>({});
  p() { return this.profile(); }

  ngOnInit(): void {
    this.profileSvc.getPatientData().subscribe({
      next: (res: any) => { this.profile.set(res?.data ?? res ?? {}); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  hasAnyVital(): boolean {
    const d = this.p();
    return !!(d.systolicPressure || d.heartRate || d.sugar);
  }

  bpStatus(): string { const s = this.p().systolicPressure??0; return s>140?'High':s<90?'Low':'Normal'; }
  bpClass():  string { return this.bpStatus().toLowerCase(); }
  bpPct():    number { return Math.min(((this.p().systolicPressure??0) / 200) * 100, 100); }

  hrStatus(): string { const h = this.p().heartRate??0; return h>100?'High':h<60?'Low':'Normal'; }
  hrClass():  string { return this.hrStatus().toLowerCase(); }
  hrPct():    number { return Math.min(((this.p().heartRate??0) / 180) * 100, 100); }

  glStatus(): string { const g = this.p().sugar??0; return g>140?'High':g<70?'Low':'Normal'; }
  glClass():  string { return this.glStatus().toLowerCase(); }
  glPct():    number { return Math.min(((this.p().sugar??0) / 300) * 100, 100); }

  tips(): string[] {
    const d = this.p(); const tips: string[] = [];
    if ((d.systolicPressure??0) > 140) tips.push('Blood pressure is high. Reduce salt, exercise regularly, and consult your doctor.');
    else if ((d.systolicPressure??0) > 0) tips.push('Blood pressure is in healthy range. Keep up a balanced diet and regular exercise.');
    if ((d.heartRate??0) > 100) tips.push('Heart rate is elevated. Rest and stay hydrated. See a doctor if it persists.');
    else if ((d.heartRate??0) > 0) tips.push('Heart rate is normal. Regular cardio exercise keeps it healthy.');
    if ((d.sugar??0) > 140) tips.push('Blood glucose is high. Limit sugary and high-carb foods and consult your doctor.');
    else if ((d.sugar??0) > 0) tips.push('Blood glucose is in normal range. Maintain a balanced diet.');
    if (!tips.length) tips.push('All readings are within healthy ranges. Keep it up!');
    return tips;
  }
}
