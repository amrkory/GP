import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { Router }          from '@angular/router';
import { ProfileService }  from '../../../../core/services/profile.service';

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
        <h1>Add / Update Vitals</h1>
        <span></span>
      </div>
      <p class="hint">Enter your latest readings. Only fill the ones you have measured today.</p>

      <!-- Blood Pressure -->
      <div class="section-card">
        <div class="section-hdr">
          <div class="section-icon bp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <div>
            <div class="section-title">Blood Pressure</div>
            <div class="section-sub">Measure with a blood pressure cuff</div>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Systolic (upper)</label>
            <div class="inp-wrap">
              <input [(ngModel)]="form.systolicPressure" type="number" class="inp" placeholder="120" min="60" max="250" />
              <span class="inp-unit">mmHg</span>
            </div>
            <div class="field-hint">Normal: 90–120</div>
          </div>
          <div class="field">
            <label>Diastolic (lower)</label>
            <div class="inp-wrap">
              <input [(ngModel)]="form.diastolicPressure" type="number" class="inp" placeholder="80" min="40" max="150" />
              <span class="inp-unit">mmHg</span>
            </div>
            <div class="field-hint">Normal: 60–80</div>
          </div>
        </div>
      </div>

      <!-- Heart Rate -->
      <div class="section-card">
        <div class="section-hdr">
          <div class="section-icon hr">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div>
            <div class="section-title">Heart Rate</div>
            <div class="section-sub">Count beats for 60 seconds or use a monitor</div>
          </div>
        </div>
        <div class="field">
          <label>Beats per minute</label>
          <div class="inp-wrap">
            <input [(ngModel)]="form.heartRate" type="number" class="inp" placeholder="72" min="30" max="250" />
            <span class="inp-unit">bpm</span>
          </div>
          <div class="field-hint">Normal: 60–100 bpm</div>
        </div>
      </div>

      <!-- Blood Glucose -->
      <div class="section-card">
        <div class="section-hdr">
          <div class="section-icon gl">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="10"/><path d="M12 8v8M8 12h8"/></svg>
          </div>
          <div>
            <div class="section-title">Blood Glucose</div>
            <div class="section-sub">Measured with a glucometer</div>
          </div>
        </div>
        <div class="field">
          <label>Blood sugar level</label>
          <div class="inp-wrap">
            <input [(ngModel)]="form.sugar" type="number" class="inp" placeholder="100" min="30" max="600" />
            <span class="inp-unit">mg/dL</span>
          </div>
          <div class="field-hint">Normal: 70–140 mg/dL</div>
        </div>
      </div>

      <div class="toast success" *ngIf="saved()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Vitals saved successfully! Redirecting...
      </div>
      <div class="toast error" *ngIf="error()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ error() }}
      </div>

      <button class="btn-save" (click)="save()" [disabled]="saving()">
        <span class="mini-spinner" *ngIf="saving()"></span>
        <svg *ngIf="!saving()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        {{ saving() ? 'Saving...' : 'Save Vitals' }}
      </button>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; }
    .page { padding:24px; max-width:600px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page { padding:16px; } }

    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
    .top-bar h1 { font-size:18px; font-weight:800; color:#111; }
    .back-btn { background:none; border:none; cursor:pointer; color:#555; padding:6px; border-radius:8px; display:flex; }
    .back-btn:hover { background:#f0f0f0; }
    .hint { font-size:13px; color:#888; margin-bottom:16px; line-height:1.5; }

    .section-card { background:#fff; border-radius:16px; padding:18px; margin-bottom:14px; box-shadow:0 2px 10px rgba(0,0,0,.06); }
    .section-hdr { display:flex; align-items:flex-start; gap:12px; margin-bottom:16px; }
    .section-icon { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .section-icon.bp { background:#FEF2F2; }
    .section-icon.hr { background:#E6F1FB; }
    .section-icon.gl { background:#E1F5EE; }
    .section-title { font-size:15px; font-weight:700; color:#111; margin-bottom:2px; }
    .section-sub   { font-size:12px; color:#888; }

    .field-row { display:flex; gap:12px; } @media(max-width:480px){ .field-row{flex-direction:column;} }
    .field { flex:1; margin-bottom:10px; }
    .field label { display:block; font-size:12px; font-weight:700; color:#555; margin-bottom:6px; text-transform:uppercase; letter-spacing:.4px; }
    .inp-wrap { position:relative; }
    .inp { width:100%; padding:12px 50px 12px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:16px; outline:none; font-family:inherit; background:#F7F8FA; }
    .inp:focus { border-color:#D84040; background:#fff; }
    .inp-unit { position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:12px; color:#aaa; font-weight:600; pointer-events:none; }
    .field-hint { font-size:11px; color:#aaa; margin-top:4px; }

    .toast { display:flex; align-items:center; gap:8px; padding:13px 16px; border-radius:12px; font-size:14px; font-weight:600; margin-bottom:12px; }
    .toast.success { background:#E1F5EE; color:#0F6E56; }
    .toast.error   { background:#FEF2F2; color:#D84040; }

    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .btn-save { width:100%; padding:15px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; }
    .btn-save:disabled { opacity:.55; cursor:not-allowed; }
    .btn-save:hover:not(:disabled) { opacity:.88; }
  `],
})
export class AddVitalsComponent implements OnInit {
  private profileSvc = inject(ProfileService);
  readonly router    = inject(Router);

  saving = signal(false);
  saved  = signal(false);
  error  = signal('');
  form   = { systolicPressure: null as any, diastolicPressure: null as any, heartRate: null as any, sugar: null as any };

  ngOnInit(): void {
    this.profileSvc.getPatientData().subscribe({
      next: (res: any) => {
        const d = res?.data ?? res ?? {};
        this.form.systolicPressure  = d.systolicPressure  || null;
        this.form.diastolicPressure = d.diastolicPressure || null;
        this.form.heartRate         = d.heartRate         || null;
        this.form.sugar             = d.sugar             || null;
      }
    });
  }

  save(): void {
    const dto: any = {};
    if (this.form.systolicPressure)  dto.systolicPressure  = Number(this.form.systolicPressure);
    if (this.form.diastolicPressure) dto.diastolicPressure = Number(this.form.diastolicPressure);
    if (this.form.heartRate)         dto.heartRate  = Number(this.form.heartRate);
    if (this.form.sugar)             dto.sugar      = Number(this.form.sugar);

    if (!Object.keys(dto).length) { this.error.set('Please enter at least one reading.'); return; }
    this.saving.set(true); this.error.set('');

    this.profileSvc.updatePatient(dto).subscribe({
      next: () => {
        this.saving.set(false); this.saved.set(true);
        setTimeout(() => this.router.navigate(['/patient/vitals']), 1400);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Failed to save. Please try again.');
      },
    });
  }
}
