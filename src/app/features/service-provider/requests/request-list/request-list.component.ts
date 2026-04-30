import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';
import { ApiResponse }    from '../../../../core/models/api.models';

interface ServiceRequest {
  id: string; patientName: string; patientAddress: string; patientPhone: string;
  serviceType: string; scheduledAt: string; status: string; notes: string | null;
}

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header"><h1>Service Requests</h1></div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        <button *ngFor="let f of filters" class="ftab" [class.active]="activeFilter()===f.key"
                (click)="activeFilter.set(f.key)">
          {{ f.label }}
          <span class="ftab-count" *ngIf="countOf(f.key) > 0">{{ countOf(f.key) }}</span>
        </button>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <div class="req-grid" *ngIf="!loading()">
        <a class="req-card" *ngFor="let r of filtered()" [routerLink]="['/provider/requests', r.id]">
          <div class="card-top">
            <div class="pat-avatar">{{ initials(r.patientName) }}</div>
            <div class="pat-info">
              <div class="pat-name">{{ r.patientName }}</div>
              <div class="pat-phone">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg>
                {{ r.patientPhone || '—' }}
              </div>
            </div>
            <span class="status-pill" [class]="r.status.toLowerCase()">{{ r.status }}</span>
          </div>

          <div class="card-divider"></div>

          <div class="card-body">
            <div class="info-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/></svg>
              <span class="svc-type">{{ r.serviceType }}</span>
            </div>
            <div class="info-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ r.scheduledAt | date:'EEE, MMM d · h:mm a' }}
            </div>
            <div class="info-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ r.patientAddress }}
            </div>
            <div class="info-item note" *ngIf="r.notes">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {{ r.notes }}
            </div>
          </div>
          <div class="card-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </a>

        <div class="empty" *ngIf="filtered().length === 0">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <p>No {{ activeFilter() === 'all' ? '' : activeFilter().toLowerCase() + ' ' }}requests</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:1100px; }
    @media(max-width:768px){.page{padding:16px;}}
    .page-header { margin-bottom:16px; }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; }
    .filter-tabs { display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap; }
    .ftab { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:20px; border:1.5px solid #e8e8e8; background:#fff; font-size:13px; cursor:pointer; color:#666; transition:all .15s; }
    .ftab.active { background:#0F6E56; color:#fff; border-color:#0F6E56; }
    .ftab-count { background:rgba(255,255,255,.25); font-size:11px; font-weight:700; padding:1px 6px; border-radius:8px; }
    .ftab:not(.active) .ftab-count { background:#e8e8e8; color:#555; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#0F6E56; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin{to{transform:rotate(360deg);}}
    .req-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
    @media(max-width:480px){.req-grid{grid-template-columns:1fr;}}
    .req-card { background:#fff; border-radius:14px; padding:16px; box-shadow:0 1px 8px rgba(0,0,0,.06); text-decoration:none; color:inherit; display:flex; flex-direction:column; gap:12px; cursor:pointer; transition:transform .15s,box-shadow .15s; }
    .req-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.1); }
    .card-top { display:flex; align-items:flex-start; gap:10px; }
    .pat-avatar { width:44px; height:44px; border-radius:50%; background:#0F6E56; color:#fff; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .pat-info  { flex:1; }
    .pat-name  { font-size:15px; font-weight:600; color:#111; margin-bottom:2px; }
    .pat-phone { font-size:12px; color:#888; display:flex; align-items:center; gap:4px; }
    .status-pill { font-size:11px; padding:3px 10px; border-radius:20px; font-weight:600; white-space:nowrap; }
    .status-pill.pending   { background:#FEF9E7; color:#d4a017; }
    .status-pill.accepted  { background:#E1F5EE; color:#0F6E56; }
    .status-pill.completed { background:#f0f0f0; color:#555; }
    .status-pill.rejected  { background:#FEF2F2; color:#D84040; }
    .card-divider { height:1px; background:#f5f5f5; }
    .card-body  { display:flex; flex-direction:column; gap:6px; }
    .info-item  { display:flex; align-items:flex-start; gap:7px; font-size:13px; color:#555; }
    .svc-type   { font-weight:600; color:#0F6E56; }
    .note       { color:#888; font-style:italic; }
    .card-arrow { display:flex; justify-content:flex-end; }
    .empty { grid-column:1/-1; display:flex; flex-direction:column; align-items:center; gap:10px; padding:48px; background:#fff; border-radius:14px; color:#888; font-size:14px; }
    .empty-icon { width:72px; height:72px; background:#f0f0f0; border-radius:50%; display:flex; align-items:center; justify-content:center; }
  `],
})
export class RequestListComponent implements OnInit {
  private http = inject(HttpClient);
  loading      = signal(true);
  all          = signal<ServiceRequest[]>([]);
  activeFilter = signal('all');

  filters = [
    { key:'all',       label:'All'       },
    { key:'Pending',   label:'Pending'   },
    { key:'Accepted',  label:'Accepted'  },
    { key:'Completed', label:'Completed' },
    { key:'Rejected',  label:'Rejected'  },
  ];

  filtered(): ServiceRequest[] {
    const f = this.activeFilter();
    return f === 'all' ? this.all() : this.all().filter(r => r.status === f);
  }
  initials(name: string): string { return name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase(); }

  countOf(key: string): number {
    return key === 'all' ? 0 : this.all().filter(r => r.status === key).length;
  }

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/HomeService/NurseRequests`).subscribe({
      next: (res: any) => {
        const list = res?.data?.items ?? res?.data ?? [];
        this.all.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
