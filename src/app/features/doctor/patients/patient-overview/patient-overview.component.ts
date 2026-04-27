import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterLink }    from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DoctorService } from '../../../../core/services/doctor.service';
import { PatientProfile } from '../../../../core/models/api.models';

@Component({
  selector: 'app-patient-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div *ngIf="patient()">
      <div class="info-card">
        <h3>Personal Info</h3>
        <div class="info-row"><span>Email</span><strong>{{ patient()!.email }}</strong></div>
        <div class="info-row"><span>Phone</span><strong>{{ patient()!.phone || '—' }}</strong></div>
        <div class="info-row"><span>Date of Birth</span><strong>{{ (patient()!.dateOfBirth | date:'MMM d, y') || '—' }}</strong></div>
        <div class="info-row"><span>Gender</span><strong>{{ patient()!.gender || '—' }}</strong></div>
        <div class="info-row"><span>National ID</span><strong>{{ patient()!.phone || '—' }}</strong></div>
      </div>
      <div class="info-card">
        <h3>Medical Info</h3>
        <div class="info-row"><span>Blood Type</span><strong>{{ patient()!.bloodType || '—' }}</strong></div>
        <div class="info-row"><span>Weight</span><strong>{{ patient()!.weight ? patient()!.weight + ' kg' : '—' }}</strong></div>
        <div class="info-row"><span>Height</span><strong>{{ patient()!.height ? patient()!.height + ' cm' : '—' }}</strong></div>
        <div class="info-row"><span>Allergies</span><strong>{{ (patient()!.allergies || []).join(', ') || '—' }}</strong></div>
        <div class="info-row"><span>Chronic Diseases</span><strong>{{ (patient()!.chronicDiseases || []).join(', ') || '—' }}</strong></div>
      </div>
      <div class="quick-actions">
        <a [routerLink]="['/doctor/prescriptions/new', patient()!.id]" class="qa-btn blue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
          Write Prescription
        </a>
        <a [routerLink]="['/doctor/checklist/assign', patient()!.id]" class="qa-btn green">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Assign Checklist
        </a>
      </div>
    </div>
  `,
  styles: [`
    .info-card { background:#fff; border-radius:14px; padding:16px; margin-bottom:12px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .info-card h3 { font-size:14px; font-weight:700; color:#111; margin-bottom:12px; }
    .info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f5f5f5; font-size:13px; }
    .info-row:last-child { border-bottom:none; }
    .info-row span { color:#888; }
    .info-row strong { color:#111; text-align:right; max-width:60%; }
    .quick-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
    .qa-btn { display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; border-radius:12px; text-decoration:none; font-size:13px; font-weight:600; }
    .qa-btn.blue  { background:#E6F1FB; color:#185FA5; }
    .qa-btn.green { background:#E1F5EE; color:#0F6E56; }
  `],
})
export class PatientOverviewComponent implements OnInit {
  private svc   = inject(DoctorService);
  private route = inject(ActivatedRoute);
  patient = signal<PatientProfile | null>(null);
  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('patientId')!;
    this.svc.getPatientById(id).subscribe((res: any) => this.patient.set(res.data));
  }
}
