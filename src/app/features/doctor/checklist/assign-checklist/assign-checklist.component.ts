import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService, AssignChecklistDto } from '../../../../core/services/doctor.service';

interface TaskLine { title: string; description: string; frequency: 'Once'|'Daily'|'Weekly'; dueDate: string; }

@Component({
  selector: 'app-assign-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Assign Checklist</h1>
        <span></span>
      </div>
      <div class="form-card">
        <div class="field">
          <label>Checklist Title *</label>
          <input [(ngModel)]="title" placeholder="e.g. Diabetes Management Plan" class="text-input" />
        </div>
      </div>
      <div class="tasks-header">
        <h3>Tasks</h3>
        <button class="btn-add-task" (click)="addTask()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Task
        </button>
      </div>
      <div class="task-card" *ngFor="let t of tasks; let i = index">
        <div class="task-card-header">
          <span class="task-num">Task {{ i+1 }}</span>
          <button class="remove-btn" (click)="removeTask(i)" *ngIf="tasks.length > 1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="field"><label>Task Title *</label><input [(ngModel)]="t.title" placeholder="e.g. Check blood sugar before breakfast" class="text-input" /></div>
        <div class="field"><label>Description</label><input [(ngModel)]="t.description" placeholder="Optional details..." class="text-input" /></div>
        <div class="row-2">
          <div class="field">
            <label>Frequency *</label>
            <select [(ngModel)]="t.frequency" class="select-input">
              <option value="Once">Once</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
          <div class="field">
            <label>Due Date</label>
            <input [(ngModel)]="t.dueDate" type="date" class="text-input" [min]="today()" />
          </div>
        </div>
      </div>
      <div class="alert-success" *ngIf="saved()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Checklist assigned successfully!
      </div>
      <div class="alert-error" *ngIf="err()">{{ err() }}</div>
      <button class="btn-primary" (click)="save()" [disabled]="saving() || saved()">
        <span class="mini-spinner" *ngIf="saving()"></span>
        {{ saving() ? 'Assigning...' : saved() ? 'Assigned!' : 'Assign Checklist' }}
      </button>
    </div>
  `,
  styles: [`
    .page { padding:16px; max-width:640px; margin:0 auto; }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .top-bar h1 { font-size:18px; font-weight:700; color:#111; }
    .back-btn { background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; }
    .form-card { background:#fff; border-radius:14px; padding:18px; margin-bottom:14px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .field { margin-bottom:12px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:5px; }
    .text-input  { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .text-input:focus { border-color:#2D4A8A; }
    .select-input { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; appearance:none; background:#fff; box-sizing:border-box; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .tasks-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .tasks-header h3 { font-size:16px; font-weight:700; color:#111; }
    .btn-add-task { display:flex; align-items:center; gap:4px; background:#E1F5EE; color:#0F6E56; border:none; border-radius:8px; padding:7px 12px; font-size:13px; font-weight:600; cursor:pointer; }
    .task-card { background:#fff; border-radius:12px; padding:14px; margin-bottom:10px; box-shadow:0 1px 8px rgba(0,0,0,0.05); border-left:3px solid #0F6E56; }
    .task-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .task-num { font-size:13px; font-weight:600; color:#0F6E56; }
    .remove-btn { background:none; border:none; cursor:pointer; color:#D84040; padding:0; display:flex; }
    .alert-success { display:flex; align-items:center; gap:8px; background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:14px; font-weight:600; }
    .alert-error { background:#FEF2F2; color:#D84040; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:13px; }
    .btn-primary { width:100%; padding:14px; background:#2D4A8A; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; }
    .btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class AssignChecklistComponent implements OnInit {
  private svc   = inject(DoctorService);
  goBack(): void { window.history.back(); }
  private route = inject(ActivatedRoute);
  private nav   = inject(Router);
  saving = signal(false); saved = signal(false); err = signal('');
  title = ''; patientId = '';
  tasks: TaskLine[] = [{ title:'', description:'', frequency:'Daily', dueDate:'' }];
  ngOnInit(): void { this.patientId = this.route.snapshot.paramMap.get('patientId')!; }
  addTask(): void { this.tasks.push({ title:'', description:'', frequency:'Daily', dueDate:'' }); }
  removeTask(i: number): void { this.tasks.splice(i, 1); }
  today(): string { return new Date().toISOString().split('T')[0]; }
  save(): void {
    if (!this.title || this.tasks.some(t => !t.title)) { this.err.set('Please fill all required fields.'); return; }
    this.saving.set(true); this.err.set('');
    const dto: AssignChecklistDto = {
      patientId: this.patientId, title: this.title,
      tasks: this.tasks.map(t => ({ title: t.title, description: t.description || undefined, frequency: t.frequency, dueDate: t.dueDate || undefined })),
    };
    this.svc.assignChecklist(dto).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        if (res?.success === false) console.warn('[AssignChecklist]', res.message, 'DTO:', dto);
        this.saved.set(true);
        setTimeout(() => this.nav.navigate(['/doctor/patients', this.patientId, 'checklist']), 1500);
      },
      error: () => { this.saving.set(false); this.err.set('Failed. Please try again.'); },
    });
  }
}
