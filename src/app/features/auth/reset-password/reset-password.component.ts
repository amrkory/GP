import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient }      from '@angular/common/http';
import { environment }     from '../../../../environments/environment';

function passwordsMatch(ctrl: AbstractControl) {
  const pw  = ctrl.get('newPassword')?.value;
  const cpw = ctrl.get('confirmNewPassword')?.value;
  if (pw && cpw && pw !== cpw) {
    ctrl.get('confirmNewPassword')?.setErrors({ mismatch: true });
  } else {
    const c = ctrl.get('confirmNewPassword');
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
  styleUrls: ['./reset-password.component.scss'],
  template: `
    <div class="auth-page">
      <div class="auth-card">

        <!-- Brand -->
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="white"/></svg>
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:#111">Wateen</div>
            <div class="brand-tagline">Healthcare Platform</div>
          </div>
        </div>

        <!-- ── MISSING PARAMS (bad link) ────────────────────────────────── -->
        <ng-container *ngIf="!userId || !token">
          <div class="state-icon warn-icon">🔗</div>
          <h1 class="auth-title" style="text-align:center">Invalid Reset Link</h1>
          <p class="auth-sub" style="text-align:center">
            This link is missing required parameters.<br/>
            Please request a new password reset.
          </p>
          <div class="how-to-fix">
            <strong>If you have the email, fix the URL:</strong>
            <p>Replace <code class="bad">the%20front%20end%20url</code> with <code class="good">localhost:4200</code></p>
            <p class="example">
              <span>❌</span> <code>http://the%20front%20end%20url/reset-password?userId=…</code><br/>
              <span>✅</span> <code>http://localhost:4200/reset-password?userId=…</code>
            </p>
          </div>
          <a routerLink="/auth/forgot-password" class="btn-primary"
             style="display:block;text-align:center;text-decoration:none;margin-top:16px">
            Request New Reset Link
          </a>
          <div class="auth-footer"><a routerLink="/auth/login">← Back to Sign In</a></div>
        </ng-container>

        <!-- ── SUCCESS ───────────────────────────────────────────────────── -->
        <ng-container *ngIf="(userId && token) && done()">
          <div class="state-icon success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 class="auth-title" style="text-align:center">Password Updated!</h1>
          <p class="auth-sub" style="text-align:center">
            Your password has been changed successfully.<br/>
            You can now sign in with your new password.
          </p>
          <a routerLink="/auth/login" class="btn-primary"
             style="display:block;text-align:center;text-decoration:none;margin-top:8px">
            Sign In Now →
          </a>
        </ng-container>

        <!-- ── FORM ───────────────────────────────────────────────────────── -->
        <ng-container *ngIf="(userId && token) && !done()">
          <button class="back-btn" routerLink="/auth/login">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Sign In
          </button>

          <div class="lock-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h1 class="auth-title">Set New Password</h1>
          <p class="auth-sub">Create a strong password for your account.</p>

          <div class="alert-error" *ngIf="errorMsg()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMsg() }}
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">

            <!-- New password -->
            <div class="field">
              <label>New Password <span class="req">*</span></label>
              <div class="input-wrap"
                   [class.invalid]="f['newPassword'].touched && f['newPassword'].invalid">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input formControlName="newPassword"
                       [type]="showPw() ? 'text' : 'password'"
                       placeholder="Min. 8 characters" autocomplete="new-password" />
                <button type="button" class="eye-btn" (click)="showPw.set(!showPw())">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>

              <!-- Strength bar -->
              <div class="strength-bar" [class]="strengthClass()" *ngIf="f['newPassword'].value"></div>
              <div class="strength-label" [class]="strengthClass()" *ngIf="f['newPassword'].value">
                {{ strengthLabel() }}
              </div>

              <div class="field-error" *ngIf="f['newPassword'].touched && f['newPassword'].errors?.['minlength']">
                Minimum 8 characters required
              </div>
            </div>

            <!-- Confirm password -->
            <div class="field">
              <label>Confirm New Password <span class="req">*</span></label>
              <div class="input-wrap"
                   [class.invalid]="f['confirmNewPassword'].touched && f['confirmNewPassword'].invalid">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input formControlName="confirmNewPassword"
                       [type]="showCpw() ? 'text' : 'password'"
                       placeholder="Repeat your password" autocomplete="new-password" />
                <button type="button" class="eye-btn" (click)="showCpw.set(!showCpw())">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <div class="field-error" *ngIf="f['confirmNewPassword'].touched && f['confirmNewPassword'].errors?.['required']">
                Please confirm your password
              </div>
              <div class="field-error" *ngIf="f['confirmNewPassword'].touched && f['confirmNewPassword'].errors?.['mismatch']">
                Passwords do not match
              </div>
            </div>

            <!-- Requirements checklist -->
            <div class="pw-reqs">
              <div class="req-item" [class.met]="hasLength()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                At least 8 characters
              </div>
              <div class="req-item" [class.met]="hasUpper()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                One uppercase letter (A–Z)
              </div>
              <div class="req-item" [class.met]="hasNumber()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                One number (0–9)
              </div>
              <div class="req-item" [class.met]="hasSpecial()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                One special character (!&#64;#$…)
              </div>
            </div>

            <button class="btn-primary" type="submit" [disabled]="loading()">
              <span class="spinner" *ngIf="loading()"></span>
              {{ loading() ? 'Updating Password…' : 'Reset Password' }}
            </button>
          </form>
        </ng-container>

      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private fb    = inject(FormBuilder);
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);

  showPw   = signal(false);
  showCpw  = signal(false);
  loading  = signal(false);
  errorMsg = signal('');
  done     = signal(false);

  // Read from URL query params
  userId = '';
  token  = '';

  form = this.fb.group({
    newPassword:        ['', [Validators.required, Validators.minLength(8)]],
    confirmNewPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  get f() { return this.form.controls; }
  get pw() { return this.f['newPassword'].value ?? ''; }

  hasLength()  { return this.pw.length >= 8; }
  hasUpper()   { return /[A-Z]/.test(this.pw); }
  hasNumber()  { return /[0-9]/.test(this.pw); }
  hasSpecial() { return /[^a-zA-Z0-9]/.test(this.pw); }

  strengthScore(): number {
    return [this.hasLength(), this.hasUpper(), this.hasNumber(), this.hasSpecial()].filter(Boolean).length;
  }
  strengthClass(): string {
    const s = this.strengthScore();
    if (s <= 1) return 'weak';
    if (s <= 3) return 'medium';
    return 'strong';
  }
  strengthLabel(): string {
    const s = this.strengthScore();
    if (s <= 1) return 'Weak password';
    if (s <= 3) return 'Medium password';
    return 'Strong password';
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParams;
    // Backend sends: ?userId=...&token=...
    this.userId = q['userId'] ?? q['user_id'] ?? q['id'] ?? '';
    this.token  = q['token']  ?? '';
    console.log('[ResetPassword] userId:', this.userId ? '✓' : '✗ MISSING', '| token:', this.token ? '✓' : '✗ MISSING');
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.userId || !this.token) {
      this.errorMsg.set('Missing userId or token from URL. Please use the link from your email.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    // Exact body the backend expects
    const body = {
      userId:             this.userId,
      token:              this.token,
      newPassword:        this.f['newPassword'].value!,
      confirmNewPassword: this.f['confirmNewPassword'].value!,
    };

    console.log('[ResetPassword] POST /api/Auth/reset-password', { userId: this.userId, hasToken: !!this.token });

    this.http.post<any>(`${environment.apiUrl}/Auth/reset-password`, body).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: (e) => {
        this.loading.set(false);
        const errs = e?.error?.errors;
        if (errs && typeof errs === 'object') {
          const msgs = Object.entries(errs).map(([f, m]) => `${f}: ${(m as string[]).join(', ')}`).join(' | ');
          this.errorMsg.set(msgs);
        } else {
          this.errorMsg.set(
            e?.error?.message ?? e?.error?.title ??
            (typeof e?.error === 'string' ? e.error : null) ??
            `HTTP ${e?.status}: ${e?.statusText}`
          );
        }
      },
    });
  }
}
