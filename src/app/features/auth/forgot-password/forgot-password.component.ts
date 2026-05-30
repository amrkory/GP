import { Component, signal, inject } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router }        from '@angular/router';
import { HttpClient }                from '@angular/common/http';
import { environment }               from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrls: ['./forgot-password.component.scss'],
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

        <!-- ── SUCCESS STATE ───────────────────────────────────────────── -->
        <ng-container *ngIf="sent()">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/>
            </svg>
          </div>
          <h1 class="auth-title" style="text-align:center">Check Your Email</h1>
          <p class="auth-sub" style="text-align:center">
            We sent a password reset link to<br/>
            <strong style="color:#111">{{ sentEmail() }}</strong>
          </p>

          <!-- Step-by-step instructions because backend URL is broken -->
          <div class="steps-guide">
            <div class="guide-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              How to open the reset link
            </div>
            <ol>
              <li>Open <strong>Gmail</strong> and find the email from Wateen</li>
              <li>Click the reset link in the email</li>
              <li>If you see a wrong URL page, copy the link address</li>
              <li>
                In the URL, replace <code class="bad">the%20front%20end%20url</code>
                with <code class="good">localhost:4200</code>
              </li>
              <li>Press <strong>Enter</strong> — the reset form will open ✓</li>
            </ol>
            <div class="url-example">
              <div class="url-label">❌ Link you receive:</div>
              <code>http://the%20front%20end%20url/reset-password?userId=…&token=…</code>
              <div class="url-label" style="margin-top:8px">✅ After fixing:</div>
              <code class="ok">http://localhost:4200/reset-password?userId=…&token=…</code>
            </div>
          </div>

          <div class="auth-footer">
            Didn't receive it?
            <button class="resend-btn" (click)="resend()" [disabled]="countdown() > 0">
              Resend {{ countdown() > 0 ? '(' + countdown() + 's)' : '' }}
            </button>
          </div>
          <div class="auth-footer" style="margin-top:8px">
            <a routerLink="/auth/login">← Back to Sign In</a>
          </div>
        </ng-container>

        <!-- ── FORM STATE ──────────────────────────────────────────────── -->
        <ng-container *ngIf="!sent()">
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

          <h1 class="auth-title">Forgot Password?</h1>
          <p class="auth-sub">Enter your email and we'll send you a reset link.</p>

          <div class="alert-error" *ngIf="errorMsg()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMsg() }}
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>Email Address <span class="req">*</span></label>
              <div class="input-wrap"
                   [class.invalid]="form.get('email')?.touched && form.get('email')?.invalid"
                   [class.valid]="form.get('email')?.touched && form.get('email')?.valid">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input formControlName="email" type="email"
                       placeholder="your@email.com" autocomplete="email" />
              </div>
              <div class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.errors?.['required']">
                Email is required
              </div>
              <div class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.errors?.['email']">
                Please enter a valid email address
              </div>
            </div>

            <button class="btn-primary" type="submit" [disabled]="loading()">
              <span class="spinner" *ngIf="loading()"></span>
              {{ loading() ? 'Sending…' : 'Send Reset Link' }}
            </button>
          </form>

          <div class="auth-footer">
            Remembered your password?
            <a routerLink="/auth/login">Sign In</a>
          </div>
        </ng-container>

      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private http = inject(HttpClient);
  readonly router = inject(Router);
  private fb   = inject(FormBuilder);

  loading   = signal(false);
  errorMsg  = signal('');
  sent      = signal(false);
  sentEmail = signal('');
  countdown = signal(0);
  private cdInterval: any;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    const email = this.form.value.email!;

    this.http.post<any>(`${environment.apiUrl}/Auth/forgot-password`, { email })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.sentEmail.set(email);
          this.sent.set(true);
          this.startCountdown();
        },
        error: (e) => {
          this.loading.set(false);
          this.errorMsg.set(
            e?.error?.message ?? e?.error?.title ??
            (typeof e?.error === 'string' ? e.error : null) ??
            'Failed to send reset email. Please try again.'
          );
        },
      });
  }

  resend(): void {
    this.loading.set(true);
    this.http.post<any>(`${environment.apiUrl}/Auth/forgot-password`, {
      email: this.sentEmail()
    }).subscribe({
      next: () => { this.loading.set(false); this.startCountdown(); },
      error: () => { this.loading.set(false); }
    });
  }

  private startCountdown(): void {
    clearInterval(this.cdInterval);
    this.countdown.set(60);
    this.cdInterval = setInterval(() => {
      this.countdown.update(v => {
        if (v <= 1) { clearInterval(this.cdInterval); return 0; }
        return v - 1;
      });
    }, 1000);
  }
}
