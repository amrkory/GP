import { Component, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { Router }        from '@angular/router';
import { ProfileService } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-add-vitals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/patient/vitals'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Add Vitals</h1><span></span>
      </div>

      <div class="form-card">
        <div class="field-row">
          <div class="field">
            <label>Systolic BP (mmHg)</label>
            <input [(ngModel)]="form.systolicPressure" type="number" class="inp" placeholder="e.g. 120" />
          </div>
          <div class="field">
            <label>Diastolic BP (mmHg)</label>
            <input [(ngModel)]="form.diastolicPressure" type="number" class="inp" placeholder="e.g. 80" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Heart Rate (bpm)</label>
            <input [(ngModel)]="form.heartRate" type="number" class="inp" placeholder="e.g. 72" />
          </div>
          <div class="field">
            <label>Blood Sugar (mg/dL)</label>
            <input [(ngModel)]="form.sugar" type="number" class="inp" placeholder="e.g. 100" />
          </div>
        </div>

        <div class="toast success" *ngIf="saved()">✅ Vitals saved successfully!</div>
        <div class="toast error"   *ngIf="error()">❌ {{ error() }}</div>

        <button class="btn-save" (click)="save()" [disabled]="saving()">
          <span class="mini-spinner" *ngIf="saving()"></span>
          {{ saving() ? 'Saving…' : 'Save Vitals' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:600px;}@media(max-width:768px){.page{padding:16px;}}
    .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
    .top-bar h1{font-size:18px;font-weight:700;color:#111;}
    .back-btn{background:none;border:none;cursor:pointer;color:#555;padding:6px;border-radius:8px;display:flex;}
    .form-card{background:#fff;border-radius:14px;padding:20px;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .field-row{display:flex;gap:12px;margin-bottom:12px;}@media(max-width:480px){.field-row{flex-direction:column;}}
    .field{flex:1;}
    .field label{display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:6px;}
    .inp{width:100%;padding:11px 12px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;outline:none;box-sizing:border-box;font-family:'Cairo',sans-serif;}
    .inp:focus{border-color:#D84040;}
    .toast{padding:12px 14px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:12px;}
    .toast.success{background:#E1F5EE;color:#0F6E56;}.toast.error{background:#FEF2F2;color:#D84040;}
    .mini-spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:5px;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .btn-save{width:100%;padding:14px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;display:flex;align-items:center;justify-content:center;}
    .btn-save:disabled{opacity:.6;cursor:not-allowed;}
  `],
})
export class AddVitalsComponent {
  private profileSvc = inject(ProfileService);
  readonly router    = inject(Router);

  saving = signal(false);
  saved  = signal(false);
  error  = signal('');
  form   = { systolicPressure: null as any, diastolicPressure: null as any, heartRate: null as any, sugar: null as any };

  save(): void {
    const dto: any = {};
    if (this.form.systolicPressure)  dto.systolicPressure  = Number(this.form.systolicPressure);
    if (this.form.diastolicPressure) dto.diastolicPressure = Number(this.form.diastolicPressure);
    if (this.form.heartRate)         dto.heartRate  = Number(this.form.heartRate);
    if (this.form.sugar)             dto.sugar      = Number(this.form.sugar);

    if (!Object.keys(dto).length) { this.error.set('Please enter at least one vital.'); return; }
    this.saving.set(true); this.error.set('');

    this.profileSvc.updatePatient(dto).subscribe({
      next: () => {
        this.saving.set(false); this.saved.set(true);
        setTimeout(() => this.router.navigate(['/patient/vitals']), 1200);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Failed to save vitals. Please try again.');
      },
    });
  }
}
