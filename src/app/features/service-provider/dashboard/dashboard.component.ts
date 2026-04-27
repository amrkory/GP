import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../environments/environment';
import { ApiResponse }    from '../../../core/models/api.models';
import { AuthService }    from '../../../core/services/auth.service';

interface ServiceRequest {
  id: string; patientName: string; patientAddress: string; patientPhone: string;
  serviceType: string; scheduledAt: string; status: string; notes: string | null;
  providerId: string | null; providerName: string | null;
}

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <!-- Greeting -->
      <div class="greeting-card">
        <div>
          <p class="greeting-sub">Welcome back</p>
          <h2 class="greeting-name">{{ providerName() }}</h2>
          <p class="greeting-msg">{{ pendingCount }} pending request{{ pendingCount !== 1 ? 's' : '' }} waiting</p>
        </div>
        <div class="greeting-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/>
          </svg>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-num">{{ pendingCount }}</div>
          <div class="stat-lbl">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="stat-num">{{ acceptedCount }}</div>
          <div class="stat-lbl">Accepted</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-num">{{ completedCount }}</div>
          <div class="stat-lbl">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div class="stat-num">{{ rejectedCount }}</div>
          <div class="stat-lbl">Rejected</div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Upcoming today -->
        <div class="col">
          <div class="section-header">
            <h3>Today's Schedule</h3>
            <a routerLink="/provider/requests" class="see-all">See all</a>
          </div>
          <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
          <div class="req-list" *ngIf="!loading()">
            <a class="req-card" *ngFor="let r of todayList" [routerLink]="['/provider/requests', r.id]">
              <div class="req-avatar">{{ initials(r.patientName) }}</div>
              <div class="req-info">
                <div class="req-patient">{{ r.patientName }}</div>
                <div class="req-meta">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ r.scheduledAt | date:'h:mm a' }}
                  <span class="dot">·</span>
                  {{ r.serviceType }}
                </div>
                <div class="req-address">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ r.patientAddress }}
                </div>
              </div>
              <span class="status-pill" [class]="r.status.toLowerCase()">{{ r.status }}</span>
            </a>
            <div class="empty-mini" *ngIf="todayList.length === 0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <p>No visits scheduled today</p>
            </div>
          </div>
        </div>

        <!-- Pending requests -->
        <div class="col">
          <div class="section-header">
            <h3>Pending Requests</h3>
          </div>
          <div class="req-list" *ngIf="!loading()">
            <a class="req-card pending-card" *ngFor="let r of pendingList" [routerLink]="['/provider/requests', r.id]">
              <div class="req-avatar pending">{{ initials(r.patientName) }}</div>
              <div class="req-info">
                <div class="req-patient">{{ r.patientName }}</div>
                <div class="req-meta">{{ r.serviceType }} · {{ r.scheduledAt | date:'MMM d, h:mm a' }}</div>
                <div class="req-note" *ngIf="r.notes">{{ r.notes }}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
            <div class="empty-mini" *ngIf="pendingList.length === 0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <p>No pending requests</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:1100px; }
    @media(max-width:768px){.page{padding:16px;}}
    .greeting-card { background:linear-gradient(135deg,#0F6E56,#1A9070); border-radius:18px; padding:24px; display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .greeting-sub  { font-size:13px; color:rgba(255,255,255,.75); margin-bottom:2px; }
    .greeting-name { font-size:20px; font-weight:700; color:#fff; margin-bottom:4px; }
    .greeting-msg  { font-size:13px; color:rgba(255,255,255,.75); }
    .greeting-icon { width:64px; height:64px; background:rgba(255,255,255,.15); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    @media(max-width:600px){.stats-grid{grid-template-columns:repeat(2,1fr);}}
    .stat-card  { background:#fff; border-radius:14px; padding:16px 14px; display:flex; flex-direction:column; align-items:center; gap:6px; box-shadow:0 1px 8px rgba(0,0,0,.05); }
    .stat-icon  { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .stat-icon.yellow { background:#FEF9E7; }
    .stat-icon.green  { background:#E1F5EE; }
    .stat-icon.blue   { background:#E6F1FB; }
    .stat-icon.red    { background:#FEF2F2; }
    .stat-num   { font-size:24px; font-weight:700; color:#111; }
    .stat-lbl   { font-size:12px; color:#888; }
    .content-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    @media(max-width:768px){.content-grid{grid-template-columns:1fr;}}
    .col { display:flex; flex-direction:column; gap:10px; }
    .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
    .section-header h3 { font-size:16px; font-weight:700; color:#111; }
    .see-all { font-size:13px; color:#0F6E56; text-decoration:none; font-weight:600; }
    .loading { display:flex; justify-content:center; padding:20px; }
    .spinner { width:26px; height:26px; border:3px solid #f0f0f0; border-top-color:#0F6E56; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}
    .req-list { display:flex; flex-direction:column; gap:8px; }
    .req-card { background:#fff; border-radius:12px; padding:14px; display:flex; align-items:flex-start; gap:12px; box-shadow:0 1px 6px rgba(0,0,0,.05); text-decoration:none; color:inherit; transition:transform .1s; cursor:pointer; }
    .req-card:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,.08); }
    .req-avatar { width:44px; height:44px; border-radius:50%; background:#0F6E56; color:#fff; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .req-avatar.pending { background:#d4a017; }
    .req-info   { flex:1; min-width:0; }
    .req-patient { font-size:14px; font-weight:600; color:#111; margin-bottom:3px; }
    .req-meta   { display:flex; align-items:center; gap:5px; font-size:12px; color:#888; margin-bottom:2px; flex-wrap:wrap; }
    .dot { color:#ccc; }
    .req-address { font-size:11px; color:#aaa; display:flex; align-items:center; gap:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .req-note   { font-size:12px; color:#888; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .status-pill { font-size:11px; padding:3px 9px; border-radius:20px; font-weight:600; white-space:nowrap; flex-shrink:0; }
    .status-pill.pending   { background:#FEF9E7; color:#d4a017; }
    .status-pill.accepted  { background:#E1F5EE; color:#0F6E56; }
    .status-pill.completed { background:#f0f0f0; color:#555; }
    .status-pill.rejected  { background:#FEF2F2; color:#D84040; }
    .pending-card { border-left:3px solid #d4a017; }
    .empty-mini { background:#fff; border-radius:12px; padding:24px; display:flex; flex-direction:column; align-items:center; gap:8px; color:#888; font-size:13px; }
  `],
})
export class ProviderDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  loading   = signal(true);
  all       = signal<ServiceRequest[]>([]);
  todayList:   ServiceRequest[] = [];
  pendingList: ServiceRequest[] = [];
  pendingCount = 0; acceptedCount = 0; completedCount = 0; rejectedCount = 0;

  initials(name: string): string { return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(); }

  providerName(): string {
    const u = this.auth.currentUser() as any;
    return `${u?.given_name ?? ''} ${u?.family_name ?? ''}`.trim();
  }

  ngOnInit(): void {
    this.http.get<ApiResponse<ServiceRequest[]>>(`${environment.apiUrl}/HomeService/NurseRequests`)
      .subscribe((res: any) => {
        const data = res.data;
        this.all.set(data);
        const today = new Date().toDateString();
        this.todayList   = data.filter((r: any) => new Date(r.scheduledAt).toDateString() === today);
        this.pendingList = data.filter((r:any) => r.status === 'Pending');
        this.pendingCount   = data.filter((r: any) => r.status === 'Pending').length;
        this.acceptedCount  = data.filter((r: any) => r.status === 'Accepted').length;
        this.completedCount = data.filter((r: any) => r.status === 'Completed').length;
        this.rejectedCount  = data.filter((r: any) => r.status === 'Rejected').length;
        this.loading.set(false);
      });
  }
}
