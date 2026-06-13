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
    return v.count ?? v.total ?? v.value ?? v.nurseCount ?? 0;
  return 0;
}

@Component({
  selector: 'app-provider-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
<div class="page">

  <div class="pg-hdr">
    <div>
      <h1>Providers / Nurses</h1>
      <p class="sub">
        <span class="count-chip green">{{ totalCount() }} total</span>
        <span class="count-chip yellow" *ngIf="pendingCount() > 0">{{ pendingCount() }} pending</span>
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
    <select [(ngModel)]="statusF" (change)="filter()" class="filter-sel">
      <option value="">All Status</option>
      <option value="Approved">Approved</option>
      <option value="Pending">Pending</option>
      <option value="Rejected">Rejected</option>
    </select>
  </div>

  <div class="loading" *ngIf="loading()"><div class="spin"></div></div>

  <div class="empty" *ngIf="!loading() && filtered().length === 0">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
    <p>No providers found</p>
  </div>

  <div class="tbl-wrap" *ngIf="!loading() && filtered().length > 0">
    <table>
      <thead>
        <tr>
          <th>Nurse / Provider</th>
          <th>Specialization</th>
          <th>License</th>
          <th>Exp</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Joined</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <ng-container *ngFor="let n of filtered()">
        <tr>
          <td>
            <div class="user-cell">
              <div class="av" [style.background]="clr(n)">{{ ini(n) }}</div>
              <div>
                <div class="uname">{{ n.firstName ?? n.nurseFirstName ?? '' }} {{ n.lastName ?? n.nurseLastName ?? '' }}</div>
                <div class="uemail">{{ n.email ?? '' }}</div>
              </div>
            </div>
          </td>
          <td><span class="spec">{{ n.specialization ?? n.specialtyName ?? n.specialty ?? n.serviceType ?? '—' }}</span></td>
          <td class="muted">{{ n.licenseNumber ?? '—' }}</td>
          <td class="muted">{{ n.experienceYears ?? n.yearsExperience ?? 0 }} yrs</td>
          <td class="muted">{{ n.nursePhoneNumber ?? n.phoneNumber ?? '—' }}</td>
          <td>
            <span class="badge" [class]="bCls(n)">{{ n.approvalStatus ?? n.status ?? 'Pending' }}</span>
          </td>
          <td class="muted">{{ (n.createdAt ?? n.joinedAt) | date:'MMM d, y' }}</td>
          <td>
            <div class="act-row">
              <button class="btn-view" (click)="expand===n.id ? expand='' : expand=n.id">
                {{ expand===n.id ? 'Close' : 'View' }}
              </button>
              <button class="btn-accept" *ngIf="isPending(n)" (click)="decide(n, true)" [disabled]="acting===n.id" title="Approve">✓</button>
              <button class="btn-reject" *ngIf="isPending(n)" (click)="decide(n, false)" [disabled]="acting===n.id" title="Reject">✗</button>
            </div>
          </td>
        </tr>
          <tr class="detail-row" *ngIf="expand===n.id">
            <td colspan="8">
              <div class="detail-panel">
                <div class="dp-item"><span>ID</span><strong>{{ n.id ?? n.nurseId ?? '—' }}</strong></div>
                <div class="dp-item"><span>Email</span><strong>{{ n.email ?? '—' }}</strong></div>
                <div class="dp-item"><span>Phone</span><strong>{{ n.nursePhoneNumber ?? n.phoneNumber ?? '—' }}</strong></div>
                <div class="dp-item"><span>License</span><strong>{{ n.licenseNumber ?? '—' }}</strong></div>
                <div class="dp-item"><span>Specialization</span><strong>{{ n.specialization ?? n.serviceType ?? '—' }}</strong></div>
                <div class="dp-item"><span>Experience</span><strong>{{ (n.experienceYears ?? n.yearsExperience ?? 0) }} years</strong></div>
                <div class="dp-item"><span>Status</span><strong>{{ n.approvalStatus ?? n.status ?? 'Pending' }}</strong></div>
                <div class="dp-item"><span>Joined</span><strong>{{ (n.createdAt ?? n.joinedAt) | date:'MMM d, y' }}</strong></div>
                <div class="dp-actions" *ngIf="isPending(n)">
                  <button class="dp-approve" (click)="decide(n, true)" [disabled]="acting===n.id">
                    ✓ Approve
                  </button>
                  <button class="dp-reject" (click)="decide(n, false)" [disabled]="acting===n.id">
                    ✗ Reject
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </ng-container>
      </tbody>
    </table>
  </div>

</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{width:100%;font-family:'Cairo','Segoe UI',sans-serif;padding-bottom:40px;}
    @media(max-width:768px){table{font-size:12px;}th,td{padding:10px 10px;}}
    @keyframes spin{to{transform:rotate(360deg);}}
    .pg-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{display:flex;align-items:center;gap:6px;margin-top:5px;}
    .count-chip{font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;}
    .count-chip.green{background:#ECFDF5;color:#0F6E56;}
    .count-chip.yellow{background:#FEF9E7;color:#d4a017;}
    .filter-row{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
    .search-box{flex:1;min-width:220px;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #E8ECF0;border-radius:11px;padding:10px 14px;}
    .search-box input{flex:1;border:none;outline:none;font-size:14px;font-family:inherit;}
    .filter-sel{padding:10px 14px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;appearance:none;background:#fff;min-width:140px;}
    .loading{display:flex;justify-content:center;padding:48px;}
    .spin{width:26px;height:26px;border:3px solid #f0f0f0;border-top-color:#0F6E56;border-radius:50%;animation:spin .7s linear infinite;}
    .empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:56px;background:#fff;border-radius:16px;border:1px solid #F0F2F5;text-align:center;color:#9CA3AF;}
    .empty p{font-size:15px;font-weight:700;color:#374151;}
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
    .spec{font-size:12px;background:#E1F5EE;color:#0F6E56;padding:3px 8px;border-radius:6px;font-weight:500;white-space:nowrap;}
    .muted{color:#6B7280;font-size:13px;}
    .badge{font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;white-space:nowrap;}
    .approved{background:#ECFDF5;color:#0F6E56;}
    .pending{background:#FEF9E7;color:#d4a017;}
    .rejected{background:#FEF2F2;color:#D84040;}
    .act-row{display:flex;align-items:center;gap:5px;}
    .btn-view{font-size:12px;font-weight:600;color:#1E293B;text-decoration:none;padding:5px 10px;border-radius:7px;background:#F4F6FA;}
    .btn-view:hover{background:#E8ECF0;}
    .btn-accept{width:28px;height:28px;border:none;border-radius:7px;background:#ECFDF5;color:#0F6E56;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;}
    .btn-reject{width:28px;height:28px;border:none;border-radius:7px;background:#FEF2F2;color:#D84040;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;}
    .btn-accept:disabled,.btn-reject:disabled{opacity:.4;}
    .detail-row td{padding:0!important;background:#F8FAFC;}
    .detail-panel{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;padding:14px 16px;}
    .dp-item{display:flex;flex-direction:column;gap:3px;}
    .dp-item span{font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.3px;font-weight:600;}
    .dp-item strong{font-size:13px;color:#111;word-break:break-all;}
    .dp-actions{grid-column:1/-1;display:flex;gap:8px;padding-top:4px;}
    .dp-approve{padding:8px 18px;background:#0F6E56;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
    .dp-reject{padding:8px 18px;background:#FEF2F2;color:#D84040;border:1.5px solid #FECACA;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
  `]
})
export class ProviderManagementComponent implements OnInit {
  private http  = inject(HttpClient);
  loading       = signal(true);
  all           = signal<any[]>([]);
  filtered      = signal<any[]>([]);
  totalCount    = signal(0);
  pendingCount  = signal(0);
  q = ''; statusF = ''; acting = ''; expand = '';

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/Admin/nurses/count`).subscribe({
      next: r => this.totalCount.set(num(r)), error: () => {}
    });
    this.http.get<any>(`${environment.apiUrl}/Admin/pending/nurses`).subscribe({
      next: (res: any) => {
        const list = toArr(res);
        console.log('[AdminProviders] pending:', list.length, list[0]);
        this.pendingCount.set(list.length);
        this.all.set(list);
        this.filtered.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filter(): void {
    let d = this.all();
    if (this.q) {
      const q = this.q.toLowerCase();
      d = d.filter(x => {
        const name = `${x.firstName??''} ${x.lastName??''}`.toLowerCase();
        const email = (x.email ?? '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }
    if (this.statusF) d = d.filter(x =>
      (x.approvalStatus ?? x.status ?? '').toLowerCase() === this.statusF.toLowerCase()
    );
    this.filtered.set(d);
  }

  isPending(n: any): boolean {
    return (n.approvalStatus ?? n.status ?? '').toLowerCase() === 'pending';
  }

  decide(n: any, accept: boolean): void {
    this.acting = n.id ?? n.nurseId;
    this.http.post<any>(`${environment.apiUrl}/Admin/accept-reject`, {
      userId: n.id ?? n.nurseId ?? n.userId,
      accept
    }).subscribe({
      next: () => {
        this.acting = '';
        const status = accept ? 'Approved' : 'Rejected';
        this.all.update(l => l.map(x => x.id === n.id ? { ...x, approvalStatus: status } : x));
        this.filter();
        if (accept) this.pendingCount.update(c => Math.max(0, c - 1));
      },
      error: () => this.acting = ''
    });
  }

  ini(n: any): string {
    const f = (n.firstName ?? n.nurseFirstName ?? 'N')[0] ?? 'N';
    const l = (n.lastName  ?? n.nurseLastName  ?? '')[0]  ?? '';
    return (f + l).toUpperCase();
  }
  bCls(n: any): string {
    const s = (n.approvalStatus ?? n.status ?? 'pending').toLowerCase();
    return `badge ${s}`;
  }
  private C = ['#0F6E56','#2D4A8A','#7C3AED','#D84040','#0891B2'];
  clr(n: any): string { return this.C[((n.firstName??'N').charCodeAt(0)) % this.C.length]; }
}
