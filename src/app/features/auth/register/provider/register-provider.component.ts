/**
 * Nurse/Provider Registration
 * POST /api/Auth/register/nurse
 * {firstName, lastName, email, password, confirmPassword,
 *  licenseNumber, specialization, experienceYears,
 *  nursePhoneNumber, isActive}
 */
import { Component, signal, inject } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

const SPECS = [
  'General Nursing','Wound Care','Physiotherapy','Lab Technician',
  'Caregiver','Pediatric Nursing','Geriatric Care','Psychiatric Nursing',
  'Home Health Aide','Injection & IV','Other'
];

@Component({
  selector: 'app-register-provider',
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

    <h1>Nurse Registration</h1>
    <p class="sub">Join as a home healthcare provider</p>

    <!-- SUCCESS -->
    <div class="success-box" *ngIf="success()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      Registration submitted! Your account is pending admin approval.
      <a routerLink="/auth/login" class="btn-login-now">Go to Login →</a>
    </div>

    <ng-container *ngIf="!success()">

      <div class="field-row">
        <div class="field">
          <label>First Name *</label>
          <input [(ngModel)]="form.firstName" placeholder="Sara" [class.err]="touched && !form.firstName"/>
          <span class="ferr" *ngIf="touched && !form.firstName">Required</span>
        </div>
        <div class="field">
          <label>Last Name *</label>
          <input [(ngModel)]="form.lastName" placeholder="Ahmed" [class.err]="touched && !form.lastName"/>
          <span class="ferr" *ngIf="touched && !form.lastName">Required</span>
        </div>
      </div>

      <div class="field">
        <label>Email *</label>
        <input [(ngModel)]="form.email" type="email" placeholder="nurse@example.com"
               [class.err]="touched && !isValidEmail(form.email)"/>
        <span class="ferr" *ngIf="touched && !isValidEmail(form.email)">Valid email required</span>
      </div>

      <div class="field">
        <label>Phone Number *</label>
        <input [(ngModel)]="form.nursePhoneNumber" type="tel" placeholder="01xxxxxxxxx"
               [class.err]="touched && !form.nursePhoneNumber"/>
        <span class="ferr" *ngIf="touched && !form.nursePhoneNumber">Required</span>
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
        <input [(ngModel)]="form.confirmPassword" type="password" placeholder="Repeat password"
               [class.err]="touched && form.confirmPassword !== form.password"/>
        <span class="ferr" *ngIf="touched && form.confirmPassword !== form.password">Passwords don't match</span>
      </div>

      <div class="field">
        <label>Specialization *</label>
        <select [(ngModel)]="form.specialization" [class.err]="touched && !form.specialization">
          <option value="">Select service type</option>
          <option *ngFor="let s of specs" [value]="s">{{ s }}</option>
        </select>
        <span class="ferr" *ngIf="touched && !form.specialization">Required</span>
      </div>

      <div class="field-row">
        <div class="field">
          <label>License Number *</label>
          <input [(ngModel)]="form.licenseNumber" placeholder="LIC-xxx"
                 [class.err]="touched && !form.licenseNumber"/>
          <span class="ferr" *ngIf="touched && !form.licenseNumber">Required</span>
        </div>
        <div class="field">
          <label>Experience (years)</label>
          <input [(ngModel)]="form.experienceYears" type="number" min="0" placeholder="0"/>
        </div>
      </div>

      <div class="err-box" *ngIf="errMsg()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ errMsg() }}
      </div>

      <button class="btn-submit" (click)="submit()" [disabled]="loading()">
        <span class="ring" *ngIf="loading()"></span>
        {{ loading() ? 'Registering…' : 'Create Account' }}
      </button>
      <p class="login-link">Already have an account? <a routerLink="/auth/login">Sign in</a></p>

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
    .brand-ico{width:36px;height:36px;background:#0F6E56;border-radius:10px;display:flex;align-items:center;justify-content:center;}
    .brand-ico svg{width:18px;height:18px;}
    .brand span{font-size:18px;font-weight:800;color:#111;}
    h1{font-size:22px;font-weight:800;color:#111;margin-bottom:4px;}
    .sub{font-size:13px;color:#888;margin-bottom:20px;}
    .field{margin-bottom:14px;}
    .field label{display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.3px;}
    .field input,.field select{width:100%;padding:11px 14px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;appearance:none;background:#fff;}
    .field input:focus,.field select:focus{border-color:#0F6E56;}
    .field input.err,.field select.err{border-color:#D84040;}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    @media(max-width:480px){.field-row{grid-template-columns:1fr;}}
    .pw-wrap{position:relative;}
    .pw-wrap input{padding-right:42px;}
    .eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;display:flex;}
    .ferr{font-size:11px;color:#D84040;margin-top:4px;display:block;}
    .btn-submit{width:100%;padding:13px;background:#0F6E56;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;}
    .btn-submit:disabled{opacity:.5;}
    .ring{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;}
    .login-link{text-align:center;margin-top:14px;font-size:13px;color:#888;}
    .login-link a{color:#0F6E56;font-weight:700;text-decoration:none;}
    .err-box{background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;border-radius:10px;padding:11px 14px;margin-bottom:14px;font-size:13px;display:flex;align-items:flex-start;gap:8px;line-height:1.5;}
    .success-box{background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46;border-radius:12px;padding:16px;font-size:14px;font-weight:600;display:flex;flex-direction:column;gap:10px;}
    .btn-login-now{display:inline-block;padding:9px 18px;background:#0F6E56;color:#fff;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;text-align:center;}
  `]
})
export class RegisterProviderComponent {
  private http   = inject(HttpClient);
  private router = inject(Router);

  touched = false;
  showPw  = false;
  specs   = SPECS;

  loading = signal(false);
  errMsg  = signal('');
  success = signal(false);

  form = {
    firstName:        '',
    lastName:         '',
    email:            '',
    nursePhoneNumber: '',
    password:         '',
    confirmPassword:  '',
    specialization:   '',
    licenseNumber:    '',
    experienceYears:  0,
  };

  isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  submit(): void {
    this.touched = true;
    if (!this.form.firstName || !this.form.lastName)       return;
    if (!this.isValidEmail(this.form.email))               return;
    if (!this.form.nursePhoneNumber)                        return;
    if (this.form.password.length < 8)                     return;
    if (this.form.confirmPassword !== this.form.password)  return;
    if (!this.form.specialization || !this.form.licenseNumber) return;

    this.loading.set(true);
    this.errMsg.set('');

    const body = {
      firstName:        this.form.firstName.trim(),
      lastName:         this.form.lastName.trim(),
      email:            this.form.email.trim(),
      password:         this.form.password,
      confirmPassword:  this.form.confirmPassword,
      licenseNumber:    this.form.licenseNumber.trim(),
      specialization:   this.form.specialization,
      experienceYears:  Number(this.form.experienceYears) || 0,
      nursePhoneNumber: this.form.nursePhoneNumber.trim(),
      isActive:         true,
    };

    console.log('[RegisterNurse] POST body:', body);

    this.http.post<any>(`${environment.apiUrl}/Auth/register/nurse`, body).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: (e: any) => {
        this.loading.set(false);
        const errs = e?.error?.errors;
        const msg  = errs
          ? Object.entries(errs).map(([f, m]) => `${f}: ${(m as string[]).join(', ')}`).join('\n')
          : e?.error?.message ?? e?.error?.title ?? `Error ${e?.status}`;
        this.errMsg.set(msg);
        console.error('[RegisterNurse] error:', e?.error);
      }
    });
  }
}
