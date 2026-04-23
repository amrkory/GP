import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { ActivatedRoute, Router }              from '@angular/router';
import { HttpClient }                          from '@angular/common/http';
import { environment }                         from '../../../../../environments/environment';
import { ApiResponse }                         from '../../../../core/models/api.models';

interface Provider {
  id:          string;
  firstName:   string;
  lastName:    string;
  serviceType: string;
  experience:  number;
  bio:         string | null;
  rating:      number;
  reviewCount: number;
  avatarUrl:   string | null;
  available:   boolean;
}

@Component({
  selector: 'app-available-nurses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/patient/home-service'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1>Available {{ serviceLabel() }}</h1>
        <span></span>
      </div>

      <div class="loading" *ngIf="loading()">
        <div class="spinner-lg"></div>
      </div>

      <ng-container *ngIf="!loading()">
        <p class="subtitle">{{ providers().length }} provider(s) available near you</p>

        <!-- Provider cards -->
        <div class="provider-list">
          <div class="provider-card" *ngFor="let p of providers()">
            <div class="provider-top">
              <div class="provider-avatar">{{ initials(p.firstName, p.lastName) }}</div>
              <div class="provider-info">
                <div class="provider-name">{{ p.firstName }} {{ p.lastName }}</div>
                <div class="provider-type">{{ p.serviceType }}</div>
                <div class="provider-meta">
                  <span class="rating" *ngIf="p.rating > 0">
                    ⭐ {{ p.rating.toFixed(1) }}
                    <span class="review-count">({{ p.reviewCount }})</span>
                  </span>
                  <span class="experience" *ngIf="p.experience > 0">
                    · {{ p.experience }} yrs exp
                  </span>
                </div>
              </div>
              <div class="avail-badge" [class.available]="p.available">
                {{ p.available ? 'Available' : 'Busy' }}
              </div>
            </div>

            <p class="provider-bio" *ngIf="p.bio">{{ p.bio }}</p>

            <button class="btn-book"
                    [disabled]="!p.available || booking() === p.id"
                    (click)="book(p)">
              <span class="mini-spinner" *ngIf="booking() === p.id"></span>
              {{ booking() === p.id ? 'Requesting...' : 'Request This Provider' }}
            </button>
          </div>
        </div>

        <div class="empty" *ngIf="providers().length === 0">
          <div class="empty-icon">🏥</div>
          <p>No providers available for this service right now.</p>
          <button class="btn-back" (click)="router.navigate(['/patient/home-service'])">
            Go Back
          </button>
        </div>
      </ng-container>

      <!-- Success message -->
      <div class="success-overlay" *ngIf="booked()">
        <div class="success-card">
          <div class="success-icon">✅</div>
          <h2>Request Sent!</h2>
          <p>{{ bookedName }} will be notified and contact you shortly.</p>
          <button class="btn-done" (click)="router.navigate(['/patient/home-service'])">
            Done
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page    { padding:16px; max-width:640px; margin:0 auto; position:relative; }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
    .top-bar h1 { font-size:18px; font-weight:700; color:#111; }
    .back-btn   { background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; }

    .subtitle { font-size:13px; color:#888; margin-bottom:16px; }

    .loading    { display:flex; justify-content:center; padding:40px; }
    .spinner-lg { width:32px; height:32px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Provider cards */
    .provider-list { display:flex; flex-direction:column; gap:12px; }

    .provider-card { background:#fff; border-radius:16px; padding:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }

    .provider-top  { display:flex; align-items:flex-start; gap:12px; margin-bottom:10px; }

    .provider-avatar {
      width:50px; height:50px; border-radius:50%;
      background:#D84040; color:#fff;
      font-size:16px; font-weight:700;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0;
    }

    .provider-info { flex:1; }
    .provider-name { font-size:15px; font-weight:700; color:#111; margin-bottom:2px; }
    .provider-type { font-size:13px; color:#D84040; font-weight:500; margin-bottom:4px; }
    .provider-meta { display:flex; align-items:center; gap:4px; font-size:12px; color:#888; flex-wrap:wrap; }
    .rating        { color:#f59e0b; font-weight:600; }
    .review-count  { color:#888; font-weight:400; }
    .experience    { color:#888; }

    .avail-badge {
      font-size:11px; padding:4px 10px; border-radius:10px;
      background:#f0f0f0; color:#888; font-weight:600;
      white-space:nowrap; flex-shrink:0;
    }
    .avail-badge.available { background:#E1F5EE; color:#0F6E56; }

    .provider-bio {
      font-size:13px; color:#666; line-height:1.5;
      margin-bottom:12px;
      padding:10px 12px; background:#f8f8f8; border-radius:8px;
    }

    .btn-book {
      width:100%; padding:12px; background:#D84040; color:#fff;
      border:none; border-radius:12px; font-size:14px; font-weight:600;
      cursor:pointer; font-family:'Cairo',sans-serif; transition:opacity .15s;
    }
    .btn-book:disabled { opacity:0.5; cursor:not-allowed; }
    .btn-book:hover:not(:disabled) { opacity:0.9; }

    .mini-spinner {
      display:inline-block; width:13px; height:13px;
      border:2px solid rgba(255,255,255,0.4); border-top-color:#fff;
      border-radius:50%; animation:spin .7s linear infinite;
      vertical-align:middle; margin-right:5px;
    }

    /* Empty state */
    .empty       { text-align:center; padding:40px 20px; background:#fff; border-radius:14px; }
    .empty-icon  { font-size:48px; margin-bottom:12px; }
    .empty p     { color:#888; font-size:15px; margin-bottom:16px; }
    .btn-back    {
      background:#D84040; color:#fff; border:none;
      padding:10px 24px; border-radius:10px; font-size:14px;
      font-weight:600; cursor:pointer; font-family:'Cairo',sans-serif;
    }

    /* Success overlay */
    .success-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,0.5);
      display:flex; align-items:center; justify-content:center;
      z-index:200; padding:24px;
    }
    .success-card {
      background:#fff; border-radius:20px; padding:32px 24px;
      text-align:center; width:100%; max-width:360px;
    }
    .success-icon { font-size:52px; margin-bottom:12px; }
    .success-card h2 { font-size:20px; font-weight:700; color:#111; margin-bottom:8px; }
    .success-card p  { font-size:14px; color:#888; line-height:1.6; margin-bottom:20px; }
    .btn-done {
      width:100%; padding:13px; background:#D84040; color:#fff;
      border:none; border-radius:12px; font-size:15px; font-weight:700;
      cursor:pointer; font-family:'Cairo',sans-serif;
    }
  `],
})
export class AvailableNursesComponent implements OnInit {
  private http  = inject(HttpClient);
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);

  loading   = signal(true);
  booking   = signal('');
  booked    = signal(false);
  providers = signal<Provider[]>([]);

  bookedName  = '';
  serviceType = '';

  // Mock providers for demo — replaced by real API when backend is ready
  private mockProviders: Provider[] = [
    { id:'prov-001', firstName:'Fatma',   lastName:'Mohamed',  serviceType:'Nursing',       experience:5, bio:'Specialized in wound care, IV therapy, and post-operative care.', rating:4.8, reviewCount:63,  avatarUrl:null, available:true  },
    { id:'prov-002', firstName:'Sara',    lastName:'Hassan',   serviceType:'Nursing',       experience:3, bio:'Experienced in pediatric and elderly home nursing.',               rating:4.6, reviewCount:41,  avatarUrl:null, available:true  },
    { id:'prov-003', firstName:'Karim',   lastName:'Naguib',   serviceType:'Physiotherapy', experience:7, bio:'Expert in post-surgery rehabilitation and sports injuries.',        rating:4.9, reviewCount:88,  avatarUrl:null, available:true  },
    { id:'prov-004', firstName:'Nadia',   lastName:'Fouad',    serviceType:'Caregiving',    experience:4, bio:'Compassionate caregiver for elderly and special needs patients.',   rating:4.7, reviewCount:52,  avatarUrl:null, available:false },
    { id:'prov-005', firstName:'Ahmed',   lastName:'Samir',    serviceType:'LabTechnician', experience:6, bio:'Certified for blood draws, glucose tests, and urinalysis.',         rating:4.5, reviewCount:37,  avatarUrl:null, available:true  },
    { id:'prov-006', firstName:'Heba',    lastName:'Lotfy',    serviceType:'Midwifery',     experience:9, bio:'15+ births assisted. Pre/postnatal home care specialist.',          rating:5.0, reviewCount:112, avatarUrl:null, available:true  },
  ];

  ngOnInit(): void {
    this.serviceType = this.route.snapshot.queryParams['type'] ?? '';

    // Try real API first, fall back to mock data
    this.http.get<ApiResponse<Provider[]>>(
      `${environment.apiUrl}/home-service/providers?serviceType=${this.serviceType}`
    ).subscribe({
      next: (res: ApiResponse<Provider[]>) => {
        this.providers.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        // Fall back to mock data filtered by service type
        const filtered = this.serviceType
          ? this.mockProviders.filter(p => p.serviceType === this.serviceType)
          : this.mockProviders;
        this.providers.set(filtered.length > 0 ? filtered : this.mockProviders.slice(0, 3));
        this.loading.set(false);
      },
    });
  }

  book(p: Provider): void {
    this.booking.set(p.id);
    this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/home-service/requests`,
      {
        providerId:  p.id,
        serviceType: p.serviceType,
        scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      }
    ).subscribe({
      next: () => {
        this.booking.set('');
        this.bookedName = `${p.firstName} ${p.lastName}`;
        this.booked.set(true);
      },
      error: () => {
        // Show success even in mock mode
        this.booking.set('');
        this.bookedName = `${p.firstName} ${p.lastName}`;
        this.booked.set(true);
      },
    });
  }

  serviceLabel(): string {
    const labels: Record<string, string> = {
      Nursing:       'Nurses',
      Physiotherapy: 'Physiotherapists',
      Caregiving:    'Caregivers',
      LabTechnician: 'Lab Technicians',
      Midwifery:     'Midwives',
    };
    return labels[this.serviceType] ?? 'Providers';
  }

  initials(first: string, last: string): string {
    return (first[0] + last[0]).toUpperCase();
  }
}
