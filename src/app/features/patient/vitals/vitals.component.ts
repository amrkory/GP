import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { RouterLink }                          from '@angular/router';
import { PatientService }                      from '../../../core/services/patient.service';
import { VitalReading }                        from '../../../core/models/api.models';

@Component({
  selector: 'app-vitals',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Health Vitals</h1>
        <a routerLink="/patient/vitals/add" class="btn-add">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </a>
      </div>

      <!-- Filter -->
      <div class="filter-tabs">
        <button *ngFor="let t of vitalTypes" class="tab"
                [class.active]="activeType() === t.key"
                (click)="activeType.set(t.key)">
          {{ t.icon }} {{ t.label }}
        </button>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner-lg"></div></div>

      <ng-container *ngIf="!loading()">
        <!-- Latest value card -->
        <div class="latest-card" *ngIf="filteredVitals().length > 0">
          <div class="latest-icon">{{ activeTypeMeta().icon }}</div>
          <div class="latest-info">
            <div class="latest-val">{{ filteredVitals()[0].value }}<span class="unit"> {{ filteredVitals()[0].unit }}</span></div>
            <div class="latest-label">Latest {{ activeTypeMeta().label }}</div>
            <div class="latest-date">{{ filteredVitals()[0].recordedAt | date:'MMM d, y · h:mm a' }}</div>
          </div>
          <div class="latest-trend" [class]="trend()">{{ trendIcon() }}</div>
        </div>

        <!-- Mini bar chart -->
        <div class="chart-card" *ngIf="filteredVitals().length > 1">
          <p class="chart-title">Last {{ filteredVitals().length }} readings</p>
          <div class="bars">
            <div class="bar-wrap" *ngFor="let v of filteredVitals().slice(0,7).reverse()">
              <div class="bar" [style.height.%]="barHeight(v)"></div>
              <div class="bar-date">{{ v.recordedAt | date:'d/M' }}</div>
            </div>
          </div>
        </div>

        <!-- History list -->
        <div class="history-list" *ngIf="filteredVitals().length > 0">
          <h3>History</h3>
          <div class="vital-row" *ngFor="let v of filteredVitals()">
            <div class="vital-left">
              <div class="vital-dot"></div>
              <div>
                <div class="vital-val">{{ v.value }} <span class="vital-unit">{{ v.unit }}</span></div>
                <div class="vital-date">{{ v.recordedAt | date:'EEE, MMM d · h:mm a' }}</div>
              </div>
            </div>
            <div class="vital-note" *ngIf="v.note">{{ v.note }}</div>
          </div>
        </div>

        <div class="empty" *ngIf="filteredVitals().length === 0">
          <div class="empty-icon">{{ activeTypeMeta().icon }}</div>
          <p>No {{ activeTypeMeta().label }} readings yet</p>
          <a routerLink="/patient/vitals/add" class="btn-empty">Add first reading</a>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding:16px; max-width:640px; margin:0 auto; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; }
    .btn-add { display:flex; align-items:center; gap:4px; background:#D84040; color:#fff; border-radius:10px; padding:8px 14px; font-size:14px; font-weight:600; text-decoration:none; }
    .filter-tabs { display:flex; gap:6px; margin-bottom:16px; overflow-x:auto; padding-bottom:4px; }
    .tab { padding:7px 12px; border-radius:20px; border:1.5px solid #e8e8e8; background:#fff; font-size:12px; cursor:pointer; white-space:nowrap; color:#666; transition:all .15s; }
    .tab.active { background:#D84040; color:#fff; border-color:#D84040; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner-lg { width:32px; height:32px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .latest-card { background:#fff; border-radius:16px; padding:20px; display:flex; align-items:center; gap:16px; margin-bottom:12px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .latest-icon { font-size:36px; }
    .latest-info { flex:1; }
    .latest-val  { font-size:28px; font-weight:700; color:#111; }
    .unit        { font-size:14px; font-weight:400; color:#888; }
    .latest-label { font-size:13px; color:#888; margin:2px 0; }
    .latest-date  { font-size:12px; color:#aaa; }
    .latest-trend { font-size:22px; }
    .latest-trend.up   { color:#22c55e; }
    .latest-trend.down { color:#D84040; }
    .latest-trend.same { color:#888; }

    .chart-card  { background:#fff; border-radius:14px; padding:16px; margin-bottom:12px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .chart-title { font-size:13px; color:#888; margin-bottom:12px; }
    .bars        { display:flex; align-items:flex-end; gap:8px; height:80px; }
    .bar-wrap    { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end; }
    .bar         { width:100%; background:#D84040; border-radius:4px 4px 0 0; min-height:4px; transition:height .3s; }
    .bar-date    { font-size:10px; color:#aaa; }

    .history-list { background:#fff; border-radius:14px; padding:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .history-list h3 { font-size:15px; font-weight:700; color:#111; margin-bottom:12px; }
    .vital-row   { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f5f5f5; }
    .vital-row:last-child { border-bottom:none; }
    .vital-left  { display:flex; align-items:center; gap:12px; }
    .vital-dot   { width:10px; height:10px; border-radius:50%; background:#D84040; flex-shrink:0; }
    .vital-val   { font-size:15px; font-weight:600; color:#111; }
    .vital-unit  { font-size:12px; font-weight:400; color:#888; }
    .vital-date  { font-size:12px; color:#888; margin-top:2px; }
    .vital-note  { font-size:12px; color:#888; background:#f8f8f8; padding:4px 8px; border-radius:6px; max-width:40%; text-align:right; }

    .empty      { text-align:center; padding:40px 20px; background:#fff; border-radius:14px; }
    .empty-icon { font-size:48px; margin-bottom:12px; }
    .empty p    { color:#888; font-size:15px; margin-bottom:16px; }
    .btn-empty  { background:#D84040; color:#fff; padding:10px 20px; border-radius:10px; text-decoration:none; font-weight:600; font-size:14px; }
  `],
})
export class VitalsComponent implements OnInit {
  private svc = inject(PatientService);

  loading    = signal(true);
  activeType = signal('BloodPressure');
  allVitals  = signal<VitalReading[]>([]);

  vitalTypes = [
    { key:'BloodPressure',    label:'BP',       icon:'🩸' },
    { key:'HeartRate',        label:'Heart',    icon:'❤️' },
    { key:'BloodGlucose',     label:'Glucose',  icon:'💉' },
    { key:'Temperature',      label:'Temp',     icon:'🌡️' },
    { key:'OxygenSaturation', label:'O₂',       icon:'🫁' },
    { key:'Weight',           label:'Weight',   icon:'⚖️' },
  ];

  activeTypeMeta() { return this.vitalTypes.find(t => t.key === this.activeType()) ?? this.vitalTypes[0]; }

  filteredVitals(): VitalReading[] {
    return this.allVitals().filter(v => v.type === this.activeType());
  }

  barHeight(v: VitalReading): number {
    const vals = this.filteredVitals().map(x => parseFloat(x.value.split('/')[0])).filter(n => !isNaN(n));
    if (!vals.length) return 10;
    const min = Math.min(...vals), max = Math.max(...vals);
    const val = parseFloat(v.value.split('/')[0]);
    return max === min ? 50 : ((val - min) / (max - min)) * 80 + 20;
  }

  trend(): string {
    const f = this.filteredVitals();
    if (f.length < 2) return 'same';
    const v1 = parseFloat(f[0].value), v2 = parseFloat(f[1].value);
    return v1 > v2 ? 'up' : v1 < v2 ? 'down' : 'same';
  }

  trendIcon(): string {
    const t = this.trend();
    return t === 'up' ? '↑' : t === 'down' ? '↓' : '→';
  }

  ngOnInit(): void {
    this.svc.getVitals().subscribe(res => { this.allVitals.set(res.data); this.loading.set(false); });
  }
}
