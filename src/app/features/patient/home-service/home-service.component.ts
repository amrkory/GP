import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../../environments/environment';

const GOVS = [
  'Cairo','Giza','Alexandria','Dakahlia','Red Sea','Beheira','Fayoum',
  'Gharbia','Ismailia','Menofia','Minya','Qalyubia','New Valley','Suez',
  'Aswan','Assiut','Beni Suef','Port Said','Damietta','Sharqia','South Sinai',
  'Kafr El Sheikh','Matrouh','Luxor','Qena','North Sinai','Sohag',
];

function toArr(res: any): any[] {
  if (Array.isArray(res))              return res;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.data))        return res.data;
  if (Array.isArray(res?.items))       return res.items;
  return [];
}

@Component({
  selector: 'app-home-service',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<div class="page">
  <div class="page-hdr">
    <div>
      <h1>Home Service</h1>
      <p class="sub">Book a healthcare visit at your home</p>
    </div>
  </div>

  <div class="main-grid">

    <!-- FORM -->
    <div class="form-card">
      <div class="form-title">📋 Book a Visit</div>

      <div class="field">
        <label>Service Description <span class="req">*</span></label>
        <textarea [(ngModel)]="form.serviceDescription" class="inp ta" rows="3"
          placeholder="e.g. wound dressing, medication injection, blood pressure check..."></textarea>
      </div>

      <div class="field">
        <label>Preferred Date &amp; Time <span class="req">*</span></label>
        <input [(ngModel)]="form.requestedTime" type="datetime-local" class="inp" [min]="minDate()"/>
      </div>

      <div class="row-2">
        <div class="field">
          <label>Address <span class="req">*</span></label>
          <input [(ngModel)]="form.address" class="inp" placeholder="Street, building, flat..."/>
        </div>
        <div class="field">
          <label>Governorate <span class="req">*</span></label>
          <select [(ngModel)]="form.government" class="inp">
            <option value="">Select</option>
            <option *ngFor="let g of govs" [value]="g">{{ g }}</option>
          </select>
        </div>
      </div>

      <!-- NURSE SELECTION -->
      <div class="field">
        <label>Select Nurse <span class="req">*</span></label>

        <div class="nurse-section" *ngIf="!nursesLoaded">
          <button class="btn-load-nurses" (click)="loadNurses()" [disabled]="loadingNurses()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {{ loadingNurses() ? 'Loading nurses…' : 'Find Available Nurses' }}
          </button>
        </div>

        <!-- Loading -->
        <div class="nurse-loading" *ngIf="loadingNurses()">
          <div class="spin-sm" style="border-top-color:#D84040;margin:0;"></div>
          <span>Searching for nurses…</span>
        </div>

        <!-- No nurses found — show message -->
        <div class="no-nurses" *ngIf="nursesLoaded && nurses().length === 0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
          <div>
            <p class="no-nurses-title">No nurses available right now</p>
            <p class="no-nurses-sub">Please contact support or try again later</p>
          </div>
        </div>

        <!-- Nurses list -->
        <div class="nurses-grid" *ngIf="nurses().length > 0">
          <div class="nurse-card" *ngFor="let n of nurses()"
               [class.sel]="form.nurseId === n.id"
               (click)="form.nurseId = n.id">
            <div class="n-av" [style.background]="clr(nName(n))">{{ ini(nName(n)) }}</div>
            <div class="n-info">
              <div class="n-name">{{ nName(n) }}</div>
              <div class="n-spec" *ngIf="n.specialization || n.specialty">
                {{ n.specialization || n.specialty }}
              </div>
              <div class="n-exp" *ngIf="n.experienceYears">
                {{ n.experienceYears }} yrs exp
              </div>
              <div class="n-phone" *ngIf="n.phoneNumber || n.nursePhoneNumber">
                📞 {{ n.phoneNumber || n.nursePhoneNumber }}
              </div>
            </div>
            <div class="n-check" *ngIf="form.nurseId === n.id">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="alert-error" *ngIf="bookErr()">{{ bookErr() }}</div>
      <div class="alert-success" *ngIf="sent()">✓ Request sent! The nurse will confirm shortly.</div>

      <button class="btn-book" (click)="book()" [disabled]="booking() || sent()">
        <span class="ring" *ngIf="booking()"></span>
        {{ booking() ? 'Sending…' : sent() ? '✓ Sent!' : 'Book Visit' }}
      </button>
    </div>

    <!-- MY REQUESTS -->
    <div class="req-col">
      <div class="req-hdr">
        <h2>My Requests</h2>
        <span class="badge" *ngIf="requests().length">{{ requests().length }}</span>
        <button class="btn-ref" (click)="loadRequests()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
          </svg>
        </button>
      </div>

      <div class="loading-sm" *ngIf="loadingReqs()"><div class="spin-sm"></div></div>

      <div class="empty" *ngIf="!loadingReqs() && requests().length === 0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>No requests yet</p>
      </div>

      <div class="rlist">
        <div class="rcard" *ngFor="let r of requests()">
          <div class="rtop">
            <div class="rdesc">{{ r.serviceDescription || r.serviceType || 'Home Visit' }}</div>
            <span class="pill" [class]="stCls(r)">{{ stLabel(r) }}</span>
          </div>
          <div class="rrow" *ngIf="r.requestedTime || r.scheduledAt">
            📅 {{ (r.requestedTime || r.scheduledAt) | date:'EEE, MMM d · h:mm a' }}
          </div>
          <div class="rrow" *ngIf="r.address">📍 {{ r.address }}</div>
          <div class="rrow" *ngIf="r.government">🏛 {{ r.government }}</div>
          <div class="rrow nurse" *ngIf="r.nurseName || r.providerName || r.nurseFirstName">
            👩‍⚕️ {{ r.nurseName || r.providerName || r.nurseFirstName }}
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{width:100%;font-family:'Cairo','Segoe UI',sans-serif;padding-bottom:40px;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .page-hdr{margin-bottom:20px;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#888;margin-top:3px;}
    .main-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;}
    @media(max-width:900px){.main-grid{grid-template-columns:1fr;}}

    /* Form */
    .form-card{background:#fff;border-radius:18px;padding:22px;box-shadow:0 1px 10px rgba(0,0,0,.07);border:1px solid #F0F2F5;}
    .form-title{font-size:16px;font-weight:800;color:#111;margin-bottom:18px;}
    .field{margin-bottom:16px;}
    .field label{display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.3px;}
    .req{color:#D84040;}
    .inp{width:100%;padding:11px 14px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;appearance:none;background:#fff;}
    .inp:focus{border-color:#D84040;}
    .ta{resize:vertical;min-height:80px;}
    .row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    @media(max-width:500px){.row-2{grid-template-columns:1fr;}}

    /* Nurse section */
    .nurse-section{margin-bottom:10px;}
    .btn-load-nurses{display:flex;align-items:center;gap:8px;padding:10px 18px;background:#FEF2F2;color:#D84040;border:1.5px solid #FECACA;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;width:100%;justify-content:center;}
    .btn-load-nurses:hover:not(:disabled){background:#FEE2E2;}
    .btn-load-nurses:disabled{opacity:.5;cursor:not-allowed;}
    .nurse-loading{display:flex;align-items:center;gap:8px;padding:12px;color:#888;font-size:13px;}
    .no-nurses{display:flex;align-items:flex-start;gap:12px;padding:14px;background:#F8F9FC;border-radius:12px;border:1.5px dashed #E8ECF0;}
    .no-nurses-title{font-size:14px;font-weight:700;color:#374151;margin-bottom:3px;}
    .no-nurses-sub{font-size:12px;color:#9CA3AF;}

    /* Nurse cards */
    .nurses-grid{display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;scrollbar-width:none;}
    .nurses-grid::-webkit-scrollbar{display:none;}
    .nurse-card{display:flex;align-items:center;gap:12px;padding:12px;border:2px solid #E8ECF0;border-radius:14px;cursor:pointer;background:#F8F9FC;transition:all .15s;}
    .nurse-card:hover{border-color:#D84040;background:#FEF2F2;}
    .nurse-card.sel{border-color:#D84040;background:#FEF2F2;}
    .n-av{width:44px;height:44px;border-radius:50%;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .n-info{flex:1;min-width:0;}
    .n-name{font-size:14px;font-weight:700;color:#111;}
    .n-spec{font-size:12px;color:#D84040;font-weight:600;margin-top:2px;}
    .n-exp{font-size:11px;color:#9CA3AF;}
    .n-phone{font-size:11px;color:#6B7280;margin-top:2px;}
    .n-check{width:28px;height:28px;border-radius:50%;background:#D84040;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

    /* Buttons */
    .alert-error{background:#FEF2F2;color:#D84040;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:13px;}
    .alert-success{background:#ECFDF5;color:#0F6E56;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:13px;font-weight:600;}
    .btn-book{width:100%;padding:14px;background:#D84040;border:none;color:#fff;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;margin-top:8px;}
    .btn-book:disabled{opacity:.5;}
    .ring{width:15px;height:15px;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;}

    /* Requests col */
    .req-col{display:flex;flex-direction:column;}
    .req-hdr{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
    h2{font-size:17px;font-weight:800;color:#111;}
    .badge{background:#D84040;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;}
    .btn-ref{background:none;border:none;cursor:pointer;color:#9CA3AF;padding:4px;}
    .loading-sm{display:flex;justify-content:center;padding:20px;}
    .spin-sm{width:20px;height:20px;border:2px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;}
    .empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px;background:#fff;border-radius:14px;text-align:center;border:1px solid #F0F2F5;color:#9CA3AF;}
    .rlist{display:flex;flex-direction:column;gap:10px;}
    .rcard{background:#fff;border-radius:14px;padding:14px;border:1px solid #F0F2F5;box-shadow:0 1px 6px rgba(0,0,0,.05);}
    .rtop{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;}
    .rdesc{font-size:13px;font-weight:700;color:#111;flex:1;line-height:1.4;}
    .pill{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;}
    .st-pending{background:#FFFBEB;color:#D97706;}
    .st-accepted{background:#ECFDF5;color:#0F6E56;}
    .st-completed{background:#EEF2FF;color:#2D4A8A;}
    .st-rejected{background:#FEF2F2;color:#D84040;}
    .rrow{font-size:12px;color:#6B7280;margin-bottom:4px;}
    .rrow.nurse{color:#0F6E56;font-weight:600;}
  `]
})
export class HomeServiceComponent implements OnInit {
  private http = inject(HttpClient);

  loadingReqs   = signal(true);
  loadingNurses = signal(false);
  booking       = signal(false);
  sent          = signal(false);
  bookErr       = signal('');
  requests      = signal<any[]>([]);
  nurses        = signal<any[]>([]);
  nursesLoaded  = false;

  form = { serviceDescription:'', requestedTime:'', address:'', government:'', nurseId:'' };
  govs = GOVS;

  ngOnInit(): void { this.loadRequests(); }

  loadRequests(): void {
    this.loadingReqs.set(true);
    this.http.get<any>(`${environment.apiUrl}/HomeService/PatientRequests`, {
      params: { pageNumber:'1', pageSize:'50' }
    }).subscribe({
      next: (res: any) => { this.requests.set(toArr(res)); this.loadingReqs.set(false); },
      error: () => this.loadingReqs.set(false)
    });
  }

  loadNurses(): void {
    this.loadingNurses.set(true);
    this.nursesLoaded = false;

    // Try GET /api/HomeService/Nurses first
    this.http.get<any>(`${environment.apiUrl}/HomeService/Nurses`, {
      params: { pageNumber:'1', pageSize:'100' }
    }).subscribe({
      next: (res: any) => {
        console.log('[Nurses] raw:', res);
        let list = toArr(res);

        // If empty, extract nurses from existing patient requests
        if (list.length === 0) {
          const reqs = this.requests();
          const seen = new Set<string>();
          list = reqs
            .filter(r => r.nurseId && !seen.has(r.nurseId) && seen.add(r.nurseId))
            .map(r => ({
              id:           r.nurseId,
              firstName:    r.nurseFirstName ?? r.nurseName?.split(' ')[0] ?? r.nurseName ?? '',
              lastName:     r.nurseLastName  ?? r.nurseName?.split(' ').slice(1).join(' ') ?? '',
              specialization: r.nurseSpecialization ?? '',
              phoneNumber:  r.nursePhone ?? '',
            }));
          console.log('[Nurses] fallback from requests:', list);
        }

        this.nurses.set(list);
        this.nursesLoaded = true;
        this.loadingNurses.set(false);
      },
      error: () => {
        this.nursesLoaded = true;
        this.loadingNurses.set(false);
      }
    });
  }

  book(): void {
    this.bookErr.set('');
    if (!this.form.serviceDescription.trim()) { this.bookErr.set('Service description is required.'); return; }
    if (!this.form.requestedTime)             { this.bookErr.set('Please select date & time.'); return; }
    if (!this.form.address.trim())            { this.bookErr.set('Address is required.'); return; }
    if (!this.form.government)                { this.bookErr.set('Please select governorate.'); return; }
    if (!this.form.nurseId)                   { this.bookErr.set('Please select a nurse.'); return; }

    this.booking.set(true);

    const body = {
      serviceDescription: this.form.serviceDescription.trim(),
      requestedTime:      new Date(this.form.requestedTime).toISOString(),
      address:            this.form.address.trim(),
      government:         this.form.government,
      nurseId:            this.form.nurseId,
    };

    console.log('[HomeService] POST /api/HomeService/book', body);

    this.http.post<any>(`${environment.apiUrl}/HomeService/book`, body).subscribe({
      next: () => {
        this.booking.set(false); this.sent.set(true);
        this.form = { serviceDescription:'', requestedTime:'', address:'', government:'', nurseId:'' };
        this.nurses.set([]); this.nursesLoaded = false;
        setTimeout(() => { this.sent.set(false); this.loadRequests(); }, 2500);
      },
      error: (e: any) => {
        this.booking.set(false);
        const errs = e?.error?.errors;
        this.bookErr.set(errs
          ? Object.entries(errs).map(([f,m]) => `${f}: ${(m as string[]).join(', ')}`).join(' | ')
          : e?.error?.message ?? e?.error?.title ?? `Error ${e?.status}`);
      }
    });
  }

  minDate(): string { return new Date().toISOString().slice(0,16); }

  stLabel(r: any): string {
    const s = (r?.status ?? '').toString().toLowerCase();
    return ({pending:'Pending',accepted:'Accepted',completed:'Completed',rejected:'Rejected','0':'Pending','1':'Accepted','2':'Completed','3':'Rejected'} as any)[s] ?? String(r?.status ?? 'Pending');
  }
  stCls(r: any): string {
    const s = (r?.status ?? '').toString().toLowerCase();
    if (s==='accepted'||s==='1')  return 'pill st-accepted';
    if (s==='completed'||s==='2') return 'pill st-completed';
    if (s==='rejected'||s==='3')  return 'pill st-rejected';
    return 'pill st-pending';
  }
  nName(n: any): string {
    const f = n?.firstName ?? n?.nurseFirstName ?? '';
    const l = n?.lastName  ?? n?.nurseLastName  ?? '';
    return `${f} ${l}`.trim() || n?.name || n?.fullName || n?.nurseName || 'Nurse';
  }
  ini(name: string): string {
    const p = (name || 'N').trim().split(' ');
    return ((p[0]?.[0] ?? 'N') + (p[1]?.[0] ?? '')).toUpperCase();
  }
  private C = ['#D84040','#0F6E56','#2D4A8A','#7C3AED','#0891B2','#D97706'];
  clr(n: string): string { return this.C[(n?.charCodeAt(0) || 0) % this.C.length]; }
}
