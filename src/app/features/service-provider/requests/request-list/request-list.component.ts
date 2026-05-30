import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Service Requests</h1>
        <p class="sub">Manage incoming patient requests</p>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        <button *ngFor="let f of filters" class="ftab"
                [class.active]="activeFilter() === f.key"
                (click)="activeFilter.set(f.key)">
          {{ f.label }}
          <span class="badge" *ngIf="countOf(f.key) > 0">{{ countOf(f.key) }}</span>
        </button>
      </div>

      <!-- Error -->
      <div class="error-box" *ngIf="error()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ error() }}
        <button (click)="reload()">Retry</button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading() && !error()">
        <div class="spinner"></div><p>Loading requests...</p>
      </div>

      <!-- Content -->
      <ng-container *ngIf="!loading()">

        <!-- Empty -->
        <div class="empty" *ngIf="filtered().length === 0">
          <div class="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <p class="empty-title">No {{ activeFilter() === 'all' ? '' : activeFilter() }} requests</p>
          <p class="empty-hint">{{ emptyHint() }}</p>
        </div>

        <!-- Cards grid -->
        <div class="req-grid" *ngIf="filtered().length > 0">
          <a class="req-card" *ngFor="let r of filtered()"
             [routerLink]="['/provider/requests', r.id]">

            <!-- Top -->
            <div class="card-top">
              <div class="pat-avatar" [style.background]="avatarColor(pName(r))">
                {{ initials(pName(r)) }}
              </div>
              <div class="pat-info">
                <div class="pat-name">{{ pName(r) }}</div>
                <div class="pat-phone" *ngIf="pPhone(r)">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 21.5 16h.42Z"/>
                  </svg>
                  {{ pPhone(r) }}
                </div>
              </div>
              <span class="status-pill" [class]="normSt(r)">{{ statusLabel(r) }}</span>
            </div>

            <div class="divider"></div>

            <!-- Body -->
            <div class="card-body">
              <div class="info-row" *ngIf="svcType(r)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 21.5 16h.42Z"/>
                </svg>
                <span class="svc">{{ svcType(r) }}</span>
              </div>
              <div class="info-row" *ngIf="svcTime(r)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ svcTime(r) | date:'EEE, MMM d · h:mm a' }}
              </div>
              <div class="info-row" *ngIf="svcAddr(r)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ svcAddr(r) }}
              </div>
              <div class="info-row note" *ngIf="svcNotes(r)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                {{ svcNotes(r) }}
              </div>
            </div>

            <div class="card-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </a>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { padding:24px; max-width:1100px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:14px;} }
    h1 { font-size:22px; font-weight:800; color:#111; }
    .sub { font-size:13px; color:#888; margin-top:3px; margin-bottom:18px; }
    .filter-tabs { display:flex; gap:6px; margin-bottom:20px; flex-wrap:wrap; }
    .ftab { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:20px; border:1.5px solid #e8e8e8; background:#fff; font-size:13px; cursor:pointer; color:#666; font-family:inherit; transition:all .15s; }
    .ftab.active { background:#0F6E56; color:#fff; border-color:#0F6E56; }
    .badge { background:rgba(255,255,255,.25); font-size:11px; font-weight:700; padding:1px 7px; border-radius:10px; }
    .ftab:not(.active) .badge { background:#e8e8e8; color:#555; }
    .error-box { background:#FEF2F2; color:#D84040; border-radius:12px; padding:13px 16px; margin-bottom:16px; display:flex; align-items:center; gap:10px; font-size:13px; }
    .error-box button { margin-left:auto; padding:5px 12px; background:#D84040; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:12px; font-family:inherit; }
    .loading { display:flex; flex-direction:column; align-items:center; gap:10px; padding:60px; color:#888; font-size:14px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#0F6E56; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}
    .empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:60px 20px; background:#fff; border-radius:16px; text-align:center; box-shadow:0 1px 6px rgba(0,0,0,.06); }
    .empty-icon { width:72px; height:72px; background:#f5f5f5; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .empty-title { font-size:16px; font-weight:700; color:#444; }
    .empty-hint { font-size:13px; color:#aaa; max-width:280px; line-height:1.5; }
    .req-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:14px; }
    @media(max-width:480px){ .req-grid{grid-template-columns:1fr;} }
    .req-card { background:#fff; border-radius:16px; padding:16px; box-shadow:0 1px 8px rgba(0,0,0,.07); text-decoration:none; color:inherit; display:flex; flex-direction:column; gap:10px; cursor:pointer; border:1.5px solid #f0f0f0; transition:transform .15s,box-shadow .15s; }
    .req-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.1); }
    .card-top { display:flex; align-items:flex-start; gap:12px; }
    .pat-avatar { width:48px; height:48px; border-radius:50%; color:#fff; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .pat-info { flex:1; min-width:0; }
    .pat-name { font-size:16px; font-weight:700; color:#111; margin-bottom:3px; }
    .pat-phone { font-size:12px; color:#888; display:flex; align-items:center; gap:4px; }
    .status-pill { font-size:11px; padding:4px 12px; border-radius:20px; font-weight:700; white-space:nowrap; flex-shrink:0; }
    .status-pill.pending   { background:#FEF9E7; color:#d4a017; }
    .status-pill.accepted  { background:#E1F5EE; color:#0F6E56; }
    .status-pill.completed { background:#f0f0f0; color:#555; }
    .status-pill.rejected  { background:#FEF2F2; color:#D84040; }
    .divider { height:1px; background:#f5f5f5; }
    .card-body { display:flex; flex-direction:column; gap:7px; }
    .info-row { display:flex; align-items:flex-start; gap:7px; font-size:13px; color:#555; }
    .svc { font-weight:700; color:#0F6E56; }
    .note { color:#aaa; font-style:italic; }
    .card-arrow { display:flex; justify-content:flex-end; }
  `]
})
export class RequestListComponent implements OnInit {
  private http = inject(HttpClient);
  loading      = signal(true);
  error        = signal('');
  all          = signal<any[]>([]);
  activeFilter = signal('Pending');   // default = Pending

  filters = [
    { key:'all',       label:'All'       },
    { key:'Pending',   label:'Pending'   },
    { key:'Accepted',  label:'Accepted'  },
    { key:'Completed', label:'Completed' },
    { key:'Rejected',  label:'Rejected'  },
  ];

  /**
   * THE KEY FIX: backend returns status as number OR string.
   * Always use String() first → no TypeError when calling .toLowerCase()
   * Number map:  0=Pending  1=Accepted  2=Completed  3=Rejected
   */
  normSt(r: any): string {
    const s = r?.status;
    if (s === null || s === undefined) return 'pending';
    if (typeof s === 'number') {
      const map: Record<number,string> = {0:'pending',1:'accepted',2:'completed',3:'rejected',4:'inprogress'};
      return map[s] ?? 'pending';
    }
    return String(s).toLowerCase().trim();
  }

  statusLabel(r: any): string {
    const k = this.normSt(r);
    const m: Record<string,string> = {pending:'Pending',accepted:'Accepted',completed:'Completed',rejected:'Rejected',inprogress:'In Progress'};
    return m[k] ?? String(r?.status ?? '');
  }

  filtered(): any[] {
    const f = this.activeFilter();
    if (f === 'all') return this.all();
    return this.all().filter(r => this.normSt(r) === f.toLowerCase());
  }

  countOf(key: string): number {
    if (key === 'all') return this.all().length;
    return this.all().filter(r => this.normSt(r) === key.toLowerCase()).length;
  }

  emptyHint(): string {
    const f = this.activeFilter();
    if (f === 'Pending') return 'No pending requests right now. New requests will appear here.';
    if (f === 'all')     return 'Patient requests will appear here once booked.';
    return '';
  }

  // ── Field resolution helpers ─────────────────────────────────────────────
  pName(r: any):   string { return r?.patientName ?? r?.clientName ?? r?.userName ?? '—'; }
  pPhone(r: any):  string { return r?.patientPhone ?? r?.patientPhoneNumber ?? r?.phoneNumber ?? ''; }
  svcType(r: any): string { return r?.serviceType ?? r?.serviceDescription ?? ''; }
  svcTime(r: any): string { return r?.requestedTime ?? r?.scheduledAt ?? r?.createdAt ?? ''; }
  svcAddr(r: any): string { return r?.patientAddress ?? r?.address ?? r?.location ?? ''; }
  svcNotes(r: any): string {
    const n = r?.notes;
    const d = r?.serviceDescription;
    return n ?? (d && d !== this.svcType(r) ? d : '') ?? '';
  }

  initials(name: string): string {
    return (name || '?').split(' ').map((n:string)=>n[0]||'').join('').slice(0,2).toUpperCase()||'?';
  }

  avatarColor(name: string): string {
    const c=['#0F6E56','#185FA5','#d4a017','#7C3AED','#D84040','#2D4A8A'];
    return c[(name||'').charCodeAt(0)%c.length]||'#0F6E56';
  }

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<any>(`${environment.apiUrl}/HomeService/NurseRequests`).subscribe({
      next: (res: any) => {
        try {
          let data: any[] = [];
          if      (Array.isArray(res))             data = res;
          else if (Array.isArray(res?.data))        data = res.data;
          else if (Array.isArray(res?.data?.items)) data = res.data.items;
          else                                      data = [];

          console.log('[RequestList] count:', data.length);
          if (data[0]) console.log('[RequestList] sample:', JSON.stringify(data[0]));
          this.all.set(data);
        } catch(e: any) {
          console.error('[RequestList] parse error:', e);
          this.error.set('Parse error: ' + e?.message);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        const msg = err?.error?.message ?? `HTTP ${err?.status ?? 'error'}`;
        console.error('[RequestList] HTTP error:', err);
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
