import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeServiceService } from '../../../../core/services/home-service.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/provider/requests'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Request Detail</h1>
        <span></span>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading() && req()">
        <!-- Hero card -->
        <div class="hero-card">
          <div class="pat-avatar">{{ initials(req()!.patientName) }}</div>
          <div class="pat-info">
            <div class="pat-name">{{ req()!.patientName }}</div>
            <div class="pat-phone">{{ req()!.patientPhone }}</div>
          </div>
          <span class="status-pill" [class]="req()!.status.toLowerCase()">{{ req()!.status }}</span>
        </div>

        <!-- Info rows -->
        <div class="info-card">
          <div class="info-row">
            <div class="info-icon svc">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg>
            </div>
            <div><div class="info-lbl">Service Type</div><div class="info-val service-type">{{ req()!.serviceType }}</div></div>
          </div>
          <div class="info-row">
            <div class="info-icon cal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div><div class="info-lbl">Scheduled</div><div class="info-val">{{ (req()!.requestedTime ?? req()!.scheduledAt) | date:'EEEE, MMMM d, y · h:mm a' }}</div></div>
          </div>
          <div class="info-row">
            <div class="info-icon loc">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div><div class="info-lbl">Address</div><div class="info-val">{{ req()!.patientAddress ?? req()!.address }}</div></div>
          </div>
          <div class="info-row" *ngIf="req()!.serviceDescription ?? req()!.notes">
            <div class="info-icon note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div><div class="info-lbl">Patient Notes</div><div class="info-val">{{ req()!.serviceDescription ?? req()!.notes }}</div></div>
          </div>
        </div>

        <!-- Pending actions -->
        <div class="actions" *ngIf="req()!.status === 'Pending'">
          <button class="btn-accept" (click)="accept()" [disabled]="!!acting()">
            <span class="mini-spinner" *ngIf="acting()==='accept'"></span>
            <svg *ngIf="acting()!=='accept'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Accept Request
          </button>
          <button class="btn-reject" (click)="promptReject()" [disabled]="!!acting()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Reject
          </button>
        </div>

        <!-- Accepted actions -->
        <div class="actions" *ngIf="req()!.status === 'Accepted'">
          <button class="btn-complete" (click)="promptComplete()" [disabled]="!!acting()">
            <span class="mini-spinner" *ngIf="acting()==='complete'"></span>
            <svg *ngIf="acting()!=='complete'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Mark as Completed
          </button>
          <button class="btn-reject outline" (click)="promptReject()" [disabled]="!!acting()">Cancel Visit</button>
        </div>

        <!-- Toast messages -->
        <div class="toast success" *ngIf="toast()==='accepted'">✅ Request accepted!</div>
        <div class="toast success" *ngIf="toast()==='completed'">✅ Visit completed!</div>
        <div class="toast error"   *ngIf="toast()==='rejected'">❌ Request rejected.</div>
      </ng-container>
    </div>

    <!-- Reject Dialog -->
    <div class="dialog-backdrop" *ngIf="showRejectDialog" (click)="showRejectDialog=false"></div>
    <div class="dialog" *ngIf="showRejectDialog">
      <div class="dialog-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
      <h3>{{ req()?.status === 'Accepted' ? 'Cancel Visit?' : 'Reject Request?' }}</h3>
      <p>{{ req()?.status === 'Accepted' ? 'Cancel visit for' : 'Reject request from' }}
         <strong>{{ req()?.patientName }}</strong>?</p>
      <div class="field">
        <label>Reason</label>
        <select [(ngModel)]="rejectReason" class="select-input">
          <option value="">Select reason</option>
          <option value="Not available">Not available at this time</option>
          <option value="Out of service area">Out of service area</option>
          <option value="Scheduling conflict">Scheduling conflict</option>
          <option value="Patient request">Patient request</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="dialog-actions">
        <button class="btn-keep" (click)="showRejectDialog=false">Keep</button>
        <button class="btn-confirm-reject" (click)="doReject()" [disabled]="!rejectReason || acting()==='reject'">
          <span class="mini-spinner white" *ngIf="acting()==='reject'"></span>
          Confirm
        </button>
      </div>
    </div>

    <!-- Complete Dialog -->
    <div class="dialog-backdrop" *ngIf="showCompleteDialog" (click)="showCompleteDialog=false"></div>
    <div class="dialog" *ngIf="showCompleteDialog">
      <div class="dialog-icon green"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
      <h3>Complete Visit?</h3>
      <p>Mark the visit for <strong>{{ req()?.patientName }}</strong> as completed?</p>
      <div class="field">
        <label>Completion Notes (optional)</label>
        <textarea [(ngModel)]="completionNotes" class="notes-input" rows="3" placeholder="e.g. Service completed, patient stable..."></textarea>
      </div>
      <div class="dialog-actions">
        <button class="btn-keep" (click)="showCompleteDialog=false">Back</button>
        <button class="btn-confirm-complete" (click)="doComplete()" [disabled]="acting()==='complete'">
          <span class="mini-spinner white" *ngIf="acting()==='complete'"></span>
          Complete
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:700px;}@media(max-width:768px){.page{padding:16px;}}
    .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
    .top-bar h1{font-size:18px;font-weight:700;color:#111;}
    .back-btn{background:none;border:none;cursor:pointer;color:#555;padding:6px;border-radius:8px;display:flex;}
    .loading{display:flex;justify-content:center;padding:40px;}
    .spinner{width:28px;height:28px;border:3px solid #f0f0f0;border-top-color:#0F6E56;border-radius:50%;animation:spin .7s linear infinite;}
    .mini-spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px;}
    .mini-spinner.white{border-color:rgba(255,255,255,.3);border-top-color:#fff;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .hero-card{background:#0F6E56;border-radius:16px;padding:20px;display:flex;align-items:center;gap:14px;margin-bottom:14px;}
    .pat-avatar{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.2);color:#fff;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .pat-info{flex:1;}.pat-name{font-size:17px;font-weight:700;color:#fff;}.pat-phone{font-size:13px;color:rgba(255,255,255,.75);margin-top:2px;}
    .status-pill{font-size:11px;padding:4px 12px;border-radius:20px;font-weight:600;background:rgba(255,255,255,.9);white-space:nowrap;}
    .status-pill.pending{color:#d4a017;}.status-pill.accepted{color:#0F6E56;}.status-pill.completed{color:#185FA5;}.status-pill.rejected{color:#D84040;}
    .info-card{background:#fff;border-radius:14px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.06);overflow:hidden;}
    .info-row{display:flex;align-items:flex-start;gap:14px;padding:13px 16px;border-bottom:1px solid #f5f5f5;}
    .info-row:last-child{border-bottom:none;}
    .info-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .info-icon.svc{background:#E1F5EE;}.info-icon.cal{background:#E6F1FB;}.info-icon.loc{background:#FEF9E7;}.info-icon.note{background:#f0f0f0;}
    .info-lbl{font-size:11px;color:#888;margin-bottom:3px;}.info-val{font-size:14px;color:#111;font-weight:500;}
    .info-val.service-type{color:#0F6E56;font-weight:600;}
    .actions{display:flex;gap:10px;margin-bottom:12px;}
    .btn-accept{flex:2;padding:13px;background:#0F6E56;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;}
    .btn-reject{flex:1;padding:13px;background:#FEF2F2;color:#D84040;border:1.5px solid #FBDCDC;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;}
    .btn-reject.outline{background:#fff;color:#D84040;border:1.5px solid #FBDCDC;}
    .btn-complete{flex:1;padding:13px;background:#185FA5;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;}
    .btn-accept:disabled,.btn-reject:disabled,.btn-complete:disabled{opacity:.6;cursor:not-allowed;}
    .toast{padding:13px 16px;border-radius:12px;font-size:14px;font-weight:600;margin-bottom:10px;}
    .toast.success{background:#E1F5EE;color:#0F6E56;}.toast.error{background:#FEF2F2;color:#D84040;}
    .dialog-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;}
    .dialog{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:20px;padding:28px 24px;width:90%;max-width:400px;z-index:101;box-shadow:0 16px 48px rgba(0,0,0,.18);}
    .dialog-icon{width:52px;height:52px;background:#FEF2F2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
    .dialog-icon.green{background:#E1F5EE;}
    .dialog h3{font-size:18px;font-weight:700;color:#111;text-align:center;margin-bottom:8px;}
    .dialog p{font-size:14px;color:#666;text-align:center;line-height:1.5;margin-bottom:16px;}
    .dialog p strong{color:#111;}
    .field{margin-bottom:14px;}.field label{display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:6px;}
    .select-input,.notes-input{width:100%;padding:10px 14px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;font-family:'Cairo',sans-serif;outline:none;box-sizing:border-box;}
    .select-input:focus,.notes-input:focus{border-color:#D84040;}
    .dialog-actions{display:flex;gap:10px;}
    .btn-keep{flex:1;padding:12px;border:1.5px solid #e8e8e8;background:#fff;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;color:#555;}
    .btn-confirm-reject{flex:1;padding:12px;background:#D84040;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;}
    .btn-confirm-complete{flex:1;padding:12px;background:#0F6E56;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;}
    .btn-confirm-reject:disabled,.btn-confirm-complete:disabled{opacity:.6;cursor:not-allowed;}
  `],
})
export class RequestDetailComponent implements OnInit {
  private svc   = inject(HomeServiceService);
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  acting  = signal('');
  toast   = signal('');
  req     = signal<any>(null);
  showRejectDialog  = false;
  showCompleteDialog = false;
  rejectReason    = '';
  completionNotes = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getNurseRequests().subscribe({
      next: (res: any) => {
        const list: any[] = res?.data?.items ?? res?.data ?? res ?? [];
        this.req.set(list.find((r: any) => r.id === id) ?? list[0] ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  initials(name: string): string {
    return (name ?? '').split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
  }

  accept(): void {
    this.acting.set('accept');
    this.svc.updateStatus(this.req()!.id, true).subscribe({
      next: () => {
        this.req.update((r: any) => ({ ...r, status: 'Accepted' }));
        this.acting.set(''); this.toast.set('accepted');
        setTimeout(() => this.toast.set(''), 3000);
      },
      error: () => this.acting.set(''),
    });
  }

  promptReject(): void { this.rejectReason = ''; this.showRejectDialog = true; }
  doReject(): void {
    this.acting.set('reject');
    this.svc.updateStatus(this.req()!.id, false).subscribe({
      next: () => {
        this.req.update((r: any) => ({ ...r, status: 'Rejected' }));
        this.acting.set(''); this.showRejectDialog = false;
        this.toast.set('rejected'); setTimeout(() => this.toast.set(''), 3000);
      },
      error: () => { this.acting.set(''); this.showRejectDialog = false; },
    });
  }

  promptComplete(): void { this.completionNotes = ''; this.showCompleteDialog = true; }
  doComplete(): void {
    this.acting.set('complete');
    this.svc.completeRequest(this.req()!.id).subscribe({
      next: () => {
        this.req.update((r: any) => ({ ...r, status: 'Completed' }));
        this.acting.set(''); this.showCompleteDialog = false;
        this.toast.set('completed'); setTimeout(() => this.toast.set(''), 3000);
      },
      error: () => { this.acting.set(''); this.showCompleteDialog = false; },
    });
  }
}
