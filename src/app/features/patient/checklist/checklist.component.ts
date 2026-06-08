import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { HttpClient }   from '@angular/common/http';
import { environment }  from '../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))              return r;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.data))        return r.data;
  if (Array.isArray(r?.items))       return r.items;
  return [];
}

interface Task {
  id: string;
  taskTitle: string;
  taskDescription: string;
  category: string;
  priority: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
  doctorName?: string;
  doctorId?: string;
}

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">
  <div class="pg-hdr">
    <div>
      <h1>My Tasks</h1>
      <p class="sub" *ngIf="!loading()">
        {{ done().length }}/{{ all().length }} completed
      </p>
    </div>
    <div class="filter-tabs">
      <button class="ftab" [class.active]="tab()==='pending'"  (click)="tab.set('pending')">
        Pending
        <span class="fcnt" *ngIf="pending().length>0">{{ pending().length }}</span>
      </button>
      <button class="ftab" [class.active]="tab()==='completed'" (click)="tab.set('completed')">Done</button>
      <button class="ftab" [class.active]="tab()==='all'"      (click)="tab.set('all')">All</button>
    </div>
  </div>

  <!-- Overall progress -->
  <div class="progress-card" *ngIf="!loading() && all().length > 0">
    <div class="pc-top">
      <span class="pc-lbl">Overall Progress</span>
      <span class="pc-pct">{{ pct() }}%</span>
    </div>
    <div class="prog-bar">
      <div class="prog-fill" [style.width]="pct()+'%'"></div>
    </div>
  </div>

  <!-- Loading -->
  <div class="loading" *ngIf="loading()">
    <div class="skel-list">
      <div class="skel-row" *ngFor="let i of [1,2,3,4]">
        <div class="skel-check"></div>
        <div class="skel-lines">
          <div class="skel-line w65"></div>
          <div class="skel-line w40 mt4"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty -->
  <div class="empty" *ngIf="!loading() && filtered().length===0">
    <div class="eico">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    </div>
    <p *ngIf="tab()==='pending'">No pending tasks — great job!</p>
    <p *ngIf="tab()==='completed'">No completed tasks yet</p>
    <p *ngIf="tab()==='all'">No tasks assigned yet</p>
    <p class="esub">Your doctor will assign tasks here</p>
  </div>

  <!-- Task list -->
  <div class="task-list" *ngIf="!loading()">
    <div class="task-card" *ngFor="let t of filtered()">
      <div class="task-main">
        <!-- Checkbox -->
        <button class="check-btn" (click)="toggle(t)"
                [disabled]="t.isCompleted || completing()===t.id"
                [class.done]="t.isCompleted"
                [class.loading]="completing()===t.id"
                [title]="t.isCompleted ? 'Completed' : 'Mark as done'">
          <svg *ngIf="t.isCompleted" width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div class="check-ring" *ngIf="completing()===t.id"></div>
        </button>

        <!-- Content -->
        <div class="task-body">
          <div class="task-title" [class.done]="t.isCompleted">{{ t.taskTitle }}</div>
          <p class="task-desc" *ngIf="t.taskDescription">{{ t.taskDescription }}</p>
          <div class="task-meta">
            <!-- Priority -->
            <span class="priority-chip" [class]="prCls(t.priority)">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <circle cx="4" cy="4" r="4"/>
              </svg>
              {{ t.priority }}
            </span>
            <!-- Category -->
            <span class="cat-chip">{{ t.category }}</span>
            <!-- Due date -->
            <span class="due-chip" *ngIf="t.dueDate" [class.overdue]="isOverdue(t)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ t.dueDate | date:'MMM d' }}
              <span class="overdue-tag" *ngIf="isOverdue(t)"> · Overdue</span>
            </span>
          </div>
          <!-- Doctor -->
          <div class="task-doctor" *ngIf="t.doctorName">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Assigned by Dr. {{ t.doctorName }}
          </div>
          <!-- Completed time -->
          <div class="task-done-at" *ngIf="t.isCompleted && t.completedAt">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Completed {{ t.completedAt | date:'MMM d, y · h:mm a' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .pg-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap;}
    h1{font-size:22px;font-weight:800;color:#111;}.sub{font-size:13px;color:#6B7280;margin-top:3px;}
    .filter-tabs{display:flex;gap:6px;flex-wrap:wrap;}
    .ftab{padding:7px 14px;border-radius:20px;border:1.5px solid #E8ECF0;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#6B7280;font-family:inherit;display:flex;align-items:center;gap:6px;}
    .ftab.active{background:#2D4A8A;color:#fff;border-color:#2D4A8A;}
    .fcnt{background:#D84040;color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;}
    .ftab.active .fcnt{background:rgba(255,255,255,.25);}
    /* Progress */
    .progress-card{background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.05);border:1px solid #F0F2F5;}
    .pc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
    .pc-lbl{font-size:13px;font-weight:600;color:#374151;}
    .pc-pct{font-size:15px;font-weight:800;color:#0F6E56;}
    .prog-bar{height:8px;background:#F0F2F5;border-radius:4px;overflow:hidden;}
    .prog-fill{height:100%;background:linear-gradient(90deg,#0F6E56,#22c55e);border-radius:4px;transition:width .4s;}
    /* Skeletons */
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
    .skel-list{display:flex;flex-direction:column;gap:10px;}
    .skel-row{display:flex;align-items:center;gap:12px;background:#fff;border-radius:14px;padding:14px;border:1px solid #F0F2F5;}
    .skel-check{width:28px;height:28px;border-radius:50%;background:#F0F2F5;flex-shrink:0;animation:pulse 1.4s ease-in-out infinite;}
    .skel-lines{flex:1;display:flex;flex-direction:column;gap:7px;}
    .skel-line{height:11px;border-radius:6px;background:#F0F2F5;animation:pulse 1.4s ease-in-out infinite;}
    .skel-line.w65{width:65%;}.skel-line.w40{width:40%;}.mt4{margin-top:2px;}
    /* Empty */
    .empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px 24px;background:#fff;border-radius:16px;text-align:center;border:1px solid #F0F2F5;}
    .eico{width:64px;height:64px;background:#F4F6FA;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty p{font-size:14px;color:#9CA3AF;}.esub{font-size:12px;color:#C9CDD4;}
    /* Tasks */
    .task-list{display:flex;flex-direction:column;gap:8px;}
    .task-card{background:#fff;border-radius:16px;padding:14px 16px;box-shadow:0 1px 6px rgba(0,0,0,.05);border:1px solid #F0F2F5;transition:box-shadow .15s;}
    .task-card:hover{box-shadow:0 2px 10px rgba(0,0,0,.09);}
    .task-main{display:flex;align-items:flex-start;gap:12px;}
    /* Checkbox */
    .check-btn{width:28px;height:28px;border-radius:50%;border:2px solid #D1D5DB;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;margin-top:1px;transition:all .2s;position:relative;}
    .check-btn:hover:not(.done):not(:disabled){border-color:#0F6E56;background:#ECFDF5;}
    .check-btn.done{background:#22c55e;border-color:#22c55e;}
    .check-btn.loading{border-color:#0F6E56;}
    .check-btn:disabled.done{cursor:default;}
    .check-ring{position:absolute;inset:0;border-radius:50%;border:2px solid transparent;border-top-color:#0F6E56;animation:sp .6s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    /* Task body */
    .task-body{flex:1;min-width:0;}
    .task-title{font-size:15px;font-weight:600;color:#111;margin-bottom:5px;line-height:1.4;}
    .task-title.done{text-decoration:line-through;color:#9CA3AF;}
    .task-desc{font-size:13px;color:#6B7280;margin-bottom:7px;line-height:1.5;}
    .task-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;}
    .priority-chip{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;}
    .priority-chip.high{background:#FEF2F2;color:#D84040;}
    .priority-chip.medium{background:#FFFBEB;color:#d4a017;}
    .priority-chip.low{background:#F0FDF4;color:#16a34a;}
    .cat-chip{font-size:11px;font-weight:600;background:#F4F6FA;color:#6B7280;padding:3px 9px;border-radius:20px;border:1px solid #E8ECF0;}
    .due-chip{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#6B7280;background:#F4F6FA;padding:3px 9px;border-radius:20px;border:1px solid #E8ECF0;}
    .due-chip.overdue{background:#FEF2F2;color:#D84040;border-color:#fecaca;}
    .overdue-tag{font-weight:700;}
    .task-doctor{display:flex;align-items:center;gap:5px;font-size:12px;color:#9CA3AF;margin-top:4px;}
    .task-done-at{display:flex;align-items:center;gap:5px;font-size:12px;color:#0F6E56;margin-top:4px;font-weight:600;}
  `]
})
export class ChecklistComponent implements OnInit {
  private http = inject(HttpClient);

  loading    = signal(true);
  completing = signal('');
  tab        = signal<'pending'|'completed'|'all'>('pending');
  all        = signal<Task[]>([]);

  pending():   Task[] { return this.all().filter(t => !t.isCompleted); }
  done():      Task[] { return this.all().filter(t =>  t.isCompleted); }
  filtered():  Task[] {
    switch(this.tab()) {
      case 'pending':   return this.pending();
      case 'completed': return this.done();
      default:          return this.all();
    }
  }
  pct(): number {
    const a = this.all().length;
    return a ? Math.round(this.done().length / a * 100) : 0;
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    // GET /api/MedicalTask/my — returns ALL tasks for this patient
    this.http.get<any>(`${environment.apiUrl}/MedicalTask/my`).subscribe({
      next: (res: any) => {
        const items = toArr(res);
        this.all.set(items.map((t: any) => ({
          id:              t.id              ?? t.taskId ?? '',
          taskTitle:       t.taskTitle       ?? t.title  ?? t.name ?? '',
          taskDescription: t.taskDescription ?? t.description ?? '',
          category:        t.category        ?? 'Other',
          priority:        t.priority        ?? 'Medium',
          dueDate:         t.dueDate         ?? t.deadline ?? '',
          isCompleted:     t.isCompleted     ?? t.completed ?? false,
          completedAt:     t.completedAt     ?? t.doneAt ?? '',
          doctorName:      t.doctorName      ?? t.doctor?.name ?? '',
          doctorId:        t.doctorId        ?? t.doctor?.id ?? '',
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggle(t: Task): void {
    if (t.isCompleted) return;
    this.completing.set(t.id);

    // PUT /api/MedicalTask/complete/{taskId}
    this.http.put<any>(`${environment.apiUrl}/MedicalTask/complete/${t.id}`, {})
      .subscribe({
        next: (res: any) => {
          const updated = res?.data ?? res;
          this.all.update(list => list.map(x =>
            x.id === t.id
              ? { ...x, isCompleted: true, completedAt: updated?.completedAt ?? new Date().toISOString() }
              : x
          ));
          this.completing.set('');
        },
        error: () => {
          // Optimistic fallback
          this.all.update(list => list.map(x =>
            x.id === t.id ? { ...x, isCompleted: true, completedAt: new Date().toISOString() } : x
          ));
          this.completing.set('');
        }
      });
  }

  prCls(p: string): string {
    const s = (p||'').toLowerCase();
    if (s === 'high')   return 'high';
    if (s === 'low')    return 'low';
    return 'medium';
  }

  isOverdue(t: Task): boolean {
    if (!t.dueDate || t.isCompleted) return false;
    return new Date(t.dueDate).getTime() < Date.now();
  }
}
