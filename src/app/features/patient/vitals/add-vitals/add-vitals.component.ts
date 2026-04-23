import { Component, signal, inject } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { FormsModule }                from '@angular/forms';
import { Router }                     from '@angular/router';
import { PatientService }             from '../../../../core/services/patient.service';
import { VitalType }                  from '../../../../core/models/api.models';

interface VitalOption {
  type: VitalType; label: string; icon: string;
  placeholder: string; unit: string; hint: string;
}

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
        <h1>Add Vital Reading</h1>
        <span></span>
      </div>

      <!-- Type selector -->
      <div class="type-grid">
        <button *ngFor="let t of options" class="type-card"
                [class.selected]="selectedType === t.type"
                (click)="selectType(t)">
          <span class="type-icon">{{ t.icon }}</span>
          <span class="type-label">{{ t.label }}</span>
        </button>
      </div>

      <!-- Input card -->
      <div class="input-card">
        <div class="input-header">
          <span class="sel-icon">{{ selected().icon }}</span>
          <div>
            <div class="sel-label">{{ selected().label }}</div>
            <div class="sel-hint">{{ selected().hint }}</div>
          </div>
        </div>

        <div class="value-wrap">
          <input [(ngModel)]="value" [placeholder]="selected().placeholder"
                 class="value-input" type="text" />
          <span class="value-unit">{{ selected().unit }}</span>
        </div>

        <div class="field" style="margin-top:12px">
          <label>Note (optional)</label>
          <input [(ngModel)]="note" placeholder="e.g. After breakfast, fasting..."
                 class="note-input" />
        </div>
      </div>

      <div class="alert-success" *ngIf="saved()">✅ Vital recorded successfully!</div>
      <div class="alert-error"   *ngIf="errMsg()">{{ errMsg() }}</div>

      <button class="btn-primary" (click)="save()" [disabled]="!value || saving() || saved()">
        <span class="mini-spinner" *ngIf="saving()"></span>
        {{ saving() ? 'Saving...' : saved() ? 'Saved!' : 'Save Reading' }}
      </button>
    </div>
  `,
  styles: [`
    .page    { padding:16px; max-width:640px; margin:0 auto; }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .top-bar h1 { font-size:18px; font-weight:700; color:#111; }
    .back-btn   { background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; }

    .type-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
    .type-card { display:flex; flex-direction:column; align-items:center; gap:6px; padding:14px 8px; background:#fff; border:1.5px solid #e8e8e8; border-radius:12px; cursor:pointer; transition:all .15s; }
    .type-card.selected { border-color:#D84040; background:#FEF2F2; }
    .type-icon  { font-size:24px; }
    .type-label { font-size:12px; color:#555; font-weight:500; text-align:center; }
    .type-card.selected .type-label { color:#D84040; font-weight:700; }

    .input-card   { background:#fff; border-radius:14px; padding:20px; margin-bottom:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .input-header { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .sel-icon     { font-size:32px; }
    .sel-label    { font-size:16px; font-weight:700; color:#111; }
    .sel-hint     { font-size:12px; color:#888; margin-top:2px; }

    .value-wrap { display:flex; align-items:center; gap:10px; }
    .value-input { flex:1; font-size:28px; font-weight:700; color:#111; border:none; border-bottom:2px solid #e8e8e8; padding:8px 0; outline:none; font-family:'Cairo',sans-serif; }
    .value-input:focus { border-bottom-color:#D84040; }
    .value-unit  { font-size:16px; color:#888; white-space:nowrap; }

    .field       { margin-bottom:0; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:6px; }
    .note-input  { width:100%; padding:10px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .note-input:focus { border-color:#D84040; }

    .alert-success { background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:14px; font-weight:600; }
    .alert-error   { background:#FEF2F2; color:#D84040; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:13px; }
    .btn-primary   { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; }
    .btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class AddVitalsComponent {
  private svc   = inject(PatientService);
  readonly router = inject(Router);

  saving = signal(false);
  saved  = signal(false);
  errMsg = signal('');

  value = '';
  note  = '';
  selectedType: VitalType = 'BloodPressure';

  options: VitalOption[] = [
    { type:'BloodPressure',    label:'Blood Pressure',     icon:'🩸', placeholder:'120/80', unit:'mmHg', hint:'Systolic / Diastolic' },
    { type:'HeartRate',        label:'Heart Rate',         icon:'❤️', placeholder:'72',     unit:'bpm',  hint:'Beats per minute' },
    { type:'BloodGlucose',     label:'Blood Glucose',      icon:'💉', placeholder:'95',     unit:'mg/dL',hint:'Fasting or post-meal' },
    { type:'Temperature',      label:'Temperature',        icon:'🌡️', placeholder:'36.6',   unit:'°C',   hint:'Body temperature' },
    { type:'OxygenSaturation', label:'Oxygen Saturation',  icon:'🫁', placeholder:'98',     unit:'%',    hint:'SpO2 level' },
    { type:'Weight',           label:'Weight',             icon:'⚖️', placeholder:'70',     unit:'kg',   hint:'Body weight' },
  ];

  selected(): VitalOption {
    return this.options.find(o => o.type === this.selectedType) ?? this.options[0];
  }

  selectType(t: VitalOption): void { this.selectedType = t.type; this.value = ''; }

  save(): void {
    if (!this.value.trim()) return;
    this.saving.set(true);
    this.errMsg.set('');
    this.svc.addVital({ type: this.selectedType, value: this.value.trim(), unit: this.selected().unit, note: this.note || undefined })
      .subscribe({
        next: () => { this.saving.set(false); this.saved.set(true); setTimeout(() => this.router.navigate(['/patient/vitals']), 1200); },
        error: () => { this.saving.set(false); this.errMsg.set('Failed to save. Please try again.'); },
      });
  }
}
