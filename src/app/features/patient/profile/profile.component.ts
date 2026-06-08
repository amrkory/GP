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

  <!-- Page header -->
  <div class="pg-hdr">
    <div>
      <h1>My Profile</h1>
      <p class="sub">Manage your personal and professional info</p>
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

    <!-- ── Two-column grid ── -->
    <div class="profile-grid">

      <!-- LEFT column: avatar + security + logout -->
      <div class="col-left">

        <!-- Avatar card -->
        <div class="av-card">
          <div class="av-wrap">
            <div class="av-circle" *ngIf="!avatarUrl()">{{ initials() }}</div>
            <img *ngIf="avatarUrl()" [src]="avatarUrl()" crossOrigin="anonymous"
                 referrerpolicy="no-referrer" class="av-img" alt="profile" (error)="onImgError()" />
            <label class="cam-btn" title="Change photo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <input type="file" accept="image/*" (change)="onPhoto($event)" hidden />
            </label>
            <div class="uploading-ring" *ngIf="uploading()"></div>
          </div>
          <div class="av-name">{{ firstName }} {{ lastName }}</div>
          <div class="av-spec" *ngIf="specialization">{{ specialization }}</div>
          <div class="av-email">{{ email }}</div>
          <div class="av-meta" *ngIf="experienceYears">
            <span class="meta-chip">{{ experienceYears }} yrs exp</span>
          </div>
        </div>

        <!-- Security card -->
        <div class="side-card">
          <div class="st">Security</div>
          <div class="pw-row" *ngIf="!changingPw()">
            <div class="pw-l">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Password</span><span class="dots">••••••••</span>
            </div>
            <button class="btn-chpw" (click)="changingPw.set(true)">Change</button>
          </div>
          <div *ngIf="changingPw()">
            <div class="f"><label>Current Password</label><input [(ngModel)]="pw.current" type="password" class="inp" /></div>
            <div class="f"><label>New Password</label><input [(ngModel)]="pw.new" type="password" class="inp" /></div>
            <div class="f"><label>Confirm</label><input [(ngModel)]="pw.confirm" type="password" class="inp" /></div>
            <div class="err-box" *ngIf="pwErr()">{{ pwErr() }}</div>
            <div class="ok-box" *ngIf="pwOk()">Password changed!</div>
            <div class="btns">
              <button class="btn-cancel" (click)="changingPw.set(false)">Cancel</button>
              <button class="btn-save" (click)="changePw()" [disabled]="pwSaving()">
                <span class="ring" *ngIf="pwSaving()"></span>{{ pwSaving() ? 'Saving…' : 'Change Password' }}
              </button>
            </div>
          </div>
        </div>

        <button class="btn-logout" (click)="logout()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log Out
        </button>
      </div>

      <!-- RIGHT column: info / edit -->
      <div class="col-right">

        <!-- View mode -->
        <div class="info-card" *ngIf="!editing()">
          <div class="st">Personal Information</div>
          <div class="ir">
            <div class="il"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Full Name</div>
            <div class="iv">{{ firstName }} {{ lastName }}</div>
          </div>
          <div class="ir">
            <div class="il"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Email</div>
            <div class="iv">{{ email || '—' }}</div>
          </div>
          <div class="ir">
            <div class="il"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Phone</div>
            <div class="iv">{{ phoneNumber || '—' }}</div>
          </div>
        </div>

        <div class="info-card" *ngIf="!editing()">
          <div class="st">Professional Information</div>
          <div class="ir">
            <div class="il"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Specialty</div>
            <div class="iv">{{ specialization || '—' }}</div>
          </div>
          <div class="ir">
            <div class="il"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> Workplace</div>
            <div class="iv">{{ workPlace || '—' }}</div>
          </div>
          <div class="ir" *ngIf="licenseNumber">
            <div class="il"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> License</div>
            <div class="iv">{{ licenseNumber }}</div>
          </div>
          <div class="ir" *ngIf="experienceYears">
            <div class="il"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Experience</div>
            <div class="iv">{{ experienceYears }} years</div>
          </div>
          <div class="ir" *ngIf="education">
            <div class="il"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> Education</div>
            <div class="iv">{{ education }}</div>
          </div>
          <div class="ir" *ngIf="certifications">
            <div class="il"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg> Certifications</div>
            <div class="iv">{{ certifications }}</div>
          </div>
        </div>

        <!-- Edit mode -->
        <div class="info-card" *ngIf="editing()">
          <div class="st">Edit Profile</div>
          <div class="f2">
            <div class="f"><label>First Name</label><input [(ngModel)]="form.firstName" class="inp" placeholder="First name" /></div>
            <div class="f"><label>Last Name</label><input [(ngModel)]="form.lastName" class="inp" placeholder="Last name" /></div>
          </div>
          <div class="f"><label>Email</label><input [(ngModel)]="form.email" type="email" class="inp" /></div>
          <div class="f"><label>Education</label><input [(ngModel)]="form.education" class="inp" placeholder="e.g. MD, Cairo University" /></div>
          <div class="f"><label>Certifications</label><input [(ngModel)]="form.certifications" class="inp" placeholder="e.g. Board Certified" /></div>
          <p class="note">Phone, specialty and clinic are set during registration.</p>
          <div class="err-box" *ngIf="saveErr()">{{ saveErr() }}</div>
          <div class="ok-box" *ngIf="saved()">Profile updated successfully!</div>
          <div class="btns">
            <button class="btn-cancel" (click)="editing.set(false)">Cancel</button>
            <button class="btn-save" (click)="save()" [disabled]="saving()">
              <span class="ring" *ngIf="saving()"></span>{{ saving() ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>

      </div><!-- /col-right -->
    </div><!-- /profile-grid -->

  </ng-container>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .page{width:100%;font-family:'Cairo','Segoe UI',sans-serif;}
    @keyframes sp{to{transform:rotate(360deg);}}
    @keyframes spin{to{transform:rotate(360deg);}}

    /* Header */
    .pg-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:22px;flex-wrap:wrap;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#6B7280;margin-top:3px;}
    .btn-edit{display:flex;align-items:center;gap:7px;padding:10px 18px;background:#D84040;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;}
    .btn-edit:hover{background:#b93030;}

    /* Loading */
    .loading{display:flex;justify-content:center;padding:48px;}
    .spin{width:26px;height:26px;border:3px solid #f0f0f0;border-top-color:#D84040;border-radius:50%;animation:sp .7s linear infinite;}

    /* Two-column grid */
    .profile-grid{display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start;}
    @media(max-width:1024px){.profile-grid{grid-template-columns:1fr;}}

    /* Left column */
    .col-left{display:flex;flex-direction:column;gap:14px;}
    .col-right{display:flex;flex-direction:column;gap:14px;}

    /* Avatar card */
    .av-card{background:#fff;border-radius:20px;padding:28px 20px;border:1px solid #F0F2F5;box-shadow:0 1px 6px rgba(0,0,0,.06);display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;}
    .av-wrap{position:relative;margin-bottom:4px;}
    .av-circle{width:90px;height:90px;border-radius:50%;background:#D84040;color:#fff;font-size:30px;font-weight:700;display:flex;align-items:center;justify-content:center;}
    .av-img{width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #F0F2F5;}
    .cam-btn{position:absolute;bottom:2px;right:2px;width:28px;height:28px;background:#111;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;border:2px solid #fff;}
    .uploading-ring{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:#D84040;animation:sp .7s linear infinite;}
    .av-name{font-size:18px;font-weight:800;color:#111;}
    .av-spec{font-size:13px;color:#D84040;font-weight:600;}
    .av-email{font-size:12px;color:#6B7280;word-break:break-all;}
    .av-meta{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;}
    .meta-chip{background:#FEF2F2;color:#D84040;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;}

    /* Side cards */
    .side-card{background:#fff;border-radius:18px;padding:18px 20px;border:1px solid #F0F2F5;box-shadow:0 1px 6px rgba(0,0,0,.06);}
    .info-card{background:#fff;border-radius:18px;padding:20px;border:1px solid #F0F2F5;box-shadow:0 1px 6px rgba(0,0,0,.06);}

    /* Section title */
    .st{font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.7px;margin-bottom:14px;}

    /* Info rows */
    .ir{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid #F8F9FC;}
    .ir:last-child{border-bottom:none;}
    .il{display:flex;align-items:center;gap:7px;font-size:13px;color:#6B7280;min-width:130px;flex-shrink:0;}
    .iv{font-size:14px;font-weight:600;color:#111;text-align:right;word-break:break-word;}

    /* Password row */
    .pw-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}
    .pw-l{display:flex;align-items:center;gap:8px;font-size:13px;color:#374151;font-weight:600;}
    .dots{color:#9CA3AF;letter-spacing:2px;font-size:16px;margin-left:4px;}
    .btn-chpw{padding:6px 14px;background:#F4F6FA;color:#374151;border:1.5px solid #E8ECF0;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
    .btn-chpw:hover{background:#E8ECF0;}

    /* Form fields */
    .f{margin-bottom:12px;}
    .f label{display:block;font-size:13px;font-weight:600;color:#111;margin-bottom:6px;}
    .f2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    @media(max-width:480px){.f2{grid-template-columns:1fr;}}
    .inp{width:100%;padding:10px 13px;border:1.5px solid #E8ECF0;border-radius:10px;font-size:14px;font-family:inherit;color:#111;outline:none;transition:border-color .2s;}
    .inp:focus{border-color:#D84040;box-shadow:0 0 0 3px rgba(216,64,64,.08);}
    .note{font-size:12px;color:#9CA3AF;margin-bottom:12px;line-height:1.5;}

    /* Buttons */
    .btns{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;}
    .btn-cancel{padding:9px 18px;background:#F4F6FA;color:#374151;border:1.5px solid #E8ECF0;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}
    .btn-save{padding:9px 22px;background:#D84040;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;}
    .btn-save:disabled{opacity:.55;cursor:not-allowed;}
    .btn-logout{display:flex;align-items:center;justify-content:center;gap:8px;padding:11px;background:#fff;color:#D84040;border:1.5px solid #FECACA;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;transition:background .12s;}
    .btn-logout:hover{background:#FEF2F2;}
    .ring{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;}

    /* Alerts */
    .err-box{background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;border-radius:10px;padding:10px 14px;font-size:13px;margin-bottom:10px;}
    .ok-box{background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46;border-radius:10px;padding:10px 14px;font-size:13px;margin-bottom:10px;}
    @media(max-width:768px){.page{padding:16px;}}
    .pg-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
    h1{font-size:22px;font-weight:800;color:#111;}
    .btn-edit{display:flex;align-items:center;gap:7px;padding:9px 16px;background:#2D4A8A;color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
    .loading{display:flex;justify-content:center;padding:48px;}
    .spin{width:26px;height:26px;border:3px solid #f0f0f0;border-top-color:#2D4A8A;border-radius:50%;animation:sp .7s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    .av-card{display:flex;align-items:center;gap:18px;background:#fff;border-radius:18px;padding:20px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .av-wrap{position:relative;flex-shrink:0;}
    .av-circle{width:80px;height:80px;border-radius:50%;background:#2D4A8A;color:#fff;font-size:26px;font-weight:700;display:flex;align-items:center;justify-content:center;}
    .av-img{width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #F0F2F5;}
    .cam-btn{position:absolute;bottom:0;right:0;width:28px;height:28px;background:#1B2B4B;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;border:2px solid #fff;}
    .uploading-ring{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:#2D4A8A;animation:sp .7s linear infinite;}
    .av-name{font-size:18px;font-weight:800;color:#111;margin-bottom:3px;}
    .av-spec{font-size:13px;color:#2D4A8A;font-weight:600;margin-bottom:3px;}
    .av-email{font-size:13px;color:#6B7280;}
    .info-card,.edit-card,.section-card{background:#fff;border-radius:18px;padding:20px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .st{font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.7px;margin-bottom:12px;}
    .ir{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #F8F9FC;}
    .ir:last-child{border-bottom:none;}
    .il{font-size:13px;color:#6B7280;min-width:120px;flex-shrink:0;}
    .iv{font-size:14px;font-weight:600;color:#111;text-align:right;word-break:break-word;}
    .f2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    @media(max-width:480px){.f2{grid-template-columns:1fr;}}
    .f{margin-bottom:12px;}
    .f label{display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:5px;}
    .inp{width:100%;padding:10px 13px;border:1.5px solid #E8ECF0;border-radius:11px;font-size:14px;font-family:inherit;outline:none;color:#111;}
    .inp:focus{border-color:#2D4A8A;box-shadow:0 0 0 3px rgba(45,74,138,.08);}
    .note{font-size:12px;color:#9CA3AF;margin-bottom:4px;}
    .btns{display:flex;gap:10px;margin-top:16px;}
    .btn-cancel{flex:1;padding:12px;border:1.5px solid #E8ECF0;background:#fff;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;color:#555;font-family:inherit;}
    .btn-save{flex:2;padding:12px;background:#2D4A8A;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;}
    .btn-save:disabled{opacity:.5;cursor:not-allowed;}
    .ring{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite;}
    .err-box{background:#FEF2F2;color:#D84040;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:13px;border:1px solid #fecaca;}
    .ok-box{background:#ECFDF5;color:#0F6E56;border-radius:10px;padding:10px 12px;margin-top:10px;font-size:13px;font-weight:600;}
    .pw-row{display:flex;align-items:center;justify-content:space-between;}
    .pw-l{display:flex;align-items:center;gap:8px;font-size:14px;color:#374151;font-weight:600;}
    .dots{color:#9CA3AF;letter-spacing:2px;}
    .btn-chpw{padding:7px 14px;border:1.5px solid #E8ECF0;background:#fff;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
    .btn-logout{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;background:#FEF2F2;color:#D84040;border:1.5px solid #fecaca;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
  `]
})
export class PatientProfileComponent implements OnInit {
  private svc  = inject(ProfileService);
  private auth = inject(AuthService);

  loading    = signal(true);
  editing    = signal(false);
  saving     = signal(false);
  saved      = signal(false);
  saveErr    = signal('');
  uploading  = signal(false);
  changingPw = signal(false);
  pwSaving   = signal(false);
  pwOk       = signal(false);
  pwErr      = signal('');
  avatarUrl  = signal('');

  // ── Fields from API /doctorData (exact field names from console log) ─
  id              = '';
  specialization  = '';   // API: specialization
  licenseNumber   = '';
  phoneNumber     = '';   // API: phoneNumber
  workPlace       = '';   // API: workPlace
  experienceYears = 0;    // API: experienceYears
  education       = '';
  certifications  = '';

  // ── Fields from JWT (API doesn't return these) ─────────────────────
  firstName = '';
  lastName  = '';
  email     = '';

  form: any = {};
  pw = { current: '', new: '', confirm: '' };

  initials(): string {
    return ((this.firstName[0]??'') + (this.lastName[0]??'')).toUpperCase() || 'DR';
  }

  ngOnInit(): void {
    // Step 1: Load name/email from JWT immediately (no wait)
    this.loadFromJwt();
    // Step 2: Load professional data from API
    this.loadFromApi();
  }

  private loadFromJwt(): void {
    const jwt = this.auth.currentUser() as any ?? {};
    const fullName  = jwt['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? '';
    const parts     = fullName.trim().split(' ');
    this.firstName  = jwt.given_name  || jwt.firstName  || parts[0]                    || '';
    this.lastName   = jwt.family_name || jwt.lastName   || parts.slice(1).join(' ')    || '';
    this.email      = jwt['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
                   ?? jwt.email ?? jwt.Email ?? '';
    console.log('[DoctorProfile] JWT name:', this.firstName, this.lastName, '| email:', this.email);
  }

  private loadFromApi(): void {
    this.svc.getDoctorData().subscribe({
      next: (res: any) => {
        // API returns object directly OR wrapped in .data
        const raw = (res?.data && typeof res.data === 'object') ? res.data : res;
        console.log('[DoctorProfile] API fields:', Object.keys(raw));

        // Map exact field names from API response
        this.id              = raw.id              ?? '';
        this.specialization  = raw.specialization  ?? raw.specialtyName ?? '';
        this.licenseNumber   = raw.licenseNumber   ?? '';
        this.phoneNumber     = raw.phoneNumber     ?? raw.phone ?? '';
        this.workPlace       = raw.workPlace       ?? raw.clinicName ?? '';
        this.experienceYears = raw.experienceYears ?? raw.yearsExperience ?? 0;
        this.education       = raw.education       ?? '';
        this.certifications  = raw.certifications  ?? '';

        // Photo from API (if present)
        const pic = raw.profilePictureUrl ?? raw.avatarUrl ?? '';
        if (pic) this.avatarUrl.set(pic);

        // Name from API overrides JWT if present
        if (raw.firstName) this.firstName = raw.firstName;
        if (raw.lastName)  this.lastName  = raw.lastName;
        if (raw.email)     this.email     = raw.email;

        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  startEdit(): void {
    this.form = {
      firstName:      this.firstName      || '',
      lastName:       this.lastName       || '',
      email:          this.email          || '',
      education:      this.education      || '',
      certifications: this.certifications || '',
    };
    this.editing.set(true);
    this.saved.set(false);
    this.saveErr.set('');
  }

  save(): void {
    this.saving.set(true);
    this.saveErr.set('');

    // Exact Swagger body for PUT /api/Profile/doctorNurse
    const body = {
      firstName:         this.form.firstName         || undefined,
      lastName:          this.form.lastName          || undefined,
      email:             this.form.email             || undefined,
      profilePictureUrl: this.avatarUrl()            || undefined,
      education:         this.form.education         || undefined,
      certifications:    this.form.certifications    || undefined,
    };

    this.svc.updateDoctorNurse(body).subscribe({
      next: () => {
        // Update local fields immediately — NO reload (API won't return them back)
        this.firstName      = this.form.firstName      || this.firstName;
        this.lastName       = this.form.lastName       || this.lastName;
        this.email          = this.form.email          || this.email;
        this.education      = this.form.education      || this.education;
        this.certifications = this.form.certifications || this.certifications;
        // avatarUrl stays as-is (already set from upload)
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => { this.saved.set(false); this.editing.set(false); }, 1600);
      },
      error: (e: any) => {
        this.saving.set(false);
        this.saveErr.set(e?.error?.message ?? e?.error?.title ?? 'Save failed. Please try again.');
      }
    });
  }

  onPhoto(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);

    this.svc.uploadPicture(file).subscribe({
      next: (res: any) => {
        // From console log: response is {profilePictureUrl: 'https://...'}
        const url = res?.profilePictureUrl    // direct field (confirmed from log)
                 ?? res?.data?.profilePictureUrl
                 ?? res?.data?.url
                 ?? (typeof res?.data === 'string' ? res.data : '');

        if (url) {
          this.avatarUrl.set(url);
          console.log('[DoctorProfile] Photo set:', url);

          // Also save to profile immediately so it persists
          this.svc.updateDoctorNurse({
            firstName:         this.firstName         || undefined,
            lastName:          this.lastName          || undefined,
            email:             this.email             || undefined,
            profilePictureUrl: url,
          }).subscribe({
            next: () => console.log('[DoctorProfile] Photo URL saved to profile'),
            error: (e: any) => console.error('[DoctorProfile] Save photo URL failed:', e)
          });
        }
        this.uploading.set(false);
      },
      error: () => this.uploading.set(false)
    });
  }

  onImgError(): void {
    // If browser blocks image (tracking prevention), clear URL to show initials
    console.warn('[DoctorProfile] Image blocked by browser security — showing initials');
    this.avatarUrl.set('');
  }

  changePw(): void {
    if (this.pw.new !== this.pw.confirm) { this.pwErr.set('Passwords do not match'); return; }
    this.pwSaving.set(true);
    this.pwErr.set('');
    this.auth.changePassword({
      currentPassword: this.pw.current,
      newPassword: this.pw.new,
      confirmNewPassword: this.pw.confirm,
    }).subscribe({
      next: () => {
        this.pwSaving.set(false); this.pwOk.set(true);
        setTimeout(() => { this.pwOk.set(false); this.changingPw.set(false); }, 1600);
        this.pw = { current: '', new: '', confirm: '' };
      },
      error: (e: any) => { this.pwSaving.set(false); this.pwErr.set(e?.error?.message ?? 'Failed'); }
    });
  }

  logout(): void { this.auth.logout(); }
}
