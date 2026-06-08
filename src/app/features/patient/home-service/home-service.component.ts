import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { Router }          from '@angular/router';
import { HttpClient }      from '@angular/common/http';
import { environment }     from '../../../../environments/environment';

@Component({
  selector: 'app-home-service',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <!-- Page title -->
      <div class="page-hdr">
        <div>
          <h1>Home Service</h1>
          <p class="sub">Book a healthcare provider to visit you at home</p>
        </div>
      </div>

      <!-- Service type selector -->
      <p class="section-lbl">SELECT SERVICE TYPE</p>
      <div class="service-grid">
        <div class="svc-card" *ngFor="let s of services"
             [class.active]="serviceType === s.type"
             (click)="serviceType = s.type">
          <div class="svc-ico" [style.background]="serviceType === s.type ? s.light : '#f5f5f5'">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 [attr.stroke]="serviceType === s.type ? s.color : '#aaa'" stroke-width="2">
              <ng-container [ngSwitch]="s.type">
                <ng-container *ngSwitchCase="'Nursing'">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 21.5 16h.42Z"/>
                </ng-container>
                <ng-container *ngSwitchCase="'Physiotherapy'">
                  <circle cx="12" cy="5" r="3"/><path d="m9 22 1-5H4l6-10h4L8 17h6z"/>
                </ng-container>
                <ng-container *ngSwitchCase="'Caregiver'">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </ng-container>
                <ng-container *ngSwitchCase="'LabTechnician'">
                  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11l-4 7h14l-4-7V3"/>
                </ng-container>
                <ng-container *ngSwitchCase="'Midwifery'">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </ng-container>
                <ng-container *ngSwitchDefault>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </ng-container>
              </ng-container>
            </svg>
          </div>
          <div class="svc-name" [style.color]="serviceType === s.type ? s.color : '#111'">{{ s.name }}</div>
          <div class="svc-desc">{{ s.desc }}</div>
        </div>
      </div>

      <!-- Two column layout -->
      <div class="two-col">

        <!-- Request form -->
        <div class="form-card">
          <h3>Request Details</h3>

          <div class="field">
            <label>Your Address <span class="req-mark">*</span></label>
            <input class="inp" [(ngModel)]="address" type="text"
                   placeholder="e.g. 45 Tahrir St, Cairo, Egypt" />
          </div>

          <div class="field">
            <label>Preferred Date &amp; Time <span class="req-mark">*</span></label>
            <input class="inp" [(ngModel)]="scheduledAt" type="datetime-local" [min]="minDate()" />
            <p class="field-hint">The provider will confirm availability for this time.</p>
          </div>

          <div class="field">
            <label>Notes <span class="opt">(optional)</span></label>
            <textarea class="inp ta" [(ngModel)]="notes" rows="3"
                      placeholder="Medical notes, special instructions..."></textarea>
          </div>

          <div class="alert-success" *ngIf="sent()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Request sent! A provider will contact you shortly.
          </div>
          <div class="alert-error" *ngIf="err()">{{ err() }}</div>

          <button class="btn-browse" (click)="browseProviders()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Browse Available Providers
          </button>
        </div>

        <!-- My Requests -->
        <div class="requests-col">
          <div class="requests-hdr">
            <h3>My Requests</h3>
            <span class="req-badge" *ngIf="requests().length > 0">{{ requests().length }}</span>
          </div>

          <div class="loading-sm" *ngIf="loadingReqs()">
            <div class="spin-sm"></div>
          </div>

          <div class="empty-reqs" *ngIf="!loadingReqs() && requests().length === 0">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>No service requests yet</p>
          </div>

          <div class="req-list" *ngIf="!loadingReqs() && requests().length > 0">
            <div class="req-card" *ngFor="let r of requests()">

              <!-- Top row: type + status -->
              <div class="req-top">
                <div class="req-type-ico">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                </div>
                <span class="req-type">{{ rType(r) }}</span>
                <span class="req-status" [class]="normSt(r)">{{ stLabel(r) }}</span>
              </div>

              <!-- Date -->
              <div class="req-row" *ngIf="rTime(r)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ rTime(r) | date:'EEE, MMM d · h:mm a' }}
              </div>

              <!-- Address -->
              <div class="req-row" *ngIf="rAddr(r)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ rAddr(r) }}
              </div>

              <!-- Provider name if assigned -->
              <div class="req-row provider" *ngIf="r.providerName ?? r.nurseName">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Provider: {{ r.providerName ?? r.nurseName }}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { padding:24px;  font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:14px;} }

    .page-hdr { margin-bottom:20px; }
    h1 { font-size:22px; font-weight:800; color:#111; }
    .sub { font-size:13px; color:#888; margin-top:3px; }
    .section-lbl { font-size:11px; font-weight:800; color:#aaa; letter-spacing:1px; text-transform:uppercase; margin-bottom:10px; }

    /* Service grid */
    .service-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:24px; }
    @media(max-width:900px){ .service-grid{grid-template-columns:repeat(3,1fr);} }
    @media(max-width:500px){ .service-grid{grid-template-columns:repeat(2,1fr);} }
    .svc-card { background:#fff; border-radius:14px; padding:16px 10px; text-align:center; border:1.5px solid #e8e8e8; cursor:pointer; transition:all .15s; box-shadow:0 1px 6px rgba(0,0,0,.05); }
    .svc-card:hover { border-color:#ccc; box-shadow:0 4px 14px rgba(0,0,0,.08); }
    .svc-card.active { border-color:#D84040; box-shadow:0 4px 14px rgba(216,64,64,.18); }
    .svc-ico { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; transition:background .15s; }
    .svc-name { font-size:13px; font-weight:700; margin-bottom:2px; transition:color .15s; }
    .svc-desc { font-size:11px; color:#999; line-height:1.4; }

    /* Two-col */
    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    @media(max-width:768px){ .two-col{grid-template-columns:1fr;} }

    /* Form card */
    .form-card { background:#fff; border-radius:16px; padding:22px; box-shadow:0 1px 8px rgba(0,0,0,.07); }
    .form-card h3 { font-size:17px; font-weight:800; color:#111; margin-bottom:18px; }
    .field { margin-bottom:14px; }
    .field label { display:block; font-size:13px; font-weight:700; color:#333; margin-bottom:6px; }
    .req-mark { color:#D84040; }
    .opt { font-size:12px; color:#aaa; font-weight:400; }
    .inp { width:100%; padding:11px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:inherit; outline:none; transition:border-color .15s; background:#fff; }
    .inp:focus { border-color:#D84040; }
    .ta { resize:none; }
    .field-hint { font-size:12px; color:#aaa; margin-top:5px; }

    .alert-success { display:flex; align-items:center; gap:8px; background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:11px 14px; margin-bottom:12px; font-size:13px; font-weight:600; }
    .alert-error   { background:#FEF2F2; color:#D84040; border-radius:10px; padding:11px 14px; margin-bottom:12px; font-size:13px; }

    .btn-browse { width:100%; padding:14px; background:#D84040; border:none; color:#fff; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; transition:opacity .15s; margin-top:4px; }
    .btn-browse:hover { opacity:.88; }

    /* Requests col */
    .requests-col { display:flex; flex-direction:column; }
    .requests-hdr { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
    .requests-hdr h3 { font-size:17px; font-weight:800; color:#111; }
    .req-badge { background:#D84040; color:#fff; font-size:11px; font-weight:700; padding:2px 8px; border-radius:10px; }

    .loading-sm { display:flex; justify-content:center; padding:24px; }
    .spin-sm { width:22px; height:22px; border:2px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}

    .empty-reqs { display:flex; flex-direction:column; align-items:center; gap:8px; padding:32px 20px; background:#fff; border-radius:14px; text-align:center; color:#aaa; font-size:13px; box-shadow:0 1px 6px rgba(0,0,0,.05); }

    .req-list { display:flex; flex-direction:column; gap:10px; max-height:580px; overflow-y:auto; }
    .req-card { background:#fff; border-radius:14px; padding:14px; box-shadow:0 1px 6px rgba(0,0,0,.07); border:1.5px solid #f0f0f0; }
    .req-top { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
    .req-type-ico { width:28px; height:28px; border-radius:8px; background:#FEF2F2; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .req-type { flex:1; font-size:14px; font-weight:700; color:#111; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .req-status { font-size:11px; padding:3px 10px; border-radius:20px; font-weight:700; flex-shrink:0; }
    .req-status.pending    { background:#FEF9E7; color:#d4a017; }
    .req-status.accepted   { background:#E1F5EE; color:#0F6E56; }
    .req-status.inprogress { background:#E6F1FB; color:#185FA5; }
    .req-status.completed  { background:#f0f0f0; color:#555; }
    .req-status.rejected   { background:#FEF2F2; color:#D84040; }
    .req-row { display:flex; align-items:center; gap:6px; font-size:12px; color:#666; margin-bottom:5px; }
    .req-row:last-child { margin-bottom:0; }
    .req-row.provider { color:#0F6E56; font-weight:600; }
  `]
})
export class HomeServiceComponent implements OnInit {
  private http    = inject(HttpClient);
  readonly router = inject(Router);

  loadingReqs = signal(true);
  sent        = signal(false);
  err         = signal('');
  requests    = signal<any[]>([]);

  serviceType  = 'Nursing';
  scheduledAt  = '';
  address      = '';
  notes        = '';

  services = [
    { type:'Nursing',       name:'Nursing',    desc:'Wound care, injections',  color:'#D84040', light:'#FEF2F2' },
    { type:'Physiotherapy', name:'Physio',     desc:'Rehab & exercises',       color:'#185FA5', light:'#E6F1FB' },
    { type:'Caregiver',     name:'Caregiver',  desc:'Daily care support',      color:'#0F6E56', light:'#E1F5EE' },
    { type:'LabTechnician', name:'Lab Test',   desc:'Blood & lab tests',       color:'#d4a017', light:'#FEF9E7' },
    { type:'Midwifery',     name:'Midwifery',  desc:'Maternal support',        color:'#7C3AED', light:'#F3E8FF' },
  ];

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/HomeService/PatientRequests`).subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        console.log('[HomeService] patient requests:', list.length, list[0]);
        this.requests.set(list);
        this.loadingReqs.set(false);
      },
      error: (err) => {
        console.error('[HomeService] PatientRequests error:', err);
        this.loadingReqs.set(false);
      }
    });
  }

  browseProviders(): void {
    this.router.navigate(['/patient/home-service/available-nurses'], {
      queryParams: {
        type:      this.serviceType,
        address:   this.address,
        time:      this.scheduledAt,   // ← pass chosen date/time to available-nurses
        notes:     this.notes,
      }
    });
  }

  minDate(): string { return new Date().toISOString().slice(0, 16); }

  // ── Status normalisation (same fix as everywhere) ──────────────────────
  normSt(r: any): string {
    const s = r?.status;
    if (s === null || s === undefined) return 'pending';
    if (typeof s === 'number') {
      return ({0:'pending',1:'accepted',2:'completed',3:'rejected',4:'inprogress'} as any)[s] ?? 'pending';
    }
    return String(s).toLowerCase().trim();
  }

  stLabel(r: any): string {
    const m: any = {pending:'Pending',accepted:'Accepted',completed:'Completed',rejected:'Rejected',inprogress:'In Progress'};
    return m[this.normSt(r)] ?? String(r?.status ?? '');
  }

  // ── Field helpers (try every possible backend field name) ──────────────
  rType(r: any): string { return r?.serviceType ?? r?.serviceDescription ?? 'Home Service'; }
  rTime(r: any): string { return r?.requestedTime ?? r?.scheduledAt ?? r?.createdAt ?? ''; }
  rAddr(r: any): string { return r?.patientAddress ?? r?.address ?? r?.location ?? ''; }
}
