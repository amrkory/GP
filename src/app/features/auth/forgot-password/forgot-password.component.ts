import { Component, signal }          from '@angular/core';
import { FormBuilder, Validators,
         ReactiveFormsModule }         from '@angular/forms';
import { Router, RouterLink }          from '@angular/router';
import { CommonModule }                from '@angular/common';
import { inject }                      from '@angular/core';
import { HttpClient }                  from '@angular/common/http';
import { environment }                 from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  styleUrls: ['./forgot-password.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">

        <button class="back-btn" routerLink="/auth/login">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Sign In
        </button>

        <!-- Success state -->
        <ng-container *ngIf="sent(); else formState">
          <div class="success-icon">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 class="auth-title" style="text-align:center">Check your email</h1>
          <p class="auth-sub" style="text-align:center">
            We sent a password reset code to<br>
            <strong style="color:#111">{{ form.value.email }}</strong>
          </p>
          <button class="btn-primary" style="margin-top:24px"
                  (click)="router.navigate(['/auth/verify-otp'], { queryParams: { email: form.value.email, mode: 'reset' } })">
            Enter Reset Code
          </button>
          <div class="auth-footer">
            Didn't receive it?
            <button style="background:none;border:none;cursor:pointer;color:#D84040;font-weight:600;font-family:'Cairo',sans-serif"
                    (click)="resend()" [disabled]="countdown() > 0">
              Resend {{ countdown() > 0 ? '(' + countdown() + 's)' : '' }}
            </button>
          </div>
        </ng-container>

        <!-- Form state -->
        <ng-template #formState>
          <!-- Icon -->
          <div style="width:64px;height:64px;background:#FEF2F2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>

          <h1 class="auth-title">Forgot Password?</h1>
          <p class="auth-sub">Enter your email address and we'll send you a code to reset your password.</p>

          <div class="alert-error" *ngIf="errorMsg()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ errorMsg() }}
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>Email Address</label>
              <div class="input-wrap" [class.invalid]="form.get('email')?.touched && form.get('email')?.invalid">
                <span class="input-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                <input formControlName="email" type="email" placeholder="your@email.com" />
              </div>
              <div class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.errors?.['required']">Email is required</div>
              <div class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.errors?.['email']">Enter a valid email</div>
            </div>

            <button class="btn-primary" type="submit" [disabled]="loading()">
              <span class="spinner" *ngIf="loading()"></span>
              {{ loading() ? 'Sending code…' : 'Send Reset Code' }}
            </button>
          </form>

          <div class="auth-footer">
            Remembered your password? <a routerLink="/auth/login">Sign In</a>
          </div>
        </ng-template>

      </div>
    </div>
  `,

})
export class ForgotPasswordComponent {
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);
  readonly router = inject(Router);

  loading  = signal(false);
  errorMsg = signal('');
  sent     = signal(false);
  countdown = signal(0);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email: this.form.value.email }).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); this.startCountdown(); },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Failed to send reset email. Please try again.');
      },
    });
  }

  resend(): void {
    this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email: this.form.value.email })
      .subscribe({ next: () => this.startCountdown() });
  }

  private startCountdown(): void {
    this.countdown.set(60);
    const interval = setInterval(() => {
      this.countdown.update(v => { if (v <= 1) clearInterval(interval); return v - 1; });
    }, 1000);
  }
}
