import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeServiceService } from '../../../../core/services/home-service.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Request Detail</h1>
        <span></span>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
      <div class="not-found" *ngIf="!loading() && !req()">
        <p>Request not found.</p>
        <button (click)="goBack()">← Back</button>
      </div>

      <ng-container *ngIf="!loading() && req()">

        <!-- Patient banner (colour = status) -->
        <div class="hero" [class]="normSt()">
          <div class="hero-av">{{ initials(pName()) }}</div>
          <div class="hero-info">
            <div class="hero-name">{{ pName() }}</div>
            <div class="hero-phone" *ngIf="pPhone()">📞 {{ pPhone() }}</div>
          </div>
          <span class="hero-badge">{{ statusLabel() }}</span>
        </div>

        <!-- Info card -->
        <div class="info-card">
          <div class="irow" *ngIf="svcType()">
            <div class="iico green"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg></div>
            <div><div class="ilbl">SERVICE TYPE</div><div class="ival svc">{{ svcType() }}</div></div>
          </div>
          <div class="irow" *ngIf="svcTime()">
            <div class="iico blue"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <div>
              <div class="ilbl">DATE &amp; TIME</div>
              <div class="ival bold">{{ svcTime() | date:'EEEE, MMMM d, y' }}</div>
              <div class="ival">{{ svcTime() | date:'h:mm a' }}</div>
            </div>
          </div>
          <div class="irow" *ngIf="svcAddr()">
            <div class="iico yellow"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
            <div><div class="ilbl">ADDRESS</div><div class="ival">{{ svcAddr() }}</div></div>
          </div>
          <div class="irow" *ngIf="svcNotes()">
            <div class="iico gray"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
            <div><div class="ilbl">NOTES</div><div class="ival">{{ svcNotes() }}</div></div>
          </div>
        </div>

        <!-- Toast -->
        <div class="toast success" *ngIf="toast()==='accepted'">✅ Accepted! Patient notified.</div>
        <div class="toast success" *ngIf="toast()==='completed'">✅ Visit marked completed!</div>
        <div class="toast error"   *ngIf="toast()==='rejected'">❌ Request rejected.</div>

        <!-- Pending: Accept + Reject -->
        <div class="actions" *ngIf="normSt()==='pending'">
          <button class="btn-accept" (click)="accept()" [disabled]="!!acting()">
            <span class="spin-sm" *ngIf="acting()==='accept'"></span>
            <svg *ngIf="acting()!=='accept'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Accept Request
          </button>
          <button class="btn-reject" (click)="promptReject()" [disabled]="!!acting()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Reject
          </button>
        </div>

        <!-- Accepted: Complete + Cancel -->
        <div class="actions" *ngIf="normSt()==='accepted'">
          <button class="btn-complete" (click)="promptComplete()" [disabled]="!!acting()">
            <span class="spin-sm" *ngIf="acting()==='complete'"></span>
            <svg *ngIf="acting()!=='complete'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Mark Completed
          </button>
          <button class="btn-cancel-visit" (click)="promptReject()" [disabled]="!!acting()">Cancel Visit</button>
        </div>

        <!-- Terminal states -->
        <div class="terminal completed" *ngIf="normSt()==='completed'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Visit completed.
        </div>
        <div class="terminal rejected" *ngIf="normSt()==='rejected'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          Request rejected.
        </div>

      </ng-container>
    </div>

    <!-- Reject dialog -->
    <div class="backdrop" *ngIf="showRejectDlg" (click)="showRejectDlg=false"></div>
    <div class="dialog" *ngIf="showRejectDlg">
      <div class="dlg-ico red"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
      <h3>{{ normSt()==='accepted' ? 'Cancel Visit?' : 'Reject Request?' }}</h3>
      <p>{{ normSt()==='accepted' ? 'Cancel visit for' : 'Reject request from' }} <strong>{{ pName() }}</strong>?</p>
      <div class="dlg-field">
        <label>Reason</label>
        <select [(ngModel)]="rejectReason" class="sel">
          <option value="">Select a reason</option>
          <option value="Not available">Not available at this time</option>
          <option value="Out of service area">Out of service area</option>
          <option value="Scheduling conflict">Scheduling conflict</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="dlg-btns">
        <button class="btn-keep" (click)="showRejectDlg=false">Go Back</button>
        <button class="btn-confirm-reject" (click)="doReject()" [disabled]="!rejectReason||acting()==='reject'">
          <span class="spin-sm white" *ngIf="acting()==='reject'"></span> Confirm
        </button>
      </div>
    </div>

    <!-- Complete dialog -->
    <div class="backdrop" *ngIf="showCompleteDlg" (click)="showCompleteDlg=false"></div>
    <div class="dialog" *ngIf="showCompleteDlg">
      <div class="dlg-ico green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
      <h3>Complete Visit?</h3>
      <p>Mark visit for <strong>{{ pName() }}</strong> as completed?</p>
      <div class="dlg-field">
        <label>Visit Notes (optional)</label>
        <textarea [(ngModel)]="completeNotes" class="sel ta" rows="3" placeholder="e.g. Service completed, patient stable..."></textarea>
      </div>
      <div class="dlg-btns">
        <button class="btn-keep" (click)="showCompleteDlg=false">Back</button>
        <button class="btn-confirm-complete" (click)="doComplete()" [disabled]="acting()==='complete'">
          <span class="spin-sm white" *ngIf="acting()==='complete'"></span> Complete
        </button>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { padding:22px; max-width:680px; font-family:'Cairo','Segoe UI',sans-serif; }
    @media(max-width:768px){ .page{padding:14px;} }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
    h1 { font-size:18px; font-weight:800; color:#111; }
    .back-btn { width:36px; height:36px; background:#f5f5f5; border:none; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .back-btn:hover { background:#eee; }
    .loading { display:flex; justify-content:center; padding:60px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#0F6E56; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}
    .not-found { text-align:center; padding:40px; color:#888; }
    .not-found button { margin-top:12px; padding:10px 20px; background:#0F6E56; color:#fff; border:none; border-radius:10px; cursor:pointer; font-family:inherit; }

    /* Hero */
    .hero { border-radius:16px; padding:20px; display:flex; align-items:center; gap:14px; margin-bottom:14px; }
    .hero.pending    { background:linear-gradient(135deg,#d4a017,#f0c040); }
    .hero.accepted   { background:linear-gradient(135deg,#0F6E56,#1A9070); }
    .hero.completed  { background:linear-gradient(135deg,#185FA5,#2A7AC0); }
    .hero.rejected   { background:linear-gradient(135deg,#D84040,#E86060); }
    .hero.inprogress { background:linear-gradient(135deg,#7C3AED,#9061ED); }
    .hero-av { width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,.25); color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .hero-info { flex:1; }
    .hero-name { font-size:17px; font-weight:800; color:#fff; }
    .hero-phone { font-size:12px; color:rgba(255,255,255,.85); margin-top:3px; }
    .hero-badge { font-size:12px; padding:5px 14px; border-radius:20px; font-weight:700; background:rgba(255,255,255,.9); color:#111; white-space:nowrap; }

    /* Info card */
    .info-card { background:#fff; border-radius:16px; margin-bottom:14px; box-shadow:0 1px 8px rgba(0,0,0,.07); overflow:hidden; }
    .irow { display:flex; align-items:flex-start; gap:14px; padding:13px 16px; border-bottom:1px solid #f5f5f5; }
    .irow:last-child { border-bottom:none; }
    .iico { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .iico.green  { background:#E1F5EE; }
    .iico.blue   { background:#E6F1FB; }
    .iico.yellow { background:#FEF9E7; }
    .iico.gray   { background:#f5f5f5; }
    .ilbl { font-size:11px; font-weight:700; color:#aaa; letter-spacing:.5px; margin-bottom:3px; }
    .ival { font-size:14px; color:#333; }
    .ival.svc { color:#0F6E56; font-weight:700; }
    .ival.bold { font-weight:700; color:#111; }

    /* Toast */
    .toast { display:flex; align-items:center; gap:8px; padding:12px 16px; border-radius:12px; font-size:13px; font-weight:600; margin-bottom:14px; }
    .toast.success { background:#E1F5EE; color:#0F6E56; }
    .toast.error   { background:#FEF2F2; color:#D84040; }

    /* Actions */
    .actions { display:flex; gap:10px; margin-bottom:14px; }
    .btn-accept { flex:2; padding:14px; background:#0F6E56; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; font-family:inherit; }
    .btn-accept:hover:not(:disabled){ background:#0a5a43; }
    .btn-reject { flex:1; padding:14px; background:#FEF2F2; color:#D84040; border:1.5px solid #FBDCDC; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; font-family:inherit; }
    .btn-complete { flex:2; padding:14px; background:#185FA5; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; font-family:inherit; }
    .btn-cancel-visit { flex:1; padding:14px; background:#fff; color:#D84040; border:1.5px solid #FBDCDC; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
    .btn-accept:disabled,.btn-reject:disabled,.btn-complete:disabled,.btn-cancel-visit:disabled{ opacity:.5; cursor:not-allowed; }
    .spin-sm { width:13px; height:13px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; vertical-align:middle; }
    .spin-sm.white { border-color:rgba(255,255,255,.3); border-top-color:#fff; }

    .terminal { display:flex; align-items:center; gap:8px; padding:13px 16px; border-radius:12px; font-size:14px; font-weight:600; }
    .terminal.completed { background:#E1F5EE; color:#0F6E56; }
    .terminal.rejected  { background:#FEF2F2; color:#D84040; }

    /* Dialog */
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:100; }
    .dialog { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#fff; border-radius:20px; padding:28px 24px; width:90%; max-width:400px; z-index:101; box-shadow:0 16px 48px rgba(0,0,0,.2); }
    .dlg-ico { width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .dlg-ico.red   { background:#FEF2F2; }
    .dlg-ico.green { background:#E1F5EE; }
    .dialog h3 { font-size:17px; font-weight:800; color:#111; text-align:center; margin-bottom:6px; }
    .dialog p  { font-size:14px; color:#666; text-align:center; line-height:1.5; margin-bottom:16px; }
    .dialog p strong { color:#111; }
    .dlg-field { margin-bottom:16px; }
    .dlg-field label { display:block; font-size:12px; font-weight:700; color:#555; margin-bottom:6px; }
    .sel { width:100%; padding:10px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:inherit; outline:none; background:#fff; }
    .sel:focus { border-color:#0F6E56; }
    .ta { resize:none; }
    .dlg-btns { display:flex; gap:10px; }
    .btn-keep { flex:1; padding:12px; border:1.5px solid #e8e8e8; background:#fff; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; color:#555; }
    .btn-confirm-reject  { flex:1; padding:12px; background:#D84040; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:6px; }
    .btn-confirm-complete{ flex:1; padding:12px; background:#0F6E56; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:6px; }
    .btn-confirm-reject:disabled,.btn-confirm-complete:disabled{ opacity:.5; cursor:not-allowed; }
  `]
})
export class RequestDetailComponent implements OnInit {
  private svc     = inject(HomeServiceService);
  readonly router = inject(Router);
  private route   = inject(ActivatedRoute);

  loading = signal(true);
  acting  = signal('');
  toast   = signal('');
  req     = signal<any>(null);
  showRejectDlg  = false;
  showCompleteDlg = false;
  rejectReason  = '';
  completeNotes = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getNurseRequests().subscribe({
      next: (res: any) => {
        let list: any[] = [];
        if      (Array.isArray(res))             list = res;
        else if (Array.isArray(res?.data))        list = res.data;
        else if (Array.isArray(res?.data?.items)) list = res.data.items;
        const found = list.find((r: any) => String(r.id) === String(id));
        console.log('[Detail] id=', id, 'found status=', found?.status);
        this.req.set(found ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goBack(): void { this.router.navigate(['/provider/requests']); }

  /** Numeric OR string status → lowercase string key */
  normSt(): string {
    const s = this.req()?.status;
    if (s === null || s === undefined) return 'pending';
    if (typeof s === 'number') {
      const m: Record<number,string> = {0:'pending',1:'accepted',2:'completed',3:'rejected',4:'inprogress'};
      return m[s] ?? 'pending';
    }
    return String(s).toLowerCase().trim();
  }

  statusLabel(): string {
    const m: Record<string,string> = {pending:'Pending',accepted:'Accepted',completed:'Completed',rejected:'Rejected',inprogress:'In Progress'};
    return m[this.normSt()] ?? String(this.req()?.status ?? '');
  }

  pName():    string { return this.req()?.patientName ?? this.req()?.clientName ?? '—'; }
  pPhone():   string { return this.req()?.patientPhone ?? this.req()?.patientPhoneNumber ?? this.req()?.phoneNumber ?? ''; }
  svcType():  string { return this.req()?.serviceType ?? this.req()?.serviceDescription ?? ''; }
  svcTime():  string { return this.req()?.requestedTime ?? this.req()?.scheduledAt ?? ''; }
  svcAddr():  string { return this.req()?.patientAddress ?? this.req()?.address ?? ''; }
  svcNotes(): string { const n = this.req()?.notes; const d = this.req()?.serviceDescription; return n ?? (d && d !== this.svcType() ? d : '') ?? ''; }

  initials(name: string): string {
    return (name||'?').split(' ').map((n:string)=>n[0]||'').join('').slice(0,2).toUpperCase()||'?';
  }

  accept(): void {
    this.acting.set('accept');
    this.svc.updateStatus(this.req()!.id, true).subscribe({
      next: () => {
        this.req.update((r:any) => ({...r, status:'Accepted'}));
        this.acting.set(''); this.toast.set('accepted');
        setTimeout(() => { this.toast.set(''); this.goBack(); }, 1800);
      },
      error: (e) => { console.error('accept:', e); this.acting.set(''); }
    });
  }

  promptReject(): void { this.rejectReason = ''; this.showRejectDlg = true; }
  doReject(): void {
    this.acting.set('reject');
    this.svc.updateStatus(this.req()!.id, false).subscribe({
      next: () => {
        this.req.update((r:any) => ({...r, status:'Rejected'}));
        this.acting.set(''); this.showRejectDlg = false; this.toast.set('rejected');
        setTimeout(() => { this.toast.set(''); this.goBack(); }, 1800);
      },
      error: (e) => { console.error('reject:', e); this.acting.set(''); this.showRejectDlg = false; }
    });
  }

  promptComplete(): void { this.completeNotes = ''; this.showCompleteDlg = true; }
  doComplete(): void {
    this.acting.set('complete');
    this.svc.completeRequest(this.req()!.id).subscribe({
      next: () => {
        this.req.update((r:any) => ({...r, status:'Completed'}));
        this.acting.set(''); this.showCompleteDlg = false; this.toast.set('completed');
        setTimeout(() => { this.toast.set(''); this.goBack(); }, 1800);
      },
      error: (e) => { console.error('complete:', e); this.acting.set(''); this.showCompleteDlg = false; }
    });
  }
}
