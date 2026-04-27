import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-admin-patient-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/admin/patients'])"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
        <h1>Patient Profile</h1><span></span>
      </div>
      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
      <ng-container *ngIf="!loading() && p()">
        <div class="hero">
          <div class="hero-avatar">{{ p()!.firstName[0] }}{{ p()!.lastName[0] }}</div>
          <div><h2>{{ p()!.firstName }} {{ p()!.lastName }}</h2><p>{{ p()!.email }}</p></div>
        </div>
        <div class="info-card">
          <h3>Personal Info</h3>
          <div class="info-row"><span>Gender</span><strong>{{ p()!.gender || '—' }}</strong></div>
          <div class="info-row"><span>Date of Birth</span><strong>{{ (p()!.dateOfBirth | date:'MMM d, y') || '—' }}</strong></div>
          <div class="info-row"><span>Blood Type</span><strong>{{ p()!.bloodType || '—' }}</strong></div>
          <div class="info-row"><span>Phone</span><strong>{{ p()!.phone || '—' }}</strong></div>
          <div class="info-row"><span>Allergies</span><strong>{{ (p()!.allergies?.join(', ')) || '—' }}</strong></div>
          <div class="info-row"><span>Chronic Diseases</span><strong>{{ (p()!.chronicDiseases?.join(', ')) || '—' }}</strong></div>
          <div class="info-row"><span>Joined</span><strong>{{ p()!.createdAt | date:'MMM d, y' }}</strong></div>
        </div>
      </ng-container>
    </div>
  `,
  styles:[`.page{padding:24px;max-width:700px;}@media(max-width:768px){.page{padding:16px;}}.top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}.top-bar h1{font-size:18px;font-weight:700;color:#111;}.back-btn{background:none;border:none;cursor:pointer;color:#555;padding:6px;border-radius:8px;display:flex;}.loading{display:flex;justify-content:center;padding:40px;}.spinner{width:28px;height:28px;border:3px solid #f0f0f0;border-top-color:#1E293B;border-radius:50%;animation:spin .7s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}.hero{background:#1E293B;border-radius:16px;padding:20px;display:flex;align-items:center;gap:14px;margin-bottom:14px;}.hero-avatar{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}.hero h2{font-size:18px;font-weight:700;color:#fff;margin-bottom:3px;}.hero p{font-size:13px;color:rgba(255,255,255,.7);}.info-card{background:#fff;border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,.05);}.info-card h3{font-size:14px;font-weight:700;color:#111;margin-bottom:10px;}.info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5f5f5;font-size:13px;}.info-row:last-child{border-bottom:none;}.info-row span{color:#888;}.info-row strong{color:#111;}`]
})
export class AdminPatientDetailComponent implements OnInit {
  private http = inject(HttpClient); readonly router = inject(Router); private route = inject(ActivatedRoute);
  loading = signal(true); p = signal<any>(null);
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.get<any>(`${environment.apiUrl}/admin/patients`).subscribe(res => {
      const list = res.data.items ?? res.data;
      this.p.set(list.find((x: any) => x.id === id) ?? list[0]);
      this.loading.set(false);
    });
  }
}
