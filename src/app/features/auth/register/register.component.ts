import { Component, signal }          from '@angular/core';
import { Router, RouterLink }          from '@angular/router';
import { CommonModule }                from '@angular/common';
import { Role }                        from '../../../core/models/role.enum';

@Component({
  selector: 'app-register',
  standalone: true,
    styleUrls: ['./register.component.scss'],
  imports: [CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">

        <!-- Brand -->
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#fff"/></svg>
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
            <div class="role-icon-box">{{ opt.emoji }}</div>
            <div class="role-text">
              <strong>{{ opt.label }}</strong>
              <span>{{ opt.desc }}</span>
            </div>
            <div class="radio-dot" [class.on]="selected() === opt.role"></div>
          </button>
        </div>

        <button class="btn-primary" [disabled]="!selected()" (click)="proceed()">
          Continue
        </button>

        <div class="auth-footer">
          Already have an account? <a routerLink="/auth/login">Sign In</a>
        </div>

      </div>
    </div>
  `,
})
export class RegisterComponent {
  selected = signal<Role | null>(null);

  roles = [
    { role: Role.Patient,     emoji: '🧑‍⚕️', label: 'Patient',      desc: 'Access health services' },
    { role: Role.Doctor,      emoji: '👨‍⚕️', label: 'Doctor',       desc: 'Manage patient care' },
    { role: Role.HomeService, emoji: '🏠',   label: 'Home Service', desc: 'Provide care services' },
  ];

  constructor(private router: Router) {}

  proceed(): void {
    const r = this.selected();
    if (!r) return;
    if (r === Role.Patient)     this.router.navigate(['/auth/register/patient']);
    if (r === Role.Doctor)      this.router.navigate(['/auth/register/doctor']);
    if (r === Role.HomeService) this.router.navigate(['/auth/register/provider']);
  }
}
