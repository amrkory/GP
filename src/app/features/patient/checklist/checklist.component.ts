import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { RouterLink }                          from '@angular/router';
import { PatientService }                      from '../../../core/services/patient.service';
import { Checklist, ChecklistTask }            from '../../../core/models/api.models';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>My Checklists</h1>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner-lg"></div></div>

      <ng-container *ngIf="!loading()">
        <div class="checklist-block" *ngFor="let cl of checklists()">
          <!-- Header -->
          <div class="cl-header">
            <div>
              <h2>{{ cl.title }}</h2>
              <p>By {{ cl.doctorName }}</p>
            </div>
            <div class="adherence-circle">
              <svg viewBox="0 0 36 36" width="52" height="52">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0f0f0" stroke-width="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#D84040" stroke-width="3"
                        [attr.stroke-dasharray]="cl.adherence + ',100'"
                        stroke-dashoffset="25" stroke-linecap="round"/>
              </svg>
              <span class="adherence-pct">{{ cl.adherence }}%</span>
            </div>
          </div>

          <!-- Tasks -->
          <div class="task-list">
            <div class="task-item" *ngFor="let t of cl.tasks"
                 [class.done]="t.status === 'Completed'"
                 [routerLink]="['/patient/checklist', t.id]">
              <div class="check-wrap" (click)="toggleTask(cl, t, $event)">
                <div class="check-circle" [class.checked]="t.status === 'Completed'">
                  <svg *ngIf="t.status === 'Completed'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
              <div class="task-body">
                <div class="task-title">{{ t.title }}</div>
                <div class="task-meta">
                  <span class="freq-badge" [class]="t.frequency.toLowerCase()">{{ t.frequency }}</span>
                  <span class="done-time" *ngIf="t.completedAt"> · Done {{ t.completedAt | date:'h:mm a' }}</span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="progress-row">
            <span>{{ completedCount(cl) }}/{{ cl.tasks.length }} tasks completed</span>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="cl.adherence"></div>
            </div>
          </div>
        </div>

        <div class="empty" *ngIf="checklists().length === 0">
          <div class="empty-icon">✅</div>
          <p>No checklists assigned yet</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding:16px; max-width:640px; margin:0 auto; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner-lg { width:32px; height:32px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .checklist-block { background:#fff; border-radius:16px; margin-bottom:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); overflow:hidden; }

    .cl-header { display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid #f5f5f5; }
    .cl-header h2 { font-size:16px; font-weight:700; color:#111; margin-bottom:2px; }
    .cl-header p  { font-size:12px; color:#888; }
    .adherence-circle { position:relative; display:flex; align-items:center; justify-content:center; }
    .adherence-pct    { position:absolute; font-size:11px; font-weight:700; color:#D84040; }

    .task-list { }
    .task-item { display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid #f5f5f5; cursor:pointer; transition:background .1s; text-decoration:none; color:inherit; }
    .task-item:last-child { border-bottom:none; }
    .task-item:hover { background:#fafafa; }
    .task-item.done  { }

    .check-wrap   { flex-shrink:0; }
    .check-circle { width:22px; height:22px; border-radius:50%; border:2px solid #ddd; display:flex; align-items:center; justify-content:center; transition:all .2s; }
    .check-circle.checked { background:#22c55e; border-color:#22c55e; }

    .task-body  { flex:1; }
    .task-title { font-size:14px; color:#111; font-weight:500; }
    .task-item.done .task-title { text-decoration:line-through; color:#bbb; }
    .task-meta  { display:flex; align-items:center; gap:4px; margin-top:3px; }
    .freq-badge { font-size:11px; padding:2px 7px; border-radius:8px; background:#f0f0f0; color:#666; }
    .freq-badge.daily   { background:#FEF2F2; color:#D84040; }
    .freq-badge.weekly  { background:#E6F1FB; color:#185FA5; }
    .done-time  { font-size:11px; color:#888; }

    .progress-row { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:#fafafa; gap:12px; }
    .progress-row span { font-size:12px; color:#888; white-space:nowrap; }
    .progress-bar { flex:1; height:6px; background:#f0f0f0; border-radius:3px; overflow:hidden; }
    .progress-fill { height:100%; background:#D84040; border-radius:3px; transition:width .3s; }

    .empty { text-align:center; padding:40px 20px; background:#fff; border-radius:14px; }
    .empty-icon { font-size:48px; margin-bottom:12px; }
    .empty p    { color:#888; font-size:15px; }
  `],
})
export class ChecklistComponent implements OnInit {
  private svc = inject(PatientService);

  loading    = signal(true);
  checklists = signal<Checklist[]>([]);

  ngOnInit(): void {
    this.svc.getChecklists().subscribe(res => { this.checklists.set(res.data); this.loading.set(false); });
  }

  toggleTask(cl: Checklist, task: ChecklistTask, e: Event): void {
    e.stopPropagation(); e.preventDefault();
    if (task.status === 'Completed') return;
    this.svc.completeTask(cl.id, task.id).subscribe(res => {
      this.checklists.update(list => list.map(c =>
        c.id === cl.id ? { ...c, tasks: c.tasks.map(t => t.id === task.id ? res.data : t) } : c
      ));
    });
  }

  completedCount(cl: Checklist): number {
    return cl.tasks.filter(t => t.status === 'Completed').length;
  }
}
