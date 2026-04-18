import { Component, signal }          from '@angular/core';
import { FormBuilder, Validators,
         ReactiveFormsModule }         from '@angular/forms';
import { Router, RouterLink,
         ActivatedRoute }              from '@angular/router';
import { CommonModule }                from '@angular/common';
import { inject }                      from '@angular/core';
import { AuthService }                 from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#fff"/></svg>
          </div>
          <span class="brand-tagline">Your health, our priority</span>
        </div>

        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-sub">Sign in to continue to your account</p>

        <div class="alert-error" *ngIf="errorMsg()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ errorMsg() }}
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>Email Address</label>
            <div class="input-wrap" [class.invalid]="submitted && form.get('email')?.invalid">
              <span class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              <input formControlName="email" type="email" placeholder="Enter your email" />
            </div>
            <div class="field-error" *ngIf="submitted && form.get('email')?.errors?.['required']">Email is required</div>
            <div class="field-error" *ngIf="submitted && form.get('email')?.errors?.['email']">Enter a valid email</div>
          </div>

          <div class="field">
            <label>Password</label>
            <div class="input-wrap" [class.invalid]="submitted && form.get('password')?.invalid">
              <span class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input formControlName="password" [type]="showPass() ? 'text' : 'password'" placeholder="Enter your password" />
              <button type="button" class="eye-btn" (click)="togglePass()">
                <svg *ngIf="!showPass()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg *ngIf="showPass()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <div class="field-error" *ngIf="submitted && form.get('password')?.errors?.['required']">Password is required</div>
          </div>

          <div class="meta-row">
            <label class="remember">
              <input type="checkbox" formControlName="rememberMe" />
              <span>Remember me</span>
            </label>
            <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
          </div>

          <button class="btn-primary" type="submit" [disabled]="loading()">
            <span class="spinner" *ngIf="loading()"></span>
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-footer">Don't have an account? <a routerLink="/auth/register">Sign Up</a></div>
        <p class="terms-note">By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></p>
      </div>
    </div>
  `,
styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  showPass  = signal(false);
  loading   = signal(false);
  errorMsg  = signal('');
  submitted = false;

  form = this.fb.group({
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', Validators.required],
    rememberMe: [false],
  });

  togglePass(): void { this.showPass.set(!this.showPass()); }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');
    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        this.router.navigateByUrl(returnUrl ?? this.auth.homeRouteForRole());
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401)      this.errorMsg.set('Incorrect email or password.');
        else if (err.status === 423) this.errorMsg.set('Account locked. Try again in 15 minutes.');
        else                         this.errorMsg.set(err?.error?.message ?? 'Something went wrong.');
      },
    });
  }
}
