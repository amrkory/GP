import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { FormsModule }                         from '@angular/forms';
import { Router, ActivatedRoute }                              from '@angular/router';
import { HttpClient }                          from '@angular/common/http';
import { environment }                         from '../../../../environments/environment';
import { ApiResponse, ServiceRequest }         from '../../../core/models/api.models';

@Component({
  selector: 'app-home-service',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header"><h1>Home Service</h1></div>

      <!-- Service type cards -->
      <div class="service-grid">
        <div class="service-card" *ngFor="let s of services"
             [class.selected]="serviceType === s.type"
             (click)="selectService(s.type)">
          <div class="svc-icon-wrap" [class.selected]="serviceType === s.type">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 [attr.stroke]="serviceType === s.type ? s.color : '#aaa'" stroke-width="2">
              <ng-container [ngSwitch]="s.type">
                <ng-container *ngSwitchCase="'Nursing'">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/>
                </ng-container>
                <ng-container *ngSwitchCase="'Physiotherapy'">
                  <circle cx="12" cy="5" r="3"/>
                  <path d="m9 22 1-5H4l6-10h4L8 17h6z"/>
                </ng-container>
                <ng-container *ngSwitchCase="'Caregiving'">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </ng-container>
                <ng-container *ngSwitchCase="'LabTechnician'">
                  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11l-4 7h14l-4-7V3"/>
                </ng-container>
                <ng-container *ngSwitchCase="'Midwifery'">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </ng-container>
                <ng-container *ngSwitchDefault>
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </ng-container>
              </ng-container>
            </svg>
          </div>
          <div class="svc-name" [class.active]="serviceType === s.type">{{ s.name }}</div>
          <div class="svc-desc">{{ s.desc }}</div>
        </div>
      </div>

      <!-- Request form -->
      <div class="form-card">
        <h3>{{ serviceType }} Request</h3>

        <div class="field">
          <label>Date &amp; Time *</label>
          <input [(ngModel)]="scheduledAt" type="datetime-local"
                 class="text-input" [min]="minDate()" />
        </div>
        <div class="field">
          <label>Address *</label>
          <input [(ngModel)]="address" placeholder="Your full address" class="text-input" />
        </div>
        <div class="field">
          <label>Notes</label>
          <textarea [(ngModel)]="notes" class="notes-input" rows="3"
                    placeholder="Any special instructions or medical notes..."></textarea>
        </div>

        <div class="or-divider"><span>or</span></div>

        <button class="btn-browse" (click)="selectService(serviceType)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Browse Available Providers
        </button>

        <div class="alert-success" *ngIf="sent()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Request sent! A provider will contact you shortly.
        </div>
        <div class="alert-error" *ngIf="err()">{{ err() }}</div>

        <button class="btn-primary" (click)="submit()"
                [disabled]="!scheduledAt || !address || sending() || sent()">
          <span class="mini-spinner" *ngIf="sending()"></span>
          {{ sending() ? 'Sending...' : sent() ? 'Request Sent!' : 'Request Service' }}
        </button>
      </div>

      <!-- My requests -->
      <div class="section" *ngIf="requests().length > 0">
        <h3>My Requests</h3>
        <div class="req-card" *ngFor="let r of requests()">
          <div class="req-header">
            <div class="req-type-wrap">
              <div class="req-type-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
              <span class="req-type">{{ r.serviceType }}</span>
            </div>
            <span class="req-status" [class]="r.status.toLowerCase()">{{ r.status }}</span>
          </div>
          <div class="req-info-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {{ r.scheduledAt | date:'EEE, MMM d · h:mm a' }}
          </div>
          <div class="req-info-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {{ r.patientAddress }}
          </div>
          <div class="req-info-row" *ngIf="r.providerName">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            {{ r.providerName }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:1100px; }
    .page-body { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    @media (max-width:768px) { .page { padding:16px; } .page-body { grid-template-columns:1fr; } }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; margin-bottom:16px; }

    .service-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; margin-bottom:16px; }
    @media (max-width:768px) { .service-grid { grid-template-columns:repeat(3,1fr); } }
    @media (max-width:480px) { .service-grid { grid-template-columns:repeat(2,1fr); } }
    .service-card { background:#fff; border-radius:12px; padding:14px 10px; text-align:center; border:1.5px solid #e8e8e8; cursor:pointer; transition:all .15s; }
    .service-card.selected { border-color:#D84040; background:#FEF2F2; }

    .svc-icon-wrap { width:44px; height:44px; border-radius:50%; background:#f5f5f5; display:flex; align-items:center; justify-content:center; margin:0 auto 8px; transition:background .15s; }
    .svc-icon-wrap.selected { background:#FEF2F2; }

    .svc-name  { font-size:13px; font-weight:600; color:#111; margin-bottom:2px; }
    .svc-name.active { color:#D84040; }
    .svc-desc  { font-size:11px; color:#888; }

    .form-card  { background:#fff; border-radius:14px; padding:20px; margin-bottom:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .form-card h3 { font-size:16px; font-weight:700; color:#111; margin-bottom:14px; }
    .field { margin-bottom:12px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:5px; }
    .text-input  { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .text-input:focus { border-color:#D84040; }
    .notes-input { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; resize:none; box-sizing:border-box; }
    .notes-input:focus { border-color:#D84040; }

    .or-divider { display:flex; align-items:center; gap:12px; margin:16px 0; color:#aaa; font-size:13px; }
    .or-divider::before,.or-divider::after { content:''; flex:1; height:1px; background:#e8e8e8; }

    .btn-browse { width:100%; padding:12px; background:#fff; border:1.5px solid #D84040; color:#D84040; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; font-family:'Cairo',sans-serif; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:16px; transition:all .15s; }
    .btn-browse:hover { background:#FEF2F2; }

    .alert-success { display:flex; align-items:center; gap:8px; background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:14px; font-weight:600; }
    .alert-error   { background:#FEF2F2; color:#D84040; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:13px; }
    .btn-primary   { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; }
    .btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
    .mini-spinner  { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .section h3 { font-size:16px; font-weight:700; color:#111; margin-bottom:10px; }
    .req-card   { background:#fff; border-radius:12px; padding:14px; margin-bottom:10px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .req-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
    .req-type-wrap { display:flex; align-items:center; gap:8px; }
    .req-type-icon { width:28px; height:28px; border-radius:8px; background:#FEF2F2; display:flex; align-items:center; justify-content:center; }
    .req-type   { font-size:14px; font-weight:600; color:#111; }
    .req-status { font-size:11px; padding:3px 9px; border-radius:8px; font-weight:600; }
    .req-status.pending    { background:#FEF9E7; color:#d4a017; }
    .req-status.accepted   { background:#E1F5EE; color:#0F6E56; }
    .req-status.inprogress { background:#E6F1FB; color:#185FA5; }
    .req-status.completed  { background:#f0f0f0; color:#555; }
    .req-status.rejected   { background:#FEF2F2; color:#D84040; }
    .req-info-row { display:flex; align-items:center; gap:6px; font-size:13px; color:#555; margin-bottom:4px; }
  `],
})
export class HomeServiceComponent implements OnInit {
  private http    = inject(HttpClient);
  readonly router = inject(Router);
  private route  = inject(ActivatedRoute);

  sending  = signal(false);
  sent     = signal(false);
  err      = signal('');
  requests = signal<ServiceRequest[]>([]);

  serviceType = 'Nursing';
  scheduledAt = '';
  address     = '';
  notes       = '';

  services = [
    { type: 'Nursing',       name: 'Nursing',    desc: 'Wound care, injections', color: '#D84040' },
    { type: 'Physiotherapy', name: 'Physio',      desc: 'Rehab & exercises',     color: '#185FA5' },
    { type: 'Caregiving',    name: 'Caregiving',  desc: 'Daily care support',    color: '#0F6E56' },
    { type: 'LabTechnician', name: 'Lab Test',    desc: 'Blood & lab tests',     color: '#d4a017' },
    { type: 'Midwifery',     name: 'Midwifery',   desc: 'Maternal support',      color: '#6B5BAD' },
    { type: 'Other',         name: 'Other',       desc: 'Other services',        color: '#888'    },
  ];

  ngOnInit(): void {
    this.http.get<ApiResponse<ServiceRequest[]>>(
      `${environment.apiUrl}/home-service/requests/mine`
    ).subscribe({
      next: (res: ApiResponse<ServiceRequest[]>) => this.requests.set(res.data),
      error: () => {},
    });
  }

  selectService(type: string): void {
    this.serviceType = type;
    this.router.navigate(['/patient/home-service/available-nurses'], { queryParams: { type: this.serviceType, address: this.address } });
  }

  submit(): void {
    if (!this.scheduledAt || !this.address) return;
    this.sending.set(true);
    this.err.set('');
    // Exact fields from /api/HomeService/book spec
    const body = {
      serviceDescription: this.notes || this.serviceType || 'Home service request',
      requestedTime:      new Date(this.scheduledAt).toISOString(),
      address:            this.address,
      nurseId:            this.route?.snapshot?.queryParams?.['nurseId'] ?? '',  // passed from available-nurses page
    };
    this.http.post<any>(`${environment.apiUrl}/HomeService/book`, body).subscribe({
      next: (res: any) => {
        const newReq = res?.data ?? res;
        this.requests.update((r: any[]) => [newReq, ...r]);
        this.sending.set(false);
        this.sent.set(true);
      },
      error: (err: any) => {
        this.sending.set(false);
        this.err.set(err?.error?.message ?? 'Failed to send request. Please try again.');
      },
    });
  }

  minDate(): string { return new Date().toISOString().slice(0, 16); }
}
