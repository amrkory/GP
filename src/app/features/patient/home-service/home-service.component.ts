/**
 * Home Service Component — Patient side
 * GET  /api/HomeService/PatientRequests  → load my requests
 * POST /api/HomeService/book             → book a nurse
 * GET  /api/HomeService/Nurses           → list available nurses
 *
 * POST body:
 * { serviceDescription, requestedTime (ISO), address, nurseId, government }
 */
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
      <p class="sub">Book a healthcare provider to visit you at home</p>
    </div>
  </div>

  <div class="main-grid">

    <!-- ═══════════ LEFT: Booking form ═══════════ -->
    <div class="form-col">
      <div class="form-card">
        <div class="form-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Book a Nurse Visit
        </div>

        <!-- Service description -->
        <div class="field">
          <label>Service Needed <span class="req">*</span></label>
          <textarea [(ngModel)]="form.serviceDescription" class="inp ta" rows="3"
                    placeholder="Describe what service you need (e.g. wound dressing, medication injection, blood pressure monitoring)...">
          </textarea>
        </div>

        <!-- Date & Time -->
        <div class="field">
          <label>Preferred Date &amp; Time <span class="req">*</span></label>
          <input [(ngModel)]="form.requestedTime" type="datetime-local"
                 class="inp" [min]="minDate()" />
          <p class="hint">The nurse will confirm availability.</p>
        </div>

        <!-- Address + Government row -->
        <div class="row-2">
          <div class="field">
            <label>Your Address <span class="req">*</span></label>
            <input [(ngModel)]="form.address" class="inp"
                   placeholder="Street, building, flat..." />
          </div>
          <div class="field">
            <label>Governorate <span class="req">*</span></label>
            <select [(ngModel)]="form.government" class="inp" (change)="onGovChange()">
              <option value="">Select governorate</option>
              <option *ngFor="let g of govs" [value]="g">{{ g }}</option>
            </select>
          </div>
        </div>

        <!-- Nurse selection -->
        <div class="field">
          <label>Select Nurse <span class="req">*</span></label>
          <div class="nurse-search">
            <button class="btn-load-nurses" (click)="loadNurses()"
                    [disabled]="loadingNurses() || !form.government">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {{ loadingNurses() ? 'Loading…' : form.government ? 'Find Nurses in ' + form.government : 'Find All Available Nurses' }}
            </button>
          </div>

          <!-- Nurses list -->
          <div class="nurses-list" *ngIf="nurses().length > 0">
            <div class="nurse-card" *ngFor="let n of nurses()"
                 [class.selected]="form.nurseId === n.id"
                 (click)="form.nurseId = n.id">
              <div class="nurse-av" [style.background]="clr(nurseName(n))">{{ ini(nurseName(n)) }}</div>
              <div class="nurse-info">
                <div class="nurse-name">{{ nurseName(n) }}</div>
                <div class="nurse-spec" *ngIf="n.specialization">{{ n.specialization }}</div>
                <div class="nurse-exp" *ngIf="n.experienceYears">{{ n.experienceYears }} yrs exp</div>
              </div>
              <div class="nurse-check" *ngIf="form.nurseId === n.id">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="loading-nurses" *ngIf="loadingNurses()">
            <div class="spin-n"></div> Loading nurses…
          </div>
          <div class="no-nurses" *ngIf="nurses().length === 0 && !loadingNurses() && nurseSearched">
            No nurses available in {{ form.government }}. Try another governorate.
          </div>
          <p class="hint" *ngIf="nurses().length === 0 && !loadingNurses() && !nurseSearched">
            Select a governorate and click "Find Nurses" to see available nurses.
          </p>
        </div>

        <!-- Alerts -->
        <div class="alert-success" *ngIf="sent()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Request booked successfully! The nurse will confirm shortly.
        </div>
        <div class="alert-error" *ngIf="bookErr()">{{ bookErr() }}</div>

        <!-- Submit -->
        <button class="btn-book" (click)="book()" [disabled]="booking() || sent()">
          <span class="ring" *ngIf="booking()"></span>
          {{ booking() ? 'Booking…' : sent() ? '✓ Booked!' : 'Book Visit' }}
        </button>
      </div>
    </div>

    <!-- ═══════════ RIGHT: My Requests ═══════════ -->
    <div class="requests-col">
      <div class="req-hdr">
        <h2>My Requests</h2>
        <span class="req-count" *ngIf="requests().length > 0">{{ requests().length }}</span>
        <button class="btn-reload" (click)="loadRequests()" title="Refresh">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
          </svg>
        </button>
      </div>

      <div class="loading-sm" *ngIf="loadingReqs()">
        <div class="spin-sm"></div>
      </div>

      <div class="empty-reqs" *ngIf="!loadingReqs() && requests().length === 0">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>No service requests yet</p>
        <span>Book your first visit on the left</span>
      </div>

      <div class="req-list" *ngIf="!loadingReqs()">
        <div class="req-card" *ngFor="let r of requests()">

          <div class="req-top">
            <div class="req-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <div class="req-desc">{{ r.serviceDescription || r.serviceType || 'Home Visit' }}</div>
            <span class="status-pill" [class]="stCls(r)">{{ stLabel(r) }}</span>
          </div>

          <div class="req-rows">
            <div class="rrow" *ngIf="rTime(r)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ rTime(r) | date:'EEE, MMM d · h:mm a' }}
            </div>
            <div class="rrow" *ngIf="r.address">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {{ r.address }}
            </div>
            <div class="rrow" *ngIf="r.government">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              {{ r.government }}
            </div>
            <div class="rrow nurse-row" *ngIf="r.nurseName ?? r.providerName ?? r.nurseFirstName">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Nurse: {{ r.nurseName ?? r.providerName ?? r.nurseFirstName }}
            </div>
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

    /* Main grid */
    .main-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;}
    @media(max-width:900px){.main-grid{grid-template-columns:1fr;}}

    /* Form */
    .form-card{background:#fff;border-radius:18px;padding:22px;box-shadow:0 1px 10px rgba(0,0,0,.07);border:1px solid #F0F2F5;}
    .form-title{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800;color:#111;margin-bottom:18px;}
    .field{margin-bottom:14px;}
    .field label{display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;text-transform:uppercase;letter-spacing:.3px;}
    .req{color:#D84040;}
    .inp{width:100%;padding:11px 14px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;appearance:none;background:#fff;transition:border-color .2s;}
    .inp:focus{border-color:#D84040;box-shadow:0 0 0 3px rgba(216,64,64,.07);}
    .ta{resize:vertical;min-height:80px;}
    .hint{font-size:12px;color:#9CA3AF;margin-top:5px;}
    .nurse-loading{display:flex;align-items:center;gap:8px;padding:12px 0;}
    .row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    @media(max-width:500px){.row-2{grid-template-columns:1fr;}}

    /* Nurse search */
    .nurse-search{margin-bottom:10px;}
    .btn-load-nurses{display:flex;align-items:center;gap:7px;padding:9px 16px;background:#FEF2F2;color:#D84040;border:1.5px solid #FECACA;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;}
    .btn-load-nurses:hover:not(:disabled){background:#FEE2E2;}
    .btn-load-nurses:disabled{opacity:.5;cursor:not-allowed;}

    /* Nurses list */
    .nurses-list{display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;scrollbar-width:none;}
    .nurses-list::-webkit-scrollbar{display:none;}
    .loading-nurses{display:flex;align-items:center;gap:8px;padding:12px;font-size:13px;color:#888;}
    .spin-n{width:16px;height:16px;border:2px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
    .no-nurses{padding:12px;font-size:13px;color:#D84040;background:#FEF2F2;border-radius:10px;}
    .nurse-card{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid #E8ECF0;border-radius:12px;cursor:pointer;background:#F8F9FC;transition:all .15s;}
    .nurse-card:hover{border-color:#D84040;background:#FEF2F2;}
    .nurse-card.selected{border-color:#D84040;background:#FEF2F2;}
    .nurse-av{width:36px;height:36px;border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .nurse-info{flex:1;min-width:0;}
    .nurse-name{font-size:13px;font-weight:700;color:#111;}
    .nurse-spec{font-size:11px;color:#D84040;font-weight:600;}
    .nurse-exp{font-size:11px;color:#9CA3AF;}
    .nurse-check{width:22px;height:22px;border-radius:50%;background:#D84040;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

    /* Book button */
    .alert-success{display:flex;align-items:center;gap:8px;background:#ECFDF5;color:#0F6E56;border-radius:10px;padding:11px 14px;margin-bottom:12px;font-size:13px;font-weight:600;}
    .alert-error{background:#FEF2F2;color:#D84040;border-radius:10px;padding:11px 14px;margin-bottom:12px;font-size:13px;}
    .btn-book{width:100%;padding:14px;background:#D84040;border:none;color:#fff;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .15s;margin-top:4px;}
    .btn-book:hover:not(:disabled){opacity:.88;}
    .btn-book:disabled{opacity:.5;cursor:not-allowed;}
    .ring{width:16px;height:16px;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;}

    /* Right col */
    .req-hdr{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
    h2{font-size:17px;font-weight:800;color:#111;}
    .req-count{background:#D84040;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;}
    .btn-reload{background:none;border:none;cursor:pointer;color:#9CA3AF;display:flex;padding:4px;border-radius:8px;}
    .btn-reload:hover{color:#374151;background:#F4F6FA;}
    .loading-sm{display:flex;justify-content:center;padding:24px;}
    .spin-sm{width:20px;height:20px;border:2px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;}
    .empty-reqs{display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px;background:#fff;border-radius:14px;text-align:center;border:1px solid #F0F2F5;}
    .empty-reqs p{font-size:14px;font-weight:700;color:#374151;}
    .empty-reqs span{font-size:12px;color:#9CA3AF;}

    /* Request cards */
    .req-list{display:flex;flex-direction:column;gap:10px;}
    .req-card{background:#fff;border-radius:14px;padding:14px;border:1px solid #F0F2F5;box-shadow:0 1px 6px rgba(0,0,0,.05);}
    .req-top{display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;}
    .req-ico{width:28px;height:28px;border-radius:8px;background:#FEF2F2;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .req-desc{flex:1;font-size:13px;font-weight:700;color:#111;line-height:1.4;}
    .status-pill{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;flex-shrink:0;}
    .st-pending{background:#FFFBEB;color:#D97706;}
    .st-accepted{background:#ECFDF5;color:#0F6E56;}
    .st-completed{background:#EEF2FF;color:#2D4A8A;}
    .st-rejected{background:#FEF2F2;color:#D84040;}
    .req-rows{display:flex;flex-direction:column;gap:5px;}
    .rrow{display:flex;align-items:center;gap:6px;font-size:12px;color:#6B7280;}
    .rrow.nurse-row{color:#0F6E56;font-weight:600;}
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

  nurseSearched = false;

  form = {
    serviceDescription: '',
    requestedTime:      '',
    address:            '',
    government:         '',
    nurseId:            '',
  };

  govs = GOVS;

  ngOnInit(): void { this.loadRequests(); }

  loadRequests(): void {
    this.loadingReqs.set(true);
    this.http.get<any>(`${environment.apiUrl}/HomeService/PatientRequests`, {
      params: { pageNumber: '1', pageSize: '50' }
    }).subscribe({
      next: (res: any) => {
        const list = toArr(res);
        console.log('[HomeService] PatientRequests:', list.length, list[0]);
        this.requests.set(list);
        this.loadingReqs.set(false);
      },
      error: () => this.loadingReqs.set(false)
    });
  }

  onGovChange(): void { this.nurses.set([]); this.form.nurseId = ''; this.nurseSearched = false; }

  loadNurses(): void {
    if (!this.form.government) return;
    this.loadingNurses.set(true);
    this.nurseSearched = true;
    this.http.get<any>(`${environment.apiUrl}/HomeService/Nurses`, {
      params: { government: this.form.government, pageNumber: '1', pageSize: '50' }
    }).subscribe({
      next: (res: any) => {
        console.log('[HomeService] Nurses raw:', JSON.stringify(res).slice(0, 300));
        const list = toArr(res);
        console.log('[HomeService] Nurses parsed:', list.length, list[0]);
        this.nurses.set(list);
        this.loadingNurses.set(false);
      },
      error: (e: any) => {
        console.error('[HomeService] Nurses error:', e);
        this.loadingNurses.set(false);
      }
    });
  }

  book(): void {
    this.bookErr.set('');

    if (!this.form.serviceDescription.trim()) { this.bookErr.set('Please describe the service needed.'); return; }
    if (!this.form.requestedTime)             { this.bookErr.set('Please select a date and time.'); return; }
    if (!this.form.address.trim())            { this.bookErr.set('Please enter your address.'); return; }
    if (!this.form.government)                { this.bookErr.set('Please select your governorate.'); return; }
    if (!this.form.nurseId)                   { this.bookErr.set('Please select a nurse.'); return; }

    this.booking.set(true);

    // POST /api/HomeService/book
    const body = {
      serviceDescription: this.form.serviceDescription.trim(),
      requestedTime:      new Date(this.form.requestedTime).toISOString(),
      address:            this.form.address.trim(),
      nurseId:            this.form.nurseId,
      government:         this.form.government,
    };

    console.log('[HomeService] POST /api/HomeService/book', body);

    this.http.post<any>(`${environment.apiUrl}/HomeService/book`, body).subscribe({
      next: () => {
        this.booking.set(false);
        this.sent.set(true);
        this.form = { serviceDescription:'', requestedTime:'', address:'', government:'', nurseId:'' };
        this.nurses.set([]);
        setTimeout(() => { this.sent.set(false); this.loadRequests(); }, 2000);
      },
      error: (e: any) => {
        this.booking.set(false);
        const errs = e?.error?.errors;
        const msg = errs
          ? Object.entries(errs).map(([f,m]) => `${f}: ${(m as string[]).join(', ')}`).join(' | ')
          : e?.error?.message ?? e?.error?.title ?? `Error ${e?.status}`;
        this.bookErr.set(msg);
      }
    });
  }

  minDate(): string { return new Date().toISOString().slice(0, 16); }

  rTime(r: any): string { return r?.requestedTime ?? r?.scheduledAt ?? r?.createdAt ?? ''; }

  stLabel(r: any): string {
    const s = (r?.status ?? '').toString().toLowerCase();
    const m: any = { pending:'Pending', accepted:'Accepted', completed:'Completed', rejected:'Rejected', inprogress:'In Progress', '0':'Pending','1':'Accepted','2':'Completed','3':'Rejected' };
    return m[s] ?? m[r?.status] ?? String(r?.status ?? 'Pending');
  }

  stCls(r: any): string {
    const s = (r?.status ?? '').toString().toLowerCase();
    if (s === 'accepted'  || s === '1') return 'status-pill st-accepted';
    if (s === 'completed' || s === '2') return 'status-pill st-completed';
    if (s === 'rejected'  || s === '3') return 'status-pill st-rejected';
    return 'status-pill st-pending';
  }

  nurseName(n: any): string {
    if (n?.name)      return n.name;
    if (n?.fullName)  return n.fullName;
    const f = n?.firstName ?? n?.first_name ?? n?.nurseFirstName ?? '';
    const l = n?.lastName  ?? n?.last_name  ?? n?.nurseLastName  ?? '';
    return `${f} ${l}`.trim() || n?.userName || n?.email?.split('@')[0] || 'Nurse';
  }

  ini(name: string): string {
    const p = (name || 'N').trim().split(' ');
    return ((p[0]?.[0] ?? 'N') + (p[1]?.[0] ?? '')).toUpperCase();
  }

  private COLORS = ['#D84040','#0F6E56','#2D4A8A','#7C3AED','#0891B2','#D97706'];
  clr(n: string): string { return this.COLORS[(n?.charCodeAt(0) || 0) % this.COLORS.length]; }
}
