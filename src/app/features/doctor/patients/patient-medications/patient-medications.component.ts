import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MedicalService } from '../../../../core/services/medical.service';

@Component({
  selector: 'app-patient-medications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <div class="sec-hdr">
        <h3>Medications</h3>
        <button class="btn-add" (click)="openAdd()">+ Add Medication</button>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
      <div class="empty" *ngIf="!loading() && meds().length===0"><p>No medications assigned yet.</p></div>

      <div class="med-list" *ngIf="!loading()">
        <div class="med-row" *ngFor="let m of meds()" [class.inactive]="!isActive(m)">
          <div class="med-dot" [style.background]="m.isActive!==false ? '#2D4A8A' : '#ccc'"></div>
          <div class="med-info">
            <div class="med-name">{{ m.name ?? m.medicationName }}</div>
            <div class="med-sub">{{ m.dosage }} · {{ m.frequency }}</div>
            <div class="med-sub" *ngIf="m.duration">Duration: {{ m.duration }}</div>
            <div class="med-instr" *ngIf="m.instructions">{{ m.instructions }}</div>
          </div>
          <div class="med-actions">
            <span class="med-badge" [class.active]="isActive(m)">{{ isActive(m) ? 'Active' : 'Inactive' }}</span>
            <button class="btn-edit" (click)="openEdit(m)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-del" (click)="del(m)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit modal -->
    <div class="modal-bg" *ngIf="showModal" (click)="showModal=false"></div>
    <div class="modal" *ngIf="showModal">
      <div class="modal-hdr">
        <h3>{{ editId ? 'Edit' : 'Add' }} Medication</h3>
        <button class="mc" (click)="showModal=false">✕</button>
      </div>
      <div class="field"><label>Medication Name *</label><input [(ngModel)]="form.name" class="inp" placeholder="e.g. Metformin" /></div>
      <div class="field-row">
        <div class="field"><label>Dosage</label><input [(ngModel)]="form.dosage" class="inp" placeholder="500mg" /></div>
        <div class="field"><label>Frequency</label>
          <select [(ngModel)]="form.frequency" class="inp">
            <option value="Once daily">Once daily</option>
            <option value="Twice daily">Twice daily</option>
            <option value="Three times daily">Three times daily</option>
            <option value="Weekly">Weekly</option>
            <option value="As needed">As needed</option>
          </select>
        </div>
      </div>
      <div class="field"><label>Duration</label><input [(ngModel)]="form.duration" class="inp" placeholder="30 days" /></div>
      <div class="field"><label>Instructions</label><textarea [(ngModel)]="form.instructions" class="inp ta" rows="2" placeholder="Take with food..."></textarea></div>
      <div class="field" *ngIf="editId">
        <label class="chk-lbl">
          <input type="checkbox" [(ngModel)]="form.isActive" />
          Active
        </label>
      </div>
      <div class="err" *ngIf="err()">{{ err() }}</div>
      <div class="modal-btns">
        <button class="mbtn-no" (click)="showModal=false">Cancel</button>
        <button class="mbtn-yes" (click)="submit()" [disabled]="!form.name || saving()">
          <span class="mspin" *ngIf="saving()"></span>{{ saving() ? 'Saving...' : editId ? 'Update' : 'Add Medication' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .wrap{font-family:'Cairo','Segoe UI',sans-serif;}
    .sec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
    h3{font-size:16px;font-weight:800;color:#111;}
    .btn-add{padding:8px 14px;background:#7C3AED;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
    .loading{display:flex;justify-content:center;padding:32px;}
    .spinner{width:22px;height:22px;border:2px solid #f0f0f0;border-top-color:#7C3AED;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .empty{text-align:center;padding:32px;color:#888;font-size:13px;background:#F7F8FA;border-radius:12px;}
    .med-list{display:flex;flex-direction:column;gap:8px;}
    .med-row{display:flex;align-items:flex-start;gap:10px;background:#F7F8FA;border-radius:12px;padding:14px;}
    .med-row.inactive{opacity:.65;}
    .med-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;margin-top:4px;}
    .med-info{flex:1;}
    .med-name{font-size:14px;font-weight:700;color:#111;margin-bottom:3px;}
    .med-sub{font-size:12px;color:#666;}
    .med-instr{font-size:12px;color:#555;background:#fff;border-radius:7px;padding:5px 8px;margin-top:4px;font-style:italic;}
    .med-actions{display:flex;align-items:center;gap:6px;flex-shrink:0;}
    .med-badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:12px;background:#f0f0f0;color:#888;}
    .med-badge.active{background:#E1F5EE;color:#0F6E56;}
    .btn-edit{width:28px;height:28px;background:#EEF2FF;border:none;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#2D4A8A;cursor:pointer;}
    .btn-del{width:28px;height:28px;background:#FEF2F2;border:none;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#D84040;cursor:pointer;}
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;}
    .modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:20px;padding:22px;width:90%;max-width:460px;z-index:101;box-shadow:0 16px 48px rgba(0,0,0,.2);}
    .modal-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
    .modal-hdr h3{font-size:16px;font-weight:800;color:#111;}.mc{background:none;border:none;font-size:16px;cursor:pointer;color:#888;}
    .field{margin-bottom:10px;}.field label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px;}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .inp{width:100%;padding:9px 12px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;font-family:inherit;outline:none;}
    .inp:focus{border-color:#7C3AED;}.ta{resize:none;}
    .chk-lbl{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:#111;cursor:pointer;}
    .err{background:#FEF2F2;color:#D84040;border-radius:8px;padding:9px;font-size:13px;margin-bottom:10px;}
    .modal-btns{display:flex;gap:8px;margin-top:14px;}
    .mbtn-no{flex:1;padding:11px;border:1.5px solid #e8e8e8;background:#fff;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;color:#555;}
    .mbtn-yes{flex:2;padding:11px;background:#7C3AED;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;}
    .mbtn-yes:disabled{opacity:.5;cursor:not-allowed;}
    .mspin{width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
  `]
})
export class PatientMedicationsComponent implements OnInit {
  private svc   = inject(MedicalService);
  private route = inject(ActivatedRoute);

  loading   = signal(true);
  saving    = signal(false);
  err       = signal('');
  meds      = signal<any[]>([]);
  showModal = false;
  editId    = '';
  form: any = { name:'', dosage:'', frequency:'Once daily', duration:'', instructions:'', isActive:true };
  private patientId = '';

  ngOnInit(): void {
    this.patientId = this.route.parent?.snapshot.paramMap.get('patientId') ?? '';
    this.load();
  }

  load(): void {
    this.svc.getPatientMedications(this.patientId).subscribe({
      next: (res: any) => {
        this.meds.set(Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAdd(): void {
    this.editId = '';
    this.form = { name:'', dosage:'', frequency:'Once daily', duration:'', instructions:'', isActive:true };
    this.showModal = true; this.err.set('');
  }

  openEdit(m: any): void {
    this.editId = m.id;
    this.form = { name: m.name??m.medicationName??'', dosage: m.dosage??'', frequency: m.frequency??'Once daily', duration: m.duration??'', instructions: m.instructions??'', isActive: m.isActive !== false };
    this.showModal = true; this.err.set('');
  }

  submit(): void {
    this.saving.set(true); this.err.set('');
    const body: any = { ...this.form, patientId: this.patientId };
    const req = this.editId
      ? this.svc.updateMedication(this.editId, body)
      : this.svc.addMedication(body);
    req.subscribe({
      next: () => { this.saving.set(false); this.showModal=false; this.load(); },
      error: (e: any) => { this.saving.set(false); this.err.set(e?.error?.message ?? 'Failed.'); }
    });
  }

  del(m: any): void {
    if (!confirm('Delete this medication?')) return;
    this.svc.deleteMedication(m.id).subscribe({ next: () => this.meds.update(l => l.filter(x => x.id !== m.id)) });
  }

  isActive(m: any): boolean { return m.isActive !== false; }
}
