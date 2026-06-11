import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))              return r;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.data))        return r.data;
  if (Array.isArray(r?.items))       return r.items;
  return [];
}

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">

  <!-- Back bar -->
  <div class="top-bar">
    <button class="back-btn" (click)="router.navigate(['/provider/requests'])">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <h1>Request Details</h1>
    <span></span>
  </div>

  <div class="loading" *ngIf="loading()"><div class="sp"></div></div>

  <ng-container *ngIf="!loading() && req()">

    <!-- Patient card -->
    <div class="patient-card">
      <div class="pat-av" [style.background]="clr(getName())">{{ ini(getName()) }}</div>
      <div class="pat-info">
        <div class="pat-name">{{ getName() }}</div>
        <div class="pat-phone" *ngIf="getPhone()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          {{ getPhone() }}
        </div>
        <div class="pat-addr" *ngIf="getAddress()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {{ getAddress() }}
        </div>
      </div>
      <span class="status-pill" [class]="sCls(req()!.status)">{{ req()!.status }}</span>
    </div>

    <!-- Request info -->
    <div class="info-card">
      <div class="info-title">Request Information</div>
      <div class="ir">
        <span>Service Type</span>
        <strong class="svc-badge">{{ req()!.serviceType || req()!.serviceDescription || '—' }}</strong>
      </div>
      <div class="ir">
        <span>Scheduled At</span>
        <strong>{{ (req()!.scheduledAt ?? req()!.requestedTime) | date:'EEE, MMMM d, y · h:mm a' }}</strong>
      </div>
      <div class="ir" *ngIf="req()!.notes">
        <span>Notes</span>
        <strong class="notes-val">{{ req()!.notes }}</strong>
      </div>
    </div>

    <!-- Action buttons based on status -->
    <ng-container [ngSwitch]="sCls(req()!.status)">

      <!-- PENDING: Accept or Reject -->
      <div class="action-card" *ngSwitchCase="'pending'">
        <div class="action-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          This request is waiting for your response
        </div>
        <div class="action-btns">
          <button class="btn-reject" (click)="updateStatus(false)" [disabled]="acting()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Reject
          </button>
          <button class="btn-accept" (click)="updateStatus(true)" [disabled]="acting()">
            <span class="ring" *ngIf="acting()"></span>
            <svg *ngIf="!acting()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Accept Request
          </button>
        </div>
        <div class="err-box" *ngIf="actionErr()">{{ actionErr() }}</div>
      </div>

      <!-- ACCEPTED: Record visit / Complete -->
      <div class="action-card accepted-card" *ngSwitchCase="'accepted'">
        <div class="action-title green">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Request accepted — record the visit when done
        </div>

        <!-- Visit recording form -->
        <div class="visit-form" *ngIf="!visitRecorded()">
          <div class="vf-title">Record Visit</div>
          <div class="field">
            <label>Visit Notes / Observations</label>
            <textarea [(ngModel)]="visitNotes" class="inp ta" rows="3"
                      placeholder="What was done during the visit, patient condition…"></textarea>
          </div>
          <div class="field">
            <label>Visit Date & Time</label>
            <input [(ngModel)]="visitDate" type="datetime-local" class="inp" />
          </div>
          <div class="err-box" *ngIf="actionErr()">{{ actionErr() }}</div>
          <button class="btn-complete" (click)="complete()" [disabled]="acting()">
            <span class="ring" *ngIf="acting()"></span>
            {{ acting() ? 'Completing…' : 'Mark as Completed' }}
          </button>
        </div>

        <div class="ok-box" *ngIf="visitRecorded()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Visit recorded and request completed!
        </div>
      </div>

      <!-- COMPLETED -->
      <div class="completed-banner" *ngSwitchCase="'completed'">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        This service request has been completed
      </div>

      <!-- REJECTED -->
      <div class="rejected-banner" *ngSwitchCase="'rejected'">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        This request was rejected
      </div>

    </ng-container>

  </ng-container>

  <div class="not-found" *ngIf="!loading() && !req()">
    <p>Request not found</p>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{width:100%;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .top-bar{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
    .back-btn{background:none;border:none;cursor:pointer;color:#6B7280;padding:6px;border-radius:8px;display:flex;}
    .back-btn:hover{background:#F4F6FA;}
    h1{font-size:20px;font-weight:800;color:#111;}
    .loading{display:flex;justify-content:center;padding:40px;}
    .sp{width:24px;height:24px;border:3px solid #f0f0f0;border-top-color:#0F6E56;border-radius:50%;animation:sp .7s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    /* Patient card */
    .patient-card{display:flex;align-items:flex-start;gap:14px;background:#fff;border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.05);border:1px solid #F0F2F5;}
    .pat-av{width:54px;height:54px;border-radius:50%;color:#fff;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .pat-info{flex:1;min-width:0;}
    .pat-name{font-size:17px;font-weight:700;color:#111;margin-bottom:5px;}
    .pat-phone,.pat-addr{display:flex;align-items:center;gap:6px;font-size:13px;color:#6B7280;margin-bottom:3px;}
    .status-pill{font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;flex-shrink:0;}
    .status-pill.pending  {background:#FFFBEB;color:#d4a017;}
    .status-pill.accepted {background:#ECFDF5;color:#0F6E56;}
    .status-pill.completed{background:#F0F2F5;color:#6B7280;}
    .status-pill.rejected {background:#FEF2F2;color:#D84040;}
    /* Info card */
    .info-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.05);}
    .info-title{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;}
    .ir{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-bottom:1px solid #F8F9FC;font-size:13px;gap:12px;}
    .ir:last-child{border-bottom:none;}
    .ir span{color:#888;flex-shrink:0;}
    .ir strong{color:#111;text-align:right;word-break:break-word;}
    .svc-badge{background:#ECFDF5;color:#0F6E56;padding:3px 10px;border-radius:20px;font-size:12px;}
    .notes-val{font-style:italic;color:#555;}
    /* Action cards */
    .action-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.05);border:1px solid #F0F2F5;}
    .action-title{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#d4a017;margin-bottom:14px;}
    .action-title.green{color:#0F6E56;}
    .action-btns{display:flex;gap:10px;}
    .btn-reject{flex:1;padding:12px;border:1.5px solid #fecaca;background:#FEF2F2;color:#D84040;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;}
    .btn-reject:hover:not(:disabled){background:#fee2e2;}
    .btn-accept{flex:2;padding:12px;background:#0F6E56;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;}
    .btn-accept:hover:not(:disabled){background:#0a5a45;}
    .btn-accept:disabled,.btn-reject:disabled{opacity:.5;cursor:not-allowed;}
    .ring{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite;}
    /* Visit form */
    .accepted-card{border-color:#A7F3D0;}
    .vf-title{font-size:14px;font-weight:700;color:#111;margin-bottom:12px;}
    .field{margin-bottom:12px;}
    .field label{display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:5px;}
    .inp{width:100%;padding:10px 13px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;color:#111;}
    .inp:focus{border-color:#0F6E56;box-shadow:0 0 0 3px rgba(15,110,86,.07);}
    .ta{resize:vertical;min-height:80px;}
    .btn-complete{width:100%;padding:13px;background:#0F6E56;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;}
    .btn-complete:hover:not(:disabled){background:#0a5a45;}
    .btn-complete:disabled{opacity:.5;cursor:not-allowed;}
    /* Feedback */
    .err-box{background:#FEF2F2;color:#D84040;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:13px;}
    .ok-box{display:flex;align-items:center;gap:8px;background:#ECFDF5;color:#0F6E56;border-radius:12px;padding:14px;font-size:14px;font-weight:600;}
    /* Banners */
    .completed-banner,.rejected-banner{display:flex;align-items:center;gap:10px;border-radius:14px;padding:16px;font-size:14px;font-weight:600;}
    .completed-banner{background:#ECFDF5;color:#0F6E56;}
    .rejected-banner{background:#FEF2F2;color:#D84040;}
    .not-found{text-align:center;padding:40px;color:#9CA3AF;font-size:14px;}
  `]
})
export class RequestDetailComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);

  loading      = signal(true);
  acting       = signal(false);
  visitRecorded= signal(false);
  req          = signal<any>(null);
  actionErr    = signal('');

  visitNotes = '';
  visitDate  = new Date().toISOString().slice(0,16);

  ini(n: string): string {
    const p=(n||'P').trim().split(' ');
    return ((p[0]?.[0]??'P')+(p[1]?.[0]??'')).toUpperCase();
  }
  private C=['#0F6E56','#2D4A8A','#D84040','#7C3AED','#0891B2'];
  clr(n: string): string { return this.C[(n?.charCodeAt(0)||0)%this.C.length]; }
  sCls(s: string): string { return (s??'').toLowerCase(); }

  // ── Field helpers ───────────────────────────────────────────────────────
  getName():   string { const r = this.req(); return r?.patientName ?? r?.patient?.name ?? `${r?.patient?.firstName??''} ${r?.patient?.lastName??''}`.trim() || 'Patient'; }
  getPhone():  string { const r = this.req(); return r?.patientPhone ?? r?.patient?.phoneNumber ?? r?.patient?.phone ?? r?.phoneNumber ?? ''; }
  getAddress():string { const r = this.req(); return r?.address ?? r?.patientAddress ?? r?.patient?.address ?? r?.location ?? ''; }
  getTime():   string { const r = this.req(); return r?.requestedTime ?? r?.scheduledAt ?? r?.createdAt ?? ''; }
  getDesc():   string { const r = this.req(); return r?.serviceDescription ?? r?.description ?? r?.notes ?? ''; }
  getService():string { const r = this.req(); return r?.serviceType ?? r?.serviceName ?? r?.type ?? ''; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    // Load all requests and find this one by id
    this.http.get<any>(`${environment.apiUrl}/HomeService/NurseRequests`, {
      params: { pageNumber:'1', pageSize:'100' }
    }).subscribe({
      next: (res:any) => {
        const list = Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? [];
        console.log('[RequestDetail] first:', list[0]);
        const found = list.find((r:any) => String(r.id) === id);
        this.req.set(found ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  updateStatus(accept: boolean): void {
    this.acting.set(true);
    this.actionErr.set('');
    const id = this.req()!.id;
    // PUT /api/HomeService/UpdateStatus/{requestId}?accept=true/false
    this.http.put<any>(`${environment.apiUrl}/HomeService/UpdateStatus/${id}`, null, {
      params: { accept: accept.toString() }
    }).subscribe({
      next: () => {
        this.req.update(r => ({ ...r, status: accept ? 'Accepted' : 'Rejected' }));
        this.acting.set(false);
      },
      error: (e:any) => {
        this.acting.set(false);
        this.actionErr.set(e?.error?.message ?? `Error ${e?.status}`);
      }
    });
  }

  complete(): void {
    this.acting.set(true);
    this.actionErr.set('');
    const id = this.req()!.id;
    // PUT /api/HomeService/CompleteRequest/{requestId}?complete=true
    this.http.put<any>(`${environment.apiUrl}/HomeService/CompleteRequest/${id}`, null, {
      params: { complete: 'true' }
    }).subscribe({
      next: () => {
        this.req.update(r => ({ ...r, status: 'Completed' }));
        this.acting.set(false);
        this.visitRecorded.set(true);
      },
      error: (e:any) => {
        this.acting.set(false);
        this.actionErr.set(e?.error?.message ?? `Error ${e?.status}`);
      }
    });
  }
}
