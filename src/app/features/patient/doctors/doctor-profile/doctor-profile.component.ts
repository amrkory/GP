/**
 * doctor-profile.component.ts
 * Route: /patient/doctors/:doctorId
 *
 * Shows full doctor profile to a patient.
 * Data sources (tries in order):
 *   1. GET /api/Appointment/patient-details/{doctorId}  ← has doctor info
 *   2. GET /api/Profile/patientData?userId={doctorId}   ← fallback
 *   3. Data passed via router state from book-appointment
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../../../environments/environment';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">

  <!-- Back -->
  <button class="back-btn" (click)="router.navigate(['/patient/appointments/book'])">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
    Back to Doctors
  </button>

  <!-- Loading -->
  <div class="loading" *ngIf="loading()">
    <div class="spinner"></div>
  </div>

  <ng-container *ngIf="!loading()">

    <!-- Hero card -->
    <div class="hero-card">
      <div class="hero-left">
        <div class="av-circle" [style.background]="clr(fullName())">{{ ini(fullName()) }}</div>
        <div class="hero-info">
          <h1>Dr. {{ fullName() }}</h1>
          <div class="spec-tag" *ngIf="doctor()?.specialization || doctor()?.specialtyName">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            {{ doctor()?.specialization || doctor()?.specialtyName }}
          </div>
          <div class="hero-meta">
            <span *ngIf="doctor()?.workPlace || doctor()?.clinicName">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              {{ doctor()?.workPlace || doctor()?.clinicName }}
            </span>
            <span *ngIf="doctor()?.experienceYears">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ doctor()?.experienceYears }} years experience
            </span>
          </div>
        </div>
      </div>
      <button class="btn-book" (click)="bookWithDoctor()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Book Appointment
      </button>
    </div>

    <!-- Content grid -->
    <div class="profile-grid">

      <!-- Left column -->
      <div class="col-left">

        <!-- About -->
        <div class="info-card" *ngIf="doctor()?.bio || doctor()?.about || doctor()?.education || doctor()?.certifications">
          <div class="card-title">About</div>
          <p class="bio" *ngIf="doctor()?.bio || doctor()?.about">
            {{ doctor()?.bio || doctor()?.about }}
          </p>
          <div class="info-row" *ngIf="doctor()?.education">
            <div class="info-lbl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              Education
            </div>
            <div class="info-val">{{ doctor()?.education }}</div>
          </div>
          <div class="info-row" *ngIf="doctor()?.certifications">
            <div class="info-lbl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <circle cx="12" cy="8" r="6"/>
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
              </svg>
              Certifications
            </div>
            <div class="info-val">{{ doctor()?.certifications }}</div>
          </div>
        </div>

        <!-- Professional Details -->
        <div class="info-card">
          <div class="card-title">Professional Details</div>
          <div class="info-row">
            <div class="info-lbl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Specialty
            </div>
            <div class="info-val">{{ doctor()?.specialization || doctor()?.specialtyName || '—' }}</div>
          </div>
          <div class="info-row" *ngIf="doctor()?.workPlace || doctor()?.clinicName">
            <div class="info-lbl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              Workplace
            </div>
            <div class="info-val">{{ doctor()?.workPlace || doctor()?.clinicName }}</div>
          </div>
          <div class="info-row" *ngIf="doctor()?.experienceYears">
            <div class="info-lbl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Experience
            </div>
            <div class="info-val">{{ doctor()?.experienceYears }} years</div>
          </div>
          <div class="info-row" *ngIf="doctor()?.licenseNumber">
            <div class="info-lbl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              License
            </div>
            <div class="info-val">{{ doctor()?.licenseNumber }}</div>
          </div>
          <div class="info-row" *ngIf="doctor()?.phoneNumber">
            <div class="info-lbl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Phone
            </div>
            <div class="info-val">{{ doctor()?.phoneNumber }}</div>
          </div>
        </div>

      </div>

      <!-- Right column -->
      <div class="col-right">

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-val">{{ doctor()?.experienceYears || '—' }}</div>
            <div class="stat-lbl">Years Exp.</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">{{ doctor()?.specialization || doctor()?.specialtyName ? '✓' : '—' }}</div>
            <div class="stat-lbl">Specialist</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" [style.color]="'#22c55e'">Active</div>
            <div class="stat-lbl">Status</div>
          </div>
        </div>

        <!-- Book CTA -->
        <div class="book-cta">
          <div class="cta-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h3>Ready to book?</h3>
          <p>Schedule an appointment with Dr. {{ fullName() }} and get the care you need.</p>
          <button class="btn-book-cta" (click)="bookWithDoctor()">
            Book Appointment
          </button>
        </div>

        <!-- Contact card -->
        <div class="info-card" *ngIf="doctor()?.email">
          <div class="card-title">Contact</div>
          <div class="info-row">
            <div class="info-lbl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              Email
            </div>
            <div class="info-val">{{ doctor()?.email }}</div>
          </div>
        </div>

      </div>
    </div>

  </ng-container>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{width:100%;font-family:'Cairo','Segoe UI',sans-serif;padding-bottom:40px;}
    @keyframes sp{to{transform:rotate(360deg);}}

    .back-btn{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1.5px solid #E8ECF0;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;color:#6B7280;cursor:pointer;font-family:inherit;margin-bottom:20px;transition:background .12s;}
    .back-btn:hover{background:#F4F6FA;}

    .loading{display:flex;justify-content:center;padding:56px;}
    .spinner{width:26px;height:26px;border:3px solid #F0F2F5;border-top-color:#D84040;border-radius:50%;animation:sp .7s linear infinite;}

    /* Hero card */
    .hero-card{background:#fff;border-radius:20px;padding:24px;border:1px solid #F0F2F5;box-shadow:0 2px 12px rgba(0,0,0,.06);margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
    .hero-left{display:flex;align-items:center;gap:16px;}
    .av-circle{width:80px;height:80px;border-radius:50%;color:#fff;font-size:26px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    h1{font-size:22px;font-weight:800;color:#111;margin-bottom:6px;}
    .spec-tag{display:inline-flex;align-items:center;gap:5px;background:#EEF2FF;color:#2D4A8A;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;margin-bottom:8px;}
    .hero-meta{display:flex;flex-wrap:wrap;gap:14px;}
    .hero-meta span{display:flex;align-items:center;gap:5px;font-size:12px;color:#6B7280;}
    .btn-book{display:flex;align-items:center;gap:8px;padding:12px 22px;background:#D84040;color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:background .15s;flex-shrink:0;}
    .btn-book:hover{background:#B93030;}

    /* Grid */
    .profile-grid{display:grid;grid-template-columns:1fr 300px;gap:16px;align-items:start;}
    @media(max-width:1024px){.profile-grid{grid-template-columns:1fr;}}
    .col-left{display:flex;flex-direction:column;gap:14px;}
    .col-right{display:flex;flex-direction:column;gap:14px;}

    /* Info cards */
    .info-card{background:#fff;border-radius:18px;padding:20px;border:1px solid #F0F2F5;box-shadow:0 1px 6px rgba(0,0,0,.05);}
    .card-title{font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.6px;margin-bottom:14px;}
    .bio{font-size:14px;color:#374151;line-height:1.7;margin-bottom:14px;}
    .info-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #F8F9FC;}
    .info-row:last-child{border-bottom:none;padding-bottom:0;}
    .info-lbl{display:flex;align-items:center;gap:7px;font-size:13px;color:#6B7280;min-width:110px;flex-shrink:0;}
    .info-val{font-size:13px;font-weight:600;color:#111;text-align:right;word-break:break-word;}

    /* Stats row */
    .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
    .stat-box{background:#fff;border-radius:14px;padding:14px 10px;text-align:center;border:1px solid #F0F2F5;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .stat-val{font-size:20px;font-weight:800;color:#111;margin-bottom:4px;}
    .stat-lbl{font-size:11px;color:#9CA3AF;font-weight:600;}

    /* Book CTA */
    .book-cta{background:linear-gradient(135deg,#FEF2F2,#fff);border:1.5px solid #FECACA;border-radius:18px;padding:20px;text-align:center;}
    .cta-icon{width:48px;height:48px;background:#FEF2F2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;}
    .book-cta h3{font-size:15px;font-weight:700;color:#111;margin-bottom:6px;}
    .book-cta p{font-size:13px;color:#6B7280;line-height:1.5;margin-bottom:14px;}
    .btn-book-cta{width:100%;padding:12px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s;}
    .btn-book-cta:hover{background:#B93030;}
  `]
})
export class DoctorProfileComponent implements OnInit {
  private http   = inject(HttpClient);
  readonly router = inject(Router);
  private route  = inject(ActivatedRoute);

  loading = signal(true);
  doctor  = signal<any>(null);

  private doctorId = '';

  ngOnInit(): void {
    this.doctorId = this.route.snapshot.paramMap.get('doctorId') ?? '';

    // Check router state first (passed from book-appointment on card click)
    const state = history.state?.doctor;
    if (state) {
      this.doctor.set(state);
      this.loading.set(false);
      return;
    }

    // Try GET /api/Profile/patientData?userId={doctorId} 
    // (backend reuses this for any user profile lookup)
    this.http.get<any>(`${environment.apiUrl}/Profile/patientData`, {
      params: { userId: this.doctorId }
    }).subscribe({
      next: (res: any) => {
        const d = res?.data ?? res;
        if (d && (d.firstName || d.fullName || d.email)) {
          this.doctor.set(d);
          this.loading.set(false);
          return;
        }
        this.tryAppointmentDetails();
      },
      error: () => this.tryAppointmentDetails()
    });
  }

  private tryAppointmentDetails(): void {
    // GET /api/Appointment/patient-details/{id} — may contain doctor info
    this.http.get<any>(`${environment.apiUrl}/Appointment/patient-details/${this.doctorId}`).subscribe({
      next: (res: any) => {
        this.doctor.set(res?.data ?? res);
        this.loading.set(false);
      },
      error: () => {
        // Use what we have from router state or empty
        this.loading.set(false);
      }
    });
  }

  bookWithDoctor(): void {
    // Navigate to book appointment with this doctor pre-selected
    this.router.navigate(['/patient/appointments/book'], {
      state: { preselectedDoctorId: this.doctorId, doctor: this.doctor() }
    });
  }

  fullName(): string {
    const d = this.doctor();
    if (!d) return '';
    const f = d.firstName ?? d.first_name ?? '';
    const l = d.lastName  ?? d.last_name  ?? '';
    return `${f} ${l}`.trim() || d.fullName || d.name || 'Doctor';
  }

  ini(name: string): string {
    const p = name.trim().split(' ');
    return ((p[0]?.[0] ?? 'D') + (p[1]?.[0] ?? '')).toUpperCase();
  }
  private COLORS = ['#2D4A8A','#0F6E56','#D84040','#7C3AED','#0891B2'];
  clr(n: string): string { return this.COLORS[(n?.charCodeAt(0) || 0) % this.COLORS.length]; }
}
