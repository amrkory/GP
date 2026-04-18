import { Component, signal, OnInit,
         ViewChildren, QueryList,
         ElementRef }                  from '@angular/core';
import { Router, RouterLink,
         ActivatedRoute }              from '@angular/router';
import { CommonModule }                from '@angular/common';
import { FormsModule }                 from '@angular/forms';
import { inject }                      from '@angular/core';
import { HttpClient }                  from '@angular/common/http';
import { environment }                 from '../../../../environments/environment';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
    styleUrls: ['./verify-otp.component.scss']  ,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">

        <button class="back-btn" (click)="back()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>

        <!-- Icon -->
        <div style="width:64px;height:64px;background:#E1F5EE;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42l.08.92z"/></svg>
        </div>

        <h1 class="auth-title">Enter Verification Code</h1>
        <p class="auth-sub">We sent a 6-digit code to<br><strong style="color:#111">{{ email }}</strong></p>

        <div class="alert-error" *ngIf="errorMsg()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ errorMsg() }}
        </div>

        <!-- OTP boxes -->
        <div class="otp-row">
          <input
            *ngFor="let d of digits; let i = index"
            #digitInput
            type="text"
            inputmode="numeric"
            maxlength="1"
            [class.filled]="digits[i] !== ''"
            [(ngModel)]="digits[i]"
            (input)="onInput($event, i)"
            (keydown)="onKeyDown($event, i)"
            (paste)="onPaste($event)"
          />
        </div>

        <button class="btn-primary" (click)="verify()" [disabled]="!isComplete() || loading()">
          <span class="spinner" *ngIf="loading()"></span>
          {{ loading() ? 'Verifying…' : 'Verify Code' }}
        </button>

        <div class="resend">
          Didn't receive the code?
          <button (click)="resend()" [disabled]="countdown() > 0">
            Resend {{ countdown() > 0 ? '(' + countdown() + 's)' : '' }}
          </button>
        </div>

      </div>
    </div>
  `,

})
export class VerifyOtpComponent implements OnInit {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef>;

  private http  = inject(HttpClient);
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);

  digits   = Array(6).fill('');
  email    = '';
  mode     = 'reset';   // 'reset' | 'verify'

  loading   = signal(false);
  errorMsg  = signal('');
  countdown = signal(0);

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] ?? '';
    this.mode  = this.route.snapshot.queryParams['mode']  ?? 'reset';
    this.startCountdown();
    // Auto-focus first box
    setTimeout(() => this.digitInputs?.first?.nativeElement?.focus(), 100);
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val   = input.value.replace(/\D/g, '');
    this.digits[index] = val.slice(-1);

    if (val && index < 5) {
      const inputs = this.digitInputs.toArray();
      inputs[index + 1]?.nativeElement?.focus();
    }
    if (this.isComplete()) this.verify();
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      const inputs = this.digitInputs.toArray();
      this.digits[index - 1] = '';
      inputs[index - 1]?.nativeElement?.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const nums  = text.replace(/\D/g, '').slice(0, 6);
    nums.split('').forEach((c, i) => { this.digits[i] = c; });
    event.preventDefault();
    setTimeout(() => {
      const inputs = this.digitInputs.toArray();
      const last   = Math.min(nums.length, 5);
      inputs[last]?.nativeElement?.focus();
    });
  }

  isComplete(): boolean { return this.digits.every(d => d !== ''); }

  verify(): void {
    if (!this.isComplete()) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const code = this.digits.join('');
    const endpoint = this.mode === 'reset'
      ? `${environment.apiUrl}/auth/verify-reset-code`
      : `${environment.apiUrl}/auth/verify-email`;

    this.http.post<any>(endpoint, { email: this.email, code }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (this.mode === 'reset') {
          this.router.navigate(['/auth/reset-password'], { queryParams: { email: this.email, token: res.token } });
        } else {
          this.router.navigate(['/auth/login'], { queryParams: { verified: true } });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.digits = Array(6).fill('');
        setTimeout(() => this.digitInputs?.first?.nativeElement?.focus());
        this.errorMsg.set(err?.error?.message ?? 'Invalid or expired code.');
      },
    });
  }

  resend(): void {
    this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email: this.email }).subscribe({
      next: () => { this.digits = Array(6).fill(''); this.startCountdown(); },
    });
  }

  back(): void {
    if (this.mode === 'reset') this.router.navigate(['/auth/forgot-password']);
    else                       this.router.navigate(['/auth/register']);
  }

  private startCountdown(): void {
    this.countdown.set(60);
    const interval = setInterval(() => {
      this.countdown.update(v => { if (v <= 1) clearInterval(interval); return v - 1; });
    }, 1000);
  }
}
