import { Component, signal }          from '@angular/core';
import { FormBuilder, Validators,
         AbstractControl,
         ReactiveFormsModule }         from '@angular/forms';
import { Router, RouterLink }          from '@angular/router';
import { CommonModule }                from '@angular/common';
import { inject }                      from '@angular/core';
import { HttpClient }                  from '@angular/common/http';
import { environment }                 from '../../../../../environments/environment';

function matchPasswords(ctrl: AbstractControl) {
  const pw  = ctrl.get('password')?.value;
  const cpw = ctrl.get('confirmPassword')?.value;
  if (pw && cpw && pw !== cpw) {
    ctrl.get('confirmPassword')?.setErrors({ mismatch: true });
  } else {
    const c = ctrl.get('confirmPassword');
    if (c?.errors?.['mismatch']) {
      const { mismatch, ...rest } = c.errors;
      c.setErrors(Object.keys(rest).length ? rest : null);
    }
  }
  return null;
}

@Component({
  selector: 'app-register-patient',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">

        <button class="back-btn" (click)="back()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        <h1 class="auth-title">Patient Registration</h1>
        <p class="auth-sub">Create your account to access healthcare services</p>

        <div class="alert-error" *ngIf="errorMsg()">{{ errorMsg() }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-section">
            <h3>Personal Information</h3>

            <div class="field">
              <label>Full Name <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="f['fullName'].touched && f['fullName'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                <input formControlName="fullName" placeholder="Enter your full name" />
              </div>
              <div class="field-error" *ngIf="f['fullName'].touched && f['fullName'].errors?.['required']">Full name is required</div>
            </div>

            <div class="field">
              <label>Email Address <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="f['email'].touched && f['email'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                <input formControlName="email" type="email" placeholder="your.email@example.com" />
              </div>
              <div class="field-error" *ngIf="f['email'].touched && f['email'].errors?.['required']">Email is required</div>
              <div class="field-error" *ngIf="f['email'].touched && f['email'].errors?.['email']">Enter a valid email</div>
            </div>

            <div class="field">
              <label>Password <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="f['password'].touched && f['password'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input formControlName="password" [type]="showPw() ? 'text' : 'password'" placeholder="Create a password" (input)="checkStrength()" />
                <button type="button" class="eye-btn" (click)="togglePw()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div class="strength-bar" [ngClass]="strength()" *ngIf="f['password'].value"></div>
              <div class="strength-label" [ngClass]="strength()" *ngIf="f['password'].value">{{ strengthLabel() }}</div>
              <div class="field-error" *ngIf="f['password'].touched && f['password'].errors?.['required']">Password is required</div>
              <div class="field-error" *ngIf="f['password'].touched && f['password'].errors?.['minlength']">Minimum 8 characters</div>
            </div>

            <div class="field">
              <label>Confirm Password <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="f['confirmPassword'].touched && f['confirmPassword'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input formControlName="confirmPassword" [type]="showCpw() ? 'text' : 'password'" placeholder="Confirm your password" />
                <button type="button" class="eye-btn" (click)="toggleCpw()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div class="field-error" *ngIf="f['confirmPassword'].touched && f['confirmPassword'].errors?.['mismatch']">Passwords do not match</div>
            </div>

            <div class="field">
              <label>Phone Number <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="f['phone'].touched && f['phone'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42l.08.92z"/></svg></span>
                <input formControlName="phone" type="tel" placeholder="+20 1xx xxx xxxx" />
              </div>
              <div class="field-error" *ngIf="f['phone'].touched && f['phone'].errors?.['required']">Phone is required</div>
            </div>

            <div class="row-2">
              <div class="field">
                <label>Date of Birth</label>
                <div class="input-wrap">
                  <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
                  <input formControlName="dateOfBirth" type="date" />
                </div>
              </div>
              <div class="field">
                <label>Gender</label>
                <div class="input-wrap">
                  <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></span>
                  <select formControlName="gender" class="has-icon">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field">
              <label>National ID</label>
              <div class="input-wrap">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></span>
                <input formControlName="nationalId" placeholder="Enter your national ID" />
              </div>
            </div>

            <div class="field">
              <label>Blood Type</label>
              <div class="input-wrap">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></span>
                <select formControlName="bloodType" class="has-icon">
                  <option value="">Select blood type</option>
                  <option *ngFor="let bt of bloodTypes" [value]="bt">{{ bt }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Emergency Contact</h3>
            <div class="field">
              <label>Contact Name</label>
              <div class="input-wrap">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                <input formControlName="emergencyName" placeholder="Full name of emergency contact" />
              </div>
            </div>
            <div class="field">
              <label>Contact Phone</label>
              <div class="input-wrap">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42l.08.92z"/></svg></span>
                <input formControlName="emergencyPhone" type="tel" placeholder="+20 1xx xxx xxxx" />
              </div>
            </div>
          </div>

          <div class="form-section terms-section">
            <label class="terms-check">
              <input type="checkbox" formControlName="terms" />
              <span>By creating an account, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
            </label>
            <div class="field-error" *ngIf="submitted && f['terms'].errors?.['required']">You must accept the terms</div>
          </div>

          <button class="btn-primary" type="submit" [disabled]="loading()">
            <span class="spinner" *ngIf="loading()"></span>
            {{ loading() ? 'Creating account...' : 'Create Patient Account' }}
          </button>
        </form>

        <div class="auth-footer">Already have an account? <a routerLink="/auth/login">Sign In</a></div>
      </div>
    </div>
  `,
styleUrls: ['./register-patient.component.scss'],
})
export class RegisterPatientComponent {
  private fb     = inject(FormBuilder);
  private http   = inject(HttpClient);
  private router = inject(Router);

  showPw   = signal(false);
  showCpw  = signal(false);
  loading  = signal(false);
  errorMsg = signal('');
  strength = signal<string>('');
  submitted = false;

  bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

  form = this.fb.group({
    fullName:       ['', Validators.required],
    email:          ['', [Validators.required, Validators.email]],
    password:       ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword:['', Validators.required],
    phone:          ['', Validators.required],
    dateOfBirth:    [''],
    gender:         [''],
    nationalId:     [''],
    bloodType:      [''],
    emergencyName:  [''],
    emergencyPhone: [''],
    terms:          [false, Validators.requiredTrue],
  }, { validators: matchPasswords });

  get f() { return this.form.controls; }

  // ── Template-safe methods (no arrow functions) ─────────────────────────────
  togglePw():  void { this.showPw.set(!this.showPw()); }
  toggleCpw(): void { this.showCpw.set(!this.showCpw()); }

  strengthLabel(): string {
    const s = this.strength();
    if (s === 'weak')   return 'Weak password';
    if (s === 'medium') return 'Medium password';
    if (s === 'strong') return 'Strong password';
    return '';
  }

  checkStrength(): void {
    const pw = this.f['password'].value ?? '';
    if (pw.length < 6) { this.strength.set('weak'); return; }
    const hasUpper = /[A-Z]/.test(pw);
    const hasNum   = /[0-9]/.test(pw);
    const hasSpec  = /[^A-Za-z0-9]/.test(pw);
    if (pw.length >= 8 && hasUpper && hasNum && hasSpec) this.strength.set('strong');
    else if (pw.length >= 6) this.strength.set('medium');
    else this.strength.set('weak');
  }

  back(): void { this.router.navigate(['/auth/register']); }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    const v = this.form.value;
    const body = {
      fullName: v.fullName, email: v.email, password: v.password,
      phone: v.phone, dateOfBirth: v.dateOfBirth, gender: v.gender,
      nationalId: v.nationalId, bloodType: v.bloodType,
      emergencyContact: { name: v.emergencyName, phone: v.emergencyPhone },
      role: 'Patient',
    };
    this.http.post<any>(`${environment.apiUrl}/auth/register`, body).subscribe({
      next: () => this.router.navigate(['/auth/login'], { queryParams: { registered: true } }),
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Registration failed.');
      },
    });
  }
}
