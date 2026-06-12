/**
 * Request List — Nurse/Provider side
 * GET /api/HomeService/NurseRequests
 * PUT /api/HomeService/UpdateStatus/{id}?accept=true/false
 * PUT /api/HomeService/CompleteRequest/{id}?complete=true
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient }  from '@angular/common/http';
import { RouterLink }  from '@angular/router';
import { environment } from '../../../../../environments/environment';

function toArr(res: any): any[] {
  if (Array.isArray(res))              return res;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.data))        return res.data;
  if (Array.isArray(res?.items))       return res.items;
  if (Array.isArray(res?.requests))    return res.requests;
  return [];
}

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
<div class="page">

  <!-- Header -->
  <div class="page-hdr">
    <div>
      <h1>Service Requests</h1>
      <p class="sub" *ngIf="!loading()">
        {{ all().length }} total · {{ cnt('pending') }} pending
      </p>
    </div>
    <button class="btn-refresh" (click)="load()" [disabled]="loading()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
      </svg>
      Refresh
    </button>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button class="tab" *ngFor="let t of tabs" [class.active]="tab()===t.k" (click)="tab.set(t.k)">
      {{ t.l }}
      <span class="tab-count" *ngIf="cnt(t.k) > 0">{{ cnt(t.k) }}</span>
    </button>
  </div>

  <!-- Loading -->
  <div class="loading" *ngIf="loading()">
    <div class="spinner"></div>
    <span>Loading requests…</span>
  </div>

  <!-- Empty -->
  <div class="empty" *ngIf="!loading() && filtered().length === 0">
    <div class="empty-ico">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
    <p>No {{ tab() === 'all' ? '' : tab() }} requests</p>
  </div>

  <!-- Cards -->
  <div class="card-list" *ngIf="!loading()">
    <div class="req-card" *ngFor="let r of filtered()">

      <!-- Card top: patient info + status -->
      <div class="card-top">
        <div class="pat-av" [style.background]="clr(pName(r))">{{ ini(pName(r)) }}</div>
        <div class="pat-info">
          <div class="pat-name">{{ pName(r) }}</div>
          <div class="pat-phone" *ngIf="pPhone(r)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {{ pPhone(r) }}
          </div>
        </div>
        <span class="status-badge" [class]="sCls(r)">{{ getStatus(r) }}</span>
      </div>

      <!-- Card details -->
      <div class="card-details">
        <div class="detail-row" *ngIf="r.serviceDescription || r.serviceType">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          </svg>
          <span>{{ r.serviceDescription || r.serviceType }}</span>
        </div>
        <div class="detail-row" *ngIf="r.address || r.patientAddress || r.location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{{ r.address || r.patientAddress || r.location }}</span>
        </div>
        <div class="detail-row" *ngIf="getTime(r)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{{ getTime(r) | date:'EEE, MMM d · h:mm a' }}</span>
        </div>
        <div class="detail-row" *ngIf="r.government">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          <span>{{ r.government }}</span>
        </div>
      </div>

      <!-- Patient health info (if available) -->
      <div class="health-row" *ngIf="hasHealth(r)">
        <div class="health-item" *ngIf="r.patient?.systolicPressure || r.systolicPressure">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          BP: {{ r.patient?.systolicPressure || r.systolicPressure }}/{{ r.patient?.diastolicPressure || r.diastolicPressure }}
        </div>
        <div class="health-item" *ngIf="r.patient?.heartRate || r.heartRate">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2D4A8A" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          HR: {{ r.patient?.heartRate || r.heartRate }} bpm
        </div>
        <div class="health-item" *ngIf="r.patient?.sugar || r.sugar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Sugar: {{ r.patient?.sugar || r.sugar }} mg/dL
        </div>
      </div>

      <!-- Action buttons -->
      <div class="card-actions">
        <!-- Pending: accept / reject -->
        <ng-container *ngIf="getStatus(r).toLowerCase() === 'pending'">
          <button class="btn-accept" (click)="accept(r)" [disabled]="acting===r.id">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ acting===r.id ? '…' : 'Accept' }}
          </button>
          <button class="btn-reject" (click)="reject(r)" [disabled]="acting===r.id">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            {{ acting===r.id ? '…' : 'Reject' }}
          </button>
        </ng-container>

        <!-- Accepted: complete -->
        <button class="btn-complete"
                *ngIf="getStatus(r).toLowerCase() === 'accepted'"
                (click)="complete(r)" [disabled]="acting===r.id">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {{ acting===r.id ? '…' : 'Mark Complete' }}
        </button>

        <!-- View details -->
        <a class="btn-view" [routerLink]="[r.id]">
          Details
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>
      </div>

      <!-- Inline success/error -->
      <div class="msg-ok"  *ngIf="okMsg===r.id">{{ okText }}</div>
      <div class="msg-err" *ngIf="errMsg===r.id">{{ errText }}</div>

    </div>
  </div>

</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{width:100%;font-family:'Cairo','Segoe UI',sans-serif;padding-bottom:40px;}
    @keyframes spin{to{transform:rotate(360deg);}}

    /* Header */
    .page-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#6B7280;margin-top:3px;}
    .btn-refresh{display:flex;align-items:center;gap:6px;padding:8px 14px;background:#fff;border:1.5px solid #E8ECF0;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;color:#374151;font-family:inherit;}
    .btn-refresh:hover{background:#F4F6FA;}

    /* Tabs */
    .tabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;}
    .tab{padding:7px 16px;border:1.5px solid #E8ECF0;border-radius:20px;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit;display:flex;align-items:center;gap:5px;transition:all .15s;}
    .tab:hover{border-color:#0F6E56;color:#0F6E56;}
    .tab.active{background:#0F6E56;color:#fff;border-color:#0F6E56;}
    .tab-count{background:rgba(255,255,255,.3);font-size:11px;font-weight:700;padding:1px 6px;border-radius:10px;}
    .tab.active .tab-count{background:rgba(255,255,255,.25);}
    .tab:not(.active) .tab-count{background:#F0F2F5;color:#374151;}

    /* Loading */
    .loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#6B7280;font-size:14px;}
    .spinner{width:22px;height:22px;border:2.5px solid #f0f0f0;border-top-color:#0F6E56;border-radius:50%;animation:spin .7s linear infinite;}

    /* Empty */
    .empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:56px 24px;background:#fff;border-radius:18px;border:1px solid #F0F2F5;text-align:center;}
    .empty-ico{width:64px;height:64px;background:#F4F6FA;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty p{font-size:15px;font-weight:700;color:#374151;text-transform:capitalize;}

    /* Cards */
    .card-list{display:flex;flex-direction:column;gap:12px;}
    .req-card{background:#fff;border-radius:16px;padding:16px;border:1px solid #F0F2F5;box-shadow:0 1px 6px rgba(0,0,0,.05);transition:box-shadow .15s;}
    .req-card:hover{box-shadow:0 3px 14px rgba(0,0,0,.09);}

    /* Card top */
    .card-top{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
    .pat-av{width:42px;height:42px;border-radius:50%;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .pat-info{flex:1;min-width:0;}
    .pat-name{font-size:15px;font-weight:700;color:#111;}
    .pat-phone{display:flex;align-items:center;gap:4px;font-size:12px;color:#6B7280;margin-top:2px;}
    .status-badge{font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;flex-shrink:0;text-transform:capitalize;}
    .badge-pending{background:#FFFBEB;color:#D97706;}
    .badge-accepted{background:#ECFDF5;color:#0F6E56;}
    .badge-completed{background:#EEF2FF;color:#2D4A8A;}
    .badge-rejected{background:#FEF2F2;color:#D84040;}

    /* Details */
    .card-details{display:flex;flex-direction:column;gap:6px;margin-bottom:10px;}
    .detail-row{display:flex;align-items:flex-start;gap:7px;font-size:13px;color:#374151;}
    .detail-row svg{flex-shrink:0;margin-top:1px;}

    /* Health info */
    .health-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;padding:8px 10px;background:#F8F9FC;border-radius:10px;}
    .health-item{display:flex;align-items:center;gap:5px;font-size:12px;color:#374151;font-weight:600;}

    /* Actions */
    .card-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid #F0F2F5;}
    .btn-accept{display:flex;align-items:center;gap:5px;padding:8px 16px;background:#0F6E56;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .15s;}
    .btn-accept:hover:not(:disabled){opacity:.85;}
    .btn-reject{display:flex;align-items:center;gap:5px;padding:8px 16px;background:#FEF2F2;color:#D84040;border:1.5px solid #FECACA;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
    .btn-reject:hover:not(:disabled){background:#FEE2E2;}
    .btn-complete{display:flex;align-items:center;gap:5px;padding:8px 16px;background:#EEF2FF;color:#2D4A8A;border:1.5px solid #BFDBFE;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
    .btn-complete:hover:not(:disabled){background:#DBEAFE;}
    button:disabled{opacity:.5;cursor:not-allowed;}
    .btn-view{display:flex;align-items:center;gap:4px;padding:8px 14px;background:#F4F6FA;color:#374151;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;margin-left:auto;}
    .btn-view:hover{background:#E8ECF0;}

    /* Messages */
    .msg-ok{margin-top:8px;background:#ECFDF5;color:#0F6E56;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:600;}
    .msg-err{margin-top:8px;background:#FEF2F2;color:#D84040;border-radius:8px;padding:8px 12px;font-size:13px;}
  `]
})
export class RequestListComponent implements OnInit {
  private http = inject(HttpClient);

  loading = signal(true);
  tab     = signal('all');
  all     = signal<any[]>([]);

  acting  = '';
  okMsg   = ''; okText  = '';
  errMsg  = ''; errText = '';

  tabs = [
    { k: 'all',       l: 'All'       },
    { k: 'pending',   l: 'Pending'   },
    { k: 'accepted',  l: 'Accepted'  },
    { k: 'completed', l: 'Completed' },
    { k: 'rejected',  l: 'Rejected'  },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/HomeService/NurseRequests`, {
      params: { pageNumber: '1', pageSize: '50' }
    }).subscribe({
      next: (res: any) => {
        console.log('[NurseRequests] raw:', res);
        const items = toArr(res);
        console.log('[NurseRequests] parsed:', items.length, items[0]);
        this.all.set(items);
        this.loading.set(false);
      },
      error: (e: any) => {
        console.error('[NurseRequests] error:', e);
        this.loading.set(false);
      }
    });
  }

  filtered(): any[] {
    const t = this.tab();
    if (t === 'all') return this.all();
    return this.all().filter(r => this.getStatus(r).toLowerCase() === t);
  }

  cnt(k: string): number {
    if (k === 'all') return this.all().length;
    return this.all().filter(r => this.getStatus(r).toLowerCase() === k).length;
  }

  // ── Accept ──────────────────────────────────────────────────────────────
  accept(r: any): void {
    this.acting = r.id;
    this.http.put(`${environment.apiUrl}/HomeService/UpdateStatus/${r.id}`,
      {}, { params: { accept: 'true' } }).subscribe({
      next: () => {
        this.acting = '';
        this.all.update(l => l.map(x => x.id === r.id ? { ...x, status: 'Accepted' } : x));
        this.flash(r.id, 'ok', 'Request accepted!');
      },
      error: (e: any) => { this.acting = ''; this.flash(r.id, 'err', e?.error?.message ?? 'Failed'); }
    });
  }

  // ── Reject ──────────────────────────────────────────────────────────────
  reject(r: any): void {
    this.acting = r.id;
    this.http.put(`${environment.apiUrl}/HomeService/UpdateStatus/${r.id}`,
      {}, { params: { accept: 'false' } }).subscribe({
      next: () => {
        this.acting = '';
        this.all.update(l => l.map(x => x.id === r.id ? { ...x, status: 'Rejected' } : x));
        this.flash(r.id, 'ok', 'Request rejected.');
      },
      error: (e: any) => { this.acting = ''; this.flash(r.id, 'err', e?.error?.message ?? 'Failed'); }
    });
  }

  // ── Complete ─────────────────────────────────────────────────────────────
  complete(r: any): void {
    this.acting = r.id;
    this.http.put(`${environment.apiUrl}/HomeService/CompleteRequest/${r.id}`,
      {}, { params: { complete: 'true' } }).subscribe({
      next: () => {
        this.acting = '';
        this.all.update(l => l.map(x => x.id === r.id ? { ...x, status: 'Completed' } : x));
        this.flash(r.id, 'ok', 'Marked as completed!');
      },
      error: (e: any) => { this.acting = ''; this.flash(r.id, 'err', e?.error?.message ?? 'Failed'); }
    });
  }

  private flash(id: string, type: 'ok'|'err', text: string): void {
    if (type === 'ok') { this.okMsg = id; this.okText = text; }
    else               { this.errMsg = id; this.errText = text; }
    setTimeout(() => { this.okMsg = ''; this.errMsg = ''; }, 3000);
  }

  // ── Field helpers ────────────────────────────────────────────────────────
  pName(r: any): string {
    if (r?.patientName) return r.patientName;
    const f = r?.patientFirstName ?? r?.patient?.firstName ?? '';
    const l = r?.patientLastName  ?? r?.patient?.lastName  ?? '';
    return `${f} ${l}`.trim() || r?.patient?.name || r?.patient?.fullName || 'Patient';
  }

  pPhone(r: any): string {
    return r?.patientPhone ?? r?.patient?.phoneNumber ?? r?.phoneNumber ?? '';
  }

  getStatus(r: any): string {
    return r?.status ?? r?.requestStatus ?? r?.state ?? 'Pending';
  }

  getTime(r: any): string {
    return r?.requestedTime ?? r?.scheduledAt ?? r?.createdAt ?? '';
  }

  hasHealth(r: any): boolean {
    const p = r?.patient ?? r;
    return !!(p?.systolicPressure || p?.heartRate || p?.sugar);
  }

  sCls(r: any): string {
    const s = this.getStatus(r).toLowerCase();
    if (s === 'pending')   return 'status-badge badge-pending';
    if (s === 'accepted')  return 'status-badge badge-accepted';
    if (s === 'completed') return 'status-badge badge-completed';
    if (s === 'rejected')  return 'status-badge badge-rejected';
    return 'status-badge badge-pending';
  }

  ini(n: string): string {
    const p = (n || 'P').trim().split(' ');
    return ((p[0]?.[0] ?? 'P') + (p[1]?.[0] ?? '')).toUpperCase();
  }

  private COLORS = ['#0F6E56','#2D4A8A','#D84040','#7C3AED','#0891B2','#D97706'];
  clr(n: string): string { return this.COLORS[(n?.charCodeAt(0) || 0) % this.COLORS.length]; }
}
