import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { RouterLink }    from '@angular/router';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../../../environments/environment';

function toArr(res: any): any[] {
  const d = res?.data ?? res;
  return Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
}
function num(res: any): number {
  const v = res?.data ?? res;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v)
    return v.count ?? v.total ?? v.value ?? v.patientCount ?? 0;
  return 0;
}

@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
<div class="page">

  <div class="pg-hdr">
    <div>
      <h1>Patients</h1>
      <p class="sub">
        <span class="count-chip red">{{ totalCount() }} total patients</span>
      </p>
    </div>
  </div>

  <!-- Search -->
  <div class="filter-row">
    <div class="search-box">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input [(ngModel)]="q" (input)="filter()" placeholder="Search name or email…"/>
    </div>
  </div>

  <div class="loading" *ngIf="loading()"><div class="spin"></div></div>

  <!-- Count only info box when list is empty -->
  <div class="info-box" *ngIf="!loading() && all().length === 0">
    <div class="info-ico">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2D4A8A" stroke-width="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    </div>
    <h3>{{ totalCount() }} Registered Patients</h3>
    <p>Patient list API is not available in admin scope.<br/>
       Use the count above for system overview.</p>
  </div>

  <!-- Table when list available -->
  <div class="tbl-wrap" *ngIf="!loading() && filtered().length > 0">
    <table>
      <thead>
        <tr>
          <th>Patient</th>
          <th>Gender</th>
          <th>Date of Birth</th>
          <th>Phone</th>
          <th>Joined</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of filtered()">
          <td>
            <div class="user-cell">
              <div class="av" [style.background]="clr(p)">{{ ini(p) }}</div>
              <div>
                <div class="uname">{{ p.firstName ?? '' }} {{ p.lastName ?? '' }}</div>
                <div class="uemail">{{ p.email ?? '' }}</div>
              </div>
            </div>
          </td>
          <td class="muted">{{ p.gender ?? '—' }}</td>
          <td class="muted">{{ p.dateOfBirth | date:'MMM d, y' }}</td>
          <td class="muted">{{ p.phoneNumber ?? '—' }}</td>
          <td class="muted">{{ p.createdAt | date:'MMM d, y' }}</td>
          <td>
            <div class="act-row">
              <a [routerLink]="['/admin/patients', p.id]" class="btn-view">View</a>
              <button class="btn-del" (click)="confirmDelete(p)" title="Delete">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Delete confirm modal -->
  <div class="modal-bg" *ngIf="deleteTarget" (click)="deleteTarget=null"></div>
  <div class="modal" *ngIf="deleteTarget">
    <div class="modal-ico">🗑️</div>
    <h3>Delete Patient?</h3>
    <p>{{ deleteTarget.firstName }} {{ deleteTarget.lastName }} — this cannot be undone.</p>
    <div class="modal-btns">
      <button class="btn-cancel" (click)="deleteTarget=null">Cancel</button>
      <button class="btn-confirm-del" (click)="doDelete()" [disabled]="deleting()">
        {{ deleting() ? 'Deleting…' : 'Delete' }}
      </button>
    </div>
  </div>

