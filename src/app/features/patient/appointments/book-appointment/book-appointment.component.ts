import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../../../environments/environment';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="top-bar">
    <button class="back-btn" (click)="router.navigate(['/patient/appointments'])">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <h1>{{ rescheduleMode ? 'Reschedule' : 'Book Appointment' }}</h1>
  </div>

  <!-- STEP 1: Choose doctor -->
  <ng-container *ngIf="step()===1">
    <div class="step-hdr">
      <span class="step-badge">Step 1 of 2</span>
      <h2>Choose a Doctor</h2>
      <p>Select a doctor to see their available Calendly slots</p>
    </div>

    <!-- Search -->
    <div class="search-bar">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input [(ngModel)]="q" (ngModelChange)="filterDocs()"
             placeholder="Search by name or specialty…" />
    </div>

    <!-- Loading -->
    <div class="loading" *ngIf="loading()"><div class="sp"></div></div>

    <!-- Specialty filter -->
    <div class="spec-chips" *ngIf="!loading() && specialties().length>0">
      <button class="sp-chip" [class.active]="specFilter()===''"
              (click)="specFilter.set(''); filterDocs()">All</button>
      <button class="sp-chip" *ngFor="let s of specialties()"
              [class.active]="specFilter()===s"
              (click)="specFilter.set(s); filterDocs()">{{ s }}</button>
    </div>

    <!-- Empty -->
    <div class="empty" *ngIf="!loading() && filtered().length===0">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <p>No doctors found</p>
    </div>

    <!-- Doctor grid -->
    <div class="doc-grid" *ngIf="!loading()">
      <div class="doc-card" *ngFor="let d of filtered()"
           [class.sel]="selected()?.id===d.id"
           (click)="selectDoc(d)">
        <div class="doc-av" [style.background]="clr(docName(d))">{{ ini(d) }}</div>
        <div class="doc-info">
          <div class="doc-name">Dr. {{ docName(d) }}</div>
          <div class="doc-spec">{{ docSpec(d) }}</div>
          <div class="doc-place" *ngIf="docPlace(d)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            {{ docPlace(d) }}
          </div>
        </div>
        <div class="sel-check" *ngIf="selected()?.id===d.id">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
    </div>

    <div class="step-footer" *ngIf="selected()">
      <button class="btn-next" (click)="step.set(2); loadSlots()">
        Continue with Dr. {{ docName(selected()!) }}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  </ng-container>

  <!-- STEP 2: Book via Calendly -->
  <ng-container *ngIf="step()===2">
    <div class="step-hdr">
      <span class="step-badge">Step 2 of 2</span>
      <h2>Book with Dr. {{ docName(selected()!) }}</h2>
      <p>{{ docSpec(selected()!) }} · {{ docPlace(selected()!) }}</p>
    </div>

    <!-- Calendly loading -->
    <div class="cal-loading" *ngIf="slotsLoading()">
      <div class="sp"></div>
      <span>Loading available slots from Calendly…</span>
    </div>

    <!-- Has Calendly slots -->
    <ng-container *ngIf="!slotsLoading() && hasCalendly()">
      <div class="cal-info">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>Available slots for the next 14 days</span>
      </div>

      <!-- No slots -->
      <div class="no-slots" *ngIf="slots().length===0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>No available slots in the next 14 days</p>
        <span>Please check back later or choose another doctor</span>
        <button class="btn-back" (click)="step.set(1)">Choose another doctor</button>
      </div>

      <!-- Slots grouped by day -->
      <div class="slots-section" *ngFor="let day of slotsByDay()">
        <div class="day-label">{{ day.date | date:'EEEE, MMMM d' }}</div>
        <div class="slots-row">
          <button class="slot-btn" *ngFor="let s of day.slots"
                  [class.sel]="selectedSlot()?.startTime===s.startTime"
                  (click)="selectSlot(s)">
            {{ s.startTime | date:'h:mm a' }}
          </button>
        </div>
      </div>

      <!-- Book now button -->
      <div class="book-footer" *ngIf="selectedSlot()">
        <div class="sel-slot-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {{ selectedSlot()!.startTime | date:'EEE, MMM d · h:mm a' }}
        </div>
        <div class="field">
          <label>Notes (optional)</label>
          <textarea [(ngModel)]="notes" class="inp ta" rows="2"
                    placeholder="Reason for visit, symptoms…"></textarea>
        </div>
        <div class="err-box" *ngIf="bookErr()">{{ bookErr() }}</div>
        <div class="ok-box" *ngIf="booked()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Appointment booked! Redirecting…
        </div>
        <button class="btn-book" (click)="book()" [disabled]="booking() || booked()">
          <span class="ring" *ngIf="booking()"></span>
          {{ booking() ? 'Booking…' : 'Confirm Booking' }}
        </button>
      </div>
    </ng-container>

    <!-- No Calendly — open Calendly page directly -->
    <div class="no-calendly" *ngIf="!slotsLoading() && !hasCalendly()">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <p>This doctor hasn't connected Calendly yet</p>
      <span>Please choose another doctor or contact the clinic</span>
      <button class="btn-back" (click)="step.set(1)">Choose another doctor</button>
    </div>

    <div class="step-footer back-only">
      <button class="btn-ghost" (click)="step.set(1); selected.set(null)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to doctors
      </button>
    </div>
  </ng-container>

