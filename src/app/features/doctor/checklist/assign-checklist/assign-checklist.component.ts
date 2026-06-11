import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

/**
 * POST /api/MedicalTask/add
 * Required: patientId, taskTitle, taskDescription, dueDate (ISO), priority, category
 * priority: "High" | "Medium" | "Low"
 * category: "Test" | "Appointment" | "Medication" | "Other"
 */
interface TaskLine {
  taskTitle:       string;
  taskDescription: string;
  dueDate:         string;
  priority:        'High' | 'Medium' | 'Low';
  category:        'Test' | 'Appointment' | 'Medication' | 'Other';
}

@Component({
  selector: 'app-assign-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="top-bar">
    <button class="back-btn" (click)="goBack()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <h1>Assign Task to Patient</h1>
    <span></span>
  </div>

  <div class="task-card" *ngFor="let t of tasks; let i = index">
    <div class="task-card-header">
      <span class="task-num">Task {{ i + 1 }}</span>
      <button class="remove-btn" (click)="removeTask(i)" *ngIf="tasks.length > 1">✕</button>
    </div>

    <div class="field">
      <label>Task Title *</label>
      <input [(ngModel)]="t.taskTitle" class="inp"
             placeholder="e.g. Check blood sugar before breakfast" />
    </div>

    <div class="field">
      <label>Description</label>
      <textarea [(ngModel)]="t.taskDescription" class="inp ta" rows="2"
                placeholder="Optional details..."></textarea>
    </div>

    <div class="row-3">
      <div class="field">
        <label>Due Date *</label>
        <input [(ngModel)]="t.dueDate" type="date" class="inp" [min]="today()" />
      </div>
      <div class="field">
        <label>Priority *</label>
        <select [(ngModel)]="t.priority" class="inp">
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
      <div class="field">
        <label>Category *</label>
        <select [(ngModel)]="t.category" class="inp">
          <option value="Test">Test</option>
          <option value="Appointment">Appointment</option>
          <option value="Medication">Medication</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>

    <div class="t-saved"  *ngIf="savedIdx.has(i)">✓ Saved</div>
    <div class="t-saving" *ngIf="savingIdx.has(i)"><span class="spin-sm"></span> Saving…</div>
    <div class="t-err"    *ngIf="errIdx.has(i)">✗ {{ errIdx.get(i) }}</div>
  </div>

  <button class="btn-add" (click)="addTask()">+ Add Another Task</button>

  <div class="alert-success" *ngIf="allSaved()">✓ All tasks assigned successfully!</div>
  <div class="alert-error"   *ngIf="globalErr()">{{ globalErr() }}</div>

  <button class="btn-primary" (click)="save()" [disabled]="saving() || allSaved()">
    <span class="mspin" *ngIf="saving()"></span>
    {{ saving() ? 'Saving…' : allSaved() ? '✓ Done!' : 'Assign Task(s)' }}
  </button>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:20px;width:100%;font-family:'Cairo','Segoe UI',sans-serif;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
    .top-bar h1{font-size:18px;font-weight:800;color:#111;}
    .back-btn{background:none;border:none;cursor:pointer;color:#555;padding:4px;display:flex;}
    .task-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 1px 8px rgba(0,0,0,.06);border:1px solid #F0F2F5;border-left:3px solid #2D4A8A;}
    .task-card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
    .task-num{font-size:13px;font-weight:700;color:#2D4A8A;}
    .remove-btn{background:none;border:none;cursor:pointer;color:#D84040;font-size:14px;font-weight:700;}
    .field{margin-bottom:12px;}
    .field label{display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:5px;text-transform:uppercase;letter-spacing:.3px;}
    .row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
    @media(max-width:600px){.row-3{grid-template-columns:1fr;}}
    .inp{width:100%;padding:10px 12px;border:1.5px solid #E8ECF0;border-radius:10px;font-size:14px;font-family:inherit;outline:none;appearance:none;background:#fff;}
    .inp:focus{border-color:#2D4A8A;box-shadow:0 0 0 3px rgba(45,74,138,.07);}
    .ta{resize:vertical;min-height:60px;}
    .t-saved{font-size:12px;font-weight:700;color:#0F6E56;background:#ECFDF5;padding:4px 10px;border-radius:8px;display:inline-block;margin-top:4px;}
    .t-saving{font-size:12px;color:#888;display:flex;align-items:center;gap:6px;margin-top:4px;}
    .spin-sm{width:11px;height:11px;border:2px solid #e0e0e0;border-top-color:#2D4A8A;border-radius:50%;animation:spin .6s linear infinite;display:inline-block;}
    .t-err{font-size:12px;color:#D84040;background:#FEF2F2;padding:4px 10px;border-radius:8px;display:inline-block;margin-top:4px;word-break:break-all;}
    .btn-add{display:inline-flex;align-items:center;gap:6px;background:#EEF2FF;color:#2D4A8A;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:14px;}
    .btn-add:hover{background:#E0E7FF;}
    .alert-success{background:#ECFDF5;color:#0F6E56;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:14px;font-weight:600;}
    .alert-error{background:#FEF2F2;color:#D84040;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:13px;word-break:break-all;}
    .btn-primary{width:100%;padding:14px;background:#2D4A8A;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;}
    .btn-primary:disabled{opacity:.55;cursor:not-allowed;}
    .mspin{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
  `]
})
export class AssignChecklistComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private nav   = inject(Router);

  saving    = signal(false);
  globalErr = signal('');

  patientId = '';
  tasks: TaskLine[] = [this.empty()];

  savedIdx  = new Set<number>();
  savingIdx = new Set<number>();
  errIdx    = new Map<number, string>();

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('patientId') ?? '';
  }

  addTask():             void { this.tasks.push(this.empty()); }
  removeTask(i: number): void { this.tasks.splice(i, 1); }
  goBack():              void { window.history.back(); }
  allSaved():         boolean { return this.savedIdx.size === this.tasks.length && this.tasks.length > 0; }
  today():             string { return new Date().toISOString().split('T')[0]; }

  save(): void {
    const bad = this.tasks.find((t, i) =>
      !this.savedIdx.has(i) && (!t.taskTitle.trim() || !t.dueDate)
    );
    if (bad)               { this.globalErr.set('Fill Task Title and Due Date for all tasks.'); return; }
    if (!this.patientId)   { this.globalErr.set('Patient ID missing.'); return; }

    this.saving.set(true);
    this.globalErr.set('');

    const promises = this.tasks.map((t, i) => {
      if (this.savedIdx.has(i)) return Promise.resolve();
      this.savingIdx.add(i);

      const body = {
        patientId:       this.patientId,
        taskTitle:       t.taskTitle.trim(),
        taskDescription: t.taskDescription?.trim() || '',
        dueDate:         new Date(t.dueDate + 'T00:00:00').toISOString(),
        priority:        t.priority,
        category:        t.category,
      };

      console.log('[AssignTask] POST /api/MedicalTask/add', body);

      return new Promise<void>((resolve) => {
        this.http.post<any>(`${environment.apiUrl}/MedicalTask/add`, body).subscribe({
          next: () => {
            this.savingIdx.delete(i);
            this.savedIdx.add(i);
            this.errIdx.delete(i);
            resolve();
          },
          error: (e: HttpErrorResponse) => {
            this.savingIdx.delete(i);
            const errs = e?.error?.errors;
            const msg = errs
              ? Object.entries(errs).map(([f, m]) => `${f}: ${(m as string[]).join(', ')}`).join(' | ')
              : e?.error?.message ?? e?.error?.title ?? `HTTP ${e.status}`;
            this.errIdx.set(i, msg);
            resolve();
          }
        });
      });
    });

    Promise.all(promises).then(() => {
      this.saving.set(false);
      if (this.errIdx.size > 0) {
        this.globalErr.set(`${this.errIdx.size} task(s) failed. See errors above.`);
      }
      if (this.allSaved()) {
        setTimeout(() => this.nav.navigate(['/doctor/patients', this.patientId, 'checklist']), 1500);
      }
    });
  }

  private empty(): TaskLine {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return {
      taskTitle:       '',
      taskDescription: '',
      dueDate:         d.toISOString().split('T')[0],
      priority:        'Medium',
      category:        'Other',
    };
  }
}
