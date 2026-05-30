import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))              return r;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.data))        return r.data;
  if (Array.isArray(r?.items))       return r.items;
  return [];
}

@Component({
  selector: 'app-patient-records',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="wrap">
  <div class="loading" *ngIf="loading()"><div class="sp"></div></div>

  <div class="empty" *ngIf="!loading() && records().length===0">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
    <p>No medical records from this patient</p>
  </div>

  <div class="rec-list" *ngIf="!loading() && records().length>0">
    <div class="rec-card" *ngFor="let r of records()">
      <div class="rec-ico" [innerHTML]="typeIcon(r.recordType ?? r.type)"></div>
      <div class="rec-info">
        <div class="rec-title">{{ r.title }}</div>
        <div class="rec-meta">
          <span class="type-badge">{{ r.recordType ?? r.type ?? 'Record' }}</span>
          <span class="rec-date">{{ (r.recordDate ?? r.createdAt) | date:'MMM d, y' }}</span>
        </div>
        <div class="rec-desc" *ngIf="r.description">{{ r.description }}</div>
      </div>
      <button class="view-btn" (click)="open(r)" *ngIf="r.fileUrl" title="View file">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .wrap{font-family:'Cairo','Segoe UI',sans-serif;}
    .loading{display:flex;justify-content:center;padding:32px;}
    .sp{width:22px;height:22px;border:2px solid #f0f0f0;border-top-color:#2D4A8A;border-radius:50%;animation:sp .7s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    .empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:40px;background:#fff;border-radius:12px;text-align:center;color:#9CA3AF;font-size:14px;}
    .rec-list{display:flex;flex-direction:column;gap:10px;}
    .rec-card{background:#fff;border-radius:12px;padding:12px 14px;box-shadow:0 1px 6px rgba(0,0,0,.05);display:flex;align-items:flex-start;gap:10px;}
    .rec-ico{width:38px;height:38px;background:#F4F6FA;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .rec-info{flex:1;min-width:0;}
    .rec-title{font-size:14px;font-weight:600;color:#111;margin-bottom:4px;}
    .rec-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
    .type-badge{font-size:11px;font-weight:600;background:#F0F2F5;color:#6B7280;padding:2px 8px;border-radius:20px;}
    .rec-date{font-size:12px;color:#9CA3AF;}
    .rec-desc{font-size:12px;color:#6B7280;margin-top:4px;line-height:1.4;}
    .view-btn{width:32px;height:32px;border-radius:8px;border:1.5px solid #E8ECF0;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6B7280;flex-shrink:0;}
    .view-btn:hover{background:#EEF2FF;color:#2D4A8A;border-color:#2D4A8A;}
  `]
})
export class PatientRecordsComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  records = signal<any[]>([]);

  ngOnInit(): void {
    const pid = this.route.parent?.snapshot.paramMap.get('patientId') ?? '';
    // POST /api/MedicalRecord/my-history with patientId (doctor viewing patient records)
    this.http.post<any>(`${environment.apiUrl}/MedicalRecord/my-history`, { patientId: pid })
      .subscribe({
        next: (res: any) => { this.records.set(toArr(res)); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  open(r: any): void { if (r.fileUrl) window.open(r.fileUrl, '_blank'); }

  typeIcon(type: string): string {
    const map: Record<string,string> = {
      'LabResult':       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11l-4 7h14l-4-7V3"/></svg>`,
      'Imaging':         `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5BAD" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
      'Report':          `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
      'Medical History': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
      'Vaccination':     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2"><path d="m18 2 4 4-14 14H4v-4Z"/></svg>`,
    };
    return map[type] ?? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  }
}
