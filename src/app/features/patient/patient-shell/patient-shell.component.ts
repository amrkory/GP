import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink,
         RouterLinkActive }          from '@angular/router';
import { CommonModule }              from '@angular/common';
import { AuthService }               from '../../../core/services/auth.service';
import { NotificationService }       from '../../../core/services/notification.service';

@Component({
  selector: 'app-patient-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">

      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
            </svg>
          </div>
          <span class="brand-name">Wateen</span>
        </div>
        <div class="header-right">
          <button class="icon-btn" routerLink="/patient/profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="notif-badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
          </button>
          <div class="avatar">{{ initials() }}</div>
        </div>
      </header>

      <!-- Page content -->
      <main class="content">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <a routerLink="/patient/dashboard"    routerLinkActive="active" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Home</span>
        </a>
        <a routerLink="/patient/appointments" routerLinkActive="active" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
          </svg>
          <span>Appointments</span>
        </a>
        <a routerLink="/patient/ai-assistant" routerLinkActive="active" class="nav-item ai-item">
          <div class="ai-fab">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </div>
          <span>AI</span>
        </a>
        <a routerLink="/patient/vitals"  routerLinkActive="active" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span>Vitals</span>
        </a>
        <a routerLink="/patient/profile" routerLinkActive="active" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Profile</span>
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .shell { display: flex; flex-direction: column; height: 100vh; background: #F7F8FA; }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 0 16px; height: 56px; background: #fff; border-bottom: 0.5px solid rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 100; flex-shrink: 0; }
    .header-left { display: flex; align-items: center; gap: 8px; }
    .brand-icon { width: 36px; height: 36px; background: #D84040; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .brand-name { font-size: 17px; font-weight: 700; color: #111; }
    .header-right { display: flex; align-items: center; gap: 8px; }
    .icon-btn { position: relative; background: none; border: none; cursor: pointer; color: #555; padding: 6px; border-radius: 50%; display: flex; }
    .notif-badge { position: absolute; top: -2px; right: -2px; background: #D84040; color: #fff; font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; background: #D84040; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .content { flex: 1; overflow-y: auto; padding-bottom: 72px; }
    .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 68px; background: #fff; border-top: 0.5px solid rgba(0,0,0,0.08); display: flex; align-items: center; z-index: 100; padding: 0 4px 8px; }
    .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; text-decoration: none; color: #aaa; font-size: 10px; padding: 6px 0; border-radius: 8px; transition: color .15s; }
    .nav-item.active { color: #D84040; }
    .ai-item { flex: 0 0 68px; }
    .ai-fab { width: 46px; height: 46px; border-radius: 50%; background: #D84040; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px rgba(216,64,64,0.35); margin-bottom: 2px; }
  `],
})
export class PatientShellComponent implements OnInit {
  private auth         = inject(AuthService);
  private notifService = inject(NotificationService);

  unreadCount(): number { return this.notifService.unreadCount(); }

  initials(): string {
    const u = this.auth.currentUser();
    return ((u?.given_name?.[0] ?? '') + (u?.family_name?.[0] ?? '')).toUpperCase();
  }

  ngOnInit(): void {
    this.notifService.load().subscribe();
  }
}
