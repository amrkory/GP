import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { ActivatedRoute }     from '@angular/router';
import { HttpClient }         from '@angular/common/http';
import { environment }        from '../../../../environments/environment';

@Component({
  selector: 'app-calendly-connect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Calendly Integration</h1>
        <p class="sub">Connect your Calendly so patients can book real time slots and get email notifications</p>
      </div>

      <div class="loading" *ngIf="loading()">
        <div class="spinner"></div>
        <p>{{ loadingMsg() }}</p>
      </div>

      <div class="success-banner" *ngIf="justConnected()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Calendly connected! Patients can now book your real slots and get email confirmations.
      </div>

      <div class="error-banner" *ngIf="error()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ error() }}
      </div>

      <div class="connect-card" *ngIf="!connected() && !loading()">
        <div class="cal-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#006BFF" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <h2>Connect Calendly</h2>
        <p>Let patients see your real availability and book confirmed slots. Both you and the patient receive email confirmations automatically.</p>
        <div class="benefits">
          <div class="benefit" *ngFor="let b of benefits">
            <div class="b-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
            {{ b }}
          </div>
        </div>
        <button class="btn-connect" (click)="connect()" [disabled]="connecting()">
          <span class="mini-spinner" *ngIf="connecting()"></span>
          <svg *ngIf="!connecting()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          {{ connecting() ? 'Redirecting to Calendly...' : 'Connect with Calendly' }}
        </button>
        <p class="note">You will be redirected to Calendly to authorize access. Free Calendly accounts work fine.</p>
      </div>

      <div class="connected-card" *ngIf="connected() && !loading()">
        <div class="connected-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2>Calendly Connected</h2>
        <p>Your calendar is synced. Patients see your real available slots when booking.</p>
        <div class="event-types" *ngIf="eventTypes().length > 0">
          <div class="et-header">Your Event Types</div>
          <div class="et-row" *ngFor="let e of eventTypes()">
            <div class="et-dot"></div>
            <div><div class="et-name">{{ e.name }}</div><div class="et-meta">{{ e.duration }} min</div></div>
          </div>
        </div>
        <button class="btn-disconnect" (click)="connected.set(false)">Disconnect Calendly</button>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; }
    .page { padding:24px; max-width:580px; font-family:'Cairo','Segoe UI',sans-serif; }
    .page-header { margin-bottom:20px; }
    .page-header h1 { font-size:22px; font-weight:800; color:#111; margin:0 0 4px; }
    .sub { font-size:13px; color:#888; line-height:1.5; }
    .loading { display:flex; flex-direction:column; align-items:center; padding:48px; gap:12px; color:#888; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#006BFF; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .success-banner { display:flex; align-items:center; gap:8px; background:#E1F5EE; color:#0F6E56; border-radius:12px; padding:13px 16px; font-size:14px; font-weight:600; margin-bottom:16px; }
    .error-banner { display:flex; align-items:center; gap:8px; background:#FEF2F2; color:#D84040; border-radius:12px; padding:13px 16px; font-size:14px; margin-bottom:16px; }
    .connect-card, .connected-card { background:#fff; border-radius:20px; padding:28px; box-shadow:0 2px 16px rgba(0,0,0,.08); text-align:center; }
    .cal-icon { width:72px; height:72px; background:#E6F0FF; border-radius:20px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .connect-card h2, .connected-card h2 { font-size:20px; font-weight:800; color:#111; margin-bottom:8px; }
    .connect-card p, .connected-card p { font-size:14px; color:#666; line-height:1.6; margin-bottom:20px; }
    .benefits { display:flex; flex-direction:column; gap:8px; text-align:left; margin-bottom:24px; }
    .benefit { display:flex; align-items:center; gap:10px; font-size:14px; color:#444; }
    .b-icon { width:22px; height:22px; background:#E1F5EE; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .btn-connect { width:100%; padding:14px; background:#006BFF; color:#fff; border:none; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; margin-bottom:10px; }
    .btn-connect:disabled { opacity:.6; cursor:not-allowed; }
    .note { font-size:12px; color:#aaa; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    .connected-icon { width:64px; height:64px; background:#E1F5EE; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .event-types { background:#F7F8FA; border-radius:12px; padding:14px; margin-bottom:20px; text-align:left; }
    .et-header { font-size:11px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; }
    .et-row { display:flex; align-items:center; gap:10px; padding:7px 0; border-bottom:1px solid #eee; }
    .et-row:last-child { border-bottom:none; }
    .et-dot { width:8px; height:8px; border-radius:50%; background:#006BFF; flex-shrink:0; }
    .et-name { font-size:14px; font-weight:600; color:#111; }
    .et-meta { font-size:12px; color:#888; }
    .btn-disconnect { background:#FEF2F2; color:#D84040; border:none; padding:10px 22px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; }
  `],
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
  eventTypes    = signal<any[]>([]);

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
      this.loading.set(true);
      this.loadingMsg.set('Connecting your Calendly account...');
      this.http.get<any>(`${environment.apiUrl}/Calendly/callback`, { params: { code, state: state ?? '' } })
        .subscribe({
          next: () => { this.loading.set(false); this.connected.set(true); this.justConnected.set(true); this.loadEventTypes(); },
          error: (e: any) => { this.loading.set(false); this.error.set(e?.error?.message ?? 'Connection failed.'); }
        });
    } else {
      this.loadEventTypes();
    }
  }

  connect(): void {
    this.connecting.set(true); this.error.set('');
    this.http.get<any>(`${environment.apiUrl}/Calendly/connect`).subscribe({
      next: (res: any) => {
        const url = res?.data?.authUrl ?? res?.authUrl ?? res?.url ?? (typeof res?.data === 'string' ? res.data : null);
        if (url) { window.location.href = url; }
        else { this.connecting.set(false); this.error.set('Could not get Calendly authorization URL. Check backend configuration.'); }
      },
      error: (e: any) => { this.connecting.set(false); this.error.set(e?.error?.message ?? 'Failed to connect.'); }
    });
  }

  loadEventTypes(): void {
    this.http.get<any>(`${environment.apiUrl}/Calendly/doctor/event-types`).subscribe({
      next: (res: any) => {
        const types = res?.data?.collection ?? res?.collection ?? res?.data ?? [];
        if (Array.isArray(types) && types.length > 0) {
          this.connected.set(true);
          this.eventTypes.set(types.map((t: any) => ({ name: t.name ?? 'Consultation', duration: t.duration ?? 30 })));
        }
      },
      error: () => {}
    });
  }
}
