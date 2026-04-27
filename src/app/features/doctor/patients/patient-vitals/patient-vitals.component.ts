import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DoctorService }  from '../../../../core/services/doctor.service';
import { VitalReading }   from '../../../../core/models/api.models';

@Component({
  selector: 'app-patient-vitals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
    <div class="vitals-list" *ngIf="!loading()">
      <div class="vital-card" *ngFor="let v of vitals()">
        <div class="vital-icon-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D4A8A" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div class="vital-info">
          <div class="vital-type">{{ v.type }}</div>
          <div class="vital-date">{{ v.recordedAt | date:'MMM d · h:mm a' }}</div>
          <div class="vital-note" *ngIf="v.note">{{ v.note }}</div>
        </div>
        <div class="vital-val">{{ v.value }} <span class="vital-unit">{{ v.unit }}</span></div>
      </div>
      <div class="empty" *ngIf="vitals().length === 0">
        <p>No vitals recorded yet.</p>
      </div>
    </div>
  `,
  styles: [`
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .vitals-list { display:flex; flex-direction:column; gap:8px; }
    .vital-card  { background:#fff; border-radius:12px; padding:12px 14px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .vital-icon-wrap { width:36px; height:36px; border-radius:10px; background:#E6F1FB; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .vital-info  { flex:1; }
    .vital-type  { font-size:13px; font-weight:600; color:#111; }
    .vital-date  { font-size:11px; color:#888; }
    .vital-note  { font-size:11px; color:#aaa; font-style:italic; }
    .vital-val   { font-size:18px; font-weight:700; color:#2D4A8A; }
    .vital-unit  { font-size:11px; font-weight:400; color:#888; }
    .empty { text-align:center; padding:30px; background:#fff; border-radius:12px; color:#888; font-size:14px; }
  `],
})
export class PatientVitalsComponent implements OnInit {
  private svc   = inject(DoctorService);
  private route = inject(ActivatedRoute);
  loading = signal(true);
  vitals  = signal<VitalReading[]>([]);
  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('patientId')!;
    this.svc.getPatientVitals(id).subscribe((res: any) => { this.vitals.set(res.data); this.loading.set(false); });
  }
}
