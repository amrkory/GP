import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { FormsModule }                         from '@angular/forms';
import { ActivatedRoute, Router }              from '@angular/router';
import { PatientService }                      from '../../../../core/services/patient.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/patient/checklist'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Task Detail</h1>
        <span></span>
      </div>

      <div class="task-card">
        <div class="task-status" [class.done]="task.status === 'Completed'">
          <div class="status-icon">{{ task.status === 'Completed' ? '✅' : '⏳' }}</div>
          <div>
            <div class="task-title">{{ task.title }}</div>
            <span class="status-text" [class.done]="task.status === 'Completed'">{{ task.status }}</span>
          </div>
        </div>

        <div class="detail-rows" *ngIf="task.description || task.frequency || task.dueDate">
          <div class="detail-row" *ngIf="task.description">
            <span class="detail-icon">📋</span>
            <div>
              <div class="detail-label">Description</div>
              <div class="detail-val">{{ task.description }}</div>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-icon">🔄</span>
            <div>
              <div class="detail-label">Frequency</div>
              <div class="detail-val">{{ task.frequency }}</div>
            </div>
          </div>
          <div class="detail-row" *ngIf="task.dueDate">
            <span class="detail-icon">📅</span>
            <div>
              <div class="detail-label">Due date</div>
              <div class="detail-val">{{ task.dueDate | date:'EEEE, MMMM d, y' }}</div>
            </div>
          </div>
          <div class="detail-row" *ngIf="task.completedAt">
            <span class="detail-icon">✅</span>
            <div>
              <div class="detail-label">Completed at</div>
              <div class="detail-val">{{ task.completedAt | date:'EEE, MMM d · h:mm a' }}</div>
            </div>
          </div>
          <div class="detail-row" *ngIf="task.note">
            <span class="detail-icon">📝</span>
            <div>
              <div class="detail-label">Note</div>
              <div class="detail-val">{{ task.note }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mark done form -->
      <ng-container *ngIf="task.status !== 'Completed'">
        <div class="mark-card">
          <h3>Mark as complete</h3>
          <div class="field">
            <label>Add a note (optional)</label>
            <input [(ngModel)]="note" placeholder="e.g. Reading was 95 mg/dL" class="note-input" />
          </div>
        </div>

        <div class="alert-success" *ngIf="saved()">✅ Task marked as complete!</div>

        <button class="btn-primary" (click)="markDone()" [disabled]="saving() || saved()">
          <span class="mini-spinner" *ngIf="saving()"></span>
          {{ saving() ? 'Saving...' : 'Mark as Complete' }}
        </button>
      </ng-container>
    </div>
  `,
  styles: [`
    .page    { padding:16px; max-width:640px; margin:0 auto; }
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .top-bar h1 { font-size:18px; font-weight:700; color:#111; }
    .back-btn   { background:none; border:none; cursor:pointer; color:#555; padding:4px; display:flex; }

    .task-card   { background:#fff; border-radius:14px; padding:20px; margin-bottom:12px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .task-status { display:flex; align-items:center; gap:14px; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid #f5f5f5; }
    .status-icon { font-size:32px; }
    .task-title  { font-size:17px; font-weight:700; color:#111; margin-bottom:4px; }
    .status-text { font-size:12px; padding:3px 9px; border-radius:8px; background:#FEF9E7; color:#d4a017; font-weight:600; }
    .status-text.done { background:#E1F5EE; color:#0F6E56; }

    .detail-rows { display:flex; flex-direction:column; gap:0; }
    .detail-row  { display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid #f5f5f5; }
    .detail-row:last-child { border-bottom:none; }
    .detail-icon  { font-size:18px; flex-shrink:0; margin-top:2px; }
    .detail-label { font-size:12px; color:#888; margin-bottom:2px; }
    .detail-val   { font-size:14px; color:#111; font-weight:500; }

    .mark-card { background:#fff; border-radius:14px; padding:20px; margin-bottom:12px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .mark-card h3 { font-size:15px; font-weight:700; color:#111; margin-bottom:12px; }
    .field       { margin-bottom:0; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:6px; }
    .note-input  { width:100%; padding:10px 14px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .note-input:focus { border-color:#D84040; }

    .alert-success { background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:14px; font-weight:600; }
    .btn-primary   { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; }
    .btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class TaskDetailComponent implements OnInit {
  private svc   = inject(PatientService);
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);

  saving = signal(false);
  saved  = signal(false);
  note   = '';

  task: any = { title: 'Loading...', status: 'Pending', frequency: 'Daily', description: null, dueDate: null, completedAt: null, note: null };
  checklistId = '';

  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('id')!;
    // Load checklists then find task
    this.svc.getChecklists().subscribe(res => {
      for (const cl of res.data) {
        const t = cl.tasks.find((x: any) => x.id === taskId);
        if (t) { this.task = t; this.checklistId = cl.id; break; }
      }
    });
  }

  markDone(): void {
    this.saving.set(true);
    this.svc.completeTask(this.checklistId, this.task.id, this.note || undefined).subscribe(res => {
      this.task = res.data;
      this.saving.set(false);
      this.saved.set(true);
      setTimeout(() => this.router.navigate(['/patient/checklist']), 1200);
    });
  }
}
