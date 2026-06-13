import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { RouterLink }     from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

@Component({
  selector: 'app-doctor-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Doctors</h1><p class="page-sub">{{ filtered().length }} total</p></div>
        <a routerLink="/admin/doctors/pending" class="btn-pending">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Pending Approvals
        </a>
      </div>
      <div class="search-filter-row">
        <div class="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input [(ngModel)]="q" (input)="filter()" placeholder="Search name or email…" />
        </div>
        <select [(ngModel)]="statusFilter" (change)="filter()" class="filter-select">
          <option value="">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead><tr><th>Doctor</th><th>Specialty</th><th>Experience</th><th>Status</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let d of filtered()">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ d.firstName[0] }}{{ d.lastName[0] }}</div>
                  <div><div class="user-name">Dr. {{ d.firstName }} {{ d.lastName }}</div><div class="user-email">{{ d.email }}</div></div>
                </div>
              </td>
              <td><span class="spec-tag">{{ d.specialtyName }}</span></td>
              <td>{{ d.yearsExperience }} yrs</td>
              <td><span class="status-pill" [class]="d.approvalStatus.toLowerCase()">{{ d.approvalStatus }}</span></td>
              <td class="date-cell">{{ d.createdAt | date:'MMM d, y' }}</td>
              <td><a [routerLink]="['/admin/doctors', d.id]" class="action-link">View</a></td>
            </tr>
          </tbody>
        </table>
        <div class="empty-row" *ngIf="filtered().length === 0"><p>No doctors found</p></div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:1200px; }
    @media(max-width:768px){.page{padding:16px;}}
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; flex-wrap:wrap; gap:10px; }
    .page-header h1 { font-size:22px; font-weight:800; color:#111; margin-bottom:2px; }
    .page-sub { font-size:14px; color:#888; }
    .btn-pending { display:flex; align-items:center; gap:6px; background:#FEF9E7; color:#d4a017; border:1.5px solid #FDE68A; border-radius:10px; padding:9px 14px; font-size:13px; font-weight:600; text-decoration:none; }
    .search-filter-row { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
    .search-wrap { flex:1; min-width:200px; display:flex; align-items:center; gap:10px; background:#fff; border:1.5px solid #e8e8e8; border-radius:10px; padding:9px 14px; }
    .search-wrap input { flex:1; border:none; outline:none; font-size:14px; font-family:'Inter',sans-serif; }
    .filter-select { padding:9px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Inter',sans-serif; outline:none; appearance:none; background:#fff; min-width:140px; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#1E293B; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}
    .table-wrap { background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 1px 8px rgba(0,0,0,.05); overflow-x:auto; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table thead { background:#F8FAFC; }
    .data-table th { text-align:left; padding:12px 16px; font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }
    .data-table td { padding:13px 16px; border-top:1px solid #f5f5f5; font-size:14px; color:#111; vertical-align:middle; }
    .data-table tr:hover { background:#FAFAFA; }
    .user-cell { display:flex; align-items:center; gap:10px; }
    .user-avatar { width:36px; height:36px; border-radius:50%; background:#1E293B; color:#fff; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .user-name  { font-size:14px; font-weight:600; color:#111; }
    .user-email { font-size:12px; color:#888; }
    .spec-tag   { font-size:12px; background:#E6F1FB; color:#185FA5; padding:3px 8px; border-radius:6px; font-weight:500; }
    .status-pill { font-size:11px; padding:3px 10px; border-radius:20px; font-weight:600; }
    .status-pill.approved { background:#E1F5EE; color:#0F6E56; }
    .status-pill.pending  { background:#FEF9E7; color:#d4a017; }
    .status-pill.rejected { background:#FEF2F2; color:#D84040; }
    .date-cell  { color:#888; font-size:13px; }
    .action-link { color:#1E293B; font-weight:600; font-size:13px; text-decoration:none; padding:5px 10px; border-radius:8px; background:#F4F6FA; }
    .action-link:hover { background:#E8ECF0; }
    .empty-row  { padding:32px; text-align:center; color:#888; font-size:14px; }
  `],
})
export class DoctorManagementComponent implements OnInit {
  private http = inject(HttpClient);
  loading      = signal(true);
  all          = signal<any[]>([]);
  filtered     = signal<any[]>([]);
  q            = '';
  statusFilter = '';
  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/Admin/pending/doctors`).subscribe({
      next: (res: any) => {
        const d = res?.data ?? res;
        const list = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
        console.log('[DoctorMgmt] pending doctors:', list.length, list[0]);
        this.all.set(list);
        this.filtered.set(list);
        this.loading.set(false);
      },
      error: (e) => { console.error('[DoctorMgmt] error:', e); this.loading.set(false); }
    });
  }
  filter(): void {
    let data = this.all();
    if (this.q) { const q = this.q.toLowerCase(); data = data.filter(d => `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) || d.email.toLowerCase().includes(q)); }
    if (this.statusFilter) data = data.filter(d => d.approvalStatus === this.statusFilter);
    this.filtered.set(data);
  }
}
