import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalService } from '../../../core/services/medical.service';

const FREQ_COLORS: Record<string,string> = {
  'Once daily':'#2D4A8A','Twice daily':'#D84040',
  'Three times daily':'#0F6E56','As needed':'#7C3AED','Weekly':'#0891B2'
};

@Component({
  selector: 'app-medications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="pg-hdr">
        <h1>My Medications</h1>
        <div class="filter-row">
          <button class="ftab" [class.active]="showActive" (click)="showActive=true;load()">Active</button>
          <button class="ftab" [class.active]="!showActive" (click)="showActive=false;load()">All</button>
        </div>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <div class="empty" *ngIf="!loading() && meds().length===0">
        <div class="ei">💊</div>
        <p>No {{ showActive ? 'active' : '' }} medications</p>
        <p class="es">Your doctor will add medications here.</p>
      </div>

      <div class="med-list" *ngIf="!loading()">
        <div class="med-card" *ngFor="let m of meds()" [class.inactive]="!isActive(m)">
          <div class="med-header">
            <div class="med-dot" [style.background]="freqColor(m)"></div>
            <div class="med-info">
              <div class="med-name">{{ m.name ?? m.medicationName }}</div>
              <div class="med-dosage">{{ m.dosage }}</div>
            </div>
            <span class="med-status" [class.active]="isActive(m)">
              {{ isActive(m) ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="med-details">
            <div class="md-item" *ngIf="m.frequency">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ m.frequency }}
            </div>
            <div class="md-item" *ngIf="m.duration">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ m.duration }}
            </div>
            <div class="md-item" *ngIf="m.doctorName">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Dr. {{ m.doctorName }}
            </div>
          </div>
          <div class="med-instructions" *ngIf="m.instructions">{{ m.instructions }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{width:100%;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:14px;}}
    .pg-hdr{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .filter-row{display:flex;gap:6px;}
    .ftab{padding:7px 14px;border-radius:20px;border:1.5px solid #e8e8e8;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#666;font-family:inherit;}
    .ftab.active{background:#D84040;color:#fff;border-color:#D84040;}
    .loading{display:flex;justify-content:center;padding:48px;}
    .spinner{width:26px;height:26px;border:3px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:56px;background:#fff;border-radius:16px;text-align:center;color:#888;font-size:14px;}
    .ei{font-size:40px;}.es{font-size:13px;color:#aaa;}
    .med-list{display:flex;flex-direction:column;gap:12px;}
    .med-card{background:#fff;border-radius:16px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,.07);transition:opacity .2s;}
    .med-card.inactive{opacity:.65;}
    .med-header{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
    .med-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;}
    .med-info{flex:1;}
    .med-name{font-size:16px;font-weight:700;color:#111;}
    .med-dosage{font-size:13px;color:#888;margin-top:2px;}
    .med-status{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:#f0f0f0;color:#888;}
    .med-status.active{background:#E1F5EE;color:#0F6E56;}
    .med-details{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:6px;}
    .md-item{display:flex;align-items:center;gap:5px;font-size:12px;color:#666;}
    .med-instructions{font-size:13px;color:#555;background:#F7F8FA;border-radius:8px;padding:8px 12px;font-style:italic;}
  `]
})
export class MedicationsComponent implements OnInit {
  private svc = inject(MedicalService);
  loading    = signal(true);
  meds       = signal<any[]>([]);
  showActive = true;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getMyMedications(this.showActive ? true : undefined).subscribe({
      next: (res: any) => {
        this.meds.set(Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isActive(m: any): boolean { return m.isActive !== false && m.status !== 'Inactive'; }
  freqColor(m: any): string { return FREQ_COLORS[m.frequency ?? ''] ?? '#2D4A8A'; }
}
