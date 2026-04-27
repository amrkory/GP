import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DoctorService }  from '../../../../core/services/doctor.service';
import { PatientProfile } from '../../../../core/models/api.models';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/doctor/patients'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Patient Details</h1>
        <span></span>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading() && patient()">
        <!-- Patient header -->
        <div class="patient-hero">
          <div class="hero-avatar">{{ initials() }}</div>
          <div class="hero-info">
            <h2>{{ patient()!.firstName }} {{ patient()!.lastName }}</h2>
            <p>{{ patient()!.gender }} · {{ age() }} years old · {{ patient()!.bloodType }}</p>
            <div class="hero-tags">
              <span class="tag" *ngFor="let d of (patient()!.chronicDiseases || [])">{{ d }}</span>
            </div>
          </div>
          <div class="hero-actions">
            <a [routerLink]="['/doctor/chat', patient()!.id]" class="icon-action chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </a>
            <a [routerLink]="['/doctor/prescriptions/new', patient()!.id]" class="icon-action rx">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </a>
          </div>
        </div>

        <!-- Tab nav -->
        <div class="tabs">
          <a class="tab" [routerLink]="['overview']"      routerLinkActive="active">Overview</a>
          <a class="tab" [routerLink]="['vitals']"        routerLinkActive="active">Vitals</a>
          <a class="tab" [routerLink]="['prescriptions']" routerLinkActive="active">Rx</a>
          <a class="tab" [routerLink]="['checklist']"     routerLinkActive="active">Tasks</a>
        </div>

        <router-outlet></router-outlet>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:900px; }
    @media (max-width:768px) { .page { padding:16px; } }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .top-bar h1 { font-size:18px; font-weight:700; color:#111; }
    .back-btn { background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; }
    .loading  { display:flex; justify-content:center; padding:40px; }
    .spinner  { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .patient-hero { background:#2D4A8A; border-radius:16px; padding:18px; display:flex; align-items:flex-start; gap:12px; margin-bottom:16px; }
    .hero-avatar  { width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,0.2); color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .hero-info    { flex:1; }
    .hero-info h2 { font-size:17px; font-weight:700; color:#fff; margin-bottom:2px; }
    .hero-info p  { font-size:12px; color:rgba(255,255,255,0.7); margin-bottom:6px; }
    .hero-tags    { display:flex; gap:4px; flex-wrap:wrap; }
    .tag { font-size:11px; background:rgba(255,255,255,0.15); color:#fff; padding:2px 8px; border-radius:8px; }
    .hero-actions { display:flex; flex-direction:column; gap:6px; }
    .icon-action  { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; text-decoration:none; }
    .icon-action.chat { background:rgba(255,255,255,0.15); color:#fff; }
    .icon-action.rx   { background:rgba(255,255,255,0.15); color:#fff; }
    .tabs { display:flex; gap:4px; margin-bottom:16px; background:#fff; border-radius:12px; padding:4px; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
    .tab { flex:1; text-align:center; padding:8px 4px; border-radius:8px; font-size:13px; font-weight:500; color:#888; text-decoration:none; transition:all .15s; }
    .tab.active { background:#2D4A8A; color:#fff; font-weight:700; }
  `],
})
export class PatientDetailComponent implements OnInit {
  private svc   = inject(DoctorService);
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);
  loading = signal(true);
  patient = signal<PatientProfile | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('patientId')!;
    this.svc.getPatientById(id).subscribe((res: any) => { this.patient.set(res.data); this.loading.set(false); });
  }
  initials(): string { const p = this.patient()!; return (p.firstName[0] + p.lastName[0]).toUpperCase(); }
  age(): number { return Math.floor((Date.now() - new Date(this.patient()!.dateOfBirth ?? '2000').getTime()) / 31557600000); }
}
