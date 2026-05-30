import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">

      <!-- Greeting banner -->
      <div class="greeting-card">
        <div>
          <p class="greeting-sub">Welcome back</p>
          <h2 class="greeting-name">{{ providerName() }}</h2>
          <p class="greeting-msg" *ngIf="!loading()">
            {{ pendingCount }} pending request{{ pendingCount !== 1 ? 's' : '' }} waiting
          </p>
          <p class="greeting-msg" *ngIf="loading()">Loading your requests...</p>
        </div>
        <div class="greeting-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 21.5 16h.42Z"/>
          </svg>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <a class="stat-card yellow" routerLink="/provider/requests">
          <div class="sic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="snum">{{ pendingCount }}</div>
          <div class="slbl">Pending</div>
        </a>
        <a class="stat-card green" routerLink="/provider/requests">
          <div class="sic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="snum">{{ acceptedCount }}</div>
          <div class="slbl">Accepted</div>
        </a>
        <a class="stat-card blue" routerLink="/provider/requests">
          <div class="sic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
          <div class="snum">{{ completedCount }}</div>
          <div class="slbl">Completed</div>
        </a>
        <a class="stat-card red" routerLink="/provider/requests">
          <div class="sic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
          <div class="snum">{{ rejectedCount }}</div>
          <div class="slbl">Rejected</div>
        </a>
      </div>

      <!-- Loading spinners -->
      <div class="content-grid" *ngIf="loading()">
        <div class="col"><div class="col-hdr"><h3>Today's Schedule</h3></div><div class="loading-sm"><div class="spinner-sm"></div></div></div>
        <div class="col"><div class="col-hdr"><h3>Pending Requests</h3></div><div class="loading-sm"><div class="spinner-sm"></div></div></div>
      </div>

      <!-- Data -->
      <div class="content-grid" *ngIf="!loading()">

        <!-- Today's schedule -->
        <div class="col">
          <div class="col-hdr">
            <h3>Today's Schedule</h3>
            <a routerLink="/provider/requests" class="see-all">See all →</a>
          </div>
          <div class="req-list">
            <a class="req-row" *ngFor="let r of todayList" [routerLink]="['/provider/requests', r.id]">
              <div class="rav" [style.background]="avatarColor(pName(r))">{{ ini(pName(r)) }}</div>
              <div class="rinfo">
                <div class="rname">{{ pName(r) }}</div>
                <div class="rmeta">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ rTime(r) | date:'h:mm a' }} · {{ rType(r) }}
                </div>
              </div>
              <span class="rpill" [class]="normSt(r)">{{ statusLabel(r) }}</span>
            </a>
            <div class="empty-mini" *ngIf="todayList.length===0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              No visits scheduled today
            </div>
          </div>
        </div>

        <!-- Pending requests -->
        <div class="col">
          <div class="col-hdr">
            <h3>Pending Requests</h3>
            <a routerLink="/provider/requests" class="see-all urgent" *ngIf="pendingCount>0">{{ pendingCount }} waiting →</a>
          </div>
          <div class="req-list">
            <a class="req-row pending-row" *ngFor="let r of pendingList" [routerLink]="['/provider/requests', r.id]">
              <div class="rav pending-av">{{ ini(pName(r)) }}</div>
              <div class="rinfo">
                <div class="rname">{{ pName(r) }}</div>
                <div class="rmeta">{{ rType(r) }} · {{ rTime(r) | date:'MMM d, h:mm a' }}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
            <div class="empty-mini" *ngIf="pendingList.length===0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              No pending requests
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { padding:24px; max-width:1100px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:14px;} }
    .greeting-card { background:linear-gradient(135deg,#0F6E56,#1A9070); border-radius:20px; padding:24px 28px; display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .greeting-sub  { font-size:13px; color:rgba(255,255,255,.75); margin-bottom:2px; }
    .greeting-name { font-size:22px; font-weight:800; color:#fff; margin-bottom:4px; }
    .greeting-msg  { font-size:13px; color:rgba(255,255,255,.8); }
    .greeting-icon { width:64px; height:64px; background:rgba(255,255,255,.12); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    @media(max-width:600px){ .stats-row{grid-template-columns:repeat(2,1fr);} }
    .stat-card { background:#fff; border-radius:16px; padding:18px 14px; display:flex; flex-direction:column; align-items:center; gap:6px; box-shadow:0 1px 8px rgba(0,0,0,.06); text-decoration:none; color:inherit; transition:transform .15s,box-shadow .15s; cursor:pointer; }
    .stat-card:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(0,0,0,.1); }
    .sic { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
    .stat-card.yellow .sic { background:#FEF9E7; }
    .stat-card.green  .sic { background:#E1F5EE; }
    .stat-card.blue   .sic { background:#E6F1FB; }
    .stat-card.red    .sic { background:#FEF2F2; }
    .snum { font-size:28px; font-weight:800; color:#111; }
    .slbl { font-size:12px; color:#888; }
    .content-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    @media(max-width:768px){ .content-grid{grid-template-columns:1fr;} }
    .col { display:flex; flex-direction:column; }
    .col-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    .col-hdr h3 { font-size:16px; font-weight:800; color:#111; }
    .see-all { font-size:13px; color:#0F6E56; font-weight:700; text-decoration:none; }
    .see-all.urgent { color:#d4a017; }
    .loading-sm { display:flex; justify-content:center; padding:24px; }
    .spinner-sm { width:22px; height:22px; border:2px solid #f0f0f0; border-top-color:#0F6E56; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}
    .req-list { display:flex; flex-direction:column; gap:8px; }
    .req-row { background:#fff; border-radius:12px; padding:13px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 6px rgba(0,0,0,.06); text-decoration:none; color:inherit; transition:box-shadow .15s; }
    .req-row:hover { box-shadow:0 4px 14px rgba(0,0,0,.1); }
    .pending-row { border-left:3px solid #d4a017; }
    .rav { width:42px; height:42px; border-radius:50%; color:#fff; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:#0F6E56; }
    .pending-av { background:#d4a017; }
    .rinfo { flex:1; min-width:0; }
    .rname { font-size:14px; font-weight:700; color:#111; margin-bottom:2px; }
    .rmeta { font-size:12px; color:#888; display:flex; align-items:center; gap:5px; }
    .rpill { font-size:11px; padding:3px 9px; border-radius:20px; font-weight:700; white-space:nowrap; flex-shrink:0; }
    .rpill.pending   { background:#FEF9E7; color:#d4a017; }
    .rpill.accepted  { background:#E1F5EE; color:#0F6E56; }
    .rpill.completed { background:#f0f0f0; color:#555; }
    .rpill.rejected  { background:#FEF2F2; color:#D84040; }
    .empty-mini { background:#fff; border-radius:12px; padding:22px; display:flex; align-items:center; justify-content:center; gap:8px; color:#aaa; font-size:13px; box-shadow:0 1px 6px rgba(0,0,0,.06); }
  `]
})
export class ProviderDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  loading      = signal(true);
  all          = signal<any[]>([]);
  todayList:   any[] = [];
  pendingList: any[] = [];
  pendingCount = 0; acceptedCount = 0; completedCount = 0; rejectedCount = 0;

  providerName(): string {
    const u = this.auth.currentUser() as any;
    return (`${u?.given_name??''} ${u?.family_name??''}`).trim() || 'Provider';
  }

  /** THE FIX: numeric status → string */
  normSt(r: any): string {
    const s = r?.status;
    if (s === null || s === undefined) return 'pending';
    if (typeof s === 'number') {
      const m: Record<number,string> = {0:'pending',1:'accepted',2:'completed',3:'rejected',4:'inprogress'};
      return m[s] ?? 'pending';
    }
    return String(s).toLowerCase().trim();
  }

  statusLabel(r: any): string {
    const k = this.normSt(r);
    const m: Record<string,string> = {pending:'Pending',accepted:'Accepted',completed:'Completed',rejected:'Rejected',inprogress:'In Progress'};
    return m[k] ?? String(r?.status ?? '');
  }

  pName(r: any): string  { return r?.patientName ?? r?.clientName ?? r?.userName ?? '—'; }
  rType(r: any): string  { return r?.serviceType ?? r?.serviceDescription ?? ''; }
  rTime(r: any): string  { return r?.requestedTime ?? r?.scheduledAt ?? ''; }

  ini(name: string): string {
    return (name||'?').split(' ').map((n:string)=>n[0]||'').join('').slice(0,2).toUpperCase()||'?';
  }
  avatarColor(name: string): string {
    const c=['#0F6E56','#185FA5','#d4a017','#7C3AED','#D84040'];
    return c[(name||'').charCodeAt(0)%c.length]||'#0F6E56';
  }

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/HomeService/NurseRequests`).subscribe({
      next: (res: any) => {
        try {
          let data: any[] = [];
          if      (Array.isArray(res))             data = res;
          else if (Array.isArray(res?.data))        data = res.data;
          else if (Array.isArray(res?.data?.items)) data = res.data.items;

          console.log('[Dashboard] count:', data.length, '| sample status:', data[0]?.status);
          this.all.set(data);

          const today = new Date().toDateString();
          this.todayList   = data.filter(r => { const t = r?.requestedTime ?? r?.scheduledAt; return t && new Date(t).toDateString() === today; });
          this.pendingList = data.filter(r => this.normSt(r) === 'pending');

          this.pendingCount   = data.filter(r => this.normSt(r) === 'pending').length;
          this.acceptedCount  = data.filter(r => this.normSt(r) === 'accepted').length;
          this.completedCount = data.filter(r => this.normSt(r) === 'completed').length;
          this.rejectedCount  = data.filter(r => this.normSt(r) === 'rejected').length;
        } catch(e: any) {
          console.error('[Dashboard] error:', e);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('[Dashboard] HTTP error:', err);
        this.loading.set(false);
      }
    });
  }
}
