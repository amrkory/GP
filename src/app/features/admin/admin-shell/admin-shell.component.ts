import { Component, OnInit, inject, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule }   from '@angular/common';
import { AuthService }    from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-logo"><svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg></div>
          <span class="brand-name">Wateen</span>
          <span class="role-chip">Admin</span>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar">{{ initials() }}</div>
          <div class="user-info"><div class="user-name">{{ userName() }}</div><div class="user-role">System Admin</div></div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-label">Overview</div>
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>Dashboard</span>
          </a>
          <div class="nav-label" style="margin-top:8px">Management</div>
          <a routerLink="/admin/doctors" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg>
            <span>Doctors</span>
          </a>
          <a routerLink="/admin/doctors/pending" routerLinkActive="active" class="nav-link pending-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Pending Approvals</span>
            <span class="nav-count" *ngIf="pendingCount > 0">{{ pendingCount }}</span>
          </a>
          <a routerLink="/admin/patients" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Patients</span>
          </a>
          <a routerLink="/admin/providers" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Providers</span>
          </a>
          <a routerLink="/admin/categories" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span>Specialties</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="nav-link logout-btn" (click)="logout()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <div class="main-area">
        <header class="top-header">
          <button class="burger-btn" (click)="toggleSidebar()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div class="header-brand mobile-only">
            <div class="hbrand-logo"><svg viewBox="0 0 24 24" fill="white" width="13" height="13"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg></div>
            <span>Wateen Admin</span>
          </div>
          <div class="header-spacer"></div>
          <div class="header-right">
            <span class="admin-badge">Admin Panel</span>
            <button class="hdr-avatar" (click)="logout()">{{ initials() }}</button>
          </div>
        </header>
        <main class="page-content"><router-outlet></router-outlet></main>
      </div>

      <div class="overlay" [class.show]="mobileOpen" (click)="mobileOpen=false"></div>
      <aside class="sidebar mobile-drawer" [class.open]="mobileOpen">
        <div class="sidebar-brand">
          <div class="brand-logo"><svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg></div>
          <span class="brand-name">Wateen</span>
          <button class="close-btn" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard"       routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span>Dashboard</span></a>
          <a routerLink="/admin/doctors"         routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg><span>Doctors</span></a>
          <a routerLink="/admin/doctors/pending" routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Pending Approvals</span></a>
          <a routerLink="/admin/patients"        routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><span>Patients</span></a>
          <a routerLink="/admin/providers"       routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg><span>Providers</span></a>
          <a routerLink="/admin/categories"      routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg><span>Specialties</span></a>
        </nav>
      </aside>
    </div>
  `,
  styles: [`
    .app-layout{display:flex;min-height:100vh;background:#F4F6FA;}
    .sidebar{width:240px;background:#fff;border-right:1px solid #E8ECF0;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50;overflow-y:auto;}
    .sidebar-brand{display:flex;align-items:center;gap:10px;padding:20px 16px 16px;border-bottom:1px solid #E8ECF0;}
    .brand-logo{width:34px;height:34px;background:#1E293B;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .brand-name{font-family:'Plus Jakarta Sans',sans-serif;font-size:17px;font-weight:800;color:#111;}
    .role-chip{margin-left:auto;font-size:10px;background:#F0F2F5;color:#1E293B;padding:2px 8px;border-radius:6px;font-weight:700;white-space:nowrap;}
    .close-btn{background:none;border:none;cursor:pointer;color:#888;margin-left:auto;}
    .sidebar-user{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #E8ECF0;}
    .user-avatar{width:36px;height:36px;border-radius:50%;background:#1E293B;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .user-name{font-size:13px;font-weight:600;color:#111;}
    .user-role{font-size:11px;color:#64748B;font-weight:500;margin-top:1px;}
    .sidebar-nav{flex:1;padding:12px 10px;display:flex;flex-direction:column;gap:2px;}
    .nav-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;padding:8px 8px 4px;}
    .nav-link{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;color:#6B7280;font-size:14px;font-weight:500;transition:background .15s,color .15s;text-decoration:none;border:none;background:none;cursor:pointer;width:100%;}
    .nav-link:hover{background:#F4F6FA;color:#111;}
    .nav-link.active{background:#F0F2F5;color:#1E293B;font-weight:600;}
    .pending-link.active{background:#FEF9E7;color:#d4a017;}
    .nav-count{margin-left:auto;background:#D84040;color:#fff;font-size:11px;font-weight:700;padding:1px 7px;border-radius:10px;}
    .sidebar-footer{padding:10px;border-top:1px solid #E8ECF0;}
    .logout-btn:hover{background:#FEF2F2;color:#D84040;}
    .main-area{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;}
    .top-header{height:60px;background:#fff;border-bottom:1px solid #E8ECF0;display:flex;align-items:center;padding:0 20px;gap:12px;position:sticky;top:0;z-index:40;}
    .burger-btn{background:none;border:none;cursor:pointer;color:#555;display:none;padding:6px;border-radius:8px;}
    .header-spacer{flex:1;}
    .header-right{display:flex;align-items:center;gap:10px;}
    .admin-badge{font-size:12px;background:#F0F2F5;color:#1E293B;padding:4px 12px;border-radius:20px;font-weight:600;}
    .hdr-avatar{width:34px;height:34px;border-radius:50%;background:#1E293B;color:#fff;font-size:12px;font-weight:700;border:none;cursor:pointer;}
    .page-content{flex:1;padding:24px;max-width:1300px;width:100%;}
    .overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:60;opacity:0;transition:opacity .25s;pointer-events:none;}
    .overlay.show{opacity:1;pointer-events:auto;}
    .mobile-drawer{display:none;transform:translateX(-100%);width:260px;box-shadow:4px 0 24px rgba(0,0,0,.12);transition:transform .25s;}
    .mobile-drawer.open{transform:translateX(0);}
    .mobile-only{display:none;}
    .header-brand{display:flex;align-items:center;gap:8px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:800;color:#111;}
    .hbrand-logo{width:26px;height:26px;background:#1E293B;border-radius:8px;display:flex;align-items:center;justify-content:center;}
    @media(max-width:1024px){
      .sidebar{display:none;}.main-area{margin-left:0;}.burger-btn{display:flex;}
      .mobile-only{display:flex;}.overlay{display:block;}.mobile-drawer{display:flex;z-index:70;}
      .page-content{padding:16px;}}
    @media(min-width:1025px){
      .app-layout.sidebar-collapsed .sidebar{width:64px;}
      .app-layout.sidebar-collapsed .brand-name,.app-layout.sidebar-collapsed .role-chip,.app-layout.sidebar-collapsed .user-info,.app-layout.sidebar-collapsed .nav-link span,.app-layout.sidebar-collapsed .nav-label,.app-layout.sidebar-collapsed .nav-count{display:none;}
      .app-layout.sidebar-collapsed .main-area{margin-left:64px;}
      .app-layout.sidebar-collapsed .nav-link{justify-content:center;padding:10px;}
      .app-layout.sidebar-collapsed .sidebar-user{justify-content:center;padding:14px 0;}
      .app-layout.sidebar-collapsed .sidebar-brand{justify-content:center;padding:16px 0;}}
  `],
})
export class AdminShellComponent implements OnInit {
  private auth = inject(AuthService);
  sidebarCollapsed = false; mobileOpen = false;
  pendingCount = 2;
  initials(): string {
    const u = this.auth.currentUser() as any;
    if (!u) return 'A';
    const first = u?.given_name ?? u?.firstName ?? u?.name?.split(' ')?.[0] ?? 'A';
    const last  = u?.family_name ?? u?.lastName ?? u?.name?.split(' ')?.[1] ?? '';
    return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || 'AD';
  }
  userName(): string {
    const u = this.auth.currentUser() as any;
    if (!u) return 'Admin';
    const full = (`${u?.given_name ?? ''} ${u?.family_name ?? ''}`).trim();
    return (u?.name || full) || 'Admin';
  }
  toggleSidebar(): void { if(window.innerWidth>=1025){this.sidebarCollapsed=!this.sidebarCollapsed;}else{this.mobileOpen=!this.mobileOpen;} }
  @HostListener('window:keydown.escape') onEsc() { this.mobileOpen=false; }
  logout() { this.auth.logout(); }
  ngOnInit() {}
}
