import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive }       from '@angular/router';
import { CommonModule }        from '@angular/common';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService }         from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-doctor-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed">

      <!-- SIDEBAR -->
      <aside class="sidebar" [class.mobile-open]="mobileOpen">
        <div class="sidebar-brand">
          <div class="brand-logo">
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
            </svg>
          </div>
          <span class="brand-name">Wateen</span>
          <span class="role-chip">Doctor</span>
        </div>

        <div class="sidebar-user">
          <a routerLink="/doctor/profile" class="av-link">
            <img *ngIf="avatarUrl()" [src]="avatarUrl()" class="user-avatar-img" alt="" />
            <div *ngIf="!avatarUrl()" class="user-avatar">{{ initials() }}</div>
          </a>
          <div class="user-info">
            <div class="user-name">Dr. {{ userName() }}</div>
            <div class="user-role">Physician</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Overview</div>
          <a routerLink="/doctor/dashboard" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Dashboard</span>
          </a>
          <a routerLink="/doctor/appointments" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Appointments</span>
          </a>

          <div class="nav-section-label" style="margin-top:8px">Patients</div>
          <a routerLink="/doctor/patients" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Patients</span>
          </a>
          <a routerLink="/doctor/chat" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Messages</span>
            <span class="badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
          </a>

          <div class="nav-section-label" style="margin-top:8px">Account</div>
          <a routerLink="/doctor/calendly" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Calendly</span>
          </a>
          <a routerLink="/doctor/profile" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Profile</span>
          </a>
          <button class="nav-link logout-btn" (click)="logout()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <!-- BACKDROP -->
      <div class="sidebar-backdrop" *ngIf="mobileOpen" (click)="mobileOpen=false"></div>

      <!-- MAIN -->
      <div class="main-area">
        <!-- Top header -->
        <header class="top-header">
          <button class="menu-btn" (click)="toggleSidebar()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div class="hdr-brand">
            <div class="hdr-logo">
              <svg viewBox="0 0 24 24" fill="#2D4A8A" width="16" height="16"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
            </div>
            <span class="hdr-name">Wateen</span>
          </div>
          <div class="hdr-actions">
            <button class="hdr-icon-btn" routerLink="/doctor/notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span class="notif-dot" *ngIf="unreadCount() > 0"></span>
            </button>
            <a routerLink="/doctor/profile" class="hdr-avatar-link">
              <img *ngIf="avatarUrl()" [src]="avatarUrl()" class="hdr-avatar-img" alt="" />
              <div *ngIf="!avatarUrl()" class="hdr-avatar">{{ initials() }}</div>
            </a>
          </div>
        </header>

        <!-- Page content -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .app-layout { display: flex; height: 100vh; overflow: hidden; background: #F7F8FA; font-family: 'Cairo', 'Segoe UI', sans-serif; }

    /* ── SIDEBAR ── */
    .sidebar { width: 240px; background: #1B2B4B; display: flex; flex-direction: column; flex-shrink: 0; transition: width 0.25s; overflow-y: auto; overflow-x: hidden; z-index: 50; }
    .sidebar-collapsed .sidebar { width: 64px; }
    .sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 20px 16px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .brand-logo { width: 32px; height: 32px; background: #2D4A8A; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .brand-name { color: #fff; font-size: 16px; font-weight: 700; white-space: nowrap; overflow: hidden; }
    .role-chip { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.8); font-size: 10px; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
    .sidebar-collapsed .brand-name, .sidebar-collapsed .role-chip { display: none; }

    .sidebar-user { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .av-link { text-decoration:none; flex-shrink:0; }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: #2D4A8A; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .user-avatar-img { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,.2); flex-shrink:0; }
    .hdr-avatar-link { text-decoration:none; }
    .hdr-avatar-img { width:34px; height:34px; border-radius:50%; object-fit:cover; border:2px solid #F0F2F5; }
    .user-info { overflow: hidden; }
    .user-name { font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; color: rgba(255,255,255,0.5); }
    .sidebar-collapsed .user-info { display: none; }

    .sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
    .nav-section-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 1px; padding: 6px 8px 2px; }
    .sidebar-collapsed .nav-section-label { display: none; }

    .nav-link { display: flex; align-items: center; gap: 10px; padding: 10px 10px; border-radius: 10px; color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 500; text-decoration: none; transition: all 0.15s; cursor: pointer; background: none; border: none; width: 100%; font-family: inherit; }
    .nav-link:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .nav-link.active { background: #2D4A8A; color: #fff; }
    .nav-link svg { flex-shrink: 0; }
    .nav-link span:not(.badge) { white-space: nowrap; overflow: hidden; }
    .sidebar-collapsed .nav-link span:not(.badge) { display: none; }
    .badge { background: #D84040; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: auto; }
    .logout-btn:hover { background: rgba(216,64,64,0.15) !important; color: #ff8080 !important; }

    /* ── BACKDROP ── */
    .sidebar-backdrop { display: none; }
    @media (max-width: 1024px) {
      .sidebar { position: fixed; top: 0; left: 0; height: 100%; transform: translateX(-100%); z-index: 200; width: 240px !important; }
      .sidebar.mobile-open { transform: translateX(0); }
      .sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 199; }
      .main-area { width: 100%; }
    }

    /* ── MAIN AREA ── */
    .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

    .top-header { height: 56px; background: #fff; border-bottom: 1px solid #F0F0F0; display: flex; align-items: center; gap: 12px; padding: 0 20px; flex-shrink: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .menu-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; color: #555; display: flex; align-items: center; }
    .menu-btn:hover { background: #F0F0F0; }
    .hdr-brand { display: flex; align-items: center; gap: 8px; flex: 1; }
    .hdr-logo { width: 28px; height: 28px; background: #EEF2FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .hdr-name { font-size: 15px; font-weight: 700; color: #111; }
    .hdr-actions { display: flex; align-items: center; gap: 8px; }
    .hdr-icon-btn { position: relative; background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; color: #555; display: flex; }
    .hdr-icon-btn:hover { background: #F0F0F0; }
    .notif-dot { position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; background: #D84040; border-radius: 50%; border: 2px solid #fff; }
    .hdr-avatar { width: 34px; height: 34px; border-radius: 50%; background: #2D4A8A; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; }

    .page-content { flex: 1; overflow-y: auto; padding: 0; }
  `],
})
export class DoctorShellComponent implements OnInit {
  private auth         = inject(AuthService);
  private notifService = inject(NotificationService);

  sidebarCollapsed = false;
  mobileOpen       = false;

  unreadCount() { return this.notifService.unreadCount(); }

  avatarUrl   = signal('');
  private profSvc = inject(ProfileService);

  initials(): string {
    const u = this.auth.currentUser() as any;
    const f = u?.given_name ?? u?.firstName ?? u?.name?.split(' ')?.[0] ?? 'D';
    const l = u?.family_name ?? u?.lastName ?? u?.name?.split(' ')?.[1] ?? '';
    return ((f[0] ?? '') + (l[0] ?? '')).toUpperCase() || 'DR';
  }

  userName(): string {
    const u = this.auth.currentUser() as any;
    const full = (`${u?.given_name ?? ''} ${u?.family_name ?? ''}`).trim();
    return full || u?.name || u?.email?.split('@')[0] || 'Doctor';
  }

  fullName(): string { return this.userName(); }

  toggleSidebar(): void {
    if (window.innerWidth >= 1025) {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    } else {
      this.mobileOpen = !this.mobileOpen;
    }
  }

  logout(): void { this.auth.logout(); }

  @HostListener('window:keydown.escape')
  onEsc(): void { this.mobileOpen = false; }

  ngOnInit(): void {
    this.notifService.load().subscribe();
    window.addEventListener('wateen:doctor:photo', (e: any) => { if (e?.detail) this.avatarUrl.set(e.detail); });
    this.profSvc.getDoctorData().subscribe({
      next: (res: any) => {
        const p = res?.data ?? res;
        const url = p?.profilePictureUrl ?? p?.avatarUrl ?? p?.photoUrl ?? '';
        if (url) { this.avatarUrl.set(url); }
      }, error: () => {}
    });
  }
}
