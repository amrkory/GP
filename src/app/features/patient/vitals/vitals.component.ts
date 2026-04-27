import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { PatientService } from '../../../core/services/patient.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-vitals',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Health Vitals</h1>
        <a routerLink="/patient/vitals/add" class="btn-add">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </a>
      </div>

      <!-- Filter tabs -->
      <div class="filter-row">
        <button *ngFor="let f of filters" class="filter-btn" [class.active]="activeFilter()===f.key" (click)="activeFilter.set(f.key)">
          {{ f.label }}
        </button>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <!-- Vitals from profile -->
      <ng-container *ngIf="!loading()">
        <!-- Blood Pressure -->
        <div class="vital-card" *ngIf="(activeFilter()==='All' || activeFilter()==='BP') && profile().systolicPressure">
          <div class="vital-icon bp"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
          <div class="vital-info">
            <div class="vital-label">Blood Pressure</div>
            <div class="vital-val">{{ profile().systolicPressure }} / {{ profile().diastolicPressure }} <span class="vital-unit">mmHg</span></div>
          </div>
          <div class="vital-status" [class]="bpStatus()">{{ bpStatus() }}</div>
        </div>

        <!-- Heart Rate -->
        <div class="vital-card" *ngIf="(activeFilter()==='All' || activeFilter()==='Heart') && profile().heartRate">
          <div class="vital-icon hr"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
          <div class="vital-info">
            <div class="vital-label">Heart Rate</div>
            <div class="vital-val">{{ profile().heartRate }} <span class="vital-unit">bpm</span></div>
          </div>
          <div class="vital-status" [class]="hrStatus()">{{ hrStatus() }}</div>
        </div>

        <!-- Blood Sugar -->
        <div class="vital-card" *ngIf="(activeFilter()==='All' || activeFilter()==='Glucose') && profile().sugar">
          <div class="vital-icon gl"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg></div>
          <div class="vital-info">
            <div class="vital-label">Blood Glucose</div>
            <div class="vital-val">{{ profile().sugar }} <span class="vital-unit">mg/dL</span></div>
          </div>
        </div>

        <!-- No vitals -->
        <div class="empty-state" *ngIf="noVitals()">
          <div class="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <h3>No vitals recorded</h3>
          <p>Add your first vital reading to start tracking your health.</p>
          <a routerLink="/patient/vitals/add" class="btn-add-empty">+ Add Vitals</a>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:720px;}@media(max-width:768px){.page{padding:16px;}}
    .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
    .page-header h1{font-size:22px;font-weight:800;color:#111;}
    .btn-add{display:flex;align-items:center;gap:6px;background:#D84040;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:14px;font-weight:600;text-decoration:none;cursor:pointer;}
    .filter-row{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;}
    .filter-btn{padding:7px 14px;border:1.5px solid #e8e8e8;border-radius:20px;background:#fff;font-size:13px;color:#555;cursor:pointer;font-family:'Cairo',sans-serif;}
    .filter-btn.active{background:#D84040;color:#fff;border-color:#D84040;}
    .loading{display:flex;justify-content:center;padding:40px;}
    .spinner{width:28px;height:28px;border:3px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .vital-card{background:#fff;border-radius:14px;padding:16px;display:flex;align-items:center;gap:14px;margin-bottom:12px;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .vital-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .vital-icon.bp{background:#FEF2F2;}.vital-icon.hr{background:#E6F1FB;}.vital-icon.gl{background:#E1F5EE;}
    .vital-info{flex:1;}
    .vital-label{font-size:12px;color:#888;margin-bottom:3px;}
    .vital-val{font-size:22px;font-weight:800;color:#111;}
    .vital-unit{font-size:13px;font-weight:400;color:#888;}
    .vital-status{font-size:12px;padding:4px 10px;border-radius:20px;font-weight:600;}
    .vital-status.Normal{background:#E1F5EE;color:#0F6E56;}
    .vital-status.High{background:#FEF2F2;color:#D84040;}
    .vital-status.Low{background:#FEF9E7;color:#d4a017;}
    .empty-state{text-align:center;padding:48px 24px;background:#fff;border-radius:14px;}
    .empty-icon{width:72px;height:72px;background:#f0f0f0;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
    .empty-state h3{font-size:18px;font-weight:700;color:#111;margin-bottom:6px;}
    .empty-state p{font-size:14px;color:#888;margin-bottom:16px;}
    .btn-add-empty{display:inline-block;padding:11px 20px;background:#D84040;color:#fff;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;}
  `],
})
export class VitalsComponent implements OnInit {
  private profileSvc = inject(ProfileService);

  loading     = signal(true);
  profile     = signal<any>({});
  activeFilter = signal('All');
  filters = [
    { key: 'All', label: 'BP' }, { key: 'Heart', label: 'Heart' },
    { key: 'Glucose', label: 'Glucose' }, { key: 'Temp', label: 'Temp' },
    { key: 'O2', label: 'O₂' }, { key: 'Weight', label: 'Weight' },
  ];

  ngOnInit(): void {
    this.profileSvc.getPatientData().subscribe({
      next: (res: any) => { this.profile.set(res?.data ?? res ?? {}); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  noVitals(): boolean {
    const p = this.profile();
    return !p.systolicPressure && !p.heartRate && !p.sugar;
  }

  bpStatus(): string {
    const s = this.profile().systolicPressure;
    if (!s) return '';
    if (s < 90) return 'Low';
    if (s > 140) return 'High';
    return 'Normal';
  }

  hrStatus(): string {
    const h = this.profile().heartRate;
    if (!h) return '';
    if (h < 60) return 'Low';
    if (h > 100) return 'High';
    return 'Normal';
  }
}
