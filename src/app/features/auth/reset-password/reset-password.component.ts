import { Component, signal }          from '@angular/core';
import { FormBuilder, Validators,
         AbstractControl,
         ReactiveFormsModule }         from '@angular/forms';
import { Router, RouterLink,
         ActivatedRoute }              from '@angular/router';
import { CommonModule }                from '@angular/common';
import { inject }                      from '@angular/core';
import { HttpClient }                  from '@angular/common/http';
import { environment }                 from '../../../../environments/environment';

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
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">

        <!-- Success state -->
        <ng-container *ngIf="done()">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 class="auth-title center">Password Reset!</h1>
          <p class="auth-sub center">Your password has been changed. You can now sign in with your new password.</p>
          <button class="btn-primary" style="margin-top:24px" routerLink="/auth/login">Back to Sign In</button>
        </ng-container>

        <!-- Form -->
        <ng-container *ngIf="!done()">
          <button class="back-btn" routerLink="/auth/login">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Sign In
          </button>

          <div class="lock-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>

          <h1 class="auth-title">Set New Password</h1>
          <p class="auth-sub">Your new password must be different from your previous password.</p>

          <div class="alert-error" *ngIf="errorMsg()">{{ errorMsg() }}</div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>New Password <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="f['password'].touched && f['password'].invalid">
                <span class="input-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input formControlName="password" [type]="showPw() ? 'text' : 'password'" placeholder="Min. 8 characters" />
                <button type="button" class="eye-btn" (click)="togglePw()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div class="field-error" *ngIf="f['password'].touched && f['password'].errors?.['minlength']">Minimum 8 characters</div>
            </div>

            <div class="field">
              <label>Confirm New Password <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="f['confirmPassword'].touched && f['confirmPassword'].invalid">
                <span class="input-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input formControlName="confirmPassword" [type]="showCpw() ? 'text' : 'password'" placeholder="Confirm your password" />
                <button type="button" class="eye-btn" (click)="toggleCpw()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div class="field-error" *ngIf="f['confirmPassword'].touched && f['confirmPassword'].errors?.['required']">Required</div>
              <div class="field-error" *ngIf="f['confirmPassword'].touched && f['confirmPassword'].errors?.['mismatch']">Passwords do not match</div>
            </div>

            <!-- Requirements -->
            <div class="pw-reqs">
              <div class="req-item" [class.met]="hasLength()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                At least 8 characters
              </div>
              <div class="req-item" [class.met]="hasUpper()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                One uppercase letter
              </div>
              <div class="req-item" [class.met]="hasNumber()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                One number
              </div>
            </div>

            <button class="btn-primary" type="submit" [disabled]="loading()">
              <span class="spinner" *ngIf="loading()"></span>
              {{ loading() ? 'Updating...' : 'Reset Password' }}
            </button>
          </form>
        </ng-container>
      </div>
    </div>
  `,
styleUrls: ['./reset-password.component.scss'],

})
export class ResetPasswordComponent {
  private fb    = inject(FormBuilder);
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);

  showPw   = signal(false);
  showCpw  = signal(false);
  loading  = signal(false);
  errorMsg = signal('');
  done     = signal(false);

  form = this.fb.group({
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: matchPasswords });

  get f() { return this.form.controls; }
  get pw() { return this.f['password'].value ?? ''; }
  hasLength() { return this.pw.length >= 8; }
  hasUpper()  { return /[A-Z]/.test(this.pw); }
  hasNumber() { return /[0-9]/.test(this.pw); }

  // ── Template-safe methods ──────────────────────────────────────────────────
  togglePw():  void { this.showPw.set(!this.showPw()); }
  toggleCpw(): void { this.showCpw.set(!this.showCpw()); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const email = this.route.snapshot.queryParams['email'];
    const token = this.route.snapshot.queryParams['token'];
    this.http.post<any>(`${environment.apiUrl}/auth/reset-password`, {
      email, token, newPassword: this.f['password'].value,
    }).subscribe({
      next:  () => { this.loading.set(false); this.done.set(true); },
      error: (err) => { this.loading.set(false); this.errorMsg.set(err?.error?.message ?? 'Failed to reset password.'); },
    });
  }
}
