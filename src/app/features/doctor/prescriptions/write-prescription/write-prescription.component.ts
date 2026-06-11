import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

interface MedLine {
  name: string; dosage: string; frequency: string;
  duration: string; instructions: string;
  startDate: string; endDate: string;
}

@Component({
  selector: 'app-write-prescription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1>Write Prescription</h1>
        <span></span>
      </div>

      <div class="info-banner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Each medication below is saved separately to the patient's medication list.
      </div>

      <!-- Medicines list -->
      <div class="meds-hdr">
        <h3>💊 Medications</h3>
        <button class="btn-add-med" (click)="addMed()">+ Add Medication</button>
      </div>

      <div class="med-card" *ngFor="let m of meds; let i = index">
        <div class="med-card-hdr">
          <span class="med-num">Medication {{ i + 1 }}</span>
          <button class="remove-btn" (click)="meds.splice(i,1)" *ngIf="meds.length > 1">✕</button>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Name *</label>
            <input [(ngModel)]="m.name" class="inp" placeholder="e.g. Metformin" />
          </div>
          <div class="field">
            <label>Dosage *</label>
            <input [(ngModel)]="m.dosage" class="inp" placeholder="e.g. 500mg" />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Frequency (times/day) *</label>
            <select [(ngModel)]="m.frequency" class="inp">
              <option value="">Select</option>
              <option value="1">1 × daily</option>
              <option value="2">2 × daily</option>
              <option value="3">3 × daily</option>
              <option value="4">4 × daily</option>
              <option value="6">Every 4 hours (6×)</option>
              <option value="8">Every 3 hours (8×)</option>
            </select>
          </div>
          <div class="field">
            <label>Duration</label>
            <input [(ngModel)]="m.duration" class="inp" placeholder="e.g. 30 days" />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Start Date</label>
            <input type="date" [(ngModel)]="m.startDate" class="inp" />
          </div>
          <div class="field">
            <label>End Date</label>
            <input type="date" [(ngModel)]="m.endDate" class="inp" [min]="m.startDate" />
          </div>
        </div>

        <div class="field">
          <label>Instructions</label>
          <input [(ngModel)]="m.instructions" class="inp" placeholder="e.g. Take after meals" />
        </div>

        <!-- Per-med save status -->
        <div class="med-saved"   *ngIf="savedIds.has(i)">✓ Saved</div>
        <div class="med-error"   *ngIf="errIds.has(i)">✗ {{ errIds.get(i) }}</div>
        <div class="med-saving"  *ngIf="savingIds.has(i)">
          <span class="mspin-sm"></span> Saving...
        </div>
      </div>

      <div class="alert-success" *ngIf="allSaved()">
        ✓ All medications saved! Redirecting...
      </div>
      <div class="alert-error" *ngIf="globalErr()">{{ globalErr() }}</div>

      <button class="btn-primary" (click)="save()" [disabled]="saving() || allSaved()">
        <span class="mspin" *ngIf="saving()"></span>
        {{ saving() ? 'Saving...' : allSaved() ? '✓ Saved!' : 'Save Prescription' }}
      </button>
    </div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;max-width:720px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:14px;}}
    .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
    .top-bar h1{font-size:20px;font-weight:800;color:#111;}
    .back-btn{background:none;border:none;cursor:pointer;color:#555;padding:4px;display:flex;}
    .info-banner{display:flex;align-items:center;gap:8px;background:#E6F1FB;color:#185FA5;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:600;margin-bottom:16px;}
    .meds-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
    .meds-hdr h3{font-size:16px;font-weight:700;color:#111;}
    .btn-add-med{background:#E6F1FB;color:#185FA5;border:none;border-radius:8px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
    .med-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 1px 8px rgba(0,0,0,.07);border-left:3px solid #2D4A8A;position:relative;}
    .med-card-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
    .med-num{font-size:13px;font-weight:700;color:#2D4A8A;}
    .remove-btn{background:none;border:none;cursor:pointer;color:#D84040;font-size:16px;}
    .field{margin-bottom:10px;}
    .field label{display:block;font-size:11px;font-weight:700;color:#555;margin-bottom:4px;text-transform:uppercase;letter-spacing:.3px;}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .inp{width:100%;padding:9px 12px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;font-family:inherit;outline:none;}
    .inp:focus{border-color:#2D4A8A;}
    .med-saved{font-size:12px;font-weight:700;color:#0F6E56;background:#E1F5EE;padding:4px 10px;border-radius:8px;display:inline-block;margin-top:4px;}
    .med-error{font-size:12px;color:#D84040;background:#FEF2F2;padding:4px 10px;border-radius:8px;display:inline-block;margin-top:4px;word-break:break-all;}
    .med-saving{font-size:12px;color:#888;display:flex;align-items:center;gap:6px;margin-top:4px;}
    .mspin-sm{width:12px;height:12px;border:2px solid #e0e0e0;border-top-color:#2D4A8A;border-radius:50%;animation:spin .6s linear infinite;display:inline-block;}
    .alert-success{background:#E1F5EE;color:#0F6E56;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:14px;font-weight:700;}
    .alert-error{background:#FEF2F2;color:#D84040;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:13px;word-break:break-all;}
    .btn-primary{width:100%;padding:14px;background:#2D4A8A;color:#fff;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;}
    .btn-primary:disabled{opacity:.55;cursor:not-allowed;}
    .mspin{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
  `]
})
export class WritePrescriptionComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private nav   = inject(Router);

  saving    = signal(false);
  globalErr = signal('');

  patientId = '';
  meds: MedLine[] = [this.emptyMed()];

  // Per-medication save state
  savedIds  = new Set<number>();
  savingIds = new Set<number>();
  errIds    = new Map<number, string>();

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('patientId') ?? '';
  }

  addMed(): void { this.meds.push(this.emptyMed()); }
  goBack(): void { window.history.back(); }
  allSaved(): boolean { return this.savedIds.size === this.meds.length && this.meds.length > 0; }

  save(): void {
    // Validate
    const invalid = this.meds.find((m, i) => !this.savedIds.has(i) && (!m.name.trim() || !m.dosage.trim() || !m.frequency));
    if (invalid) { this.globalErr.set('Fill Name, Dosage and Frequency for all medications.'); return; }
    if (!this.patientId) { this.globalErr.set('Patient ID missing.'); return; }

    this.saving.set(true);
    this.globalErr.set('');

    // Save each medication separately via POST /api/Medication/add
    const promises = this.meds.map((m, i) => {
      if (this.savedIds.has(i)) return Promise.resolve();  // skip already saved
      this.savingIds.add(i);

      const body: any = {
        patientId:    this.patientId,
        name:         m.name.trim(),
        dosage:       m.dosage.trim(),
        frequency:    Number(m.frequency) || 1,  // API expects int
        duration:     m.duration.trim() || '',
        instructions: m.instructions.trim() || '',
      };
      // startDate is required by API
      body.startDate = m.startDate ? new Date(m.startDate + 'T00:00:00').toISOString() : new Date().toISOString();
      if (m.endDate)   body.endDate   = new Date(m.endDate   + 'T00:00:00').toISOString();

      console.log(`[Prescription] POST /api/Medication/add med[${i}]`, body);

      return new Promise<void>((resolve) => {
        this.http.post<any>(`${environment.apiUrl}/Medication/add`, body).subscribe({
          next: () => {
            this.savingIds.delete(i);
            this.savedIds.add(i);
            this.errIds.delete(i);
            resolve();
          },
          error: (e: HttpErrorResponse) => {
            this.savingIds.delete(i);
            const errs = e?.error?.errors;
            const msg = errs
              ? Object.entries(errs).map(([f,m]) => `${f}: ${(m as string[]).join(', ')}`).join(' | ')
              : e?.error?.message ?? e?.error?.title ?? `HTTP ${e.status}`;
            this.errIds.set(i, msg);
            resolve();  // don't reject — let others continue
          }
        });
      });
    });

    Promise.all(promises).then(() => {
      this.saving.set(false);
      if (this.errIds.size > 0) {
        this.globalErr.set(`${this.errIds.size} medication(s) failed to save. See errors above.`);
      }
      if (this.allSaved()) {
        setTimeout(() => this.nav.navigate(['/doctor/patients', this.patientId, 'prescriptions']), 1500);
      }
    });
  }

  private emptyMed(): MedLine {
    const today = new Date().toISOString().split('T')[0];
    const end   = new Date(); end.setDate(end.getDate() + 30);
    return { name:'', dosage:'', frequency:'', duration:'30 days', instructions:'', startDate: today, endDate: end.toISOString().split('T')[0] };
  }
}
