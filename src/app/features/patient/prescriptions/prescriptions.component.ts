import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { PatientService }                      from '../../../core/services/patient.service';
import { Prescription }                        from '../../../core/models/api.models';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header"><h1>Prescriptions</h1></div>

      <div class="loading" *ngIf="loading()"><div class="spinner-lg"></div></div>

      <ng-container *ngIf="!loading()">
        <div class="rx-card" *ngFor="let rx of prescriptions()" [class.expired]="isExpired(rx)">
          <div class="rx-header">
            <div class="rx-icon">💊</div>
            <div class="rx-info">
              <div class="rx-diagnosis">{{ rx.diagnosis }}</div>
              <div class="rx-doctor">{{ rx.doctorName }}</div>
              <div class="rx-date">Issued: {{ rx.issuedAt | date:'MMM d, y' }}</div>
            </div>
            <span class="rx-badge" [class.expired]="isExpired(rx)">
              {{ isExpired(rx) ? 'Expired' : 'Active' }}
            </span>
          </div>

          <!-- Medicines -->
          <div class="medicine-list">
            <div class="med-item" *ngFor="let m of rx.medicines">
              <div class="med-dot"></div>
              <div class="med-info">
                <div class="med-name">{{ m.name }} <span class="med-dosage">{{ m.dosage }}</span></div>
                <div class="med-details">{{ m.frequency }} · {{ m.duration }}</div>
                <div class="med-instructions" *ngIf="m.instructions">{{ m.instructions }}</div>
              </div>
            </div>
          </div>

          <div class="rx-notes" *ngIf="rx.notes">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ rx.notes }}
          </div>

          <div class="rx-valid" *ngIf="rx.validUntil">
            Valid until {{ rx.validUntil | date:'MMMM d, y' }}
          </div>
        </div>

        <div class="empty" *ngIf="prescriptions().length === 0">
          <div class="empty-icon">💊</div>
          <p>No prescriptions yet</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding:16px; max-width:640px; margin:0 auto; }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; margin-bottom:16px; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner-lg { width:32px; height:32px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .rx-card     { background:#fff; border-radius:16px; margin-bottom:14px; box-shadow:0 1px 8px rgba(0,0,0,0.06); overflow:hidden; border-left:4px solid #D84040; }
    .rx-card.expired { border-left-color:#aaa; opacity:0.7; }

    .rx-header   { display:flex; align-items:flex-start; gap:12px; padding:16px 16px 12px; }
    .rx-icon     { font-size:28px; flex-shrink:0; }
    .rx-info     { flex:1; }
    .rx-diagnosis { font-size:16px; font-weight:700; color:#111; margin-bottom:2px; }
    .rx-doctor   { font-size:13px; color:#888; }
    .rx-date     { font-size:12px; color:#aaa; margin-top:2px; }
    .rx-badge    { font-size:11px; padding:3px 9px; border-radius:8px; background:#E1F5EE; color:#0F6E56; font-weight:600; white-space:nowrap; flex-shrink:0; }
    .rx-badge.expired { background:#f0f0f0; color:#888; }

    .medicine-list { padding:0 16px 4px; }
    .med-item    { display:flex; gap:10px; padding:10px 0; border-top:1px solid #f5f5f5; }
    .med-dot     { width:8px; height:8px; border-radius:50%; background:#D84040; flex-shrink:0; margin-top:5px; }
    .med-info    { flex:1; }
    .med-name    { font-size:14px; font-weight:600; color:#111; }
    .med-dosage  { font-size:13px; font-weight:400; color:#D84040; margin-left:4px; }
    .med-details { font-size:12px; color:#888; margin-top:2px; }
    .med-instructions { font-size:12px; color:#aaa; font-style:italic; margin-top:2px; }

    .rx-notes    { display:flex; align-items:flex-start; gap:6px; margin:0 16px 12px; font-size:13px; color:#888; background:#f8f8f8; padding:8px 12px; border-radius:8px; }
    .rx-valid    { font-size:12px; color:#888; padding:0 16px 14px; }

    .empty { text-align:center; padding:40px 20px; background:#fff; border-radius:14px; }
    .empty-icon { font-size:48px; margin-bottom:12px; }
    .empty p    { color:#888; font-size:15px; }
  `],
})
export class PrescriptionsComponent implements OnInit {
  private svc = inject(PatientService);
  loading       = signal(true);
  prescriptions = signal<Prescription[]>([]);

  ngOnInit(): void {
    this.svc.getPrescriptions().subscribe(res => { this.prescriptions.set(res.data); this.loading.set(false); });
  }

  isExpired(rx: Prescription): boolean {
    return !!rx.validUntil && new Date(rx.validUntil) < new Date();
  }
}
