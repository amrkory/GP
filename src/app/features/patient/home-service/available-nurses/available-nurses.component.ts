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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1>Available {{ serviceLabel() }}</h1>
          <p class="sub" *ngIf="!loading()">{{ providers().length }} provider(s) available near you</p>
        </div>
        <span></span>
      </div>

      <!-- Booking summary bar -->
      <div class="summary-bar" *ngIf="address || chosenTime">
        <div class="sb-item" *ngIf="address">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {{ address }}
        </div>
        <div class="sb-item" *ngIf="chosenTime">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {{ chosenTime | date:'EEE, MMM d · h:mm a' }}
        </div>
      </div>

      <!-- No address/time warning -->
      <div class="warn-bar" *ngIf="!address || !chosenTime">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>
          {{ !address && !chosenTime ? 'Add your address and preferred time before booking.' :
             !address ? 'Add your address before booking.' :
             'Choose a preferred date & time before booking.' }}
        </span>
        <button class="warn-btn" (click)="router.navigate(['/patient/home-service'])">← Go back</button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Finding available providers...</p>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading() && providers().length === 0">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h3>No Providers Available</h3>
        <p>No approved providers are available for this service right now.</p>
        <button class="btn-back-em" (click)="router.navigate(['/patient/home-service'])">Go Back</button>
      </div>

      <!-- Provider cards -->
      <div class="provider-list" *ngIf="!loading() && providers().length > 0">
        <div class="provider-card" *ngFor="let p of providers()">

          <!-- Card header -->
          <div class="card-top">
            <div class="avatar" [style.background]="avatarColor(p)">{{ getInitials(p) }}</div>
            <div class="prov-info">
              <div class="prov-name">{{ getName(p) }}</div>
              <div class="prov-spec">{{ getSpec(p) }}</div>
              <div class="prov-meta">
                <span *ngIf="getExp(p) > 0" class="chip">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ getExp(p) }} yrs exp
                </span>
                <span *ngIf="getRating(p) > 0" class="chip star">
                  ⭐ {{ getRating(p).toFixed(1) }}
                </span>
              </div>
            </div>
            <span class="avail-badge" [class.active]="isActive(p)">
              {{ isActive(p) ? 'Available' : 'Busy' }}
            </span>
          </div>

          <!-- Bio -->
          <p class="bio" *ngIf="p.bio">{{ p.bio }}</p>

          <!-- Expand profile -->
          <button class="btn-toggle" (click)="toggle(p.id)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            {{ expandedId() === p.id ? 'Hide Profile ↑' : 'View Full Profile ↓' }}
          </button>

          <div class="profile-details" *ngIf="expandedId() === p.id">
            <div class="det-row" *ngIf="getSpec(p)">
              <div class="det-ico blue"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
              <div><div class="det-lbl">SPECIALIZATION</div><div class="det-val">{{ getSpec(p) }}</div></div>
            </div>
            <div class="det-row" *ngIf="getExp(p) > 0">
              <div class="det-ico yellow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
              <div><div class="det-lbl">EXPERIENCE</div><div class="det-val">{{ getExp(p) }} years</div></div>
            </div>
            <div class="det-row" *ngIf="getLicense(p)">
              <div class="det-ico green"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>
              <div><div class="det-lbl">LICENSE</div><div class="det-val">{{ getLicense(p) }}</div></div>
            </div>
            <div class="det-row" *ngIf="getPhone(p)">
              <div class="det-ico red"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg></div>
              <div><div class="det-lbl">PHONE</div><div class="det-val">{{ getPhone(p) }}</div></div>
            </div>
          </div>

          <!-- Book button -->
          <button class="btn-request"
                  (click)="book(p)"
                  [disabled]="booking() === p.id || !isActive(p)">
            <span class="mini-spin" *ngIf="booking() === p.id"></span>
            <svg *ngIf="booking() !== p.id" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {{ booking() === p.id ? 'Booking...' : !isActive(p) ? 'Currently Unavailable' : 'Request This Provider' }}
          </button>

        </div>
      </div>
    </div>

    <!-- Success overlay -->
    <div class="success-overlay" *ngIf="booked()">
      <div class="success-modal">
        <div class="success-circle">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2>Request Sent! 🎉</h2>
        <p><strong>{{ bookedName }}</strong> has been notified and will contact you shortly.</p>
        <div class="confirm-details">
          <div *ngIf="address" class="confirm-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ address }}
          </div>
          <div *ngIf="chosenTime" class="confirm-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ chosenTime | date:'EEE, MMM d, y · h:mm a' }}
          </div>
        </div>
        <button class="btn-done" (click)="router.navigate(['/patient/home-service'])">
          Back to Home Service
        </button>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { padding:22px; max-width:720px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:14px;} }

    .top-bar { display:flex; align-items:flex-start; gap:12px; margin-bottom:14px; }
    .back-btn { background:#f5f5f5; border:none; cursor:pointer; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
    .back-btn:hover { background:#eee; }
    h1 { font-size:20px; font-weight:800; color:#111; }
    .sub { font-size:13px; color:#888; margin-top:2px; }

    .summary-bar { display:flex; flex-direction:column; gap:6px; background:#F7F8FA; border-radius:12px; padding:12px 16px; margin-bottom:14px; border:1px solid #e8e8e8; }
    .sb-item { display:flex; align-items:center; gap:7px; font-size:13px; color:#555; font-weight:500; }

    .warn-bar { display:flex; align-items:center; gap:8px; background:#FEF9E7; border-radius:12px; padding:12px 16px; margin-bottom:14px; font-size:13px; color:#d4a017; flex-wrap:wrap; }
    .warn-btn { margin-left:auto; padding:5px 12px; background:#d4a017; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:12px; font-family:inherit; }

    .loading { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px; color:#888; font-size:14px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}

    .empty-state { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px 20px; background:#fff; border-radius:20px; text-align:center; box-shadow:0 1px 8px rgba(0,0,0,.06); }
    .empty-icon { width:72px; height:72px; background:#f5f5f5; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .empty-state h3 { font-size:17px; font-weight:700; color:#333; }
    .empty-state p  { font-size:13px; color:#888; max-width:260px; line-height:1.6; }
    .btn-back-em { padding:10px 22px; background:#D84040; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }

    .provider-list { display:flex; flex-direction:column; gap:14px; }
    .provider-card { background:#fff; border-radius:18px; padding:18px; box-shadow:0 2px 12px rgba(0,0,0,.07); border:1.5px solid #f0f0f0; transition:box-shadow .15s; }
    .provider-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.1); }

    .card-top { display:flex; align-items:flex-start; gap:14px; margin-bottom:12px; }
    .avatar { width:54px; height:54px; border-radius:50%; color:#fff; font-size:17px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .prov-info { flex:1; min-width:0; }
    .prov-name { font-size:16px; font-weight:800; color:#111; margin-bottom:2px; }
    .prov-spec { font-size:13px; color:#D84040; font-weight:600; margin-bottom:5px; }
    .prov-meta { display:flex; gap:8px; flex-wrap:wrap; }
    .chip { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#666; background:#F7F8FA; padding:3px 8px; border-radius:8px; }
    .chip.star { background:#FEF9E7; color:#d4a017; }
    .avail-badge { font-size:11px; padding:5px 12px; border-radius:20px; font-weight:700; background:#f0f0f0; color:#888; flex-shrink:0; white-space:nowrap; }
    .avail-badge.active { background:#E1F5EE; color:#0F6E56; }

    .bio { font-size:13px; color:#666; line-height:1.6; background:#F7F8FA; border-radius:10px; padding:10px 12px; margin-bottom:12px; }

    .btn-toggle { display:flex; align-items:center; justify-content:center; gap:6px; width:100%; padding:9px; border:1.5px solid #e8e8e8; border-radius:10px; background:#fff; font-size:12px; color:#666; cursor:pointer; font-family:inherit; margin-bottom:12px; transition:all .15s; }
    .btn-toggle:hover { border-color:#D84040; color:#D84040; background:#fff5f5; }

    .profile-details { background:#F7F8FA; border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px; margin-bottom:12px; }
    .det-row { display:flex; align-items:flex-start; gap:10px; }
    .det-ico { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .det-ico.blue   { background:#E6F1FB; }
    .det-ico.yellow { background:#FEF9E7; }
    .det-ico.green  { background:#E1F5EE; }
    .det-ico.red    { background:#FEF2F2; }
    .det-lbl { font-size:10px; font-weight:800; color:#aaa; letter-spacing:.5px; margin-bottom:2px; }
    .det-val { font-size:13px; color:#111; font-weight:600; }

    .btn-request { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; transition:opacity .15s; }
    .btn-request:hover:not(:disabled){ opacity:.88; }
    .btn-request:disabled { opacity:.5; cursor:not-allowed; background:#aaa; }
    .mini-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }

    /* Success overlay */
    .success-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:300; padding:24px; }
    .success-modal { background:#fff; border-radius:24px; padding:32px 24px; text-align:center; width:100%; max-width:380px; box-shadow:0 20px 60px rgba(0,0,0,.2); }
    .success-circle { width:72px; height:72px; background:#E1F5EE; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .success-modal h2 { font-size:22px; font-weight:800; color:#111; margin-bottom:8px; }
    .success-modal p  { font-size:14px; color:#666; line-height:1.6; margin-bottom:16px; }
    .confirm-details { background:#F7F8FA; border-radius:12px; padding:12px 16px; margin-bottom:20px; display:flex; flex-direction:column; gap:8px; text-align:left; }
    .confirm-row { display:flex; align-items:center; gap:7px; font-size:13px; color:#555; font-weight:500; }
    .btn-done { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-done:hover { opacity:.88; }
  `]
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

  bookedName   = '';
  serviceType  = '';
  address      = '';
  chosenTime   = '';   // date/time chosen on the previous page
  notes        = '';
  government   = '';

  private colors = ['#D84040','#2D4A8A','#0F6E56','#d4a017','#7C3AED','#0891B2','#185FA5'];

  ngOnInit(): void {
    const q              = this.route.snapshot.queryParams;
    this.serviceType     = q['serviceDescription'] ?? q['type'] ?? '';
    this.address         = q['address']            ?? '';
    this.chosenTime      = q['time']               ?? '';
    this.government      = q['government']          ?? '';
    this.notes           = q['notes']              ?? '';
    this.loadProviders();
  }

  loadProviders(): void {
    this.http.get<any>(`${environment.apiUrl}/HomeService/Nurses`, {
      params: { pageNumber: '1', pageSize: '50' }
    }).subscribe({
      next: (res: any) => {
        let list: any[] = [];
        if (Array.isArray(res))                   list = res;
        else if (Array.isArray(res?.data?.items)) list = res.data.items;
        else if (Array.isArray(res?.data))        list = res.data;
        else if (Array.isArray(res?.items))       list = res.items;
        else if (Array.isArray(res?.nurses))      list = res.nurses;
        else if (Array.isArray(res?.result))      list = res.result;
        else if (typeof res === 'object' && res !== null) {
          const arr = Object.values(res).find(v => Array.isArray(v));
          if (arr) list = arr as any[];
        }
        console.log('[AvailableNurses] loaded:', list.length, list[0]);
        this.providers.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[AvailableNurses] error:', err);
        this.providers.set([]);
        this.loading.set(false);
      }
    });
  }

  toggle(id: string): void {
    this.expandedId.set(this.expandedId() === id ? '' : id);
  }

  book(p: any): void {
    this.booking.set(p.id);

    // Use the time the patient chose, fallback to 1 hour from now
    const requestedTime = this.chosenTime
      ? new Date(this.chosenTime).toISOString()
      : new Date(Date.now() + 3600000).toISOString();

    const body: any = {
      serviceDescription: this.serviceType || this.getSpec(p) || 'Home service request',
      requestedTime,
      address:    this.address    || 'To be confirmed',
      nurseId:    p.id,
      government: this.government || undefined,
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
        // If backend returns success-like error, treat as success
        if (!msg || err?.status === 200) {
          this.bookedName = this.getName(p);
          this.booked.set(true);
        } else {
          alert('Booking failed: ' + msg);
        }
      }
    });
  }

  serviceLabel(): string {
    const m: Record<string,string> = {
      Nursing:'Nurses', Physiotherapy:'Physiotherapists', LabTechnician:'Lab Technicians',
      Caregiver:'Caregivers', Midwifery:'Midwives',
    };
    return m[this.serviceType] ?? 'Providers';
  }

  getName(p: any): string {
    if (p.fullName && p.fullName !== 'Provider') return p.fullName;
    if (p.name     && p.name     !== 'Provider') return p.name;
    const full = `${p.firstName ?? p.first_name ?? ''} ${p.lastName ?? p.last_name ?? ''}`.trim();
    if (full) return full;
    if (p.user) {
      const uf = `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim();
      if (uf) return uf;
    }
    return p.email?.split('@')[0] ?? p.nurseEmail?.split('@')[0] ?? 'Provider';
  }

  getInitials(p: any): string {
    const n = this.getName(p);
    if (n === 'Provider') return '?';
    return n.split(' ').map((x:string)=>x[0]??'').join('').slice(0,2).toUpperCase() || '?';
  }

  getSpec(p: any):    string  { return p.specialization ?? p.serviceType ?? p.specialtyName ?? p.specialty ?? ''; }
  getLicense(p: any): string  { return p.licenseNumber ?? p.license_number ?? p.licenseNo ?? ''; }
  getPhone(p: any):   string  { return p.nursePhoneNumber ?? p.phoneNumber ?? p.phone ?? p.mobile ?? ''; }
  getRating(p: any):  number  { return p.rating ?? 0; }
  isActive(p: any):   boolean { return p.isActive !== false && p.status !== 'Inactive'; }

  getExp(p: any): number {
    const n = Number(p.experienceYears ?? p.experience ?? p.yearsExperience ?? 0);
    return (n > 0 && n < 100) ? n : 0;
  }

  avatarColor(p: any): string {
    const n = this.getName(p);
    return this.colors[(n.charCodeAt(0) + (n.charCodeAt(1) || 0)) % this.colors.length];
  }
}
