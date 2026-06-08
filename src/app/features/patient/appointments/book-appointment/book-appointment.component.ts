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

  <!-- Header -->
  <div class="page-hdr">
    <div class="hdr-left">
      <button class="back-btn" (click)="router.navigate(['/patient/appointments'])">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div>
        <h1>{{ rescheduleMode ? 'Reschedule Appointment' : 'Book Appointment' }}</h1>
        <p class="sub">{{ step()===1 ? 'Select a doctor to get started' : 'Choose your preferred time slot' }}</p>
      </div>
    </div>
    <!-- Step indicator -->
    <div class="steps">
      <div class="step-item" [class.active]="step()===1" [class.done]="step()>1">
        <div class="step-num">{{ step()>1 ? '✓' : '1' }}</div>
        <span>Doctor</span>
      </div>
      <div class="step-line"></div>
      <div class="step-item" [class.active]="step()===2">
        <div class="step-num">2</div>
        <span>Time Slot</span>
      </div>
    </div>
  </div>

  <!-- ══════════════ STEP 1: Choose Doctor ══════════════ -->
  <ng-container *ngIf="step()===1">

    <!-- Search + Filter bar -->
    <div class="filter-bar">
      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input [(ngModel)]="q" (ngModelChange)="filterDocs()"
               placeholder="Search by name or specialty…" />
      </div>
      <div class="spec-chips">
        <button class="sp-chip" [class.active]="specFilter()===''"
                (click)="specFilter.set(''); filterDocs()">All</button>
        <button class="sp-chip" *ngFor="let s of specialties()"
                [class.active]="specFilter()===s"
                (click)="specFilter.set(s); filterDocs()">{{ s }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading" *ngIf="loading()">
      <div class="sp"></div><span>Loading doctors…</span>
    </div>

    <!-- Empty -->
    <div class="empty-state" *ngIf="!loading() && filtered().length===0">
      <div class="empty-ico">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <p>No doctors found</p>
      <span>Try a different search or specialty filter</span>
    </div>

    <!-- Doctors grouped by specialty -->
    <ng-container *ngIf="!loading() && filtered().length > 0">
      <ng-container *ngFor="let grp of groupedDocs()">
        <div class="spec-section">
          <div class="spec-title">
            <div class="spec-dot"></div>
            {{ grp.spec || 'General' }}
            <span class="spec-count">{{ grp.docs.length }}</span>
          </div>
          <div class="doc-grid">
            <div class="doc-card" *ngFor="let d of grp.docs"
                 [class.sel]="selected()?.id===d.id"
                 (click)="selectDoc(d)">
              <div class="doc-av" [style.background]="clr(docName(d))">{{ ini(d) }}</div>
              <div class="doc-info">
                <div class="doc-name">Dr. {{ docName(d) }}</div>
                <div class="doc-spec">{{ docSpec(d) }}</div>
                <div class="doc-place" *ngIf="docPlace(d)">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  {{ docPlace(d) }}
                </div>
                <div class="doc-exp" *ngIf="d.experienceYears">
                  {{ d.experienceYears }} yrs experience
                </div>
              </div>
              <div class="sel-check" *ngIf="selected()?.id===d.id">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </ng-container>

    <!-- Selected doctor sticky footer -->
    <div class="sel-footer" *ngIf="selected()">
      <div class="sel-doc-info">
        <div class="sel-av" [style.background]="clr(docName(selected()!))">{{ ini(selected()!) }}</div>
        <div>
          <div class="sel-name">Dr. {{ docName(selected()!) }}</div>
          <div class="sel-spec">{{ docSpec(selected()!) }}</div>
        </div>
      </div>
      <button class="btn-next" (click)="step.set(2); loadSlots()">
        Continue
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>

  </ng-container>

  <!-- ══════════════ STEP 2: Book Slot ══════════════ -->
  <ng-container *ngIf="step()===2">
    <div class="step2-grid">

      <!-- Left: slot picker -->
      <div class="slots-col">
        <div class="doc-banner">
          <div class="ban-av" [style.background]="clr(docName(selected()!))">{{ ini(selected()!) }}</div>
          <div>
            <div class="ban-name">Dr. {{ docName(selected()!) }}</div>
            <div class="ban-spec">{{ docSpec(selected()!) }}
              <span *ngIf="docPlace(selected()!)"> · {{ docPlace(selected()!) }}</span>
            </div>
          </div>
          <button class="change-btn" (click)="step.set(1); selected.set(null)">Change</button>
        </div>

        <!-- Loading slots -->
        <div class="loading" *ngIf="slotsLoading()">
          <div class="sp"></div><span>Loading Calendly slots…</span>
        </div>

        <!-- No Calendly -->
        <div class="empty-state" *ngIf="!slotsLoading() && !hasCalendly()">
          <div class="empty-ico">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p>No Calendly connected</p>
          <span>This doctor hasn't set up online booking yet</span>
          <button class="btn-back" (click)="step.set(1)">Choose another doctor</button>
        </div>

        <!-- No slots -->
        <div class="empty-state" *ngIf="!slotsLoading() && hasCalendly() && slots().length===0">
          <div class="empty-ico">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p>No available slots</p>
          <span>No openings in the next 14 days. Try another doctor.</span>
          <button class="btn-back" (click)="step.set(1)">Choose another doctor</button>
        </div>

        <!-- Slots by day -->
        <ng-container *ngIf="!slotsLoading() && slots().length > 0">
          <div class="cal-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Available in the next 14 days — powered by Calendly
          </div>
          <div class="day-section" *ngFor="let day of slotsByDay()">
            <div class="day-label">{{ day.date | date:'EEEE, MMMM d' }}</div>
            <div class="slots-row">
              <button class="slot-btn" *ngFor="let s of day.slots"
                      [class.sel]="selectedSlot()?.startTime===s.startTime"
                      (click)="selectSlot(s)">
                {{ s.startTime | date:'h:mm a' }}
              </button>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Right: booking summary -->
      <div class="summary-col">
        <div class="summary-card">
          <div class="sum-title">Booking Summary</div>

          <div class="sum-row">
            <div class="sum-lbl">Doctor</div>
            <div class="sum-val">Dr. {{ docName(selected()!) }}</div>
          </div>
          <div class="sum-row">
            <div class="sum-lbl">Specialty</div>
            <div class="sum-val">{{ docSpec(selected()!) || '—' }}</div>
          </div>
          <div class="sum-row" *ngIf="docPlace(selected()!)">
            <div class="sum-lbl">Location</div>
            <div class="sum-val">{{ docPlace(selected()!) }}</div>
          </div>
          <div class="sum-row">
            <div class="sum-lbl">Date & Time</div>
            <div class="sum-val" [class.pending]="!selectedSlot()">
              {{ selectedSlot() ? (selectedSlot()!.startTime | date:'EEE, MMM d · h:mm a') : 'Not selected yet' }}
            </div>
          </div>

          <div class="divider"></div>

          <div class="f" *ngIf="selectedSlot()">
            <label>Notes <span class="opt">(optional)</span></label>
            <textarea [(ngModel)]="notes" class="inp ta" rows="3"
                      placeholder="Reason for visit, symptoms, questions…"></textarea>
          </div>

          <div class="err-box" *ngIf="bookErr()">{{ bookErr() }}</div>
          <div class="ok-box" *ngIf="booked()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Booked! Redirecting…
          </div>

          <button class="btn-book" (click)="book()"
                  [disabled]="!selectedSlot() || booking() || booked()">
            <span class="ring" *ngIf="booking()"></span>
            {{ booking() ? 'Booking…' : booked() ? 'Booked!' : 'Confirm Booking' }}
          </button>

          <p class="cal-note" *ngIf="!selectedSlot()">
            ← Select a time slot to continue
          </p>
        </div>
      </div>

    </div><!-- /step2-grid -->
  </ng-container>

</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{width:100%;font-family:'Cairo','Segoe UI',sans-serif;padding-bottom:40px;}
    @keyframes sp{to{transform:rotate(360deg);}}

    /* ── Header ── */
    .page-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap;}
    .hdr-left{display:flex;align-items:center;gap:12px;}
    .back-btn{background:#fff;border:1.5px solid #E8ECF0;border-radius:10px;padding:8px;display:flex;cursor:pointer;color:#6B7280;flex-shrink:0;}
    .back-btn:hover{background:#F4F6FA;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#6B7280;margin-top:2px;}

    /* Step indicator */
    .steps{display:flex;align-items:center;gap:8px;flex-shrink:0;}
    .step-item{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#9CA3AF;}
    .step-item.active{color:#2D4A8A;}
    .step-item.done{color:#0F6E56;}
    .step-num{width:24px;height:24px;border-radius:50%;border:2px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;}
    .step-item.active .step-num{background:#2D4A8A;color:#fff;border-color:#2D4A8A;}
    .step-item.done .step-num{background:#0F6E56;color:#fff;border-color:#0F6E56;}
    .step-line{width:32px;height:2px;background:#E8ECF0;border-radius:1px;}
    @media(max-width:640px){.steps{display:none;}}

    /* ── Filter bar ── */
    .filter-bar{background:#fff;border-radius:16px;padding:16px;margin-bottom:20px;border:1px solid #F0F2F5;box-shadow:0 1px 6px rgba(0,0,0,.05);}
    .search-wrap{display:flex;align-items:center;gap:9px;border:1.5px solid #E8ECF0;border-radius:12px;padding:10px 14px;margin-bottom:12px;transition:border-color .15s;}
    .search-wrap:focus-within{border-color:#2D4A8A;}
    .search-wrap input{flex:1;border:none;outline:none;font-size:14px;font-family:inherit;color:#111;}
    .spec-chips{display:flex;gap:6px;flex-wrap:wrap;}
    .sp-chip{padding:6px 14px;border:1.5px solid #E8ECF0;border-radius:20px;background:#F8F9FC;font-size:12px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit;transition:all .15s;}
    .sp-chip:hover{border-color:#2D4A8A;color:#2D4A8A;}
    .sp-chip.active{background:#2D4A8A;color:#fff;border-color:#2D4A8A;}

    /* ── Loading ── */
    .loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px;color:#6B7280;font-size:14px;}
    .sp{width:22px;height:22px;border:2.5px solid #f0f0f0;border-top-color:#2D4A8A;border-radius:50%;animation:sp .7s linear infinite;flex-shrink:0;}

    /* ── Empty state ── */
    .empty-state{display:flex;flex-direction:column;align-items:center;gap:10px;padding:56px 24px;background:#fff;border-radius:18px;text-align:center;border:1px solid #F0F2F5;}
    .empty-ico{width:72px;height:72px;background:#F4F6FA;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty-state p{font-size:15px;font-weight:700;color:#374151;}
    .empty-state span{font-size:13px;color:#9CA3AF;max-width:260px;line-height:1.5;}
    .btn-back{padding:9px 20px;background:#F4F6FA;color:#374151;border:1.5px solid #E8ECF0;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:4px;}

    /* ── Specialty sections ── */
    .spec-section{margin-bottom:24px;}
    .spec-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#374151;margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;}
    .spec-dot{width:8px;height:8px;border-radius:50%;background:#2D4A8A;flex-shrink:0;}
    .spec-count{background:#EEF2FF;color:#2D4A8A;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;}

    /* ── Doctor grid ── */
    .doc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;}
    @media(max-width:640px){.doc-grid{grid-template-columns:1fr;}}
    .doc-card{background:#fff;border-radius:16px;padding:16px;display:flex;align-items:center;gap:12px;border:2px solid #F0F2F5;cursor:pointer;transition:all .15s;position:relative;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .doc-card:hover{border-color:#2D4A8A;box-shadow:0 4px 16px rgba(45,74,138,.1);transform:translateY(-1px);}
    .doc-card.sel{border-color:#2D4A8A;background:#F0F4FF;}
    .doc-av{width:48px;height:48px;border-radius:50%;color:#fff;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .doc-info{flex:1;min-width:0;}
    .doc-name{font-size:14px;font-weight:700;color:#111;margin-bottom:2px;}
    .doc-spec{font-size:12px;color:#2D4A8A;font-weight:600;margin-bottom:3px;}
    .doc-place{display:flex;align-items:center;gap:4px;font-size:11px;color:#9CA3AF;margin-bottom:2px;}
    .doc-exp{font-size:11px;color:#9CA3AF;}
    .sel-check{width:22px;height:22px;border-radius:50%;background:#2D4A8A;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

    /* ── Selected footer ── */
    .sel-footer{position:fixed;bottom:0;left:240px;right:0;background:#fff;padding:14px 24px;border-top:1px solid #F0F2F5;box-shadow:0 -4px 16px rgba(0,0,0,.07);z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;}
    @media(max-width:1024px){.sel-footer{left:0;}}
    .sel-doc-info{display:flex;align-items:center;gap:10px;}
    .sel-av{width:36px;height:36px;border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .sel-name{font-size:14px;font-weight:700;color:#111;}
    .sel-spec{font-size:12px;color:#6B7280;}
    .btn-next{display:flex;align-items:center;gap:8px;padding:11px 24px;background:#2D4A8A;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;}
    .btn-next:hover{background:#1E3A6E;}

    /* ── Step 2 two-column ── */
    .step2-grid{display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start;}
    @media(max-width:1024px){.step2-grid{grid-template-columns:1fr;}}

    /* Doctor banner */
    .doc-banner{display:flex;align-items:center;gap:12px;background:#fff;border-radius:14px;padding:14px 16px;border:1px solid #F0F2F5;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .ban-av{width:44px;height:44px;border-radius:50%;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .ban-name{font-size:15px;font-weight:700;color:#111;}
    .ban-spec{font-size:12px;color:#6B7280;margin-top:2px;}
    .change-btn{margin-left:auto;padding:6px 14px;background:#F4F6FA;border:1.5px solid #E8ECF0;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:#374151;font-family:inherit;flex-shrink:0;}
    .change-btn:hover{background:#E8ECF0;}

    /* Calendar header */
    .cal-header{display:flex;align-items:center;gap:7px;font-size:12px;color:#0F6E56;background:#ECFDF5;padding:9px 13px;border-radius:10px;margin-bottom:14px;font-weight:600;}

    /* Day sections */
    .day-section{margin-bottom:16px;background:#fff;border-radius:14px;padding:14px 16px;border:1px solid #F0F2F5;}
    .day-label{font-size:13px;font-weight:700;color:#374151;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
    .day-label::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:#2D4A8A;}
    .slots-row{display:flex;flex-wrap:wrap;gap:8px;}
    .slot-btn{padding:8px 16px;border:1.5px solid #E8ECF0;border-radius:20px;background:#F8F9FC;font-size:13px;font-weight:600;cursor:pointer;color:#374151;font-family:inherit;transition:all .15s;}
    .slot-btn:hover{border-color:#2D4A8A;color:#2D4A8A;background:#EEF2FF;}
    .slot-btn.sel{background:#2D4A8A;color:#fff;border-color:#2D4A8A;}

    /* Summary card */
    .summary-card{background:#fff;border-radius:18px;padding:20px;border:1px solid #F0F2F5;box-shadow:0 1px 8px rgba(0,0,0,.05);position:sticky;top:80px;}
    .sum-title{font-size:14px;font-weight:700;color:#111;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #F0F2F5;}
    .sum-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #F8F9FC;}
    .sum-row:last-of-type{border-bottom:none;}
    .sum-lbl{font-size:12px;color:#9CA3AF;font-weight:600;flex-shrink:0;}
    .sum-val{font-size:13px;font-weight:600;color:#111;text-align:right;}
    .sum-val.pending{color:#9CA3AF;font-weight:400;font-style:italic;}
    .divider{height:1px;background:#F0F2F5;margin:14px 0;}
    .f label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px;}
    .opt{color:#9CA3AF;font-weight:400;}
    .inp{width:100%;padding:10px 13px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;color:#111;}
    .inp:focus{border-color:#2D4A8A;}
    .ta{resize:vertical;min-height:80px;}
    .err-box{background:#FEF2F2;color:#D84040;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:13px;margin-top:10px;}
    .ok-box{display:flex;align-items:center;gap:7px;background:#ECFDF5;color:#0F6E56;border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:13px;font-weight:600;margin-top:10px;}
    .btn-book{width:100%;padding:13px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;transition:background .15s;}
    .btn-book:hover:not(:disabled){background:#B93030;}
    .btn-book:disabled{opacity:.45;cursor:not-allowed;}
    .ring{width:16px;height:16px;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite;}
    .cal-note{font-size:12px;color:#9CA3AF;text-align:center;margin-top:10px;}
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

  allDocs      = signal<any[]>([]);
  filtered     = signal<any[]>([]);
  selected     = signal<any>(null);
  slots        = signal<any[]>([]);
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
    this.rescheduleId  = this.route.snapshot.paramMap.get('id') ?? '';
    this.rescheduleMode = !!this.rescheduleId;

    this.http.get<any>(`${environment.apiUrl}/Appointment/Doctors`).subscribe({
      next: (res: any) => {
        const list: any[] = Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? [];
        this.allDocs.set(list);
        this.filtered.set(list);
        const specs = [...new Set(list.map(d => this.docSpec(d)).filter(Boolean))] as string[];
        this.specialties.set(specs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filterDocs(): void {
    const q  = this.q.toLowerCase();
    const sp = this.specFilter();
    this.filtered.set(this.allDocs().filter(d =>
      (!q  || this.docName(d).toLowerCase().includes(q) || this.docSpec(d).toLowerCase().includes(q)) &&
      (!sp || this.docSpec(d) === sp)
    ));
  }

  /** Group filtered doctors by specialty */
  groupedDocs(): { spec: string; docs: any[] }[] {
    const map = new Map<string, any[]>();
    for (const d of this.filtered()) {
      const sp = this.docSpec(d) || 'General';
      if (!map.has(sp)) map.set(sp, []);
      map.get(sp)!.push(d);
    }
    return [...map.entries()].map(([spec, docs]) => ({ spec, docs }));
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

    this.http.get<any>(`${environment.apiUrl}/Calendly/doctor/${d.id}/event-types`).subscribe({
      next: (res: any) => {
        const types    = res?.data?.collection ?? res?.collection ?? res?.data ?? res ?? [];
        const typeList = Array.isArray(types) ? types : [];
        if (!typeList.length) { this.slotsLoading.set(false); return; }

        this.hasCalendly.set(true);
        this.eventTypeUri = typeList[0]?.uri ?? '';

        const from = new Date().toISOString();
        const to   = new Date(Date.now() + 14 * 86_400_000).toISOString();

        this.http.get<any>(`${environment.apiUrl}/Calendly/slots/${d.id}`, {
          params: { from, to, eventTypeUri: this.eventTypeUri }
        }).subscribe({
          next: (sRes: any) => {
            const raw     = sRes?.data?.slots ?? sRes?.slots ?? sRes?.data ?? sRes ?? [];
            this.slots.set(Array.isArray(raw) ? raw : []);
            this.slotsLoading.set(false);
          },
          error: () => { this.slots.set([]); this.slotsLoading.set(false); }
        });
      },
      error: () => this.slotsLoading.set(false)
    });
  }

  slotsByDay(): { date: Date; slots: any[] }[] {
    const map = new Map<string, { date: Date; slots: any[] }>();
    for (const s of this.slots()) {
      const d   = new Date(s.startTime);
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, { date: d, slots: [] });
      map.get(key)!.slots.push(s);
    }
    return [...map.values()];
  }

  selectSlot(s: any): void { this.selectedSlot.set(s); this.bookErr.set(''); }

  book(): void {
    const slot = this.selectedSlot();
    const doc  = this.selected();
    if (!slot || !doc) return;
    this.booking.set(true);
    this.bookErr.set('');

    const doBook = () => {
      const body = {
        doctorId:        doc.id,
        appointmentTime: slot.startTime,
        notes:           this.notes || undefined,
        eventTypeUri:    this.eventTypeUri || undefined,
        inviteeUri:      slot.uri ?? slot.inviteeUri ?? undefined,
      };
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
      this.http.put(`${environment.apiUrl}/Appointment/${this.rescheduleId}/cancel`, {}).subscribe({
        next: () => doBook(), error: () => doBook()
      });
    } else {
      doBook();
    }
  }

  docName(d: any): string {
    const f = d?.firstName ?? d?.first_name ?? '';
    const l = d?.lastName  ?? d?.last_name  ?? '';
    return `${f} ${l}`.trim() || d?.name || d?.fullName || 'Doctor';
  }
  docSpec(d: any): string  { return d?.specialtyName ?? d?.specialization ?? d?.specialty ?? ''; }
  docPlace(d: any): string { return d?.clinicName ?? d?.workPlace ?? ''; }
  ini(d: any): string {
    const n = this.docName(d).split(' ');
    return ((n[0]?.[0] ?? 'D') + (n[1]?.[0] ?? '')).toUpperCase();
  }
  private COLORS = ['#2D4A8A','#0F6E56','#D84040','#7C3AED','#0891B2'];
  clr(n: string): string { return this.COLORS[(n?.charCodeAt(0) || 0) % this.COLORS.length]; }
}
