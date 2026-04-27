import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { RouterLink }     from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

@Component({
  selector: 'app-provider-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header"><h1>Service Providers</h1><p class="page-sub">{{ all().length }} registered providers</p></div>
      <div class="empty-state" *ngIf="!loading() && all().length === 0">
        <div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
        <h3>No providers yet</h3>
        <p>Providers will appear here once they register.</p>
      </div>
      <div class="table-wrap" *ngIf="!loading() && all().length > 0">
        <table class="data-table">
          <thead><tr><th>Provider</th><th>Service Type</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let p of all()">
              <td><div class="user-cell"><div class="user-avatar">{{ p.firstName?.[0] }}{{ p.lastName?.[0] }}</div><div><div class="user-name">{{ p.firstName }} {{ p.lastName }}</div><div class="user-email">{{ p.email || p.serviceType }}</div></div></div></td>
              <td><span class="spec-tag">{{ p.serviceType }}</span></td>
              <td><span class="status-pill approved">Active</span></td>
              <td><a [routerLink]="['/admin/providers', p.id]" class="action-link">View</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles:[`.page{padding:24px;max-width:1100px;}@media(max-width:768px){.page{padding:16px;}}.page-header{margin-bottom:16px;}.page-header h1{font-size:22px;font-weight:800;color:#111;margin-bottom:2px;}.page-sub{font-size:14px;color:#888;}.loading{display:flex;justify-content:center;padding:40px;}.spinner{width:28px;height:28px;border:3px solid #f0f0f0;border-top-color:#1E293B;border-radius:50%;animation:spin .7s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}.table-wrap{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.05);overflow-x:auto;}.data-table{width:100%;border-collapse:collapse;}.data-table thead{background:#F8FAFC;}.data-table th{text-align:left;padding:12px 16px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em;}.data-table td{padding:12px 16px;border-top:1px solid #f5f5f5;font-size:14px;color:#111;vertical-align:middle;}.user-cell{display:flex;align-items:center;gap:10px;}.user-avatar{width:36px;height:36px;border-radius:50%;background:#0F6E56;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}.user-name{font-size:14px;font-weight:600;color:#111;}.user-email{font-size:12px;color:#888;}.spec-tag{font-size:12px;background:#E1F5EE;color:#0F6E56;padding:3px 8px;border-radius:6px;font-weight:500;}.status-pill{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600;}.status-pill.approved{background:#E1F5EE;color:#0F6E56;}.action-link{color:#1E293B;font-weight:600;font-size:13px;text-decoration:none;padding:5px 10px;border-radius:8px;background:#F4F6FA;}.empty-state{text-align:center;padding:60px 24px;background:#fff;border-radius:14px;}.empty-icon{width:72px;height:72px;background:#f0f0f0;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}.empty-state h3{font-size:18px;font-weight:700;color:#111;margin-bottom:4px;}.empty-state p{color:#888;font-size:14px;}`]
})
export class ProviderManagementComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true); all = signal<any[]>([]);
  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/providers`)
      .subscribe(res => { this.all.set(res.data.items ?? res.data ?? []); this.loading.set(false); });
  }
}
