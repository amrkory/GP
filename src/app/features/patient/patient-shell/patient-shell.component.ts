import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule }   from '@angular/common';
import { AuthService }    from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SignalRService }     from '../../../core/services/signalr.service';
import { ChatService }        from '../../../core/services/chat.service';

@Component({
  selector: 'app-patient-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed">

      <!-- ── SIDEBAR (desktop) ──────────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-logo">
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
            </svg>
          </div>
          <span class="brand-name">Wateen</span>
        </div>

        <div class="sidebar-user">
          <div class="user-avatar">{{ initials() }}</div>
          <div class="user-info">
            <div class="user-name">{{ userName() }}</div>
            <div class="user-role">Patient</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Main</div>

          <a routerLink="/patient/dashboard" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Dashboard</span>
          </a>
          <a routerLink="/patient/appointments" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Appointments</span>
          </a>
          <a routerLink="/patient/vitals" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span>Vitals</span>
          </a>
          <a routerLink="/patient/checklist" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>Checklist</span>
          </a>
          <a routerLink="/patient/prescriptions" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
            <span>Prescriptions</span>
          </a>

          <a routerLink="/patient/chat" routerLinkActive="active" class="nav-link chat-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Chats</span>
            <span class="nav-badge chat-badge" *ngIf="totalUnread > 0">{{ totalUnread > 9 ? "9+" : totalUnread }}</span>
          </a>

          <div class="nav-section-label" style="margin-top:8px">More</div>

          <a routerLink="/patient/records" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>Records</span>
          </a>
          <a routerLink="/patient/family" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Family</span>
          </a>
          <a routerLink="/patient/home-service" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home Service</span>
          </a>
          <a routerLink="/patient/nutrition" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
              <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72"/>
            </svg>
            <span>Nutrition</span>
          </a>
          <a routerLink="/patient/ai-assistant" routerLinkActive="active" class="nav-link ai-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
            <span>AI Assistant</span>
            <span class="nav-badge">AI</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/patient/profile" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profile</span>
          </a>
        </div>
      </aside>

      <!-- ── MAIN AREA ───────────────────────────────────────────────────── -->
      <div class="main-area">

        <!-- Top header -->
        <header class="top-header">
          <button class="burger-btn" (click)="toggleSidebar()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div class="header-brand mobile-only">
            <div class="brand-logo"><svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg></div>
            <span>Wateen</span>
          </div>

          <div class="header-spacer"></div>

          <div class="header-actions">
            <button class="header-icon-btn" routerLink="/patient/profile">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="notif-dot" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
            </button>
            <button class="header-avatar" routerLink="/patient/profile">{{ initials() }}</button>
          </div>
        </header>

        <!-- Page content -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- ── BOTTOM NAV (mobile only) ───────────────────────────────────── -->
      <nav class="bottom-nav">
        <a routerLink="/patient/dashboard"    routerLinkActive="active" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </a>
        <a routerLink="/patient/appointments" routerLinkActive="active" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Appointments</span>
        </a>
        <a routerLink="/patient/chat" routerLinkActive="active" class="bn-item">
          <div style="position:relative;display:inline-flex">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="bn-badge" *ngIf="totalUnread > 0">{{ totalUnread > 9 ? "9+" : totalUnread }}</span>
          </div>
          <span>Chats</span>
        </a>
        <a routerLink="/patient/ai-assistant" routerLinkActive="active" class="bn-item bn-ai">
          <div class="bn-ai-fab">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          </div>
          <span>AI</span>
        </a>
        <a routerLink="/patient/vitals"  routerLinkActive="active" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>Vitals</span>
        </a>
        <a routerLink="/patient/profile" routerLinkActive="active" class="bn-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Profile</span>
        </a>
      </nav>

      <!-- Mobile sidebar overlay -->
      <div class="sidebar-overlay" [class.active]="mobileOpen" (click)="mobileOpen = false"></div>
      <aside class="sidebar mobile-sidebar" [class.open]="mobileOpen">
        <div class="sidebar-brand">
          <div class="brand-logo"><svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg></div>
          <span class="brand-name">Wateen</span>
          <button class="close-sidebar-btn" (click)="mobileOpen = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/patient/dashboard"    routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Dashboard</span></a>
          <a routerLink="/patient/appointments" routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Appointments</span></a>
          <a routerLink="/patient/vitals"       routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><span>Vitals</span></a>
          <a routerLink="/patient/checklist"    routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><span>Checklist</span></a>
          <a routerLink="/patient/prescriptions" routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg><span>Prescriptions</span></a>
          <a routerLink="/patient/chat"         routerLinkActive="active" class="nav-link chat-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Chats</span><span class="nav-badge chat-badge" *ngIf="totalUnread > 0">{{ totalUnread > 9 ? "9+" : totalUnread }}</span></a>
          <a routerLink="/patient/records"       routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Records</span></a>
          <a routerLink="/patient/family"        routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>Family</span></a>
          <a routerLink="/patient/home-service"  routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Home Service</span></a>
          <a routerLink="/patient/nutrition"     routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72"/></svg><span>Nutrition</span></a>
          <a routerLink="/patient/ai-assistant"  routerLinkActive="active" class="nav-link ai-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg><span>AI Assistant</span><span class="nav-badge">AI</span></a>
          <a routerLink="/patient/profile"       routerLinkActive="active" class="nav-link" (click)="mobileOpen=false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Profile</span></a>
        </nav>
      </aside>

    </div>
  `,
  styles: [`
    /* ── Layout ─────────────────────────────────────────────────────────── */
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg, #F4F6FA);
    }

    /* ── Sidebar ─────────────────────────────────────────────────────────── */
    .sidebar {
      width: 240px;
      background: #fff;
      border-right: 1px solid var(--border, #E8ECF0);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 50;
      overflow-y: auto;
      transition: transform .25s ease;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px 16px;
      border-bottom: 1px solid var(--border, #E8ECF0);
    }
    .brand-logo {
      width: 34px; height: 34px;
      background: #D84040;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .brand-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 17px; font-weight: 800;
      color: #111;
    }
    .close-sidebar-btn {
      margin-left: auto;
      background: none; border: none;
      cursor: pointer; color: #888;
      display: none;
    }

    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border, #E8ECF0);
    }
    .user-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: #D84040; color: #fff;
      font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .user-name { font-size: 13px; font-weight: 600; color: #111; }
    .user-role { font-size: 11px; color: #D84040; font-weight: 500; margin-top: 1px; }

    /* Nav */
    .sidebar-nav {
      flex: 1;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #9CA3AF;
      padding: 8px 8px 4px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 10px;
      color: #6B7280;
      font-size: 14px;
      font-weight: 500;
      transition: background .15s, color .15s;
      text-decoration: none;
      cursor: pointer;
    }
    .nav-link:hover { background: #F4F6FA; color: #111; }
    .nav-link.active { background: #FEF2F2; color: #D84040; font-weight: 600; }
    .nav-link svg { flex-shrink: 0; }
    .nav-badge {
      margin-left: auto;
      background: #D84040; color: #fff;
      font-size: 10px; font-weight: 700;
      padding: 2px 6px; border-radius: 6px;
    }
    .ai-link.active { background: #FEF2F2; }

    .sidebar-footer {
      padding: 10px;
      border-top: 1px solid var(--border, #E8ECF0);
    }

    /* ── Main area ───────────────────────────────────────────────────────── */
    .main-area {
      flex: 1;
      margin-left: 240px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* Top header */
    .top-header {
      height: 60px;
      background: #fff;
      border-bottom: 1px solid var(--border, #E8ECF0);
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .burger-btn {
      background: none; border: none;
      cursor: pointer; color: #555;
      display: none;
      padding: 6px;
      border-radius: 8px;
    }
    .burger-btn:hover { background: #f0f0f0; }
    .header-spacer { flex: 1; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .header-icon-btn {
      position: relative;
      background: none; border: none;
      cursor: pointer; color: #555;
      width: 38px; height: 38px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .header-icon-btn:hover { background: #f0f0f0; }
    .notif-dot {
      position: absolute; top: 4px; right: 4px;
      background: #D84040; color: #fff;
      font-size: 9px; font-weight: 700;
      width: 15px; height: 15px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .header-avatar {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: #D84040; color: #fff;
      font-size: 12px; font-weight: 700;
      border: none; cursor: pointer;
    }

    /* Page content — full width, pages control their own layout */
    .page-content {
      flex: 1;
      padding: 24px;
      width: 100%;
      min-width: 0;
    }

    /* ── Bottom nav (mobile) ─────────────────────────────────────────────── */
    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 64px;
      background: #fff;
      border-top: 1px solid var(--border, #E8ECF0);
      z-index: 50;
      padding: 0 4px 6px;
    }
    .bn-badge { position:absolute; top:-4px; right:-8px; background:#D84040; color:#fff; font-size:9px; font-weight:700; min-width:16px; height:16px; border-radius:8px; display:flex; align-items:center; justify-content:center; padding:0 3px; }
    .bn-item {
      flex: 1;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 3px;
      text-decoration: none;
      color: #9CA3AF;
      font-size: 10px;
      padding: 6px 0;
    }
    .bn-item.active { color: #D84040; }
    .bn-ai { flex: 0 0 64px; }
    .bn-ai-fab {
      width: 44px; height: 44px;
      border-radius: 50%;
      background: #D84040;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 3px 14px rgba(216,64,64,.35);
      margin-bottom: 1px;
    }

    /* ── Mobile sidebar overlay & drawer ─────────────────────────────────── */
    .sidebar-overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,.4);
      z-index: 60;
      opacity: 0;
      transition: opacity .25s;
    }
    .sidebar-overlay.active { opacity: 1; }

    .mobile-sidebar {
      display: none;
      transform: translateX(-100%);
      width: 260px;
      box-shadow: 4px 0 24px rgba(0,0,0,.12);
    }
    .mobile-sidebar .close-sidebar-btn { display: flex; }
    .mobile-sidebar.open { transform: translateX(0); }

    .mobile-only { display: none; }
    .header-brand {
      display: flex; align-items: center; gap: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px; font-weight: 800; color: #111;
    }
    .header-brand .brand-logo {
      width: 28px; height: 28px;
      background: #D84040; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }

    /* ── Responsive ──────────────────────────────────────────────────────── */
    @media (max-width: 1024px) {
      .sidebar { transform: translateX(-100%); display: none; }
      .main-area { margin-left: 0; }
      .burger-btn { display: flex; }
      .mobile-only { display: flex; }
      .bottom-nav { display: flex; }
      .sidebar-overlay { display: block; pointer-events: none; }
      .sidebar-overlay.active { pointer-events: auto; }
      .mobile-sidebar { display: flex; z-index: 70; }
      .page-content { padding: 16px; padding-bottom: 80px; width: 100%; }
    }

    @media (max-width: 480px) {
      .page-content { padding: 12px; padding-bottom: 80px; }
    }

    /* Collapsed sidebar (desktop) */
    @media (min-width: 1025px) {
      .app-layout.sidebar-collapsed .sidebar { width: 64px; }
      .app-layout.sidebar-collapsed .brand-name,
      .app-layout.sidebar-collapsed .user-info,
      .app-layout.sidebar-collapsed .nav-link span,
      .app-layout.sidebar-collapsed .nav-badge,
      .app-layout.sidebar-collapsed .nav-section-label { display: none; }
      .app-layout.sidebar-collapsed .main-area { margin-left: 64px; }
      .app-layout.sidebar-collapsed .nav-link { justify-content: center; padding: 10px; }
      .app-layout.sidebar-collapsed .sidebar-user { justify-content: center; padding: 14px 0; }
      .app-layout.sidebar-collapsed .sidebar-brand { justify-content: center; padding: 16px 0; }
    }
  `],
})
export class PatientShellComponent implements OnInit {
  private auth         = inject(AuthService);
  private notifService = inject(NotificationService);

  sidebarCollapsed = false;
  mobileOpen       = false;
  totalUnread      = 0;

  unreadCount() { return this.notifService.unreadCount(); }

  initials(): string {
    const u = this.auth.currentUser() as any;
    return ((u?.given_name?.[0] ?? '') + (u?.family_name?.[0] ?? '')).toUpperCase();
  }

  userName(): string {
    const u = this.auth.currentUser() as any;
    return `${u?.given_name ?? ''} ${u?.family_name ?? ''}`.trim();
  }

  toggleSidebar(): void {
    if (window.innerWidth >= 1025) {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    } else {
      this.mobileOpen = !this.mobileOpen;
    }
  }

  @HostListener('window:keydown.escape')
  onEsc(): void { this.mobileOpen = false; }

  private signalRSvc = inject(SignalRService);
  private chatSvc    = inject(ChatService);

  ngOnInit(): void {
    // Connect SignalR once for the whole session
    this.signalRSvc.startConnection();
    // Live unread count
    this.signalRSvc.message$.subscribe(() => this.totalUnread++); this.notifService.load().subscribe(); }
}
