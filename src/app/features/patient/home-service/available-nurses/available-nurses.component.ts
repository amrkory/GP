import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { FormsModule }      from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient }       from '@angular/common/http';
import { environment }      from '../../../../../environments/environment';

@Component({
  selector: 'app-available-nurses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/patient/home-service'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="hdr-info">
          <h1>Available {{ serviceLabel() }}</h1>
          <p *ngIf="!loading()">{{ providers().length }} provider(s) available</p>
        </div>
        <span></span>
      </div>

      <!-- Address bar -->
      <div class="address-bar" *ngIf="address">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Service address: <strong>{{ address }}</strong>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Finding available providers...</p>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading() && providers().length === 0">
        <div class="empty-icon">🏥</div>
        <h3>No providers available</h3>
        <p>No approved nurses are available for this service type right now. Nurses must be registered and approved by admin.</p>
        <button class="btn-back" (click)="router.navigate(['/patient/home-service'])">Go Back</button>
      </div>

      <!-- Providers list -->
      <div class="provider-list" *ngIf="!loading() && providers().length > 0">
        <div class="provider-card" *ngFor="let p of providers()">

          <!-- Card header -->
          <div class="card-header">
            <div class="avatar" [style.background]="avatarColor(p)">
              {{ getInitials(p) }}
            </div>
            <div class="nurse-info">
              <div class="nurse-name">{{ getName(p) }}</div>
              <div class="nurse-spec">{{ getSpec(p) }}</div>
              <div class="nurse-meta">
                <span *ngIf="getExp(p) > 0">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ getExp(p) }} yrs exp
                </span>
                <span *ngIf="getRating(p) > 0">
                  ⭐ {{ getRating(p).toFixed(1) }}
                </span>
              </div>
            </div>
            <div class="status-dot" [class.active]="isActive(p)">
              {{ isActive(p) ? 'Available' : 'Busy' }}
            </div>
          </div>

          <!-- Bio -->
          <p class="bio" *ngIf="p.bio">{{ p.bio }}</p>

          <!-- Expandable profile -->
          <button class="btn-profile-toggle" (click)="toggle(p.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {{ expandedId() === p.id ? 'Hide Profile' : 'View Full Profile' }}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline *ngIf="expandedId() !== p.id" points="6 9 12 15 18 9"/>
              <polyline *ngIf="expandedId() === p.id" points="18 15 12 9 6 15"/>
            </svg>
          </button>

          <div class="profile-details" *ngIf="expandedId() === p.id">
            <div class="detail-row" *ngIf="getSpec(p)">
              <div class="detail-icon spec"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
              <div><div class="detail-lbl">Specialization</div><div class="detail-val">{{ getSpec(p) }}</div></div>
            </div>
            <div class="detail-row" *ngIf="getLicense(p)">
              <div class="detail-icon lic"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>
              <div><div class="detail-lbl">License No.</div><div class="detail-val">{{ getLicense(p) }}</div></div>
            </div>
            <div class="detail-row" *ngIf="getExp(p) > 0">
              <div class="detail-icon exp"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
              <div><div class="detail-lbl">Experience</div><div class="detail-val">{{ getExp(p) }} years</div></div>
            </div>
            <div class="detail-row" *ngIf="getPhone(p)">
              <div class="detail-icon ph"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg></div>
              <div><div class="detail-lbl">Phone</div><div class="detail-val">{{ getPhone(p) }}</div></div>
            </div>
          </div>

          <!-- Request button -->
          <button class="btn-request" (click)="book(p)"
                  [disabled]="booking() === p.id || !isActive(p)">
            <span class="mini-spin" *ngIf="booking() === p.id"></span>
            <svg *ngIf="booking() !== p.id" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {{ booking() === p.id ? 'Requesting...' : isActive(p) ? 'Request This Provider' : 'Currently Unavailable' }}
          </button>

        </div>
      </div>

    </div>

    <!-- Success overlay -->
    <div class="success-overlay" *ngIf="booked()">
      <div class="success-modal">
        <div class="success-circle">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2>Request Sent! 🎉</h2>
        <p><strong>{{ bookedName }}</strong> has been notified and will contact you shortly at:</p>
        <div class="address-pill" *ngIf="address">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ address }}
        </div>
        <button class="btn-done" (click)="router.navigate(['/patient/home-service'])">Back to Home Service</button>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { padding:20px; max-width:680px; margin:0 auto; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page { padding:14px; } }

    .top-bar { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
    .back-btn { background:none; border:none; cursor:pointer; color:#555; padding:8px; border-radius:10px; display:flex; flex-shrink:0; }
    .back-btn:hover { background:#f0f0f0; }
    .hdr-info h1 { font-size:18px; font-weight:800; color:#111; margin:0; }
    .hdr-info p { font-size:13px; color:#888; margin:2px 0 0; }

    .address-bar { display:flex; align-items:center; gap:6px; background:#FEF2F2; border-radius:10px; padding:8px 14px; font-size:13px; color:#555; margin-bottom:14px; }

    .loading { display:flex; flex-direction:column; align-items:center; padding:48px; gap:12px; color:#888; font-size:14px; }
    .spinner { width:32px; height:32px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .empty-state { text-align:center; padding:48px 24px; background:#fff; border-radius:16px; }
    .empty-icon { font-size:56px; margin-bottom:12px; }
    .empty-state h3 { font-size:18px; font-weight:700; color:#111; margin-bottom:6px; }
    .empty-state p { font-size:14px; color:#888; margin-bottom:20px; line-height:1.6; }
    .btn-back { background:#D84040; color:#fff; border:none; padding:12px 24px; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; }

    .provider-list { display:flex; flex-direction:column; gap:14px; }

    .provider-card { background:#fff; border-radius:18px; padding:18px; box-shadow:0 2px 12px rgba(0,0,0,.07); border:1.5px solid transparent; transition:border-color .15s; }
    .provider-card:hover { border-color:#f0e0e0; }

    .card-header { display:flex; align-items:flex-start; gap:14px; margin-bottom:12px; }
    .avatar { width:52px; height:52px; border-radius:50%; color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .nurse-info { flex:1; }
    .nurse-name { font-size:15px; font-weight:700; color:#111; margin-bottom:2px; }
    .nurse-spec { font-size:13px; color:#D84040; font-weight:600; margin-bottom:4px; }
    .nurse-meta { display:flex; align-items:center; gap:10px; font-size:12px; color:#888; flex-wrap:wrap; }
    .nurse-meta span { display:flex; align-items:center; gap:4px; }

    .status-dot { font-size:11px; padding:4px 12px; border-radius:20px; font-weight:700; background:#f0f0f0; color:#888; flex-shrink:0; }
    .status-dot.active { background:#E1F5EE; color:#0F6E56; }

    .bio { font-size:13px; color:#666; line-height:1.6; background:#F7F8FA; border-radius:10px; padding:10px 12px; margin-bottom:10px; }

    .btn-profile-toggle { display:flex; align-items:center; justify-content:center; gap:6px; width:100%; padding:8px; border:1.5px solid #e8e8e8; border-radius:10px; background:#fff; font-size:13px; color:#666; cursor:pointer; font-family:inherit; margin-bottom:10px; transition:all .15s; }
    .btn-profile-toggle:hover { border-color:#D84040; color:#D84040; background:#FEF2F2; }

    .profile-details { background:#F7F8FA; border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px; margin-bottom:10px; }
    .detail-row { display:flex; align-items:flex-start; gap:10px; }
    .detail-icon { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .detail-icon.spec { background:#E6F1FB; }
    .detail-icon.lic  { background:#E1F5EE; }
    .detail-icon.exp  { background:#FEF9E7; }
    .detail-icon.ph   { background:#FEF2F2; }
    .detail-lbl { font-size:11px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
    .detail-val { font-size:13px; color:#111; font-weight:600; margin-top:1px; }

    .btn-request { width:100%; padding:13px; background:#D84040; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; transition:opacity .15s; }
    .btn-request:hover:not(:disabled) { opacity:.88; }
    .btn-request:disabled { opacity:.5; cursor:not-allowed; background:#aaa; }
    .mini-spin { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }

    /* Success overlay */
    .success-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:300; padding:24px; }
    .success-modal { background:#fff; border-radius:24px; padding:32px 24px; text-align:center; width:100%; max-width:380px; box-shadow:0 20px 60px rgba(0,0,0,.2); }
    .success-circle { width:72px; height:72px; background:#E1F5EE; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .success-modal h2 { font-size:22px; font-weight:800; color:#111; margin-bottom:8px; }
    .success-modal p { font-size:14px; color:#666; line-height:1.6; margin-bottom:14px; }
    .address-pill { display:inline-flex; align-items:center; gap:6px; background:#FEF2F2; color:#D84040; font-size:13px; font-weight:600; padding:8px 16px; border-radius:20px; margin-bottom:20px; }
    .btn-done { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-done:hover { opacity:.88; }
  `],
})
export class AvailableNursesComponent implements OnInit {
  private http    = inject(HttpClient);
  readonly router = inject(Router);
  private route   = inject(ActivatedRoute);

  loading    = signal(true);
  booking    = signal('');
  booked     = signal(false);
  providers  = signal<any[]>([]);
  expandedId = signal('');
  bookedName = '';
  serviceType = '';
  address     = '';

  private avatarColors = ['#D84040','#2D4A8A','#0F6E56','#d4a017','#7C3AED','#0891B2'];

  ngOnInit(): void {
    this.serviceType = this.route.snapshot.queryParams['type'] ?? '';
    this.address     = this.route.snapshot.queryParams['address'] ?? '';
    this.loadNurses();
  }

  loadNurses(): void {
    // GET /api/HomeService/Nurses — returns approved nurses from backend
    this.http.get<any>(`${environment.apiUrl}/HomeService/Nurses`, {
      params: { pageNumber: 1, pageSize: 50 }
    }).subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
        this.providers.set(list);
        this.loading.set(false);
      },
      error: () => { this.providers.set([]); this.loading.set(false); },
    });
  }

  toggle(id: string): void { this.expandedId.set(this.expandedId() === id ? '' : id); }

  book(p: any): void {
    this.booking.set(p.id);
    const body = {
      serviceDescription: this.serviceType || this.getSpec(p) || 'Home service request',
      requestedTime:      new Date(Date.now() + 3600000).toISOString(),
      address:            this.address || 'To be confirmed',
      nurseId:            p.id,
    };
    this.http.post<any>(`${environment.apiUrl}/HomeService/book`, body).subscribe({
      next: () => {
        this.booking.set('');
        this.bookedName = this.getName(p);
        this.booked.set(true);
      },
      error: (err: any) => {
        this.booking.set('');
        const msg = err?.error?.message ?? '';
        if (msg) alert(msg);
        else { this.bookedName = this.getName(p); this.booked.set(true); }
      },
    });
  }

  serviceLabel(): string {
    const map: Record<string,string> = {
      Nursing:'Nurses', Physiotherapy:'Physiotherapists',
      LabTechnician:'Lab Technicians', HomeDoctor:'Home Doctors',
      Caregiver:'Caregivers',
    };
    return map[this.serviceType] ?? 'Providers';
  }

  getInitials(p: any): string {
    const name = this.getName(p);
    if (name === 'Provider') return '👤';
    const parts = name.split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'NR';
  }
  getName(p: any): string {
    const f = p.firstName ?? p.first_name ?? '';
    const l = p.lastName  ?? p.last_name  ?? '';
    return (`${f} ${l}`).trim() || 'Provider';
  }
  getSpec(p: any): string {
    return p.specialization ?? p.serviceType ?? p.specialtyName ?? p.specialty ?? '';
  }
  getLicense(p: any): string  { return p.licenseNumber ?? p.license_number ?? ''; }
  getExp(p: any):     number  {
    // Make sure we don't accidentally use phone number as experience
    const raw = p.experienceYears ?? p.experience ?? p.yearsExperience ?? 0;
    const n = Number(raw);
    // Reject unrealistic values (phone numbers are > 100)
    return (n > 0 && n < 100) ? n : 0;
  }
  getPhone(p: any):   string  { return p.nursePhoneNumber ?? p.phoneNumber ?? p.phone ?? ''; }
  getRating(p: any):  number  { return p.rating ?? 0; }
  isActive(p: any):   boolean { return p.isActive !== false; }

  avatarColor(p: any): string {
    const idx = (p.firstName?.charCodeAt(0) ?? 0) % this.avatarColors.length;
    return this.avatarColors[idx];
  }
}
