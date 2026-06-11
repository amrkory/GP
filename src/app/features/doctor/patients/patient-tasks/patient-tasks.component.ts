import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MedicalService } from '../../../../core/services/medical.service';

@Component({
  selector: 'app-patient-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <div class="sec-hdr">
        <h3>Medical Tasks</h3>
        <button class="btn-add" (click)="showAdd=true">+ Assign Task</button>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <div class="empty" *ngIf="!loading() && tasks().length===0">
        <p>No tasks assigned yet. Click "Assign Task" to create one.</p>
      </div>

      <div class="task-list" *ngIf="!loading()">
        <div class="task-row" *ngFor="let t of tasks()" [class.done]="isDone(t)">
          <div class="task-left">
            <div class="task-check" [class.checked]="isDone(t)">
              <svg *ngIf="isDone(t)" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="task-info">
              <div class="task-title" [class.done-text]="isDone(t)">{{ t.taskTitle || t.title }}</div>
              <div class="task-desc" *ngIf="t.taskDescription || t.description">{{ t.taskDescription || t.description }}</div>
              <div class="task-meta">
                <span class="tdue" *ngIf="t.dueDate" [class.overdue]="isOverdue(t) && !isDone(t)">
                  Due {{ t.dueDate | date:'MMM d, y' }}
                </span>
                <span class="tstatus" [class.done-s]="isDone(t)">{{ isDone(t) ? '✓ Completed' : 'Pending' }}</span>
              </div>
            </div>
          </div>
          <button class="btn-del" (click)="del(t)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Add task modal -->
    <div class="modal-bg" *ngIf="showAdd" (click)="showAdd=false"></div>
    <div class="modal" *ngIf="showAdd">
      <div class="modal-hdr"><h3>Assign Task to Patient</h3><button class="mc" (click)="showAdd=false">✕</button></div>
      <div class="field"><label>Task Title *</label><input [(ngModel)]="form.taskTitle" class="inp" placeholder="e.g. Take blood pressure reading" /></div>
      <div class="field"><label>Description</label><textarea [(ngModel)]="form.taskDescription" class="inp ta" rows="2" placeholder="Instructions for the patient..."></textarea></div>
      <div class="field-row">
        <div class="field"><label>Due Date *</label><input type="date" [(ngModel)]="form.dueDate" class="inp" [min]="today()" /></div>
        <div class="field"><label>Priority</label>
          <select [(ngModel)]="form.priority" class="inp">
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>
      <div class="field"><label>Category</label>
        <select [(ngModel)]="form.category" class="inp">
          <option value="Test">Test</option>
          <option value="Appointment">Appointment</option>
          <option value="Medication">Medication</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="err" *ngIf="err()">{{ err() }}</div>
      <div class="modal-btns">
        <button class="mbtn-no" (click)="showAdd=false">Cancel</button>
        <button class="mbtn-yes" (click)="submit()" [disabled]="!form.taskTitle || !form.dueDate || adding()">
          <span class="mspin" *ngIf="adding()"></span>{{ adding() ? 'Assigning...' : 'Assign Task' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .wrap{font-family:'Cairo','Segoe UI',sans-serif;}
    .sec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
    h3{font-size:16px;font-weight:800;color:#111;}
    .btn-add{padding:8px 14px;background:#0F6E56;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
    .loading{display:flex;justify-content:center;padding:32px;}
    .spinner{width:22px;height:22px;border:2px solid #f0f0f0;border-top-color:#0F6E56;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .empty{text-align:center;padding:32px;color:#888;font-size:13px;background:#F7F8FA;border-radius:12px;}
    .task-list{display:flex;flex-direction:column;gap:8px;}
    .task-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;background:#F7F8FA;border-radius:12px;padding:14px;border-left:4px solid #0F6E56;transition:opacity .2s;}
    .task-row.done{border-left-color:#22c55e;opacity:.7;}
    .task-left{display:flex;align-items:flex-start;gap:10px;flex:1;}
    .task-check{width:20px;height:20px;border-radius:50%;border:2px solid #0F6E56;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}
    .task-check.checked{background:#22c55e;border-color:#22c55e;}
    .task-info{flex:1;}
    .task-title{font-size:14px;font-weight:700;color:#111;margin-bottom:3px;}
    .task-title.done-text{text-decoration:line-through;color:#aaa;}
    .task-desc{font-size:12px;color:#666;margin-bottom:5px;line-height:1.5;}
    .task-meta{display:flex;align-items:center;gap:10px;}
    .tdue{font-size:12px;color:#666;}.tdue.overdue{color:#D84040;font-weight:700;}
    .tstatus{font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;background:#FEF9E7;color:#d4a017;}
    .tstatus.done-s{background:#E1F5EE;color:#0F6E56;}
    .btn-del{width:30px;height:30px;background:#FEF2F2;border:none;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#D84040;cursor:pointer;flex-shrink:0;}
    .btn-del:hover{background:#FBDCDC;}
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;}
    .modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:20px;padding:22px;width:90%;max-width:440px;z-index:101;box-shadow:0 16px 48px rgba(0,0,0,.2);}
    .modal-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
    .modal-hdr h3{font-size:16px;font-weight:800;color:#111;}.mc{background:none;border:none;font-size:16px;cursor:pointer;color:#888;}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .field{margin-bottom:10px;}.field label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px;}
    .inp{width:100%;padding:9px 12px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;font-family:inherit;outline:none;}
    .inp:focus{border-color:#0F6E56;}.ta{resize:none;}
    .err{background:#FEF2F2;color:#D84040;border-radius:8px;padding:9px;font-size:13px;margin-bottom:10px;}
    .modal-btns{display:flex;gap:8px;margin-top:14px;}
    .mbtn-no{flex:1;padding:11px;border:1.5px solid #e8e8e8;background:#fff;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;color:#555;}
    .mbtn-yes{flex:2;padding:11px;background:#0F6E56;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;}
    .mbtn-yes:disabled{opacity:.5;cursor:not-allowed;}
    .mspin{width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
  `]
})
export class PatientTasksComponent implements OnInit {
  private svc   = inject(MedicalService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  adding  = signal(false);
  err     = signal('');
  tasks   = signal<any[]>([]);
  showAdd = false;
  form: any = { taskTitle:'', taskDescription:'', dueDate:'', priority:'Medium', category:'Other' };
  private patientId = '';

  ngOnInit(): void {
    this.patientId = this.route.parent?.snapshot.paramMap.get('patientId') ?? '';
    this.load();
  }

  load(): void {
    this.svc.getPatientTasks(this.patientId).subscribe({
      next: (res: any) => {
        this.tasks.set(Array.isArray(res) ? res : res?.data?.items ?? res?.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  submit(): void {
    if (!this.form.taskTitle?.trim()) { this.err.set('Task title is required.'); return; }
    if (!this.form.dueDate)           { this.err.set('Due date is required.'); return; }
    this.adding.set(true); this.err.set('');

    const body = {
      patientId:       this.patientId,
      taskTitle:       this.form.taskTitle.trim(),
      taskDescription: this.form.taskDescription?.trim() || '',
      dueDate:         new Date(this.form.dueDate + 'T00:00:00').toISOString(),
      priority:        this.form.priority  || 'Medium',
      category:        this.form.category  || 'Other',
    };

    console.log('[PatientTasks] POST /api/MedicalTask/add', body);

    this.svc.addTask(body).subscribe({
      next: () => {
        this.adding.set(false);
        this.showAdd = false;
        this.form = { taskTitle:'', taskDescription:'', dueDate:'', priority:'Medium', category:'Other' };
        this.load();
      },
      error: (e: any) => {
        this.adding.set(false);
        const errs = e?.error?.errors;
        const msg = errs
          ? Object.entries(errs).map(([f,m]) => `${f}: ${(m as string[]).join(', ')}`).join(' | ')
          : e?.error?.message ?? e?.error?.title ?? `HTTP ${e.status}`;
        this.err.set(msg);
      }
    });
  }

  del(t: any): void {
    if (!confirm('Delete this task?')) return;
    this.svc.deleteTask(t.id).subscribe({ next: () => this.tasks.update(l => l.filter(x => x.id !== t.id)) });
  }

  isDone(t: any): boolean { return t.isCompleted===true || t.status==='Completed'; }
  isOverdue(t: any): boolean { return t.dueDate && new Date(t.dueDate).getTime() < Date.now(); }
  today(): string { return new Date().toISOString().split('T')[0]; }
}
