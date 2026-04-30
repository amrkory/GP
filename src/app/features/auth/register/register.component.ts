import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule }       from '@angular/common';
import { Role }               from '../../../core/models/role.enum';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">

        <!-- Brand -->
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#fff"/>
            </svg>
          </div>
          <span class="brand-tagline">Wateen Healthcare</span>
        </div>

        <h1 class="auth-title">Create Account</h1>
        <p class="auth-sub">Choose your role to get started</p>

        <!-- Role picker -->
        <div class="role-grid">
          <button class="role-card"
                  *ngFor="let opt of roles"
                  [class.selected]="selected() === opt.role"
                  (click)="selected.set(opt.role)">
            <div class="role-emoji">{{ opt.emoji }}</div>
            <div class="role-text">
              <strong>{{ opt.label }}</strong>
              <span>{{ opt.desc }}</span>
            </div>
            <div class="radio-dot" [class.on]="selected() === opt.role"></div>
          </button>
        </div>

        <button class="btn-primary" [disabled]="!selected()" (click)="proceed()">
          Continue →
        </button>

        <div class="auth-footer">
          Already have an account? <a routerLink="/auth/login">Sign In</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .auth-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #ffeaea 0%, #f7f8fa 60%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      font-family: 'Cairo', 'Segoe UI', sans-serif;
    }

    .auth-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 36px 32px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.10);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
    }
    .brand-icon {
      width: 40px; height: 40px;
      background: #D84040;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-tagline {
      font-size: 14px;
      font-weight: 600;
      color: #555;
    }

    .auth-title {
      font-size: 26px;
      font-weight: 800;
      color: #111;
      margin: 0 0 4px;
    }
    .auth-sub {
      font-size: 14px;
      color: #888;
      margin: 0 0 24px;
    }

    .role-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .role-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border: 2px solid #E8E8E8;
      border-radius: 14px;
      background: #fff;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      text-align: left;
      width: 100%;
      font-family: inherit;
    }
    .role-card:hover {
      border-color: #D84040;
      background: #fff9f9;
    }
    .role-card.selected {
      border-color: #D84040;
      background: #FEF2F2;
    }

    .role-emoji {
      font-size: 28px;
      flex-shrink: 0;
      line-height: 1;
    }

    .role-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .role-text strong {
      font-size: 15px;
      font-weight: 700;
      color: #111;
    }
    .role-text span {
      font-size: 13px;
      color: #888;
    }

    .radio-dot {
      width: 20px; height: 20px;
      border-radius: 50%;
      border: 2px solid #ddd;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    .radio-dot.on {
      border-color: #D84040;
      background: #D84040;
      box-shadow: inset 0 0 0 3px #fff;
    }

    .btn-primary {
      width: 100%;
      padding: 15px;
      background: #D84040;
      color: #fff;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.15s;
      margin-bottom: 16px;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .auth-footer {
      text-align: center;
      font-size: 14px;
      color: #888;
    }
    .auth-footer a {
      color: #D84040;
      font-weight: 700;
      text-decoration: none;
    }
    .auth-footer a:hover { text-decoration: underline; }
  `],
})
export class RegisterComponent {
  selected = signal<Role | null>(null);

  roles = [
    { role: Role.Patient, emoji: '🧑‍⚕️', label: 'Patient',      desc: 'Access health services' },
    { role: Role.Doctor,  emoji: '👨‍⚕️', label: 'Doctor',       desc: 'Manage patient care'    },
    { role: Role.Nurse,   emoji: '🏠',   label: 'Home Service', desc: 'Provide care services'  },
  ];

  constructor(private router: Router) {}

  proceed(): void {
    const r = this.selected();
    if (!r) return;
    if (r === Role.Patient) this.router.navigate(['/auth/register/patient']);
    if (r === Role.Doctor)  this.router.navigate(['/auth/register/doctor']);
    if (r === Role.Nurse)   this.router.navigate(['/auth/register/provider']);
  }
}
