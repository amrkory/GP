import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';
import { forkJoin, of }   from 'rxjs';
import { catchError }     from 'rxjs/operators';

@Component({
  selector: 'app-pending-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Pending Approvals</h1>
          <p class="page-sub">{{ pending().length }} account(s) awaiting review</p>
        </div>
        <button class="btn-refresh" (click)="load()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh
        </button>
      </div>

      <!-- Filter tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="tab()==='all'"    (click)="tab.set('all')">All ({{ pending().length }})</button>
        <button class="tab" [class.active]="tab()==='doctor'" (click)="tab.set('doctor')">Doctors ({{ countByType('Doctor') }})</button>
        <button class="tab" [class.active]="tab()==='nurse'"  (click)="tab.set('nurse')">Nurses ({{ countByType('Nurse') }})</button>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div><p>Loading pending accounts...</p></div>

      <div class="cards-grid" *ngIf="!loading()">
        <div class="account-card" *ngFor="let d of filtered()">
          <!-- Type badge -->
          <div class="type-tag" [class.nurse]="d.userType==='Nurse'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path *ngIf="d.userType==='Doctor'" d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 21.5 16h.42Z"/>
              <path *ngIf="d.userType==='Nurse'" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline *ngIf="d.userType==='Nurse'" points="9 22 9 12 15 12 15 22"/>
            </svg>
            {{ d.userType }}
          </div>

          <div class="card-header">
            <div class="avatar">{{ d.firstName?.[0] }}{{ d.lastName?.[0] }}</div>
            <div class="user-info">
              <div class="user-name">{{ d.userType === 'Doctor' ? 'Dr. ' : '' }}{{ d.firstName }} {{ d.lastName }}</div>
              <div class="user-email">{{ d.email }}</div>
              <div class="user-spec">{{ d.specialization || d.specialtyName || d.serviceType }}</div>
            </div>
          </div>

          <div class="card-details">
            <div class="detail" *ngIf="d.licenseNumber">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              {{ d.licenseNumber }}
            </div>
            <div class="detail" *ngIf="d.phone || d.nursePhoneNumber">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg>
              {{ d.phone || d.nursePhoneNumber }}
            </div>
            <div class="detail" *ngIf="d.experienceYears || d.yearsExperience">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ d.experienceYears || d.yearsExperience }} yrs exp
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-approve" (click)="approve(d)" [disabled]="!!acting()">
              <span class="mini-spinner" *ngIf="acting()===d.id+'approve'"></span>
              <svg *ngIf="acting()!==d.id+'approve'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Approve
            </button>
            <button class="btn-reject" (click)="promptReject(d)" [disabled]="!!acting()">Reject</button>
          </div>
        </div>

        <div class="empty" *ngIf="filtered().length === 0">
          <div class="empty-icon">✅</div>
          <h3>All caught up!</h3>
          <p>No pending {{ tab() === 'all' ? 'accounts' : tab() + 's' }} to approve right now.</p>
        </div>
      </div>

      <!-- Toasts -->
      <div class="toast success" *ngIf="toast()==='approved'">✅ Account approved! They can now login.</div>
      <div class="toast success" *ngIf="toast()==='rejected'">✅ Account rejected.</div>
      <div class="toast error"   *ngIf="toast().startsWith('error:')">❌ {{ getToastMsg() }}</div>
    </div>

    <!-- Reject dialog -->
    <div class="backdrop" *ngIf="showRejectDialog" (click)="showRejectDialog=false"></div>
    <div class="dialog" *ngIf="showRejectDialog">
      <h3>Reject Account?</h3>
      <p>Reject <strong>{{ rejectTarget?.firstName }} {{ rejectTarget?.lastName }}</strong>?</p>
      <select [(ngModel)]="rejectReason" class="select-input">
        <option value="">Select reason</option>
        <option value="Invalid license">Invalid license</option>
        <option value="Incomplete documents">Incomplete documents</option>
        <option value="Credential mismatch">Credential mismatch</option>
        <option value="Other">Other</option>
      </select>
      <div class="dialog-actions">
        <button class="btn-keep" (click)="showRejectDialog=false">Cancel</button>
        <button class="btn-confirm-reject" (click)="doReject()" [disabled]="!rejectReason">Confirm Reject</button>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:1100px;}@media(max-width:768px){.page{padding:16px;}}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px;}
    .page-header h1{font-size:22px;font-weight:800;color:#111;margin-bottom:2px;}
    .page-sub{font-size:14px;color:#888;}
    .btn-refresh{display:flex;align-items:center;gap:6px;background:#F4F6FA;color:#555;border:none;border-radius:10px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;}
    .btn-refresh:hover{background:#E8ECF0;}
    .tabs{display:flex;gap:8px;margin-bottom:16px;}
    .tab{padding:8px 16px;border-radius:20px;border:1.5px solid #e8e8e8;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#555;}
    .tab.active{background:#1E293B;color:#fff;border-color:#1E293B;}
    .loading{display:flex;flex-direction:column;align-items:center;padding:40px;gap:10px;color:#888;font-size:14px;}
    .spinner{width:28px;height:28px;border:3px solid #f0f0f0;border-top-color:#1E293B;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .mini-spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:5px;}
    .cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;}
    .account-card{background:#fff;border-radius:14px;padding:18px;box-shadow:0 1px 8px rgba(0,0,0,.06);position:relative;border-top:3px solid #d4a017;}
    .type-tag{position:absolute;top:12px;right:12px;display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:#E6F1FB;color:#185FA5;}
    .type-tag.nurse{background:#E1F5EE;color:#0F6E56;}
    .card-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;padding-right:60px;}
    .avatar{width:44px;height:44px;border-radius:50%;background:#1E293B;color:#fff;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .user-name{font-size:15px;font-weight:700;color:#111;}
    .user-email{font-size:12px;color:#888;margin:2px 0;}
    .user-spec{font-size:12px;color:#185FA5;font-weight:600;}
    .card-details{display:flex;flex-direction:column;gap:5px;margin-bottom:12px;}
    .detail{display:flex;align-items:center;gap:6px;font-size:13px;color:#555;}
    .card-actions{display:flex;gap:8px;}
    .btn-approve{flex:2;padding:10px;background:#1E293B;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;}
    .btn-approve:hover:not(:disabled){background:#0F172A;}
    .btn-approve:disabled{opacity:.6;cursor:not-allowed;}
    .btn-reject{flex:1;padding:10px;background:#FEF2F2;color:#D84040;border:1.5px solid #FBDCDC;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;}
    .btn-reject:hover:not(:disabled){background:#FEE2E2;}
    .btn-reject:disabled{opacity:.6;cursor:not-allowed;}
    .empty{grid-column:1/-1;text-align:center;padding:48px;background:#fff;border-radius:14px;}
    .empty-icon{font-size:48px;margin-bottom:12px;}
    .empty h3{font-size:18px;font-weight:700;color:#111;margin-bottom:4px;}
    .empty p{color:#888;font-size:14px;}
    .toast{position:fixed;bottom:24px;right:24px;padding:14px 18px;border-radius:12px;font-size:14px;font-weight:600;z-index:200;box-shadow:0 4px 20px rgba(0,0,0,.12);}
    .toast.success{background:#E1F5EE;color:#0F6E56;}
    .toast.error{background:#FEF2F2;color:#D84040;}
    .backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;}
    .dialog{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:20px;padding:28px 24px;width:90%;max-width:380px;z-index:101;box-shadow:0 16px 48px rgba(0,0,0,.18);}
    .dialog h3{font-size:18px;font-weight:700;color:#111;margin-bottom:8px;}
    .dialog p{font-size:14px;color:#666;margin-bottom:16px;}
    .dialog p strong{color:#111;}
    .select-input{width:100%;padding:10px 14px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;outline:none;margin-bottom:16px;}
    .dialog-actions{display:flex;gap:10px;}
    .btn-keep{flex:1;padding:12px;border:1.5px solid #e8e8e8;background:#fff;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;color:#555;}
    .btn-confirm-reject{flex:1;padding:12px;background:#D84040;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;}
    .btn-confirm-reject:disabled{opacity:.55;cursor:not-allowed;}
  `],
})
export class PendingRequestsComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true);
  acting  = signal('');
  toast   = signal('');
  tab     = signal<'all'|'doctor'|'nurse'>('all');
  pending = signal<any[]>([]);
  showRejectDialog = false;
  rejectTarget: any = null;
  rejectReason = '';

  ngOnInit(): void { this.load(); }
  getToastMsg(): string { return this.toast().replace('error:', ''); }

  private parseList(res: any): any[] {
    // Handle all possible backend response shapes:
    // { data: { items: [...] } } | { data: [...] } | [...] | { items: [...] }
    if (Array.isArray(res))                  return res;
    if (Array.isArray(res?.data?.items))     return res.data.items;
    if (Array.isArray(res?.data))            return res.data;
    if (Array.isArray(res?.items))           return res.items;
    return [];
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      doctors: this.http.get<any>(`${environment.apiUrl}/Admin/pending/doctors`).pipe(catchError(() => of([]))),
      nurses:  this.http.get<any>(`${environment.apiUrl}/Admin/pending/nurses`).pipe(catchError(() => of([]))),
    }).subscribe({
      next: (res: any) => {
        const doctors = this.parseList(res.doctors).map((d: any) => ({ ...d, userType: 'Doctor' }));
        const nurses  = this.parseList(res.nurses).map((n: any) => ({ ...n, userType: 'Nurse'  }));
        this.pending.set([...doctors, ...nurses]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filtered(): any[] {
    const t = this.tab();
    if (t === 'all') return this.pending();
    return this.pending().filter(d => d.userType.toLowerCase() === t);
  }

  countByType(type: string): number {
    return this.pending().filter(d => d.userType === type).length;
  }

  approve(d: any): void {
    this.acting.set(d.id + 'approve');
    this.http.post<any>(`${environment.apiUrl}/Admin/accept-reject`, { userId: d.id, isAccepted: true })
      .subscribe({
        next: () => {
          this.pending.update(list => list.filter(x => x.id !== d.id));
          this.acting.set('');
          this.toast.set('approved');
          setTimeout(() => this.toast.set(''), 4000);
        },
        error: (err: any) => {
          this.acting.set('');
          this.toast.set('error:' + (err?.error?.message ?? 'Failed to approve'));
          setTimeout(() => this.toast.set(''), 4000);
        },
      });
  }

  promptReject(d: any): void { this.rejectTarget = d; this.rejectReason = ''; this.showRejectDialog = true; }

  doReject(): void {
    if (!this.rejectTarget || !this.rejectReason) return;
    this.acting.set(this.rejectTarget.id);
    this.http.post<any>(`${environment.apiUrl}/Admin/accept-reject`, { userId: this.rejectTarget.id, isAccepted: false })
      .subscribe({
        next: () => {
          this.pending.update(list => list.filter(x => x.id !== this.rejectTarget.id));
          this.acting.set(''); this.showRejectDialog = false;
          this.toast.set('rejected'); setTimeout(() => this.toast.set(''), 3000);
        },
        error: () => { this.acting.set(''); this.showRejectDialog = false; },
      });
  }
}
