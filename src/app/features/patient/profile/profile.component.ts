import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { AuthService }    from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="pg-hdr">
    <h1>My Profile</h1>
    <button class="btn-edit" *ngIf="!editing()" (click)="startEdit()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      Edit Profile
    </button>
  </div>

  <div class="loading" *ngIf="loading()"><div class="spin"></div></div>

  <ng-container *ngIf="!loading()">

    <!-- Avatar card -->
    <div class="av-card">
      <div class="av-wrap">
        <div class="av-circle" *ngIf="!avatarUrl()">{{ initials() }}</div>
        <img *ngIf="avatarUrl()" [src]="avatarUrl()" class="av-img" alt="profile" />
        <label class="cam-btn" title="Change photo">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <input type="file" accept="image/*" (change)="onPhoto($event)" hidden />
        </label>
        <div class="uploading-ring" *ngIf="uploading()"></div>
      </div>
      <div class="av-info">
        <div class="av-name">{{ profile().firstName }} {{ profile().lastName }}</div>
        <div class="av-gender" *ngIf="profile().gender">{{ profile().gender | titlecase }}</div>
        <div class="av-email">{{ profile().email }}</div>
      </div>
    </div>

    <!-- View mode -->
    <ng-container *ngIf="!editing()">
      <div class="info-card">
        <div class="section-title">Personal Information</div>
        <div class="info-row">
          <div class="ir-lbl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Full Name
          </div>
          <div class="ir-val">{{ profile().firstName }} {{ profile().lastName }}</div>
        </div>
        <div class="info-row">
          <div class="ir-lbl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email
          </div>
          <div class="ir-val">{{ profile().email || '—' }}</div>
        </div>
        <div class="info-row" *ngIf="profile().gender">
          <div class="ir-lbl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
            Gender
          </div>
          <div class="ir-val">{{ profile().gender | titlecase }}</div>
        </div>
        <div class="info-row" *ngIf="profile().dateOfBirth">
          <div class="ir-lbl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Date of Birth
          </div>
          <div class="ir-val">{{ profile().dateOfBirth | date:'MMM d, y' }}</div>
        </div>
        <div class="info-row" *ngIf="profile().address">
          <div class="ir-lbl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Address
          </div>
          <div class="ir-val">{{ profile().address }}</div>
        </div>
      </div>

      <!-- Health baseline -->
      <div class="info-card"
           *ngIf="profile().systolicPressure || profile().diastolicPressure || profile().heartRate || profile().sugar">
        <div class="section-title">Health Baseline</div>
        <div class="vitals-grid">
          <div class="vt" *ngIf="profile().systolicPressure || profile().diastolicPressure">
            <div class="vt-ico" style="background:#FEF2F2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div>
              <div class="vt-val">{{ profile().systolicPressure }}/{{ profile().diastolicPressure }}</div>
              <div class="vt-lbl">Blood Pressure <span class="vt-u">mmHg</span></div>
            </div>
          </div>
          <div class="vt" *ngIf="profile().heartRate">
            <div class="vt-ico" style="background:#EFF6FF">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <div class="vt-val">{{ profile().heartRate }}</div>
              <div class="vt-lbl">Heart Rate <span class="vt-u">bpm</span></div>
            </div>
          </div>
          <div class="vt" *ngIf="profile().sugar">
            <div class="vt-ico" style="background:#FFFBEB">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <div class="vt-val">{{ profile().sugar }}</div>
              <div class="vt-lbl">Blood Sugar <span class="vt-u">mg/dL</span></div>
            </div>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- Edit mode -->
    <div class="edit-card" *ngIf="editing()">
      <div class="section-title">Personal Information</div>
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
        <input [(ngModel)]="form.email" type="email" class="inp" />
      </div>
      <div class="field-row">
        <div class="field">
          <label>Gender</label>
          <select [(ngModel)]="form.gender" class="inp">
            <option value="">Select gender</option>
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

      <div class="section-title" style="margin-top:18px">Health Baseline (optional)</div>
      <div class="field-row">
        <div class="field">
          <label>Systolic Pressure</label>
          <input [(ngModel)]="form.systolicPressure" type="number" class="inp" placeholder="e.g. 120" />
        </div>
        <div class="field">
          <label>Diastolic Pressure</label>
          <input [(ngModel)]="form.diastolicPressure" type="number" class="inp" placeholder="e.g. 80" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Heart Rate (bpm)</label>
          <input [(ngModel)]="form.heartRate" type="number" class="inp" placeholder="e.g. 72" />
        </div>
        <div class="field">
          <label>Blood Sugar (mg/dL)</label>
          <input [(ngModel)]="form.sugar" type="number" class="inp" placeholder="e.g. 90" />
        </div>
      </div>

      <div class="err-box" *ngIf="saveErr()">{{ saveErr() }}</div>
      <div class="ok-box" *ngIf="saved()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Profile updated successfully!
      </div>

      <div class="edit-actions">
        <button class="btn-cancel" (click)="editing.set(false)">Cancel</button>
        <button class="btn-save" (click)="save()" [disabled]="saving()">
          <span class="btn-ring" *ngIf="saving()"></span>
          {{ saving() ? 'Saving…' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Change password -->
    <div class="section-card">
      <div class="section-title">Security</div>
      <div class="pw-row" *ngIf="!changingPw()">
        <div class="pw-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Password</span>
          <span class="pw-dots">••••••••</span>
        </div>
        <button class="btn-change-pw" (click)="changingPw.set(true)">Change</button>
      </div>
      <div class="pw-form" *ngIf="changingPw()">
        <div class="field">
          <label>Current Password</label>
          <input [(ngModel)]="pwForm.currentPassword" type="password" class="inp" />
        </div>
        <div class="field">
          <label>New Password</label>
          <input [(ngModel)]="pwForm.newPassword" type="password" class="inp" />
        </div>
        <div class="field">
          <label>Confirm Password</label>
          <input [(ngModel)]="pwForm.confirmNewPassword" type="password" class="inp" />
        </div>
        <div class="err-box" *ngIf="pwErr()">{{ pwErr() }}</div>
        <div class="ok-box" *ngIf="pwSaved()">Password changed!</div>
        <div class="edit-actions">
          <button class="btn-cancel" (click)="changingPw.set(false)">Cancel</button>
          <button class="btn-save" (click)="changePassword()" [disabled]="pwSaving()">
            <span class="btn-ring" *ngIf="pwSaving()"></span>
            {{ pwSaving() ? 'Saving…' : 'Change Password' }}
          </button>
        </div>
      </div>
    </div>

    <button class="btn-logout" (click)="logout()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Log Out
    </button>

  </ng-container>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{padding:24px;max-width:680px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.page{padding:16px;}}
    .pg-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .btn-edit{display:flex;align-items:center;gap:7px;padding:9px 16px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
    .loading{display:flex;justify-content:center;padding:48px;}
    .spin{width:26px;height:26px;border:3px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:sp .7s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    .av-card{display:flex;align-items:center;gap:18px;background:#fff;border-radius:18px;padding:20px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .av-wrap{position:relative;flex-shrink:0;}
    .av-circle{width:80px;height:80px;border-radius:50%;background:#D84040;color:#fff;font-size:26px;font-weight:700;display:flex;align-items:center;justify-content:center;}
    .av-img{width:80px;height:80px;border-radius:50%;object-fit:cover;}
    .cam-btn{position:absolute;bottom:0;right:0;width:26px;height:26px;background:#1B2B4B;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;border:2px solid #fff;}
    .uploading-ring{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:#D84040;animation:sp .7s linear infinite;}
    .av-name{font-size:18px;font-weight:800;color:#111;margin-bottom:3px;}
    .av-gender{font-size:12px;color:#6B7280;margin-bottom:3px;text-transform:capitalize;}
    .av-email{font-size:13px;color:#6B7280;}
    .info-card,.edit-card,.section-card{background:#fff;border-radius:18px;padding:20px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .section-title{font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.7px;margin-bottom:12px;}
    .info-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #F8F9FC;}
    .info-row:last-child{border-bottom:none;}
    .ir-lbl{display:flex;align-items:center;gap:7px;font-size:13px;color:#6B7280;min-width:110px;flex-shrink:0;}
    .ir-val{font-size:14px;font-weight:600;color:#111;text-align:right;word-break:break-word;}
    .vitals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;}
    .vt{display:flex;align-items:center;gap:10px;padding:12px;background:#F8F9FC;border-radius:12px;}
    .vt-ico{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .vt-val{font-size:16px;font-weight:800;color:#111;line-height:1;}
    .vt-lbl{font-size:11px;color:#6B7280;margin-top:2px;}
    .vt-u{color:#9CA3AF;}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    @media(max-width:480px){.field-row{grid-template-columns:1fr;}}
    .field{margin-bottom:12px;}
    .field label{display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:5px;}
    .inp{width:100%;padding:10px 13px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;color:#111;background:#fff;}
    .inp:focus{border-color:#D84040;box-shadow:0 0 0 3px rgba(216,64,64,.08);}
    .edit-actions{display:flex;gap:10px;margin-top:16px;}
    .btn-cancel{flex:1;padding:12px;border:1.5px solid #E8ECF0;background:#fff;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;color:#555;font-family:inherit;}
    .btn-save{flex:2;padding:12px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;}
    .btn-save:disabled{opacity:.5;cursor:not-allowed;}
    .btn-ring{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite;}
    .err-box{background:#FEF2F2;color:#D84040;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:13px;border:1px solid #fecaca;}
    .ok-box{display:flex;align-items:center;gap:7px;background:#ECFDF5;color:#0F6E56;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:13px;font-weight:600;}
    .pw-row{display:flex;align-items:center;justify-content:space-between;}
    .pw-info{display:flex;align-items:center;gap:10px;font-size:14px;color:#374151;font-weight:600;}
    .pw-dots{color:#9CA3AF;letter-spacing:2px;}
    .btn-change-pw{padding:7px 14px;border:1.5px solid #E8ECF0;background:#fff;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;color:#374151;font-family:inherit;}
    .pw-form{display:flex;flex-direction:column;gap:4px;margin-top:12px;}
    .btn-logout{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;background:#FEF2F2;color:#D84040;border:1.5px solid #fecaca;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
  `]
})
export class PatientProfileComponent implements OnInit {
  private svc  = inject(ProfileService);
  private auth = inject(AuthService);

  loading     = signal(true);
  editing     = signal(false);
  saving      = signal(false);
  saved       = signal(false);
  saveErr     = signal('');
  uploading   = signal(false);
  changingPw  = signal(false);
  pwSaving    = signal(false);
  pwSaved     = signal(false);
  pwErr       = signal('');

  profile   = signal<any>({});
  avatarUrl = signal('');
  form: any = {};
  pwForm = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

  ngOnInit(): void {
    this.svc.getPatientData().subscribe({
      next: (res: any) => {
        const p = res?.data ?? res;
        this.profile.set(p);
        this.avatarUrl.set(p?.profilePictureUrl ?? p?.avatarUrl ?? '');
        this.loading.set(false);
      },
      error: () => {
        const u = this.auth.currentUser() as any;
        this.profile.set({ firstName: u?.given_name ?? '', lastName: u?.family_name ?? '', email: u?.email ?? '' });
        this.loading.set(false);
      }
    });
  }

  initials(): string {
    const p = this.profile();
    return ((p.firstName?.[0]??'') + (p.lastName?.[0]??'')).toUpperCase() || 'P';
  }

  startEdit(): void {
    const p = this.profile();
    this.form = {
      firstName:         p.firstName ?? '',
      lastName:          p.lastName  ?? '',
      email:             p.email     ?? '',
      gender:            p.gender    ?? '',
      dateOfBirth:       p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
      address:           p.address   ?? '',
      systolicPressure:  p.systolicPressure  ?? '',
      diastolicPressure: p.diastolicPressure ?? '',
      heartRate:         p.heartRate ?? '',
      sugar:             p.sugar     ?? '',
    };
    this.editing.set(true);
    this.saved.set(false);
    this.saveErr.set('');
  }

  save(): void {
    this.saving.set(true);
    this.saveErr.set('');

    // Exact patient PUT body from Swagger
    const body: any = {
      firstName:        this.form.firstName,
      lastName:         this.form.lastName,
      email:            this.form.email,
      profilePictureUrl: this.avatarUrl() || undefined,
      gender:           this.form.gender    || undefined,
      dateOfBirth:      this.form.dateOfBirth
                          ? new Date(this.form.dateOfBirth).toISOString()
                          : undefined,
      address:          this.form.address   || undefined,
    };
    if (this.form.systolicPressure)  body.systolicPressure  = Number(this.form.systolicPressure);
    if (this.form.diastolicPressure) body.diastolicPressure = Number(this.form.diastolicPressure);
    if (this.form.heartRate)         body.heartRate         = Number(this.form.heartRate);
    if (this.form.sugar)             body.sugar             = Number(this.form.sugar);

    this.svc.updatePatient(body).subscribe({
      next: () => {
        this.profile.update(p => ({ ...p, ...this.form }));
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => { this.saved.set(false); this.editing.set(false); }, 1600);
      },
      error: (e: any) => {
        this.saving.set(false);
        this.saveErr.set(e?.error?.message ?? e?.error?.title ?? 'Save failed');
      }
    });
  }

  onPhoto(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.svc.uploadPicture(file).subscribe({
      next: (res: any) => {
        const url = res?.data?.profilePictureUrl ?? res?.profilePictureUrl ?? res?.data ?? '';
        if (url) { this.avatarUrl.set(url); this.profile.update(p => ({ ...p, profilePictureUrl: url })); }
        this.uploading.set(false);
      },
      error: () => this.uploading.set(false)
    });
  }

  changePassword(): void {
    if (this.pwForm.newPassword !== this.pwForm.confirmNewPassword) {
      this.pwErr.set('Passwords do not match');
      return;
    }
    this.pwSaving.set(true);
    this.pwErr.set('');
    this.auth.changePassword(this.pwForm).subscribe({
      next: () => {
        this.pwSaving.set(false);
        this.pwSaved.set(true);
        setTimeout(() => { this.pwSaved.set(false); this.changingPw.set(false); }, 1600);
        this.pwForm = { currentPassword: '', newPassword: '', confirmNewPassword: '' };
      },
      error: (e: any) => {
        this.pwSaving.set(false);
        this.pwErr.set(e?.error?.message ?? 'Password change failed');
      }
    });
  }

  logout(): void { this.auth.logout(); }
}
