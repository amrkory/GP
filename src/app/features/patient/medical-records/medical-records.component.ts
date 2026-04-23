import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { FormsModule }                         from '@angular/forms';
import { PatientService }                      from '../../../core/services/patient.service';
import { MedicalRecord }                       from '../../../core/models/api.models';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Medical Records</h1>
        <button class="btn-add" (click)="fileInput.click()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Upload
        </button>
        <input #fileInput type="file" style="display:none" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" (change)="onFileSelect($event)" />
      </div>

      <!-- Upload area -->
      <div class="upload-area" (click)="fileInput.click()" *ngIf="records().length === 0 && !loading()">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p>Upload your medical documents</p>
        <span>PDF, JPG, PNG up to 10MB</span>
      </div>

      <!-- Upload progress -->
      <div class="upload-progress" *ngIf="uploading()">
        <div class="spinner-sm"></div>
        Uploading {{ uploadingName }}…
      </div>

      <!-- Upload form -->
      <div class="upload-form" *ngIf="selectedFile && !uploading()">
        <div class="file-preview">
          <span class="file-icon">{{ fileIcon() }}</span>
          <div>
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-size">{{ formatSize(selectedFile.size) }}</div>
          </div>
        </div>
        <div class="field">
          <label>Title</label>
          <input [(ngModel)]="uploadTitle" [placeholder]="selectedFile.name" class="text-input" />
        </div>
        <div class="field">
          <label>Type</label>
          <select [(ngModel)]="uploadType" class="select-input">
            <option value="LabResult">Lab Result</option>
            <option value="Imaging">Imaging / X-Ray</option>
            <option value="Report">Medical Report</option>
            <option value="Vaccination">Vaccination</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="upload-actions">
          <button class="btn-cancel" (click)="cancelUpload()">Cancel</button>
          <button class="btn-upload" (click)="confirmUpload()">Upload</button>
        </div>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner-lg"></div></div>

      <ng-container *ngIf="!loading() && records().length > 0">
        <!-- Filter -->
        <div class="filter-tabs">
          <button *ngFor="let f of recTypes" class="tab" [class.active]="activeFilter() === f.key" (click)="activeFilter.set(f.key)">{{ f.label }}</button>
        </div>

        <!-- List -->
        <div class="record-list">
          <div class="record-card" *ngFor="let r of filteredRecords()">
            <div class="rec-icon">{{ typeIcon(r.type) }}</div>
            <div class="rec-info">
              <div class="rec-title">{{ r.title }}</div>
              <div class="rec-meta">
                <span class="rec-type">{{ r.type }}</span>
                <span class="rec-date">{{ r.uploadedAt | date:'MMM d, y' }}</span>
                <span class="rec-size">{{ formatSize(r.fileSize) }}</span>
              </div>
            </div>
            <div class="rec-actions">
              <button class="icon-btn-sm" (click)="view(r)" title="View">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="icon-btn-sm danger" (click)="deleteRecord(r)" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding:16px; max-width:640px; margin:0 auto; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; }
    .btn-add { display:flex; align-items:center; gap:4px; background:#D84040; color:#fff; border:none; border-radius:10px; padding:8px 14px; font-size:14px; font-weight:600; cursor:pointer; }

    .upload-area { border:2px dashed #e8e8e8; border-radius:14px; padding:40px 20px; text-align:center; cursor:pointer; transition:all .2s; margin-bottom:16px; }
    .upload-area:hover { border-color:#D84040; background:#FEF2F2; }
    .upload-area p  { font-size:15px; color:#555; font-weight:500; margin:12px 0 4px; }
    .upload-area span { font-size:12px; color:#aaa; }

    .upload-progress { display:flex; align-items:center; gap:10px; background:#f8f8f8; border-radius:10px; padding:12px 16px; margin-bottom:12px; font-size:14px; color:#555; }
    .spinner-sm { width:18px; height:18px; border:2px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }

    .upload-form { background:#fff; border-radius:14px; padding:16px; margin-bottom:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .file-preview { display:flex; align-items:center; gap:10px; margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid #f5f5f5; }
    .file-icon    { font-size:28px; }
    .file-name    { font-size:14px; font-weight:600; color:#111; }
    .file-size    { font-size:12px; color:#888; }

    .field       { margin-bottom:12px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:6px; }
    .text-input  { width:100%; padding:10px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .text-input:focus { border-color:#D84040; }
    .select-input { width:100%; padding:10px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; appearance:none; background:#fff; }

    .upload-actions { display:flex; gap:8px; }
    .btn-cancel  { flex:1; padding:10px; border:1.5px solid #e8e8e8; background:#fff; border-radius:10px; font-size:14px; cursor:pointer; }
    .btn-upload  { flex:2; padding:10px; background:#D84040; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; }

    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner-lg { width:32px; height:32px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .filter-tabs { display:flex; gap:6px; margin-bottom:14px; overflow-x:auto; padding-bottom:4px; }
    .tab { padding:6px 12px; border-radius:20px; border:1.5px solid #e8e8e8; background:#fff; font-size:12px; cursor:pointer; white-space:nowrap; color:#666; }
    .tab.active { background:#D84040; color:#fff; border-color:#D84040; }

    .record-list { display:flex; flex-direction:column; gap:10px; }
    .record-card { background:#fff; border-radius:12px; padding:14px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .rec-icon    { font-size:28px; flex-shrink:0; }
    .rec-info    { flex:1; }
    .rec-title   { font-size:14px; font-weight:600; color:#111; margin-bottom:3px; }
    .rec-meta    { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .rec-type    { font-size:11px; background:#f0f0f0; color:#555; padding:2px 7px; border-radius:6px; }
    .rec-date,.rec-size { font-size:11px; color:#888; }
    .rec-actions { display:flex; gap:6px; }
    .icon-btn-sm { width:32px; height:32px; border-radius:8px; border:1.5px solid #e8e8e8; background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#555; }
    .icon-btn-sm.danger { border-color:#FBDCDC; color:#D84040; }
    .icon-btn-sm:hover  { background:#f8f8f8; }
  `],
})
export class MedicalRecordsComponent implements OnInit {
  private svc = inject(PatientService);

  loading      = signal(true);
  uploading    = signal(false);
  activeFilter = signal('All');
  records      = signal<MedicalRecord[]>([]);

  selectedFile: File | null = null;
  uploadTitle  = '';
  uploadType   = 'LabResult';
  uploadingName = '';

  recTypes = [
    { key:'All', label:'All' }, { key:'LabResult', label:'Lab Results' },
    { key:'Imaging', label:'Imaging' }, { key:'Report', label:'Reports' },
    { key:'Vaccination', label:'Vaccination' },
  ];

  ngOnInit(): void {
    this.svc.getRecords().subscribe(res => { this.records.set(res.data.items); this.loading.set(false); });
  }

  filteredRecords(): MedicalRecord[] {
    if (this.activeFilter() === 'All') return this.records();
    return this.records().filter(r => r.type === this.activeFilter());
  }

  onFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.uploadTitle  = file.name.replace(/\.[^/.]+$/, '');
  }

  cancelUpload(): void { this.selectedFile = null; this.uploadTitle = ''; }

  confirmUpload(): void {
    if (!this.selectedFile) return;
    this.uploading.set(true);
    this.uploadingName = this.selectedFile.name;
    this.svc.uploadRecord(this.selectedFile, this.uploadTitle || this.selectedFile.name, this.uploadType)
      .subscribe(res => {
        this.records.update(r => [res.data, ...r]);
        this.uploading.set(false);
        this.selectedFile = null;
        this.uploadTitle = '';
      });
  }

  deleteRecord(r: MedicalRecord): void {
    if (!confirm(`Delete "${r.title}"?`)) return;
    this.svc.deleteRecord(r.id).subscribe(() => this.records.update(list => list.filter(x => x.id !== r.id)));
  }

  view(r: MedicalRecord): void { if (r.fileUrl && r.fileUrl !== '#') window.open(r.fileUrl); }

  typeIcon(type: string): string {
    const m: Record<string,string> = { LabResult:'🧪', Imaging:'🩻', Report:'📄', Vaccination:'💉', Other:'📁' };
    return m[type] ?? '📁';
  }
  fileIcon(): string { if (!this.selectedFile) return '📁'; const ext = this.selectedFile.name.split('.').pop()?.toLowerCase(); return ext === 'pdf' ? '📄' : ['jpg','jpeg','png'].includes(ext??'') ? '🖼️' : '📁'; }
  formatSize(bytes: number): string { return bytes > 1048576 ? (bytes/1048576).toFixed(1)+' MB' : (bytes/1024).toFixed(0)+' KB'; }
}
