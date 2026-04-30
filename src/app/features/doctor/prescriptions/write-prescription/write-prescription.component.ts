import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService, CreatePrescriptionDto } from '../../../../core/services/doctor.service';

interface MedLine { name: string; dosage: string; frequency: string; duration: string; instructions: string; }

@Component({
  selector: 'app-write-prescription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Write Prescription</h1>
        <span></span>
      </div>
      <div class="form-card">
        <div class="field">
          <label>Diagnosis *</label>
          <input [(ngModel)]="diagnosis" placeholder="e.g. Type 2 Diabetes" class="text-input" />
        </div>
        <div class="field">
          <label>Valid Until</label>
          <input [(ngModel)]="validUntil" type="date" class="text-input" [min]="today()" />
        </div>
        <div class="field">
          <label>Notes</label>
          <textarea [(ngModel)]="notes" class="notes-input" rows="2" placeholder="Additional instructions…"></textarea>
        </div>
      </div>

      <!-- Medicines -->
      <div class="meds-header">
        <h3>Medicines</h3>
        <button class="btn-add-med" (click)="addMed()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </button>
      </div>

      <div class="med-card" *ngFor="let m of meds; let i = index">
        <div class="med-card-header">
          <span class="med-num">Medicine {{ i + 1 }}</span>
          <button class="remove-btn" (click)="removeMed(i)" *ngIf="meds.length > 1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="row-2">
          <div class="field"><label>Name *</label><input [(ngModel)]="m.name" placeholder="Medicine name" class="text-input" /></div>
          <div class="field"><label>Dosage *</label><input [(ngModel)]="m.dosage" placeholder="e.g. 500mg" class="text-input" /></div>
        </div>
        <div class="row-2">
          <div class="field">
            <label>Frequency *</label>
            <select [(ngModel)]="m.frequency" class="select-input">
              <option value="">Select</option>
              <option value="Once daily">Once daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="Three times daily">Three times daily</option>
              <option value="Every 8 hours">Every 8 hours</option>
              <option value="As needed">As needed</option>
            </select>
          </div>
          <div class="field"><label>Duration *</label><input [(ngModel)]="m.duration" placeholder="e.g. 2 weeks" class="text-input" /></div>
        </div>
        <div class="field"><label>Instructions</label><input [(ngModel)]="m.instructions" placeholder="e.g. Take after meals" class="text-input" /></div>
      </div>

      <div class="alert-success" *ngIf="saved()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Prescription saved successfully!
      </div>
      <div class="alert-error" *ngIf="err()">{{ err() }}</div>

      <button class="btn-primary" (click)="save()" [disabled]="saving() || saved()">
        <span class="mini-spinner" *ngIf="saving()"></span>
        {{ saving() ? 'Saving...' : saved() ? 'Saved!' : 'Save Prescription' }}
      </button>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:900px; }
    @media (max-width:768px) { .page { padding:16px; } }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .top-bar h1 { font-size:18px; font-weight:700; color:#111; }
    .back-btn { background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; }
    .form-card { background:#fff; border-radius:14px; padding:18px; margin-bottom:14px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .field { margin-bottom:12px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:5px; }
    .text-input  { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .text-input:focus { border-color:#2D4A8A; }
    .select-input { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; appearance:none; background:#fff; box-sizing:border-box; }
    .notes-input { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; resize:none; box-sizing:border-box; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .meds-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .meds-header h3 { font-size:16px; font-weight:700; color:#111; }
    .btn-add-med { display:flex; align-items:center; gap:4px; background:#E6F1FB; color:#185FA5; border:none; border-radius:8px; padding:7px 12px; font-size:13px; font-weight:600; cursor:pointer; }
    .med-card { background:#fff; border-radius:12px; padding:14px; margin-bottom:10px; box-shadow:0 1px 8px rgba(0,0,0,0.05); border-left:3px solid #2D4A8A; }
    .med-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .med-num { font-size:13px; font-weight:600; color:#2D4A8A; }
    .remove-btn { background:none; border:none; cursor:pointer; color:#D84040; padding:0; display:flex; }
    .alert-success { display:flex; align-items:center; gap:8px; background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:14px; font-weight:600; }
    .alert-error { background:#FEF2F2; color:#D84040; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:13px; }
    .btn-primary { width:100%; padding:14px; background:#2D4A8A; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; }
    .btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class WritePrescriptionComponent implements OnInit {
  private svc   = inject(DoctorService);
  goBack(): void { window.history.back(); }
  private route = inject(ActivatedRoute);
  private nav   = inject(Router);

  saving = signal(false);
  saved  = signal(false);
  err    = signal('');

  diagnosis  = '';
  validUntil = '';
  notes      = '';
  patientId  = '';
  meds: MedLine[] = [{ name:'', dosage:'', frequency:'', duration:'', instructions:'' }];

  ngOnInit(): void { this.patientId = this.route.snapshot.paramMap.get('patientId')!; }

  addMed(): void { this.meds.push({ name:'', dosage:'', frequency:'', duration:'', instructions:'' }); }
  removeMed(i: number): void { this.meds.splice(i, 1); }
  today(): string { return new Date().toISOString().split('T')[0]; }

  save(): void {
    if (!this.diagnosis || this.meds.some(m => !m.name || !m.dosage || !m.frequency || !m.duration)) {
      this.err.set('Please fill in all required fields.'); return;
    }
    this.saving.set(true); this.err.set('');
    const dto: CreatePrescriptionDto = {
      patientId: this.patientId, diagnosis: this.diagnosis,
      medicines: this.meds.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration, instructions: m.instructions || undefined })),
      notes: this.notes || undefined, validUntil: this.validUntil || undefined,
    };
    this.svc.createPrescription(dto).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        if (res?.success === false) console.warn('[WritePrescription]', res.message, 'DTO:', dto);
        this.saved.set(true);
        setTimeout(() => this.nav.navigate(['/doctor/patients', this.patientId, 'prescriptions']), 1500);
      },
      error: () => { this.saving.set(false); this.err.set('Failed to save. Please try again.'); },
    });
  }
}
