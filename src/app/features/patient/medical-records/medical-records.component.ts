import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { HttpClient }   from '@angular/common/http';
import { environment }  from '../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))              return r;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.data))        return r.data;
  if (Array.isArray(r?.items))       return r.items;
  return [];
}

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="pg-hdr">
    <div>
      <h1>Medical Records</h1>
      <p class="sub" *ngIf="!loading()">{{ records().length }} record{{ records().length!==1?'s':'' }}</p>
    </div>
    <button class="btn-add" (click)="openForm()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Add Record
    </button>
  </div>

  <!-- Add form -->
  <div class="form-card" *ngIf="showForm()">
    <div class="fc-hdr">
      <h3>New Medical Record</h3>
      <button class="close-btn" (click)="showForm.set(false)">✕</button>
    </div>

    <!-- File drop zone -->
    <div class="drop-zone" (click)="fi.click()"
         [class.has-file]="selectedFile"
         (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
      <input #fi type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" (change)="onFile($event)" />
      <ng-container *ngIf="!selectedFile">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p>Click or drag file here</p>
        <span>PDF, JPG, PNG, DOC — optional</span>
      </ng-container>
      <div class="file-chosen" *ngIf="selectedFile">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <div>
          <div class="fc-name">{{ selectedFile.name }}</div>
          <div class="fc-size">{{ fmtSize(selectedFile.size) }}</div>
        </div>
        <button class="rm-file" (click)="$event.stopPropagation(); selectedFile=null">✕</button>
      </div>
    </div>

    <div class="f2">
      <div class="f">
        <label>Record Type *</label>
        <select [(ngModel)]="form.recordType" class="inp">
          <option value="Medical History">Medical History</option>
          <option value="LabResult">Lab Result</option>
          <option value="Imaging">Imaging / X-Ray</option>
          <option value="Report">Medical Report</option>
          <option value="Vaccination">Vaccination</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="f">
        <label>Date *</label>
        <input [(ngModel)]="form.recordDate" type="date" class="inp" />
      </div>
    </div>
    <div class="f">
      <label>Title *</label>
      <input [(ngModel)]="form.title" class="inp" placeholder="e.g. Blood Test Results May 2026" />
    </div>
    <div class="f">
      <label>Description</label>
      <textarea [(ngModel)]="form.description" class="inp ta" rows="2" placeholder="Notes or details…"></textarea>
    </div>

    <div class="upload-prog" *ngIf="uploading()">
      <div class="sp-sm"></div>
      Uploading file…
    </div>
    <div class="err-box" *ngIf="formErr()">{{ formErr() }}</div>

    <div class="form-btns">
      <button class="btn-cancel" (click)="showForm.set(false)">Cancel</button>
      <button class="btn-save" (click)="submit()" [disabled]="submitting() || uploading()">
        <span class="ring" *ngIf="submitting()"></span>
        {{ submitting() ? 'Saving…' : 'Save Record' }}
      </button>
    </div>
  </div>

  <!-- Skeleton -->
  <div class="skel-list" *ngIf="loading()">
    <div class="skel-row" *ngFor="let i of [1,2,3]">
      <div class="sk-ico"></div>
      <div class="sk-lines"><div class="sk-l w60"></div><div class="sk-l w40"></div></div>
    </div>
  </div>

  <!-- Filter tabs -->
  <div class="ftabs" *ngIf="!loading() && records().length>0">
    <button *ngFor="let t of TYPES" class="ftab" [class.active]="filter()===t.k" (click)="filter.set(t.k)">
      {{ t.l }}<span class="fcnt" *ngIf="t.k!=='All' && cnt(t.k)>0">{{ cnt(t.k) }}</span>
    </button>
  </div>

  <!-- Empty -->
  <div class="empty" *ngIf="!loading() && filtered().length===0 && !showForm()">
    <div class="e-ico">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
    <p>No records yet</p>
    <button class="btn-empty" (click)="openForm()">+ Add your first record</button>
  </div>

  <!-- Records list -->
  <div class="rec-list" *ngIf="!loading()">
    <div class="rec-card" *ngFor="let r of filtered()">
      <!-- Icon based on type (no innerHTML - no sanitizer issue) -->
      <div class="rec-ico" [style.background]="tcol(getType(r)).bg">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             [attr.stroke]="tcol(getType(r)).c" stroke-width="2">
          <ng-container [ngSwitch]="getType(r)">
            <ng-container *ngSwitchCase="'LabResult'">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11l-4 7h14l-4-7V3"/>
            </ng-container>
            <ng-container *ngSwitchCase="'Imaging'">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </ng-container>
            <ng-container *ngSwitchCase="'Vaccination'">
              <path d="m18 2 4 4-14 14H4v-4Z"/>
              <path d="m14.5 5.5 4 4"/>
            </ng-container>
            <ng-container *ngSwitchCase="'Medical History'">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </ng-container>
            <ng-container *ngSwitchDefault>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
            </ng-container>
          </ng-container>
        </svg>
      </div>
      <div class="rec-info">
        <div class="rec-title">{{ r.title }}</div>
        <div class="rec-meta">
          <span class="type-badge">{{ getType(r) }}</span>
          <span class="rec-date">{{ (r.recordDate || r.createdAt || r.uploadedAt || r.date || r.sentAt) | date:'MMM d, y' }}</span>
        </div>
        <div class="rec-desc" *ngIf="r.description">{{ r.description }}</div>
      </div>
      <div class="rec-acts">
        <button class="act-btn view" *ngIf="r.fileUrl" (click)="openFile(r)" title="View">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="act-btn del" (click)="del(r)" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;max-width:760px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .pg-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;gap:12px;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#6B7280;margin-top:2px;}
    .btn-add{display:flex;align-items:center;gap:6px;padding:10px 16px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;}
    .form-card{background:#fff;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.08);border:1px solid #F0F2F5;}
    .fc-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
    .fc-hdr h3{font-size:16px;font-weight:700;color:#111;}
    .close-btn{background:none;border:none;font-size:18px;color:#9CA3AF;cursor:pointer;padding:4px;}
    .drop-zone{border:2px dashed #E8ECF0;border-radius:12px;padding:20px;text-align:center;cursor:pointer;margin-bottom:14px;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:6px;}
    .drop-zone:hover,.drop-zone.has-file{border-color:#D84040;background:#FEF8F8;}
    .drop-zone p{font-size:14px;color:#555;font-weight:600;}
    .drop-zone span{font-size:12px;color:#9CA3AF;}
    .file-chosen{display:flex;align-items:center;gap:10px;width:100%;}
    .fc-name{font-size:13px;font-weight:600;color:#111;text-align:left;}
    .fc-size{font-size:11px;color:#9CA3AF;}
    .rm-file{margin-left:auto;background:none;border:none;color:#9CA3AF;cursor:pointer;font-size:16px;padding:4px;}
    .f2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    @media(max-width:480px){.f2{grid-template-columns:1fr;}}
    .f{margin-bottom:12px;}
    .f label{display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:5px;}
    .inp{width:100%;padding:10px 13px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;color:#111;background:#fff;}
    .inp:focus{border-color:#D84040;box-shadow:0 0 0 3px rgba(216,64,64,.07);}
    .ta{resize:vertical;min-height:70px;}
    .upload-prog{display:flex;align-items:center;gap:8px;font-size:13px;color:#6B7280;margin-bottom:8px;}
    .sp-sm{width:16px;height:16px;border:2px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:sp .7s linear infinite;flex-shrink:0;}
    .err-box{background:#FEF2F2;color:#D84040;border-radius:10px;padding:10px 12px;margin-top:4px;font-size:13px;border:1px solid #fecaca;}
    .form-btns{display:flex;gap:10px;margin-top:14px;}
    .btn-cancel{flex:1;padding:11px;border:1.5px solid #E8ECF0;background:#fff;border-radius:11px;font-size:14px;font-weight:600;cursor:pointer;color:#555;font-family:inherit;}
    .btn-save{flex:2;padding:11px;background:#D84040;color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;}
    .btn-save:disabled{opacity:.5;cursor:not-allowed;}
    .ring{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    @keyframes pk{0%,100%{opacity:1;}50%{opacity:.45;}}
    .skel-list{display:flex;flex-direction:column;gap:10px;}
    .skel-row{display:flex;align-items:center;gap:12px;background:#fff;border-radius:14px;padding:14px;border:1px solid #F0F2F5;}
    .sk-ico{width:40px;height:40px;border-radius:10px;background:#F0F2F5;flex-shrink:0;animation:pk 1.4s infinite;}
    .sk-lines{flex:1;display:flex;flex-direction:column;gap:8px;}
    .sk-l{height:11px;border-radius:6px;background:#F0F2F5;animation:pk 1.4s infinite;}
    .sk-l.w60{width:60%;}.sk-l.w40{width:40%;}
    .ftabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
    .ftab{padding:6px 12px;border:1.5px solid #E8ECF0;border-radius:20px;background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit;display:flex;align-items:center;gap:5px;}
    .ftab.active{background:#D84040;color:#fff;border-color:#D84040;}
    .fcnt{background:rgba(0,0,0,.12);font-size:10px;padding:1px 5px;border-radius:10px;}
    .empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px;background:#fff;border-radius:16px;text-align:center;border:1px solid #F0F2F5;}
    .e-ico{width:60px;height:60px;background:#F4F6FA;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty p{font-size:14px;color:#9CA3AF;}
    .btn-empty{padding:10px 20px;background:#D84040;color:#fff;border:none;border-radius:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px;}
    .rec-list{display:flex;flex-direction:column;gap:10px;}
    .rec-card{background:#fff;border-radius:14px;padding:12px 14px;box-shadow:0 1px 6px rgba(0,0,0,.05);border:1px solid #F0F2F5;display:flex;align-items:flex-start;gap:10px;}
    .rec-ico{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .rec-info{flex:1;min-width:0;}
    .rec-title{font-size:14px;font-weight:700;color:#111;margin-bottom:4px;}
    .rec-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
    .type-badge{font-size:11px;font-weight:600;background:#F4F6FA;color:#6B7280;padding:2px 8px;border-radius:20px;}
    .rec-date{font-size:12px;color:#9CA3AF;}
    .rec-desc{font-size:12px;color:#6B7280;margin-top:5px;line-height:1.4;}
    .rec-acts{display:flex;gap:6px;flex-shrink:0;}
    .act-btn{width:30px;height:30px;border-radius:8px;border:1.5px solid #E8ECF0;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6B7280;}
    .act-btn.view:hover{background:#EEF2FF;color:#2D4A8A;border-color:#2D4A8A;}
    .act-btn.del:hover{background:#FEF2F2;color:#D84040;border-color:#fecaca;}
  `]
})
export class MedicalRecordsComponent implements OnInit {
  private http = inject(HttpClient);

  loading    = signal(true);
  submitting = signal(false);
  uploading  = signal(false);
  showForm   = signal(false);
  filter     = signal('All');
  formErr    = signal('');
  records    = signal<any[]>([]);

  readonly TYPES = [
    { k:'All',             l:'All' },
    { k:'Medical History', l:'Medical History' },
    { k:'LabResult',       l:'Lab Results' },
    { k:'Imaging',         l:'Imaging' },
    { k:'Report',          l:'Reports' },
    { k:'Vaccination',     l:'Vaccination' },
    { k:'Other',           l:'Other' },
  ];

  selectedFile: File | null = null;
  form = { recordType:'Medical History', title:'', description:'', recordDate: this.today() };

  filtered(): any[] {
    if (this.filter()==='All') return this.records();
    return this.records().filter(r => this.getType(r)===this.filter());
  }
  cnt(k: string): number { return this.records().filter(r=>this.getType(r)===k).length; }

  getType(r: any): string {
    return r.recordType ?? r.type ?? r.record_type ?? 'Other';
  }

  tcol(t: string): {bg:string;c:string} {
    const m: Record<string,{bg:string;c:string}> = {
      'LabResult':       {bg:'#EFF6FF',c:'#185FA5'},
      'Imaging':         {bg:'#F5F3FF',c:'#6B5BAD'},
      'Report':          {bg:'#ECFDF5',c:'#0F6E56'},
      'Medical History': {bg:'#FEF2F2',c:'#D84040'},
      'Vaccination':     {bg:'#FFFBEB',c:'#d4a017'},
    };
    return m[t] ?? {bg:'#F4F6FA',c:'#6B7280'};
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }

  ngOnInit(): void { this.load(); }

  private load(): void {
    // Patient reads own records: GET /api/MedicalRecord/my
    this.http.get<any>(`${environment.apiUrl}/MedicalRecord/my`, {
      params: { pageNumber:'1', pageSize:'100' }
    }).subscribe({
      next: (res:any) => { this.records.set(toArr(res)); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openForm(): void {
    this.form = { recordType:'Medical History', title:'', description:'', recordDate: this.today() };
    this.selectedFile = null;
    this.formErr.set('');
    this.showForm.set(true);
  }

  onFile(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) { this.selectedFile = f; if (!this.form.title) this.form.title = f.name.replace(/\.[^/.]+$/, ''); }
  }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) { this.selectedFile = f; if (!this.form.title) this.form.title = f.name.replace(/\.[^/.]+$/, ''); }
  }

  submit(): void {
    if (!this.form.title.trim()) { this.formErr.set('Title is required'); return; }
    if (!this.form.recordDate)   { this.formErr.set('Date is required');  return; }
    this.formErr.set('');

    if (this.selectedFile) {
      // Upload file → Cloudinary via profile-picture endpoint
      this.uploading.set(true);
      const fd = new FormData();
      fd.append('file', this.selectedFile);
      this.http.put<any>(`${environment.apiUrl}/Profile/profile-picture`, fd).subscribe({
        next: (res:any) => {
          const url = res?.profilePictureUrl ?? res?.data?.profilePictureUrl ?? '';
          this.uploading.set(false);
          this.save(url);
        },
        error: () => { this.uploading.set(false); this.save(''); }
      });
    } else {
      this.save('');
    }
  }

  private save(fileUrl: string): void {
    this.submitting.set(true);
    // Patient adds own record: POST /api/MedicalRecord/my-history
    const body = {
      recordType:  this.form.recordType,
      title:       this.form.title.trim(),
      description: this.form.description.trim() || undefined,
      fileUrl:     fileUrl || undefined,
      recordDate:  new Date(this.form.recordDate).toISOString(),
    };
    this.http.post<any>(`${environment.apiUrl}/MedicalRecord/my-history`, body).subscribe({
      next: (res:any) => {
        const rec = res?.data ?? res ?? body;
        this.records.update(l => [{ ...body, ...rec }, ...l]);
        this.submitting.set(false);
        this.showForm.set(false);
      },
      error: (e:any) => {
        this.submitting.set(false);
        this.formErr.set(e?.error?.message ?? e?.error?.title ?? `Error ${e?.status}`);
        console.error('[MedRec] save error:', e?.status, e?.error);
      }
    });
  }

  del(r: any): void {
    if (!confirm(`Delete "${r.title}"?`)) return;
    this.http.delete(`${environment.apiUrl}/MedicalRecord/delete/${r.id}`)
      .subscribe({ next: () => this.records.update(l=>l.filter(x=>x.id!==r.id)), error:()=>{} });
  }

  openFile(r: any): void { if (r.fileUrl) window.open(r.fileUrl, '_blank'); }
  fmtSize(b: number): string { return b>1048576?(b/1048576).toFixed(1)+' MB':Math.round(b/1024)+' KB'; }
}
