import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { RouterLink }     from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header"><div><h1>Patients</h1><p class="page-sub">{{ filtered().length }} registered patients</p></div></div>
      <div class="search-row">
        <div class="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input [(ngModel)]="q" (input)="filter()" placeholder="Search name or email…" />
        </div>
      </div>
      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
      <div class="table-wrap" *ngIf="!loading()">
        <table class="data-table">
          <thead><tr><th>Patient</th><th>Gender</th><th>Blood Type</th><th>Conditions</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let p of filtered()">
              <td>
                <div class="user-cell">
                  <div class="user-avatar" [style.background]="bloodColor(p.bloodType)">{{ p.firstName[0] }}{{ p.lastName[0] }}</div>
                  <div><div class="user-name">{{ p.firstName }} {{ p.lastName }}</div><div class="user-email">{{ p.email }}</div></div>
                </div>
              </td>
              <td>{{ p.gender || '—' }}</td>
              <td><span class="blood-tag">{{ p.bloodType || '—' }}</span></td>
              <td>
                <span class="disease-tag" *ngFor="let d of (p.chronicDiseases || []).slice(0,2)">{{ d }}</span>
                <span *ngIf="!p.chronicDiseases?.length" class="none-tag">None</span>
              </td>
              <td class="date-cell">{{ p.createdAt | date:'MMM d, y' }}</td>
              <td>
                <a [routerLink]="['/admin/patients', p.id]" class="action-link">View</a>
                <button class="action-link danger" (click)="deletePatient(p.id)" style="margin-left:6px">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-row" *ngIf="filtered().length === 0"><p>No patients found</p></div>
      </div>
    </div>

    <!-- Delete confirm dialog -->
    <div class="dialog-backdrop" *ngIf="showDeleteDialog" (click)="showDeleteDialog=false"></div>
    <div class="dialog" *ngIf="showDeleteDialog">
      <div class="dialog-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></div>
      <h3>Delete Patient?</h3>
      <p>This action cannot be undone. The patient and all associated data will be permanently deleted.</p>
      <div class="dialog-actions">
        <button class="btn-keep" (click)="showDeleteDialog=false">Cancel</button>
        <button class="btn-confirm-delete" (click)="doDelete()">Delete</button>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:1200px;}@media(max-width:768px){.page{padding:16px;}}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
    .page-header h1{font-size:22px;font-weight:800;color:#111;margin-bottom:2px;}
    .page-sub{font-size:14px;color:#888;}
    .search-row{margin-bottom:16px;}
    .search-wrap{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #e8e8e8;border-radius:10px;padding:9px 14px;max-width:360px;}
    .search-wrap input{flex:1;border:none;outline:none;font-size:14px;font-family:'Inter',sans-serif;}
    .loading{display:flex;justify-content:center;padding:40px;}
    .spinner{width:28px;height:28px;border:3px solid #f0f0f0;border-top-color:#1E293B;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .table-wrap{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.05);overflow-x:auto;}
    .data-table{width:100%;border-collapse:collapse;}
    .data-table thead{background:#F8FAFC;}
    .data-table th{text-align:left;padding:12px 16px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;}
    .data-table td{padding:12px 16px;border-top:1px solid #f5f5f5;font-size:14px;color:#111;vertical-align:middle;}
    .data-table tr:hover{background:#FAFAFA;}
    .user-cell{display:flex;align-items:center;gap:10px;}
    .user-avatar{width:36px;height:36px;border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .user-name{font-size:14px;font-weight:600;color:#111;}
    .user-email{font-size:12px;color:#888;}
    .blood-tag{font-size:12px;background:#FEF2F2;color:#D84040;padding:2px 8px;border-radius:6px;font-weight:600;}
    .disease-tag{font-size:11px;background:#E6F1FB;color:#185FA5;padding:2px 7px;border-radius:6px;margin-right:4px;}
    .none-tag{font-size:12px;color:#ccc;}
    .date-cell{color:#888;font-size:13px;}
    .action-link{color:#1E293B;font-weight:600;font-size:13px;text-decoration:none;padding:5px 10px;border-radius:8px;background:#F4F6FA;border:none;cursor:pointer;}
    .action-link:hover{background:#E8ECF0;}
    .action-link.danger{color:#D84040;background:#FEF2F2;}
    .action-link.danger:hover{background:#FEE2E2;}
    .empty-row{padding:32px;text-align:center;color:#888;font-size:14px;}
    .dialog-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;}
    .dialog{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:20px;padding:28px 24px;width:90%;max-width:380px;z-index:101;box-shadow:0 16px 48px rgba(0,0,0,.18);}
    .dialog-icon{width:52px;height:52px;background:#FEF2F2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
    .dialog h3{font-size:18px;font-weight:700;color:#111;text-align:center;margin-bottom:8px;}
    .dialog p{font-size:14px;color:#666;text-align:center;line-height:1.5;margin-bottom:18px;}
    .dialog-actions{display:flex;gap:10px;}
    .btn-keep{flex:1;padding:12px;border:1.5px solid #e8e8e8;background:#fff;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;color:#555;}
    .btn-confirm-delete{flex:1;padding:12px;background:#D84040;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;}
  `],
})
export class PatientManagementComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true); all = signal<any[]>([]); filtered = signal<any[]>([]);
  q = ''; showDeleteDialog = false; deleteTargetId = '';
  ngOnInit(): void { this.http.get<any>(`${environment.apiUrl}/Admin/pending/nurses`).subscribe((res: any) => { this.all.set(res.data.items ?? res.data); this.filtered.set(this.all()); this.loading.set(false); }); }
  filter(): void { const q = this.q.toLowerCase(); this.filtered.set(!q ? this.all() : this.all().filter(p => `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q))); }
  deletePatient(id: string): void { this.deleteTargetId = id; this.showDeleteDialog = true; }
  doDelete(): void {
    this.http.delete(`${environment.apiUrl}/Admin/delete-account`, { body: { id: this.deleteTargetId } }).subscribe({
      next: () => { this.all.update(a => a.filter(p => p.id !== this.deleteTargetId)); this.filter(); this.showDeleteDialog = false; },
      error: () => { this.all.update(a => a.filter(p => p.id !== this.deleteTargetId)); this.filter(); this.showDeleteDialog = false; }
    });
  }
  bloodColor(bt: string): string { const m: Record<string,string> = {'O+':'#D84040','A+':'#185FA5','B+':'#0F6E56','AB+':'#6B5BAD'}; return m[bt]??'#1E293B'; }
}
