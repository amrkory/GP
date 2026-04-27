import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';
import { ApiResponse, Prescription } from '../../../../core/models/api.models';

@Component({
  selector: 'app-edit-prescription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="nav.back()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Edit Prescription</h1>
        <span></span>
      </div>
      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
      <ng-container *ngIf="!loading()">
        <div class="form-card">
          <div class="field"><label>Diagnosis *</label><input [(ngModel)]="diagnosis" class="text-input" /></div>
          <div class="field"><label>Notes</label><textarea [(ngModel)]="notes" class="notes-input" rows="2"></textarea></div>
        </div>
        <div class="meds-header">
          <h3>Medicines</h3>
        </div>
        <div class="med-card" *ngFor="let m of meds; let i = index">
          <div class="row-2">
            <div class="field"><label>Name</label><input [(ngModel)]="m.name" class="text-input" /></div>
            <div class="field"><label>Dosage</label><input [(ngModel)]="m.dosage" class="text-input" /></div>
          </div>
          <div class="row-2">
            <div class="field"><label>Frequency</label><input [(ngModel)]="m.frequency" class="text-input" /></div>
            <div class="field"><label>Duration</label><input [(ngModel)]="m.duration" class="text-input" /></div>
          </div>
        </div>
        <div class="alert-success" *ngIf="saved()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Updated successfully!
        </div>
        <button class="btn-primary" (click)="save()" [disabled]="saving() || saved()">
          <span class="mini-spinner" *ngIf="saving()"></span>
          {{ saving() ? 'Saving...' : 'Save Changes' }}
        </button>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding:16px; max-width:640px; margin:0 auto; }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .top-bar h1 { font-size:18px; font-weight:700; color:#111; }
    .back-btn { background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; }
    .loading  { display:flex; justify-content:center; padding:40px; }
    .spinner  { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .form-card { background:#fff; border-radius:14px; padding:18px; margin-bottom:14px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .field { margin-bottom:12px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:5px; }
    .text-input  { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .notes-input { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; resize:none; box-sizing:border-box; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .meds-header { margin-bottom:10px; }
    .meds-header h3 { font-size:16px; font-weight:700; color:#111; }
    .med-card { background:#fff; border-radius:12px; padding:14px; margin-bottom:10px; box-shadow:0 1px 8px rgba(0,0,0,0.05); border-left:3px solid #2D4A8A; }
    .alert-success { display:flex; align-items:center; gap:8px; background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:14px; font-weight:600; }
    .btn-primary { width:100%; padding:14px; background:#2D4A8A; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; }
    .btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
  `],
})
export class EditPrescriptionComponent implements OnInit {
  private http  = inject(HttpClient);
  readonly nav  = { back: () => window.history.back() };
  private route = inject(ActivatedRoute);
  loading = signal(true);
  saving  = signal(false);
  saved   = signal(false);
  diagnosis = ''; notes = '';
  meds: any[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.get<ApiResponse<Prescription>>(`${environment.apiUrl}/prescriptions/${id}`)
      .subscribe(res => {
        this.diagnosis = res.data.diagnosis;
        this.notes     = res.data.notes ?? '';
        this.meds      = res.data.medicines.map(m => ({ ...m }));
        this.loading.set(false);
      });
  }

  save(): void {
    this.saving.set(true);
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.put<ApiResponse<Prescription>>(`${environment.apiUrl}/prescriptions/${id}`, {
      diagnosis: this.diagnosis, notes: this.notes, medicines: this.meds,
    }).subscribe({
      next: () => { this.saving.set(false); this.saved.set(true); },
      error: () => this.saving.set(false),
    });
  }
}