</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{width:100%;font-family:'Cairo','Segoe UI',sans-serif;padding-bottom:40px;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .pg-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{display:flex;align-items:center;gap:6px;margin-top:5px;}
    .count-chip{font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;}
    .count-chip.red{background:#FEF2F2;color:#D84040;}
    .filter-row{display:flex;gap:10px;margin-bottom:16px;}
    .search-box{flex:1;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #E8ECF0;border-radius:11px;padding:10px 14px;}
    .search-box input{flex:1;border:none;outline:none;font-size:14px;font-family:inherit;}
    .loading{display:flex;justify-content:center;padding:48px;}
    .spin{width:26px;height:26px;border:3px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;}
    .info-box{background:#fff;border-radius:18px;padding:48px;text-align:center;border:1px solid #F0F2F5;box-shadow:0 1px 8px rgba(0,0,0,.05);}
    .info-ico{width:72px;height:72px;background:#EEF2FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}
    .info-box h3{font-size:24px;font-weight:800;color:#111;margin-bottom:8px;}
    .info-box p{font-size:14px;color:#888;line-height:1.6;}
    .tbl-wrap{background:#fff;border-radius:16px;box-shadow:0 1px 8px rgba(0,0,0,.06);overflow:hidden;overflow-x:auto;}
    table{width:100%;border-collapse:collapse;}
    thead{background:#F8FAFC;}
    th{text-align:left;padding:12px 16px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;}
    td{padding:14px 16px;border-top:1px solid #F5F7FA;font-size:13px;color:#111;vertical-align:middle;}
    tr:hover td{background:#FAFBFC;}
    .user-cell{display:flex;align-items:center;gap:10px;}
    .av{width:38px;height:38px;border-radius:50%;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .uname{font-size:14px;font-weight:600;color:#111;}
    .uemail{font-size:12px;color:#888;}
    .muted{color:#6B7280;font-size:13px;}
    .act-row{display:flex;align-items:center;gap:6px;}
    .btn-view{font-size:12px;font-weight:600;color:#1E293B;text-decoration:none;padding:5px 10px;border-radius:7px;background:#F4F6FA;}
    .btn-view:hover{background:#E8ECF0;}
    .btn-del{width:28px;height:28px;border:none;border-radius:7px;background:#FEF2F2;color:#D84040;cursor:pointer;display:flex;align-items:center;justify-content:center;}
    /* Modal */
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100;}
    .modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:20px;padding:28px 24px;width:90%;max-width:360px;z-index:101;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.15);}
    .modal-ico{font-size:36px;margin-bottom:12px;}
    .modal h3{font-size:18px;font-weight:800;color:#111;margin-bottom:8px;}
    .modal p{font-size:14px;color:#6B7280;margin-bottom:20px;}
    .modal-btns{display:flex;gap:10px;}
    .btn-cancel{flex:1;padding:11px;border:1.5px solid #E8ECF0;background:#fff;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;}
    .btn-confirm-del{flex:1;padding:11px;background:#D84040;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
    .btn-confirm-del:disabled{opacity:.5;}
  `]
})
export class PatientManagementComponent implements OnInit {
  private http  = inject(HttpClient);
  loading       = signal(true);
  deleting      = signal(false);
  all           = signal<any[]>([]);
  filtered      = signal<any[]>([]);
  totalCount    = signal(0);
  q             = '';
  deleteTarget: any = null;

  ngOnInit(): void {
    // Get total count
    this.http.get<any>(`${environment.apiUrl}/Admin/patients/count`).subscribe({
      next: r => this.totalCount.set(num(r)), error: () => {}
    });
    // Try to get patients list
    this.http.get<any>(`${environment.apiUrl}/Profile/patientData`, {
      params: { pageNumber: '1', pageSize: '100' }
    }).subscribe({
      next: (res: any) => {
        const list = toArr(res);
        console.log('[AdminPatients]', list.length, list[0]);
        this.all.set(list);
        this.filtered.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filter(): void {
    if (!this.q) { this.filtered.set(this.all()); return; }
    const q = this.q.toLowerCase();
    this.filtered.set(this.all().filter(p => {
      const name = `${p.firstName??''} ${p.lastName??''}`.toLowerCase();
      return name.includes(q) || (p.email ?? '').toLowerCase().includes(q);
    }));
  }

  confirmDelete(p: any): void { this.deleteTarget = p; }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.deleting.set(true);
    this.http.delete(`${environment.apiUrl}/Admin/delete-account`, {
      body: { id: this.deleteTarget.id }
    }).subscribe({
      next: () => {
        this.all.update(l => l.filter(p => p.id !== this.deleteTarget.id));
        this.filter();
        this.deleting.set(false);
        this.deleteTarget = null;
        this.totalCount.update(n => Math.max(0, n - 1));
      },
      error: () => this.deleting.set(false)
    });
  }

  ini(p: any): string {
    const f = (p.firstName ?? 'P')[0] ?? 'P';
    const l = (p.lastName  ?? '')[0]  ?? '';
    return (f + l).toUpperCase();
  }
  private C = ['#D84040','#2D4A8A','#0F6E56','#7C3AED','#0891B2'];
  clr(p: any): string { return this.C[((p.firstName??'P').charCodeAt(0)) % this.C.length]; }
}
