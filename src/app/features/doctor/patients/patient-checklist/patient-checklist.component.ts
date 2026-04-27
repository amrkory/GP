import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DoctorService }  from '../../../../core/services/doctor.service';
import { Checklist }      from '../../../../core/models/api.models';

@Component({
  selector: 'app-patient-checklist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
    <ng-container *ngIf="!loading()">
      <div class="cl-card" *ngFor="let cl of lists()">
        <div class="cl-header">
          <div class="cl-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div class="cl-info">
            <div class="cl-title">{{ cl.title }}</div>
            <div class="cl-meta">{{ cl.tasks.length }} tasks · {{ cl.adherence }}% adherence</div>
          </div>
          <div class="adherence-pill" [class]="adherenceClass(cl.adherence)">{{ cl.adherence }}%</div>
        </div>
        <div class="task-list">
          <div class="task-row" *ngFor="let t of cl.tasks">
            <div class="task-check" [class.done]="t.status === 'Completed'">
              <svg *ngIf="t.status === 'Completed'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span class="task-title" [class.done]="t.status === 'Completed'">{{ t.title }}</span>
            <span class="freq-pill">{{ t.frequency }}</span>
          </div>
        </div>
      </div>
      <a [routerLink]="['/doctor/checklist/assign', patientId]" class="btn-assign">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Assign New Checklist
      </a>
      <div class="empty" *ngIf="lists().length === 0"><p>No checklists assigned yet.</p></div>
    </ng-container>
  `,
  styles: [`
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .cl-card   { background:#fff; border-radius:12px; margin-bottom:10px; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .cl-header { display:flex; align-items:center; gap:10px; padding:14px; border-bottom:1px solid #f5f5f5; }
    .cl-icon-wrap { width:36px; height:36px; background:#E1F5EE; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .cl-info   { flex:1; }
    .cl-title  { font-size:14px; font-weight:600; color:#111; }
    .cl-meta   { font-size:12px; color:#888; }
    .adherence-pill { font-size:12px; padding:3px 8px; border-radius:8px; font-weight:700; }
    .adherence-pill.high { background:#E1F5EE; color:#0F6E56; }
    .adherence-pill.mid  { background:#FEF9E7; color:#d4a017; }
    .adherence-pill.low  { background:#FEF2F2; color:#D84040; }
    .task-list { padding:8px 14px; }
    .task-row  { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #f5f5f5; }
    .task-row:last-child { border-bottom:none; }
    .task-check { width:18px; height:18px; border-radius:50%; border:2px solid #ddd; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .task-check.done { background:#22c55e; border-color:#22c55e; }
    .task-title { flex:1; font-size:13px; color:#111; }
    .task-title.done { text-decoration:line-through; color:#bbb; }
    .freq-pill  { font-size:11px; background:#f0f0f0; color:#666; padding:2px 6px; border-radius:6px; }
    .btn-assign { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:12px; background:#E1F5EE; color:#0F6E56; border-radius:12px; text-decoration:none; font-size:14px; font-weight:600; margin-top:4px; }
    .empty { text-align:center; padding:30px; background:#fff; border-radius:12px; color:#888; font-size:14px; }
  `],
})
export class PatientChecklistComponent implements OnInit {
  private svc   = inject(DoctorService);
  private route = inject(ActivatedRoute);
  loading   = signal(true);
  lists     = signal<Checklist[]>([]);
  patientId = '';
  ngOnInit(): void {
    this.patientId = this.route.parent?.snapshot.paramMap.get('patientId')!;
    this.svc.getPatientChecklists(this.patientId).subscribe((res: any) => { this.lists.set(res.data); this.loading.set(false); });
  }
  adherenceClass(n: number): string { return n >= 70 ? 'high' : n >= 40 ? 'mid' : 'low'; }
}
