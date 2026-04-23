import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { FormsModule }                         from '@angular/forms';
import { Router }                              from '@angular/router';
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
          <div class="svc-icon">{{ s.icon }}</div>
          <div class="svc-name">{{ s.name }}</div>
          <div class="svc-desc">{{ s.desc }}</div>
          <div class="svc-arrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Request form -->
      <div class="form-card">
        <h3>{{ serviceIcon(serviceType) }} {{ serviceType }} Request</h3>

        <div class="field">
          <label>Date & Time *</label>
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

        <!-- Browse providers button -->
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

        <div class="alert-success" *ngIf="sent()">✅ Request sent! A provider will contact you shortly.</div>
        <div class="alert-error"   *ngIf="err()">{{ err() }}</div>

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
            <span class="req-type">{{ serviceIcon(r.serviceType) }} {{ r.serviceType }}</span>
            <span class="req-status" [class]="r.status.toLowerCase()">{{ r.status }}</span>
          </div>
          <div class="req-date">📅 {{ r.scheduledAt | date:'EEE, MMM d · h:mm a' }}</div>
          <div class="req-addr">📍 {{ r.patientAddress }}</div>
          <div class="req-provider" *ngIf="r.providerName">👤 {{ r.providerName }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:16px; max-width:640px; margin:0 auto; }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; margin-bottom:16px; }

    .service-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
    .service-card { background:#fff; border-radius:12px; padding:14px 10px; text-align:center; border:1.5px solid #e8e8e8; cursor:pointer; transition:all .15s; position:relative; }
    .service-card.selected { border-color:#D84040; background:#FEF2F2; }
    .svc-icon  { font-size:28px; margin-bottom:6px; }
    .svc-name  { font-size:13px; font-weight:600; color:#111; margin-bottom:2px; }
    .svc-desc  { font-size:11px; color:#888; }
    .svc-arrow { position:absolute; top:8px; right:8px; color:#D84040; opacity:0; transition:opacity .15s; }
    .service-card.selected .svc-name  { color:#D84040; }
    .service-card.selected .svc-arrow { opacity:1; }
    .service-card:hover .svc-arrow    { opacity:0.4; }

    .form-card  { background:#fff; border-radius:14px; padding:20px; margin-bottom:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .form-card h3 { font-size:16px; font-weight:700; color:#111; margin-bottom:14px; }
    .field { margin-bottom:12px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:5px; }
    .text-input  { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .text-input:focus  { border-color:#D84040; }
    .notes-input { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; resize:none; box-sizing:border-box; }
    .notes-input:focus { border-color:#D84040; }

    .or-divider { display:flex; align-items:center; gap:12px; margin:16px 0; color:#aaa; font-size:13px; }
    .or-divider::before,.or-divider::after { content:''; flex:1; height:1px; background:#e8e8e8; }

    .btn-browse { width:100%; padding:12px; background:#fff; border:1.5px solid #D84040; color:#D84040; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; font-family:'Cairo',sans-serif; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:16px; transition:all .15s; }
    .btn-browse:hover { background:#FEF2F2; }

    .alert-success { background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:14px; font-weight:600; }
    .alert-error   { background:#FEF2F2; color:#D84040; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:13px; }
    .btn-primary   { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; }
    .btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .section h3 { font-size:16px; font-weight:700; color:#111; margin-bottom:10px; }
    .req-card   { background:#fff; border-radius:12px; padding:14px; margin-bottom:10px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .req-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
    .req-type   { font-size:14px; font-weight:600; color:#111; }
    .req-status { font-size:11px; padding:3px 9px; border-radius:8px; font-weight:600; }
    .req-status.pending    { background:#FEF9E7; color:#d4a017; }
    .req-status.accepted   { background:#E1F5EE; color:#0F6E56; }
    .req-status.inprogress { background:#E6F1FB; color:#185FA5; }
    .req-status.completed  { background:#f0f0f0; color:#555; }
    .req-status.rejected   { background:#FEF2F2; color:#D84040; }
    .req-date,.req-addr,.req-provider { font-size:13px; color:#555; margin-bottom:3px; }
  `],
})
export class HomeServiceComponent implements OnInit {
  private http    = inject(HttpClient);
  readonly router = inject(Router);

  sending  = signal(false);
  sent     = signal(false);
  err      = signal('');
  requests = signal<ServiceRequest[]>([]);

  serviceType = 'Nursing';
  scheduledAt = '';
  address     = '';
  notes       = '';

  services = [
    { type: 'Nursing',       icon: '👩‍⚕️', name: 'Nursing',    desc: 'Wound care, injections' },
    { type: 'Physiotherapy', icon: '🏃',   name: 'Physio',      desc: 'Rehab & exercises'      },
    { type: 'Caregiving',    icon: '🤝',   name: 'Caregiving',  desc: 'Daily care support'     },
    { type: 'LabTechnician', icon: '🧪',   name: 'Lab Test',    desc: 'Blood & lab tests'      },
    { type: 'Midwifery',     icon: '🍼',   name: 'Midwifery',   desc: 'Maternal support'       },
    { type: 'Other',         icon: '➕',   name: 'Other',       desc: 'Other services'         },
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
    this.router.navigate(
      ['/patient/home-service/available-nurses'],
      { queryParams: { type } }
    );
  }

  submit(): void {
    if (!this.scheduledAt || !this.address) return;
    this.sending.set(true);
    this.err.set('');
    this.http.post<ApiResponse<ServiceRequest>>(
      `${environment.apiUrl}/home-service/requests`,
      {
        serviceType: this.serviceType,
        scheduledAt: this.scheduledAt,
        address:     this.address,
        notes:       this.notes || undefined,
      }
    ).subscribe({
      next: (res: ApiResponse<ServiceRequest>) => {
        this.requests.update(r => [res.data, ...r]);
        this.sending.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.sending.set(false);
        this.err.set('Failed to send request. Please try again.');
      },
    });
  }

  serviceIcon(type: string): string {
    return this.services.find(s => s.type === type)?.icon ?? '➕';
  }

  minDate(): string { return new Date().toISOString().slice(0, 16); }
}