</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;max-width:760px;font-family:'Cairo','Segoe UI',sans-serif;padding-bottom:80px;}
    @media(max-width:768px){.page{padding:16px 14px 80px;}}
    .top-bar{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
    .back-btn{background:none;border:none;cursor:pointer;color:#6B7280;padding:6px;border-radius:8px;display:flex;}
    .back-btn:hover{background:#F4F6FA;}
    h1{font-size:20px;font-weight:800;color:#111;}
    /* Step header */
    .step-hdr{margin-bottom:18px;}
    .step-badge{display:inline-block;background:#EEF2FF;color:#2D4A8A;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:6px;}
    .step-hdr h2{font-size:18px;font-weight:700;color:#111;margin-bottom:3px;}
    .step-hdr p{font-size:13px;color:#6B7280;}
    /* Search */
    .search-bar{display:flex;align-items:center;gap:9px;background:#fff;border:1.5px solid #E8ECF0;border-radius:14px;padding:10px 14px;margin-bottom:12px;}
    .search-bar:focus-within{border-color:#2D4A8A;}
    .search-bar input{flex:1;border:none;outline:none;font-size:14px;font-family:inherit;color:#111;}
    /* Specialty chips */
    .spec-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
    .sp-chip{padding:5px 12px;border:1.5px solid #E8ECF0;border-radius:20px;background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit;}
    .sp-chip.active{background:#2D4A8A;color:#fff;border-color:#2D4A8A;}
    .loading,.cal-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:40px;color:#6B7280;font-size:14px;}
    .sp{width:22px;height:22px;border:2.5px solid #f0f0f0;border-top-color:#2D4A8A;border-radius:50%;animation:sp .7s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    /* Empty */
    .empty,.no-slots,.no-calendly{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px;background:#fff;border-radius:16px;text-align:center;border:1px solid #F0F2F5;}
    .empty p,.no-slots p,.no-calendly p{font-size:14px;font-weight:600;color:#374151;}
    .empty span,.no-slots span,.no-calendly span{font-size:13px;color:#9CA3AF;}
    .btn-back{padding:10px 20px;background:#F4F6FA;color:#374151;border:1.5px solid #E8ECF0;border-radius:11px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:4px;}
    /* Doctor grid */
    .doc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:80px;}
    @media(max-width:600px){.doc-grid{grid-template-columns:1fr;}}
    .doc-card{background:#fff;border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 6px rgba(0,0,0,.05);border:2px solid #F0F2F5;cursor:pointer;transition:all .15s;position:relative;}
    .doc-card:hover{border-color:#2D4A8A;box-shadow:0 3px 14px rgba(45,74,138,.12);}
    .doc-card.sel{border-color:#2D4A8A;background:#F0F4FF;}
    .doc-av{width:46px;height:46px;border-radius:50%;color:#fff;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .doc-info{flex:1;min-width:0;}
    .doc-name{font-size:14px;font-weight:700;color:#111;margin-bottom:2px;}
    .doc-spec{font-size:12px;color:#2D4A8A;font-weight:600;margin-bottom:3px;}
    .doc-place{display:flex;align-items:center;gap:4px;font-size:11px;color:#9CA3AF;}
    .sel-check{width:22px;height:22px;border-radius:50%;background:#2D4A8A;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    /* Step footer */
    .step-footer{position:fixed;bottom:0;left:0;right:0;background:#fff;padding:14px 20px;border-top:1px solid #F0F2F5;box-shadow:0 -2px 10px rgba(0,0,0,.06);z-index:100;}
    .btn-next{width:100%;max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;background:#2D4A8A;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;}
    .btn-next:hover{background:#1E3A6E;}
    .step-footer.back-only{display:flex;justify-content:flex-start;}
    .btn-ghost{display:flex;align-items:center;gap:6px;padding:9px 14px;background:transparent;border:1.5px solid #E8ECF0;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit;}
    /* Calendly slots */
    .cal-info{display:flex;align-items:center;gap:8px;font-size:13px;color:#0F6E56;background:#ECFDF5;padding:10px 14px;border-radius:10px;margin-bottom:14px;font-weight:600;}
    .slots-section{margin-bottom:16px;}
    .day-label{font-size:13px;font-weight:700;color:#374151;margin-bottom:8px;padding:6px 0;border-bottom:1px solid #F0F2F5;}
    .slots-row{display:flex;flex-wrap:wrap;gap:8px;padding-top:8px;}
    .slot-btn{padding:8px 16px;border:1.5px solid #E8ECF0;border-radius:20px;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#374151;font-family:inherit;transition:all .15s;}
    .slot-btn:hover{border-color:#2D4A8A;color:#2D4A8A;background:#F0F4FF;}
    .slot-btn.sel{background:#2D4A8A;color:#fff;border-color:#2D4A8A;}
    /* Book footer */
    .book-footer{background:#fff;border-radius:16px;padding:18px;margin-top:14px;border:1px solid #F0F2F5;box-shadow:0 1px 8px rgba(0,0,0,.05);}
    .sel-slot-info{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:700;color:#0F6E56;margin-bottom:12px;}
    .field{margin-bottom:10px;}
    .field label{display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:5px;}
    .inp{width:100%;padding:10px 13px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;color:#111;}
    .inp:focus{border-color:#2D4A8A;}
    .ta{resize:vertical;min-height:60px;}
    .err-box{background:#FEF2F2;color:#D84040;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:13px;}
    .ok-box{display:flex;align-items:center;gap:7px;background:#ECFDF5;color:#0F6E56;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:13px;font-weight:600;}
    .btn-book{width:100%;padding:13px;background:#2D4A8A;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;}
    .btn-book:disabled{opacity:.5;cursor:not-allowed;}
    .ring{width:16px;height:16px;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite;}
  `]
})
export class BookAppointmentComponent implements OnInit {
  private http   = inject(HttpClient);
  readonly router = inject(Router);
  private route  = inject(ActivatedRoute);

  loading      = signal(true);
  slotsLoading = signal(false);
  booking      = signal(false);
  booked       = signal(false);
  step         = signal(1);
  bookErr      = signal('');

  allDocs   = signal<any[]>([]);
  filtered  = signal<any[]>([]);
  selected  = signal<any>(null);
  slots     = signal<any[]>([]);
  selectedSlot = signal<any>(null);
  hasCalendly  = signal(false);
  specialties  = signal<string[]>([]);
  specFilter   = signal('');

  q       = '';
  notes   = '';
  rescheduleMode = false;
  rescheduleId   = '';
  private eventTypeUri = '';

  ngOnInit(): void {
    this.rescheduleId = this.route.snapshot.paramMap.get('id') ?? '';
    this.rescheduleMode = !!this.rescheduleId;

    // GET /api/Appointment/Doctors — doctors list
    this.http.get<any>(`${environment.apiUrl}/Appointment/Doctors`).subscribe({
      next: (res: any) => {
        const list: any[] = Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? [];
        this.allDocs.set(list);
        this.filtered.set(list);
        // Build specialties list
        const specs = [...new Set(list.map(d => this.docSpec(d)).filter(Boolean))];
        this.specialties.set(specs as string[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filterDocs(): void {
    const q   = this.q.toLowerCase();
    const sp  = this.specFilter();
    this.filtered.set(this.allDocs().filter(d =>
      (!q  || this.docName(d).toLowerCase().includes(q) || this.docSpec(d).toLowerCase().includes(q)) &&
      (!sp || this.docSpec(d) === sp)
    ));
  }

  selectDoc(d: any): void {
    this.selected.set(d);
    this.slots.set([]);
    this.selectedSlot.set(null);
  }

  loadSlots(): void {
    const d = this.selected();
    if (!d) return;
    this.slotsLoading.set(true);
    this.hasCalendly.set(false);

    // GET /api/Calendly/doctor/{doctorId}/event-types
    this.http.get<any>(`${environment.apiUrl}/Calendly/doctor/${d.id}/event-types`).subscribe({
      next: (res: any) => {
        const types = res?.data?.collection ?? res?.collection ?? res?.data ?? res ?? [];
        const typeList = Array.isArray(types) ? types : [];
        if (!typeList.length) { this.slotsLoading.set(false); return; }

        this.hasCalendly.set(true);
        this.eventTypeUri = typeList[0]?.uri ?? '';

        const from = new Date().toISOString();
        const to   = new Date(Date.now() + 14 * 86400000).toISOString();

        // GET /api/Calendly/slots/{doctorId}
        this.http.get<any>(`${environment.apiUrl}/Calendly/slots/${d.id}`, {
          params: { from, to, eventTypeUri: this.eventTypeUri }
        }).subscribe({
          next: (sRes: any) => {
            const raw = sRes?.data?.slots ?? sRes?.slots ?? sRes?.data ?? sRes ?? [];
            const slotArr = Array.isArray(raw) ? raw : [];
            this.slots.set(slotArr);
            this.slotsLoading.set(false);
          },
          error: () => { this.slots.set([]); this.slotsLoading.set(false); }
        });
      },
      error: () => { this.slotsLoading.set(false); }
    });
  }

  slotsByDay(): { date: Date; slots: any[] }[] {
    const map = new Map<string, { date: Date; slots: any[] }>();
    for (const s of this.slots()) {
      const d = new Date(s.startTime);
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, { date: d, slots: [] });
      map.get(key)!.slots.push(s);
    }
    return [...map.values()];
  }

  selectSlot(s: any): void {
    this.selectedSlot.set(s);
    this.bookErr.set('');
  }

  book(): void {
    const slot = this.selectedSlot();
    const doc  = this.selected();
    if (!slot || !doc) return;
    this.booking.set(true);
    this.bookErr.set('');

    // If rescheduling: cancel old then book new
    const doBook = () => {
      const body = {
        doctorId:        doc.id,
        appointmentTime: slot.startTime,
        notes:           this.notes || undefined,
        eventTypeUri:    this.eventTypeUri || undefined,
        inviteeUri:      slot.uri ?? slot.inviteeUri ?? undefined,
      };
      // POST /api/Appointment/book
      this.http.post(`${environment.apiUrl}/Appointment/book`, body).subscribe({
        next: () => {
          this.booking.set(false);
          this.booked.set(true);
          setTimeout(() => this.router.navigate(['/patient/appointments']), 1800);
        },
        error: (e: any) => {
          this.booking.set(false);
          this.bookErr.set(e?.error?.message ?? e?.error?.title ?? `Error ${e?.status}`);
        }
      });
    };

    if (this.rescheduleId) {
      // Cancel old appointment first
      this.http.put(`${environment.apiUrl}/Appointment/${this.rescheduleId}/cancel`, {}).subscribe({
        next: () => doBook(),
        error: () => doBook() // Still try to book even if cancel fails
      });
    } else {
      doBook();
    }
  }

  docName(d: any): string {
    const f = d?.firstName ?? d?.first_name ?? '';
    const l = d?.lastName  ?? d?.last_name  ?? '';
    const full = `${f} ${l}`.trim();
    return full || d?.name || d?.fullName || d?.email?.split('@')[0] || 'Doctor';
  }
  docSpec(d: any): string {
    return d?.specialtyName ?? d?.specialization ?? d?.specialty ?? '';
  }
  docPlace(d: any): string {
    return d?.clinicName ?? d?.workPlace ?? '';
  }
  ini(d: any): string {
    const n = this.docName(d).split(' ');
    return ((n[0]?.[0]??'D') + (n[1]?.[0]??'')).toUpperCase();
  }
  private COLORS = ['#2D4A8A','#0F6E56','#D84040','#7C3AED','#0891B2'];
  clr(n: string): string { return this.COLORS[(n?.charCodeAt(0)||0)%this.COLORS.length]; }
}
