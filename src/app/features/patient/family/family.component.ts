import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { FormsModule }                         from '@angular/forms';
import { PatientService }                      from '../../../core/services/patient.service';
import { FamilyMember }                        from '../../../core/models/api.models';

@Component({
  selector: 'app-family',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Family Members</h1>
        <button class="btn-add" (click)="showForm.set(true)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add
        </button>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner-lg"></div></div>

      <!-- Add form -->
      <div class="form-card" *ngIf="showForm()">
        <h3>Add Family Member</h3>
        <div class="row-2">
          <div class="field">
            <label>First Name *</label>
            <input [(ngModel)]="form.firstName" placeholder="First name" class="text-input" />
          </div>
          <div class="field">
            <label>Last Name *</label>
            <input [(ngModel)]="form.lastName" placeholder="Last name" class="text-input" />
          </div>
        </div>
        <div class="field">
          <label>Relation *</label>
          <select [(ngModel)]="form.relation" class="select-input">
            <option value="">Select relation</option>
            <option *ngFor="let r of relations" [value]="r">{{ r }}</option>
          </select>
        </div>
        <div class="row-2">
          <div class="field">
            <label>Date of Birth</label>
            <input [(ngModel)]="form.dateOfBirth" type="date" class="text-input" />
          </div>
          <div class="field">
            <label>Gender</label>
            <select [(ngModel)]="form.gender" class="select-input">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Phone</label>
          <input [(ngModel)]="form.phone" type="tel" placeholder="+20 1xx xxx xxxx" class="text-input" />
        </div>
        <div class="form-actions">
          <button class="btn-cancel" (click)="cancelForm()">Cancel</button>
          <button class="btn-save" (click)="addMember()" [disabled]="!form.firstName || !form.lastName || !form.relation || saving()">
            <span class="mini-spinner" *ngIf="saving()"></span>
            {{ saving() ? 'Saving...' : 'Add Member' }}
          </button>
        </div>
      </div>

      <!-- Members list -->
      <ng-container *ngIf="!loading()">
        <div class="member-card" *ngFor="let m of members()">
          <div class="member-avatar" [style.background]="avatarColor(m.relation)">
            {{ initials(m.firstName, m.lastName) }}
          </div>
          <div class="member-info">
            <div class="member-name">{{ m.firstName }} {{ m.lastName }}</div>
            <div class="member-relation">{{ m.relation }}</div>
            <div class="member-meta">
              <span *ngIf="m.dateOfBirth">{{ age(m.dateOfBirth) }} years old</span>
              <span *ngIf="m.gender"> · {{ m.gender }}</span>
              <span *ngIf="m.phone"> · {{ m.phone }}</span>
            </div>
          </div>
          <button class="remove-btn" (click)="removeMember(m)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>

        <div class="empty" *ngIf="members().length === 0 && !showForm()">
          <div class="empty-icon-wrap"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <p>No family members added yet</p>
          <button class="btn-empty" (click)="showForm.set(true)">Add first member</button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { padding:24px;  }
    @media (max-width:768px) { .page { padding:16px; } }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; }
    .btn-add { display:flex; align-items:center; gap:4px; background:#D84040; color:#fff; border:none; border-radius:10px; padding:8px 14px; font-size:14px; font-weight:600; cursor:pointer; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner-lg { width:32px; height:32px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .form-card { background:#fff; border-radius:14px; padding:20px; margin-bottom:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .form-card h3 { font-size:16px; font-weight:700; color:#111; margin-bottom:14px; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .field { margin-bottom:12px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:5px; }
    .text-input   { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .text-input:focus   { border-color:#D84040; }
    .select-input { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; appearance:none; background:#fff; box-sizing:border-box; }
    .form-actions { display:flex; gap:8px; margin-top:4px; }
    .btn-cancel   { flex:1; padding:11px; border:1.5px solid #e8e8e8; background:#fff; border-radius:10px; font-size:14px; cursor:pointer; }
    .btn-save     { flex:2; padding:11px; background:#D84040; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; }
    .btn-save:disabled { opacity:0.55; cursor:not-allowed; }
    .mini-spinner { display:inline-block; width:13px; height:13px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:5px; }

    .member-card   { background:#fff; border-radius:14px; padding:14px; display:flex; align-items:center; gap:12px; margin-bottom:10px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .member-avatar { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:16px; font-weight:700; flex-shrink:0; }
    .member-info   { flex:1; }
    .member-name   { font-size:15px; font-weight:700; color:#111; }
    .member-relation { font-size:12px; color:#D84040; font-weight:600; margin:2px 0; }
    .member-meta   { font-size:12px; color:#888; }
    .remove-btn    { width:32px; height:32px; border-radius:8px; border:1.5px solid #FBDCDC; background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#D84040; flex-shrink:0; }

    .empty { text-align:center; padding:40px 20px; background:#fff; border-radius:14px; }
    .empty-icon-wrap { width:72px; height:72px; background:#f0f0f0; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
    .empty p    { color:#888; font-size:15px; margin-bottom:16px; }
    .btn-empty  { background:#D84040; color:#fff; border:none; padding:10px 20px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; }
  `],
})
export class FamilyComponent implements OnInit {
  private svc = inject(PatientService);

  loading  = signal(true);
  showForm = signal(false);
  saving   = signal(false);
  members  = signal<FamilyMember[]>([]);

  form = { firstName:'', lastName:'', relation:'', dateOfBirth:'', gender:'' as 'Male'|'Female'|'', phone:'' };
  relations = ['Mother','Father','Spouse','Son','Daughter','Brother','Sister','Grandfather','Grandmother','Other'];

  ngOnInit(): void {
    this.svc.getFamilyMembers().subscribe((res: any) => { this.members.set(res?.data ?? []); this.loading.set(false); });
  }

  addMember(): void {
    this.saving.set(true);
    const body = { firstName: this.form.firstName, lastName: this.form.lastName, relation: this.form.relation, dateOfBirth: this.form.dateOfBirth || new Date().toISOString().split('T')[0], gender: (this.form.gender || 'Male') as 'Male'|'Female', phone: this.form.phone || null };
    this.svc.addFamilyMember(body).subscribe((res: any) => {
      this.members.update(m => [...m, res.data]);
      this.saving.set(false);
      this.cancelForm();
    });
  }

  removeMember(m: FamilyMember): void {
    if (!confirm(`Remove ${m.firstName}?`)) return;
    this.svc.removeFamilyMember(m.id).subscribe(() => this.members.update(list => list.filter(x => x.id !== m.id)));
  }

  cancelForm(): void { this.showForm.set(false); this.form = { firstName:'',lastName:'',relation:'',dateOfBirth:'',gender:'',phone:'' }; }

  initials(f: string, l: string): string { return (f[0]+l[0]).toUpperCase(); }
  age(dob: string): number { return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000); }
  avatarColor(relation: string): string {
    const c: Record<string,string> = { Mother:'#E87070',Father:'#4A7FBF',Spouse:'#D84040',Son:'#5BAD6F',Daughter:'#C45BAD',Brother:'#6B5BAD',Sister:'#AD5B7A' };
    return c[relation] ?? '#888';
  }
}
