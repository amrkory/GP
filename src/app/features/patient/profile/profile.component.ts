import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { FormsModule }                         from '@angular/forms';
import { Router }                              from '@angular/router';
import { PatientService }                      from '../../../core/services/patient.service';
import { AuthService }                         from '../../../core/services/auth.service';
import { PatientProfile }                      from '../../../core/models/api.models';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="profile-hero">
        <div class="avatar-wrap">
          <div class="avatar-lg">{{ initials() }}</div>
          <button class="avatar-edit" title="Change photo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        </div>
        <h2 class="profile-name">{{ profile()?.firstName }} {{ profile()?.lastName }}</h2>
        <p class="profile-email">{{ profile()?.email }}</p>
        <div class="profile-tags">
          <span class="tag red" *ngFor="let d of (profile()?.chronicDiseases ?? [])">{{ d }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading()"><div class="spinner-lg"></div></div>

      <!-- View mode -->
      <ng-container *ngIf="!loading() && !editing()">
        <div class="info-card">
          <h3>Personal Information</h3>
          <div class="info-row"><span class="lbl">Full name</span><span class="val">{{ profile()?.firstName }} {{ profile()?.lastName }}</span></div>
          <div class="info-row"><span class="lbl">Email</span><span class="val">{{ profile()?.email }}</span></div>
          <div class="info-row"><span class="lbl">Phone</span><span class="val">{{ profile()?.phone || '—' }}</span></div>
          <div class="info-row"><span class="lbl">Date of birth</span><span class="val">{{ (profile()?.dateOfBirth | date:'MMMM d, y') || '—' }}</span></div>
          <div class="info-row"><span class="lbl">Gender</span><span class="val">{{ profile()?.gender || '—' }}</span></div>
        </div>

        <div class="info-card">
          <h3>Medical Information</h3>
          <div class="info-row"><span class="lbl">Blood type</span><span class="val">{{ profile()?.bloodType || '—' }}</span></div>
          <div class="info-row"><span class="lbl">Weight</span><span class="val">{{ profile()?.weight ? profile()!.weight + ' kg' : '—' }}</span></div>
          <div class="info-row"><span class="lbl">Height</span><span class="val">{{ profile()?.height ? profile()!.height + ' cm' : '—' }}</span></div>
          <div class="info-row">
            <span class="lbl">Allergies</span>
            <span class="val">{{ (profile()?.allergies ?? []).length > 0 ? (profile()!.allergies).join(', ') : '—' }}</span>
          </div>
          <div class="info-row">
            <span class="lbl">Chronic diseases</span>
            <span class="val">{{ (profile()?.chronicDiseases ?? []).length > 0 ? (profile()!.chronicDiseases).join(', ') : '—' }}</span>
          </div>
        </div>

        <button class="btn-edit" (click)="startEdit()">Edit Profile</button>
        <button class="btn-logout" (click)="logout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Log Out
        </button>
      </ng-container>

      <!-- Edit mode -->
      <ng-container *ngIf="!loading() && editing()">
        <div class="edit-card">
          <h3>Edit Profile</h3>
          <div class="row-2">
            <div class="field"><label>First Name</label><input [(ngModel)]="editForm.firstName" class="text-input" /></div>
            <div class="field"><label>Last Name</label><input [(ngModel)]="editForm.lastName" class="text-input" /></div>
          </div>
          <div class="field"><label>Phone</label><input [(ngModel)]="editForm.phone" type="tel" class="text-input" /></div>
          <div class="row-2">
            <div class="field"><label>Date of Birth</label><input [(ngModel)]="editForm.dateOfBirth" type="date" class="text-input" /></div>
            <div class="field">
              <label>Gender</label>
              <select [(ngModel)]="editForm.gender" class="select-input">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <div class="row-2">
            <div class="field"><label>Blood Type</label>
              <select [(ngModel)]="editForm.bloodType" class="select-input">
                <option value="">Select</option>
                <option *ngFor="let bt of bloodTypes" [value]="bt">{{ bt }}</option>
              </select>
            </div>
            <div class="field"><label>Weight (kg)</label><input [(ngModel)]="editForm.weight" type="number" class="text-input" /></div>
          </div>
          <div class="field"><label>Height (cm)</label><input [(ngModel)]="editForm.height" type="number" class="text-input" /></div>

          <div class="alert-success" *ngIf="saved()">✅ Profile updated!</div>

          <div class="edit-actions">
            <button class="btn-cancel" (click)="editing.set(false)">Cancel</button>
            <button class="btn-save" (click)="saveProfile()" [disabled]="saving()">
              <span class="mini-spinner" *ngIf="saving()"></span>
              {{ saving() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .page { padding:0 0 24px; max-width:640px; margin:0 auto; }

    .profile-hero { background:#D84040; padding:30px 16px 24px; text-align:center; position:relative; }
    .avatar-wrap  { position:relative; display:inline-block; margin-bottom:12px; }
    .avatar-lg    { width:72px; height:72px; border-radius:50%; background:rgba(255,255,255,0.25); color:#fff; font-size:24px; font-weight:700; display:flex; align-items:center; justify-content:center; border:3px solid rgba(255,255,255,0.5); }
    .avatar-edit  { position:absolute; bottom:0; right:0; width:24px; height:24px; border-radius:50%; background:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px rgba(0,0,0,0.2); }
    .profile-name  { font-size:20px; font-weight:700; color:#fff; margin-bottom:2px; }
    .profile-email { font-size:13px; color:rgba(255,255,255,0.75); margin-bottom:8px; }
    .profile-tags  { display:flex; justify-content:center; gap:6px; flex-wrap:wrap; }
    .tag { font-size:11px; padding:3px 10px; border-radius:10px; }
    .tag.red { background:rgba(255,255,255,0.2); color:#fff; }

    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner-lg { width:32px; height:32px; border:3px solid #f0f0f0; border-top-color:#D84040; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .info-card { background:#fff; border-radius:14px; margin:12px 16px 0; padding:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .info-card h3 { font-size:15px; font-weight:700; color:#111; margin-bottom:12px; }
    .info-row { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid #f5f5f5; }
    .info-row:last-child { border-bottom:none; }
    .lbl { font-size:13px; color:#888; }
    .val { font-size:13px; color:#111; font-weight:500; text-align:right; max-width:60%; }

    .btn-edit   { display:block; width:calc(100% - 32px); margin:14px 16px 0; padding:13px; background:#D84040; color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; }
    .btn-logout { display:flex; align-items:center; justify-content:center; gap:8px; width:calc(100% - 32px); margin:10px 16px 0; padding:13px; background:#fff; color:#888; border:1.5px solid #e8e8e8; border-radius:12px; font-size:15px; cursor:pointer; font-family:'Cairo',sans-serif; }
    .btn-logout:hover { background:#FEF2F2; color:#D84040; border-color:#FBDCDC; }

    .edit-card { background:#fff; border-radius:14px; margin:12px 16px 0; padding:20px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .edit-card h3 { font-size:15px; font-weight:700; color:#111; margin-bottom:14px; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .field { margin-bottom:12px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:5px; }
    .text-input   { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .text-input:focus { border-color:#D84040; }
    .select-input { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; appearance:none; background:#fff; box-sizing:border-box; }
    .edit-actions { display:flex; gap:8px; }
    .btn-cancel   { flex:1; padding:12px; border:1.5px solid #e8e8e8; background:#fff; border-radius:10px; font-size:14px; cursor:pointer; }
    .btn-save     { flex:2; padding:12px; background:#D84040; color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; }
    .btn-save:disabled { opacity:0.55; cursor:not-allowed; }
    .mini-spinner { display:inline-block; width:13px; height:13px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:5px; }
    .alert-success { background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:10px 12px; margin-bottom:12px; font-size:13px; font-weight:600; }
  `],
})
export class PatientProfileComponent implements OnInit {
  private svc  = inject(PatientService);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(true);
  editing = signal(false);
  saving  = signal(false);
  saved   = signal(false);
  profile = signal<PatientProfile | null>(null);

  bloodTypes = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  editForm: any = {};

  ngOnInit(): void {
    this.svc.getProfile().subscribe(res => { this.profile.set(res.data); this.loading.set(false); });
  }

  initials(): string {
    const p = this.profile();
    return ((p?.firstName?.[0] ?? '') + (p?.lastName?.[0] ?? '')).toUpperCase();
  }

  startEdit(): void {
    const p = this.profile()!;
    this.editForm = { firstName: p.firstName, lastName: p.lastName, phone: p.phone ?? '', dateOfBirth: p.dateOfBirth ?? '', gender: p.gender ?? '', bloodType: p.bloodType ?? '', weight: p.weight ?? '', height: p.height ?? '' };
    this.editing.set(true);
    this.saved.set(false);
  }

  saveProfile(): void {
    this.saving.set(true);
    this.svc.updateProfile(this.editForm).subscribe(res => {
      this.profile.set(res.data);
      this.saving.set(false);
      this.saved.set(true);
      setTimeout(() => { this.editing.set(false); this.saved.set(false); }, 1200);
    });
  }

  logout(): void { this.auth.logout(); }
}
