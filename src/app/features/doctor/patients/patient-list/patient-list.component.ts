import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { RouterLink }     from '@angular/router';
import { DoctorService }  from '../../../../core/services/doctor.service';
import { PatientProfile } from '../../../../core/models/api.models';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>My Patients</h1>
        <span class="count-badge">{{ filtered().length }}</span>
      </div>

      <!-- Search -->
      <div class="search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input [(ngModel)]="q" (input)="search()" placeholder="Search by name or email…" />
        <button class="clear-btn" *ngIf="q" (click)="q=''; search()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <div class="patient-list" *ngIf="!loading()">
        <a class="patient-card" *ngFor="let p of filtered()"
           [routerLink]="['/doctor/patients', p.id]">
          <div class="patient-avatar" [style.background]="avatarColor(p.bloodType ?? '')">
            {{ initials(p.firstName, p.lastName) }}
          </div>
          <div class="patient-info">
            <div class="patient-name">{{ p.firstName }} {{ p.lastName }}</div>
            <div class="patient-meta">
              <span *ngIf="p.gender">{{ p.gender }}</span>
              <span *ngIf="p.dateOfBirth"> · {{ age(p.dateOfBirth) }} yrs</span>
              <span *ngIf="p.bloodType"> · {{ p.bloodType }}</span>
            </div>
            <div class="patient-tags">
              <span class="tag" *ngFor="let d of (p.chronicDiseases || []).slice(0,2)">{{ d }}</span>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>

        <div class="empty" *ngIf="filtered().length === 0">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <p>No patients found</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:900px; }
    @media (max-width:768px) { .page { padding:16px; } }
    .page-header { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; flex:1; }
    .count-badge { background:#E6F1FB; color:#185FA5; font-size:12px; font-weight:700; padding:3px 10px; border-radius:10px; }
    .search-wrap { display:flex; align-items:center; gap:10px; background:#fff; border:1.5px solid #e8e8e8; border-radius:12px; padding:10px 14px; margin-bottom:14px; }
    .search-wrap input { flex:1; border:none; outline:none; font-size:14px; font-family:'Cairo',sans-serif; }
    .clear-btn { background:none; border:none; cursor:pointer; color:#888; padding:0; display:flex; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .patient-list { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
    @media (max-width:600px) { .patient-list { grid-template-columns:1fr; } }
    .patient-card { background:#fff; border-radius:14px; padding:14px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 8px rgba(0,0,0,0.05); text-decoration:none; color:inherit; transition:transform .1s; }
    .patient-card:active { transform:scale(0.99); }
    .patient-avatar { width:48px; height:48px; border-radius:50%; color:#fff; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .patient-info { flex:1; }
    .patient-name { font-size:15px; font-weight:600; color:#111; margin-bottom:2px; }
    .patient-meta { font-size:12px; color:#888; margin-bottom:4px; }
    .patient-tags { display:flex; gap:4px; flex-wrap:wrap; }
    .tag { font-size:11px; background:#FEF2F2; color:#D84040; padding:2px 7px; border-radius:6px; }
    .empty { text-align:center; padding:40px 20px; background:#fff; border-radius:14px; }
    .empty-icon { width:72px; height:72px; background:#f0f0f0; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
    .empty p { color:#888; font-size:14px; }
  `],
})
export class PatientListComponent implements OnInit {
  private svc = inject(DoctorService);
  loading  = signal(true);
  all      = signal<PatientProfile[]>([]);
  filtered = signal<PatientProfile[]>([]);
  q        = '';

  ngOnInit(): void {
    this.svc.getPatients().subscribe((res: any) => {
      this.all.set(res.data.items);
      this.filtered.set(res.data.items);
      this.loading.set(false);
    });
  }

  search(): void {
    const q = this.q.toLowerCase();
    this.filtered.set(!q ? this.all() : this.all().filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    ));
  }

  initials(f: string, l: string): string { return (f[0] + l[0]).toUpperCase(); }
  age(dob: string): number { return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000); }
  avatarColor(bt: string): string {
    const m: Record<string,string> = { 'A+':'#185FA5','A-':'#2D4A8A','B+':'#0F6E56','B-':'#1A8A6E','AB+':'#6B5BAD','AB-':'#5A4A9E','O+':'#D84040','O-':'#B83030' };
    return m[bt] ?? '#2D4A8A';
  }
}
