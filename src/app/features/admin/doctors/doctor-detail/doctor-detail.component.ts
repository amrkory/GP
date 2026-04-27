import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

@Component({
  selector: 'app-admin-doctor-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/admin/doctors'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Doctor Profile</h1><span></span>
      </div>
      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
      <ng-container *ngIf="!loading() && doc()">
        <div class="hero">
          <div class="hero-avatar">{{ doc()!.firstName[0] }}{{ doc()!.lastName[0] }}</div>
          <div class="hero-info">
            <h2>Dr. {{ doc()!.firstName }} {{ doc()!.lastName }}</h2>
            <p>{{ doc()!.specialtyName }} · {{ doc()!.clinicName }}</p>
            <span class="status-pill" [class]="doc()!.approvalStatus.toLowerCase()">{{ doc()!.approvalStatus }}</span>
          </div>
        </div>
        <div class="info-card">
          <h3>Contact Info</h3>
          <div class="info-row"><span>Email</span><strong>{{ doc()!.email }}</strong></div>
          <div class="info-row"><span>Phone</span><strong>{{ doc()!.phone }}</strong></div>
          <div class="info-row"><span>License</span><strong>{{ doc()!.licenseNumber }}</strong></div>
          <div class="info-row"><span>Experience</span><strong>{{ doc()!.yearsExperience }} years</strong></div>
          <div class="info-row"><span>Applied</span><strong>{{ doc()!.appliedAt | date:'MMM d, y' }}</strong></div>
        </div>
        <div class="actions" *ngIf="doc()!.approvalStatus === 'Pending'">
          <button class="btn-approve" (click)="approve()" [disabled]="!!acting()">
            <span class="mini-spinner" *ngIf="acting()==='approve'"></span>
            Approve Doctor
          </button>
          <button class="btn-reject"  (click)="reject()"  [disabled]="!!acting()">Reject</button>
        </div>
        <div class="toast success" *ngIf="toast()==='approved'">✅ Doctor approved!</div>
        <div class="toast error"   *ngIf="toast()==='rejected'">❌ Doctor rejected.</div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:700px;}@media(max-width:768px){.page{padding:16px;}}
    .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
    .top-bar h1{font-size:18px;font-weight:700;color:#111;}
    .back-btn{background:none;border:none;cursor:pointer;color:#555;padding:6px;border-radius:8px;display:flex;}
    .loading{display:flex;justify-content:center;padding:40px;}
    .spinner{width:28px;height:28px;border:3px solid #f0f0f0;border-top-color:#1E293B;border-radius:50%;animation:spin .7s linear infinite;}
    .mini-spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:5px;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .hero{background:#1E293B;border-radius:16px;padding:24px;display:flex;align-items:center;gap:16px;margin-bottom:14px;}
    .hero-avatar{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .hero-info h2{font-size:20px;font-weight:700;color:#fff;margin-bottom:4px;}
    .hero-info p{font-size:13px;color:rgba(255,255,255,.7);margin-bottom:8px;}
    .status-pill{font-size:11px;padding:4px 12px;border-radius:20px;font-weight:600;}
    .status-pill.approved{background:rgba(255,255,255,.9);color:#0F6E56;}
    .status-pill.pending{background:rgba(255,255,255,.9);color:#d4a017;}
    .status-pill.rejected{background:rgba(255,255,255,.9);color:#D84040;}
    .info-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.05);}
    .info-card h3{font-size:14px;font-weight:700;color:#111;margin-bottom:10px;}
    .info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5f5f5;font-size:13px;}
    .info-row:last-child{border-bottom:none;}
    .info-row span{color:#888;}.info-row strong{color:#111;}
    .actions{display:flex;gap:10px;margin-bottom:12px;}
    .btn-approve{flex:2;padding:13px;background:#1E293B;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;}
    .btn-reject{flex:1;padding:13px;background:#FEF2F2;color:#D84040;border:1.5px solid #FBDCDC;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;}
    .btn-approve:disabled,.btn-reject:disabled{opacity:.6;cursor:not-allowed;}
    .toast{padding:13px 16px;border-radius:12px;font-size:14px;font-weight:600;}
    .toast.success{background:#E1F5EE;color:#0F6E56;}.toast.error{background:#FEF2F2;color:#D84040;}
  `],
})
export class AdminDoctorDetailComponent implements OnInit {
  private http   = inject(HttpClient);
  readonly router = inject(Router);
  private route  = inject(ActivatedRoute);
  loading = signal(true); acting = signal(''); toast = signal('');
  doc     = signal<any>(null);
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    // Find from the list since we don't have a single-doc endpoint
    this.http.get<any>(`${environment.apiUrl}/admin/doctors`)
      .subscribe(res => {
        const list = res.data.items ?? res.data;
        this.doc.set(list.find((d: any) => d.id === id) ?? list[0]);
        this.loading.set(false);
      });
  }
  approve(): void {
    this.acting.set('approve');
    this.http.put<any>(`${environment.apiUrl}/admin/doctors/${this.doc()!.id}/approve`, {})
      .subscribe({ next: res => { this.doc.set({...this.doc()!, approvalStatus:'Approved'}); this.acting.set(''); this.toast.set('approved'); setTimeout(()=>this.toast.set(''),3000); }, error:()=>this.acting.set('') });
  }
  reject(): void {
    this.acting.set('reject');
    this.http.put<any>(`${environment.apiUrl}/admin/doctors/${this.doc()!.id}/reject`, { reason:'Admin rejected' })
      .subscribe({ next: () => { this.doc.set({...this.doc()!, approvalStatus:'Rejected'}); this.acting.set(''); this.toast.set('rejected'); setTimeout(()=>this.toast.set(''),3000); }, error:()=>this.acting.set('') });
  }
}
