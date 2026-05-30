import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../environments/environment';

@Component({
  selector: 'app-calendly-connect',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-hdr">
        <h1>Calendly Integration</h1>
        <p class="sub">Connect your Calendly so patients can book real-time slots and get email confirmations</p>
      </div>

      <!-- Processing OAuth callback -->
      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
        <p>{{ loadingMsg() }}</p>
      </div>

      <!-- Success banner -->
      <div class="banner success" *ngIf="justConnected()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Calendly connected successfully! Patients can now see and book your real available slots.
      </div>

      <!-- Error banner -->
      <div class="banner error" *ngIf="error()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ error() }}
      </div>

      <!-- ── CONNECTED STATE ── -->
      <div class="connected-card" *ngIf="connected() && !loading()">
        <div class="cc-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2>Calendly is Connected ✓</h2>
        <p>Your calendar is synced. Patients see your real available slots automatically when booking appointments.</p>

        <!-- Event types -->
        <div class="event-types" *ngIf="eventTypes().length > 0">
          <div class="et-hdr">YOUR EVENT TYPES</div>
          <div class="et-row" *ngFor="let e of eventTypes()">
            <div class="et-dot"></div>
            <div class="et-info">
              <div class="et-name">{{ e.name }}</div>
              <div class="et-meta">{{ e.duration }} min · {{ e.scheduling_url ?? '' }}</div>
            </div>
          </div>
        </div>

        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat">
            <div class="stat-num">{{ eventTypes().length }}</div>
            <div class="stat-lbl">Event Types</div>
          </div>
          <div class="stat">
            <div class="stat-num">{{ totalSlots }}</div>
            <div class="stat-lbl">Slots (7 days)</div>
          </div>
          <div class="stat">
            <div class="stat-num">Auto</div>
            <div class="stat-lbl">Email Confirm</div>
          </div>
        </div>

        <div class="action-row">
          <a class="btn-calendly" href="https://calendly.com/event_types/user/me" target="_blank" rel="noopener">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Manage in Calendly
          </a>
          <button class="btn-disconnect" (click)="disconnect()">Disconnect</button>
        </div>
      </div>

      <!-- ── NOT CONNECTED STATE ── -->
      <div class="connect-card" *ngIf="!connected() && !loading()">

        <div class="cal-icon">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#006BFF" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h2>Connect Calendly</h2>
        <p>Let patients see your real availability and book confirmed slots. Both you and the patient receive email confirmations automatically.</p>

        <div class="benefits">
          <div class="benefit" *ngFor="let b of benefits">
            <div class="b-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span>{{ b }}</span>
          </div>
        </div>

        <button class="btn-connect" (click)="connect()" [disabled]="connecting()">
          <span class="mini-spin" *ngIf="connecting()"></span>
          <svg *ngIf="!connecting()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          {{ connecting() ? 'Opening Calendly...' : 'Connect with Calendly' }}
        </button>
        <p class="note">You will be redirected to Calendly to authorize access. Free Calendly accounts work fine.</p>

        <!-- Debug: show raw API response if URL extraction fails -->
        <div class="debug-box" *ngIf="debugResponse()">
          <p class="debug-title">API Response (for debugging):</p>
          <pre class="debug-pre">{{ debugResponse() }}</pre>
          <p class="debug-hint">If you see a URL above, please share it with your developer.</p>
        </div>

        <!-- Manual override: paste Calendly URL -->
        <div class="manual-section">
          <button class="btn-text" (click)="showManual = !showManual">
            {{ showManual ? '↑ Hide manual option' : '↓ Already have a Calendly event URL? Enter it manually' }}
          </button>
          <ng-container *ngIf="showManual">
            <div class="manual-form">
              <label>Your Calendly Event URL</label>
              <input [(ngModel)]="manualUrl" class="inp"
                     placeholder="https://calendly.com/your-name/consultation" />
              <button class="btn-save-manual" (click)="saveManualUrl()" [disabled]="!manualUrl || savingManual()">
                <span class="mini-spin dark" *ngIf="savingManual()"></span>
                {{ savingManual() ? 'Saving...' : 'Save URL' }}
              </button>
              <div class="manual-success" *ngIf="manualSaved()">
                ✓ URL saved! Patients can now book from your Calendly link.
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { padding:24px; max-width:600px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:14px;} }
    .page-hdr { margin-bottom:22px; }
    h1 { font-size:22px; font-weight:800; color:#111; }
    .sub { font-size:13px; color:#888; margin-top:4px; line-height:1.6; }

    .loading { display:flex; flex-direction:column; align-items:center; padding:60px; gap:14px; color:#888; font-size:14px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#006BFF; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}

    .banner { display:flex; align-items:center; gap:10px; border-radius:12px; padding:13px 16px; font-size:14px; font-weight:600; margin-bottom:16px; }
    .banner.success { background:#E1F5EE; color:#0F6E56; }
    .banner.error   { background:#FEF2F2; color:#D84040; }

    /* Connected card */
    .connected-card { background:#fff; border-radius:20px; padding:28px; box-shadow:0 2px 16px rgba(0,0,0,.08); text-align:center; }
    .cc-icon { width:68px; height:68px; background:#E1F5EE; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .connected-card h2 { font-size:20px; font-weight:800; color:#111; margin-bottom:8px; }
    .connected-card p  { font-size:14px; color:#666; line-height:1.6; margin-bottom:20px; }

    .event-types { background:#F7F8FA; border-radius:12px; padding:14px; margin-bottom:18px; text-align:left; }
    .et-hdr { font-size:11px; font-weight:800; color:#aaa; letter-spacing:1px; margin-bottom:10px; }
    .et-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #eee; }
    .et-row:last-child { border-bottom:none; }
    .et-dot { width:8px; height:8px; border-radius:50%; background:#006BFF; flex-shrink:0; }
    .et-name { font-size:14px; font-weight:700; color:#111; }
    .et-meta { font-size:12px; color:#888; margin-top:1px; }

    .stats-row { display:flex; justify-content:space-around; background:#F7F8FA; border-radius:12px; padding:16px; margin-bottom:20px; }
    .stat-num { font-size:22px; font-weight:800; color:#111; }
    .stat-lbl { font-size:11px; color:#888; margin-top:2px; }

    .action-row { display:flex; gap:10px; }
    .btn-calendly { flex:2; padding:12px; background:#006BFF; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:7px; font-family:inherit; }
    .btn-calendly:hover { background:#0056d6; }
    .btn-disconnect { flex:1; padding:12px; background:#FEF2F2; color:#D84040; border:1.5px solid #FBDCDC; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }

    /* Connect card */
    .connect-card { background:#fff; border-radius:20px; padding:28px; box-shadow:0 2px 16px rgba(0,0,0,.08); text-align:center; }
    .cal-icon { width:74px; height:74px; background:#E6F0FF; border-radius:20px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .connect-card h2 { font-size:20px; font-weight:800; color:#111; margin-bottom:8px; }
    .connect-card p  { font-size:14px; color:#666; line-height:1.6; margin-bottom:20px; }

    .benefits { display:flex; flex-direction:column; gap:8px; text-align:left; margin-bottom:24px; }
    .benefit { display:flex; align-items:center; gap:10px; font-size:14px; color:#444; }
    .b-check { width:22px; height:22px; background:#E1F5EE; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

    .btn-connect { width:100%; padding:14px; background:#006BFF; color:#fff; border:none; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; margin-bottom:10px; transition:opacity .15s; }
    .btn-connect:hover:not(:disabled){ opacity:.88; }
    .btn-connect:disabled { opacity:.55; cursor:not-allowed; }
    .note { font-size:12px; color:#aaa; margin-bottom:16px; }
    .mini-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
    .mini-spin.dark { border-color:rgba(0,0,0,.15); border-top-color:#006BFF; }

    /* Debug */
    .debug-box { background:#1e1e2e; border-radius:10px; padding:14px; margin-bottom:14px; text-align:left; }
    .debug-title { font-size:11px; color:#aaa; margin-bottom:6px; }
    .debug-pre { font-size:11px; color:#a8ff78; white-space:pre-wrap; word-break:break-all; max-height:120px; overflow-y:auto; }
    .debug-hint { font-size:11px; color:#888; margin-top:6px; }

    /* Manual */
    .manual-section { margin-top:16px; border-top:1px solid #f0f0f0; padding-top:14px; }
    .btn-text { background:none; border:none; color:#006BFF; font-size:13px; cursor:pointer; font-family:inherit; display:block; width:100%; text-align:center; }
    .manual-form { margin-top:12px; text-align:left; }
    .manual-form label { display:block; font-size:13px; font-weight:600; color:#555; margin-bottom:6px; }
    .inp { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:inherit; outline:none; margin-bottom:8px; }
    .inp:focus { border-color:#006BFF; }
    .btn-save-manual { width:100%; padding:12px; background:#006BFF; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:6px; }
    .btn-save-manual:disabled { opacity:.5; cursor:not-allowed; }
    .manual-success { background:#E1F5EE; color:#0F6E56; border-radius:8px; padding:10px 12px; font-size:13px; font-weight:600; margin-top:8px; }
  `]
})
export class CalendlyConnectComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);

  loading       = signal(false);
  loadingMsg    = signal('');
  connecting    = signal(false);
  connected     = signal(false);
  justConnected = signal(false);
  error         = signal('');
  debugResponse = signal('');
  eventTypes    = signal<any[]>([]);
  totalSlots    = 0;

  showManual   = false;
  manualUrl    = '';
  savingManual = signal(false);
  manualSaved  = signal(false);

  benefits = [
    'Patients see your real available time slots',
    'Automatic email sent to you & patient on booking',
    'Calendar synced — no double bookings',
    'Video meeting links auto-generated',
  ];

  ngOnInit(): void {
    const code  = this.route.snapshot.queryParams['code'];
    const state = this.route.snapshot.queryParams['state'];

    if (code) {
      // OAuth callback
      this.loading.set(true);
      this.loadingMsg.set('Connecting your Calendly account...');
      this.http.get<any>(`${environment.apiUrl}/Calendly/callback`, {
        params: { code, state: state ?? '' }
      }).subscribe({
        next: () => {
          this.loading.set(false);
          this.connected.set(true);
          this.justConnected.set(true);
          this.loadEventTypes();
        },
        error: (e: any) => {
          this.loading.set(false);
          this.error.set(e?.error?.message ?? 'Calendly connection failed. Please try again.');
        }
      });
    } else {
      this.loadEventTypes();
    }
  }

  connect(): void {
    this.connecting.set(true);
    this.error.set('');
    this.debugResponse.set('');

    this.http.get<any>(`${environment.apiUrl}/Calendly/connect`).subscribe({
      next: (res: any) => {
        console.log('[Calendly connect] raw response:', res);

        // Try every possible field the backend might use for the OAuth URL
        const url =
          res?.data?.authorizationUrl ??
          res?.data?.authUrl           ??
          res?.data?.redirectUrl       ??
          res?.data?.url               ??
          res?.authorizationUrl        ??
          res?.authUrl                 ??
          res?.redirectUrl             ??
          res?.url                     ??
          (typeof res?.data === 'string' && res.data.startsWith('http') ? res.data : null) ??
          (typeof res === 'string' && res.startsWith('http') ? res : null);

        if (url) {
          // Redirect to Calendly OAuth
          window.location.href = url;
        } else {
          // URL not found — show debug info so we know what the backend returned
          this.connecting.set(false);
          this.debugResponse.set(JSON.stringify(res, null, 2));
          this.error.set(
            'Calendly is not configured on the server yet. ' +
            'Ask your backend developer to set CALENDLY_CLIENT_ID and CALENDLY_CLIENT_SECRET ' +
            'in the server environment variables. ' +
            'Or use the manual URL option below.'
          );
        }
      },
      error: (e: any) => {
        this.connecting.set(false);
        console.error('[Calendly connect] error:', e);
        const msg = e?.error?.message ?? e?.message ?? '';
        this.error.set(
          msg ||
          'Server error connecting to Calendly. ' +
          'Make sure the backend has Calendly OAuth credentials configured.'
        );
        this.debugResponse.set(JSON.stringify(e?.error ?? e?.message ?? e, null, 2));
      }
    });
  }

  loadEventTypes(): void {
    this.http.get<any>(`${environment.apiUrl}/Calendly/doctor/event-types`).subscribe({
      next: (res: any) => {
        const types = res?.data?.collection ?? res?.collection ?? res?.data ?? [];
        if (Array.isArray(types) && types.length > 0) {
          this.connected.set(true);
          this.eventTypes.set(types.map((t: any) => ({
            name:            t.name           ?? 'Consultation',
            duration:        t.duration       ?? 30,
            scheduling_url:  t.scheduling_url ?? '',
          })));
          // Count available slots in next 7 days
          this.loadSlotCount(types[0]?.uri ?? '');
        }
      },
      error: () => {}
    });
  }

  private loadSlotCount(eventTypeUri: string): void {
    if (!eventTypeUri) return;
    const from = new Date().toISOString();
    const to   = new Date(Date.now() + 7 * 86400000).toISOString();
    this.http.get<any>(`${environment.apiUrl}/Calendly/slots/me`, {
      params: { from, to, eventTypeUri }
    }).subscribe({
      next: (res: any) => {
        const slots = res?.data?.slots ?? res?.slots ?? [];
        this.totalSlots = Array.isArray(slots) ? slots.length : 0;
      },
      error: () => {}
    });
  }

  saveManualUrl(): void {
    this.savingManual.set(true);
    this.http.put<any>(`${environment.apiUrl}/Profile/doctorNurse`, {
      calendlyEventUrl: this.manualUrl
    }).subscribe({
      next: () => {
        this.savingManual.set(false);
        this.manualSaved.set(true);
        this.connected.set(true);
        setTimeout(() => this.manualSaved.set(false), 3000);
      },
      error: (e) => {
        this.savingManual.set(false);
        console.error('save manual url:', e);
      }
    });
  }

  disconnect(): void {
    this.connected.set(false);
    this.eventTypes.set([]);
    this.justConnected.set(false);
    // Clear saved URL
    this.http.put<any>(`${environment.apiUrl}/Profile/doctorNurse`, {
      calendlyEventUrl: null
    }).subscribe({ error: () => {} });
  }
}
