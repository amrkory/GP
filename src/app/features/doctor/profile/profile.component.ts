/**
 * Doctor Profile Component
 * GET  /api/Profile/doctorData   → load
 * PUT  /api/Profile/doctorNurse  → update
 * PUT  /api/Profile/profile-picture → photo
 * POST /api/Auth/change/password
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { AuthService }    from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">

  <div class="pg-hdr">
    <div>
      <h1>My Profile</h1>
      <p class="sub">Manage your professional information</p>
    </div>
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
    <div class="profile-grid">

      <!-- LEFT -->
      <div class="col-left">
        <div class="av-card">
          <div class="av-wrap">
            <div class="av-circle" *ngIf="!avatarUrl()" [style.background]="'#2D4A8A'">{{ initials() }}</div>
            <img *ngIf="avatarUrl()" [src]="avatarUrl()" class="av-img" alt="profile"
                 crossOrigin="anonymous" referrerpolicy="no-referrer" (error)="avatarUrl.set('')"/>
            <label class="cam-btn" title="Change photo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <input type="file" accept="image/*" (change)="onPhoto($event)" hidden/>
            </label>
            <div class="uploading-ring" *ngIf="uploading()"></div>
          </div>
          <div class="av-name">Dr. {{ firstName }} {{ lastName }}</div>
          <div class="av-role" *ngIf="specialization">{{ specialization }}</div>
          <div class="av-email">{{ email }}</div>
          <div class="av-chips">
            <span class="chip-exp" *ngIf="experienceYears">{{ experienceYears }} yrs exp</span>
          </div>
        </div>

        <!-- Security -->
        <div class="side-card">
          <div class="card-st">Security</div>
          <div class="pw-row" *ngIf="!changingPw()">
            <div class="pw-l">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Password<span class="dots">••••••••</span>
            </div>
            <button class="btn-chpw" (click)="changingPw.set(true)">Change</button>
          </div>
          <ng-container *ngIf="changingPw()">
            <div class="f"><label>Current Password</label><input [(ngModel)]="pw.current" type="password" class="inp"/></div>
            <div class="f"><label>New Password</label><input [(ngModel)]="pw.new" type="password" class="inp"/></div>
            <div class="f"><label>Confirm</label><input [(ngModel)]="pw.confirm" type="password" class="inp"/></div>
            <div class="err-box" *ngIf="pwErr()">{{ pwErr() }}</div>
            <div class="ok-box" *ngIf="pwOk()">Password changed!</div>
            <div class="btns">
              <button class="btn-cancel" (click)="changingPw.set(false)">Cancel</button>
              <button class="btn-save" (click)="changePw()" [disabled]="pwSaving()">
                <span class="ring" *ngIf="pwSaving()"></span>{{ pwSaving() ? 'Saving…' : 'Change' }}
              </button>
            </div>
          </ng-container>
        </div>

        <button class="btn-logout" (click)="logout()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log Out
        </button>
      </div>

      <!-- RIGHT -->
      <div class="col-right">

        <!-- VIEW -->
        <ng-container *ngIf="!editing()">
          <div class="info-card">
            <div class="card-st">Personal Information</div>
            <div class="ir"><div class="il">Full Name</div><div class="iv">Dr. {{ firstName }} {{ lastName }}</div></div>
            <div class="ir"><div class="il">Email</div><div class="iv">{{ email || '—' }}</div></div>
            <div class="ir"><div class="il">Phone</div><div class="iv">{{ phoneNumber || '—' }}</div></div>
          </div>
          <div class="info-card">
            <div class="card-st">Professional Information</div>
            <div class="ir"><div class="il">Specialty</div><div class="iv">{{ specialization || '—' }}</div></div>
            <div class="ir"><div class="il">Workplace</div><div class="iv">{{ workPlace || '—' }}</div></div>
            <div class="ir"><div class="il">License</div><div class="iv">{{ licenseNumber || '—' }}</div></div>
            <div class="ir"><div class="il">Experience</div><div class="iv">{{ experienceYears ? experienceYears + ' years' : '—' }}</div></div>
            <div class="ir" *ngIf="education"><div class="il">Education</div><div class="iv">{{ education }}</div></div>
            <div class="ir" *ngIf="certifications"><div class="il">Certifications</div><div class="iv">{{ certifications }}</div></div>
          </div>
        </ng-container>

        <!-- EDIT — only fields allowed by PUT /api/Profile/doctorNurse -->
        <div class="info-card" *ngIf="editing()">
          <div class="card-st">Edit Profile</div>
          <p class="note">Specialty, workplace, and license are set during registration and cannot be changed here.</p>
          <div class="f2">
            <div class="f"><label>First Name</label><input [(ngModel)]="form.firstName" class="inp" placeholder="First name"/></div>
            <div class="f"><label>Last Name</label><input [(ngModel)]="form.lastName" class="inp" placeholder="Last name"/></div>
          </div>
          <div class="f"><label>Email</label><input [(ngModel)]="form.email" type="email" class="inp"/></div>
          <div class="f"><label>Education</label><input [(ngModel)]="form.education" class="inp" placeholder="e.g. MD, Cairo University"/></div>
          <div class="f"><label>Certifications</label><input [(ngModel)]="form.certifications" class="inp" placeholder="e.g. Board Certified"/></div>
          <div class="err-box" *ngIf="saveErr()">{{ saveErr() }}</div>
          <div class="ok-box" *ngIf="saved()">Profile updated!</div>
          <div class="btns">
            <button class="btn-cancel" (click)="editing.set(false)">Cancel</button>
            <button class="btn-save" (click)="save()" [disabled]="saving()">
              <span class="ring" *ngIf="saving()"></span>{{ saving() ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </ng-container>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{width:100%;font-family:'Cairo','Segoe UI',sans-serif;}
    @keyframes sp{to{transform:rotate(360deg);}}
    .pg-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:22px;flex-wrap:wrap;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#6B7280;margin-top:3px;}
    .btn-edit{display:flex;align-items:center;gap:7px;padding:10px 18px;background:#2D4A8A;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;}
    .btn-edit:hover{background:#1E3A6E;}
    .loading{display:flex;justify-content:center;padding:48px;}
    .spin{width:26px;height:26px;border:3px solid #f0f0f0;border-top-color:#2D4A8A;border-radius:50%;animation:sp .7s linear infinite;}
    .profile-grid{display:grid;grid-template-columns:280px 1fr;gap:16px;align-items:start;}
    @media(max-width:1024px){.profile-grid{grid-template-columns:1fr;}}
    .col-left{display:flex;flex-direction:column;gap:12px;}
    .col-right{display:flex;flex-direction:column;gap:12px;}
    .av-card{background:#fff;border-radius:20px;padding:24px 16px;border:1px solid #F0F2F5;box-shadow:0 1px 6px rgba(0,0,0,.06);display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;}
    .av-wrap{position:relative;margin-bottom:6px;}
    .av-circle{width:84px;height:84px;border-radius:50%;color:#fff;font-size:28px;font-weight:700;display:flex;align-items:center;justify-content:center;}
    .av-img{width:84px;height:84px;border-radius:50%;object-fit:cover;border:3px solid #F0F2F5;}
    .cam-btn{position:absolute;bottom:2px;right:2px;width:28px;height:28px;background:#111;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;border:2px solid #fff;}
    .uploading-ring{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:#2D4A8A;animation:sp .7s linear infinite;}
    .av-name{font-size:17px;font-weight:800;color:#111;}
    .av-role{font-size:12px;color:#2D4A8A;font-weight:700;background:#EEF2FF;padding:3px 10px;border-radius:20px;}
    .av-email{font-size:12px;color:#6B7280;word-break:break-all;}
    .av-chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;}
    .chip-exp{background:#F0F2F5;color:#374151;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;}
    .side-card,.info-card{background:#fff;border-radius:16px;padding:18px 20px;border:1px solid #F0F2F5;box-shadow:0 1px 6px rgba(0,0,0,.05);}
    .card-st{font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.7px;margin-bottom:12px;}
    .ir{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #F8F9FC;}
    .ir:last-child{border-bottom:none;padding-bottom:0;}
    .il{font-size:13px;color:#6B7280;min-width:120px;flex-shrink:0;}
    .iv{font-size:13px;font-weight:600;color:#111;text-align:right;word-break:break-word;}
    .pw-row{display:flex;align-items:center;justify-content:space-between;gap:8px;}
    .pw-l{display:flex;align-items:center;gap:7px;font-size:13px;color:#374151;font-weight:600;}
    .dots{color:#9CA3AF;letter-spacing:2px;margin-left:4px;font-size:16px;}
    .btn-chpw{padding:5px 12px;background:#F4F6FA;border:1.5px solid #E8ECF0;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
    .f{margin-bottom:12px;}
    .f label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;}
    .f2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    @media(max-width:500px){.f2{grid-template-columns:1fr;}}
    .note{font-size:12px;color:#9CA3AF;margin-bottom:14px;line-height:1.5;background:#F8F9FC;padding:8px 12px;border-radius:8px;}
    .inp{width:100%;padding:10px 13px;border:1.5px solid #E8ECF0;border-radius:10px;font-size:14px;font-family:inherit;color:#111;outline:none;transition:border-color .2s;appearance:none;background:#fff;}
    .inp:focus{border-color:#2D4A8A;box-shadow:0 0 0 3px rgba(45,74,138,.08);}
    .btns{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;}
    .btn-cancel{padding:9px 18px;background:#F4F6FA;color:#374151;border:1.5px solid #E8ECF0;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}
    .btn-save{padding:9px 22px;background:#2D4A8A;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;}
    .btn-save:disabled{opacity:.5;}
    .btn-logout{display:flex;align-items:center;justify-content:center;gap:8px;padding:11px;background:#fff;color:#D84040;border:1.5px solid #FECACA;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;}
    .btn-logout:hover{background:#FEF2F2;}
    .ring{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;}
    .err-box{background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;border-radius:10px;padding:10px 14px;font-size:13px;margin-top:10px;}
    .ok-box{background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46;border-radius:10px;padding:10px 14px;font-size:13px;margin-top:10px;}
  `]
})
export class DoctorProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private svc  = inject(ProfileService);

  loading    = signal(true);
  editing    = signal(false);
  saving     = signal(false);
  saved      = signal(false);
  saveErr    = signal('');
  uploading  = signal(false);
  changingPw = signal(false);
  pwSaving   = signal(false);
  pwErr      = signal('');
  pwOk       = signal(false);
  avatarUrl  = signal('');

  firstName        = '';
  lastName         = '';
  email            = '';
  phoneNumber      = '';
  specialization   = '';
  workPlace        = '';
  licenseNumber    = '';
  experienceYears  = 0;
  education        = '';
  certifications   = '';

  form: any = {};
  pw = { current: '', new: '', confirm: '' };

  initials(): string {
    return ((this.firstName[0] ?? '') + (this.lastName[0] ?? '')).toUpperCase() || 'DR';
  }

  ngOnInit(): void {
    const jwt = this.auth.currentUser() as any ?? {};
    this.firstName = jwt.given_name  || '';
    this.lastName  = jwt.family_name || '';
    this.email     = jwt['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? jwt.email ?? '';

    // GET /api/Profile/doctorData
    this.svc.getDoctorData().subscribe({
      next: (res: any) => {
        const d = res?.data ?? res;
        if (!d) { this.loading.set(false); return; }
        this.firstName       = d.firstName       ?? this.firstName;
        this.lastName        = d.lastName        ?? this.lastName;
        this.email           = d.email           ?? this.email;
        this.phoneNumber     = d.phoneNumber     ?? '';
        this.specialization  = d.specialization  ?? d.specialtyName ?? '';
        this.workPlace       = d.workPlace       ?? d.clinicName    ?? '';
        this.licenseNumber   = d.licenseNumber   ?? '';
        this.experienceYears = d.experienceYears ?? 0;
        this.education       = d.education       ?? '';
        this.certifications  = d.certifications  ?? '';
        const pic = d.profilePictureUrl ?? d.avatarUrl ?? '';
        if (pic) this.avatarUrl.set(pic);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  startEdit(): void {
    this.form = {
      firstName:      this.firstName,
      lastName:       this.lastName,
      email:          this.email,
      education:      this.education,
      certifications: this.certifications,
    };
    this.editing.set(true);
    this.saved.set(false);
    this.saveErr.set('');
  }

  save(): void {
    this.saving.set(true);
    this.saveErr.set('');
    // PUT /api/Profile/doctorNurse
    const body = {
      firstName:         this.form.firstName      || undefined,
      lastName:          this.form.lastName       || undefined,
      email:             this.form.email          || undefined,
      profilePictureUrl: this.avatarUrl()         || undefined,
      education:         this.form.education      || undefined,
      certifications:    this.form.certifications || undefined,
    };
    this.svc.updateDoctorNurse(body).subscribe({
      next: () => {
        this.firstName      = this.form.firstName      || this.firstName;
        this.lastName       = this.form.lastName       || this.lastName;
        this.email          = this.form.email          || this.email;
        this.education      = this.form.education      || this.education;
        this.certifications = this.form.certifications || this.certifications;
        this.saving.set(false); this.saved.set(true);
        setTimeout(() => { this.saved.set(false); this.editing.set(false); }, 1600);
      },
      error: (e: any) => {
        this.saving.set(false);
        this.saveErr.set(e?.error?.message ?? e?.error?.title ?? 'Save failed.');
      }
    });
  }

  onPhoto(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.svc.uploadPicture(file).subscribe({
      next: (res: any) => {
        const url = res?.profilePictureUrl ?? res?.data?.profilePictureUrl
                 ?? res?.data?.url ?? (typeof res?.data === 'string' ? res.data : '');
        if (url) {
          this.avatarUrl.set(url);
          this.svc.updateDoctorNurse({ profilePictureUrl: url }).subscribe();
        }
        this.uploading.set(false);
      },
      error: () => this.uploading.set(false)
    });
  }

  changePw(): void {
    if (this.pw.new !== this.pw.confirm) { this.pwErr.set('Passwords do not match'); return; }
    this.pwSaving.set(true); this.pwErr.set('');
    this.auth.changePassword({ currentPassword: this.pw.current, newPassword: this.pw.new, confirmNewPassword: this.pw.confirm }).subscribe({
      next: () => { this.pwSaving.set(false); this.pwOk.set(true); setTimeout(() => { this.pwOk.set(false); this.changingPw.set(false); }, 1600); this.pw = { current: '', new: '', confirm: '' }; },
      error: (e: any) => { this.pwSaving.set(false); this.pwErr.set(e?.error?.message ?? 'Failed'); }
    });
  }

  logout(): void { this.auth.logout(); }
}
