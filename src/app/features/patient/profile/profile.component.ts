import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { AuthService }     from '../../../core/services/auth.service';
import { ProfileService }  from '../../../core/services/profile.service';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header"><h1>My Profile</h1></div>
      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>

      <ng-container *ngIf="!loading()">
        <!-- Avatar -->
        <div class="avatar-card">
          <div class="avatar-wrap">
            <div class="avatar" *ngIf="!profile().avatarUrl">{{ initials() }}</div>
            <img *ngIf="profile().avatarUrl" [src]="profile().avatarUrl" class="avatar-img" />
            <label class="change-photo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <input type="file" accept="image/*" (change)="onFileChange($event)" hidden />
            </label>
          </div>
          <div class="avatar-info">
            <div class="aname">{{ profile().firstName }} {{ profile().lastName }}</div>
            <div class="arole">Patient</div>
            <div class="aemail">{{ profile().email }}</div>
          </div>
        </div>

        <!-- Form -->
        <div class="form-card" *ngIf="editing()">
          <h3>Edit Profile</h3>
          <div class="field-row">
            <div class="field">
              <label>First Name</label>
              <input [(ngModel)]="form.firstName" class="inp" placeholder="First name" />
            </div>
            <div class="field">
              <label>Last Name</label>
              <input [(ngModel)]="form.lastName" class="inp" placeholder="Last name" />
            </div>
          </div>
          <div class="field">
            <label>Email</label>
            <input [(ngModel)]="form.email" type="email" class="inp" placeholder="Email" />
          </div>
          <div class="field-row">
            <div class="field">
              <label>Gender</label>
              <select [(ngModel)]="form.gender" class="inp">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div class="field">
              <label>Date of Birth</label>
              <input [(ngModel)]="form.dateOfBirth" type="date" class="inp" />
            </div>
          </div>
          <div class="field">
            <label>Address</label>
            <input [(ngModel)]="form.address" class="inp" placeholder="Your address" />
          </div>
          <h4 class="section-title">Health Vitals</h4>
          <div class="field-row">
            <div class="field">
              <label>Systolic BP</label>
              <input [(ngModel)]="form.systolicPressure" type="number" class="inp" placeholder="120" />
            </div>
            <div class="field">
              <label>Diastolic BP</label>
              <input [(ngModel)]="form.diastolicPressure" type="number" class="inp" placeholder="80" />
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Heart Rate</label>
              <input [(ngModel)]="form.heartRate" type="number" class="inp" placeholder="72" />
            </div>
            <div class="field">
              <label>Blood Sugar</label>
              <input [(ngModel)]="form.sugar" type="number" class="inp" placeholder="100" />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-cancel" (click)="editing.set(false)">Cancel</button>
            <button class="btn-save" (click)="save()" [disabled]="saving()">
              <span class="mini-spinner" *ngIf="saving()"></span>
              {{ saving() ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
          <div class="toast success" *ngIf="saved()">✅ Profile updated!</div>
        </div>

        <!-- View mode -->
        <div class="info-card" *ngIf="!editing()">
          <div class="info-row"><span>Full Name</span><strong>{{ profile().firstName }} {{ profile().lastName }}</strong></div>
          <div class="info-row"><span>Email</span><strong>{{ profile().email }}</strong></div>
          <div class="info-row"><span>Phone</span><strong>{{ profile().phone || '—' }}</strong></div>
          <div class="info-row"><span>Gender</span><strong>{{ profile().gender || '—' }}</strong></div>
          <div class="info-row"><span>Date of Birth</span><strong>{{ (profile().dateOfBirth | date:'MMM d, y') || '—' }}</strong></div>
          <div class="info-row"><span>Address</span><strong>{{ profile().address || '—' }}</strong></div>
          <div class="info-row" *ngIf="profile().bloodType"><span>Blood Type</span><strong>{{ profile().bloodType }}</strong></div>
        </div>

        <div class="action-row" *ngIf="!editing()">
          <button class="btn-edit" (click)="startEdit()">Edit Profile</button>
          <button class="btn-logout" (click)="logout()">Log Out</button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:640px;}@media(max-width:768px){.page{padding:16px;}}
    .page-header h1{font-size:22px;font-weight:800;color:#111;margin-bottom:16px;}
    .loading{display:flex;justify-content:center;padding:40px;}
    .spinner{width:28px;height:28px;border:3px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .mini-spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:5px;}
    .avatar-card{display:flex;align-items:center;gap:16px;background:#fff;border-radius:14px;padding:18px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .avatar-wrap{position:relative;flex-shrink:0;}
    .avatar{width:72px;height:72px;border-radius:50%;background:#D84040;color:#fff;font-size:24px;font-weight:700;display:flex;align-items:center;justify-content:center;}
    .avatar-img{width:72px;height:72px;border-radius:50%;object-fit:cover;}
    .change-photo{position:absolute;bottom:0;right:0;width:24px;height:24px;background:#1E293B;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;}
    .aname{font-size:17px;font-weight:700;color:#111;}.arole{font-size:12px;color:#D84040;font-weight:600;margin:2px 0;}.aemail{font-size:13px;color:#888;}
    .form-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .form-card h3{font-size:16px;font-weight:700;color:#111;margin-bottom:14px;}
    .section-title{font-size:14px;font-weight:600;color:#555;margin:14px 0 10px;border-top:1px solid #f0f0f0;padding-top:14px;}
    .field-row{display:flex;gap:12px;margin-bottom:10px;}@media(max-width:480px){.field-row{flex-direction:column;}}
    .field{flex:1;margin-bottom:10px;}
    .field label{display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:5px;}
    .inp{width:100%;padding:10px 12px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;font-family:'Cairo',sans-serif;outline:none;box-sizing:border-box;}
    .inp:focus{border-color:#D84040;}
    .form-actions{display:flex;gap:10px;margin-top:16px;}
    .btn-cancel{flex:1;padding:12px;border:1.5px solid #e8e8e8;background:#fff;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;color:#555;}
    .btn-save{flex:2;padding:12px;background:#D84040;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;}
    .btn-save:disabled{opacity:.6;cursor:not-allowed;}
    .toast{margin-top:12px;padding:12px;background:#E1F5EE;color:#0F6E56;border-radius:10px;font-size:14px;font-weight:600;}
    .info-card{background:#fff;border-radius:14px;padding:4px 0;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .info-row{display:flex;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f5f5f5;font-size:14px;}
    .info-row:last-child{border-bottom:none;}.info-row span{color:#888;}.info-row strong{color:#111;}
    .action-row{display:flex;gap:10px;}
    .btn-edit{flex:2;padding:13px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;}
    .btn-logout{flex:1;padding:13px;background:#FEF2F2;color:#D84040;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;}
  `],
})
export class PatientProfileComponent implements OnInit {
  private profileSvc = inject(ProfileService);
  private auth       = inject(AuthService);

  loading = signal(true);
  editing = signal(false);
  saving  = signal(false);
  saved   = signal(false);
  profile = signal<any>({});

  form: any = {};

  ngOnInit(): void {
    this.profileSvc.getPatientData().subscribe({
      next: (res: any) => {
        const d = res?.data ?? res;
        this.profile.set(d);
        this.loading.set(false);
      },
      error: () => {
        // Fallback to JWT data
        const u = this.auth.currentUser() as any;
        this.profile.set({ firstName: u?.given_name ?? '', lastName: u?.family_name ?? '', email: u?.email ?? '' });
        this.loading.set(false);
      },
    });
  }

  initials(): string {
    const p = this.profile();
    return ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toUpperCase();
  }

  startEdit(): void {
    const p = this.profile();
    this.form = {
      firstName: p.firstName, lastName: p.lastName, email: p.email,
      gender: p.gender?.toLowerCase() ?? '', dateOfBirth: p.dateOfBirth?.split('T')[0] ?? '',
      address: p.address ?? '',
      systolicPressure: p.systolicPressure ?? null,
      diastolicPressure: p.diastolicPressure ?? null,
      heartRate: p.heartRate ?? null,
      sugar: p.sugar ?? null,
    };
    this.editing.set(true);
    this.saved.set(false);
  }

  save(): void {
    this.saving.set(true);
    const dto: any = { ...this.form };
    if (dto.dateOfBirth) dto.dateOfBirth = new Date(dto.dateOfBirth).toISOString();
    this.profileSvc.updatePatient(dto).subscribe({
      next: (res: any) => {
        this.profile.set({ ...this.profile(), ...dto });
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => { this.saved.set(false); this.editing.set(false); }, 1500);
      },
      error: () => this.saving.set(false),
    });
  }

  onFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.profileSvc.uploadPicture(file).subscribe({
      next: (res: any) => {
        const url = res?.data?.profilePictureUrl ?? res?.data;
        if (url) this.profile.update((p: any) => ({ ...p, avatarUrl: url }));
      },
    });
  }

  logout(): void { this.auth.logout(); }
}
