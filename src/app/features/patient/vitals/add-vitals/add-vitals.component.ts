import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router }       from '@angular/router';
import { HttpClient }   from '@angular/common/http';
import { environment }  from '../../../../../environments/environment';

@Component({
  selector: 'app-add-vitals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="top-bar">
    <button class="back-btn" (click)="router.navigate(['/patient/vitals'])">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <h1>Add Vitals</h1>
    <span></span>
  </div>
  <p class="hint">Fill in only the readings you measured. Leave others blank.</p>

  <!-- Blood Pressure -->
  <div class="field-card">
    <div class="fc-hdr">
      <div class="fc-ico" style="background:#FEF2F2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <div>
        <div class="fc-title">Blood Pressure</div>
        <div class="fc-sub">Enter as systolic/diastolic (e.g. 120/80)</div>
      </div>
    </div>
    <div class="inp-row">
      <input [(ngModel)]="form.bloodPressure" class="inp" placeholder="120/80" />
      <span class="inp-unit">mmHg</span>
    </div>
  </div>

  <!-- Heart Rate -->
  <div class="field-card">
    <div class="fc-hdr">
      <div class="fc-ico" style="background:#EFF6FF">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <div>
        <div class="fc-title">Heart Rate</div>
        <div class="fc-sub">Normal range: 60–100 bpm</div>
      </div>
    </div>
    <div class="inp-row">
      <input [(ngModel)]="form.heartRate" type="number" class="inp" placeholder="72" min="30" max="300" />
      <span class="inp-unit">bpm</span>
    </div>
  </div>

  <!-- Blood Sugar -->
  <div class="field-card">
    <div class="fc-hdr">
      <div class="fc-ico" style="background:#FFFBEB">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div>
        <div class="fc-title">Blood Sugar</div>
        <div class="fc-sub">Normal fasting: 70–100 mg/dL</div>
      </div>
    </div>
    <div class="inp-row">
      <input [(ngModel)]="form.bloodSugarLevel" type="number" class="inp" placeholder="90" min="30" max="600" />
      <span class="inp-unit">mg/dL</span>
    </div>
  </div>

  <!-- Oxygen Level -->
  <div class="field-card">
    <div class="fc-hdr">
      <div class="fc-ico" style="background:#ECFDF5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
          <path d="M12 2a10 10 0 0 1 10 10c0 4.19-2.57 7.8-6.25 9.33"/>
          <path d="M12 2a10 10 0 0 0-10 10c0 4.19 2.57 7.8 6.25 9.33"/>
        </svg>
      </div>
      <div>
        <div class="fc-title">Oxygen Level</div>
        <div class="fc-sub">Normal: 95–100%</div>
      </div>
    </div>
    <div class="inp-row">
      <input [(ngModel)]="form.oxygenLevel" type="number" class="inp" placeholder="98" min="50" max="100" />
      <span class="inp-unit">%</span>
    </div>
  </div>

  <!-- Temperature -->
  <div class="field-card">
    <div class="fc-hdr">
      <div class="fc-ico" style="background:#FEF2F2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
        </svg>
      </div>
      <div>
        <div class="fc-title">Temperature</div>
        <div class="fc-sub">Normal: 36–37.4°C</div>
      </div>
    </div>
    <div class="inp-row">
      <input [(ngModel)]="form.temperature" type="number" class="inp" placeholder="36.6" min="32" max="45" step="0.1" />
      <span class="inp-unit">°C</span>
    </div>
  </div>

  <!-- Weight -->
  <div class="field-card">
    <div class="fc-hdr">
      <div class="fc-ico" style="background:#F3E8FF">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2">
          <circle cx="12" cy="5" r="3"/>
          <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 17.5A2 2 0 0 0 4 20h16a2 2 0 0 0 1.9-2.5l-2.495-8.04A2 2 0 0 0 17.5 8Z"/>
        </svg>
      </div>
      <div>
        <div class="fc-title">Weight</div>
        <div class="fc-sub">Log regularly to track changes</div>
      </div>
    </div>
    <div class="inp-row">
      <input [(ngModel)]="form.weight" type="number" class="inp" placeholder="70" min="20" max="300" step="0.1" />
      <span class="inp-unit">kg</span>
    </div>
  </div>

  <div class="err-box" *ngIf="err()">{{ err() }}</div>

  <div class="success-box" *ngIf="saved()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    Vitals saved successfully!
  </div>

  <button class="btn-save" (click)="save()" [disabled]="saving() || saved()">
    <span class="btn-spin" *ngIf="saving()"></span>
    {{ saving() ? 'Saving...' : saved() ? 'Saved!' : 'Save Readings' }}
  </button>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;max-width:560px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
    h1{font-size:20px;font-weight:800;color:#111;}
    .back-btn{background:none;border:none;cursor:pointer;color:#555;padding:4px;display:flex;border-radius:8px;}
    .back-btn:hover{background:#f0f0f0;}
    .hint{font-size:13px;color:#6B7280;margin-bottom:18px;}
    .field-card{background:#fff;border-radius:16px;padding:16px;margin-bottom:10px;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .fc-hdr{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
    .fc-ico{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .fc-title{font-size:15px;font-weight:700;color:#111;}
    .fc-sub{font-size:12px;color:#9CA3AF;margin-top:2px;}
    .inp-row{display:flex;align-items:center;gap:10px;}
    .inp{flex:1;padding:11px 14px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:15px;font-family:inherit;outline:none;color:#111;transition:border-color .15s;}
    .inp:focus{border-color:#D84040;box-shadow:0 0 0 3px rgba(216,64,64,.08);}
    .inp-unit{font-size:13px;font-weight:600;color:#6B7280;white-space:nowrap;min-width:40px;}
    .err-box{background:#FEF2F2;color:#D84040;border-radius:12px;padding:12px 14px;margin-bottom:12px;font-size:13px;word-break:break-all;border:1px solid #fecaca;}
    .success-box{display:flex;align-items:center;gap:8px;background:#ECFDF5;color:#0F6E56;border-radius:12px;padding:12px 14px;margin-bottom:12px;font-size:14px;font-weight:700;}
    .btn-save{width:100%;padding:14px;background:#D84040;color:#fff;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;}
    .btn-save:disabled{opacity:.5;cursor:not-allowed;}
    .btn-spin{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
  `]
})
export class AddVitalsComponent {
  private http = inject(HttpClient);
  readonly router = inject(Router);
  saving = signal(false);
  saved  = signal(false);
  err    = signal('');

  // Fields match exactly what POST /api/Vital/my expects
  form = {
    bloodPressure:   '',     // string "120/80"
    heartRate:       null as number | null,
    bloodSugarLevel: null as number | null,  // NOTE: bloodSugarLevel NOT sugar
    oxygenLevel:     null as number | null,
    temperature:     null as number | null,
    weight:          null as number | null,
  };

  save(): void {
    // Build body with only non-empty values
    const body: any = {};
    if (this.form.bloodPressure?.trim())  body.bloodPressure   = this.form.bloodPressure.trim();
    if (this.form.heartRate)              body.heartRate        = Number(this.form.heartRate);
    if (this.form.bloodSugarLevel)        body.bloodSugarLevel  = Number(this.form.bloodSugarLevel);
    if (this.form.oxygenLevel)            body.oxygenLevel      = Number(this.form.oxygenLevel);
    if (this.form.temperature)            body.temperature      = Number(this.form.temperature);
    if (this.form.weight)                 body.weight           = Number(this.form.weight);

    if (!Object.keys(body).length) {
      this.err.set('Please enter at least one reading.');
      return;
    }

    this.saving.set(true);
    this.err.set('');

    // POST /api/Vital/my  — exact API body
    this.http.post<any>(`${environment.apiUrl}/Vital/my`, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.router.navigate(['/patient/vitals']), 1400);
      },
      error: (e: any) => {
        this.saving.set(false);
        const errs = e?.error?.errors;
        this.err.set(
          errs
            ? Object.entries(errs).map(([f, m]) => `${f}: ${(m as string[]).join(', ')}`).join(' | ')
            : e?.error?.message ?? e?.error?.title ?? `HTTP ${e?.status}: ${e?.statusText}`
        );
      }
    });
  }
}
