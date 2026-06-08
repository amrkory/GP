import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))              return r;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.data))        return r.data;
  if (Array.isArray(r?.items))       return r.items;
  return [];
}

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">
  <div class="pg-hdr">
    <div>
      <h1>Service Requests</h1>
      <p class="sub" *ngIf="!loading()">{{ all().length }} total request{{ all().length!==1?'s':'' }}</p>
    </div>
  </div>

  <!-- Filter tabs -->
  <div class="ftabs">
    <button *ngFor="let f of FILTERS" class="ftab"
            [class.active]="tab()===f.k" (click)="tab.set(f.k)">
      {{ f.l }}
      <span class="fcnt" *ngIf="f.k!=='all'&&cnt(f.k)>0">{{ cnt(f.k) }}</span>
    </button>
  </div>

  <!-- Skeleton -->
  <div class="sk-list" *ngIf="loading()">
    <div class="sk-card" *ngFor="let i of [1,2,3]">
      <div class="sk-av"></div>
      <div class="sk-lines"><div class="sk-l w55"></div><div class="sk-l w75 mt4"></div></div>
    </div>
  </div>

  <!-- Empty -->
  <div class="empty" *ngIf="!loading()&&filtered().length===0">
    <div class="e-ico">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    </div>
    <p>No {{ tab()==='all'?'':tab()+' ' }}requests</p>
  </div>

  <!-- Cards grid -->
  <div class="req-grid" *ngIf="!loading()">
    <a class="req-card" *ngFor="let r of filtered()"
       [routerLink]="['/provider/requests', r.id]">

      <!-- Top: avatar + patient info + status -->
      <div class="card-top">
        <div class="pat-av" [style.background]="clr(r.patientName)">{{ ini(r.patientName) }}</div>
        <div class="pat-info">
          <div class="pat-name">{{ r.patientName || 'Patient' }}</div>
          <div class="pat-phone" *ngIf="r.patientPhone">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {{ r.patientPhone }}
          </div>
        </div>
        <span class="status-badge" [class]="sCls(r.status)">{{ r.status }}</span>
      </div>

      <!-- Details -->
      <div class="card-body">
        <div class="detail-row">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span class="detail-val">{{ r.patientAddress || 'No address' }}</span>
        </div>
        <div class="detail-row">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span class="detail-val">{{ (r.scheduledAt ?? r.requestedTime) | date:'MMM d, y · h:mm a' }}</span>
        </div>
        <div class="svc-tag">{{ r.serviceType || r.serviceDescription }}</div>
      </div>

      <div class="card-footer">
        <span class="view-link">View Details →</span>
      </div>
    </a>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;max-width:900px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .pg-hdr{margin-bottom:16px;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#6B7280;margin-top:3px;}
    .ftabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;}
    .ftab{padding:7px 14px;border:1.5px solid #E8ECF0;border-radius:20px;background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit;display:flex;align-items:center;gap:5px;}
    .ftab.active{background:#0F6E56;color:#fff;border-color:#0F6E56;}
    .fcnt{background:rgba(0,0,0,.12);font-size:10px;padding:1px 5px;border-radius:10px;}
    @keyframes pk{0%,100%{opacity:1;}50%{opacity:.45;}}
    .sk-list{display:flex;flex-direction:column;gap:10px;}
    .sk-card{display:flex;align-items:center;gap:12px;background:#fff;border-radius:16px;padding:16px;border:1px solid #F0F2F5;}
    .sk-av{width:46px;height:46px;border-radius:50%;background:#F0F2F5;flex-shrink:0;animation:pk 1.4s infinite;}
    .sk-lines{flex:1;display:flex;flex-direction:column;gap:8px;}
    .sk-l{height:11px;border-radius:6px;background:#F0F2F5;animation:pk 1.4s infinite;}
    .sk-l.w55{width:55%;}.sk-l.w75{width:75%;}.mt4{margin-top:0;}
    .empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:56px;background:#fff;border-radius:16px;text-align:center;border:1px solid #F0F2F5;}
    .e-ico{width:68px;height:68px;background:#F4F6FA;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty p{font-size:14px;color:#9CA3AF;}
    .req-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;}
    @media(max-width:640px){.req-grid{grid-template-columns:1fr;}}
    .req-card{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06);border:1px solid #F0F2F5;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:box-shadow .15s,transform .1s;}
    .req-card:hover{box-shadow:0 4px 18px rgba(0,0,0,.1);transform:translateY(-2px);}
    .card-top{display:flex;align-items:center;gap:12px;padding:16px 16px 12px;}
    .pat-av{width:46px;height:46px;border-radius:50%;color:#fff;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .pat-info{flex:1;min-width:0;}
    .pat-name{font-size:15px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .pat-phone{display:flex;align-items:center;gap:5px;font-size:12px;color:#6B7280;margin-top:2px;}
    .status-badge{font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;flex-shrink:0;}
    .status-badge.pending{background:#FFFBEB;color:#d4a017;}
    .status-badge.accepted{background:#ECFDF5;color:#0F6E56;}
    .status-badge.completed{background:#F0F2F5;color:#6B7280;}
    .status-badge.rejected{background:#FEF2F2;color:#D84040;}
    .card-body{padding:0 16px 12px;display:flex;flex-direction:column;gap:6px;}
    .detail-row{display:flex;align-items:flex-start;gap:7px;font-size:13px;color:#6B7280;}
    .detail-val{flex:1;line-height:1.4;}
    .svc-tag{display:inline-flex;align-items:center;background:#ECFDF5;color:#0F6E56;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;margin-top:4px;align-self:flex-start;}
    .card-footer{padding:10px 16px;background:#FAFBFC;border-top:1px solid #F0F2F5;margin-top:auto;}
    .view-link{font-size:13px;font-weight:600;color:#0F6E56;}
  `]
})
export class RequestListComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true);
  tab     = signal('all');
  all     = signal<any[]>([]);

  readonly FILTERS = [
    { k:'all',       l:'All'       },
    { k:'pending',   l:'Pending'   },
    { k:'accepted',  l:'Accepted'  },
    { k:'completed', l:'Completed' },
    { k:'rejected',  l:'Rejected'  },
  ];

  filtered(): any[] {
    const t = this.tab();
    if (t==='all') return this.all();
    return this.all().filter(r => (r.status??'').toLowerCase() === t);
  }
  cnt(k: string): number { return this.all().filter(r=>(r.status??'').toLowerCase()===k).length; }
  sCls(s: string): string { return (s??'').toLowerCase(); }
  ini(n: string): string {
    const p=(n||'P').trim().split(' ');
    return ((p[0]?.[0]??'P')+(p[1]?.[0]??'')).toUpperCase();
  }
  private C=['#0F6E56','#2D4A8A','#D84040','#7C3AED','#0891B2'];
  clr(n: string): string { return this.C[(n?.charCodeAt(0)||0)%this.C.length]; }

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/HomeService/NurseRequests`, {
      params: { pageNumber:'1', pageSize:'100' }
    }).subscribe({
      next: (res:any) => { this.all.set(toArr(res)); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
