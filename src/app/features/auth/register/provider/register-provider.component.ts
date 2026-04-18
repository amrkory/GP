import { Component, signal }          from '@angular/core';
import { FormBuilder, Validators,
         ReactiveFormsModule }         from '@angular/forms';
import { Router, RouterLink }          from '@angular/router';
import { CommonModule }                from '@angular/common';
import { inject }                      from '@angular/core';
import { HttpClient }                  from '@angular/common/http';
import { environment }                 from '../../../../../environments/environment';

@Component({
  selector: 'app-register-provider',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <button class="back-btn" (click)="router.navigate(['/auth/register'])">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        <h1 class="auth-title">Home Service Registration</h1>
        <p class="auth-sub">Create your provider account</p>

        <div class="alert-error" *ngIf="errorMsg()">{{ errorMsg() }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-section">
            <h3>Personal Information</h3>
            <div class="row-2">
              <div class="field">
                <label>First Name <span class="req">*</span></label>
                <div class="input-wrap" [class.invalid]="f['firstName'].touched && f['firstName'].invalid">
                  <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                  <input formControlName="firstName" placeholder="First name" />
                </div>
              </div>
              <div class="field">
                <label>Last Name <span class="req">*</span></label>
                <div class="input-wrap" [class.invalid]="f['lastName'].touched && f['lastName'].invalid">
                  <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                  <input formControlName="lastName" placeholder="Last name" />
                </div>
              </div>
            </div>
            <div class="field">
              <label>Email <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="f['email'].touched && f['email'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                <input formControlName="email" type="email" placeholder="your@email.com" />
              </div>
            </div>
            <div class="field">
              <label>Password <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input formControlName="password" [type]="showPw() ? 'text' : 'password'" placeholder="Min. 8 characters" />
                <button type="button" class="eye-btn" (click)="togglePw()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
            <div class="field">
              <label>Phone <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="f['phone'].touched && f['phone'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42l.08.92z"/></svg></span>
                <input formControlName="phone" type="tel" placeholder="+20 1xx xxx xxxx" />
              </div>
            </div>
          </div>
          <div class="form-section">
            <h3>Service Details</h3>
            <div class="field">
              <label>Service Type <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="f['serviceType'].touched && f['serviceType'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span>
                <select formControlName="serviceType" class="has-icon">
                  <option value="">Select service type</option>
                  <option value="Nursing">Nursing</option>
                  <option value="Physiotherapy">Physiotherapy</option>
                  <option value="Caregiving">Caregiving</option>
                  <option value="LabTechnician">Lab Technician</option>
                  <option value="Midwifery">Midwifery</option>
                </select>
              </div>
              <div class="field-error" *ngIf="f['serviceType'].touched && f['serviceType'].invalid">Required</div>
            </div>
            <div class="field">
              <label>Years of Experience</label>
              <div class="input-wrap">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                <input formControlName="experience" type="number" min="0" placeholder="e.g., 3" />
              </div>
            </div>
            <div class="field">
              <label>Short Bio</label>
              <textarea formControlName="bio" class="bio-input" placeholder="Tell patients about your experience..." rows="3"></textarea>
            </div>
          </div>
          <button class="btn-primary" type="submit" [disabled]="loading()">
            <span class="spinner" *ngIf="loading()"></span>
            {{ loading() ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>
        <div class="auth-footer">Already have an account? <a routerLink="/auth/login">Sign In</a></div>
      </div>
    </div>
  `,
styleUrls: ['./register-provider.component.scss'],

})
export class RegisterProviderComponent {
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);
  readonly router = inject(Router);

  showPw   = signal(false);
  loading  = signal(false);
  errorMsg = signal('');

  form = this.fb.group({
    firstName:   ['', Validators.required],
    lastName:    ['', Validators.required],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.required, Validators.minLength(8)]],
    phone:       ['', Validators.required],
    serviceType: ['', Validators.required],
    experience:  [''],
    bio:         [''],
  });

  get f() { return this.form.controls; }

  // ── Template-safe method ───────────────────────────────────────────────────
  togglePw(): void { this.showPw.set(!this.showPw()); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.value;
    this.http.post<any>(`${environment.apiUrl}/auth/register`, { ...v, role: 'HomeService' }).subscribe({
      next: () => this.router.navigate(['/auth/login'], { queryParams: { registered: true } }),
      error: (err) => { this.loading.set(false); this.errorMsg.set(err?.error?.message ?? 'Registration failed.'); },
    });
  }
}
