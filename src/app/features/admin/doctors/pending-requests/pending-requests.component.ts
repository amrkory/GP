import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { RouterLink }     from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

interface Doctor { id:string; firstName:string; lastName:string; email:string; phone:string; specialtyName:string; clinicName:string; licenseNumber:string; yearsExperience:number; approvalStatus:string; appliedAt:string; }

@Component({
  selector: 'app-pending-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Pending Approvals</h1>
          <p class="page-sub">{{ pending().length }} doctor(s) awaiting review</p>
        </div>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <div class="cards-grid" *ngIf="!loading()">
        <div class="doctor-card" *ngFor="let d of pending()">
          <div class="card-header">
            <div class="doc-avatar">{{ d.firstName[0] }}{{ d.lastName[0] }}</div>
            <div class="doc-info">
              <div class="doc-name">Dr. {{ d.firstName }} {{ d.lastName }}</div>
              <div class="doc-spec">{{ d.specialtyName }}</div>
              <div class="doc-clinic">{{ d.clinicName }}</div>
            </div>
            <span class="status-pill pending">Pending</span>
          </div>
          <div class="card-divider"></div>
          <div class="card-details">
            <div class="detail-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg>
              {{ d.phone }}
            </div>
            <div class="detail-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {{ d.email }}
            </div>
            <div class="detail-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              License: {{ d.licenseNumber }}
            </div>
            <div class="detail-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Applied {{ d.appliedAt | date:'MMM d, y' }}
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-approve" (click)="approve(d)" [disabled]="acting() === d.id">
              <span class="mini-spinner" *ngIf="acting()===d.id+'approve'"></span>
              <svg *ngIf="acting()!==d.id+'approve'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Approve
            </button>
            <button class="btn-reject" (click)="promptReject(d)" [disabled]="!!acting()">Reject</button>
            <a [routerLink]="['/admin/doctors', d.id]" class="btn-view">View Profile</a>
          </div>
        </div>

        <div class="empty" *ngIf="pending().length === 0">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3>All caught up!</h3>
          <p>No pending doctor approvals right now.</p>
        </div>
      </div>

      <!-- Toast -->
      <div class="toast success" *ngIf="toast()==='approved'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Doctor approved successfully!
      </div>
      <div class="toast error" *ngIf="toast()==='rejected'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Doctor rejected.
      </div>
    </div>

    <!-- Reject dialog -->
    <div class="dialog-backdrop" *ngIf="showRejectDialog" (click)="showRejectDialog=false"></div>
    <div class="dialog" *ngIf="showRejectDialog">
      <div class="dialog-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h3>Reject Doctor?</h3>
      <p>Reject the application from <strong>Dr. {{ rejectTarget?.firstName }} {{ rejectTarget?.lastName }}</strong>?</p>
      <div class="field">
        <label>Reason</label>
        <select [(ngModel)]="rejectReason" class="select-input">
          <option value="">Select reason</option>
          <option value="Invalid license">Invalid license</option>
          <option value="Incomplete documents">Incomplete documents</option>
          <option value="License expired">License expired</option>
          <option value="Credential mismatch">Credential mismatch</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="dialog-actions">
        <button class="btn-keep" (click)="showRejectDialog=false">Cancel</button>
        <button class="btn-confirm-reject" (click)="doReject()" [disabled]="!rejectReason">Confirm Reject</button>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:1100px; }
    @media(max-width:768px){.page{padding:16px;}}
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
    .page-header h1 { font-size:22px; font-weight:800; color:#111; margin-bottom:2px; }
    .page-sub { font-size:14px; color:#888; }
    .loading  { display:flex; justify-content:center; padding:40px; }
    .spinner  { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#1E293B; border-radius:50%; animation:spin .7s linear infinite; }
    .mini-spinner { display:inline-block; width:13px; height:13px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:5px; }
    @keyframes spin{to{transform:rotate(360deg);}}
    .cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:16px; }
    .doctor-card { background:#fff; border-radius:14px; padding:18px; box-shadow:0 1px 8px rgba(0,0,0,.06); border-top:3px solid #d4a017; }
    .card-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:14px; }
    .doc-avatar { width:48px; height:48px; border-radius:50%; background:#1E293B; color:#fff; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .doc-info { flex:1; }
    .doc-name   { font-size:15px; font-weight:700; color:#111; }
    .doc-spec   { font-size:13px; color:#185FA5; font-weight:500; margin:2px 0; }
    .doc-clinic { font-size:12px; color:#888; }
    .status-pill { font-size:11px; padding:3px 10px; border-radius:20px; font-weight:600; white-space:nowrap; }
    .status-pill.pending  { background:#FEF9E7; color:#d4a017; }
    .status-pill.approved { background:#E1F5EE; color:#0F6E56; }
    .status-pill.rejected { background:#FEF2F2; color:#D84040; }
    .card-divider { height:1px; background:#f5f5f5; margin-bottom:12px; }
    .card-details { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
    .detail-item  { display:flex; align-items:center; gap:8px; font-size:13px; color:#555; }
    .card-actions { display:flex; gap:8px; }
    .btn-approve { flex:1; padding:10px; background:#1E293B; color:#fff; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; }
    .btn-approve:hover:not(:disabled) { background:#0F172A; }
    .btn-approve:disabled { opacity:.6; cursor:not-allowed; }
    .btn-reject  { flex:1; padding:10px; background:#FEF2F2; color:#D84040; border:1.5px solid #FBDCDC; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; }
    .btn-reject:hover:not(:disabled) { background:#FEE2E2; }
    .btn-reject:disabled { opacity:.6; cursor:not-allowed; }
    .btn-view    { flex:1; padding:10px; background:#F4F6FA; color:#555; border-radius:10px; font-size:13px; font-weight:600; text-decoration:none; display:flex; align-items:center; justify-content:center; }
    .empty { grid-column:1/-1; text-align:center; padding:48px; background:#fff; border-radius:14px; }
    .empty-icon { width:72px; height:72px; background:#E1F5EE; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .empty h3 { font-size:18px; font-weight:700; color:#111; margin-bottom:4px; }
    .empty p  { color:#888; font-size:14px; }
    .toast { position:fixed; bottom:24px; right:24px; display:flex; align-items:center; gap:10px; padding:14px 18px; border-radius:12px; font-size:14px; font-weight:600; z-index:200; animation:slideUp .3s ease; }
    .toast.success  { background:#E1F5EE; color:#0F6E56; box-shadow:0 4px 20px rgba(0,0,0,.12); }
    .toast.error    { background:#FEF2F2; color:#D84040; box-shadow:0 4px 20px rgba(0,0,0,.12); }
    @keyframes slideUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    .dialog-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100; }
    .dialog { position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:20px;padding:28px 24px;width:90%;max-width:400px;z-index:101;box-shadow:0 16px 48px rgba(0,0,0,.18); }
    .dialog-icon { width:52px;height:52px;background:#FEF2F2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px; }
    .dialog h3 { font-size:18px;font-weight:700;color:#111;text-align:center;margin-bottom:8px; }
    .dialog p  { font-size:14px;color:#666;text-align:center;line-height:1.5;margin-bottom:16px; }
    .dialog p strong { color:#111; }
    .field { margin-bottom:16px; }
    .field label { display:block;font-size:13px;font-weight:600;color:#111;margin-bottom:6px; }
    .select-input { width:100%;padding:10px 14px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;font-family:'Inter',sans-serif;outline:none;appearance:none;background:#fff; }
    .select-input:focus { border-color:#D84040; }
    .dialog-actions { display:flex;gap:10px; }
    .btn-keep           { flex:1;padding:12px;border:1.5px solid #e8e8e8;background:#fff;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;color:#555; }
    .btn-confirm-reject { flex:1;padding:12px;background:#D84040;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer; }
    .btn-confirm-reject:disabled { opacity:.55;cursor:not-allowed; }
  `],
})
export class PendingRequestsComponent implements OnInit {
  private http  = inject(HttpClient);
  loading = signal(true);
  acting  = signal('');
  toast   = signal('');
  pending = signal<Doctor[]>([]);
  showRejectDialog = false;
  rejectTarget: Doctor | null = null;
  rejectReason = '';

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/doctors`)
      .subscribe((res: any) => {
        this.pending.set((res.data.items ?? res.data).filter((d: Doctor) => d.approvalStatus === 'Pending'));
        this.loading.set(false);
      });
  }

  approve(d: Doctor): void {
    this.acting.set(d.id + 'approve');
    this.http.post<any>(`${environment.apiUrl}/Auth/accept-reject`, { userId: d.id, isAccepted: true })
      .subscribe({
        next: () => {
          this.pending.update(list => list.filter(x => x.id !== d.id));
          this.acting.set(''); this.toast.set('approved');
          setTimeout(() => this.toast.set(''), 3000);
        },
        error: () => this.acting.set(''),
      });
  }

  promptReject(d: Doctor): void { this.rejectTarget = d; this.rejectReason = ''; this.showRejectDialog = true; }

  doReject(): void {
    if (!this.rejectTarget || !this.rejectReason) return;
    this.acting.set(this.rejectTarget.id);
    this.http.post<any>(`${environment.apiUrl}/Auth/accept-reject`, { userId: this.rejectTarget.id, isAccepted: false })
      .subscribe({
        next: () => {
          this.pending.update(list => list.filter(x => x.id !== this.rejectTarget!.id));
          this.acting.set(''); this.showRejectDialog = false;
          this.toast.set('rejected'); setTimeout(() => this.toast.set(''), 3000);
        },
        error: () => { this.acting.set(''); this.showRejectDialog = false; },
      });
  }
}
