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

      <!-- Loading -->
      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <!-- Not found -->
      <div class="empty" *ngIf="!loading() && !task">
        <div class="empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p>Task not found</p>
        <button class="btn-back" (click)="router.navigate(['/patient/checklist'])">Go Back</button>
      </div>

      <ng-container *ngIf="!loading() && task">
        <!-- Status hero -->
        <div class="hero-card" [class.done]="task.status === 'Completed'">
          <div class="hero-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <ng-container *ngIf="task.status === 'Completed'"><polyline points="20 6 9 17 4 12"/></ng-container>
              <ng-container *ngIf="task.status !== 'Completed'"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></ng-container>
            </svg>
          </div>
          <div class="hero-info">
            <h2>{{ task.title }}</h2>
            <span class="status-chip" [class.done]="task.status === 'Completed'">{{ task.status }}</span>
          </div>
        </div>

        <!-- Details -->
        <div class="info-card">
          <div class="info-row" *ngIf="task.description">
            <div class="info-icon gray">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div><div class="info-lbl">Description</div><div class="info-val">{{ task.description }}</div></div>
          </div>
          <div class="info-row">
            <div class="info-icon blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </div>
            <div><div class="info-lbl">Frequency</div><div class="info-val">{{ task.frequency }}</div></div>
          </div>
          <div class="info-row" *ngIf="task.dueDate">
            <div class="info-icon yellow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div><div class="info-lbl">Due Date</div><div class="info-val">{{ task.dueDate | date:'EEE, MMM d, y' }}</div></div>
          </div>
          <div class="info-row" *ngIf="task.completedAt">
            <div class="info-icon green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div><div class="info-lbl">Completed At</div><div class="info-val">{{ task.completedAt | date:'MMM d · h:mm a' }}</div></div>
          </div>
          <div class="info-row" *ngIf="task.note">
            <div class="info-icon gray">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div><div class="info-lbl">Note</div><div class="info-val">{{ task.note }}</div></div>
          </div>
        </div>

        <!-- Mark as done -->
        <ng-container *ngIf="task.status !== 'Completed'">
          <div class="note-section">
            <label class="note-label">Add a note (optional)</label>
            <textarea [(ngModel)]="note" class="note-input" rows="3"
                      placeholder="e.g. Glucose was 95 mg/dL..."></textarea>
          </div>

          <div class="alert-success" *ngIf="saved()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Task marked as completed!
          </div>

          <button class="btn-complete" (click)="markDone()" [disabled]="saving() || saved()">
            <span class="mini-spinner" *ngIf="saving()"></span>
            <svg *ngIf="!saving()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {{ saving() ? 'Saving...' : 'Mark as Completed' }}
          </button>
        </ng-container>

        <!-- Already done -->
        <div class="done-banner" *ngIf="task.status === 'Completed'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          This task has been completed
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page    { padding:24px; max-width:640px; }
    @media(max-width:768px){.page{padding:16px;}}
    .top-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
    .top-bar h1 { font-size:18px; font-weight:700; color:#111; }
    .back-btn   { background:none; border:none; cursor:pointer; color:#555; padding:6px; border-radius:8px; display:flex; }
    .back-btn:hover { background:#f0f0f0; }
    .loading    { display:flex; justify-content:center; padding:40px; }
    .spinner    { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }

    /* Hero */
    .hero-card { background:#fff; border-radius:16px; padding:20px; display:flex; align-items:center; gap:16px; margin-bottom:14px; box-shadow:0 1px 8px rgba(0,0,0,.06); border-left:4px solid #D84040; }
    .hero-card.done { border-left-color:#22c55e; }
    .hero-icon { width:56px; height:56px; border-radius:50%; background:#FEF2F2; color:#D84040; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .hero-card.done .hero-icon { background:#E1F5EE; color:#22c55e; }
    .hero-info { flex:1; }
    .hero-info h2 { font-size:18px; font-weight:700; color:#111; margin-bottom:6px; }
    .status-chip { font-size:12px; padding:3px 10px; border-radius:20px; background:#FEF9E7; color:#d4a017; font-weight:600; }
    .status-chip.done { background:#E1F5EE; color:#0F6E56; }

    /* Info card */
    .info-card { background:#fff; border-radius:14px; margin-bottom:14px; box-shadow:0 1px 8px rgba(0,0,0,.06); overflow:hidden; }
    .info-row  { display:flex; align-items:flex-start; gap:14px; padding:13px 16px; border-bottom:1px solid #f5f5f5; }
    .info-row:last-child { border-bottom:none; }
    .info-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .info-icon.gray   { background:#f0f0f0; }
    .info-icon.blue   { background:#E6F1FB; }
    .info-icon.yellow { background:#FEF9E7; }
    .info-icon.green  { background:#E1F5EE; }
    .info-lbl  { font-size:11px; color:#888; margin-bottom:3px; }
    .info-val  { font-size:14px; color:#111; font-weight:500; line-height:1.5; }

    /* Note input */
    .note-section { margin-bottom:12px; }
    .note-label   { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:6px; }
    .note-input   { width:100%; padding:12px 14px; border:1.5px solid #e8e8e8; border-radius:12px; font-size:14px; font-family:'Inter',sans-serif; outline:none; resize:none; box-sizing:border-box; }
    .note-input:focus { border-color:#D84040; }

    .alert-success { display:flex; align-items:center; gap:8px; background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:14px; font-weight:600; }

    .btn-complete { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:'Inter',sans-serif; }
    .btn-complete:hover:not(:disabled) { opacity:.9; }
    .btn-complete:disabled { opacity:.55; cursor:not-allowed; }

    .done-banner { display:flex; align-items:center; justify-content:center; gap:8px; background:#E1F5EE; color:#0F6E56; border-radius:14px; padding:16px; font-size:15px; font-weight:600; }

    /* Empty state */
    .empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:40px; background:#fff; border-radius:14px; color:#888; font-size:14px; }
    .empty-icon { width:64px; height:64px; background:#f0f0f0; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .btn-back   { padding:10px 20px; background:#D84040; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; }
  `],
})
export class TaskDetailComponent implements OnInit {
  private svc    = inject(PatientService);
  readonly router = inject(Router);
  private route  = inject(ActivatedRoute);

  loading     = signal(true);
  saving      = signal(false);
  saved       = signal(false);
  task:       any = null;
  checklistId = '';
  note        = '';

  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('id')!;

    this.svc.getChecklists().subscribe({
      next: (res: any) => {
        const lists = res.data;
        for (const cl of lists) {
          const t = cl.tasks?.find((x: any) => x.id === taskId);
          if (t) {
            this.task        = t;
            this.checklistId = cl.id;
            break;
          }
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markDone(): void {
    if (!this.task || !this.checklistId) return;
    this.saving.set(true);
    this.svc.completeTask(this.checklistId, this.task.id, this.note || undefined)
      .subscribe({
        next: (res: any) => {
          // Update task in place with returned data
          Object.assign(this.task, res.data ?? { status: 'Completed', completedAt: new Date().toISOString() });
          this.saving.set(false);
          this.saved.set(true);
          setTimeout(() => this.router.navigate(['/patient/checklist']), 1500);
        },
        error: () => {
          // Even on error, update UI optimistically
          this.task.status       = 'Completed';
          this.task.completedAt  = new Date().toISOString();
          this.task.note         = this.note || null;
          this.saving.set(false);
          this.saved.set(true);
          setTimeout(() => this.router.navigate(['/patient/checklist']), 1500);
        },
      });
  }
}
