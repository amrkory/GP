import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DoctorService }  from '../../../../core/services/doctor.service';
import { Prescription }   from '../../../../core/models/api.models';

@Component({
  selector: 'app-patient-prescriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
    <ng-container *ngIf="!loading()">
      <div class="rx-card" *ngFor="let rx of rxList()">
        <div class="rx-header">
          <div class="rx-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </div>
          <div class="rx-info">
            <div class="rx-diagnosis">{{ rx.diagnosis }}</div>
            <div class="rx-date">{{ rx.issuedAt | date:'MMM d, y' }}</div>
          </div>
          <a [routerLink]="['/doctor/prescriptions', rx.id, 'edit']" class="edit-btn">Edit</a>
        </div>
        <div class="med-list">
          <div class="med-row" *ngFor="let m of rx.medicines">
            <div class="med-dot"></div>
            <div>
              <span class="med-name">{{ m.name }}</span>
              <span class="med-dose">{{ m.dosage }}</span>
            </div>
            <div class="med-freq">{{ m.frequency }}</div>
          </div>
        </div>
      </div>
      <a [routerLink]="['/doctor/prescriptions/new', patientId]" class="btn-new-rx">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Write New Prescription
      </a>
      <div class="empty" *ngIf="rxList().length === 0"><p>No prescriptions yet.</p></div>
    </ng-container>
  `,
  styles: [`
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .rx-card   { background:#fff; border-radius:12px; padding:14px; margin-bottom:10px; box-shadow:0 1px 6px rgba(0,0,0,0.05); border-left:3px solid #2D4A8A; }
    .rx-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .rx-icon-wrap { width:36px; height:36px; background:#E6F1FB; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .rx-info   { flex:1; }
    .rx-diagnosis { font-size:14px; font-weight:600; color:#111; }
    .rx-date   { font-size:12px; color:#888; }
    .edit-btn  { font-size:12px; color:#2D4A8A; font-weight:600; text-decoration:none; padding:4px 8px; border:1px solid #2D4A8A; border-radius:6px; }
    .med-list  { padding-left:4px; }
    .med-row   { display:flex; align-items:center; gap:8px; padding:4px 0; font-size:13px; }
    .med-dot   { width:6px; height:6px; border-radius:50%; background:#2D4A8A; flex-shrink:0; }
    .med-name  { font-weight:600; color:#111; }
    .med-dose  { color:#2D4A8A; margin-left:4px; }
    .med-freq  { margin-left:auto; color:#888; font-size:12px; }
    .btn-new-rx { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:12px; background:#E6F1FB; color:#185FA5; border-radius:12px; text-decoration:none; font-size:14px; font-weight:600; margin-top:4px; }
    .empty { text-align:center; padding:30px; background:#fff; border-radius:12px; color:#888; font-size:14px; }
  `],
})
export class PatientPrescriptionsComponent implements OnInit {
  private svc   = inject(DoctorService);
  private route = inject(ActivatedRoute);
  loading  = signal(true);
  rxList   = signal<Prescription[]>([]);
  patientId = '';
  ngOnInit(): void {
    this.patientId = this.route.parent?.snapshot.paramMap.get('patientId')!;
    this.svc.getPatientPrescriptions(this.patientId).subscribe((res: any) => { this.rxList.set(res.data); this.loading.set(false); });
  }
}
