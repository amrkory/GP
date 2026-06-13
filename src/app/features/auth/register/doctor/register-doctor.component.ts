/**
 * Doctor Registration
 * POST /api/Auth/register/doctor
 * {firstName, lastName, email, password, confirmPassword,
 *  specialization, licenseNumber, phoneNumber, workPlace,
 *  experienceYears, location}
 */
import { Component, signal, inject } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

const SPECS = [
  'General Practitioner','Cardiologist','Dermatologist','Endocrinologist',
  'Gastroenterologist','Neurologist','Obstetrician','Oncologist',
  'Ophthalmologist','Orthopedic Surgeon','Pediatrician','Psychiatrist',
  'Pulmonologist','Radiologist','Rheumatologist','Urologist','Other'
];

@Component({
  selector: 'app-register-doctor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="page">
  <div class="card">

    <div class="brand">
      <div class="brand-ico">
        <svg viewBox="0 0 24 24"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="white"/></svg>
      </div>
      <span>Wateen</span>
    </div>

    <h1>Doctor Registration</h1>
    <p class="sub">Create your professional account</p>

    <!-- SUCCESS -->
    <div class="success-box" *ngIf="success()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      Registration submitted! Your account is pending admin approval.
      <a routerLink="/auth/login" class="btn-login-now">Go to Login →</a>
    </div>

    <ng-container *ngIf="!success()">

      <!-- STEP INDICATOR -->
      <div class="steps">
        <div class="step" [class.active]="step===1" [class.done]="step>1">
          <div class="step-num">{{ step > 1 ? '✓' : '1' }}</div>
          <span>Personal</span>
        </div>
        <div class="step-line"></div>
        <div class="step" [class.active]="step===2" [class.done]="step>2">
          <div class="step-num">{{ step > 2 ? '✓' : '2' }}</div>
          <span>Professional</span>
        </div>
      </div>

      <!-- STEP 1: Personal Info -->
      <div class="form-step" *ngIf="step===1">
        <div class="field-row">
          <div class="field">
            <label>First Name *</label>
            <input [(ngModel)]="form.firstName" placeholder="Ahmed" [class.err]="touched && !form.firstName"/>
            <span class="ferr" *ngIf="touched && !form.firstName">Required</span>
          </div>
          <div class="field">
            <label>Last Name *</label>
            <input [(ngModel)]="form.lastName" placeholder="Mohamed" [class.err]="touched && !form.lastName"/>
            <span class="ferr" *ngIf="touched && !form.lastName">Required</span>
          </div>
        </div>

        <div class="field">
          <label>Email *</label>
          <input [(ngModel)]="form.email" type="email" placeholder="doctor@example.com"
                 [class.err]="touched && !isValidEmail(form.email)"/>
          <span class="ferr" *ngIf="touched && !isValidEmail(form.email)">Valid email required</span>
        </div>

        <div class="field">
          <label>Phone Number *</label>
          <input [(ngModel)]="form.phoneNumber" type="tel" placeholder="01xxxxxxxxx"
                 [class.err]="touched && !form.phoneNumber"/>
          <span class="ferr" *ngIf="touched && !form.phoneNumber">Required</span>
        </div>

        <div class="field">
          <label>Password *</label>
          <div class="pw-wrap">
            <input [(ngModel)]="form.password" [type]="showPw ? 'text' : 'password'"
                   placeholder="Min. 8 characters" [class.err]="touched && form.password.length < 8"/>
            <button type="button" class="eye" (click)="showPw=!showPw">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <span class="ferr" *ngIf="touched && form.password.length < 8">Min. 8 characters</span>
        </div>

        <div class="field">
          <label>Confirm Password *</label>
          <input [(ngModel)]="form.confirmPassword" type="password"
                 placeholder="Repeat password"
                 [class.err]="touched && form.confirmPassword !== form.password"/>
          <span class="ferr" *ngIf="touched && form.confirmPassword !== form.password">Passwords don't match</span>
        </div>

        <button class="btn-next" (click)="nextStep()">Continue →</button>
        <p class="login-link">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
      </div>

      <!-- STEP 2: Professional Info -->
      <div class="form-step" *ngIf="step===2">
        <div class="field">
          <label>Specialization *</label>
          <select [(ngModel)]="form.specialization" [class.err]="touched && !form.specialization">
            <option value="">Select specialization</option>
            <option *ngFor="let s of specs" [value]="s">{{ s }}</option>
          </select>
          <span class="ferr" *ngIf="touched && !form.specialization">Required</span>
        </div>

        <div class="field">
          <label>License Number *</label>
          <input [(ngModel)]="form.licenseNumber" placeholder="e.g. LIC-2024-001"
                 [class.err]="touched && !form.licenseNumber"/>
          <span class="ferr" *ngIf="touched && !form.licenseNumber">Required</span>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Workplace *</label>
            <input [(ngModel)]="form.workPlace" placeholder="Hospital / Clinic name"
                   [class.err]="touched && !form.workPlace"/>
            <span class="ferr" *ngIf="touched && !form.workPlace">Required</span>
          </div>
          <div class="field">
            <label>Experience (years) *</label>
            <input [(ngModel)]="form.experienceYears" type="number" min="0" max="60"
                   placeholder="e.g. 5" [class.err]="touched && form.experienceYears < 0"/>
          </div>
        </div>

        <div class="field">
          <label>Location / City</label>
          <input [(ngModel)]="form.location" placeholder="Cairo, Giza… (optional)"/>
        </div>

        <!-- Error -->
        <div class="err-box" *ngIf="errMsg()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ errMsg() }}
        </div>

        <div class="btn-row">
          <button class="btn-back" (click)="step=1; touched=false">← Back</button>
          <button class="btn-submit" (click)="submit()" [disabled]="loading()">
            <span class="ring" *ngIf="loading()"></span>
            {{ loading() ? 'Registering…' : 'Register' }}
          </button>
        </div>
      </div>

    </ng-container>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .page{min-height:100vh;background:#F7F8FA;display:flex;align-items:center;justify-content:center;padding:20px;font-family:'Cairo','Segoe UI',sans-serif;}
    .card{background:#fff;border-radius:20px;padding:32px;width:100%;max-width:480px;box-shadow:0 4px 24px rgba(0,0,0,.08);}
    .brand{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
    .brand-ico{width:36px;height:36px;background:#D84040;border-radius:10px;display:flex;align-items:center;justify-content:center;}
    .brand-ico svg{width:18px;height:18px;}
    .brand span{font-size:18px;font-weight:800;color:#111;}
    h1{font-size:22px;font-weight:800;color:#111;margin-bottom:4px;}
    .sub{font-size:13px;color:#888;margin-bottom:20px;}

    /* Steps */
    .steps{display:flex;align-items:center;margin-bottom:22px;}
    .step{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#9CA3AF;}
    .step.active{color:#2D4A8A;}
    .step.done{color:#0F6E56;}
    .step-num{width:26px;height:26px;border-radius:50%;border:2px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;}
    .step.active .step-num{background:#2D4A8A;color:#fff;border-color:#2D4A8A;}
    .step.done .step-num{background:#0F6E56;color:#fff;border-color:#0F6E56;}
    .step-line{flex:1;height:2px;background:#E8ECF0;margin:0 10px;}

    /* Fields */
    .field{margin-bottom:14px;}
    .field label{display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.3px;}
    .field input,.field select{width:100%;padding:11px 14px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;appearance:none;background:#fff;transition:border-color .2s;}
    .field input:focus,.field select:focus{border-color:#2D4A8A;}
    .field input.err,.field select.err{border-color:#D84040;}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    @media(max-width:480px){.field-row{grid-template-columns:1fr;}}
    .pw-wrap{position:relative;}
    .pw-wrap input{padding-right:42px;}
    .eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;display:flex;}
    .ferr{font-size:11px;color:#D84040;margin-top:4px;display:block;}

    /* Buttons */
    .btn-next{width:100%;padding:13px;background:#2D4A8A;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px;}
    .btn-next:hover{background:#1E3A6E;}
    .btn-row{display:flex;gap:10px;margin-top:4px;}
    .btn-back{flex:1;padding:12px;background:#F4F6FA;color:#374151;border:1.5px solid #E8ECF0;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;}
    .btn-submit{flex:2;padding:12px;background:#2D4A8A;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;}
    .btn-submit:disabled{opacity:.5;cursor:not-allowed;}
    .ring{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;}
    .login-link{text-align:center;margin-top:14px;font-size:13px;color:#888;}
    .login-link a{color:#2D4A8A;font-weight:700;text-decoration:none;}

    /* Messages */
    .err-box{background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;border-radius:10px;padding:11px 14px;margin-bottom:14px;font-size:13px;display:flex;align-items:flex-start;gap:8px;line-height:1.5;}
    .success-box{background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46;border-radius:12px;padding:16px;font-size:14px;font-weight:600;display:flex;flex-direction:column;gap:10px;}
    .btn-login-now{display:inline-block;margin-top:4px;padding:9px 18px;background:#0F6E56;color:#fff;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;text-align:center;}
  `]
})
export class RegisterDoctorComponent {
  private http   = inject(HttpClient);
  private router = inject(Router);

  step    = 1;
  touched = false;
  showPw  = false;
  specs   = SPECS;

  loading = signal(false);
  errMsg  = signal('');
  success = signal(false);

  form = {
    firstName:       '',
    lastName:        '',
    email:           '',
    phoneNumber:     '',
    password:        '',
    confirmPassword: '',
    specialization:  '',
    licenseNumber:   '',
    workPlace:       '',
    experienceYears: 0,
    location:        '',
  };

  isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  nextStep(): void {
    this.touched = true;
    if (!this.form.firstName || !this.form.lastName) return;
    if (!this.isValidEmail(this.form.email))         return;
    if (!this.form.phoneNumber)                       return;
    if (this.form.password.length < 8)               return;
    if (this.form.confirmPassword !== this.form.password) return;
    this.touched = false;
    this.step = 2;
  }

  submit(): void {
    this.touched = true;
    if (!this.form.specialization || !this.form.licenseNumber || !this.form.workPlace) return;

    this.loading.set(true);
    this.errMsg.set('');

    const body = {
      firstName:       this.form.firstName.trim(),
      lastName:        this.form.lastName.trim(),
      email:           this.form.email.trim(),
      password:        this.form.password,
      confirmPassword: this.form.confirmPassword,
      phoneNumber:     this.form.phoneNumber.trim(),
      specialization:  this.form.specialization,
      licenseNumber:   this.form.licenseNumber.trim(),
      workPlace:       this.form.workPlace.trim(),
      experienceYears: Number(this.form.experienceYears) || 0,
      location:        this.form.location.trim(),
    };

    console.log('[RegisterDoctor] POST body:', body);

    this.http.post<any>(`${environment.apiUrl}/Auth/register/doctor`, body).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: (e: any) => {
        this.loading.set(false);
        const errs = e?.error?.errors;
        const msg  = errs
          ? Object.entries(errs).map(([f, m]) => `${f}: ${(m as string[]).join(', ')}`).join('\n')
          : e?.error?.message ?? e?.error?.title ?? `Error ${e?.status}`;
        this.errMsg.set(msg);
        console.error('[RegisterDoctor] error:', e?.error);
      }
    });
  }
}
